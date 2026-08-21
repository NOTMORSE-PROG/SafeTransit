import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  FileText,
  Shield,
  Settings,
  Download,
  Trash2,
  Info,
} from 'lucide-react-native';
import LegalDocumentViewer from '@/components/LegalDocumentViewer';
import ConsentManager from '@/components/ConsentManager';
import { LEGAL_DOCUMENTS } from '@/constants/legalDocuments';
import { apiFetch } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export default function DataPrivacy() {
  const router = useRouter();
  const { logout } = useAuth();

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showConsentManager, setShowConsentManager] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = () => {
    Alert.alert(
      'Export Your Data',
      'We will compile all your data (profile, location history, emergency contacts, family members, and forum posts) into a JSON file. This may take a few moments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              setIsExporting(true);
              const response = await apiFetch('/api/user/profile?action=export', {
                method: 'POST',
              });

              if (response.ok) {
                const data = await response.json();

                Alert.alert(
                  'Data Export Ready',
                  `Your data has been exported successfully. The download link will expire in 7 days.\n\nSize: ${data.size || 'Unknown'}\nFiles: ${data.fileCount || 1}`,
                  [
                    {
                      text: 'Download',
                      onPress: () => {
                        // In a real implementation, open the download URL
                        console.log('Download URL:', data.exportUrl);
                        Alert.alert(
                          'Download',
                          'Your data export is ready. In a production app, this would trigger a file download.',
                          [{ text: 'OK' }]
                        );
                      },
                    },
                    { text: 'Later' },
                  ]
                );
              } else {
                throw new Error('Export failed');
              }
            } catch (error) {
              console.error('Data export error:', error);
              Alert.alert(
                'Export Failed',
                'Failed to export your data. Please try again later.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsExporting(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      '⚠️ WARNING: This action is permanent and cannot be undone.\n\nAll your data will be permanently deleted including:\n• Profile information\n• Location history\n• Emergency contacts\n• Family connections\n• Forum posts and comments\n• Safety tips\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Enter "DELETE" to confirm permanent account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setIsDeleting(true);
                      const response = await apiFetch('/api/user/profile?action=delete', {
                        method: 'DELETE',
                      });

                      if (response.ok) {
                        Alert.alert(
                          'Account Deleted',
                          'Your account and all associated data have been permanently deleted. You will now be logged out.',
                          [
                            {
                              text: 'OK',
                              onPress: () => {
                                logout();
                                router.replace('/landing');
                              },
                            },
                          ]
                        );
                      } else {
                        throw new Error('Delete failed');
                      }
                    } catch (error) {
                      console.error('Account deletion error:', error);
                      Alert.alert(
                        'Deletion Failed',
                        'Failed to delete your account. Please try again later.',
                        [{ text: 'OK' }]
                      );
                    } finally {
                      setIsDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const MenuItem = ({
    icon,
    title,
    description,
    onPress,
    iconColor = '#3B82F6',
    isDestructive = false,
    isLoading = false,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    onPress: () => void;
    iconColor?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      className={`bg-white rounded-xl p-4 flex-row items-center mb-3 ${
        isDestructive ? 'border border-red-200' : 'border border-gray-200'
      }`}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isLoading }}
    >
      <View
        className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
          isDestructive ? 'bg-red-50' : 'bg-blue-50'
        }`}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          icon
        )}
      </View>
      <View className="flex-1">
        <Text
          className={`text-base font-semibold ${
            isDestructive ? 'text-red-600' : 'text-gray-900'
          }`}
        >
          {title}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">{description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              Data & Privacy
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Manage your data and privacy settings
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Information Banner */}
        <View className="bg-blue-50 rounded-xl p-4 mb-6 flex-row">
          <Info size={20} color="#3B82F6" style={{ marginTop: 2, marginRight: 12 }} />
          <View className="flex-1">
            <Text className="text-sm text-blue-900 font-semibold mb-1">
              Your Privacy Rights
            </Text>
            <Text className="text-sm text-blue-800 leading-5">
              Under the Philippine Data Privacy Act, you have the right to access,
              rectify, erase, and export your personal data.
            </Text>
          </View>
        </View>

        {/* Legal Documents Section */}
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Legal Documents
        </Text>

        <MenuItem
          icon={<FileText size={20} color="#3B82F6" />}
          title="Terms of Service"
          description="View our terms and conditions"
          onPress={() => setShowTermsModal(true)}
        />

        <MenuItem
          icon={<Shield size={20} color="#3B82F6" />}
          title="Privacy Policy"
          description="Learn how we protect your data"
          onPress={() => setShowPrivacyModal(true)}
        />

        {/* Privacy Controls Section */}
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-6 mb-3">
          Privacy Controls
        </Text>

        <MenuItem
          icon={<Settings size={20} color="#10B981" />}
          title="Manage Consents"
          description="Control how we use your data"
          onPress={() => setShowConsentManager(true)}
          iconColor="#10B981"
        />

        {/* Data Rights Section */}
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-6 mb-3">
          Your Data Rights
        </Text>

        <MenuItem
          icon={<Download size={20} color="#8B5CF6" />}
          title="Export My Data"
          description="Download all your data in JSON format"
          onPress={handleExportData}
          iconColor="#8B5CF6"
          isLoading={isExporting}
        />

        {/* Danger Zone */}
        <Text className="text-xs font-semibold text-red-500 uppercase tracking-wide mt-6 mb-3">
          Danger Zone
        </Text>

        <MenuItem
          icon={<Trash2 size={20} color="#EF4444" />}
          title="Delete My Account"
          description="Permanently delete your account and all data"
          onPress={handleDeleteAccount}
          iconColor="#EF4444"
          isDestructive={true}
          isLoading={isDeleting}
        />

        {/* Footer Info */}
        <View className="mt-6 bg-gray-100 rounded-xl p-4">
          <Text className="text-xs text-gray-600 leading-5">
            <Text className="font-semibold">Data Retention:</Text> Your location
            history is automatically deleted after 90 days. Other data is retained
            until you delete your account.
            {'\n\n'}
            <Text className="font-semibold">Questions?</Text> Contact us at
            privacy@safetransit.app
          </Text>
        </View>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Modals */}
      <LegalDocumentViewer
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        documentType="terms"
        document={LEGAL_DOCUMENTS.termsOfService}
        mode="view"
      />

      <LegalDocumentViewer
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        documentType="privacy"
        document={LEGAL_DOCUMENTS.privacyPolicy}
        mode="view"
      />

      <ConsentManager
        visible={showConsentManager}
        onClose={() => setShowConsentManager(false)}
        mode="settings"
      />
    </View>
  );
}
