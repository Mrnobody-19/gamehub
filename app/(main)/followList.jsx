import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl 
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAuth } from "../../contexts/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "../../components/Header";
import { theme } from "../../constants/theme";
import { hp, wp } from "../../helpers/common";
import Avatar from "../../components/Avater";
import { getFollowers, getFollowing } from "../../services/followServices";

const FollowList = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { type, userId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (type === "followers") {
        response = await getFollowers(userId || user?.id);
      } else {
        response = await getFollowing(userId || user?.id);
      }

      // Handle case where response is undefined
      if (!response) {
        throw new Error("No response from server");
      }

      // Handle both success/error response formats
      const data = response.data || response;
      
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Invalid data format received");
      }
    } catch (error) {
      console.error("Error in loadUsers:", error);
      setError(error.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [type, userId, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  }, [loadUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (loading && !refreshing) {
    return (
      <ScreenWrapper bg="black">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg="black">
      <Header 
        title={type === "followers" ? "Followers" : "Following"} 
        showBackButton={true} 
      />
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadUsers}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={users}
          contentContainerStyle={styles.listContainer}foll
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.userContainer}
             onPress={() => router.push({ 
    pathname: "profile", 
    params: { userId: item?.user?.id } 
  })}
            >
              <Avatar uri={item.image} size={hp(6)} rounded={hp(6)/2} />
              <View style={styles.userInfo}>
                <Text style={styles.username}>{item.name}</Text>
                <Text style={styles.userBio}>{item.bio || "No bio"}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {type === "followers" 
                  ? "No followers yet" 
                  : "Not following anyone"}
              </Text>
            </View>
          }
        />
      )}
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
  listContainer: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
    backgroundColor: "black",
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  userInfo: {
    marginLeft: wp(4),
  },
  username: {
    fontSize: hp(2),
    fontWeight: "bold",
    color: "white",
    marginBottom: hp(0.5),
  },
  userBio: {
    fontSize: hp(1.6),
    color: "#ccc",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: hp(20),
  },
  emptyText: {
    fontSize: hp(2),
    color: "#666",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(5),
  },
  errorText: {
    color: theme.colors.error,
    fontSize: hp(2),
    marginBottom: hp(2),
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    borderRadius: hp(1),
  },
  retryButtonText: {
    color: "white",
    fontSize: hp(1.8),
    fontWeight: "bold",
  },
});

export default FollowList;