import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Lightbulb, UserCircle, Bell, LucideIcon } from 'lucide-react-native';
import PagerView from 'react-native-pager-view';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { MOCK_NOTIFICATIONS, getUnreadCount } from '../../services/notifications';

import HomeScreen from './index';
import CommunityScreen from './community';
import NotificationsScreen from './notifications';
import ProfileScreen from './profile';

interface TabBarItemProps {
  icon: LucideIcon;
  label: string;
  focused: boolean;
  badgeCount?: number;
  onPress: () => void;
}

function TabBarItem({ icon: Icon, label, focused, badgeCount, onPress }: TabBarItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabItem}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Icon
          color={focused ? '#2563eb' : '#6b7280'}
          size={24}
          strokeWidth={focused ? 2.5 : 2}
        />
        {badgeCount !== undefined && badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const opacity = useSharedValue(1);

  useEffect(() => {
    setUnreadCount(getUnreadCount(MOCK_NOTIFICATIONS));
  }, []);

  const setPage = (index: number) => {
    pagerRef.current?.setPageWithoutAnimation(index);
  };

  const navigateToTab = (index: number) => {
    if (index === currentPage) return;

    opacity.value = withTiming(0, { duration: 100 }, (finished) => {
      if (finished) {
        runOnJS(setPage)(index);
        opacity.value = withTiming(1, { duration: 150 });
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const tabs = [
    { icon: Home, label: 'Home', screen: HomeScreen },
    { icon: Lightbulb, label: 'Community', screen: CommunityScreen },
    { icon: Bell, label: 'Notifications', screen: NotificationsScreen, badgeCount: unreadCount },
    { icon: UserCircle, label: 'Profile', screen: ProfileScreen },
  ];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.pagerWrapper, animatedStyle]}>
        <PagerView
          ref={pagerRef}
          style={styles.pagerView}
          initialPage={0}
          onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
          overdrag={false}
          offscreenPageLimit={2}
        >
          {tabs.map((tab, index) => (
            <View key={String(index)} style={styles.page}>
              <tab.screen />
            </View>
          ))}
        </PagerView>
      </Animated.View>

      <View
        style={[
          styles.tabBar,
          { height: 80 + insets.bottom, paddingBottom: insets.bottom + 8 }
        ]}
      >
        {tabs.map((tab, index) => (
          <TabBarItem
            key={index}
            icon={tab.icon}
            label={tab.label}
            focused={currentPage === index}
            badgeCount={tab.badgeCount}
            onPress={() => navigateToTab(index)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  pagerWrapper: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    color: '#6b7280',
  },
  tabLabelFocused: {
    color: '#2563eb',
  },
});
