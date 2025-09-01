// components/NotificationItem.jsx
import { StyleSheet, Text, View, Pressable } from 'react-native'
import React from 'react'
import { hp, wp } from '../helpers/common'
import { theme } from '../constants/theme'
import Avatar from './Avater'
import { Image } from 'expo-image'

const NotificationItem = ({ notification, onPress }) => {
  if (!notification) return null;

  const getNotificationText = () => {
    switch (notification.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      default:
        return 'interacted with your content';
    }
  };

  return (
    <Pressable 
      style={[styles.container, !notification.read && styles.unreadContainer]}
      onPress={onPress}
    >
      <View style={styles.avatarContainer}>
        <Avatar
          uri={notification?.sender?.image} 
          size={hp(5)} 
          rounded={hp(5)/2}
        />
        <View style={[
          styles.iconBadge,
          { backgroundColor: notification.type === 'like' ? '#FF375F' : 
                            notification.type === 'comment' ? '#4ECDC4' : 
                            notification.type === 'follow' ? '#6A5ACD' : '#888' }
        ]}>
          <Text style={styles.iconText}>
            {notification.type === 'like' ? '♥' : 
             notification.type === 'comment' ? '💬' : 
             notification.type === 'follow' ? '👤' : '🔔'}
          </Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.boldText}>
            {notification.sender?.id || 'Someone'}
          </Text>
          {` ${getNotificationText()}`}
        </Text>
        <Text style={styles.time}>
          {notification.timeAgo || 'recently'}
        </Text>
      </View>
      
      {!notification.read && <View style={styles.unreadDot} />}
    </Pressable>
  )
}

export default NotificationItem

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    backgroundColor: '#000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333'
  },
  unreadContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: wp(3)
  },
  iconBadge: {
    position: 'absolute',
    bottom: -hp(0.5),
    right: -hp(0.5),
    borderRadius: hp(1),
    padding: hp(0.3),
    borderWidth: 1.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: hp(2.5),
    minHeight: hp(2.5)
  },
  iconText: {
    color: 'white',
    fontSize: hp(1.4),
    fontWeight: 'bold'
  },
  content: {
    flex: 1
  },
  text: {
    color: 'white',
    fontSize: hp(1.8),
    lineHeight: hp(2.2)
  },
  boldText: {
    fontWeight: '600'
  },
  time: {
    color: '#aaa',
    fontSize: hp(1.5),
    marginTop: hp(0.5)
  },
  unreadDot: {
    width: hp(1),
    height: hp(1),
    borderRadius: hp(0.5),
    backgroundColor: theme.colors.primary,
    marginLeft: wp(2)
  }
})