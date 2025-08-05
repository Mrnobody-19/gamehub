import { Video } from "expo-av";
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
  View
} from "react-native";
import Icon from "../../assets/icons";
import Avatar from "../../components/Avater";
import Button from "../../components/Button";
import Header from "../../components/Header";
import RichTextEditor from "../../components/RichTextEditor";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { hp, wp } from "../../helpers/common";
import { getSupabaseFileUrl } from "../../services/imageService";
import { createOrUpdatePost } from "../../services/postService";

const NewPost = () => {
  const post = useLocalSearchParams();
  const { user } = useAuth();
  const bodyRef = useRef("");
  const editorRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (post && post.id) {
      bodyRef.current = post.body;
      setFile(post.file || null);
      setTimeout(() => {
        editorRef?.current?.setContentHTML(post.body);
      }, 300);
    }
  }, [post]);

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

  return (
    <ScreenWrapper bg="black">
      <View style={styles.container}>
        <Header title="Create Post" showBackButton={true} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
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
          <View style={styles.textEditorContainer}>
            <RichTextEditor
              editorRef={editorRef}
              onChange={(body) => (bodyRef.current = body)}
              placeholder="What's on your mind?"
              placeholderTextColor="#666"
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
                  resizeMode="cover"
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
                onPress={() => setFile(null)}
              >
                <Icon name="delete" size={20} color="white" />
              </Pressable>
            </View>
          )}

          {/* Media options */}
          <View style={styles.mediaOptions}>
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
          </View>
        </ScrollView>

        {/* Post button */}
        <Button
          ButtonStyle={styles.postButton}
          title={post && post.id ? "Update" : "Post"}
          loading={loading}
          hasShadow={false}
          onPress={onSubmit}
        />
      </View>
    </ScreenWrapper>
  );
};

export default NewPost;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: wp(4),
  },
  scrollContainer: {
    paddingBottom: 20,
    gap: 25,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 10,
  },
  avatar: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  userInfo: {
    gap: 5,
  },
  username: {
    fontSize: hp(2.1),
    fontWeight: theme.fonts.bold,
    color: "white",
  },
  privacyBadge: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  publicText: {
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
    color: "#aaa",
  },
  textEditorContainer: {
    minHeight: 150,
    backgroundColor: "#111",
    borderRadius: theme.radius.lg,
    padding: 15,
  },
  mediaOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: "#333",
  },
  addImageText: {
    fontSize: hp(1.9),
    fontWeight: theme.fonts.semibold,
    color: "white",
  },
  mediaIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  mediaButton: {
    padding: 8,
    backgroundColor: "#111",
    borderRadius: 10,
  },
  mediaPreview: {
    height: hp(35),
    width: "100%",
    borderRadius: theme.radius.lg,
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
    top: 15,
    right: 15,
    padding: 8,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 1,
    borderColor: "#444",
  },
  postButton: {
    height: hp(6.5),
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    marginBottom: hp(2),
  },
});