// Google Only Account Modal
// Displayed when user tries to login with email/password
// but their account is Google-only

import React from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Chrome, X } from 'lucide-react-native';

interface GoogleOnlyModalProps {
  visible: boolean;
  onClose: () => void;
  onContinueWithGoogle: () => void;
  isLoading?: boolean;
}

export function GoogleOnlyModal({
  visible,
  onClose,
  onContinueWithGoogle,
  isLoading = false,
}: GoogleOnlyModalProps) {
  return (
    <Modal visible={visible} transparent animationType="none">
      <View className="flex-1 bg-black/50 justify-center px-6">
        <Animated.View
          entering={FadeInDown}
          className="bg-white rounded-3xl p-6 shadow-2xl"
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-neutral-900">
              Google Sign-In Required
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-base text-neutral-600 mb-6 leading-6">
            This email address is registered with Google Sign-In. Please use
            Google to continue.
          </Text>

          <TouchableOpacity
            onPress={onContinueWithGoogle}
            disabled={isLoading}
            className="bg-primary-600 rounded-2xl py-4 flex-row items-center justify-center mb-3"
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Chrome size={20} color="#ffffff" />
                <Text className="text-white font-bold text-base ml-3 uppercase tracking-tight">
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} className="py-3">
            <Text className="text-neutral-500 text-center font-medium">
              Cancel
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
