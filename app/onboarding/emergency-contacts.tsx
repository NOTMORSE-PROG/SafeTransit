import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '@/utils/api';
import { validatePhoneNumber } from '@/services/auth/validation';
import PhoneInput from '@/components/PhoneInput';
import { DEFAULT_COUNTRY, Country } from '@/constants/countries';
import { useAuth } from '@/contexts/AuthContext';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  country: Country;
}

export default function EmergencyContacts() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: '', phoneNumber: '', country: DEFAULT_COUNTRY },
    { id: '2', name: '', phoneNumber: '', country: DEFAULT_COUNTRY },
    { id: '3', name: '', phoneNumber: '', country: DEFAULT_COUNTRY },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (user?.onboardingCompleted) {
      router.replace('/');
    }
  }, [user, router]);

  const addContact = () => {
    const newId = String(Date.now());
    setContacts([...contacts, { id: newId, name: '', phoneNumber: '', country: DEFAULT_COUNTRY }]);
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
    // Clear errors for removed contact
    const newErrors = { ...errors };
    delete newErrors[`${id}-name`];
    delete newErrors[`${id}-phone`];
    setErrors(newErrors);
  };

  const updateContact = (id: string, field: 'name' | 'phoneNumber', value: string) => {
    setContacts(contacts.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
    // Clear error for this field
    const errorKey = field === 'name' ? `${id}-name` : `${id}-phone`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const updateContactCountry = (id: string, country: Country) => {
    setContacts(contacts.map((c) => (c.id === id ? { ...c, country } : c)));
  };

  const validateContacts = () => {
    const newErrors: Record<string, string> = {};
    const filledContacts: Contact[] = [];

    contacts.forEach((contact) => {
      const hasName = contact.name.trim().length > 0;
      const hasPhone = contact.phoneNumber.trim().length > 0;

      // Skip completely empty rows
      if (!hasName && !hasPhone) return;

      // Validate partially filled rows
      if (hasName && !hasPhone) {
        newErrors[`${contact.id}-phone`] = 'Phone number required';
      }
      if (hasPhone && !hasName) {
        newErrors[`${contact.id}-name`] = 'Name required';
      }

      // Validate phone format
      if (hasPhone) {
        const validation = validatePhoneNumber(contact.phoneNumber, contact.country.code);
        if (!validation.valid) {
          newErrors[`${contact.id}-phone`] = validation.error || 'Invalid format';
        } else if (hasName) {
          filledContacts.push({
            ...contact,
            phoneNumber: validation.formatted!,
          });
        }
      }
    });

    setErrors(newErrors);
    return { valid: Object.keys(newErrors).length === 0, filledContacts };
  };

  const handleSave = async () => {
    const { valid, filledContacts } = validateContacts();
    if (!valid) return;

    if (filledContacts.length === 0) {
      handleSkip();
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch('/api/contacts/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contacts: filledContacts.map((c) => ({
            name: c.name,
            phoneNumber: c.phoneNumber,
          })),
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received:', response.status);
        setErrors({ general: 'Backend endpoint not available. Please deploy the new API endpoints.' });
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setIsNavigating(true);
        router.replace('/onboarding/tutorial');
      } else {
        setErrors({ general: data.error || 'Failed to save contacts' });
      }
    } catch (err) {
      console.error('Emergency contacts save error:', err);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.replace('/onboarding/tutorial');
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800)}
          className="mt-16 mb-8"
        >
          <Text className="text-3xl font-bold text-neutral-900 mb-3">
            Emergency Contacts
          </Text>
          <Text className="text-base text-neutral-600 leading-6">
            Add people who will be notified when you need help (optional)
          </Text>
        </Animated.View>

        {/* Contact Rows */}
        {contacts.map((contact, index) => (
          <Animated.View
            key={contact.id}
            entering={FadeInDown.delay(400 + index * 100).duration(600)}
            className="mb-4"
          >
            <View className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-bold text-neutral-700 uppercase tracking-wide">
                  Contact {index + 1}
                </Text>
                {contacts.length > 1 && (
                  <TouchableOpacity onPress={() => removeContact(contact.id)}>
                    <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center">
                      <X size={16} color="#DC2626" strokeWidth={2.5} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* Name Input */}
              <View className="mb-3">
                <Text className="text-[11px] uppercase tracking-[2px] font-bold text-neutral-400 mb-2 ml-1">
                  Name
                </Text>
                <TextInput
                  value={contact.name}
                  onChangeText={(text) => updateContact(contact.id, 'name', text)}
                  placeholder="Contact Name"
                  placeholderTextColor="#9CA3AF"
                  className={`bg-white border ${
                    errors[`${contact.id}-name`] ? 'border-red-400' : 'border-neutral-200'
                  } rounded-xl px-4 py-3 text-base text-neutral-900`}
                  accessible={true}
                  accessibilityLabel={`Contact ${index + 1} name`}
                />
                {errors[`${contact.id}-name`] && (
                  <Text className="text-[10px] font-bold text-red-500 mt-1 ml-1 uppercase">
                    {errors[`${contact.id}-name`]}
                  </Text>
                )}
              </View>

              {/* Phone Input */}
              <PhoneInput
                value={contact.phoneNumber}
                onChangeText={(text) => updateContact(contact.id, 'phoneNumber', text)}
                error={errors[`${contact.id}-phone`]}
                label="Phone Number"
                selectedCountry={contact.country}
                onCountryChange={(country) => updateContactCountry(contact.id, country)}
              />
            </View>
          </Animated.View>
        ))}

        {/* Add Contact Button */}
        <Animated.View entering={FadeInDown.delay(800).duration(600)}>
          <TouchableOpacity
            onPress={addContact}
            className="border-2 border-dashed border-primary-300 rounded-2xl py-4 mb-8 flex-row items-center justify-center"
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Add another emergency contact"
            accessibilityRole="button"
          >
            <Plus size={20} color="#2563eb" strokeWidth={2.5} />
            <Text className="ml-2 text-primary-600 font-bold text-base">
              Add Another Contact
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* General Error */}
        {errors.general && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 flex-row items-center"
          >
            <View className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2" />
            <Text className="text-red-600 text-[10px] font-black uppercase tracking-[1px] flex-1">
              {errors.general}
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Buttons */}
      <View
        className="px-6 pt-4 bg-white border-t border-neutral-100"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
      >
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleSkip}
            disabled={isNavigating}
            className="flex-1 border-2 border-neutral-200 rounded-xl py-4 items-center justify-center"
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Skip emergency contacts"
            accessibilityRole="button"
          >
            <Text className="text-neutral-600 font-bold text-base">
              Skip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || isNavigating}
            className={`flex-1 rounded-xl py-4 items-center justify-center ${
              !isLoading && !isNavigating ? 'bg-primary-600' : 'bg-neutral-300'
            }`}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Save emergency contacts and continue"
            accessibilityRole="button"
          >
            <Text className="text-white font-bold text-base">
              {isNavigating ? 'Saving...' : 'Save & Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
