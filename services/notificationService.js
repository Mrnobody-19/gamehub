// services/notificationService.js
import { supabase } from "../lib/supabase";
import { formatTimeAgo } from "../helpers/dateUtils";

// --- Create new notification ---
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

// --- Fetch notifications with join ---
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

    if (!data || data.length === 0) {
      return { success: true, data: [] };
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
        : { id: n.senderId, name: "User", image: null },
      postImage: n.postId ? n.postImage || null : null,
      timeAgo: formatTimeAgo(n.created_at),
    }));

    return { success: true, data: formatted };
  } catch (err) {
    console.log("[NotificationService] fetchNotifications exception:", err);
    return { success: false, msg: "Could not fetch notifications" };
  }
};

// --- Optimized fallback (no joins available) ---
const fetchNotificationsFallback = async (receiverId) => {
  try {
    console.log("[NotificationService] Using optimized fallback for:", receiverId);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("receiverId", receiverId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("[NotificationService] Fallback error:", error);
      return { success: false, msg: "Could not fetch notifications" };
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] };
    }

    // Collect unique senderIds and postIds
    const senderIds = [...new Set(data.map((n) => n.senderId).filter(Boolean))];
    const postIds = [...new Set(data.map((n) => n.postId).filter(Boolean))];

    // Fetch senders in one query
    let sendersMap = {};
    if (senderIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, name, image, email")
        .in("id", senderIds);

      users?.forEach((u) => {
        sendersMap[u.id] = {
          id: u.id,
          name: u.name || "User",
          image: u.image || null,
          email: u.email || null,
        };
      });
    }

    // Fetch posts in one query
    let postsMap = {};
    if (postIds.length > 0) {
      const { data: posts } = await supabase
        .from("posts")
        .select("id, image")
        .in("id", postIds);

      posts?.forEach((p) => {
        postsMap[p.id] = p.image || null;
      });
    }

    // Build final notifications
    const withSenders = data.map((n) => ({
      ...n,
      sender: sendersMap[n.senderId] || { id: n.senderId, name: "User", image: null },
      postImage: postsMap[n.postId] || null,
      timeAgo: formatTimeAgo(n.created_at),
    }));

    return { success: true, data: withSenders };
  } catch (err) {
    console.log("[NotificationService] Fallback exception:", err);
    return { success: false, msg: "Could not fetch notifications" };
  }
};

// --- Mark as read ---
export const markAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
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
    const { data, error } = await supabase
      .from("users")
      .select("id, name, image, email")
      .limit(1);
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
