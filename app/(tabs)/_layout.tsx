import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Lightbulb, UserCircle, Bell, LucideIcon } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { MOCK_NOTIFICATIONS, getUnreadCount } from '../../services/notifications';

function TabBarIcon({ focused, icon: Icon }: { focused: boolean; icon: LucideIcon }) {
  return (
    <View className={`w-12 h-12 items-center justify-center rounded-full ${focused ? 'bg-primary-100' : ''}`}>
      <Icon
        color={focused ? '#2563eb' : '#6b7280'}
        size={24}
        strokeWidth={focused ? 2.5 : 2}
      />
    </View>
  );
}

function TabBarIconWithBadge({ 
  focused, 
  icon: Icon, 
  badgeCount 
}: { 
  focused: boolean; 
  icon: LucideIcon; 
  badgeCount?: number;
}) {
  return (
    <View className={`w-12 h-12 items-center justify-center rounded-full ${focused ? 'bg-primary-100' : ''}`}>
      <Icon
        color={focused ? '#2563eb' : '#6b7280'}
        size={24}
        strokeWidth={focused ? 2.5 : 2}
      />
      {badgeCount !== undefined && badgeCount > 0 && (
        <View 
          className="absolute -top-0.5 -right-0.5 bg-danger-500 rounded-full items-center justify-center"
          style={{ minWidth: 18, height: 18, paddingHorizontal: 4 }}
        >
          <Text className="text-white text-xs font-bold">
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Get initial unread count from mock data
    setUnreadCount(getUnreadCount(MOCK_NOTIFICATIONS));
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={Home} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={Lightbulb} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ focused }) => (
            <TabBarIconWithBadge 
              focused={focused} 
              icon={Bell} 
              badgeCount={unreadCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={UserCircle} />
          ),
        }}
      />
    </Tabs>
  );
}
