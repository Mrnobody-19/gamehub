import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
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
      if(user.id !== post.userId){
        // send notification to post owner
        let notify = {
          senderId: user.id,
          receiverId: post.userId,
          title: "commented on your post",
          data: JSON.stringify({postId: post.id, commentId: res.data.id}),
        }
        createNotification(notify);
      }
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
    <ScreenWrapper bg="#0a0a0a">
      <Header title="Post Details" showBackButton={true} />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {/* Post Card with glass morphism effect */}
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

          {/* Comment Input with modern styling */}
          <View style={styles.inputContainer}>
            <Input
              inputRef={inputRef}
              style={styles.input}
              placeholder="Type comment..."
              placeholderTextColor="#888"
              containerStyle={styles.inputWrapper}
              onChangeText={(value) => (commentRef.current = value)}
            />
            {loading ? (
              <View style={styles.loading}>
                <Loading size="small" color={theme.colors.primary} />
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.sendButton} 
                onPress={onNewComment}
                activeOpacity={0.7}
              >
                <Icon name="send" size={hp(2.8)} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Comments section with divider */}
          <Text style={styles.commentsTitle}>COMMENTS</Text>
          <View style={styles.divider} />

          {/* Comments list with animated appearance */}
          <View style={styles.commentsList}>
            {post?.comments?.map((comment) => (
              <CommentItem
                key={comment?.id?.toString()}
                item={comment}
                onDelete={onDeleteComment}
                canDelete={user.id === comment.userId || user.id === post.userId}
              />
            ))}
            {post?.comments?.length === 0 && (
              <Text style={styles.noComments}>Be the first to comment</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default PostDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(1),
  },
  list: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(4),
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  postContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: hp(3),
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(3),
  },
  inputWrapper: {
    flex: 1,
    height: hp(6.5),
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: wp(4),
  },
  input: {
    color: '#fff',
    fontSize: hp(1.9),
  },
  sendButton: {
    marginLeft: wp(2),
    width: hp(6.5),
    height: hp(6.5),
    borderRadius: hp(3.25),
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  loading: {
    marginLeft: wp(2),
    width: hp(6.5),
    height: hp(6.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsTitle: {
    color: '#888',
    fontSize: hp(1.8),
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: hp(1),
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginBottom: hp(2),
  },
  commentsList: {
    gap: hp(2.5),
  },
  noComments: {
    color: '#666',
    fontSize: hp(1.9),
    textAlign: 'center',
    marginTop: hp(2),
    fontStyle: 'italic',
  },
  notFound: {
    color: '#fff',
    fontSize: hp(2.2),
    fontWeight: '500',
  },
});