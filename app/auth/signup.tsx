import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
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
  User,
  Chrome,
} from "lucide-react-native";

export default function Signup() {
  const router = useRouter();

  // Fields, buttons, and switches
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // State and effects
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Whole form validation
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password);

  const passwordsMatch = password === confirmPassword;

  const canSubmit =
    fullName &&
    emailValid &&
    passwordValid &&
    passwordsMatch &&
    acceptTerms &&
    !isLoading;

  // Signup event ahndler
  const handleSignup = async () => {
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    if (!canSubmit) return;
    setError("Please follow all the requirements before signing up.");
    setIsLoading(true);

    try {
      setIsLoading(true);
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.replace("/onboarding/welcome");
    } catch {
      setError("Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Top most part */}
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
            Create Account
          </Text>
        </Animated.View>
        <Text className="text-white/70 text-sm text-center font-medium tracking-wide">
          Join SafeTransit and commute with full confidence.
        </Text>
      </View>

      {/* Whole form */}
      <ScrollView
        className="flex-1 px-8 pt-8"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          className="mb-6"
        >
          <Text className="text-[11px] uppercase tracking-[2px] font-bold text-neutral-400 mb-2 ml-1">
            Full Name
          </Text>
          <View className="relative justify-center">
            <View className="absolute left-4 z-10">
              <User size={18} color="#9CA3AF" />
            </View>
            <TextInput
              placeholder="Your full name"
              value={fullName}
              onChangeText={setFullName}
              className="bg-neutral-50 border border-neutral-200 rounded-xl pl-12 pr-4 py-4 text-base text-neutral-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          className="mb-6"
        >
          <Text className="text-[11px] uppercase tracking-[2px] font-bold text-neutral-400 mb-2 ml-1">
            Email Address
          </Text>
          <View className="relative justify-center">
            <View className="absolute left-4 z-10">
              <Mail size={18} color="#9CA3AF" />
            </View>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@domain.com"
              placeholderTextColor="#9CA3AF"
              className="bg-neutral-50 border border-neutral-200 rounded-xl pl-12 pr-4 py-4 text-base text-neutral-900"
            />
          </View>
          {!emailValid && email.length > 0 && (
            <Text className="text-[10px] font-bold text-red-500 mt-1 ml-1 uppercase">
              Invalid email format
            </Text>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          className="mb-6"
        >
          <Text className="text-[11px] uppercase tracking-[2px] font-bold text-neutral-400 mb-2 ml-1">
            Password
          </Text>
          <View className="relative justify-center mb-4">
            <View className="absolute left-4 z-10">
              <Lock size={18} color="#9CA3AF" />
            </View>
            <TextInput
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              className="bg-neutral-50 border border-neutral-200 rounded-xl pl-12 pr-12 py-4 text-base text-neutral-900"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              className="absolute right-4"
              accessibilityRole="button"
            >
              {showPassword ? (
                <Eye size={20} color="#9CA3AF" />
              ) : (
                <EyeOff size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-y-2">
            <RequirementPill label="8+ chars" active={password.length >= 8} />
            <RequirementPill
              label="Uppercase"
              active={/[A-Z]/.test(password)}
            />
            <RequirementPill label="Number" active={/[0-9]/.test(password)} />
            <RequirementPill
              label="Special"
              active={/[!@#$%^&*]/.test(password)}
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          className="mb-6"
        >
          <Text className="text-[11px] uppercase tracking-[2px] font-bold text-neutral-400 mb-2 ml-1">
            Confirm Password
          </Text>
          <View className="relative justify-center">
            <View className="absolute left-4 z-10">
              <Lock size={18} color="#9CA3AF" />
            </View>
            <TextInput
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              className="bg-neutral-50 border border-neutral-200 rounded-xl pl-12 pr-12 py-4 text-base text-neutral-900"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-4"
              accessibilityRole="button"
            >
              {showConfirmPassword ? (
                <Eye size={20} color="#9CA3AF" />
              ) : (
                <EyeOff size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>
          {!passwordsMatch && confirmPassword.length > 0 && (
            <Text className="text-[10px] font-bold text-red-500 mt-1 ml-1 uppercase">
              Passwords do not match
            </Text>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(500).duration(500)}
          className="mb-10"
        >
          <View className="flex-row items-center justify-between border border-neutral-100 rounded-2xl px-4 py-3">
            <Text className="text-xs text-neutral-500 flex-1 mr-3 font-medium">
              I agree to the{" "}
              <Text
                onPress={() => setShowTermsModal(true)}
                className="text-primary-600 font-bold underline"
              >
                Terms & Privacy
              </Text>
            </Text>
            <Switch
              value={acceptTerms}
              onValueChange={setAcceptTerms}
              trackColor={{ false: "#e5e5e5", true: "#2563eb" }}
              thumbColor="#ffffff"
            />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Buttons and redirects */}
      <View className="px-8 pb-10 pt-4 bg-white border-t border-neutral-50">
        {/* Error Alert Display */}
        {error && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 flex-row items-center"
          >
            <View className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2" />
            <Text className="text-red-600 text-[10px] font-black uppercase tracking-[1px]">
              {error}
            </Text>
          </Animated.View>
        )}

        <TouchableOpacity
          onPress={handleSignup}
          disabled={!canSubmit}
          className={`rounded-2xl py-5 shadow-xl ${
            canSubmit ? "bg-primary-600" : "bg-neutral-200"
          }`}
          activeOpacity={0.9}
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-center font-bold text-base uppercase tracking-widest">
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => console.log("Sign up with Google")}
          className="mt-4 flex-row items-center justify-center border border-neutral-200 rounded-2xl py-4"
          activeOpacity={0.7}
        >
          <Chrome size={18} color="#6B7280" />
          <Text className="ml-3 text-neutral-600 font-bold text-sm uppercase tracking-tight">
            Sign up with Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          className="mt-8"
        >
          <Text className="text-center text-neutral-400 text-base font-medium mb-[50px]">
            Already have an account?{" "}
            <Text className="text-primary-600 font-bold uppercase tracking-tighter">
              Login
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showTermsModal} transparent animationType="fade">
        <View className="flex-1 bg-neutral-900/80 justify-center px-6">
          <Animated.View
            entering={FadeInDown}
            className="bg-white rounded-[32px] p-8 shadow-2xl"
          >
            <Text className="text-xl font-black text-neutral-900 mb-4 tracking-tight">
              Terms & Privacy
            </Text>
            <Text className="text-sm text-neutral-500 mb-8 leading-6 font-medium">
              By using SafeTransit, you agree to our data usage and privacy
              practices. Your data is encrypted and never sold.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setAcceptTerms(true);
                setShowTermsModal(false);
              }}
              className="bg-primary-600 rounded-2xl py-4"
            >
              <Text className="text-white text-center font-bold uppercase tracking-widest">
                Confirm
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const RequirementPill = ({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) => (
  <View
    className={`px-3 py-1.5 mr-2 rounded-lg border ${
      active
        ? "bg-primary-600 border-primary-600"
        : "bg-transparent border-neutral-200"
    }`}
  >
    <Text
      className={`text-[9px] font-bold uppercase tracking-tighter ${
        active ? "text-white" : "text-neutral-400"
      }`}
    >
      {label}
    </Text>
  </View>
);
