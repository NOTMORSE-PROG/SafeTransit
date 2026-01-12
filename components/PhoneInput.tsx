// Phone Input Component
// Reusable component for phone number input with country selection

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { DEFAULT_COUNTRY, Country } from '@/constants/countries';
import CountryPicker from './CountryPicker';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  label: string;
  selectedCountry?: Country;
  onCountryChange?: (country: Country) => void;
}

export default function PhoneInput({
  value,
  onChangeText,
  error,
  placeholder,
  label,
  selectedCountry,
  onCountryChange,
}: PhoneInputProps) {
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const country = selectedCountry || DEFAULT_COUNTRY;

  const handleCountrySelect = (newCountry: Country) => {
    if (onCountryChange) {
      onCountryChange(newCountry);
    }
  };

  return (
    <View>
      <Text className="text-[11px] uppercase tracking-[2px] font-bold text-neutral-400 mb-2 ml-1">
        {label}
      </Text>
      <View className="relative">
        {/* Country Selector Button */}
        <TouchableOpacity
          onPress={() => setShowCountryPicker(true)}
          className="absolute left-3 top-0 bottom-0 flex-row items-center z-10"
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel={`Selected country: ${country.name}`}
          accessibilityRole="button"
        >
          <Text className="text-2xl mr-1">{country.flag}</Text>
          <Text className="text-base font-semibold text-neutral-700 mr-1">
            {country.dialCode}
          </Text>
          <ChevronDown size={16} color="#6b7280" />
        </TouchableOpacity>

        {/* Phone Number Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
          placeholder={placeholder || '123 456 7890'}
          placeholderTextColor="#9CA3AF"
          className={`bg-neutral-50 border ${
            error ? 'border-red-400' : 'border-neutral-200'
          } rounded-xl pl-28 pr-4 py-4 text-base text-neutral-900`}
          accessible={true}
          accessibilityLabel={label}
          accessibilityHint={error || 'Enter your phone number'}
        />
      </View>
      {error && (
        <Text className="text-[10px] font-bold text-red-500 mt-1 ml-1 uppercase">
          {error}
        </Text>
      )}

      {/* Country Picker Modal */}
      <CountryPicker
        visible={showCountryPicker}
        selectedCountry={country}
        onSelect={handleCountrySelect}
        onClose={() => setShowCountryPicker(false)}
      />
    </View>
  );
}
