import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function Profile() {
  const router = useRouter();
  const [backgroundAlerts, setBackgroundAlerts] = useState(true);
  const [vibrationAlerts, setVibrationAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('hasOnboarded');
            router.replace('/onboarding/welcome');
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-primary-600 pt-14 pb-8 px-6">
          <View className="items-center">
            <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4">
              <Text className="text-5xl">👤</Text>
            </View>
            <Text className="text-white text-2xl font-bold mb-1">
              Traveler
            </Text>
            <Text className="text-white/80 text-sm">
              Protected since today
            </Text>
          </View>
        </View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          className="mx-6 -mt-6 bg-white rounded-2xl p-4 shadow-lg mb-6"
        >
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">0</Text>
              <Text className="text-xs text-gray-500 mt-1">Trips</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">0</Text>
              <Text className="text-xs text-gray-500 mt-1">Tips Added</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">0</Text>
              <Text className="text-xs text-gray-500 mt-1">Alerts</Text>
            </View>
          </View>
        </Animated.View>

        <View className="px-6">
          {/* Safety Settings */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Safety Settings
            </Text>

            <View className="bg-white rounded-2xl overflow-hidden mb-6 shadow-sm">
              <View className="px-4 py-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                      Background Alerts
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Get alerts when entering danger zones
                    </Text>
                  </View>
                  <Switch
                    value={backgroundAlerts}
                    onValueChange={setBackgroundAlerts}
                    trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
                    thumbColor={backgroundAlerts ? '#8B5CF6' : '#F3F4F6'}
                  />
                </View>
              </View>

              <View className="px-4 py-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                      Vibration Alerts
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Phone vibrates in danger zones
                    </Text>
                  </View>
                  <Switch
                    value={vibrationAlerts}
                    onValueChange={setVibrationAlerts}
                    trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
                    thumbColor={vibrationAlerts ? '#8B5CF6' : '#F3F4F6'}
                  />
                </View>
              </View>

              <View className="px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                      Sound Alerts
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Audible notifications (not recommended)
                    </Text>
                  </View>
                  <Switch
                    value={soundAlerts}
                    onValueChange={setSoundAlerts}
                    trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
                    thumbColor={soundAlerts ? '#8B5CF6' : '#F3F4F6'}
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Emergency Contacts */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Emergency Contacts
            </Text>

            <TouchableOpacity
              className="bg-white rounded-2xl p-4 mb-6 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-2xl">📞</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      Manage Contacts
                    </Text>
                    <Text className="text-sm text-gray-500">
                      0 contacts added
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-xl">›</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* About */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <Text className="text-lg font-bold text-gray-900 mb-3">
              About
            </Text>

            <View className="bg-white rounded-2xl overflow-hidden mb-6 shadow-sm">
              <TouchableOpacity
                className="px-4 py-4 border-b border-gray-100"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base text-gray-900">How It Works</Text>
                  <Text className="text-gray-400 text-xl">›</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-4 py-4 border-b border-gray-100"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base text-gray-900">Privacy Policy</Text>
                  <Text className="text-gray-400 text-xl">›</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-4 py-4"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base text-gray-900">Terms of Service</Text>
                  <Text className="text-gray-400 text-xl">›</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Logout */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-danger-50 border-2 border-danger-200 rounded-2xl p-4 mb-8"
              activeOpacity={0.7}
            >
              <Text className="text-danger-600 text-center font-bold text-base">
                Logout
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View className="items-center mb-8">
            <Text className="text-gray-400 text-xs">
              SafeTransit v1.0.0
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              Made with ❤️ by TIP Manila
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
