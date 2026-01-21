// ReportModal Component
// Modal for reporting inappropriate content

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { X, AlertTriangle } from 'lucide-react-native';
import { REPORT_REASONS, type ReportReason } from '@/services/types/forum';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason) => Promise<void>;
  contentType: 'post' | 'comment';
}

export function ReportModal({ visible, onClose, onSubmit, contentType }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedReason || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(selectedReason);
      setSelectedReason(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <AlertTriangle color="#dc2626" size={24} strokeWidth={2} />
              <Text className="text-xl font-bold text-neutral-900 ml-2">
                Report {contentType === 'post' ? 'Post' : 'Comment'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} className="p-2">
              <X color="#6b7280" size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Info text */}
          <Text className="text-sm text-neutral-600 mb-4">
            Please select a reason for reporting this {contentType}. Our team will review it within 24 hours.
          </Text>

          {/* Reason Options */}
          {(Object.keys(REPORT_REASONS) as ReportReason[]).map((reason) => (
            <TouchableOpacity
              key={reason}
              onPress={() => setSelectedReason(reason)}
              className={`flex-row items-center p-4 rounded-xl mb-2 border ${
                selectedReason === reason
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-200 bg-neutral-50'
              }`}
              activeOpacity={0.7}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                  selectedReason === reason
                    ? 'border-primary-600 bg-primary-600'
                    : 'border-neutral-300'
                }`}
              >
                {selectedReason === reason && (
                  <View className="w-2 h-2 rounded-full bg-white" />
                )}
              </View>
              <Text
                className={`text-base font-medium ${
                  selectedReason === reason ? 'text-primary-700' : 'text-neutral-700'
                }`}
              >
                {REPORT_REASONS[reason]}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Error message */}
          {error && (
            <Text className="text-sm text-danger-600 mt-2 text-center">
              {error}
            </Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className={`mt-4 py-4 rounded-xl items-center ${
              selectedReason ? 'bg-danger-600' : 'bg-neutral-200'
            }`}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                className={`text-base font-semibold ${
                  selectedReason ? 'text-white' : 'text-neutral-400'
                }`}
              >
                Submit Report
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
