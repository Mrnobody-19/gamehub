/* eslint-disable import/no-duplicates */
import { Alert, StyleSheet, Pressable, Text, View, ImageBackground } from "react-native";
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

// Background image import
const backgroundImage = require('../../assets/images/bg 7.jpg'); // Update with the actual path to your background image

let limit = 0;

const Profile = () => {
  const { user } = useAuth();
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
    // show confirm modal
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
    <ImageBackground source={backgroundImage} style={styles.background}>
      <ScreenWrapper bg="transparent">
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
    </ImageBackground>
  );
};

const UserHeader = ({ user, router, handleLogout }) => {
  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <View>
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
            <Icon name="edit" strokeWidth={2.5} size={20} />
          </Pressable>
        </View>

        {/*username*/}

        <View style={{ alignItems: "center", gap: 4 }}>
          <Text style={styles.username}>{user && user.name}</Text>
          <Text style={styles.infoText}>{user && user.address}</Text>
        </View>

        {/* email, phone, bio */}
        <View style={{ gap: 10 }}>
          <View style={styles.info}>
            <Icon name="mail" size={20} color={theme.colors.textlight} />
            <Text style={styles.infoText}>{user && user.email}</Text>
          </View>
          <View style={styles.info}>
            <Icon name="call" size={20} color={theme.colors.textlight} />
            <Text style={styles.infoText}>{user && user.phoneNumber}</Text>
          </View>
          <View style={styles.info}>
            <Icon name="user" size={20} color={theme.colors.textlight} />
            <Text style={styles.infoText}>{user && user.bio}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    marginHorizontal: wp(4),
    marginBottom: 20,
  },
  headerShape: {
    width: wp(100),
    height: hp(20),
  },
  avaterContainer: {
    height: hp(12),
    width: hp(12),
    alignSelf: "center",
  },

  editIcons: {
    position: "absolute",
    bottom: 0,
    right: 12,
    padding: 7,
    borderRadius: 58,
    backgroundColor: "white",
    shadowColor: theme.colors.textlight,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 7,
  },

  username: {
    fontSize: hp(3),
    fontWeight: "500",
    color: theme.colors.text,
    fontStyle: "italic",
  },

  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    color: theme.colors.text,
  },

  infoText: {
    fontSize: hp(1.6),
    fontWeight: "500",
    color: theme.colors.textlight,
  },

  logoutButton: {
    position: "absolute",
    right: 0,
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: "#fee2e2",
  },

  listStyle: {
    paddingHorizontal: wp(4),
    paddingBottom: 30,
  },

  noPost: {
    fontSize: hp(2),
    textAlign: "center",
    color: theme.colors.text,
  },
});
