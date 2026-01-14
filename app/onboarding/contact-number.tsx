import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Phone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '@/utils/api';
import { validatePhoneNumber } from '@/services/auth/validation';
import PhoneInput from '@/components/PhoneInput';
import { DEFAULT_COUNTRY, Country } from '@/constants/countries';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ContactNumber() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (user?.onboardingCompleted) {
        // User already completed onboarding, set flag and go to home
        await AsyncStorage.setItem('hasOnboarded', 'true');
        router.replace('/(tabs)');
      } else if (user?.phoneNumber) {
        router.replace('/onboarding/emergency-contacts');
      }
    };
    checkOnboarding();
  }, [user, router]);

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
    setError('');

    // Real-time validation
    if (text.length > 0) {
      const validation = validatePhoneNumber(text, selectedCountry.code);
      if (!validation.valid) {
        setError(validation.error || 'Invalid phone number');
      }
    }
  };

  const handleNext = async () => {
    const validation = validatePhoneNumber(phoneNumber, selectedCountry.code);
    if (!validation.valid) {
      setError(validation.error || 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch('/api/user/update-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumber: validation.formatted }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received:', response.status);
        setError('Backend endpoint not available. Please deploy the new API endpoints.');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setIsNavigating(true);
        router.replace('/onboarding/emergency-contacts');
      } else {
        setError(data.error || 'Failed to save phone number');
      }
    } catch (err) {
      console.error('Contact number save error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isPhoneValid = phoneNumber.length > 0 && !error;

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6">
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800)}
          className="mt-16 mb-8"
        >
          <Text className="text-3xl font-bold text-neutral-900 mb-3">
            Your Contact Number
          </Text>
          <Text className="text-base text-neutral-600 leading-6">
            We need your number to keep you safe and notify emergency contacts
          </Text>
        </Animated.View>

        {/* Phone Input */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(800)}
          className="mb-6"
        >
          <PhoneInput
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            error={error}
            label="Phone Number"
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
          />
        </Animated.View>

        {/* Info Card */}
        <Animated.View entering={FadeInDown.delay(600).duration(800)}>
          <View className="bg-primary-50 border-2 border-primary-200 rounded-2xl p-5">
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-primary-600 items-center justify-center mr-4">
                <Phone color="#ffffff" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-neutral-900 font-bold text-base mb-1">
                  Why we need this
                </Text>
                <Text className="text-neutral-700 text-sm leading-5">
                  Your number will be shared with emergency contacts when you trigger an alert
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Button */}
      <View
        className="px-6 pt-4 bg-white border-t border-neutral-100"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
      >
        <TouchableOpacity
          onPress={handleNext}
          disabled={!isPhoneValid || isLoading || isNavigating}
          className={`rounded-xl py-4 ${
            isPhoneValid && !isLoading && !isNavigating
              ? 'bg-primary-600'
              : 'bg-neutral-300'
          }`}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Continue to emergency contacts"
          accessibilityRole="button"
        >
          <Text className="text-white text-center font-bold text-lg">
            {isNavigating ? 'Saving...' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
