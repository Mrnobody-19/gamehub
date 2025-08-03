import { Alert, StyleSheet, Text, View, TouchableOpacity, Share } from "react-native";
import React, { useEffect, useState } from "react";
import { theme } from "../constants/theme";
import { hp, stripHtmlTags, wp } from "../helpers/common";
import Avater from "./Avater";
import moment from "moment";
import Icon from "../assets/icons";
import RenderHTML from "react-native-render-html";
import { Image } from "expo-image";
import { downloadFile, getSupabaseFileUrl } from "../services/imageService";
import { Video } from "expo-av";
import { createPostLike, removePostLike } from "../services/postService";
import Loading from "./Loading";

const PostCard = ({
  item,
  currentUser,
  router,
  hasShadow = true,
  showMoreIcon = true,
  showDelete = false,
  onDelete = () => {},
  onEdit = () => {},
}) => {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    setLikes(item?.postLikes || []);
    setIsLiked(item?.postLikes?.some(like => like.userId === currentUser?.id) || false);
  }, [item, currentUser]);

  const textStyle = {
    color: theme.colors.dark,
    fontSize: hp(2.2),
    lineHeight: hp(3),
  };

  const tagsStyles = {
    body: textStyle,
    p: textStyle,
    div: textStyle,
    a: { ...textStyle, color: theme.colors.primary },
    h1: { ...textStyle, fontSize: hp(3), fontWeight: 'bold' },
    h4: { ...textStyle, fontSize: hp(2.5), fontWeight: '600' },
  };

  const openPostDetails = () => showMoreIcon && router.push({ 
    pathname: "postDetails", 
    params: { postId: item?.id } 
  });

  const onLike = async () => {
    if (!currentUser) return Alert.alert("Error", "You need to be logged in to like a post.");
    
    setIsLiked(!isLiked);
    if (isLiked) {
      setLikes(likes.filter(like => like.userId !== currentUser.id));
      await removePostLike(item.id, currentUser.id);
    } else {
      setLikes([...likes, { userId: currentUser.id, postId: item.id }]);
      await createPostLike({ userId: currentUser.id, postId: item.id });
    }
  };

  const onShare = async () => {
    const content = { message: stripHtmlTags(item?.body) };
    if (item?.file) {
      setLoading(true);
      try {
        content.url = await downloadFile(getSupabaseFileUrl(item.file).url);
      } catch (_error) {
        Alert.alert("Share Error", "Could not download file.");
      } finally {
        setLoading(false);
      }
    }
    await Share.share(content);
  };

  const handlePostDelete = () => {
    Alert.alert("Confirm", "Delete this post?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: () => onDelete(item), style: "destructive" }
    ]);
  };

  return (
    <View style={[styles.card, hasShadow && styles.shadow]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avater
            size={hp(5)}
            uri={item?.user?.image}
            rounded={theme.radius.lg}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>{item?.user?.name}</Text>
            <Text style={styles.time}>{moment(item?.created_at).fromNow()}</Text>
          </View>
        </View>
        {showMoreIcon && (
          <TouchableOpacity onPress={openPostDetails}>
            <Icon name="threeDotsHorizontal" size={hp(3)} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {item?.body && (
          <RenderHTML
            contentWidth={wp(85)}
            source={{ html: item.body }}
            tagsStyles={tagsStyles}
          />
        )}
        
        {item?.file && item.file.includes("postImage") && (
          <Image
            source={getSupabaseFileUrl(item.file)}
            style={styles.mediaImage}
            contentFit="cover"
            transition={200}
          />
        )}

        {item?.file && item.file.includes("postVideos") && (
          <Video
            source={getSupabaseFileUrl(item.file)}
            style={styles.mediaVideo}
            useNativeControls
            resizeMode="cover"
          />
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.action} onPress={onLike}>
          <Icon
            name="heart"
            size={hp(3)}
            color={isLiked ? theme.colors.roses : "#888"}
            fill={isLiked ? theme.colors.roses : "transparent"}
          />
          <Text style={[styles.count, isLiked && styles.likedCount]}>
            {likes.length || ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={openPostDetails}>
          <Icon name="comment" size={hp(3)} color="#888" />
          <Text style={styles.count}>
            {item?.comments?.[0]?.count || ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={onShare}>
          {loading ? (
            <Loading size="small" color="#888" />
          ) : (
            <Icon name="share" size={hp(3)} color="#888" />
          )}
        </TouchableOpacity>
      </View>

      {/* Edit/Delete (for user's posts) */}
      {showDelete && currentUser?.id === item?.userId && (
        <View style={styles.editActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)}>
            <Icon name="edit" size={hp(2.5)} color={theme.colors.primary} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handlePostDelete}>
            <Icon name="delete" size={hp(2.5)} color={theme.colors.error} />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: hp(2),
    padding: hp(2),
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: wp(3),
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  username: {
    fontSize: hp(2.3),
    fontWeight: '600',
    color: theme.colors.dark,
  },
  time: {
    fontSize: hp(1.6),
    color: '#888',
    marginTop: hp(0.3),
  },
  content: {
    marginBottom: hp(1.5),
  },
  mediaImage: {
    width: '100%',
    height: hp(40),
    borderRadius: 12,
    marginTop: hp(1.5),
    backgroundColor: '#f5f5f5',
  },
  mediaVideo: {
    width: '100%',
    height: hp(40),
    borderRadius: 12,
    marginTop: hp(1.5),
    backgroundColor: '#f5f5f5',
  },
  footer: {
    flexDirection: 'row',
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(8),
  },
  count: {
    marginLeft: wp(1),
    fontSize: hp(1.8),
    color: '#888',
  },
  likedCount: {
    color: theme.colors.roses,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: hp(1),
    gap: wp(4),
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(2),
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(2),
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  editText: {
    marginLeft: wp(1),
    color: theme.colors.primary,
    fontSize: hp(1.8),
  },
  deleteText: {
    marginLeft: wp(1),
    color: theme.colors.error,
    fontSize: hp(1.8),
  },
});

export default PostCard;