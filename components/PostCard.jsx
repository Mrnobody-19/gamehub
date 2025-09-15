import { Alert, StyleSheet, Text, View, TouchableOpacity, Share, Animated, Easing } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { theme } from "../constants/theme";
import { hp, stripHtmlTags, wp } from "../helpers/common";
import Avater from "./Avater";
import Icon from "../assets/icons";
import { Image } from "expo-image";
import { downloadFile, getSupabaseFileUrl } from "../services/imageService";
import { Video, ResizeMode } from "expo-av";
import { createPostLike, removePostLike } from "../services/postService";
import Loading from "./Loading";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  
  const likeScale = useRef(new Animated.Value(1)).current;
  const videoRef = useRef(null);
  const captionText = stripHtmlTags(item?.body || "");
  const shouldTruncate = captionText.length > 100;

  useEffect(() => {
    setLikes(item?.postLikes || []);
    setIsLiked(item?.postLikes?.some(like => like.userId === currentUser?.id) || false);
  }, [item, currentUser]);

  const openPostDetails = () => showMoreIcon && router.push({ 
    pathname: "postDetails", 
    params: { postId: item?.id } 
  });

  const navigateToProfile = () => {
    router.push({ pathname: "profile", params: { userId: item?.user?.id } });
  };

  const animateLike = () => {
    Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1.3,
        duration: 150,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(likeScale, {
        toValue: 1,
        duration: 150,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onLike = async () => {
    if (!currentUser) {
      Alert.alert("Sign In Required", "You need to be logged in to like posts.");
      return;
    }
    
    animateLike();
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
    const content = { 
      message: `${stripHtmlTags(item?.body)}\n\nShared via AppName`, 
      title: 'Check out this post!'
    };
    
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
    
    try {
      await Share.share(content);
    } catch (error) {
      console.log("Sharing error:", error);
    }
  };

  const handlePostDelete = () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: () => onDelete(item), style: "destructive" }
    ]);
  };

  const toggleVideoPlayback = () => {
    if (item?.file && item.file.includes("postVideos")) {
      if (isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleCaption = () => {
    setShowFullCaption(!showFullCaption);
  };

  return (
    <View style={[styles.card, hasShadow && styles.shadow]}>
      <TouchableOpacity onPress={openPostDetails} activeOpacity={0.9}>
        <View style={styles.mediaContainer}>
          {item?.file && item.file.includes("postImage") && (
            <Image
              source={getSupabaseFileUrl(item.file)}
              style={styles.media}
              contentFit="cover"
              transition={200}
              priority="high"
            />
          )}

          {item?.file && item.file.includes("postVideos") && (
            <View>
              <Video
                ref={videoRef}
                source={getSupabaseFileUrl(item.file)}
                style={styles.media}
                useNativeControls={false}
                resizeMode={ResizeMode.COVER}
                isLooping
                onPlaybackStatusUpdate={(status) => {
                  setIsPlaying(status.isPlaying);
                }}
              />
              <TouchableOpacity 
                style={styles.videoPlayButton} 
                onPress={toggleVideoPlayback}
                activeOpacity={0.8}
              >
                <BlurView intensity={80} tint="dark" style={styles.playButtonBlur}>
                  <Icon 
                    name={isPlaying ? "pause" : "play"} 
                    size={hp(3)} 
                    color="#fff" 
                  />
                </BlurView>
              </TouchableOpacity>
            </View>
          )}

          {/* Top gradient overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={styles.topGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          {/* Header overlay */}
          <View style={styles.headerOverlay}>
            <TouchableOpacity 
              style={styles.userInfo}
              onPress={navigateToProfile}
              activeOpacity={0.8}
            >
              <Avater
                size={hp(4.5)}
                uri={item?.user?.image}
                rounded={theme.radius.lg}
                style={styles.avatar}
              />
              <BlurView intensity={50} tint="dark" style={styles.blurUsername}>
                <Text style={styles.username}>{item?.user?.name}</Text>
              </BlurView>
            </TouchableOpacity>
            {showMoreIcon && (
              <TouchableOpacity onPress={openPostDetails} style={styles.moreButton}>
                <BlurView intensity={80} tint="dark" style={styles.moreButtonBlur}>
                  <Icon name="threeDotsHorizontal" size={hp(2.2)} color="#fff" />
                </BlurView>
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.bottomGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          {/* Footer overlay */}
          <View style={styles.footerOverlay}>
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={onLike} activeOpacity={0.7}>
                <Animated.View style={[styles.iconContainer, { transform: [{ scale: likeScale }] }]}>
                  <Icon
                    name="heart"
                    size={hp(2.8)}
                    color={isLiked ? theme.colors.roses : "#fff"}
                    fill={isLiked ? theme.colors.roses : "transparent"}
                  />
                  {likes.length > 0 && (
                    <Text style={styles.count}>{likes.length}</Text>
                  )}
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity onPress={openPostDetails} activeOpacity={0.7}>
                <View style={styles.iconContainer}>
                  <Icon name="comment" size={hp(2.8)} color="#fff" />
                  {item?.comments?.[0]?.count > 0 && (
                    <Text style={styles.count}>{item?.comments?.[0]?.count}</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={onShare} activeOpacity={0.7}>
                {loading ? (
                  <Loading size="small" color="#fff" />
                ) : (
                  <Icon name="share" size={hp(2.8)} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Caption */}
            {captionText && (
              <TouchableOpacity 
                onPress={shouldTruncate ? toggleCaption : null}
                activeOpacity={shouldTruncate ? 0.7 : 1}
              >
                <BlurView intensity={50} tint="dark" style={styles.blurCaption}>
                  <Text style={styles.caption} numberOfLines={showFullCaption ? 0 : 2}>
                    {captionText}
                  </Text>
                  {shouldTruncate && (
                    <Text style={styles.readMore}>
                      {showFullCaption ? "Show less" : "Read more"}
                    </Text>
                  )}
                </BlurView>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Edit/Delete (for user's own posts) */}
      {showDelete && currentUser?.id === item?.userId && (
        <View style={styles.editActions}>
          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => onEdit(item)} 
            activeOpacity={0.7}
          >
            <Icon name="edit" size={hp(2.2)} color={theme.colors.primary} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={handlePostDelete} 
            activeOpacity={0.7}
          >
            <Icon name="delete" size={hp(2.2)} color={theme.colors.error} />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: hp(2.5),
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  mediaContainer: {
    position: "relative",
    width: "100%",
    height: hp(55),
    borderRadius: 24,
    overflow: "hidden",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: hp(15),
    zIndex: 1,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(20),
    zIndex: 1,
  },
  headerOverlay: {
    position: "absolute",
    top: hp(2),
    left: wp(4),
    right: wp(4),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    marginRight: wp(2),
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  username: {
    color: "#fff",
    fontSize: hp(1.9),
    fontWeight: "600",
  },
  blurUsername: {
    borderRadius: 20,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    marginLeft: wp(1.5),
    overflow: 'hidden',
  },
  moreButton: {
    padding: wp(1),
    borderRadius: 20,
  },
  moreButtonBlur: {
    borderRadius: 20,
    padding: wp(1.5),
    overflow: 'hidden',
  },
  footerOverlay: {
    position: "absolute",
    bottom: hp(2),
    left: wp(4),
    right: wp(4),
    zIndex: 2,
  },
  actionsRow: {
    flexDirection: "row",
    marginBottom: hp(1.5),
    gap: wp(5),
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp(1),
  },
  count: {
    marginLeft: wp(1.2),
    fontSize: hp(1.7),
    color: "#fff",
    fontWeight: "600",
  },
  blurCaption: {
    borderRadius: 19,
    padding: wp(3),
    overflow: 'hidden',
  },
  caption: {
    color: "#fff",
    fontSize: hp(1.9),
    fontWeight: "400",
    lineHeight: hp(2.4),
  },
  readMore: {
    color: "rgba(255,255,255,0.7)",
    fontSize: hp(1.7),
    fontWeight: "500",
    marginTop: hp(0.5),
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: wp(3),
    gap: wp(4),
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: 10,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: 10,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  editText: {
    marginLeft: wp(1.5),
    color: theme.colors.primary,
    fontSize: hp(1.7),
    fontWeight: "500",
  },
  deleteText: {
    marginLeft: wp(1.5),
    color: theme.colors.error,
    fontSize: hp(1.7),
    fontWeight: "500",
  },
  videoPlayButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -hp(3.5) }, { translateY: -hp(3.5) }],
    zIndex: 3,
  },
  playButtonBlur: {
    width: hp(7),
    height: hp(7),
    borderRadius: hp(3.5),
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden',
  },
});

export default PostCard;