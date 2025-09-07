import { StyleSheet, Pressable, Text, View, FlatList, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { theme } from "../../constants/theme";
import Icon from "../../assets/icons";
import { hp, wp } from "../../helpers/common";
import Avatar from "../../components/Avater";

const Chat = () => {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const recipientId = params.id;
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const flatListRef = useRef();

  // Fetch recipient details
  const fetchRecipient = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, image")
        .eq("id", recipientId)
        .single();

      if (error) throw error;
      setRecipient(data);
    } catch (err) {
      console.error("Error fetching recipient:", err.message);
    }
  };

  // Fetch messages between current user and recipient
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUser.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await markMessagesAsRead();
    } catch (err) {
      console.error("Error fetching messages:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", recipientId)
        .eq("recipient_id", currentUser.id)
        .is("read_at", null);

      if (error) throw error;
    } catch (err) {
      console.error("Error marking messages as read:", err.message);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUser.id,
          recipient_id: recipientId,
          content: newMessage.trim(),
        })
        .select();

      if (error) throw error;

      // Add the new message to local state
      setMessages([...messages, data[0]]);
      setNewMessage("");

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error("Error sending message:", err.message);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (recipientId) {
      fetchRecipient();
      fetchMessages();
      
      // Set up real-time subscription for new messages
      const channel = supabase
        .channel('chat_messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUser?.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUser?.id}))`
        }, (payload) => {
          // Add new message to state
          setMessages(prev => [...prev, payload.new]);
          
          // Mark as read if it's a received message
          if (payload.new.sender_id === recipientId) {
            markMessagesAsRead();
          }
          
          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        })
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [recipientId]);

  // Format time for message display
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render each message
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

  return (
    <ScreenWrapper bg="black">
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="chevron-left" size={hp(3)} strokeWidth={2} color="white" />
        </Pressable>
        
        {recipient ? (
          <View style={styles.recipientInfo}>
            <Avatar 
              uri={recipient.image || "https://ui-avatars.com/api/?name=" + (recipient.name || "User")}
              size={hp(4)} 
              rounded={hp(4) / 2} 
            />
            <Text style={styles.recipientName}>{recipient.name || "Unknown User"}</Text>
          </View>
        ) : (
          <Text style={styles.recipientName}>Loading...</Text>
        )}
        
        <Pressable style={styles.moreButton}>
          <Icon name="more-vertical" size={hp(3)} strokeWidth={2} color="white" />
        </Pressable>
      </View>

      {/* Messages List */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: hp(20) }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Message Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? hp(8) : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#aaa"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <Pressable 
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Icon name="send" size={hp(2.5)} strokeWidth={2} color={newMessage.trim() ? theme.colors.primary : "#555"} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
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
  recipientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: wp(3),
  },
  recipientName: {
    fontSize: hp(2),
    color: "white",
    fontWeight: "bold",
    marginLeft: wp(2),
  },
  moreButton: {
    padding: wp(1),
  },
  messagesList: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  messageContainer: {
    marginVertical: hp(0.5),
  },
  currentUserMessage: {
    alignItems: "flex-end",
  },
  otherUserMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
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
    color: "#ccc",
    textAlign: "left",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: "#222",
    backgroundColor: "black",
  },
  input: {
    flex: 1,
    backgroundColor: "#222",
    color: "white",
    borderRadius: hp(2),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontSize: hp(1.8),
    maxHeight: hp(12),
  },
  sendButton: {
    marginLeft: wp(2),
    padding: wp(2),
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default Chat;