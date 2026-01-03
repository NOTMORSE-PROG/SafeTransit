import { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Shield, Map, Bell, AlertOctagon } from 'lucide-react-native';

const { height } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <LinearGradient
      colors={['#2563eb', '#1d4ed8', '#1e40af']}
      className="flex-1"
    >
      <View className="flex-1 px-6 justify-between py-16">
        {/* Logo and Title */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(1000)}
          className="items-center mt-20"
        >
          <View className="w-32 h-32 bg-white/20 rounded-full items-center justify-center mb-8">
            <View className="w-24 h-24 bg-white rounded-full items-center justify-center">
              <Shield color="#2563eb" size={64} strokeWidth={2} />
            </View>
          </View>

          <Text className="text-white text-5xl font-bold text-center mb-4">
            SafeTransit
          </Text>

          <Text className="text-white/90 text-xl text-center font-medium">
            Your Guardian in the City
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(1000)}
          className="space-y-6"
        >
          <View className="flex-row items-start">
            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4">
              <Map color="#ffffff" size={28} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold mb-1">
                Safe Route Planning
              </Text>
              <Text className="text-white/80 text-base">
                Navigate through the city with routes designed for your safety
              </Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4">
              <Bell color="#ffffff" size={28} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold mb-1">
                Real-time Alerts
              </Text>
              <Text className="text-white/80 text-base">
                Get notified when entering high-risk areas, even in background
              </Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4">
              <AlertOctagon color="#ffffff" size={28} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold mb-1">
                Silent Emergency
              </Text>
              <Text className="text-white/80 text-base">
                Discreet panic button to alert helpers without drawing attention
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* CTA Button */}
        <Animated.View entering={FadeInDown.delay(600).duration(1000)}>
          <TouchableOpacity
            onPress={() => {
              if (isNavigating) return;
              setIsNavigating(true);
              router.replace('/onboarding/permissions');
            }}
            disabled={isNavigating}
            className={`bg-white rounded-2xl py-4 shadow-lg ${isNavigating ? 'opacity-50' : ''}`}
            activeOpacity={0.8}
          >
            <Text className="text-primary-600 text-center text-lg font-bold">
              {isNavigating ? 'Loading...' : 'Get Started'}
            </Text>
          </TouchableOpacity>

          <Text className="text-white/70 text-center text-sm mt-6">
            Made for women, by students who care
          </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}
