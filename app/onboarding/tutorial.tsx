import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Map, ShieldCheck, AlertOctagon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: 'Map',
    title: 'Plan Safe Routes',
    description: 'Get safety-first navigation that avoids danger zones. Choose walking, driving, or public transit routes designed for your protection.',
    color: '#2563eb' // primary-600
  },
  {
    icon: 'ShieldCheck',
    title: 'Background Protection',
    description: 'Stay protected even when the app is closed. SafeTransit monitors your location and alerts you when entering high-risk areas.',
    color: '#1d4ed8' // primary-700
  },
  {
    icon: 'AlertOctagon',
    title: 'Silent Panic Button',
    description: 'Access hidden emergency features with a simple gesture. Alert helpers and contacts discreetly without drawing attention.',
    color: '#dc2626' // danger-600
  }
];

export default function Tutorial() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    setCurrentPage(page);
  };

  const handleNext = () => {
    if (currentPage < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentPage + 1),
        animated: true
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    if (isNavigating) return; // Prevent multiple clicks
    setIsNavigating(true);

    try {
      await AsyncStorage.setItem('hasOnboarded', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      setIsNavigating(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Skip Button */}
      <View className="absolute right-6 z-10" style={{ top: Math.max(insets.top, 48) }}>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text className="text-primary-600 font-semibold text-base">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => {
          const IconComponent = slide.icon === 'Map' ? Map : slide.icon === 'ShieldCheck' ? ShieldCheck : AlertOctagon;
          return (
            <View key={index} style={{ width }} className="flex-1 px-8 justify-center">
              <Animated.View
                entering={FadeInDown.duration(800)}
                className="items-center"
              >
                <View
                  className="w-40 h-40 rounded-full items-center justify-center mb-12"
                  style={{ backgroundColor: `${slide.color}20` }}
                >
                  <IconComponent color={slide.color} size={96} strokeWidth={1.5} />
                </View>

                <Text className="text-3xl font-bold text-neutral-900 text-center mb-6">
                  {slide.title}
                </Text>

                <Text className="text-base text-neutral-600 text-center leading-7 px-4">
                  {slide.description}
                </Text>
              </Animated.View>
            </View>
          );
        })}
      </ScrollView>

      {/* Pagination Dots */}
      <View className="flex-row justify-center mb-8">
        {slides.map((_, index) => (
          <View
            key={index}
            className={`h-2 rounded-full mx-1 ${index === currentPage ? 'w-8 bg-primary-600' : 'w-2 bg-neutral-300'
              }`}
          />
        ))}
      </View>

      {/* Bottom Button */}
      <View className="px-8" style={{ paddingBottom: Math.max(insets.bottom + 16, 64) }}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={isNavigating}
          className={`bg-primary-600 rounded-xl py-4 ${isNavigating ? 'opacity-50' : ''}`}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel={currentPage === slides.length - 1 ? "Get started" : "Next slide"}
          accessibilityRole="button"
        >
          <Text className="text-white text-center font-bold text-lg">
            {isNavigating ? 'Loading...' : currentPage === slides.length - 1 ? "Let's Go" : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
