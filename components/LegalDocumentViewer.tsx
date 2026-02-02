import { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { X, Check } from 'lucide-react-native';

interface LegalDocumentViewerProps {
  visible: boolean;
  onClose: () => void;
  onAccept?: () => void;
  documentType?: 'terms' | 'privacy';
  document: {
    title: string;
    version: string;
    effectiveDate: string;
    content: string;
  };
  mode?: 'view' | 'accept';  // 'view' mode = just viewing, 'accept' mode = must accept
  requireScrollToBottom?: boolean;
}

export default function LegalDocumentViewer({
  visible,
  onClose,
  onAccept,
  document,
  mode = 'view',
  requireScrollToBottom = true,
}: LegalDocumentViewerProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const isCloseToBottom = ({
    layoutMeasurement,
    contentOffset,
    contentSize,
  }: NativeScrollEvent) => {
    const paddingToBottom = 20;
    return (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    );
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isCloseToBottom(event.nativeEvent)) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    handleClose();
  };

  const handleClose = () => {
    setHasScrolledToBottom(false);
    onClose();
  };

  const canAccept = mode === 'accept' && (!requireScrollToBottom || hasScrolledToBottom);
  const showAcceptButton = mode === 'accept' && onAccept;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-12 bg-white rounded-t-3xl">
          {/* Header */}
          <View className="border-b border-gray-200 px-6 py-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">
                  {document.title}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Version {document.version} • Effective {document.effectiveDate}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
                accessibilityLabel="Close legal document"
                accessibilityRole="button"
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scroll indicator if scrolling is required */}
          {mode === 'accept' && requireScrollToBottom && !hasScrolledToBottom && (
            <View className="bg-blue-50 px-6 py-3 border-b border-blue-100">
              <Text className="text-sm text-blue-700 text-center">
                📜 Please scroll to the bottom to continue
              </Text>
            </View>
          )}

          {/* Document Content */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-6"
            onScroll={handleScroll}
            scrollEventThrottle={400}
            showsVerticalScrollIndicator={true}
          >
            <View className="py-4">
              <Markdown
                style={{
                  body: {
                    fontSize: 15,
                    lineHeight: 24,
                    color: '#374151',
                  },
                  heading1: {
                    fontSize: 24,
                    fontWeight: '700',
                    marginTop: 16,
                    marginBottom: 12,
                    color: '#111827',
                  },
                  heading2: {
                    fontSize: 20,
                    fontWeight: '600',
                    marginTop: 16,
                    marginBottom: 10,
                    color: '#1F2937',
                  },
                  heading3: {
                    fontSize: 17,
                    fontWeight: '600',
                    marginTop: 12,
                    marginBottom: 8,
                    color: '#374151',
                  },
                  paragraph: {
                    marginTop: 0,
                    marginBottom: 12,
                    lineHeight: 24,
                  },
                  strong: {
                    fontWeight: '700',
                    color: '#111827',
                  },
                  em: {
                    fontStyle: 'italic',
                  },
                  list_item: {
                    marginBottom: 8,
                  },
                  bullet_list: {
                    marginBottom: 12,
                  },
                  ordered_list: {
                    marginBottom: 12,
                  },
                  blockquote: {
                    backgroundColor: '#F9FAFB',
                    borderLeftColor: '#9CA3AF',
                    borderLeftWidth: 4,
                    paddingLeft: 16,
                    paddingVertical: 12,
                    marginBottom: 12,
                  },
                  code_inline: {
                    backgroundColor: '#F3F4F6',
                    color: '#EF4444',
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    borderRadius: 4,
                    fontSize: 14,
                    fontFamily: 'monospace',
                  },
                  code_block: {
                    backgroundColor: '#1F2937',
                    color: '#E5E7EB',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                    fontSize: 14,
                    fontFamily: 'monospace',
                  },
                  hr: {
                    backgroundColor: '#E5E7EB',
                    height: 1,
                    marginVertical: 16,
                  },
                }}
              >
                {document.content}
              </Markdown>
            </View>

            {/* Bottom spacing for better scroll experience */}
            <View className="h-24" />
          </ScrollView>

          {/* Footer with actions */}
          <View className="border-t border-gray-200 px-6 bg-white" style={{ paddingTop: 16, paddingBottom: Math.max(insets.bottom + 16, 24) }}>
            {showAcceptButton ? (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-100"
                  accessibilityLabel="Decline terms"
                  accessibilityRole="button"
                >
                  <Text className="text-center font-semibold text-gray-700">
                    Decline
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAccept}
                  disabled={!canAccept}
                  className={`flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center ${
                    canAccept ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                  accessibilityLabel="Accept terms"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canAccept }}
                >
                  <Check size={18} color="white" style={{ marginRight: 6 }} />
                  <Text className="text-center font-semibold text-white">
                    Accept
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleClose}
                className="py-3 px-4 rounded-xl bg-blue-500"
                accessibilityLabel="Close document"
                accessibilityRole="button"
              >
                <Text className="text-center font-semibold text-white">
                  Close
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
