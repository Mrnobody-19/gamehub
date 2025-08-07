import { Alert, StyleSheet, Pressable, Text, View, ActivityIndicator } from "react-native";
import React, { useState, useEffect } from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAuth } from "../../contexts/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header";
import { theme } from "../../constants/theme";
import { TouchableOpacity } from "react-native";
import Icon from "../../assets/icons";
import { hp, wp } from "../../helpers/common";
import Avatar from "../../components/Avater";
import { fetchPosts } from "../../services/postService";
import PostCard from "../../components/PostCard";
import { FlatList } from 'react-native';
import Loading from "../../components/Loading";
import { getUserData } from "../../services/userServices";

let limit = 0;

const Profile = () => {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        // Determine which user's profile to show
        const targetUserId = userId || currentUser?.id;
        
        if (!targetUserId) {
          router.replace("/login");
          return;
        }

        // Fetch user data if viewing someone else's profile
        if (userId && userId !== currentUser?.id) {
          const userRes = await getUserData(userId);
          if (userRes.success) {
            setProfileUser(userRes.data);
          } else {
            Alert.alert("Error", "User not found");
            router.back();
            return;
          }
        } else {
          setProfileUser(currentUser);
        }

        // Fetch posts
        const postsRes = await fetchPosts(limit, targetUserId);
        if (postsRes.success) {
          setPosts(postsRes.data);
          setHasMore(postsRes.data.length >= 4);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        Alert.alert("Error", "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [userId, currentUser]);

  const onLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Sign out", "Error signing out!");
    }
  };

  const getPosts = async () => {
    if (!hasMore || loading) return;

    limit += 4;
    const targetUserId = userId || currentUser?.id;
    const res = await fetchPosts(limit, targetUserId);
    
    if (res.success) {
      setHasMore(res.data.length > posts.length);
      setPosts(res.data);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Confirm", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: onLogout,
        style: "destructive",
      },
    ]);
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
      <FlatList
        data={posts}
        ListHeaderComponent={
          <UserHeader 
            user={profileUser} 
            isCurrentUser={!userId || userId === currentUser?.id}
            router={router} 
            handleLogout={handleLogout} 
          />
        }
        ListHeaderComponentStyle={{ marginBottom: 30 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listStyle}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PostCard item={item} currentUser={currentUser} router={router} />
        )}
        onEndReached={getPosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore ? (
            <View style={{ marginVertical: posts.length === 0 ? 200 : 30 }}>
              <Loading />
            </View>
          ) : (
            <View style={{ marginVertical: 30 }}>
              <Text style={styles.noPosts}>No more posts</Text>
            </View>
          )
        }
      />
    </ScreenWrapper>
  );
};

const UserHeader = ({ user, isCurrentUser, router, handleLogout }) => {
  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <View style={styles.headerContainer}>
        <Header title="Profile" showBackButton={true} />
        {isCurrentUser && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" color={theme.colors.roses} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ gap: 15 }}>
        <View style={styles.avatarContainer}>
          <Avatar uri={user?.image} size={hp(12)} rounded={theme.radius.xxl * 1.4} />
          {isCurrentUser && (
            <Pressable
              style={styles.editIcons}
              onPress={() => router.push("/(main)/editProfile")}
            >
              <Icon name="edit" strokeWidth={2.5} size={20} color="white" />
            </Pressable>
          )}
        </View>

        <View style={{ alignItems: "center", gap: 4 }}>
          <Text style={styles.username}>{user?.name || 'Unknown User'}</Text>
          <Text style={styles.infoText}>{user?.address || 'No address provided'}</Text>
        </View>

        <View style={styles.infoContainer}>
          {user?.email && (
            <View style={styles.infoItem}>
              <Icon name="mail" size={20} color={theme.colors.roses} />
              <Text style={styles.infoText}>{user.email}</Text>
            </View>
          )}
          {user?.phoneNumber && (
            <View style={styles.infoItem}>
              <Icon name="call" size={20} color={theme.colors.roses} />
              <Text style={styles.infoText}>{user.phoneNumber}</Text>
            </View>
          )}
          {user?.bio && (
            <View style={styles.infoItem}>
              <Icon name="user" size={20} color={theme.colors.roses} />
              <Text style={styles.infoText}>{user.bio}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerContainer: {
    marginHorizontal: wp(4),
    marginBottom: 20,
  },
  avatarContainer: {
    height: hp(12),
    width: hp(12),
    alignSelf: "center",
    position: 'relative',
    marginTop: hp(2)
  },
  editIcons: {
    position: "absolute",
    bottom: 0,
    right: 12,
    padding: 7,
    borderRadius: 58,
    backgroundColor: theme.colors.roses,
    shadowColor: theme.colors.roses,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 7,
  },
  username: {
    fontSize: hp(3),
    fontWeight: "600",
    color: "white",
    fontStyle: "italic",
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 10
  },
  infoContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.radius.lg,
    padding: wp(5),
    marginTop: hp(2),
    marginHorizontal: wp(2)
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: hp(0.5),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoText: {
    fontSize: hp(1.8),
    fontWeight: "400",
    color: "#ccc",
    flex: 1,
    flexWrap: 'wrap'
  },
  logoutButton: {
    position: "absolute",
    right: 0,
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: theme.colors.roses
  },
  listStyle: {
    paddingHorizontal: wp(4),
    paddingBottom: 30,
    backgroundColor: 'black'
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: "center",
    color: "#666",
    fontStyle: 'italic'
  }
});

export default Profile;