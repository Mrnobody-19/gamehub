import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { fetchNotifications } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import ScreenWrapper from '../../components/ScreenWrapper';
import NotificationItem from '../../components/NotificationItem';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Header from '../../components/Header';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  const getNotifications = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetchNotifications(user.id);
      if (res?.success) {
        setNotifications(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    getNotifications();
  }, [getNotifications]);

  return (
    <ScreenWrapper
      headerShown={false}
      statusBarColor="transparent"
      statusBarStyle="light"
      scrollEnabled={false}
      transparent={true}
    >
      <View style={styles.container}>
        <Header 
          title="Notifications"
          leftIcon="arrow-left"
          onLeftPress={() => router.back()}
          rightIcon="refresh"
          onRightPress={getNotifications}
          backgroundColor="rgba(0,0,0,0.7)"
          textColor="white"
          iconColor="white"
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              notifications.length === 0 && styles.emptyScrollContent
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={getNotifications}
                colors={['white']}
                tintColor="white"
              />
            }
          >
            {notifications.length > 0 ? (
              notifications.map(item => (
                <NotificationItem 
                  key={item.id} 
                  item={item} 
                  router={router}
                  backgroundColor="rgba(26, 26, 26, 0.8)"
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No notifications yet</Text>
                <Text style={styles.emptySubText}>
                  When you receive notifications, they&apos;ll appear here
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(4),
    gap: hp(1.8),
    backgroundColor: 'transparent',
  },
  emptyScrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: wp(8),
    backgroundColor: 'transparent',
  },
  emptyText: {
    fontSize: hp(2.2),
    color: 'white',
    fontWeight: '600',
    marginBottom: hp(1),
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: hp(1.8),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: hp(2.5),
  },
});

export default Notifications;