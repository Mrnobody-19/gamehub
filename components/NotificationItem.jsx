// components/NotificationItem.jsx
import { StyleSheet, Text, View, Pressable } from "react-native";
import React from "react";
import { hp, wp } from "../helpers/common";
import { theme } from "../constants/theme";
import Avatar from "./Avater";

const NotificationItem = ({ notification, onPress }) => {
  if (!notification) return null;

  const getNotificationText = () => {
    switch (notification.type) {
      case "like":
        return "liked your post";
      case "comment":
        return "commented on your post";
      case "follow":
        return "started following you";
      default:
        return "interacted with your content";
    }
  };

  return (
    <Pressable
      style={[
        styles.container,
        !notification.read && styles.unreadContainer,
      ]}
      onPress={onPress}
    >
      {/* Avatar + Badge */}
      <View style={styles.avatarContainer}>
        <Avatar
          uri={notification?.sender?.image}
          size={hp(5)}
          rounded={hp(5) / 2}
        />
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor:
                notification.type === "like"
                  ? "#FF375F"
                  : notification.type === "comment"
                  ? "#4ECDC4"
                  : notification.type === "follow"
                  ? "#6A5ACD"
                  : "#888",
            },
          ]}
        >
          <Text style={styles.iconText}>
            {notification.type === "like"
              ? "♥"
              : notification.type === "comment"
              ? "💬"
              : notification.type === "follow"
              ? "👤"
              : "🔔"}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.boldText}>
            {notification.sender?.name || "Someone"}
          </Text>{" "}
          {getNotificationText()}
        </Text>
        <Text style={styles.time}>{notification.timeAgo || "recently"}</Text>
      </View>

      {/* Unread dot */}
      {!notification.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
};

export default NotificationItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(4),
    backgroundColor: "#000",
    borderBottomWidth: 0.6,
    borderBottomColor: "#222",
  },
  unreadContainer: {
    backgroundColor: "rgba(0, 122, 255, 0.12)", // subtle blue highlight for unread
  },
  avatarContainer: {
    position: "relative",
    marginRight: wp(3),
  },
  iconBadge: {
    position: "absolute",
    bottom: -hp(0.5),
    right: -hp(0.5),
    borderRadius: hp(1.2),
    padding: hp(0.3),
    borderWidth: 1.5,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    minWidth: hp(2.4),
    minHeight: hp(2.4),
  },
  iconText: {
    color: "white",
    fontSize: hp(1.4),
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  text: {
    color: "white",
    fontSize: hp(1.9),
    lineHeight: hp(2.3),
  },
  boldText: {
    fontWeight: "700",
    color: "#fff",
  },
  time: {
    color: "#aaa",
    fontSize: hp(1.5),
    marginTop: hp(0.5),
  },
  unreadDot: {
    width: hp(1.2),
    height: hp(1.2),
    borderRadius: hp(0.6),
    backgroundColor: theme.colors.primary,
    marginLeft: wp(2),
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    elevation: 5,
  },
});
