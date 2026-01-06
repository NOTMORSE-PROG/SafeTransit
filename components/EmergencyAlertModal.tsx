import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Dimensions,
    StyleSheet,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    ZoomIn,
    ZoomOut,
} from 'react-native-reanimated';
import { AlertOctagon } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface EmergencyAlertModalProps {
    visible: boolean;
    title?: string;
    message?: string;
    onClose: () => void;
    buttonText?: string;
    // For confirmation mode
    isConfirmation?: boolean;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export default function EmergencyAlertModal({
    visible,
    title = 'Emergency Alert',
    message = 'Silent alert sent to nearby helpers and emergency contacts.',
    onClose,
    buttonText = 'OK',
    isConfirmation = false,
    onConfirm,
    confirmText = 'Send Alert',
    cancelText = 'Cancel',
}: EmergencyAlertModalProps) {
    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                style={styles.backdrop}
            >
                {/* Modal Content */}
                <Animated.View
                    entering={ZoomIn.duration(200)}
                    exiting={ZoomOut.duration(150)}
                    style={styles.modalContainer}
                >
                    {/* Modal Card */}
                    <View style={styles.modalCard}>
                        {/* Icon Header */}
                        <View style={styles.iconContainer}>
                            <AlertOctagon color="#FFFFFF" size={32} strokeWidth={2} />
                        </View>

                        {/* Content */}
                        <View style={styles.content}>
                            {/* Title */}
                            <Text style={styles.title}>{title}</Text>

                            {/* Message */}
                            <Text style={styles.message}>{message}</Text>

                            {/* Buttons */}
                            {isConfirmation ? (
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        onPress={onClose}
                                        style={styles.cancelButton}
                                        activeOpacity={0.7}
                                        accessible={true}
                                        accessibilityLabel="Cancel"
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.cancelButtonText}>{cancelText}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            onConfirm?.();
                                            onClose();
                                        }}
                                        style={styles.confirmButton}
                                        activeOpacity={0.7}
                                        accessible={true}
                                        accessibilityLabel="Send alert"
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.confirmButtonText}>{confirmText}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={styles.okButton}
                                    activeOpacity={0.7}
                                    accessible={true}
                                    accessibilityLabel="Close emergency alert"
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.okButtonText}>{buttonText}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContainer: {
        width: width - 48,
        maxWidth: 340,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 20,
    },
    iconContainer: {
        backgroundColor: '#dc2626', // danger-600
        paddingVertical: 20,
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937', // neutral-800
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#6b7280', // neutral-500
        lineHeight: 22,
        marginBottom: 24,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f3f4f6', // neutral-100
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280', // neutral-500
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#dc2626', // danger-600
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    okButton: {
        backgroundColor: '#2563eb', // primary-600
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    okButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
