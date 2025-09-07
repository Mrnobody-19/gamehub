import { Pressable, View, StyleSheet } from "react-native";
import React from "react";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { hp, wp } from "../helpers/common";
import { theme } from "../constants/theme";
import Icon from "../assets/icons";
import Avatar from "./Avater";

const BottomBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const navigateTo = (route) => {
    router.push(route);
  };

  const isActive = (route) => {
    if (route === "/home") return pathname === "/home";
    if (route === "/notifications") return pathname === "/notifications";
    if (route === "/newPost") return pathname === "/newPost";
    if (route === "/messageList") return pathname === "/messageList";
    if (route === "/profile") return pathname === "/profile";
    return false;
  };

  return (
    <View style={styles.bottomBar}>
      <Pressable
        onPress={() => navigateTo("/home")}
        style={styles.bottomBarButton}
      >
        <View style={styles.iconContainer}>
          <Icon
            name="home"
            size={hp(3.2)}
            strokeWidth={isActive("/home") ? 3 : 2}
            color={isActive("/home") ? theme.colors.primary : "white"}
          />
          {isActive("/home") && <View style={styles.activeIndicator} />}
        </View>
      </Pressable>
      
      <Pressable
        onPress={() => navigateTo("/notifications")}
        style={styles.bottomBarButton}
      >
        <View style={styles.iconContainer}>
          <Icon
            name="heart"
            size={hp(3.2)}
            strokeWidth={isActive("/notifications") ? 3 : 2}
            color={isActive("/notifications") ? theme.colors.primary : "white"}
          />
          {isActive("/notifications") && <View style={styles.activeIndicator} />}
        </View>
      </Pressable>
      
      <Pressable
        onPress={() => navigateTo("/newPost")}
        style={styles.bottomBarButton}
      >
        <View style={styles.centralButton}>
          <Icon
            name="plus"
            size={hp(4)}
            strokeWidth={2}
            color="black"
          />
        </View>
      </Pressable>
      
      <Pressable
        onPress={() => navigateTo("/messageList")}
        style={styles.bottomBarButton}
      >
        <View style={styles.iconContainer}>
          <Icon
            name="mail"
            size={hp(3.2)}
            strokeWidth={isActive("/messageList") ? 3 : 2}
            color={isActive("/messageList") ? theme.colors.primary : "white"}
          />
          {isActive("/messageList") && <View style={styles.activeIndicator} />}
        </View>
      </Pressable>
      
      <Pressable
        onPress={() => navigateTo("/profile")}
        style={styles.bottomBarButton}
      >
        <View style={styles.iconContainer}>
          <Avatar
            uri={user?.image}
            size={hp(3.2)}
            rounded={hp(3.5) / 2}
            style={[
              styles.profileAvatar,
              isActive("/profile") && styles.activeProfileAvatar
            ]}
          />
          {isActive("/profile") && <View style={styles.activeIndicator} />}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    position: "absolute",
    bottom: hp(2),
    left: wp(8),
    right: wp(8),
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    borderRadius: hp(4),
    height: hp(7.5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  bottomBarButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -hp(0.8),
    width: hp(0.8),
    height: hp(0.8),
    borderRadius: hp(0.4),
    backgroundColor: theme.colors.primary,
  },
  centralButton: {
    width: hp(7),
    height: hp(7),
    borderRadius: hp(3.5),
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 15,
    marginTop: -hp(3),
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  profileAvatar: {
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeProfileAvatar: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
});

export default BottomBar;