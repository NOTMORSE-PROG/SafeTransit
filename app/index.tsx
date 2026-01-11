import { useEffect, useRef, useCallback } from "react";
import { View, Text, Image, Animated } from "react-native";
import { useRouter, Href } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const appNameAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;

  const handleNavigation = useCallback(async () => {
    try {
      if (user) {
        // User is authenticated
        const hasOnboarded = await AsyncStorage.getItem("hasOnboarded");

        if (hasOnboarded === "true") {
          // Navigate to home
          router.replace("/(tabs)" as Href);
        } else {
          // Navigate to onboarding
          router.replace("/onboarding/welcome" as Href);
        }
      } else {
        // User is not authenticated - navigate to landing page
        router.replace("/landing" as Href);
      }
    } catch (error) {
      console.error("Navigation error:", error);
      router.replace("/landing" as Href);
    }
  }, [user, router]);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate app name after logo
    Animated.timing(appNameAnim, {
      toValue: 1,
      duration: 600,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Animate tagline after app name
    Animated.timing(taglineAnim, {
      toValue: 1,
      duration: 600,
      delay: 500,
      useNativeDriver: true,
    }).start();

    // Navigation logic after minimum display time
    const navigationTimer = setTimeout(async () => {
      if (!authLoading) {
        await handleNavigation();
      }
    }, 2000); // Minimum 2 seconds

    return () => clearTimeout(navigationTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, handleNavigation]);

  // Additional check when auth loading completes
  useEffect(() => {
    if (!authLoading) {
      const delayTimer = setTimeout(async () => {
        await handleNavigation();
      }, 2000);

      return () => clearTimeout(delayTimer);
    }
  }, [authLoading, handleNavigation]);

  return (
    <View className="flex-1 bg-white items-center justify-center px-8">
      {/* Animated Logo Container */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="items-center mb-4"
      >
        {/* Logo */}
        <View className="w-40 h-40 items-center justify-center">
          <Image
            source={require("../assets/logo.png")}
            style={{ width: 160, height: 160 }}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* Animated App Name */}
      <Animated.View
        style={{
          opacity: appNameAnim,
          transform: [
            {
              translateY: appNameAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        <Text className="text-primary-600 text-4xl font-bold tracking-tight text-center mb-2">
          SafeTransit
        </Text>
      </Animated.View>

      {/* Animated Tagline */}
      <Animated.View
        style={{
          opacity: taglineAnim,
          transform: [
            {
              translateY: taglineAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        <Text className="text-neutral-500 text-lg text-center font-medium tracking-wide">
          Your Journey, Protected
        </Text>
      </Animated.View>

      {/* Loading indicator */}
      <Animated.View
        style={{ opacity: fadeAnim }}
        className="absolute bottom-20"
      >
        <View className="flex-row items-center space-x-2">
          <View className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
          <View className="w-2 h-2 rounded-full bg-primary-600 animate-pulse delay-75" />
          <View className="w-2 h-2 rounded-full bg-primary-600 animate-pulse delay-150" />
        </View>
      </Animated.View>
    </View>
  );
}
