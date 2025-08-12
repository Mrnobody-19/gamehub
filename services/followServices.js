import { supabase } from "../lib/supabase";

// Follow a user
export const followUser = async (followerId, followingId) => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .insert([{ follower_id: followerId, following_id: followingId }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, error: error.message };
  }
};

// Unfollow a user
export const unfollowUser = async (followerId, followingId) => {
  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: error.message };
  }
};

// Get all followers for a user
export const getFollowers = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower:users!follower_id(
          id,
          name,
          image,
          bio,
          created_at
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const followers = data.map(item => item.follower);
    return { success: true, data: followers };
  } catch (error) {
    console.error('Error getting followers:', error);
    return { success: false, error: error.message };
  }
};

// Get all users a user is following
export const getFollowing = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following:users!following_id(
          id,
          name,
          image,
          bio,
          created_at
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const following = data.map(item => item.following);
    return { success: true, data: following };
  } catch (error) {
    console.error('Error getting following:', error);
    return { success: false, error: error.message };
  }
};

// Check if a user follows another user
export const checkIfFollowing = async (followerId, followingId) => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, isFollowing: !!data };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return { success: false, error: error.message };
  }
};

// Get follower count for a user
export const getFollowersCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact' })
      .eq('following_id', userId);

    if (error) throw error;
    return { success: true, count };
  } catch (error) {
    console.error('Error getting followers count:', error);
    return { success: false, error: error.message };
  }
};

// Get following count for a user
export const getFollowingCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact' })
      .eq('follower_id', userId);

    if (error) throw error;
    return { success: true, count };
  } catch (error) {
    console.error('Error getting following count:', error);
    return { success: false, error: error.message };
  }
};

// Get mutual follows (users who follow each other)
export const getMutualFollows = async (userId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_mutual_follows', { user_id: userId });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting mutual follows:', error);
    return { success: false, error: error.message };
  }
};