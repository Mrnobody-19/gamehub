import { supabase } from "../lib/supabase";

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
    return { success: false, error };
  }
};

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
    return { success: false, error };
  }
};


export const getFollowers = async (userId) => {
  
};

export const getFollowing = async (userId) => {
  
};

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
    return { success: false, error };
  }
};

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
    return { success: false, error };
  }
};

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
    return { success: false, error };
  }
};