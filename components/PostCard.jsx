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
    a: { ...textStyle, color: theme.colors.primary, textDecorationLine: 'underline' },
    h1: { ...textStyle, fontSize: hp(3), fontWeight: 'bold', marginVertical: hp(1) },
    h4: { ...textStyle, fontSize: hp(2.5), fontWeight: '600', marginVertical: hp(0.5) },
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
        <TouchableOpacity style={styles.userInfo} onPress={openPostDetails}>
          <Avater
            size={hp(5)}
            uri={item?.user?.image}
            rounded={theme.radius.lg}
            style={styles.avatar}
          />
          <View style={styles.userTextContainer}>
            <Text style={styles.username}>{item?.user?.name}</Text>
            <Text style={styles.time}>{moment(item?.created_at).fromNow()}</Text>
          </View>
        </TouchableOpacity>
        {showMoreIcon && (
          <TouchableOpacity 
            onPress={openPostDetails}
            style={styles.moreButton}
          >
            <Icon name="threeDotsHorizontal" size={hp(2.5)} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <TouchableOpacity onPress={openPostDetails} activeOpacity={0.9}>
        <View style={styles.content}>
          {item?.body && (
            <RenderHTML
              contentWidth={wp(85)}
              source={{ html: item.body }}
              tagsStyles={tagsStyles}
              baseStyle={{ paddingHorizontal: wp(1) }}
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
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.action} 
          onPress={onLike}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Icon
              name="heart"
              size={hp(3)}
              color={isLiked ? theme.colors.roses : "#888"}
              fill={isLiked ? theme.colors.roses : "transparent"}
            />
            {likes.length > 0 && (
              <Text style={[styles.count, isLiked && styles.likedCount]}>
                {likes.length}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.action} 
          onPress={openPostDetails}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Icon name="comment" size={hp(3)} color="#888" />
            {item?.comments?.[0]?.count > 0 && (
              <Text style={styles.count}>
                {item?.comments?.[0]?.count}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.action} 
          onPress={onShare}
          activeOpacity={0.7}
        >
          {loading ? (
            <Loading size="small" color="#888" />
          ) : (
            <View style={styles.iconContainer}>
              <Icon name="share" size={hp(3)} color="#888" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Edit/Delete (for user's posts) */}
      {showDelete && currentUser?.id === item?.userId && (
        <View style={styles.editActions}>
          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => onEdit(item)}
            activeOpacity={0.7}
          >
            <Icon name="edit" size={hp(2.5)} color={theme.colors.primary} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={handlePostDelete}
            activeOpacity={0.7}
          >
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
    borderRadius: 20,
    marginBottom: hp(2),
    padding: hp(2.5),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
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
    flex: 1,
  },
  userTextContainer: {
    flex: 1,
  },
  avatar: {
    marginRight: wp(3),
    borderWidth: 1.5,
    borderColor: '#f8f8f8',
  },
  username: {
    fontSize: hp(2.3),
    fontWeight: '600',
    color: "black",
  },
  time: {
    fontSize: hp(1.6),
    color: '#888',
    marginTop: hp(0.3),
  },
  moreButton: {
    padding: wp(1.5),
    borderRadius: 20,
  },
  content: {
    marginBottom: hp(1.5),
  },
  mediaImage: {
    width: '100%',
    height: hp(40),
    borderRadius: 16,
    marginTop: hp(1.5),
    backgroundColor: '#f8f8f8',
  },
  mediaVideo: {
    width: '100%',
    height: hp(40),
    borderRadius: 16,
    marginTop: hp(1.5),
    backgroundColor: '#f8f8f8',
  },
  footer: {
    flexDirection: 'row',
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    justifyContent: 'space-around',
  },
  action: {
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2),
    borderRadius: 12,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    marginLeft: wp(1.5),
    fontSize: hp(1.8),
    color: '#888',
    fontWeight: '500',
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
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
  },
  editText: {
    marginLeft: wp(1.5),
    color: theme.colors.primary,
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  deleteText: {
    marginLeft: wp(1.5),
    color: theme.colors.error,
    fontSize: hp(1.8),
    fontWeight: '500',
  },
});

export default PostCard;