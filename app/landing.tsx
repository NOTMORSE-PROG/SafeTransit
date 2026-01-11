import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { ShieldCheck, MapPin } from "lucide-react-native";

export default function Landing() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white justify-between">
      {/* Hero Section */}
      <Animated.View
        entering={FadeIn.duration(800)}
        className="px-8 pt-16 items-center"
      >
        {/* Logo with decorative elements */}
        <View className="items-center mb-6">
          <View className="relative">
            {/* Main logo */}
            <View className="w-40 h-40 items-center justify-center">
              <Image
                source={require("../assets/logo.png")}
                style={{ width: 140, height: 140 }}
                resizeMode="contain"
              />
            </View>

            {/* Decorative floating elements */}
            <View className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-primary-500 items-center justify-center shadow-medium">
              <ShieldCheck color="#ffffff" size={24} strokeWidth={2.5} />
            </View>
            <View className="absolute -bottom-2 -left-2 w-12 h-12 rounded-full bg-secondary-500 items-center justify-center shadow-medium">
              <MapPin color="#ffffff" size={24} strokeWidth={2.5} />
            </View>
          </View>
        </View>

        {/* App Name */}
        <Text className="text-primary-600 text-3xl font-bold text-center mb-4 tracking-tight">
          SafeTransit
        </Text>

        {/* Headline */}
        <Text className="text-neutral-900 text-2xl font-bold text-center mb-3 leading-tight">
          Travel Safely with{"\n"}Peace of Mind
        </Text>

        {/* Subheadline */}
        <Text className="text-neutral-500 text-sm text-center leading-relaxed">
          Community-powered safety tips and real-time alerts for women travelers
        </Text>
      </Animated.View>

      {/* CTAs */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(600)}
        className="px-8"
      >
        {/* Primary CTA - Get Started */}
        <TouchableOpacity
          onPress={() => router.push("/auth/signup")}
          className="bg-primary-600 rounded-2xl py-5 shadow-xl mb-4"
          activeOpacity={0.9}
        >
          <View className="flex-row items-center justify-center">
            <Text className="text-white text-center font-bold text-base uppercase tracking-widest mr-2">
              Get Started
            </Text>
            <ShieldCheck color="#ffffff" size={20} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Secondary CTA - Login */}
        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          className="border-2 border-primary-600 rounded-2xl py-5"
          activeOpacity={0.8}
        >
          <Text className="text-primary-600 text-center font-bold text-base uppercase tracking-widest">
            Login
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Footer */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(600)}
        className="px-8 py-6 pb-10 border-t border-neutral-100 bg-white"
      >
        <View className="flex-row items-center justify-center space-x-4">
          <TouchableOpacity activeOpacity={0.7}>
            <Text className="text-neutral-400 text-xs font-medium">
              Terms of Service
            </Text>
          </TouchableOpacity>
          <View className="w-1 h-1 rounded-full bg-neutral-300" />
          <TouchableOpacity activeOpacity={0.7}>
            <Text className="text-neutral-400 text-xs font-medium">
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
