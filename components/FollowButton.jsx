// components/FollowButton.js
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { checkIfFollowing, followUser, unfollowUser } from '../services/followService';
import { theme } from '../constants/theme';

const FollowButton = ({ currentUserId, targetUserId, onFollowChange }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFollowStatus = async () => {
      const { isFollowing } = await checkIfFollowing(currentUserId, targetUserId);
      setIsFollowing(isFollowing);
      setLoading(false);
    };
    checkFollowStatus();
  }, [currentUserId, targetUserId]);

  const handlePress = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(currentUserId, targetUserId);
      } else {
        await followUser(currentUserId, targetUserId);
      }
      setIsFollowing(!isFollowing);
      if (onFollowChange) onFollowChange(!isFollowing);
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="small" />;

  return (
    <Pressable
      onPress={handlePress}
      style={{
        backgroundColor: isFollowing ? 'transparent' : theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: isFollowing ? 1 : 0,
        borderColor: '#ddd'
      }}
    >
      <Text style={{ color: isFollowing ? 'white' : 'black', fontWeight: '600' }}>
        {isFollowing ? 'Following' : 'Follow'}
      </Text>
    </Pressable>
  );
};

export default FollowButton;