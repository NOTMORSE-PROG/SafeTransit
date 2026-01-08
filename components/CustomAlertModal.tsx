import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type AlertType = 'success' | 'warning' | 'info' | 'error';

interface CustomAlertModalProps {
    visible: boolean;
    title: string;
    message: string;
    type?: AlertType;
    buttonText?: string;
    onClose: () => void;
    secondaryButtonText?: string;
    onSecondaryPress?: () => void;
}

const alertConfig = {
    success: {
        colors: ['#22c55e', '#16a34a'] as const,
        icon: CheckCircle2,
        iconBg: 'bg-success-500',
        badgeBg: 'bg-success-50',
        badgeBorder: 'border-success-200',
        badgeText: 'text-success-700',
    },
    warning: {
        colors: ['#f59e0b', '#d97706'] as const,
        icon: AlertTriangle,
        iconBg: 'bg-warning-500',
        badgeBg: 'bg-warning-50',
        badgeBorder: 'border-warning-200',
        badgeText: 'text-warning-700',
    },
    info: {
        colors: ['#3b82f6', '#2563eb'] as const,
        icon: Info,
        iconBg: 'bg-primary-500',
        badgeBg: 'bg-primary-50',
        badgeBorder: 'border-primary-200',
        badgeText: 'text-primary-700',
    },
    error: {
        colors: ['#ef4444', '#dc2626'] as const,
        icon: ShieldAlert,
        iconBg: 'bg-danger-500',
        badgeBg: 'bg-danger-50',
        badgeBorder: 'border-danger-200',
        badgeText: 'text-danger-700',
    },
};

export default function CustomAlertModal({
    visible,
    title,
    message,
    type = 'info',
    buttonText = 'OK',
    onClose,
    secondaryButtonText,
    onSecondaryPress,
}: CustomAlertModalProps) {
    if (!visible) return null;

    const config = alertConfig[type];
    const IconComponent = config.icon;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Animated.View
                entering={FadeIn.duration(200)}
                className="flex-1 justify-center items-center px-6"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            >
                {/* Modal Content */}
                <Animated.View
                    entering={FadeInUp.duration(250)}
                    className="w-full max-w-sm rounded-3xl overflow-hidden bg-white"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 12 },
                        shadowOpacity: 0.2,
                        shadowRadius: 24,
                        elevation: 20,
                    }}
                >
                    {/* Header with Icon */}
                    <View className="pt-8 pb-4 px-6 items-center">
                        {/* Icon Circle with Gradient Ring */}
                        <View
                            className="w-20 h-20 rounded-full items-center justify-center mb-5"
                            style={{
                                backgroundColor: type === 'success' ? '#dcfce7' :
                                    type === 'warning' ? '#fef3c7' :
                                        type === 'error' ? '#fee2e2' : '#dbeafe',
                            }}
                        >
                            <LinearGradient
                                colors={[...config.colors]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="w-14 h-14 rounded-full items-center justify-center"
                            >
                                <IconComponent color="#ffffff" size={28} strokeWidth={2.5} />
                            </LinearGradient>
                        </View>

                        {/* Title */}
                        <Text className="text-xl font-bold text-neutral-900 text-center mb-2">
                            {title}
                        </Text>

                        {/* Message */}
                        <Text className="text-base text-neutral-600 text-center leading-6 px-2">
                            {message}
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View className="px-6 pb-6 pt-2">
                        {secondaryButtonText && onSecondaryPress ? (
                            <View className="flex-row">
                                {/* Secondary Button */}
                                <TouchableOpacity
                                    onPress={onSecondaryPress}
                                    className="flex-1 rounded-xl py-4 mr-2 bg-neutral-100"
                                    activeOpacity={0.8}
                                    accessible={true}
                                    accessibilityLabel={secondaryButtonText}
                                    accessibilityRole="button"
                                >
                                    <Text className="text-neutral-600 text-center font-bold text-base">
                                        {secondaryButtonText}
                                    </Text>
                                </TouchableOpacity>

                                {/* Primary Button */}
                                <TouchableOpacity
                                    onPress={onClose}
                                    activeOpacity={0.8}
                                    accessible={true}
                                    accessibilityLabel={buttonText}
                                    accessibilityRole="button"
                                    className="flex-1 ml-2 overflow-hidden rounded-xl"
                                >
                                    <LinearGradient
                                        colors={[...config.colors]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        className="py-4 rounded-xl"
                                    >
                                        <Text className="text-white text-center font-bold text-base">
                                            {buttonText}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            /* Single Primary Button */
                            <TouchableOpacity
                                onPress={onClose}
                                activeOpacity={0.8}
                                accessible={true}
                                accessibilityLabel={buttonText}
                                accessibilityRole="button"
                                className="overflow-hidden rounded-xl"
                            >
                                <LinearGradient
                                    colors={[...config.colors]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-4 rounded-xl"
                                    style={{
                                        shadowColor: config.colors[1],
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.25,
                                        shadowRadius: 8,
                                        elevation: 6,
                                    }}
                                >
                                    <Text className="text-white text-center font-bold text-base">
                                        {buttonText}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}
