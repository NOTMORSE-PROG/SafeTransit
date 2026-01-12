// Country Picker Modal
// Allows users to select their country for phone number input

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Search } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COUNTRIES, Country } from '@/constants/countries';

interface CountryPickerProps {
  visible: boolean;
  selectedCountry: Country;
  onSelect: (country: Country) => void;
  onClose: () => void;
}

export default function CountryPicker({
  visible,
  selectedCountry,
  onSelect,
  onClose,
}: CountryPickerProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (country: Country) => {
    onSelect(country);
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="px-6 py-4 border-b border-neutral-200">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-neutral-900">
              Select Country
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center"
            >
              <X size={20} color="#4b5563" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="relative justify-center">
            <View className="absolute left-3 z-10">
              <Search size={18} color="#9CA3AF" />
            </View>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search countries..."
              placeholderTextColor="#9CA3AF"
              className="bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 text-base text-neutral-900"
            />
          </View>
        </View>

        {/* Country List */}
        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.code}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Animated.View entering={FadeIn.duration(300)}>
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                className={`px-6 py-4 border-b border-neutral-100 ${
                  item.code === selectedCountry.code ? 'bg-primary-50' : 'bg-white'
                }`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">{item.flag}</Text>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-neutral-900">
                      {item.name}
                    </Text>
                    <Text className="text-sm text-neutral-500">{item.dialCode}</Text>
                  </View>
                  {item.code === selectedCountry.code && (
                    <View className="w-2 h-2 rounded-full bg-primary-600" />
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
          ListEmptyComponent={
            <View className="py-12 items-center">
              <Text className="text-neutral-400 text-base">No countries found</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}
