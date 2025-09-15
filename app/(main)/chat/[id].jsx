import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenWrapper from "../../../components/ScreenWrapper";

import { supabase } from "../../../lib/supabase";
import Avatar from "../../../components/Avater" // Import Avatar component
import { getUserData } from "../../../services/userServices"; // Import user service

export default function ChatScreen() {
  const { id: recipientId } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const flatListRef = useRef(null);

  // --- get current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // --- fetch recipient info using the same service as profile.jsx
  useEffect(() => {
    const fetchRecipient = async () => {
      if (!recipientId) return;
      
      try {
        const userRes = await getUserData(recipientId);
        if (userRes.success) {
          setRecipient({
            id: userRes.data.id,
            username: userRes.data.name, // Using 'name' instead of 'username'
            avatar_url: userRes.data.image // Using 'image' instead of 'avatar_url'
          });
        } else {
          console.error("Error fetching recipient:", userRes.error);
          // Fallback to direct supabase query if service fails
          const { data, error: supabaseError } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .eq("id", recipientId)
            .single();
          if (!supabaseError) setRecipient(data);
        }
      } catch (error) {
        console.error("Error fetching recipient:", error);
        // Fallback to direct supabase query
        const { data, error: supabaseError } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", recipientId)
          .single();
        if (!supabaseError) setRecipient(data);
      }
    };
    fetchRecipient();
  }, [recipientId]);

  // --- fetch + realtime messages
  useEffect(() => {
    if (!currentUser || !recipientId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUser.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUser.id})`
        )
        .order("created_at", { ascending: true });
      if (!error) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          if (
            (msg.sender_id === currentUser.id && msg.recipient_id === recipientId) ||
            (msg.sender_id === recipientId && msg.recipient_id === currentUser.id)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, recipientId]);

  // --- scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // --- send message
  const sendMessage = async () => {
    if (!text.trim() || !currentUser) return;
    const { error } = await supabase.from("messages").insert({
      sender_id: currentUser.id,
      recipient_id: recipientId,
      content: text.trim(),
    });
    if (!error) setText("");
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.message,
        item.sender_id === currentUser?.id ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.timeText}>
        {new Date(item.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );

  return (
    <ScreenWrapper bg="black">
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={85}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        
        {/* Use Avatar component instead of Image */}
        <Avatar 
          uri={recipient?.avatar_url || recipient?.image} 
          size={38}
          rounded={19}
          style={styles.avatar}
        />
        
        <Text style={styles.username}>{recipient?.username || recipient?.name || "User"}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Input bar */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message"
          placeholderTextColor="#999"
          multiline
        />
        <Pressable style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 9, backgroundColor: "black" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#b662f3ff",
    elevation: 3,
  },
  backArrow: { fontSize: 22, marginRight: 12, color: "#fff" },
  avatar: { marginRight: 10 },
  username: { fontSize: 17, fontWeight: "600", color: "#fff" },

  // Messages
  messagesList: { padding: 10, flexGrow: 1, justifyContent: "flex-end" },
  message: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 4,
    borderRadius: 20,
    maxWidth: "75%",
    position: "relative",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#b662f3ff",
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  messageText: { color: "#111", fontSize: 15 },
  timeText: {
    fontSize: 11,
    color: "#555",
    alignSelf: "flex-end",
    marginTop: 2,
  },

  // Input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    color: "#111",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 25,
    fontSize: 15,
    maxHeight: 120,
  },
  sendButton: {
    marginLeft: 6,
    backgroundColor: "#b662f3ff",
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});