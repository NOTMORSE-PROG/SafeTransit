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
import { ShieldCheck, MapPin, Bell } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface ProtectionEnabledModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function ProtectionEnabledModal({
    visible,
    onClose,
}: ProtectionEnabledModalProps) {
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
                    entering={ZoomIn.duration(250)}
                    exiting={ZoomOut.duration(150)}
                    style={styles.modalContainer}
                >
                    {/* Modal Card */}
                    <View style={styles.modalCard}>
                        {/* Icon Header with Gradient Effect */}
                        <View style={styles.iconContainer}>
                            {/* Decorative rings */}
                            <View style={styles.outerRing}>
                                <View style={styles.middleRing}>
                                    <View style={styles.innerRing}>
                                        <ShieldCheck color="#FFFFFF" size={36} strokeWidth={2.5} />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Content */}
                        <View style={styles.content}>
                            {/* Title */}
                            <Text style={styles.title}>Protection Enabled</Text>

                            {/* Subtitle */}
                            <Text style={styles.subtitle}>
                                You're now protected
                            </Text>

                            {/* Feature List */}
                            <View style={styles.featureList}>
                                <View style={styles.featureItem}>
                                    <View style={styles.featureIcon}>
                                        <MapPin color="#2563eb" size={18} strokeWidth={2} />
                                    </View>
                                    <Text style={styles.featureText}>
                                        Background location monitoring active
                                    </Text>
                                </View>

                                <View style={styles.featureItem}>
                                    <View style={styles.featureIcon}>
                                        <Bell color="#2563eb" size={18} strokeWidth={2} />
                                    </View>
                                    <Text style={styles.featureText}>
                                        High-risk zone alerts enabled
                                    </Text>
                                </View>
                            </View>

                            {/* OK Button */}
                            <TouchableOpacity
                                onPress={onClose}
                                style={styles.okButton}
                                activeOpacity={0.8}
                                accessible={true}
                                accessibilityLabel="Confirm protection enabled"
                                accessibilityRole="button"
                            >
                                <Text style={styles.okButtonText}>Got it</Text>
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
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 20,
    },
    iconContainer: {
        backgroundColor: '#2563eb', // primary-600
        paddingVertical: 32,
        alignItems: 'center',
        // Subtle gradient effect via layered views
    },
    outerRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    middleRing: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerRing: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        paddingTop: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1f2937', // neutral-800
        marginBottom: 4,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#22c55e', // safe-500
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    featureList: {
        marginBottom: 24,
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff', // primary-50
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    featureIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    featureText: {
        fontSize: 14,
        color: '#374151', // neutral-700
        fontWeight: '500',
        flex: 1,
    },
    okButton: {
        backgroundColor: '#2563eb', // primary-600
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    okButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
});
