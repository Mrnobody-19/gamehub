import {
  View,
  Text,
  TouchableOpacity,
  Share,
} from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Video } from 'expo-av';
import moment from 'moment';
import RenderHTML from 'react-native-render-html';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Image } from 'expo-image';
// eslint-disable-next-line import/no-unresolved
import styles from '../styles/PostCardStyle';

const PostCard = ({ item, showDelete = false }) => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item?.likes?.length || 0);

  const handleLike = async () => {
    if (!currentUser) return;

    const alreadyLiked = item?.likes?.includes(currentUser.id);
    const updatedLikes = alreadyLiked
      ? item.likes.filter((id) => id !== currentUser.id)
      : [...(item.likes || []), currentUser.id];

    setLiked(!alreadyLiked);
    setLikeCount(updatedLikes.length);

    const { error } = await supabase
      .from('posts')
      .update({ likes: updatedLikes })
      .eq('id', item.id);

    if (error) {
      console.log('Like error:', error);
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('posts').delete().eq('id', item.id);
    if (error) {
      console.log('Delete error:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: item?.content || 'Check out this post!',
      });
    } catch (error) {
      console.error('Error sharing:', error.message);
    }
  };

  const handlePress = () => {
    router.push({
      pathname: '/postDetails',
      params: {
        id: item.id,
      },
    });
  };

  const renderFile = () => {
    if (typeof item?.file === 'string') {
      if (item.file.includes('postImage')) {
        return (
          <Image
            source={{ uri: item.file }}
            contentFit="cover"
            transition={300}
            style={styles.postImage}
          />
        );
      } else if (item.file.includes('postVideos')) {
        return (
          <Video
            source={{ uri: item.file }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="cover"
            useNativeControls
            style={styles.postVideo}
          />
        );
      }
    }
    return null;
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: item?.user?.avatar }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item?.user?.name}</Text>
          <Text style={styles.time}>{moment(item?.created_at).fromNow()}</Text>
        </View>
      </View>

      {renderFile()}

      <TouchableOpacity onPress={handlePress} style={styles.contentWrapper}>
        <RenderHTML
          contentWidth={300}
          source={{ html: item?.content || '' }}
          baseStyle={{ color: 'white', fontSize: 14 }}
        />
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={24}
            color={liked ? 'red' : 'white'}
          />
          <Text style={styles.count}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
          <Ionicons name="share-social-outline" size={24} color="white" />
        </TouchableOpacity>

        {showDelete && currentUser?.id === item?.userId && (
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.commentText}>
        {item?.comments?.[0]?.count ?? 0} comment(s)
      </Text>
    </View>
  );
};

export default PostCard;
