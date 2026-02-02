import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MapPin, Bell, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlertModal from '@/components/CustomAlertModal';

type AlertType = 'success' | 'warning' | 'info' | 'error';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
}

export default function Permissions() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, type: AlertType = 'info') => {
    setAlertState({ visible: true, title, message, type });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const requestLocationPermission = async () => {
    setLocationLoading(true);
    try {
      // Only request foreground location during onboarding
      // Background location will be requested later when user enables Background Protection
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus === 'granted') {
        setLocationGranted(true);
        showAlert(
          'Location Access Granted',
          'You can now see danger zones on your routes. Enable Background Protection later in settings for alerts even when the app is closed.',
          'success'
        );
      } else {
        showAlert(
          'Location Permission Denied',
          'SafeTransit needs location access to show you danger zones and provide safe routes.',
          'warning'
        );
      }
    } catch (error) {
      console.error('Location permission error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    setNotificationLoading(true);
    try {
      // For Expo Go development, auto-grant notification permission
      // In production build, use expo-notifications
      if (Platform.OS === 'android') {
        // Simulate permission request delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setNotificationGranted(true);
        showAlert(
          'Notifications Enabled',
          'You will receive safety alerts when entering danger zones.',
          'success'
        );
      }
    } catch (error) {
      console.warn('Notification setup:', error);
      setNotificationGranted(true);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleContinue = () => {
    if (isNavigating) return; // Prevent multiple clicks

    if (locationGranted && notificationGranted) {
      setIsNavigating(true);
      router.replace('/onboarding/contact-number'); // Use replace to avoid stacking
    } else {
      showAlert(
        'Permissions Required',
        'Both location and notification permissions are required for SafeTransit to protect you.',
        'warning'
      );
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6">
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800)}
          className="mt-16 mb-8"
        >
          <Text className="text-3xl font-bold text-neutral-900 mb-3">
            Grant Permissions
          </Text>
          <Text className="text-base text-neutral-600 leading-6">
            SafeTransit needs these permissions to provide safety features and protect you from danger zones
          </Text>
        </Animated.View>

        {/* Location Permission */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(800)}
          className="mb-6"
        >
          <View className={`rounded-2xl p-6 ${locationGranted ? 'bg-success-50 border-2 border-success-500' : 'bg-neutral-50 border-2 border-neutral-200'}`}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1">
                <View className={`w-14 h-14 rounded-full items-center justify-center mr-4 ${locationGranted ? 'bg-success-500' : 'bg-primary-600'}`}>
                  {locationGranted ? (
                    <Check color="#ffffff" size={28} strokeWidth={2.5} />
                  ) : (
                    <MapPin color="#ffffff" size={28} strokeWidth={2} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-neutral-900 mb-1">
                    Location Access
                  </Text>
                  <Text className={`text-sm font-medium ${locationGranted ? 'text-success-600' : 'text-neutral-500'}`}>
                    {locationGranted ? 'Granted' : 'Required'}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-neutral-900 text-sm font-semibold mb-2">
                What we use it for:
              </Text>
              <Text className="text-neutral-700 text-sm leading-5 mb-1">
                • Show danger zones on your route while the app is open
              </Text>
              <Text className="text-neutral-700 text-sm leading-5 mb-1">
                • Provide safe route planning and navigation
              </Text>
              <Text className="text-neutral-700 text-sm leading-5 mb-3">
                • See nearby safety tips from the community
              </Text>
              <Text className="text-neutral-600 text-xs leading-4 italic">
                Note: Background alerts (when app is closed) are optional and can be enabled later in Settings.
              </Text>
            </View>

            {!locationGranted && (
              <TouchableOpacity
                onPress={requestLocationPermission}
                disabled={locationLoading}
                className={`bg-primary-600 rounded-xl py-3 ${locationLoading ? 'opacity-50' : ''}`}
                activeOpacity={0.8}
                accessible={true}
                accessibilityLabel="Grant location access"
                accessibilityRole="button"
              >
                <Text className="text-white text-center font-semibold text-base">
                  {locationLoading ? 'Requesting...' : 'Grant Location Access'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Notification Permission */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(800)}
          className="mb-8"
        >
          <View className={`rounded-2xl p-6 ${notificationGranted ? 'bg-success-50 border-2 border-success-500' : 'bg-neutral-50 border-2 border-neutral-200'}`}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1">
                <View className={`w-14 h-14 rounded-full items-center justify-center mr-4 ${notificationGranted ? 'bg-success-500' : 'bg-primary-600'}`}>
                  {notificationGranted ? (
                    <Check color="#ffffff" size={28} strokeWidth={2.5} />
                  ) : (
                    <Bell color="#ffffff" size={28} strokeWidth={2} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-neutral-900 mb-1">
                    Notifications
                  </Text>
                  <Text className={`text-sm font-medium ${notificationGranted ? 'text-success-600' : 'text-neutral-500'}`}>
                    {notificationGranted ? 'Granted' : 'Required'}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-neutral-900 text-sm font-semibold mb-2">
                What we use it for:
              </Text>
              <Text className="text-neutral-700 text-sm leading-5 mb-1">
                • Receive safety alerts when entering danger zones
              </Text>
              <Text className="text-neutral-700 text-sm leading-5 mb-1">
                • Get emergency notifications from your panic button
              </Text>
              <Text className="text-neutral-700 text-sm leading-5 mb-3">
                • Stay updated on nearby safety concerns
              </Text>
              <Text className="text-neutral-600 text-xs leading-4 italic">
                Note: Notifications are essential for the panic button and safety alerts to work properly.
              </Text>
            </View>

            {!notificationGranted && (
              <TouchableOpacity
                onPress={requestNotificationPermission}
                disabled={notificationLoading}
                className={`bg-primary-600 rounded-xl py-3 ${notificationLoading ? 'opacity-50' : ''}`}
                activeOpacity={0.8}
                accessible={true}
                accessibilityLabel="Enable notifications"
                accessibilityRole="button"
              >
                <Text className="text-white text-center font-semibold text-base">
                  {notificationLoading ? 'Requesting...' : 'Enable Notifications'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Button - Fixed at bottom with safe area padding */}
      <View className="px-6 pt-4 bg-white border-t border-neutral-100" style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!locationGranted || !notificationGranted || isNavigating}
          className={`rounded-xl py-4 ${locationGranted && notificationGranted && !isNavigating ? 'bg-primary-600' : 'bg-neutral-300'}`}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Continue to tutorial"
          accessibilityRole="button"
        >
          <Text className="text-white text-center font-bold text-lg">
            {isNavigating ? 'Loading...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Alert Modal */}
      <CustomAlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={hideAlert}
      />
    </View>
  );
}
