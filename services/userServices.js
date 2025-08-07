import { supabase } from "../lib/supabase";

export const getUserData = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, image, bio, created_at') // Removed username
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return {
        success: false, 
        msg: error.message,
        data: { id: userId, name: 'Unknown User' }
      };
    }

    // Generate username from name if needed
    const userData = {
      ...data,
      name: data?.name || 'Unknown User',
      username: data?.name?.toLowerCase().replace(/\s/g, '') || 'user' // Generate from name
    };

    return { success: true, data: userData };

  } catch (error) {
    console.error('Error in getUserData:', error);
    return {
      success: false,
      msg: error.message,
      data: { id: userId, name: 'Unknown User' }
    };
  }
};

export const fetchAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, image, bio, created_at') // Removed username
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Process users to generate usernames
    const processedUsers = data.map(user => ({
      ...user,
      name: user?.name || 'Unknown User',
      username: user?.name?.toLowerCase().replace(/\s/g, '') || 'user', // Generated
      image: user?.image || null
    }));

    return { success: true, data: processedUsers };

  } catch (error) {
    console.error('Error fetching all users:', error);
    return { success: false, msg: error.message, data: [] };
  }
};

export const updateUser = async (userId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) throw error;

    return { success: true, data: data[0] };

  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, msg: error.message };
  }
};