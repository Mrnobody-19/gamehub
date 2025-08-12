import { Alert, StyleSheet, Pressable, Text, View, ActivityIndicator, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import React, { useState, useEffect } from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAuth } from "../../contexts/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header";
import { theme } from "../../constants/theme";
import Icon from "../../assets/icons";
import { hp, wp } from "../../helpers/common";
import Avatar from "../../components/Avater";
import { fetchPosts } from "../../services/postService";
import PostCard from "../../components/PostCard";
import Loading from "../../components/Loading";
import { getUserData } from "../../services/userServices";
import { followUser, unfollowUser, checkIfFollowing, getFollowersCount, getFollowingCount } from "../../services/followServices";

let limit = 0;

const Profile = () => {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const targetUserId = userId || currentUser?.id;
      
      if (!targetUserId) {
        router.replace("/login");
        return;
      }

      // Load user data
      if (userId && userId !== currentUser?.id) {
        const userRes = await getUserData(userId);
        if (userRes.success) {
          setProfileUser(userRes.data);
          
          // Check follow status
          const followRes = await checkIfFollowing(currentUser?.id, userId);
          if (followRes.success) {
            setIsFollowing(followRes.isFollowing);
          }
          
          // Load follow counts
          const [followersRes, followingRes] = await Promise.all([
            getFollowersCount(userId),
            getFollowingCount(userId)
          ]);
          
          if (followersRes.success) setFollowersCount(followersRes.count || 0);
          if (followingRes.success) setFollowingCount(followingRes.count || 0);
        } else {
          Alert.alert("Error", "User not found");
          router.back();
          return;
        }
      } else {
        setProfileUser(currentUser);
        // Load current user's follow counts
        const [followersRes, followingRes] = await Promise.all([
          getFollowersCount(currentUser?.id),
          getFollowingCount(currentUser?.id)
        ]);
        
        if (followersRes.success) setFollowersCount(followersRes.count || 0);
        if (followingRes.success) setFollowingCount(followingRes.count || 0);
      }

      // Load posts
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

  useEffect(() => {
    loadProfileData();
  }, [userId, currentUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
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

  const toggleFollow = async () => {
    if (!currentUser || !userId) return;
    
    try {
      // Optimistic update
      const newFollowingStatus = !isFollowing;
      setIsFollowing(newFollowingStatus);
      setFollowersCount(prev => newFollowingStatus ? prev + 1 : prev - 1);
      
      // Update in database
      if (newFollowingStatus) {
        await followUser(currentUser.id, userId);
      } else {
        await unfollowUser(currentUser.id, userId);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      // Revert on error
      setIsFollowing(!isFollowing);
      Alert.alert("Error", "Failed to update follow status");
    }
  };

  const onLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Sign out", "Error signing out!");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Confirm", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: onLogout, style: "destructive" }
    ]);
  };

  if (loading && !refreshing) {
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={
          <UserHeader 
            user={profileUser} 
            isCurrentUser={!userId || userId === currentUser?.id}
            router={router} 
            handleLogout={handleLogout}
            isFollowing={isFollowing}
            toggleFollow={toggleFollow}
            followersCount={followersCount}
            followingCount={followingCount}
            postsCount={posts.length}
          />
        }
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

      {/* Fixed Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        <Pressable onPress={() => router.push("/home")} style={styles.bottomBarButton}>
          <Icon name="home" size={hp(3.2)} strokeWidth={2} color="white" />
        </Pressable>
        <Pressable onPress={() => router.push("/notifications")} style={styles.bottomBarButton}>
          <Icon name="heart" size={hp(3.2)} strokeWidth={2} color="white" />
        </Pressable>
        <Pressable onPress={() => router.push("/newPost")} style={styles.bottomBarButton}>
          <Icon name="plus" size={hp(3.2)} strokeWidth={2} color="white" />
        </Pressable>
        <Pressable onPress={() => router.push("/home")} style={styles.bottomBarButton}>
          <Icon name="location" size={hp(3.2)} strokeWidth={2} color="white" />
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

const UserHeader = ({ 
  user, 
  isCurrentUser, 
  router, 
  handleLogout,
  isFollowing,
  toggleFollow,
  followersCount,
  followingCount,
  postsCount
}) => {
  return (
    <View style={styles.profileContainer}>
      <View style={styles.headerContainer}>
        <Header title="Profile" showBackButton={true} />
        {isCurrentUser && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" color={theme.colors.roses} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.profileContent}>
        <View style={styles.avatarContainer}>
          <Avatar uri={user?.image} size={hp(12)} rounded={hp(12)/2} />
          {isCurrentUser && (
            <Pressable
              style={styles.editIcons}
              onPress={() => router.push("/(main)/editProfile")}
            >
              <Icon name="edit" strokeWidth={2.5} size={20} color="white" />
            </Pressable>
          )}
        </View>

        <Text style={styles.username}>{user?.name || 'Unknown User'}</Text>
        <Text style={styles.userBio}>{user?.bio || 'Unknown User'}</Text>

        {!isCurrentUser && (
          <TouchableOpacity 
            style={[
              styles.messageButton,
              isFollowing && styles.unfollowButton
            ]}
            onPress={toggleFollow}
          >
            <Text style={styles.messageButtonText}>
              {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push(`/followList?userId=${user?.id}`)}
          >
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push(`/followList?userId=${user?.id}`)}
          >
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{postsCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.tabButton}>
            <Text style={styles.tabText}>PHOTOS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton}>
            <Text style={styles.tabText}>VIDEOS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton}>
            <Text style={styles.tabText}>POSTS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <Text style={styles.aboutText}>
            {user?.bio || 'No bio information available'}
          </Text>
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
  profileContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  headerContainer: {
    marginHorizontal: wp(4),
    marginBottom: hp(1),
  },
  profileContent: {
    alignItems: 'center',
    paddingHorizontal: wp(4),
  },
  avatarContainer: {
    height: hp(12),
    width: hp(12),
    alignSelf: "center",
    position: 'relative',
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  editIcons: {
    position: "absolute",
    bottom: 0,
    right: 0,
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
    fontSize: hp(2.5),
    fontWeight: "bold",
    color: "white",
    marginBottom: hp(0.5),
  },
  userBio: {
    fontSize: hp(1.8),
    color: "#ccc",
    marginBottom: hp(2),
  },
  messageButton: {
    backgroundColor: theme.colors.roses,
    paddingVertical: hp(1),
    paddingHorizontal: wp(8),
    borderRadius: hp(1),
    marginBottom: hp(3),
  },
  unfollowButton: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: theme.colors.roses,
  },
  messageButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: hp(1.8),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: hp(3),
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: hp(1.6),
    color: '#ccc',
    marginTop: hp(0.5),
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: hp(1.5),
    marginBottom: hp(2),
  },
  tabButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },
  tabText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: hp(1.8),
  },
  aboutSection: {
    width: '100%',
    paddingHorizontal: wp(2),
  },
  sectionTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: hp(2),
    marginBottom: hp(1),
  },
  aboutText: {
    color: '#ccc',
    fontSize: hp(1.8),
    lineHeight: hp(2.5),
  },
  listStyle: {
    paddingBottom: hp(12), // Extra space for bottom bar
    backgroundColor: 'black'
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: "center",
    color: "#666",
    fontStyle: 'italic'
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
  bottomBar: {
    position: 'fixed',
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

export default Profile;