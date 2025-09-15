import { Video, ResizeMode } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions
} from "react-native";
import Icon from "../../assets/icons";
import Avatar from "../../components/Avater";
import Button from "../../components/Button"
import Header from "../../components/Header";
import RichTextEditor from "../../components/RichTextEditor";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { hp, wp } from "../../helpers/common";
import { getSupabaseFileUrl } from "../../services/imageService";
import { createOrUpdatePost } from "../../services/postService";
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const NewPost = () => {
  const post = useLocalSearchParams();
  const { user } = useAuth();
  const bodyRef = useRef("");
  const editorRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (post && post.id) {
      bodyRef.current = post.body;
      setFile(post.file || null);
      setTimeout(() => {
        editorRef?.current?.setContentHTML(post.body);
      }, 300);
    }
  }, [post]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const onPick = async (isImage) => {
    let mediaConfig = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    };
    if (!isImage) {
      mediaConfig = {
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
      };
    }
    let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);

    if (!result.canceled && result.assets.length > 0) {
      setFile(result.assets[0]);
    }
  };

  const isLocalFile = (file) => {
    if (!file) return false;
    return typeof file === "object";
  };

  const getFileType = (file) => {
    if (!file) return null;
    if (isLocalFile(file)) {
      return file.type;
    }
    if (file.includes("postImage")) {
      return "image";
    }
    return "video";
  };

  const getFileUri = (file) => {
    if (!file) return null;
    if (isLocalFile(file)) {
      return file.uri;
    }
    return getSupabaseFileUrl(file)?.uri;
  };

  const onSubmit = async () => {
    if (!bodyRef.current && !file) {
      Alert.alert("Post", "Please choose an image or add post body.");
      return;
    }

    const data = {
      file,
      body: bodyRef.current,
      userId: user?.id,
    };

    if (post && post.id) data.id = post.id;

    setLoading(true);
    const res = await createOrUpdatePost(data);
    setLoading(false);

    if (res.success) {
      setFile(null);
      bodyRef.current = "";
      editorRef.current?.setContentHTML("");
      router.back();
    } else {
      Alert.alert("Post", res.msg);
    }
  };

  const removeMedia = () => {
    Alert.alert(
      "Remove Media",
      "Are you sure you want to remove this media?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", onPress: () => setFile(null), style: "destructive" }
      ]
    );
  };

  return (
    <ScreenWrapper bg="black">
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Header title={post && post.id ? "Edit Post" : "Create Post"} showBackButton={true} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* User header */}
          <View style={styles.header}>
            <Avatar
              uri={user?.image}
              size={hp(6.5)}
              rounded={theme.radius.xxl}
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.username}>{user && user.name}</Text>
              <View style={styles.privacyBadge}>
                <Text style={styles.publicText}>Public</Text>
              </View>
            </View>
          </View>

          {/* Text editor */}
          <View style={[styles.textEditorContainer, isFocused && styles.textEditorFocused]}>
            <RichTextEditor
              editorRef={editorRef}
              onChange={(body) => (bodyRef.current = body)}
              placeholder="What's on your mind?"
              placeholderTextColor="#666"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>

          {/* Media preview */}
          {file && (
            <View style={styles.mediaPreview}>
              {getFileType(file) === "video" ? (
                <Video
                  style={styles.mediaContent}
                  source={{ uri: getFileUri(file) }}
                  useNativeControls
                  resizeMode={ResizeMode.COVER}
                  isLooping
                />
              ) : (
                <Image
                  source={{ uri: getFileUri(file) }}
                  resizeMode="cover"
                  style={styles.mediaContent}
                />
              )}
              <Pressable
                style={styles.closeIcon}
                onPress={removeMedia}
              >
                <Icon name="delete" size={20} color="white" />
              </Pressable>
            </View>
          )}

          {/* Media options */}
          <LinearGradient
            colors={['rgba(26,26,26,0.9)', 'rgba(26,26,26,0.7)']}
            style={styles.mediaOptions}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.addImageText}>Add to your post</Text>
            <View style={styles.mediaIcons}>
              <TouchableOpacity 
                style={styles.mediaButton}
                onPress={() => onPick(true)}
              >
                <Icon name="image" size={30} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.mediaButton}
                onPress={() => onPick(false)}
              >
                <Icon name="video" size={30} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ScrollView>

        <Button
          ButtonStyle={[styles.postButton, (!bodyRef.current && !file) && styles.postButtonDisabled]}
          title={post && post.id ? "Update" : "Post"}
          loading={loading}
          hasShadow={true}
          onPress={onSubmit}
          disabled={!bodyRef.current && !file}
        />
      </Animated.View>
    </ScreenWrapper>
  );
};

export default NewPost;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContainer: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(12),
    gap: hp(3),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(4),
    marginTop: hp(1),
    paddingVertical: hp(1),
  },
  avatar: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  userInfo: {
    gap: hp(0.5),
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: "white",
    letterSpacing: 0.3,
  },
  privacyBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.lg,
  },
  publicText: {
    fontSize: hp(1.5),
    fontWeight: '500',
    color: "#aaa",
  },
  textEditorContainer: {
    minHeight: hp(20),
    backgroundColor: "#111",
    borderRadius: theme.radius.xl,
    padding: wp(4),
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  textEditorFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: "#1a1a1a",
  },
  mediaOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: wp(4),
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: "#333",
  },
  addImageText: {
    fontSize: hp(1.9),
    fontWeight: '600',
    color: "white",
  },
  mediaIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(4),
  },
  mediaButton: {
    padding: wp(2.5),
    backgroundColor: "#111",
    borderRadius: theme.radius.lg,
  },
  mediaPreview: {
    height: hp(35),
    width: "100%",
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
  },
  mediaContent: {
    flex: 1,
    width: "100%",
  },
  closeIcon: {
    position: "absolute",
    top: wp(3),
    right: wp(3),
    padding: wp(2),
    borderRadius: wp(3),
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 1,
    borderColor: "#444",
  },
  postButton: {
    position: 'absolute',
    bottom: hp(2),
    left: wp(4),
    right: wp(4),
    height: hp(6.5),
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  postButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.7,
  },
});