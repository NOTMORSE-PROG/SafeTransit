import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Lightbulb, UserCircle, LucideIcon } from 'lucide-react-native';

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

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

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
