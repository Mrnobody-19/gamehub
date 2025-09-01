// services/notificationService.js
import { supabase } from "../lib/supabase";
import { formatTimeAgo } from "../helpers/dateUtils";

export const createNotification = async (notification) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.log('notification error:', error);
      return { success: false, msg: 'Something went wrong' };
    }

    return { success: true, data: data };
  } catch (error) {
    console.log('notification error: ', error);
    return { success: false, msg: 'Something went wrong' };
  }
}

export const fetchNotifications = async (receiverId) => {
  try {
    console.log('Fetching notifications for user:', receiverId);
    
    // Join with users table using the actual columns that exist
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:users!notifications_senderId_fkey (id, name, image, email)
      `)
      .eq('receiverId', receiverId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Join with users failed:', error);
      return await fetchNotificationsFallback(receiverId);
    }

    console.log('Notifications with user joins:', data);

    // Format notifications with user data
    const formattedNotifications = data.map(notification => {
      let senderData = null;
      
      if (notification.sender) {
        senderData = {
          id: notification.sender.id,
          name: notification.sender.name || 'User',
          image: notification.sender.image || null,
          email: notification.sender.email || null
        };
      }

      return {
        ...notification,
        sender: senderData,
        timeAgo: formatTimeAgo(notification.created_at)
      };
    });

    return { success: true, data: formattedNotifications };
  } catch (error) {
    console.log('fetchNotifications error: ', error);
    return { success: false, msg: 'Could not fetch notifications' };
  }
};

// Fallback method if direct join fails
const fetchNotificationsFallback = async (receiverId) => {
  try {
    console.log('Using fallback method to fetch notifications');
    
    // Simple query without joins
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('receiverId', receiverId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('fetchNotifications error:', error);
      return { success: false, msg: 'Could not fetch notifications' };
    }

    console.log('Raw notifications data:', data);

    // Fetch sender information from users table using the correct columns
    const notificationsWithSenders = await Promise.all(
      data.map(async (notification) => {
        let senderData = null;
        let postImage = null;
        
        // Fetch sender information from USERS table with correct columns
        if (notification.senderId) {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, name, image, email')
            .eq('id', notification.senderId)
            .single();
          
          if (!userError && user) {
            senderData = {
              id: user.id,
              name: user.name || 'User',
              image: user.image || null,
              email: user.email || null
            };
          } else {
            console.log('Error fetching sender from users:', userError);
            // If we can't get user data, at least provide basic info
            senderData = {
              id: notification.senderId,
              name: 'User',
              image: null,
              email: null
            };
          }
        }
        
        // Fetch post image if postId exists
        if (notification.postId) {
          const { data: post } = await supabase
            .from('posts')
            .select('image')
            .eq('id', notification.postId)
            .single();
          
          postImage = post?.image || null;
        }
        
        return {
          ...notification,
          sender: senderData,
          postImage: postImage,
          timeAgo: formatTimeAgo(notification.created_at)
        };
      })
    );

    return { success: true, data: notificationsWithSenders };
  } catch (error) {
    console.log('fetchNotificationsFallback error: ', error);
    return { success: false, msg: 'Could not fetch notifications' };
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.log('markAsRead error:', error);
      return { success: false, msg: 'Could not mark as read' };
    }

    return { success: true };
  } catch (error) {
    console.log('markAsRead error: ', error);
    return { success: false, msg: 'Could not mark as read' };
  }
};

// Helper function to check your table structure
export const checkTableStructure = async () => {
  try {
    // Get a sample record to see the structure
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Error checking table structure:', error);
      return;
    }
    
    console.log('Notifications table structure sample:', data);
  } catch (error) {
    console.log('Error checking table structure:', error);
  }
};

// New function to check database access
export const checkDatabaseAccess = async () => {
  try {
    // Check if we can access users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, image, email')
      .limit(1);
    
    console.log('Users table access:', usersError ? 'DENIED' : 'GRANTED', usersError);
    if (!usersError) {
      console.log('Sample user data:', usersData);
    }
    
  } catch (error) {
    console.log('Database access check error:', error);
  }
};