import { StyleSheet, Pressable, Text, View, FlatList, ActivityIndicator, TextInput } from "react-native";
import React, { useEffect, useState } from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { theme } from "../../constants/theme";
import Icon from "../../assets/icons";
import { hp, wp } from "../../helpers/common";
import Avatar from "../../components/Avater";

const MessageList = () => {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Format time function
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // ✅ Fetch all users except current logged-in user with their last message and unread count
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get users
      let { data: usersData, error } = await supabase
        .from("users")
        .select("id, name, image, bio, email")
        .neq("id", currentUser?.id);

      if (error) throw error;

      // Get last message and unread count for each user
      const usersWithMessages = await Promise.all(
        usersData.map(async (user) => {
          // Get last message
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, created_at, read_at")
            .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${user.id}),and(sender_id.eq.${user.id},recipient_id.eq.${currentUser.id})`)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Get unread message count
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact" })
            .eq("sender_id", user.id)
            .eq("recipient_id", currentUser.id)
            .is("read_at", null);

          return {
            ...user,
            lastMessage,
            unreadCount: unreadCount || 0
          };
        })
      );

      setUsers(usersWithMessages);
      setFilteredUsers(usersWithMessages);
    } catch (err) {
      console.error("Error fetching users:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('message_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id.eq.${currentUser?.id}`
      }, (payload) => {
        // Refresh the user list when a new message is received
        fetchUsers();
      })
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const renderItem = ({ item }) => (
    <Pressable 
      style={styles.chatRow}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <Avatar 
        uri={item.image || "https://ui-avatars.com/api/?name=" + (item.name || "User")}
        size={hp(6)} 
        rounded={hp(6) / 2} 
      />
      <View style={styles.chatInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.chatName}>{item.name || "Unknown User"}</Text>
          {item.lastMessage && (
            <Text style={styles.timeText}>
              {formatTime(item.lastMessage.created_at)}
            </Text>
          )}
        </View>
        <Text 
          style={[
            styles.chatMessage, 
            item.unreadCount > 0 && styles.unreadMessage
          ]} 
          numberOfLines={1}
        >
          {item.lastMessage?.content || "Tap to start a chat"}
        </Text>
      </View>
      <View style={styles.chatMeta}>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unreadCount > 99 ? "99+" : item.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <ScreenWrapper bg="black">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Pressable>
          <Icon name="edit" size={hp(3)} strokeWidth={2} color="white" />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: hp(20) }} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Fixed Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        <Pressable onPress={() => router.push("/home")} style={styles.bottomBarButton}>
          <Icon name="home" size={hp(3.2)} strokeWidth={2} color="white" />
        </Pressable>
        <Pressable onPress={() => router.push("/notifications")} style={styles.bottomBarButton}>
          <Icon name="heart" size={hp(3.2)} strokeWidth={2} color="white" />
        </Pressable>
        <Pressable onPress={() => router.push("/newPost")} style={styles.bottomBarButton}>
          <View style={styles.centralButton}>
            <Icon name="plus" size={hp(4)} strokeWidth={2} color="black" />
          </View>
        </Pressable>
        <Pressable onPress={() => router.push("/message")} style={styles.bottomBarButton}>
          <Icon name="mail" size={hp(3.2)} strokeWidth={2} color={theme.colors.primary} />
        </Pressable>
        <Pressable onPress={() => router.push("/profile")} style={styles.bottomBarButton}>
          <Avatar
            uri={currentUser?.image}
            size={hp(4)}
            rounded={hp(4)/2}
            style={{ borderWidth: 2, borderColor: theme.colors.primary }}
          />
        </Pressable>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: wp(4),
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  headerTitle: {
    fontSize: hp(2.4),
    fontWeight: "bold",
    color: "white",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    marginHorizontal: wp(4),
    marginVertical: hp(1.5),
    borderRadius: hp(1),
    paddingHorizontal: wp(3),
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: hp(1.8),
    paddingVertical: hp(1.2),
  },
  clearButton: {
    padding: wp(1),
  },
  clearText: {
    color: "#aaa",
    fontSize: hp(2),
  },
  listContainer: {
    paddingVertical: hp(1),
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  chatInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  chatName: {
    fontSize: hp(2),
    color: "white",
    fontWeight: "bold",
    flex: 1,
  },
  timeText: {
    fontSize: hp(1.6),
    color: "#666",
    marginLeft: wp(2),
  },
  chatMessage: {
    fontSize: hp(1.8),
    color: "#aaa",
  },
  unreadMessage: {
    color: "white",
    fontWeight: "600",
  },
  chatMeta: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: hp(3),
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: hp(1.5),
    minWidth: hp(2.8),
    height: hp(2.8),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(1),
  },
  unreadText: {
    color: "white",
    fontSize: hp(1.6),
    fontWeight: "bold",
  },
  centralButton: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(0.2),
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "black",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bottomBarButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default MessageList;