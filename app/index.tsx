import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasOnboarded = await AsyncStorage.getItem("hasOnboarded");

        setTimeout(() => {
          if (hasOnboarded === "true") {
            router.replace("/(tabs)");
          } else {
            router.replace("/auth/signup");
          }
        }, 1000);
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        router.replace("/auth/signup");
      }
    };

    checkOnboarding();
  }, [router]);

  return (
    <View className="flex-1 bg-primary-600 items-center justify-center">
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}
