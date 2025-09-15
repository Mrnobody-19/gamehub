import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  RefreshControl,
  Keyboard,
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
import { createNotification } from "../../services/notificationService";

const PostDetails = () => {
  const { postId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const inputRef = useRef(null);
  const scrollViewRef = useRef(null);

  const [startLoading, setStartLoading] = useState(true);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [commentText, setCommentText] = useState(""); // ✅ reactive text
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleNewComment = async (payload) => {
    if (payload.new) {
      let newComment = { ...payload.new };
      let res = await getUserData(newComment.userId);
      newComment.user = res.success ? res.data : {};

      setPost((prevPost) => ({
        ...prevPost,
        comments: [newComment, ...prevPost.comments],
      }));

      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
          delay: 500,
        }),
      ]).start();
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
    setRefreshing(false);
  }, [postId]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    getPostDetails();
  }, []);

  const onNewComment = async () => {
    if (!commentText.trim()) return;

    let data = {
      userId: user?.id,
      postId: post?.id,
      text: commentText.trim(),
    };
    setLoading(true);
    let res = await createComment(data);
    setLoading(false);
    if (res.success) {
      if (user.id !== post.userId) {
        let notify = {
          senderId: user.id,
          receiverId: post.userId,
          title: "commented on your post",
          data: JSON.stringify({
            postId: post.id,
            commentId: res.data.id,
          }),
        };
        createNotification(notify);
      }
      inputRef?.current?.clear();
      setCommentText(""); // ✅ reset input
      Keyboard.dismiss();
    } else {
      Alert.alert("Comment", res.msg);
    }
  };

  const onDeleteComment = async (comment) => {
    Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          let res = await removeComment(comment?.id);
          if (res.success) {
            setPost((prevPost) => {
              let updatePost = { ...prevPost };
              updatePost.comments = updatePost.comments.filter((e) => e.id !== comment.id);
              return updatePost;
            });
          } else {
            Alert.alert("Comment", res.msg);
          }
        },
        style: "destructive",
      },
    ]);
  };

  const onDeletePost = async () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          let res = await removePost(post.id);
          if (res.success) {
            router.back();
          } else {
            Alert.alert("Post", res.msg);
          }
        },
        style: "destructive",
      },
    ]);
  };

  const onEditPost = async (item) => {
    router.back();
    router.push({ pathname: "newPost", params: { ...item } });
  };

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
    <ScreenWrapper bg="#0a0a0a">
      <Header title="Post Details" showBackButton={true} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* Post Card */}
          <View style={styles.postContainer}>
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
          </View>

          {/* Comments Section */}
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>COMMENTS</Text>
            <View style={styles.commentCountBadge}>
              <Text style={styles.commentCountText}>{post.comments?.length || 0}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.commentsList}>
            {post?.comments?.map((comment, index) => (
              <Animated.View key={comment?.id?.toString()} style={index === 0 ? { opacity: fadeAnim } : {}}>
                <CommentItem
                  item={comment}
                  onDelete={onDeleteComment}
                  canDelete={user.id === comment.userId || user.id === post.userId}
                />
              </Animated.View>
            ))}
            {post?.comments?.length === 0 && (
              <View style={styles.noCommentsContainer}>
                <Icon name="comment" size={hp(6)} color="#444" />
                <Text style={styles.noComments}>Be the first to comment</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={[styles.inputContainer, inputFocused && styles.inputContainerFocused]}>
          <View style={styles.inputWrapper}>
            <Input
              inputRef={inputRef}
              style={styles.input}
              placeholder="Type your comment..."
              placeholderTextColor="#888"
              value={commentText}
              onChangeText={setCommentText}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              multiline
              maxLength={500}
            />
            {commentText.length > 0 && (
              <Text style={styles.charCount}>{commentText.length}/500</Text>
            )}
          </View>
          {loading ? (
            <View style={styles.sendButton}>
              <Loading size="small" color={theme.colors.primary} />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.sendButton, commentText.trim() && styles.sendButtonActive]}
              onPress={onNewComment}
              activeOpacity={0.7}
              disabled={!commentText.trim()}
            >
              <Icon name="send" size={hp(2.4)} color={commentText.trim() ? "#fff" : "#666"} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default PostDetails;

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: wp(4), paddingBottom: hp(12) },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  postContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: hp(3),
    backgroundColor: "rgba(30, 30, 30, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: "#0a0a0a",
    borderTopWidth: 1,
    borderTopColor: "#1f1f1f",
  },
  inputContainerFocused: { backgroundColor: "#111" },
  inputWrapper: {
    flex: 1,
    minHeight: hp(5.5),
    maxHeight: hp(15),
    borderRadius: 24,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
  },
  input: { color: "#fff", fontSize: hp(1.9), padding: 0, maxHeight: hp(12) },
  charCount: { color: "#666", fontSize: hp(1.4), textAlign: "right", marginTop: hp(0.5) },
  sendButton: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginLeft: wp(2),
  },
  sendButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  commentsHeader: { flexDirection: "row", alignItems: "center", marginBottom: hp(1.5) },
  commentsTitle: { color: "#fff", fontSize: hp(2.1), fontWeight: "700", marginRight: wp(2) },
  commentCountBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
  },
  commentCountText: { color: "#fff", fontSize: hp(1.6), fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#2a2a2a", marginBottom: hp(3) },
  commentsList: { gap: hp(2.5), paddingBottom: hp(2) },
  noCommentsContainer: { alignItems: "center", justifyContent: "center", paddingVertical: hp(8), opacity: 0.7 },
  noComments: { color: "#888", fontSize: hp(1.9), textAlign: "center", marginTop: hp(2), fontStyle: "italic" },
  notFound: { color: "#fff", fontSize: hp(2.2), fontWeight: "500" },
});
