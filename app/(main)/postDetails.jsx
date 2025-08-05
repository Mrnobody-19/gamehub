import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  ImageBackground,  // Import ImageBackground
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { hp, wp } from "../../helpers/common";
import { theme } from "../../constants/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  fetchPostDetails,
  createComment,
  removeComment,
  removePost,
} from "../../services/postService"; 
import PostCard from "../../components/PostCard";
import { useAuth } from "../../contexts/AuthContext";
import Loading from "../../components/Loading";
import ScreenWrapper from "../../components/ScreenWrapper";
import Header from "../../components/Header";
import Input from "../../components/Input";
import Icon from "../../assets/icons";
import CommentItem from "../../components/CommentItem";
import { supabase } from "../../lib/supabase";
import { getUserData } from "../../services/userServices";

const PostDetails = () => {
  const { postId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const inputRef = useRef(null);
  const commentRef = useRef("");

  const [startLoading, setStartLoading] = useState(true);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleNewComment = async (payload) => {
    if (payload.new) {
      let newComment = { ...payload.new };
      let res = await getUserData(newComment.userId);
      newComment.user = res.success ? res.data : {};
      setPost((prevPost) => ({
        ...prevPost,
        comments: [newComment, ...prevPost.comments],
      }));
    }
  };

  useEffect(() => {
    const commentChannel = supabase
      .channel("comments")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `postId=eq.${postId}`,
        },
        handleNewComment
      )
      .subscribe();

    getPostDetails();

    return () => {
      supabase.removeChannel(commentChannel);
    };
  }, [getPostDetails, postId]);

  const getPostDetails = React.useCallback(async () => {
    let res = await fetchPostDetails(postId);
    if (res.success) setPost(res.data);
    setStartLoading(false);
  }, [postId]);

  const onNewComment = async () => {
    let data = {
      userId: user?.id,
      postId: post?.id,
      text: commentRef.current,
    };
    setLoading(true);
    let res = await createComment(data);
    setLoading(false);
    if (res.success) {
      inputRef?.current?.clear();
      commentRef.current = "";
    } else {
      Alert.alert("comment", res.msg);
    }
  };

  const onDeleteComment = async (comment) => {
    let res = await removeComment(comment?.id);
    if (res.success) {
      setPost((prevPost) => {
        let updatePost = { ...prevPost };
        updatePost.comments = updatePost.comments.filter(
          (e) => e.id !== comment.id
        );
        return updatePost;
      });
    } else {
      Alert.alert("Comment", res.msg);
    }
  };

  const onDeletePost = async () => {
    let res = await removePost(post.id);
    if (res.success) {
      router.back();
    } else {
      Alert.alert("Post", res.msg);
    }
  }

  const onEditPost = async (item) => {
    router.back();
    router.push({pathname: 'newPost', params: {...item}})
  }

  if (startLoading) {
    return (
      <View style={styles.center}>
        <Loading />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.center, { justifyContent: "flex-start", marginTop: 100 }]}>
        <Text style={styles.notFound}>Post not found</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/white.jpg')} // Path to your background image
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <ScreenWrapper bg="transparent">
        <Header title="Post Details" />
        <View style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            <PostCard
              item={{ ...post, comments: [{ count: post.comments?.length }] }}
              currentUser={user}
              router={router}
              hasShadow={false}
              showMoreIcon={false}
              showDelete={true}
              onDelete={onDeletePost}
              onEdit={onEditPost}
            />

            {/* Comment Input */}
            <View style={styles.inputContainer}>
              <Input
                inputRef={inputRef}
                style={styles.input}
                placeholder="Type comment..."
                placeholderTextColor={theme.colors.dark}
                containerStyle={{
                  flex: 1,
                  height: hp(6.2),
                  borderRadius: theme.radius.xxl,
                }}
                onChangeText={(value) => (commentRef.current = value)}
              />

              {loading ? (
                <View style={styles.loading}>
                  <Loading size="small" />
                </View>
              ) : (
                <TouchableOpacity style={styles.sendIcon} onPress={onNewComment}>
                  <Icon name="send" color={theme.colors.grey} />
                </TouchableOpacity>
              )}
            </View>

            {/* Comments list */}
            <View style={{ marginVertical: 15, gap: 17 }}>
              {post?.comments?.map((comment) => (
                <CommentItem
                  key={comment?.id?.toString()}
                  item={comment}
                  onDelete={onDeleteComment}
                  canDelete={user.id === comment.userId || user.id === post.userId}
                />
              ))}
              {post?.comments?.length === 0 && (
                <Text style={{ color: theme.colors.text, marginLeft: 5 }}>
                  Be first to comment
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </ScreenWrapper>
    </ImageBackground>
  );
};

export default PostDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 30,
    paddingVertical: wp(4),
    gap: 15,
  },
  list: {
    paddingHorizontal: wp(4),
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    color: theme.colors.text,
    fontWeight: theme.fonts.medium,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    color: theme.colors.text,
    marginLeft: 10,
    flex: 1,
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: {
    padding: 10,
  },
  notFound: {
    color: theme.colors.text,
    fontSize: 20,
  },
});
