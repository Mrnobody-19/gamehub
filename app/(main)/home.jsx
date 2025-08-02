import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  ImageBackground,
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
import { FlatList } from "react-native";
import PostCard from "../../components/PostCard";
import Loading from "../../components/Loading";
import { getUserData } from "../../services/userServices";

let limit = 0;

const Home = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handlePostEvent = async (payload) => {
    console.log('payload:', payload);
      if (payload.eventType === "INSERT" && payload?.new?.id) {
        let newPost = { ...payload.new };
        let res = await getUserData(newPost.userId);
        newPost.postlikes = [];
        newPost.comments = [{ count: 0 }];
        newPost.user = res.success ? res.data : {};
        setPosts((prevPosts) => [newPost, ...prevPosts]);
      }

      if(payload. eventType=='DELETE' && payload.old.id){
        setPosts(prevPosts=>{
          let updatedPosts = prevPosts.filter(post=> post.id!=payload.old.id);
          return updatedPosts;
        })
      }

      if (payload.eventType === "UPDATE" && payload?.new?.id) {
        setPosts(prevPosts=>{
          let updatedPosts = prevPosts.map(post=>{
            if(post.id==payload.new.id){
              post.body = payload.new.body;
              post.file = payload.new.file;
            }
            return post;
          });

          return updatedPosts;
          
        })
      }
  }

  useEffect(() => {
    const postChannel = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        handlePostEvent
      )
      .subscribe();

    return () => {
      postChannel.unsubscribe();
    };
  }, []);

  const getPosts = async () => {
    if (!hasMore) return;

    limit += 4;
    console.log("Fetching post:", limit);

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
          if (currentOffset > lastOffset.current) {
            setHeaderVisible(false); // Scrolling up
          } else {
            setHeaderVisible(true); // Scrolling down
          }
        }
        lastOffset.current = currentOffset;
      },
    }
  );

  const lastOffset = useRef(0); // To keep track of the last offset

  return (
    <ImageBackground
    source={require('../../assets/images/bg 7.jpg')}
      style={styles.backgroundImage}
    >
      <ScreenWrapper bg="transparent">
        <View style={styles.container}>
          {/* header */}
          {headerVisible && (
            <View style={styles.header}>
              <Text style={styles.title}>FuseHub!</Text>
              <View style={styles.icons}>
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
                <Pressable onPress={() => router.push("profile")}>
                  <Avatar
                    uri={user?.image}
                    size={hp(4.3)}
                    rounded={theme.radius.sm}
                    style={{ borderWidth: 2 }}
                  />
                </Pressable>
              </View>
            </View>
          )}

          {/* posts */}
          <FlatList
            data={posts}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listStyle}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <PostCard item={item} currentUser={user} router={router} />
            )}
            onEndReached={() => {
              getPosts();
              console.log("Reached the end");
            }}
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
            scrollEventThrottle={16} // Throttle for smoother scrolling
          />
        </View>
      </ScreenWrapper>
    </ImageBackground>
  );
};

export default Home;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover", // Adjust this based on how you want the background to behave
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginHorizontal: wp(4),
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold,
    fontStyle: "italic",
  },
  icons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  listStyle: {
    paddingTop: 20,
    paddingHorizontal: wp(4),
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: "center",
    color: theme.colors.text,
  },
});
