// services/notificationService.js
import { supabase } from "../lib/supabase";
import { formatTimeAgo } from "../helpers/dateUtils";

export const createNotification = async (notification) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.log("[NotificationService] createNotification error:", error);
      return { success: false, msg: "Failed to create notification" };
    }

    return { success: true, data };
  } catch (err) {
    console.log("[NotificationService] createNotification exception:", err);
    return { success: false, msg: "Unexpected error creating notification" };
  }
};

export const fetchNotifications = async (receiverId) => {
  try {
    console.log("[NotificationService] Fetching notifications for:", receiverId);

    const { data, error } = await supabase
      .from("notifications")
      .select(`
        *,
        sender:users!notifications_senderId_fkey (id, name, image, email)
      `)
      .eq("receiverId", receiverId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("[NotificationService] Join failed, using fallback:", error);
      return await fetchNotificationsFallback(receiverId);
    }

    const formatted = data.map((n) => ({
      ...n,
      sender: n.sender
        ? {
            id: n.sender.id,
            name: n.sender.name || "User",
            image: n.sender.image || null,
            email: n.sender.email || null,
          }
        : null,
      timeAgo: formatTimeAgo(n.created_at),
    }));

    return { success: true, data: formatted };
  } catch (err) {
    console.log("[NotificationService] fetchNotifications exception:", err);
    return { success: false, msg: "Could not fetch notifications" };
  }
};

// --- Fallback (no joins available) ---
const fetchNotificationsFallback = async (receiverId) => {
  try {
    console.log("[NotificationService] Using fallback for:", receiverId);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("receiverId", receiverId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("[NotificationService] Fallback error:", error);
      return { success: false, msg: "Could not fetch notifications" };
    }

    const withSenders = await Promise.all(
      data.map(async (n) => {
        let senderData = null;
        let postImage = null;

        if (n.senderId) {
          const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, name, image, email")
            .eq("id", n.senderId)
            .single();

          if (!userError && user) {
            senderData = {
              id: user.id,
              name: user.name || "User",
              image: user.image || null,
              email: user.email || null,
            };
          } else {
            senderData = { id: n.senderId, name: "User", image: null };
          }
        }

        if (n.postId) {
          const { data: post } = await supabase
            .from("posts")
            .select("image")
            .eq("id", n.postId)
            .single();
          postImage = post?.image || null;
        }

        return {
          ...n,
          sender: senderData,
          postImage,
          timeAgo: formatTimeAgo(n.created_at),
        };
      })
    );

    return { success: true, data: withSenders };
  } catch (err) {
    console.log("[NotificationService] Fallback exception:", err);
    return { success: false, msg: "Could not fetch notifications" };
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      console.log("[NotificationService] markAsRead error:", error);
      return { success: false, msg: "Failed to mark as read" };
    }

    return { success: true };
  } catch (err) {
    console.log("[NotificationService] markAsRead exception:", err);
    return { success: false, msg: "Unexpected error marking as read" };
  }
};

// --- Debug utilities ---
export const checkTableStructure = async () => {
  try {
    const { data, error } = await supabase.from("notifications").select("*").limit(1);
    if (error) {
      console.log("[NotificationService] checkTableStructure error:", error);
    } else {
      console.log("[NotificationService] Table sample:", data);
    }
  } catch (err) {
    console.log("[NotificationService] checkTableStructure exception:", err);
  }
};

export const checkDatabaseAccess = async () => {
  try {
    const { data, error } = await supabase.from("users").select("id, name, image, email").limit(1);
    console.log(
      "[NotificationService] Users table access:",
      error ? "DENIED" : "GRANTED",
      error
    );
    if (!error) console.log("Sample user:", data);
  } catch (err) {
    console.log("[NotificationService] checkDatabaseAccess exception:", err);
  }
};
