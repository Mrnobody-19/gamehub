// app/chat/[id].js
import { 
  StyleSheet, 
  Pressable, 
  Text, 
  View, 
  FlatList, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { theme } from "../../constants/theme";
import { hp, wp } from "../../helpers/common";
import Avatar from "../../components/Avater";
import ScreenWrapper from "../../components/ScreenWrapper";

const ChatScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Format time function
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Fetch recipient details
  const fetchRecipient = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, image, bio")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      setRecipient(data);
    } catch (error) {
      console.error("Error fetching recipient:", error.message);
    }
  };

  // Fetch messages between current user and recipient
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${id}),and(sender_id.eq.${id},recipient_id.eq.${currentUser.id})`)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      setMessages(data || []);
      
      // Mark messages as read
      await markMessagesAsRead();
    } catch (error) {
      console.error("Error fetching messages:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", id)
        .eq("recipient_id", currentUser.id)
        .is("read_at", null);
    } catch (error) {
      console.error("Error marking messages as read:", error.message);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    
    try {
      setSending(true);
      const { error } = await supabase
        .from("messages")
        .insert({
          content: newMessage.trim(),
          sender_id: currentUser.id,
          recipient_id: id
        });
      
      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error.message);
    } finally {
      setSending(false);
    }
  };

  // Set up real-time subscription for new messages
  useEffect(() => {
    fetchRecipient();
    fetchMessages();

    const channel = supabase
      .channel(`chat:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(and(sender_id.eq.${currentUser.id},recipient_id.eq.${id}),and(sender_id.eq.${id},recipient_id.eq.${currentUser.id}))`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        
        // If message is from recipient, mark as read
        if (payload.new.sender_id === id) {
          markMessagesAsRead();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, currentUser]);

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.sender_id === currentUser.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.timeText,
            isCurrentUser ? styles.currentUserTime : styles.otherUserTime
          ]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper bg="black">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg="black">
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <View style={styles.placeholderIcon} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Avatar 
            uri={recipient?.image} 
            size={hp(4)} 
            rounded={hp(4)/2} 
          />
          <Text style={styles.headerName}>{recipient?.name || "Unknown User"}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        inverted={false}
      />

      {/* Message Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <Pressable 
          onPress={sendMessage} 
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          disabled={!newMessage.trim() || sending}
        >
          <View style={styles.placeholderIconSmall} />
        </Pressable>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  backButton: {
    padding: wp(1),
  },
  placeholderIcon: {
    width: hp(3),
    height: hp(3),
    backgroundColor: "#666",
    borderRadius: 4,
  },
  placeholderIconSmall: {
    width: hp(2.5),
    height: hp(2.5),
    backgroundColor: "white",
    borderRadius: 4,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: wp(3),
  },
  headerName: {
    fontSize: hp(2),
    fontWeight: "bold",
    color: "white",
    marginLeft: wp(3),
  },
  headerRight: {
    width: hp(3),
  },
  messagesContainer: {
    padding: wp(4),
    paddingBottom: hp(2),
  },
  messageContainer: {
    marginBottom: hp(1.5),
  },
  currentUserMessage: {
    alignItems: "flex-end",
  },
  otherUserMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: wp(3),
    borderRadius: hp(2),
    marginBottom: hp(0.5),
  },
  currentUserBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: hp(0.5),
  },
  otherUserBubble: {
    backgroundColor: "#222",
    borderBottomLeftRadius: hp(0.5),
  },
  messageText: {
    fontSize: hp(1.8),
    marginBottom: hp(0.5),
  },
  currentUserText: {
    color: "white",
  },
  otherUserText: {
    color: "white",
  },
  timeText: {
    fontSize: hp(1.4),
    opacity: 0.7,
  },
  currentUserTime: {
    color: "white",
    textAlign: "right",
  },
  otherUserTime: {
    color: "#aaa",
    textAlign: "left",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp(3),
    borderTopWidth: 1,
    borderTopColor: "#222",
    backgroundColor: "black",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#222",
    color: "white",
    borderRadius: hp(2),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    marginRight: wp(2),
    maxHeight: hp(12),
    fontSize: hp(1.8),
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#333",
  },
});

export default ChatScreen;