import { Alert, StyleSheet, Pressable, Text, View, } from "react-native";
import React, { useState } from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header";
import { theme } from "../../constants/theme";
import { TouchableOpacity } from "react-native";
import Icon from "../../assets/icons";
import { hp, wp } from "../../helpers/common";
import Avater from "../../components/Avater";
import { fetchPosts } from "../../services/postService";
import PostCard from "../../components/PostCard";
import { FlatList } from 'react-native';
import Loading from "../../components/Loading";

var limit = 0;

const Profile = () => {
  const { user, setAuth } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const onLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Sign out", "Error signing out!");
    }
  };

  const getPosts = async () => {
    if (!hasMore) return;

    limit += 4;
    console.log("Fetching post:", limit);

    let res = await fetchPosts(limit, user.id);
    if (res.success) {
      if (posts.length === res.data.length) {
        setHasMore(false);
      }
      setPosts(res.data);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Confirm", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        onPress: () => console.log("modal cancelled"),
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: () => onLogout(),
        style: "destructive",
      },
    ]);
  };

  return (
      <ScreenWrapper bg="black">
        <FlatList
          data={posts}
          ListHeaderComponent={<UserHeader user={user} router={router} handleLogout={handleLogout} />}
          ListHeaderComponentStyle={{ marginBottom: 30 }}
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
        />
      </ScreenWrapper>
  );
};

const UserHeader = ({ user, router, handleLogout }) => {
  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <View style={styles.headerContainer}>
        <Header title="Profile" showBackButton={true} />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" color={theme.colors.roses} />
        </TouchableOpacity>
      </View>

      <View style={{ gap: 15 }}>
        <View style={styles.avaterContainer}>
          <Avater uri={user?.image} size={hp(12)} rounded={theme.radius.xxl * 1.4} />
          <Pressable
            style={styles.editIcons}
            onPress={() => router.push("editProfile")}
          >
            <Icon name="edit" strokeWidth={2.5} size={20} color="white" />
          </Pressable>
        </View>

        <View style={{ alignItems: "center", gap: 4 }}>
          <Text style={styles.username}>{user && user.name}</Text>
          <Text style={styles.infoText}>{user && user.address}</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Icon name="mail" size={20} color={theme.colors.roses} />
            <Text style={styles.infoText}>{user && user.email}</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="call" size={20} color={theme.colors.roses} />
            <Text style={styles.infoText}>{user && user.phoneNumber}</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="user" size={20} color={theme.colors.roses} />
            <Text style={styles.infoText}>{user && user.bio}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flex: 1,
    paddingHorizontal: wp(4)
  },
  headerContainer: {
    marginHorizontal: wp(4),
    marginBottom: 20,
  },
  avaterContainer: {
    height: hp(12),
    width: hp(12),
    alignSelf: "center",
    position: 'relative',
    marginTop: hp(2)
  },
  editIcons: {
    position: "absolute",
    bottom: 0,
    right: 12,
    padding: 7,
    borderRadius: 58,
    backgroundColor: theme.colors.roses,
    shadowColor: theme.colors.roses,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 7,
  },
  username: {
    fontSize: hp(3),
    fontWeight: "600",
    color: "white",
    fontStyle: "italic",
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 10
  },
  infoContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: theme.radius.lg,
    padding: wp(5),
    marginTop: hp(2),
    marginHorizontal: wp(2)
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: hp(0.5),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoText: {
    fontSize: hp(1.8),
    fontWeight: "400",
    color: "#ccc",
    flex: 1,
    flexWrap: 'wrap'
  },
  logoutButton: {
    position: "absolute",
    right: 0,
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: theme.colors.roses
  },
  listStyle: {
    paddingHorizontal: wp(4),
    paddingBottom: 30,
    backgroundColor: 'black'
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: "center",
    color: "#666",
    fontStyle: 'italic'
  }
});