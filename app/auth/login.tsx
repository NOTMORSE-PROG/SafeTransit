import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
  Lock,
  Chrome,
} from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { GoogleOnlyModal } from "../../components/GoogleOnlyModal";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { signInWithGoogle, isLoading: googleLoading } = useGoogleAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // State and effects
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showGoogleOnlyModal, setShowGoogleOnlyModal] = useState(false);

  // Whole form validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);


  const canSubmit = email.length > 0 && password.length > 0 && isEmailValid && !isLoading;

  const handleLogin = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!canSubmit) {
      setError("Please enter a valid email and password.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await login(data.token, data.user);
        router.replace("/onboarding/welcome");
      } else {
        // Check for Google-only account error
        if (data.errorCode === 'GOOGLE_ONLY_ACCOUNT') {
          setShowGoogleOnlyModal(true);
        } else {
          setError(data.error || 'Login failed');
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setShowGoogleOnlyModal(false);

    const result = await signInWithGoogle();

    if (result.success && result.token && result.user) {
      await login(result.token, result.user);
      router.replace("/onboarding/welcome");
    } else {
      setError(result.error || 'Google sign-in failed');
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!isEmailValid || email.length === 0) {
      setError("Please enter your email to reset password.");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setSuccessMessage(`Forgot Password Message is sent to ${email}`);
    setIsLoading(false);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Top most */}
      <View className="bg-primary-600 pt-16 pb-10 px-6 rounded-b-[40px] shadow-2xl">
        <Animated.View
          entering={FadeIn.duration(800)}
          className="items-center mb-2"
        >
          <View className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl items-center justify-center mb-4 shadow-inner">
            <View className="w-16 h-16 rounded-2xl bg-white/20 items-center justify-center">
              <ShieldCheck color="#ffffff" size={38} strokeWidth={1.5} />
            </View>
          </View>
          <Text className="text-white text-2xl font-bold tracking-tight">
            Welcome Back
          </Text>
        </Animated.View>
        <Text className="text-white/70 text-sm text-center font-medium tracking-wide">
          Log in to SafeTransit to continue your journey.
        </Text>
      </View>

      {/* Whole Form */}
      <ScrollView
        className="flex-1 px-8 pt-10"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          className="mb-6"
        >
          <Text className="text-[11px] uppercase tracking-[2px] font-bold text-neutral-400 mb-2 ml-1">Email Address</Text>
          <View className="relative justify-center">
            <View className="absolute left-4 z-10"><Mail size={18} color="#9CA3AF" /></View>
            <TextInput
              value={email}
              onChangeText={(text) => { setEmail(text); setSuccessMessage(null); }} 
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@domain.com"
              placeholderTextColor="#9CA3AF"
              className={`bg-neutral-50 border ${!isEmailValid && email.length > 0 ? 'border-red-400' : 'border-neutral-200'} rounded-xl pl-12 pr-4 py-4 text-base text-neutral-900`}
            />
          </View>
          {!isEmailValid && email.length > 0 && (
            <Text className="text-[10px] font-bold text-red-500 mt-1 ml-1 uppercase">
              Invalid email format
            </Text>
          )}
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          className="mb-8"
        >
          <Text className="text-[11px] uppercase tracking-[2px] font-bold text-neutral-400 mb-2 ml-1">
            Password
          </Text>
          <View className="relative justify-center">
            <View className="absolute left-4 z-10">
              <Lock size={18} color="#9CA3AF" />
            </View>
            <TextInput
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              className="bg-neutral-50 border border-neutral-200 rounded-xl pl-12 pr-12 py-4 text-base text-neutral-900"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              className="absolute right-4"
            >
              {showPassword ? (
                <Eye size={20} color="#9CA3AF" />
              ) : (
                <EyeOff size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Forgot Password */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <TouchableOpacity
            onPress={handleForgotPassword}
            className="mb-8"
            disabled={isLoading}
          >
            <Text className="text-primary-600 text-center font-bold text-sm uppercase tracking-tight">
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <View className="px-8 pb-10 pt-4 bg-white border-t border-neutral-50">
        {error && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 flex-row items-center"
          >
            <View className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2" />
            <Text className="text-red-600 text-[10px] font-black uppercase tracking-[1px] flex-1">
              {error}
            </Text>
          </Animated.View>
        )}

        {successMessage && (
  <Animated.View entering={FadeInDown.duration(400)} className="mb-4 bg-green-50 border border-green-100 rounded-xl p-3 flex-row items-center">
    <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
    <Text className="text-green-700 text-[10px] font-black uppercase tracking-[1px] flex-1">
      {successMessage}
    </Text>
  </Animated.View>
)}


        {/* Buttons and redirects */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={!canSubmit}
          className={`rounded-2xl py-5 shadow-xl ${
            canSubmit ? "bg-primary-600" : "bg-neutral-200"
          }`}
          activeOpacity={0.9}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-center font-bold text-base uppercase tracking-widest">
              Login
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
          className="mt-4 flex-row items-center justify-center border border-neutral-200 rounded-2xl py-4"
          activeOpacity={0.7}
        >
          {googleLoading ? (
            <ActivityIndicator color="#6B7280" size="small" />
          ) : (
            <>
              <Chrome size={18} color="#6B7280" />
              <Text className="ml-3 text-neutral-600 font-bold text-sm uppercase tracking-tight">
                Login with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/auth/signup")}
          className="mt-8"
        >
          <Text className="text-center text-neutral-400 text-base font-medium mb-[40px]">
            Don't have an account?{" "}
            <Text className="text-primary-600 font-bold uppercase tracking-tighter">
              Sign Up
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      <GoogleOnlyModal
        visible={showGoogleOnlyModal}
        onClose={() => setShowGoogleOnlyModal(false)}
        onContinueWithGoogle={handleGoogleSignIn}
        isLoading={googleLoading}
      />
    </View>
  );
}