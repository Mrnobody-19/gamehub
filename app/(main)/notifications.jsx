import { 
  Alert, 
  StyleSheet, 
  Pressable, 
  Text, 
  View, 
  ActivityIndicator, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl 
} from "react-native";
import React, { useState, useEffect } from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import Header from "../../components/Header";
import { theme } from "../../constants/theme";
import { hp, wp } from "../../helpers/common";
import BottomBar from "../../components/BottomBar";
import { fetchNotifications, markAsRead } from "../../services/notificationService";
import NotificationItem from "../../components/NotificationItem";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      const result = await fetchNotifications(user.id);

      if (result.success) {
        setNotifications(result.data);
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

    // ⚡ TODO: navigate based on notification.type (post, profile, etc.)
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

  if (loading && !refreshing) {
    return (
      <ScreenWrapper bg="black">
        <Header title="Notifications" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
        <BottomBar />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg="black">
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
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Header title="Notifications" showBackButton={true} />
            <TouchableOpacity
              onPress={loadNotifications}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handlePressNotification(item)}
          />
        )}
        ListEmptyComponent={error ? renderErrorState : renderEmptyState}
      />
      <BottomBar />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "black"
  },
  loadingText: {
    color: "white",
    marginTop: hp(2),
    fontSize: hp(1.8),
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(4),
    marginBottom: hp(1),
  },
  refreshButton: {
    padding: wp(2),
  },
  refreshButtonText: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: hp(12),
    backgroundColor: "black",
    minHeight: "100%",
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