import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  MessageCircle,
  MapPin,
  Shield,
  Bell,
  Smartphone,
  Mail,
  Info,
} from 'lucide-react-native';
import {
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../services/notifications';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    // Safety alerts should always be ON (show warning if trying to disable)
    if (key === 'safetyAlerts' && !value) {
      Alert.alert(
        'Safety First! ⚠️',
        'We strongly recommend keeping Safety Alerts enabled for your protection. Are you sure you want to disable them?',
        [
          { text: 'Keep Enabled', style: 'cancel' },
          {
            text: 'Disable Anyway',
            style: 'destructive',
            onPress: () => setSettings((prev) => ({ ...prev, [key]: value })),
          },
        ]
      );
      return;
    }

    // Email notifications are coming soon
    if (key === 'emailNotifications') {
      Alert.alert(
        'Coming Soon! 🚀',
        'Email notifications will be available in a future update.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const SettingRow = ({
    icon: Icon,
    iconColor,
    iconBg,
    title,
    description,
    settingKey,
    isComingSoon = false,
    isRecommended = false,
  }: {
    icon: React.ComponentType<{ color: string; size: number; strokeWidth: number }>;
    iconColor: string;
    iconBg: string;
    title: string;
    description: string;
    settingKey: keyof NotificationSettings;
    isComingSoon?: boolean;
    isRecommended?: boolean;
  }) => (
    <View className="px-4 py-4 border-b border-neutral-100">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-3">
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${iconBg}`}>
            <Icon color={iconColor} size={20} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-base font-semibold text-neutral-900">
                {title}
              </Text>
              {isComingSoon && (
                <View className="ml-2 bg-neutral-200 px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-neutral-500 font-medium">Soon</Text>
                </View>
              )}
              {isRecommended && (
                <View className="ml-2 bg-safe-100 px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-safe-700 font-medium">Recommended</Text>
                </View>
              )}
            </View>
            <Text className="text-sm text-neutral-500 mt-0.5">
              {description}
            </Text>
          </View>
        </View>
        <Switch
          value={settings[settingKey]}
          onValueChange={(value) => updateSetting(settingKey, value)}
          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          thumbColor={settings[settingKey] ? '#2563eb' : '#f3f4f6'}
          disabled={isComingSoon}
          accessible={true}
          accessibilityLabel={`${title} toggle`}
          accessibilityRole="switch"
        />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View className="bg-white pt-14 pb-4 px-6 border-b border-neutral-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-neutral-100 rounded-full items-center justify-center mr-4"
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft color="#374151" size={20} strokeWidth={2} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-neutral-900">
            Notification Settings
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Categories Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} className="mt-6 px-6">
          <Text className="text-lg font-bold text-neutral-900 mb-3">
            Categories
          </Text>

          <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <SettingRow
              icon={MessageCircle}
              iconColor="#2563eb"
              iconBg="bg-primary-100"
              title="Community Activity"
              description="Likes, comments, and replies on your tips"
              settingKey="communityActivity"
            />
            <SettingRow
              icon={MapPin}
              iconColor="#0d9488"
              iconBg="bg-secondary-100"
              title="Followed Locations"
              description="New tips at locations you follow"
              settingKey="followedLocations"
            />
            <SettingRow
              icon={Shield}
              iconColor="#dc2626"
              iconBg="bg-danger-100"
              title="Safety Alerts"
              description="Danger zone and emergency notifications"
              settingKey="safetyAlerts"
              isRecommended={true}
            />
            <SettingRow
              icon={Bell}
              iconColor="#6b7280"
              iconBg="bg-neutral-100"
              title="System Updates"
              description="Welcome, verification, and tip moderation"
              settingKey="systemUpdates"
            />
          </View>
        </Animated.View>

        {/* Delivery Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="mt-6 px-6">
          <Text className="text-lg font-bold text-neutral-900 mb-3">
            Delivery
          </Text>

          <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <SettingRow
              icon={Smartphone}
              iconColor="#2563eb"
              iconBg="bg-primary-100"
              title="Push Notifications"
              description="Receive notifications on your device"
              settingKey="pushNotifications"
            />
            <SettingRow
              icon={Mail}
              iconColor="#6b7280"
              iconBg="bg-neutral-100"
              title="Email Notifications"
              description="Receive notifications via email"
              settingKey="emailNotifications"
              isComingSoon={true}
            />
          </View>
        </Animated.View>

        {/* Info Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} className="mt-6 px-6 mb-8">
          <View className="bg-primary-50 rounded-2xl p-4 flex-row items-start">
            <View className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center mr-3">
              <Info color="#2563eb" size={16} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-primary-900 mb-1">
                About Notifications
              </Text>
              <Text className="text-sm text-primary-700 leading-5">
                We batch similar notifications (like upvotes) every 15 minutes to avoid overwhelming you. Safety alerts are always delivered immediately.
              </Text>
            </View>
          </View>
        </Animated.View>

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
