import { StyleSheet, Text, View, Pressable } from 'react-native'
import React from 'react'
import { hp, wp } from '../helpers/common'
import { theme } from '../constants/theme'
import Avatar from './Avater'
import Icon from '../assets/icons'
import { Image } from 'expo-image'

const NotificationItem = ({ notification }) => {
  return (
    <Pressable style={styles.container}>
      <View style={styles.avatarContainer}>
        <Avatar
          uri={notification?.sender?.image} 
          size={hp(5)} 
          rounded={hp(5)/2}
        />
        <View style={styles.iconBadge}>
          <Icon 
            name={notification.type === 'like' ? 'heart' : 'comment'} 
            size={hp(2)} 
            color="white"
            fill="white"
          />
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.boldText}>{notification.sender?.name || 'Someone'}</Text>
          {notification.type === 'like' ? ' liked your post' : ' commented on your post'}
        </Text>
        <Text style={styles.time}>{notification.timeAgo}</Text>
      </View>
      
      {notification.postImage && (
        <View style={styles.postPreview}>
          <Image
            source={{ uri: notification.postImage }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>
      )}
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
  avatarContainer: {
    position: 'relative',
    marginRight: wp(3)
  },
  iconBadge: {
    position: 'absolute',
    bottom: -hp(0.5),
    right: -hp(0.5),
    backgroundColor: theme.colors.primary,
    borderRadius: hp(1),
    padding: hp(0.5),
    borderWidth: 1.5,
    borderColor: '#000'
  },
  content: {
    flex: 1
  },
  text: {
    color: 'white',
    fontSize: hp(1.8)
  },
  boldText: {
    fontWeight: '600'
  },
  time: {
    color: '#aaa',
    fontSize: hp(1.5),
    marginTop: hp(0.5)
  },
  postPreview: {
    width: hp(5),
    height: hp(5),
    borderRadius: 8,
    overflow: 'hidden',
    marginLeft: wp(2)
  },
  postImage: {
    width: '100%',
    height: '100%'
  }
})