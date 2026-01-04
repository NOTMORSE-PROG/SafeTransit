// Notification Types and Mock Data Service for SafeTransit

export type NotificationType =
  // Community Activity (Verified Users)
  | 'tip_upvote'
  | 'comment'
  | 'reply'
  | 'comment_like'
  | 'mention'
  // Followed Locations
  | 'new_tip_at_location'
  // Verification
  | 'verification_approved'
  | 'verification_failed'
  | 'verification_pending'
  // Safety Alerts
  | 'danger_zone'
  | 'sos_sent'
  // System
  | 'welcome'
  | 'tip_approved'
  | 'tip_removed';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  // For grouped notifications (e.g., "5 people upvoted your tip")
  groupCount?: number;
  groupedActors?: string[];
  // For navigation
  relatedTipId?: string;
  relatedTipTitle?: string;
  relatedLocationId?: string;
  relatedLocationName?: string;
}

export interface NotificationSettings {
  communityActivity: boolean;
  followedLocations: boolean;
  safetyAlerts: boolean;
  systemUpdates: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean; // Coming soon
}

// Default settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  communityActivity: true,
  followedLocations: true,
  safetyAlerts: true,
  systemUpdates: true,
  pushNotifications: true,
  emailNotifications: false,
};

// Helper to get notification icon name and color
export const getNotificationStyle = (type: NotificationType): {
  icon: string;
  iconColor: string;
  bgColor: string;
  emoji: string;
} => {
  switch (type) {
    case 'tip_upvote':
      return { icon: 'ThumbsUp', iconColor: '#2563eb', bgColor: 'bg-primary-100', emoji: '👍' };
    case 'comment':
      return { icon: 'MessageCircle', iconColor: '#2563eb', bgColor: 'bg-primary-100', emoji: '💬' };
    case 'reply':
      return { icon: 'Reply', iconColor: '#0d9488', bgColor: 'bg-secondary-100', emoji: '↩️' };
    case 'comment_like':
      return { icon: 'Heart', iconColor: '#ef4444', bgColor: 'bg-danger-100', emoji: '❤️' };
    case 'mention':
      return { icon: 'AtSign', iconColor: '#2563eb', bgColor: 'bg-primary-100', emoji: '@' };
    case 'new_tip_at_location':
      return { icon: 'MapPin', iconColor: '#0d9488', bgColor: 'bg-secondary-100', emoji: '📍' };
    case 'verification_approved':
      return { icon: 'CheckCircle', iconColor: '#16a34a', bgColor: 'bg-safe-100', emoji: '✅' };
    case 'verification_failed':
      return { icon: 'XCircle', iconColor: '#dc2626', bgColor: 'bg-danger-100', emoji: '❌' };
    case 'verification_pending':
      return { icon: 'Clock', iconColor: '#d97706', bgColor: 'bg-caution-100', emoji: '⏳' };
    case 'danger_zone':
      return { icon: 'AlertTriangle', iconColor: '#dc2626', bgColor: 'bg-danger-100', emoji: '⚠️' };
    case 'sos_sent':
      return { icon: 'Siren', iconColor: '#dc2626', bgColor: 'bg-danger-100', emoji: '🚨' };
    case 'welcome':
      return { icon: 'Sparkles', iconColor: '#2563eb', bgColor: 'bg-primary-100', emoji: '👋' };
    case 'tip_approved':
      return { icon: 'CheckCircle', iconColor: '#16a34a', bgColor: 'bg-safe-100', emoji: '✅' };
    case 'tip_removed':
      return { icon: 'Ban', iconColor: '#dc2626', bgColor: 'bg-danger-100', emoji: '🚫' };
    default:
      return { icon: 'Bell', iconColor: '#6b7280', bgColor: 'bg-neutral-100', emoji: '🔔' };
  }
};

// Helper to format relative time
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Helper to group notifications by date
export const groupNotificationsByDate = (notifications: Notification[]): {
  today: Notification[];
  yesterday: Notification[];
  earlier: Notification[];
} => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  return notifications.reduce(
    (groups, notification) => {
      const notifDate = new Date(
        notification.timestamp.getFullYear(),
        notification.timestamp.getMonth(),
        notification.timestamp.getDate()
      );

      if (notifDate.getTime() >= today.getTime()) {
        groups.today.push(notification);
      } else if (notifDate.getTime() >= yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else {
        groups.earlier.push(notification);
      }

      return groups;
    },
    { today: [] as Notification[], yesterday: [] as Notification[], earlier: [] as Notification[] }
  );
};

// Mock data - comprehensive examples of all notification types with longer messages
const now = new Date();

export const MOCK_NOTIFICATIONS: Notification[] = [
  // Today's notifications
  {
    id: '1',
    type: 'comment',
    title: 'New comment',
    message: '@Maria commented on your tip "Well-Lit MRT Exit": "This is super helpful! I always use Exit 3 now. The security guards are really friendly and the area is well-maintained. Thanks for sharing!"',
    timestamp: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
    isRead: false,
    relatedTipId: 'tip-1',
    relatedTipTitle: 'Well-Lit MRT Exit',
  },
  {
    id: '2',
    type: 'tip_upvote',
    title: '5 new upvotes',
    message: 'Your tip "Well-Lit MRT Exit" received 5 upvotes! Your contribution is helping make the community safer for everyone.',
    timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
    isRead: false,
    groupCount: 5,
    relatedTipId: 'tip-1',
    relatedTipTitle: 'Well-Lit MRT Exit',
  },
  {
    id: '3',
    type: 'verification_approved',
    title: 'Verification approved',
    message: "Congratulations! You're now a verified contributor. Start adding safety tips to help other commuters in your area. Verified users get a special badge on their tips!",
    timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
    isRead: false,
  },
  {
    id: '4',
    type: 'danger_zone',
    title: 'Safety Alert',
    message: "Heads up! You're near a reported danger zone at Quiapo underpass. Several users have flagged this area for poor lighting and suspicious activity after dark. Please stay alert and consider using an alternate route.",
    timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
    isRead: true,
    relatedLocationName: 'Quiapo Underpass',
  },
  // Yesterday's notifications
  {
    id: '5',
    type: 'reply',
    title: 'Reply to your comment',
    message: '@Juan replied to your comment: "Thanks for the tip! I tried this route yesterday and it was much safer than my usual path. Really appreciate your help!"',
    timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
    isRead: true,
    relatedTipId: 'tip-2',
    relatedTipTitle: 'Safe Jeepney Route',
  },
  {
    id: '6',
    type: 'new_tip_at_location',
    title: 'New tip at Ayala Station',
    message: 'A location you follow has a new community tip! Check out the latest safety information shared by verified users in the Ayala Station area.',
    timestamp: new Date(now.getTime() - 26 * 60 * 60 * 1000), // 1 day ago
    isRead: true,
    relatedLocationId: 'loc-1',
    relatedLocationName: 'Ayala Station',
    relatedTipId: 'tip-3',
  },
  {
    id: '7',
    type: 'comment_like',
    title: '10 likes on your comment',
    message: 'Your comment on "Safe Route to Makati" received 10 likes! The community finds your insights helpful. Keep sharing your knowledge!',
    timestamp: new Date(now.getTime() - 28 * 60 * 60 * 1000), // 1 day ago
    isRead: true,
    groupCount: 10,
    relatedTipId: 'tip-1',
  },
  // Earlier notifications
  {
    id: '8',
    type: 'tip_approved',
    title: 'Tip approved',
    message: 'Great news! Your tip "Security Camera Zone" has been reviewed and approved by our moderation team. It\'s now live and helping other commuters stay safe.',
    timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isRead: true,
    relatedTipId: 'tip-4',
    relatedTipTitle: 'Security Camera Zone',
  },
  {
    id: '9',
    type: 'welcome',
    title: 'Welcome to SafeTransit!',
    message: "We're glad to have you on board! SafeTransit helps you navigate safely with community-sourced tips and real-time alerts. Get verified to start contributing and help make commuting safer for everyone.",
    timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    isRead: true,
  },
  {
    id: '10',
    type: 'sos_sent',
    title: 'SOS alert sent',
    message: 'Your emergency alert was successfully sent to all your emergency contacts. They have been notified of your location and current situation. Stay safe!',
    timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    isRead: true,
  },
];

// Get unread count
export const getUnreadCount = (notifications: Notification[]): number => {
  return notifications.filter((n) => !n.isRead).length;
};

// Mock function to mark all as read
export const markAllAsRead = (notifications: Notification[]): Notification[] => {
  return notifications.map((n) => ({ ...n, isRead: true }));
};

// Mock function to delete a notification
export const deleteNotification = (
  notifications: Notification[],
  id: string
): Notification[] => {
  return notifications.filter((n) => n.id !== id);
};
