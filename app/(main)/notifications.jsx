// components/MessageList.jsx
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../components/notificationListStyles';
import { useAuth } from '../../contexts/AuthContext';
import { fetchNotifications } from '../../services/notificationService';
import Avater from '../../components/Avater';
import { hp } from '../../helpers/common';
import { theme } from '../../constants/theme';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      const result = await fetchNotifications(user.id);
      
      if (result.success) {
        setNotifications(result.data);
      } else {
        setError(result.msg || 'Failed to load notifications');
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('An error occurred while loading notifications');
    } finally {
      setLoading(false);
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity style={styles.notificationItem}>
      <View style={styles.avatarContainer}>
        {item.sender?.image ? (
          <Avater
            size={hp(5)}
            uri={item?.user?.image}
            rounded={theme.radius.lg}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.sender?.name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.messageText}>
          <Text style={styles.senderName}>
            {item.sender?.name || 'Someone'}
          </Text>
          {' '}
          {item.title}
        </Text>
        
        {item.postImage && (
          <Image 
            source={{ uri: item.postImage }} 
            style={styles.postImage}
          />
        )}
        
        <Text style={styles.timeText}>
          {item.timeAgo}
        </Text>
      </View>
      
      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  if (error) {
    return renderErrorState();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={loadNotifications} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Notifications;