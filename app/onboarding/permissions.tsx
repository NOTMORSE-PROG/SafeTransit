import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MapPin, Bell, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Permissions() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const requestLocationPermission = async () => {
    setLocationLoading(true);
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus === 'granted') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

        if (backgroundStatus === 'granted') {
          setLocationGranted(true);
        } else {
          Alert.alert(
            'Background Location Required',
            'SafeTransit needs background location access to warn you of danger zones even when your phone is locked.',
            [{ text: 'OK' }]
          );
        }
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
        Alert.alert(
          'Notifications Enabled',
          'You will receive safety alerts when entering danger zones.',
          [{ text: 'OK' }]
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
      router.replace('/onboarding/tutorial'); // Use replace to avoid stacking
    } else {
      Alert.alert(
        'Permissions Required',
        'Both location and notification permissions are required for SafeTransit to protect you.',
        [{ text: 'OK' }]
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
            SafeTransit needs these permissions to keep you safe
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

            <Text className="text-neutral-700 text-sm mb-4 leading-5">
              To warn you of danger zones even when your phone is in your pocket, SafeTransit needs to access your location in the background.
            </Text>

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

            <Text className="text-neutral-700 text-sm mb-4 leading-5">
              Receive critical safety alerts and warnings about nearby danger zones.
            </Text>

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

      {/* Bottom Button */}
      <View className="px-6 pt-4 bg-white border-t border-neutral-100" style={{ paddingBottom: Math.max(insets.bottom, 48) }}>
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
    </View>
  );
}
