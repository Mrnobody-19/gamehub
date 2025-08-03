import { Alert, StyleSheet, Pressable, Text, View, ImageBackground, FlatList, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import Icon from "../../assets/icons";
import { hp, wp } from "../../helpers/common";
import Avater from "../../components/Avater";
import { fetchPosts } from "../../services/postService";
import PostCard from "../../components/PostCard";
import Loading from "../../components/Loading";
import { theme } from "../../constants/theme";

const Profile = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const stats = [
    { label: "Posts", value: posts.length.toString() },
    { label: "Followers", value: "0" },
    { label: "Following", value: "0" }
  ];

  const onLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Sign out", "Error signing out!");
    } else {
      router.replace("/auth/login");
    }
  };

  const getPosts = async () => {
    if (!hasMore) return;
    let res = await fetchPosts(posts.length + 4, user.id);
    if (res.success) {
      if (posts.length === res.data.length) setHasMore(false);
      setPosts(res.data);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Confirm", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: onLogout, style: "destructive" }
    ]);
  };

  return (
    <ImageBackground source={require('../../assets/images/white.jpg')} style={styles.background}>
      <ScreenWrapper bg="transparent">
        <FlatList
          data={posts}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              {/* Logout Button */}
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Icon name="logout" size={hp(2.5)} color={theme.colors.error} />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>

              {/* Profile Header */}
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <Avater uri={user?.image} size={hp(12)} rounded={theme.radius.xxl * 1.4} />
                  <Pressable
                    style={styles.editIcons}
                    onPress={() => router.push("editProfile")}
                  >
                    <Icon name="edit" strokeWidth={2.5} size={20} />
                  </Pressable>
                </View>

                <Text style={styles.username}>{user?.name || "Angelina Hall"}</Text>
                <Text style={styles.handle}>@{user?.name || "angelina.hall"}</Text>
                
                {/* Stats Row */}
                <View style={styles.statsContainer}>
                  {stats.map((stat, index) => (
                    <View key={index} style={styles.statItem}>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
                
                {/* Follow Button - Hidden for own profile */}
                {!user?.isCurrentUser && (
                  <TouchableOpacity style={styles.followButton}>
                    <Text style={styles.followButtonText}>Follow</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <PostCard item={item} currentUser={user} router={router} />
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
          contentContainerStyle={styles.listStyle}
        />
      </ScreenWrapper>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    paddingHorizontal: wp(4),
    paddingBottom: 30,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: hp(1),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.error + '10',
  },
  logoutText: {
    color: theme.colors.error,
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: hp(4),
  },
  avatarContainer: {
    height: hp(12),
    width: hp(12),
    alignSelf: "center",
    position: 'relative',
  },
  editIcons: {
    position: "absolute",
    bottom: 0,
    right: 12,
    padding: 7,
    borderRadius: 58,
    backgroundColor: "white",
    shadowColor: theme.colors.textlight,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 7,
  },
  username: {
    fontSize: hp(3),
    fontWeight: "600",
    color: theme.colors.text,
    marginTop: hp(1),
  },
  handle: {
    fontSize: hp(1.8),
    color: theme.colors.textlight,
    marginBottom: hp(2),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: hp(2),
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: hp(2.5),
    fontWeight: '600',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: hp(1.6),
    color: theme.colors.textlight,
  },
  followButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(20),
    borderRadius: theme.radius.lg,
    marginTop: hp(1),
  },
  followButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: hp(1.8),
  },
  listStyle: {
    paddingBottom: 30,
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: "center",
    color: theme.colors.text,
  },
});

export default Profile;