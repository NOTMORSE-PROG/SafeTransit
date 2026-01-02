import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Mock weather data
const WEATHER_DATA = {
  city: 'Manila',
  temperature: '28°C',
  condition: 'Partly Cloudy',
  humidity: '75%',
  wind: '12 km/h',
  forecast: [
    { day: 'Mon', high: 30, low: 25, icon: '⛅' },
    { day: 'Tue', high: 31, low: 26, icon: '☀️' },
    { day: 'Wed', high: 29, low: 24, icon: '🌧️' },
    { day: 'Thu', high: 28, low: 23, icon: '⛈️' },
    { day: 'Fri', high: 30, low: 25, icon: '⛅' },
  ]
};

export default function QuickExit() {
  const router = useRouter();
  const [showBackButton, setShowBackButton] = useState(false);

  useEffect(() => {
    // Show back button after 3 seconds
    const timer = setTimeout(() => {
      setShowBackButton(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 bg-gradient-to-b from-blue-400 to-blue-600">
      <LinearGradient
        colors={['#60A5FA', '#3B82F6', '#2563EB']}
        className="flex-1"
      >
        <ScrollView className="flex-1">
          {/* Header */}
          <Animated.View
            entering={FadeIn.duration(600)}
            className="px-6 pt-16 pb-8"
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-4xl font-bold mb-1">
                  {WEATHER_DATA.temperature}
                </Text>
                <Text className="text-white/90 text-xl">
                  {WEATHER_DATA.condition}
                </Text>
              </View>
              <Text className="text-8xl">⛅</Text>
            </View>

            <Text className="text-white/80 text-lg">
              📍 {WEATHER_DATA.city}
            </Text>
          </Animated.View>

          {/* Current Details */}
          <Animated.View
            entering={FadeIn.delay(200).duration(600)}
            className="mx-6 mb-6"
          >
            <View className="bg-white/20 backdrop-blur rounded-2xl p-6">
              <Text className="text-white text-lg font-semibold mb-4">
                Current Conditions
              </Text>

              <View className="flex-row justify-between">
                <View className="items-center">
                  <Text className="text-white/70 text-sm mb-1">Humidity</Text>
                  <Text className="text-white text-xl font-bold">
                    {WEATHER_DATA.humidity}
                  </Text>
                </View>

                <View className="items-center">
                  <Text className="text-white/70 text-sm mb-1">Wind</Text>
                  <Text className="text-white text-xl font-bold">
                    {WEATHER_DATA.wind}
                  </Text>
                </View>

                <View className="items-center">
                  <Text className="text-white/70 text-sm mb-1">Visibility</Text>
                  <Text className="text-white text-xl font-bold">
                    10 km
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* 5-Day Forecast */}
          <Animated.View
            entering={FadeIn.delay(400).duration(600)}
            className="mx-6 mb-6"
          >
            <Text className="text-white text-lg font-semibold mb-4">
              5-Day Forecast
            </Text>

            <View className="bg-white/20 backdrop-blur rounded-2xl p-4">
              {WEATHER_DATA.forecast.map((day, index) => (
                <View
                  key={index}
                  className={`flex-row items-center justify-between py-3 ${
                    index < WEATHER_DATA.forecast.length - 1 ? 'border-b border-white/20' : ''
                  }`}
                >
                  <Text className="text-white text-base font-medium w-12">
                    {day.day}
                  </Text>
                  <Text className="text-3xl">{day.icon}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-white text-base font-semibold mr-2">
                      {day.high}°
                    </Text>
                    <Text className="text-white/60 text-base">
                      {day.low}°
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Hourly */}
          <Animated.View
            entering={FadeIn.delay(600).duration(600)}
            className="mx-6 mb-8"
          >
            <Text className="text-white text-lg font-semibold mb-4">
              Hourly Forecast
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row -mx-6 px-6"
            >
              {['Now', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'].map((time, index) => (
                <View
                  key={index}
                  className="bg-white/20 backdrop-blur rounded-2xl p-4 mr-3 items-center"
                  style={{ width: 80 }}
                >
                  <Text className="text-white/80 text-sm mb-2">{time}</Text>
                  <Text className="text-3xl mb-2">
                    {index % 3 === 0 ? '☀️' : index % 2 === 0 ? '⛅' : '☁️'}
                  </Text>
                  <Text className="text-white text-lg font-semibold">
                    {28 + index}°
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        </ScrollView>

        {/* Secret Back Button */}
        {showBackButton && (
          <Animated.View
            entering={FadeIn.duration(1000)}
            className="absolute bottom-8 right-8"
          >
            <TouchableOpacity
              onPress={() => router.back()}
              onLongPress={() => router.back()}
              className="bg-white/30 backdrop-blur rounded-full w-14 h-14 items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-white text-2xl">←</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Invisible tap zones for returning (triple tap anywhere) */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => {
            // Count taps (simplified - in production use a proper tap counter)
            if (e.nativeEvent.timestamp) {
              router.back();
            }
          }}
          className="absolute inset-0"
          style={{ opacity: 0 }}
        />
      </LinearGradient>
    </View>
  );
}
