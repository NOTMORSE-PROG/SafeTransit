import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Info, Shield, MapPin, Users, AlertCircle } from 'lucide-react-native';
import { apiFetch } from '@/utils/api';
import { CONSENT_TYPES } from '@/constants/legalDocuments';

interface ConsentItem {
  type: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  enabled: boolean;
  detailText: string;
}

interface ConsentManagerProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (consents: Record<string, boolean>) => void;
  mode?: 'onboarding' | 'settings';
}

export default function ConsentManager({
  visible,
  onClose,
  onSave,
  mode = 'settings',
}: ConsentManagerProps) {
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const consentItems: ConsentItem[] = [
    {
      type: CONSENT_TYPES.BACKGROUND_LOCATION,
      title: 'Background Location Tracking',
      description: 'Continuous GPS monitoring for danger zone alerts',
      icon: <MapPin size={20} color="#3B82F6" />,
      required: false,
      enabled: consents[CONSENT_TYPES.BACKGROUND_LOCATION] || false,
      detailText: `**What this means:**

When enabled, SafeTransit continuously monitors your GPS location even when the app is closed or your phone is locked.

**Why we need this:**
- Alert you when entering danger zones
- Provide real-time safety warnings
- Track your route for emergency purposes

**What data is collected:**
- Your GPS coordinates (latitude/longitude)
- Location accuracy and timestamp
- Movement patterns

**Battery Impact:** Background location tracking may reduce battery life.

**You can disable this at any time** in Settings. When disabled, you'll only receive alerts while the app is open.`,
    },
    {
      type: CONSENT_TYPES.EMERGENCY_SHARING,
      title: 'Emergency Contact Sharing',
      description: 'Share location with emergency contacts during panic alerts',
      icon: <AlertCircle size={20} color="#EF4444" />,
      required: true,
      enabled: consents[CONSENT_TYPES.EMERGENCY_SHARING] !== false,
      detailText: `**What this means:**

When you activate the panic button, your real-time location is shared with your designated emergency contacts.

**How it works:**
1. You press the panic button
2. Your emergency contacts receive an SMS with your location
3. Location sharing continues until you cancel the alert
4. Contacts can see your location updates in real-time

**What data is shared:**
- Your current GPS coordinates
- Your name and profile information
- Timestamp of the alert

**Important:** Your emergency contacts will only receive your location during active panic alerts, not at any other time.

This feature is **required** to use the emergency panic button feature.`,
    },
    {
      type: CONSENT_TYPES.FAMILY_SHARING,
      title: 'Family Location Sharing',
      description: 'Share real-time location with invited family members',
      icon: <Users size={20} color="#10B981" />,
      required: false,
      enabled: consents[CONSENT_TYPES.FAMILY_SHARING] || false,
      detailText: `**What this means:**

When enabled, family members you invite can see your real-time location on their map.

**How it works:**
- Create or join a family group
- Your GPS coordinates are visible to all family members
- You can see family members' locations in return
- Updates refresh every 30 seconds

**What data is shared:**
- Your current GPS coordinates
- Location accuracy and timestamp
- Your name and profile photo

**Privacy:**
- Only family members you explicitly invite can see your location
- You can leave a family group at any time
- Disabling this hides your location from all family members immediately

**Battery Impact:** Real-time location sharing may reduce battery life.`,
    },
    {
      type: CONSENT_TYPES.DATA_PROCESSING,
      title: 'Essential Data Processing',
      description: 'Core data processing necessary for SafeTransit to function',
      icon: <Shield size={20} color="#6B7280" />,
      required: true,
      enabled: true,
      detailText: `**What this means:**

Basic data processing required for SafeTransit to operate.

**What we process:**
- Your account information (name, email)
- Authentication tokens (for login)
- App usage analytics (which features you use)
- Safety tips and forum posts you create

**Why this is required:**
- Authenticate your identity
- Store your preferences
- Provide core safety features
- Improve the app experience

**Data Security:**
- All data encrypted in transit (HTTPS)
- Passwords hashed and secured
- JWT authentication tokens
- Database encryption at rest

This consent is **required** to use SafeTransit and cannot be disabled.`,
    },
  ];

  useEffect(() => {
    if (visible) {
      fetchConsents();
    }
  }, [visible]);

  const fetchConsents = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/user/consents');
      if (response.ok) {
        const data = await response.json();
        setConsents(data.consents || {});
      }
    } catch (error) {
      console.error('Failed to fetch consents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleConsent = (consentType: string, required: boolean) => {
    if (required) {
      Alert.alert(
        'Required Consent',
        'This consent is required for SafeTransit to function properly and cannot be disabled.',
        [{ text: 'OK' }]
      );
      return;
    }

    setConsents((prev) => ({
      ...prev,
      [consentType]: !prev[consentType],
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Save each consent type
      for (const [consentType, consentGiven] of Object.entries(consents)) {
        await apiFetch('/api/user/consents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consent_type: consentType,
            consent_given: consentGiven,
            method: mode,
          }),
        });
      }

      if (onSave) {
        onSave(consents);
      }

      Alert.alert(
        'Consents Updated',
        'Your consent preferences have been saved successfully.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Failed to save consents:', error);
      Alert.alert(
        'Error',
        'Failed to save your consent preferences. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const showDetail = (consentType: string) => {
    setShowDetailModal(consentType);
  };

  const activeDetailItem = consentItems.find(
    (item) => item.type === showDetailModal
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-12 bg-white rounded-t-3xl">
            {/* Header */}
            <View className="border-b border-gray-200 px-6 py-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-900">
                    Manage Consents
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    Control how SafeTransit uses your data
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
                  accessibilityLabel="Close consent manager"
                  accessibilityRole="button"
                >
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-500 mt-4">Loading consents...</Text>
              </View>
            ) : (
              <ScrollView className="flex-1 px-6 py-4">
                {consentItems.map((item, index) => (
                  <View
                    key={item.type}
                    className={`bg-gray-50 rounded-xl p-4 ${
                      index > 0 ? 'mt-3' : ''
                    }`}
                  >
                    <View className="flex-row items-start">
                      <View className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3">
                        {item.icon}
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-base font-semibold text-gray-900 flex-1">
                            {item.title}
                            {item.required && (
                              <Text className="text-xs text-red-500 ml-2">
                                {' '}
                                (Required)
                              </Text>
                            )}
                          </Text>
                          <Switch
                            value={item.enabled}
                            onValueChange={() =>
                              toggleConsent(item.type, item.required)
                            }
                            disabled={item.required}
                            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                            thumbColor={item.enabled ? '#FFFFFF' : '#F3F4F6'}
                            accessibilityLabel={`Toggle ${item.title}`}
                          />
                        </View>
                        <Text className="text-sm text-gray-600 mb-2">
                          {item.description}
                        </Text>
                        <TouchableOpacity
                          onPress={() => showDetail(item.type)}
                          className="flex-row items-center"
                          accessibilityLabel={`View details about ${item.title}`}
                          accessibilityRole="button"
                        >
                          <Info size={14} color="#3B82F6" />
                          <Text className="text-xs text-blue-500 ml-1 font-medium">
                            View Details
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}

                <View className="mt-6 bg-blue-50 rounded-xl p-4">
                  <Text className="text-sm text-blue-800 leading-5">
                    <Text className="font-semibold">💡 Note:</Text> You can change
                    these preferences at any time in Settings → Data & Privacy.
                    Changes take effect immediately.
                  </Text>
                </View>

                {/* Bottom spacing */}
                <View className="h-24" />
              </ScrollView>
            )}

            {/* Footer */}
            {!isLoading && (
              <View className="border-t border-gray-200 px-6 bg-white" style={{ paddingTop: 16, paddingBottom: Math.max(insets.bottom + 16, 24) }}>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={onClose}
                    className="flex-1 py-3 px-4 rounded-xl bg-gray-100"
                    accessibilityLabel="Cancel consent changes"
                    accessibilityRole="button"
                  >
                    <Text className="text-center font-semibold text-gray-700">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    className="flex-1 py-3 px-4 rounded-xl bg-blue-500 flex-row items-center justify-center"
                    accessibilityLabel="Save consent preferences"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isSaving }}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-center font-semibold text-white">
                        Save Changes
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      {activeDetailItem && (
        <Modal
          visible={!!showDetailModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowDetailModal(null)}
        >
          <View className="flex-1 bg-black/60 justify-center px-6">
            <View className="bg-white rounded-2xl p-6 max-h-[80%]">
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-3">
                  {activeDetailItem.icon}
                </View>
                <Text className="text-lg font-bold text-gray-900 flex-1">
                  {activeDetailItem.title}
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={true}>
                <Text className="text-sm text-gray-700 leading-6 whitespace-pre-line">
                  {activeDetailItem.detailText}
                </Text>
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowDetailModal(null)}
                className="mt-6 py-3 px-4 rounded-xl bg-blue-500"
                accessibilityLabel="Close details"
                accessibilityRole="button"
              >
                <Text className="text-center font-semibold text-white">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}
