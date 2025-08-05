import { supabase } from "../lib/supabase";



export const createNotification = async (notification) => {
    try {

        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single();


        if (error) {
            console.log('notification error:', error);
            return { success: false, msg: 'somrthing went wrong' };
        }

        return { success: true, data: data };


    } catch (error) {
        console.log('notification error: ', error);
        return { success: false, msg: 'something went wrong' };
    }
}

export const fetchNotifications = async (receiverId) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                sender: senderId (
                    id,
                    name,
                    image
                )
            `)
            .eq('receiverId', receiverId)
            .order('created_at', { ascending: false});


        if (error) {
            console.log('fetchNotifications error:', error);
            return { success: false, msg: 'Could not fetch notifications' };
        }

        // Check if no post was returned
        if (data.length === 0) {
            return { success: false, msg: 'Post not found' };
        }

        return { success: true, data: data[0] }; // Return the first post if one is found
    } catch (error) {
        console.log('fetchNotifications error: ', error);
        return { success: false, msg: 'Could not fetch the notification' };
    }
};
