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
    SlideInDown,
    SlideOutDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface EmergencyAlertModalProps {
    visible: boolean;
    title?: string;
    message?: string;
    onClose: () => void;
    buttonText?: string;
}

export default function EmergencyAlertModal({
    visible,
    title = 'Emergency Alert',
    message = 'Silent alert sent to nearby helpers and emergency contacts.',
    onClose,
    buttonText = 'OK',
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
            {/* Animated Backdrop */}
            <Animated.View
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(200)}
                style={styles.backdrop}
            >
                <BlurView
                    intensity={20}
                    tint="dark"
                    style={StyleSheet.absoluteFillObject}
                />

                {/* Modal Content */}
                <Animated.View
                    entering={SlideInDown.springify().damping(15).mass(0.8)}
                    exiting={SlideOutDown.duration(200)}
                    style={styles.modalContainer}
                >
                    {/* Modal Card */}
                    <View style={styles.modalCard}>
                        {/* Gradient Accent Line */}
                        <View style={styles.accentLine} />

                        {/* Content */}
                        <View style={styles.content}>
                            {/* Title */}
                            <Text style={styles.title}>{title}</Text>

                            {/* Message */}
                            <Text style={styles.message}>{message}</Text>

                            {/* OK Button */}
                            <TouchableOpacity
                                onPress={onClose}
                                style={styles.button}
                                activeOpacity={0.7}
                                accessible={true}
                                accessibilityLabel="Close emergency alert"
                                accessibilityRole="button"
                            >
                                <Text style={styles.buttonText}>{buttonText}</Text>
                            </TouchableOpacity>
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: width - 48,
        maxWidth: 340,
    },
    modalCard: {
        backgroundColor: '#1A1C2E',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.35,
        shadowRadius: 30,
        elevation: 25,
    },
    accentLine: {
        height: 4,
        backgroundColor: '#3B82F6',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    content: {
        padding: 24,
        paddingTop: 28,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    message: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.75)',
        lineHeight: 22,
        marginBottom: 24,
    },
    button: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3B82F6',
        letterSpacing: 0.5,
    },
});
