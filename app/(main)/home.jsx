import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  ImageBackground,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
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

const Home = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  const postChannel = useRef(null);

  useEffect(() => {
    // Fetch all users for the profile cards
    const loadUsers = async () => {
      const res = await fetchAllUsers();
      if (res.success) {
        setUsers(res.data.filter(u => u.id !== user?.id));
      }
    };
    loadUsers();

    // Initial posts load
    loadInitialPosts();

    // Set up real-time subscription
    setupRealtimeSubscription();

    return () => {
      // Clean up subscription when component unmounts
      if (postChannel.current) {
        supabase.removeChannel(postChannel.current);
      }
    };
  }, [user?.id]);

  const loadInitialPosts = async () => {
    const res = await fetchPosts(limit);
    if (res.success) {
      setPosts(res.data);
      if (res.data.length < 4) {
        setHasMore(false);
      }
    }
  };

  const setupRealtimeSubscription = () => {
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
  };

  const handlePostEvent = async (payload) => {
    console.log('Change received!', payload);
    
    if (payload.eventType === 'INSERT') {
      const userData = await getUserData(payload.new.userId);
      const newPost = {
        ...payload.new,
        postlikes: [],
        comments: [{ count: 0 }],
        user: userData.success ? userData.data : {}
      };
      setPosts(prev => [newPost, ...prev]);
    } 
    else if (payload.eventType === 'DELETE') {
      setPosts(prev => prev.filter(post => post.id !== payload.old.id));
    } 
    else if (payload.eventType === 'UPDATE') {
      setPosts(prev => prev.map(post => 
        post.id === payload.new.id ? 
        { ...post, body: payload.new.body, file: payload.new.file } : 
        post
      ));
    }
  };

  const getPosts = async () => {
    if (!hasMore) return;

    limit += 4;
    let res = await fetchPosts(limit);
    if (res.success) {
      if (posts.length === res.data.length) {
        setHasMore(false);
      }
      setPosts(res.data);
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const currentOffset = event.nativeEvent.contentOffset.y;
        if (currentOffset > 50) {
          setHeaderVisible(currentOffset <= lastOffset.current);
        }
        lastOffset.current = currentOffset;
      },
    }
  );

  return (
    <ImageBackground
      source={require("../../assets/images/white.jpg")}
      style={styles.backgroundImage}
    >
      <ScreenWrapper bg="transparent">
        <View style={styles.container}>
          <FlatList
            data={posts}
            ListHeaderComponent={
              <View style={styles.usersContainer}>
                <Text style={styles.sectionTitle}>Connect With Others</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.usersScroll}
                >
                  {users.map((user) => (
                    <TouchableOpacity 
                      key={user.id} 
                      style={styles.userCard}
                      onPress={() => router.push({ pathname: "profile", params: { userId: user.id } })}
                    >
                      <Avatar
                        uri={user.image}
                        size={hp(8)}
                        rounded={theme.radius.xl}
                        style={styles.userAvatar}
                      />
                      <Text style={styles.userName} numberOfLines={1}>
                        {user.name}
                      </Text>
                      <Text style={styles.userHandle} numberOfLines={1}>
                        @{user.username || user.name.toLowerCase().replace(/\s/g, '')}
                      </Text>
                      <TouchableOpacity 
                        style={styles.followButton}
                        onPress={() => console.log("Follow", user.id)}
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
              <Pressable onPress={() => router.push("home")}>
                <Icon
                  name="home"
                  size={hp(3.2)}
                  strokeWidth={2}
                  color={theme.colors.text}
                />
              </Pressable>
              <Pressable onPress={() => router.push("notifications")}>
                <Icon
                  name="heart"
                  size={hp(3.2)}
                  strokeWidth={2}
                  color={theme.colors.text}
                />
              </Pressable>
              <Pressable onPress={() => router.push("newPost")}>
                <Icon
                  name="plus"
                  size={hp(3.2)}
                  strokeWidth={2}
                  color={theme.colors.text}
                />
              </Pressable>
              <Pressable onPress={() => router.push("home")}>
                <Icon
                  name="location"
                  size={hp(3.2)}
                  strokeWidth={2}
                  color={theme.colors.text}
                />
              </Pressable>
              <Pressable onPress={() => router.push("profile")}>
                <Avatar
                  uri={user?.image}
                  size={hp(4.3)}
                  rounded={theme.radius.sm}
                  style={{ borderWidth: 2 }}
                />
              </Pressable>
            </View>
          )}
        </View>
      </ScreenWrapper>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
  },
  usersContainer: {
    paddingBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(2.5),
    fontWeight: '600',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
    color: theme.colors.text,
  },
  usersScroll: {
    paddingHorizontal: wp(4),
  },
  userCard: {
    width: wp(30),
    marginRight: wp(4),
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    padding: wp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginBottom: hp(1),
  },
  userName: {
    fontSize: hp(1.9),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: hp(0.5),
    maxWidth: '100%',
  },
  userHandle: {
    fontSize: hp(1.6),
    color: theme.colors.textlight,
    textAlign: 'center',
    marginBottom: hp(1),
    maxWidth: '100%',
  },
  followButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.sm,
    width: '100%',
  },
  followButtonText: {
    color: 'white',
    fontSize: hp(1.6),
    fontWeight: '500',
    textAlign: 'center',
  },
  listStyle: {
    paddingBottom: 80,
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: "center",
    color: theme.colors.text,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
});

export default Home;