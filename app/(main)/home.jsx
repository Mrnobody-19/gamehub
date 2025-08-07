import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState, useRef, useCallback } from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { wp, hp } from "../../helpers/common";
import { theme } from "../../constants/theme";
import Icon from "../../assets/icons";
import { useRouter } from "expo-router";
import Avatar from "../../components/Avater";
import { fetchPosts } from "../../services/postService";
import PostCard from "../../components/PostCard";
import Loading from "../../components/Loading";
import { getUserData, fetchAllUsers } from "../../services/userServices";

let limit = 0;

const HomeScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  const postChannel = useRef(null);

  // Function to shuffle array randomly
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handlePostEvent = useCallback(async (payload) => {
    console.log('Change received!', payload);
    
    if (payload.eventType === 'INSERT') {
      const userData = await getUserData(payload.new.user_id);
      const newPost = {
        ...payload.new,
        postlikes: [],
        comments: [{ count: 0 }],
        user: userData.success ? userData.data : {
          id: payload.new.user_id,
          name: 'Unknown User',
          username: 'unknown',
          image: null
        }
      };
      setPosts(prev => shuffleArray([newPost, ...prev]));
    } 
    else if (payload.eventType === 'DELETE') {
      setPosts(prev => shuffleArray(prev.filter(post => post.id !== payload.old.id)));
    } 
    else if (payload.eventType === 'UPDATE') {
      setPosts(prev => shuffleArray(prev.map(post => 
        post.id === payload.new.id ? 
        { ...post, body: payload.new.body, file: payload.new.file } : 
        post
      )));
    }
  }, []);

  const setupRealtimeSubscription = useCallback(() => {
    postChannel.current = supabase
      .channel('posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        handlePostEvent
      )
      .subscribe();
  }, [handlePostEvent]);

  const loadInitialPosts = useCallback(async () => {
    const res = await fetchPosts(limit);
    if (res.success) {
      setPosts(shuffleArray(res.data));
      setHasMore(res.data.length >= 4);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      limit = 0;
      const [postsRes, usersRes] = await Promise.all([
        fetchPosts(limit),
        fetchAllUsers()
      ]);

      if (postsRes.success) {
        setPosts(shuffleArray(postsRes.data));
        setHasMore(postsRes.data.length >= 4);
      }
      if (usersRes.success) {
        setUsers(usersRes.data.filter(u => u.id !== user?.id));
      }
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const loadData = async () => {
      const [postsRes, usersRes] = await Promise.all([
        loadInitialPosts(),
        fetchAllUsers()
      ]);
      if (usersRes.success) {
        setUsers(usersRes.data.filter(u => u.id !== user?.id));
      }
      setupRealtimeSubscription();
    };

    loadData();

    return () => {
      if (postChannel.current) {
        supabase.removeChannel(postChannel.current);
      }
    };
  }, [user?.id, loadInitialPosts, setupRealtimeSubscription]);

  const getPosts = async () => {
    if (!hasMore) return;

    limit += 4;
    const res = await fetchPosts(limit);
    if (res.success) {
      setHasMore(res.data.length > posts.length);
      setPosts(shuffleArray(res.data));
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const currentOffset = event.nativeEvent.contentOffset.y;
        setHeaderVisible(currentOffset <= lastOffset.current || currentOffset <= 0);
        lastOffset.current = currentOffset;
      },
    }
  );

  const navigateToProfile = (userId) => {
    console.log("Navigating to profile:", userId);
    router.push({
      pathname: "/profile",
      params: { userId }
    });
  };

  return (
    <ScreenWrapper bg="black">
      <View style={styles.container}>
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
            <View style={styles.usersContainer}>
              <Text style={styles.sectionTitle}>Connect With Others</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.usersScroll}
              >
                {users.map((userItem) => (
                  <TouchableOpacity
                    key={userItem.id}
                    style={styles.userCard}
                    onPress={() => navigateToProfile(userItem.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.userAvatarContainer}>
                      <Avatar
                        uri={userItem.image}
                        size={hp(7)}
                        rounded={hp(7)/2}
                        style={styles.userAvatar}
                      />
                    </View>
                    <Text style={styles.userName} numberOfLines={1}>
                      {userItem.name}
                    </Text>
                    <Text style={styles.userHandle} numberOfLines={1}>
                      @{userItem.username}
                    </Text>
                    <TouchableOpacity 
                      style={styles.followButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        console.log("Follow", userItem.id);
                      }}
                    >
                      <Text style={styles.followButtonText}>Follow</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
          keyExtractor={(item) => item.id.toString()}
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
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />

        {headerVisible && (
          <View style={styles.bottomBar}>
            <Pressable 
              onPress={() => router.push("/home")}
              style={styles.bottomBarButton}
            >
              <Icon
                name="home"
                size={hp(3.2)}
                strokeWidth={2}
                color="white"
              />
            </Pressable>
            <Pressable 
              onPress={() => router.push("/notifications")}
              style={styles.bottomBarButton}
            >
              <Icon
                name="heart"
                size={hp(3.2)}
                strokeWidth={2}
                color="white"
              />
            </Pressable>
            <Pressable 
              onPress={() => router.push("/newPost")}
              style={styles.bottomBarButton}
            >
              <Icon
                name="plus"
                size={hp(3.2)}
                strokeWidth={2}
                color="white"
              />
            </Pressable>
            <Pressable 
              onPress={() => router.push("/home")}
              style={styles.bottomBarButton}
            >
              <Icon
                name="location"
                size={hp(3.2)}
                strokeWidth={2}
                color="white"
              />
            </Pressable>
            <Pressable 
              onPress={() => router.push("/profile")}
              style={styles.bottomBarButton}
            >
              <Avatar
                uri={user?.image}
                size={hp(4)}
                rounded={hp(4)/2}
                style={{ borderWidth: 2, borderColor: theme.colors.primary }}
              />
            </Pressable>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  usersContainer: {
    marginTop: hp(2),
    marginBottom: hp(2),
    paddingHorizontal: wp(4),
  },
  sectionTitle: {
    color: "white",
    fontSize: hp(2.2),
    fontWeight: "bold",
    marginBottom: hp(1),
  },
  usersScroll: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1),
  },
  userCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    alignItems: "center",
    marginRight: wp(3),
    padding: wp(2),
    width: wp(28),
    elevation: 2,
  },
  userAvatarContainer: {
    marginBottom: hp(1),
  },
  userAvatar: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  userName: {
    color: "white",
    fontWeight: "bold",
    fontSize: hp(1.8),
    marginBottom: 2,
    textAlign: "center",
  },
  userHandle: {
    color: theme.colors.textSecondary,
    fontSize: hp(1.5),
    marginBottom: hp(0.5),
    textAlign: "center",
  },
  followButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  followButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: hp(1.5),
  },
  listStyle: {
    paddingBottom: hp(10),
  },
  noPosts: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontSize: hp(2),
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card,
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

export default HomeScreen;