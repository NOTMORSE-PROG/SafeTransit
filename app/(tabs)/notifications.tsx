import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInDown, 
  FadeOut, 
  Layout, 
  FadeIn, 
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import {
  Bell,
  ThumbsUp,
  MessageCircle,
  Reply,
  Heart,
  AtSign,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Siren,
  Sparkles,
  Ban,
  Settings,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MoreHorizontal,
  Trash2,
  BellOff,
  X,
  Search,
} from 'lucide-react-native';
import {
  Notification,
  MOCK_NOTIFICATIONS,
  getNotificationStyle,
  formatRelativeTime,
  groupNotificationsByDate,
  getUnreadCount,
  markAllAsRead,
  deleteNotification,
} from '../../services/notifications';



// Icon mapping for notification types
const IconMap: Record<string, React.ComponentType<{ color: string; size: number; strokeWidth: number }>> = {
  ThumbsUp,
  MessageCircle,
  Reply,
  Heart,
  AtSign,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Siren,
  Sparkles,
  Ban,
  Bell,
};

// Coming soon handler
const showComingSoon = (feature: string, setToast: (msg: string) => void) => {
  setToast(`${feature} coming soon!`);
  setTimeout(() => setToast(''), 2000);
};

// Navigation handler based on notification type
const handleNotificationPress = (notification: Notification, router: ReturnType<typeof useRouter>, setToast: (msg: string) => void) => {
  switch (notification.type) {
    case 'tip_upvote':
    case 'comment':
    case 'reply':
    case 'comment_like':
    case 'tip_approved':
    case 'new_tip_at_location':
      showComingSoon('Tip details page', setToast);
      break;
    case 'mention':
      showComingSoon('Mentions feature', setToast);
      break;
    case 'verification_approved':
    case 'verification_failed':
    case 'verification_pending':
      showComingSoon('Verification flow', setToast);
      break;
    case 'danger_zone':
    case 'sos_sent':
      showComingSoon('Safety alerts map', setToast);
      break;
    case 'welcome':
      router.push('/(tabs)/community');
      break;
    case 'tip_removed':
      showComingSoon('Moderation details', setToast);
      break;
    default:
      break;
  }
};

// Get friendly name for notification type
const getNotificationTypeName = (type: string): string => {
  switch (type) {
    case 'tip_upvote': return 'upvote notifications';
    case 'comment': return 'comment notifications';
    case 'reply': return 'reply notifications';
    case 'comment_like': return 'like notifications';
    case 'mention': return 'mention notifications';
    case 'new_tip_at_location': return 'location notifications';
    case 'verification_approved':
    case 'verification_failed':
    case 'verification_pending': return 'verification notifications';
    case 'danger_zone':
    case 'sos_sent': return 'safety alerts';
    case 'welcome':
    case 'tip_approved':
    case 'tip_removed': return 'system notifications';
    default: return 'these notifications';
  }
};

// Notification Card Component
function NotificationCard({
  notification,
  onPress,
  onMenuPress,
  index,
}: {
  notification: Notification;
  onPress: () => void;
  onMenuPress: () => void;
  index: number;
}) {
  const style = getNotificationStyle(notification.type);
  const IconComponent = IconMap[style.icon] || Bell;
  const [isMessageExpanded, setIsMessageExpanded] = useState(false);

  const isUnread = !notification.isRead;
  
  const MESSAGE_TRUNCATE_LENGTH = 80;
  const isMessageLong = notification.message.length > MESSAGE_TRUNCATE_LENGTH;
  const displayMessage = isMessageExpanded || !isMessageLong 
    ? notification.message 
    : notification.message.slice(0, MESSAGE_TRUNCATE_LENGTH).trim() + '...';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onMenuPress}
        delayLongPress={300}
        activeOpacity={0.7}
        style={{
          marginBottom: 12,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: isUnread ? '#eff6ff' : '#ffffff',
          borderWidth: 1,
          borderColor: isUnread ? '#bfdbfe' : '#e5e7eb',
          borderLeftWidth: isUnread ? 4 : 1,
          borderLeftColor: isUnread ? '#2563eb' : '#e5e7eb',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 3,
        }}
        accessible={true}
        accessibilityLabel={`${notification.title}. ${notification.message}`}
        accessibilityRole="button"
      >
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {/* Icon */}
            <View 
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginRight: 12,
                backgroundColor: style.bgColor === 'bg-primary-100' ? '#dbeafe' :
                                 style.bgColor === 'bg-secondary-100' ? '#ccfbf1' :
                                 style.bgColor === 'bg-danger-100' ? '#fee2e2' :
                                 style.bgColor === 'bg-safe-100' ? '#dcfce7' :
                                 style.bgColor === 'bg-caution-100' ? '#fef3c7' :
                                 '#f3f4f6'
              }}
            >
              <IconComponent color={style.iconColor} size={20} strokeWidth={2} />
            </View>

            {/* Content */}
            <View style={{ flex: 1 }}>
              {/* Title Row with 3 dots */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 }} numberOfLines={1}>
                    {style.emoji} {notification.title}
                  </Text>
                  {isUnread && (
                    <View style={{ width: 10, height: 10, backgroundColor: '#2563eb', borderRadius: 5, marginLeft: 8 }} />
                  )}
                </View>
                
                {/* Three dots menu button */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onMenuPress();
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 8,
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessible={true}
                  accessibilityLabel="More options"
                  accessibilityRole="button"
                >
                  <MoreHorizontal color="#9ca3af" size={20} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Message with "See more" */}
              <View style={{ marginBottom: 8, paddingRight: 40 }}>
                <Text style={{ fontSize: 14, color: '#4b5563', lineHeight: 20 }}>
                  {displayMessage}
                  {isMessageLong && !isMessageExpanded && (
                    <Text 
                      onPress={(e) => {
                        e.stopPropagation();
                        setIsMessageExpanded(true);
                      }}
                      style={{ fontSize: 14, color: '#2563eb', fontWeight: '600' }}
                    >
                      {' '}See more
                    </Text>
                  )}
                </Text>
                {isMessageLong && isMessageExpanded && (
                  <TouchableOpacity
                    onPress={() => setIsMessageExpanded(false)}
                    style={{ marginTop: 4 }}
                  >
                    <Text style={{ fontSize: 14, color: '#2563eb', fontWeight: '600' }}>
                      See less
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Timestamp */}
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                {formatRelativeTime(notification.timestamp)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Confirmation Modal Component
function ConfirmationModal({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isDestructive = false,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center', 
        alignItems: 'center',
        paddingHorizontal: 32,
      }}>
        <Animated.View 
          entering={FadeIn.duration(200)}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 20,
            paddingTop: 24,
            paddingBottom: 20,
            paddingHorizontal: 24,
            width: '100%',
            maxWidth: 340,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 20,
          }}
        >
          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ 
              width: 56, 
              height: 56, 
              borderRadius: 28, 
              backgroundColor: isDestructive ? '#fee2e2' : '#dbeafe', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {isDestructive ? (
                <Trash2 color="#dc2626" size={28} strokeWidth={2} />
              ) : (
                <AlertTriangle color="#2563eb" size={28} strokeWidth={2} />
              )}
            </View>
          </View>

          {/* Title */}
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '700', 
            color: '#111827', 
            textAlign: 'center',
            marginBottom: 8,
          }}>
            {title}
          </Text>

          {/* Message */}
          <Text style={{ 
            fontSize: 14, 
            color: '#6b7280', 
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 24,
          }}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: '#f3f4f6',
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#4b5563' }}>
                {cancelText}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: isDestructive ? '#dc2626' : '#2563eb',
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#ffffff' }}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}


// Custom Bottom Sheet Menu Component using @gorhom/bottom-sheet (Facebook-style)
function NotificationMenu({
  visible,
  notification,
  onClose,
  onRemove,
  onTurnOff,
}: {
  visible: boolean;
  notification: Notification | null;
  onClose: () => void;
  onRemove: () => void;
  onTurnOff: () => void;
}) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ['40%'], []);
  
  // Open/close based on visibility
  useEffect(() => {
    if (visible && bottomSheetRef.current) {
      bottomSheetRef.current.expand();
    } else if (!visible && bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  }, [visible]);

  // Render backdrop
  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  // Handle sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  if (!notification) return null;

  const typeName = getNotificationTypeName(notification.type);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          onClose={onClose}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={{
            backgroundColor: '#d1d5db',
            width: 40,
            height: 4,
          }}
          backgroundStyle={{
            backgroundColor: '#ffffff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 20,
          }}
        >
          <BottomSheetView style={{ flex: 1, paddingHorizontal: 16 }}>
            {/* Drag hint text */}
            <Text style={{ 
              fontSize: 11, 
              color: '#9ca3af', 
              textAlign: 'center',
              marginBottom: 12,
              opacity: 0.7,
            }}>
              Drag down to dismiss
            </Text>

            {/* Remove notification */}
            <TouchableOpacity
              onPress={onRemove}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 16,
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                marginBottom: 8,
              }}
              activeOpacity={0.7}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Trash2 color="#dc2626" size={22} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
                  Remove this notification
                </Text>
                <Text style={{ fontSize: 13, color: '#6b7280' }}>
                  Hide it from your notifications
                </Text>
              </View>
            </TouchableOpacity>

            {/* Turn off notifications */}
            <TouchableOpacity
              onPress={onTurnOff}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 16,
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                marginBottom: 8,
              }}
              activeOpacity={0.7}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <BellOff color="#4b5563" size={22} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
                  Turn off {typeName}
                </Text>
                <Text style={{ fontSize: 13, color: '#6b7280' }}>
                  Stop receiving notifications like this
                </Text>
              </View>
            </TouchableOpacity>

            {/* Cancel button */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                paddingVertical: 16,
                alignItems: 'center',
                marginTop: 8,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#6b7280' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>
      </GestureHandlerRootView>
    </Modal>
  );
}

// Toast Component
function Toast({ message }: { message: string }) {
  if (!message) return null;
  
  return (
    <Animated.View 
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={{
        position: 'absolute',
        bottom: 120,
        left: 24,
        right: 24,
        backgroundColor: '#1f2937',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>{message}</Text>
    </Animated.View>
  );
}

// Section Header Component
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={{ marginBottom: 12, marginTop: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
        {title}
      </Text>
    </View>
  );
}

// Empty State Component
function EmptyState({ onExplore }: { onExplore: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
      <View style={{ width: 96, height: 96, backgroundColor: '#f3f4f6', borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Bell color="#9ca3af" size={48} strokeWidth={1.5} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
        No notifications yet
      </Text>
      <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 32, marginBottom: 24 }}>
        When someone interacts with your tips or comments, you'll see it here.
      </Text>
      <TouchableOpacity
        onPress={onExplore}
        style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel="Explore community tips"
        accessibilityRole="button"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Lightbulb color="#ffffff" size={18} strokeWidth={2} />
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16, marginLeft: 8 }}>
            Explore Community Tips
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// Number of notifications to show initially
const INITIAL_VISIBLE_COUNT = 5;

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [toast, setToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const unreadCount = getUnreadCount(notifications);
  
  // Filter notifications by search query
  const filteredNotifications = notifications.filter(n => 
    searchQuery === '' || 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const allNotifications = filteredNotifications;
  const visibleNotifications = showAll 
    ? allNotifications 
    : allNotifications.slice(0, INITIAL_VISIBLE_COUNT);
  const hiddenCount = allNotifications.length - INITIAL_VISIBLE_COUNT;
  
  const grouped = groupNotificationsByDate(visibleNotifications);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setNotifications(MOCK_NOTIFICATIONS);
      setShowAll(false);
    }, 1000);
  }, []);

  const handleMarkAllAsRead = () => {
    setNotifications(prev => markAllAsRead(prev));
    setToast('All notifications marked as read');
    setTimeout(() => setToast(''), 2000);
  };

  const handleMenuPress = (notification: Notification) => {
    setSelectedNotification(notification);
    setMenuVisible(true);
  };

  const handleRemove = () => {
    // Close the menu and show confirmation dialog
    setMenuVisible(false);
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = () => {
    if (selectedNotification) {
      setNotifications(prev => deleteNotification(prev, selectedNotification.id));
      setToast('Notification removed');
      setTimeout(() => setToast(''), 2000);
    }
    setDeleteConfirmVisible(false);
    setSelectedNotification(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false);
    setSelectedNotification(null);
  };

  const handleTurnOff = () => {
    if (selectedNotification) {
      const typeName = getNotificationTypeName(selectedNotification.type);
      setToast(`Turned off ${typeName}`);
      setTimeout(() => setToast(''), 2000);
    }
    setMenuVisible(false);
    setSelectedNotification(null);
  };

  const handleNotificationTap = (notification: Notification) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
    );
    handleNotificationPress(notification, router, setToast);
  };

  const openSettings = () => {
    router.push('/notification-settings');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#ffffff', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827' }}>
            Notifications
          </Text>
          <TouchableOpacity
            onPress={openSettings}
            style={{ width: 40, height: 40, backgroundColor: '#f3f4f6', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Notification settings"
            accessibilityRole="button"
          >
            <Settings color="#374151" size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: '#f3f4f6', 
          borderRadius: 12, 
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginBottom: 12,
        }}>
          <Search color="#9ca3af" size={20} strokeWidth={2} />
          <TextInput
            placeholder="Search notifications..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ 
              flex: 1, 
              fontSize: 15, 
              color: '#111827', 
              marginLeft: 10,
              paddingVertical: 0,
            }}
            accessible={true}
            accessibilityLabel="Search notifications"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={{ padding: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color="#9ca3af" size={18} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end' }}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel={`Mark all ${unreadCount} notifications as read`}
            accessibilityRole="button"
          >
            <CheckCheck color="#2563eb" size={16} strokeWidth={2} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#2563eb', marginLeft: 4 }}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <EmptyState onExplore={() => router.push('/(tabs)/community')} />
      ) : (
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563eb"
              colors={['#2563eb']}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Today */}
          {grouped.today.length > 0 && (
            <>
              <SectionHeader title="Today" />
              {grouped.today.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onPress={() => handleNotificationTap(notification)}
                  onMenuPress={() => handleMenuPress(notification)}
                  index={index}
                />
              ))}
            </>
          )}

          {/* Yesterday */}
          {grouped.yesterday.length > 0 && (
            <>
              <SectionHeader title="Yesterday" />
              {grouped.yesterday.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onPress={() => handleNotificationTap(notification)}
                  onMenuPress={() => handleMenuPress(notification)}
                  index={grouped.today.length + index}
                />
              ))}
            </>
          )}

          {/* Earlier */}
          {grouped.earlier.length > 0 && (
            <>
              <SectionHeader title="Earlier" />
              {grouped.earlier.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onPress={() => handleNotificationTap(notification)}
                  onMenuPress={() => handleMenuPress(notification)}
                  index={grouped.today.length + grouped.yesterday.length + index}
                />
              ))}
            </>
          )}

          {/* See older notifications button */}
          {!showAll && hiddenCount > 0 && (
            <TouchableOpacity
              onPress={() => setShowAll(true)}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 20,
                marginTop: 8,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#e5e7eb',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
              }}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel={`See ${hiddenCount} older notifications`}
              accessibilityRole="button"
            >
              <ChevronDown color="#2563eb" size={20} strokeWidth={2} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#2563eb', marginLeft: 8 }}>
                See older notifications
              </Text>
            </TouchableOpacity>
          )}

          {/* Show less button */}
          {showAll && hiddenCount > 0 && (
            <TouchableOpacity
              onPress={() => setShowAll(false)}
              style={{
                backgroundColor: '#f3f4f6',
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 20,
                marginTop: 8,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel="Show less notifications"
              accessibilityRole="button"
            >
              <ChevronUp color="#4b5563" size={20} strokeWidth={2} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#4b5563', marginLeft: 8 }}>
                Show less
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 96 }} />
        </ScrollView>
      )}

      {/* Custom Bottom Sheet Menu */}
      <NotificationMenu
        visible={menuVisible}
        notification={selectedNotification}
        onClose={() => {
          setMenuVisible(false);
          setSelectedNotification(null);
        }}
        onRemove={handleRemove}
        onTurnOff={handleTurnOff}
      />

      {/* Toast */}
      <Toast message={toast} />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteConfirmVisible}
        title="Delete Notification?"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDestructive={true}
      />
    </View>
  );
}
