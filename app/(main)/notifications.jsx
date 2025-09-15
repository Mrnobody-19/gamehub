// app/screens/Notifications.jsx
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect } from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../../components/Header";
import { theme } from "../../constants/theme";
import { hp, wp } from "../../helpers/common";
import BottomBar from "../../components/BottomBar";
import {
  fetchNotifications,
  markAsRead,
} from "../../services/notificationService";
import NotificationItem from "../../components/NotificationItem";
import { supabase } from "../../lib/supabase";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadNotifications();
  }, []);

  // --- Realtime subscription ---
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `receiverId=eq.${user.id}`,
        },
        (payload) => {
          console.log("[Realtime] New notification:", payload.new);

          setNotifications((prev) => [
            {
              ...payload.new,
              sender: payload.new.sender || null,
              timeAgo: "just now",
            },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      setError(null);
      if (!user?.id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await fetchNotifications(user.id);

      if (result.success) {
        setNotifications(result.data || []);
      } else {
        setError(result.msg || "Failed to load notifications");
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
      setError("An error occurred while loading notifications");
    } finally {
      setLoading(false);
    }
  };

  const handlePressNotification = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    }

    // TODO: Add navigation (e.g., to PostDetail or Profile)
    console.log("Notification pressed:", notification);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No notifications yet</Text>
      <Text style={styles.emptyStateSubText}>
        When someone interacts with your content, you'll see it here.
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={loadNotifications} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper bg="black">
      <Header title="Notifications" showBackButton={true} />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={notifications}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item, index) =>
            item?.id?.toString() || index.toString()
          }
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => handlePressNotification(item)}
            />
          )}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      <BottomBar />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  loadingText: {
    color: "white",
    marginTop: hp(2),
    fontSize: hp(1.8),
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: hp(12),
    backgroundColor: "black",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: hp(20),
    paddingHorizontal: wp(4),
  },
  emptyStateText: {
    color: "white",
    fontSize: hp(2.2),
    fontWeight: "600",
    marginBottom: hp(1),
    textAlign: "center",
  },
  emptyStateSubText: {
    color: theme.colors.textSecondary,
    fontSize: hp(1.8),
    textAlign: "center",
    lineHeight: hp(2.4),
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: hp(20),
    paddingHorizontal: wp(4),
  },
  errorText: {
    color: theme.colors.error,
    fontSize: hp(1.8),
    marginBottom: hp(2),
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1),
    paddingHorizontal: wp(6),
    borderRadius: hp(1),
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: hp(1.8),
  },
});

export default Notifications;
