import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Navigation, Clock, Ruler, ShieldCheck, X, Route } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface NavigationConfirmModalProps {
    visible: boolean;
    routeName: string;
    duration: string;
    distance: string;
    onClose: () => void;
    onConfirm: () => void;
}

export default function NavigationConfirmModal({
    visible,
    routeName,
    duration,
    distance,
    onClose,
    onConfirm,
}: NavigationConfirmModalProps) {
    if (!visible) return null;

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
                entering={FadeIn.duration(250)}
                className="flex-1 justify-center items-center px-6"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
            >
                {/* Modal Content */}
                <Animated.View
                    entering={FadeInDown.duration(300)}
                    className="w-full max-w-sm rounded-3xl overflow-hidden bg-white"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 12 },
                        shadowOpacity: 0.25,
                        shadowRadius: 24,
                        elevation: 20,
                    }}
                >
                    {/* Header with gradient */}
                    <LinearGradient
                        colors={['#2563eb', '#1d4ed8', '#1e40af']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="px-6 pt-6 pb-8"
                    >
                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={onClose}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 items-center justify-center"
                            activeOpacity={0.7}
                            accessible={true}
                            accessibilityLabel="Close"
                            accessibilityRole="button"
                        >
                            <X color="#ffffff" size={18} strokeWidth={2.5} />
                        </TouchableOpacity>

                        {/* Icon and Title */}
                        <View className="items-center">
                            <View
                                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                            >
                                <Navigation color="#ffffff" size={32} strokeWidth={2} />
                            </View>
                            <Text className="text-2xl font-bold text-white text-center">
                                Start Navigation
                            </Text>
                            <Text className="text-base text-white/80 text-center mt-2">
                                Ready to navigate via
                            </Text>
                        </View>
                    </LinearGradient>

                    {/* Route Name Badge */}
                    <View className="px-6 -mt-4">
                        <View
                            className="rounded-2xl px-4 py-3 flex-row items-center justify-center bg-white shadow-sm border border-neutral-100"
                        >
                            <Route color="#2563eb" size={18} strokeWidth={2} />
                            <Text className="text-lg font-bold text-neutral-900 ml-2">
                                {routeName}
                            </Text>
                        </View>
                    </View>

                    {/* Content */}
                    <View className="px-6 pt-5 pb-6">
                        {/* Route Info Cards */}
                        <View className="flex-row mb-5">
                            {/* Duration Card */}
                            <View
                                className="flex-1 rounded-2xl p-4 mr-2 bg-neutral-50 border border-neutral-100"
                            >
                                <View className="flex-row items-center mb-2">
                                    <View
                                        className="w-8 h-8 rounded-full items-center justify-center bg-primary-50"
                                    >
                                        <Clock color="#2563eb" size={16} strokeWidth={2} />
                                    </View>
                                    <Text className="text-xs text-neutral-500 ml-2 uppercase tracking-wide font-medium">
                                        Duration
                                    </Text>
                                </View>
                                <Text className="text-xl font-bold text-neutral-900">{duration}</Text>
                            </View>

                            {/* Distance Card */}
                            <View
                                className="flex-1 rounded-2xl p-4 ml-2 bg-neutral-50 border border-neutral-100"
                            >
                                <View className="flex-row items-center mb-2">
                                    <View
                                        className="w-8 h-8 rounded-full items-center justify-center bg-primary-50"
                                    >
                                        <Ruler color="#2563eb" size={16} strokeWidth={2} />
                                    </View>
                                    <Text className="text-xs text-neutral-500 ml-2 uppercase tracking-wide font-medium">
                                        Distance
                                    </Text>
                                </View>
                                <Text className="text-xl font-bold text-neutral-900">{distance}</Text>
                            </View>
                        </View>

                        {/* Safety Badge */}
                        <View
                            className="rounded-xl p-3 mb-6 flex-row items-center bg-safe-50 border border-safe-100"
                        >
                            <View
                                className="w-8 h-8 rounded-full items-center justify-center bg-safe-100"
                            >
                                <ShieldCheck color="#16a34a" size={18} strokeWidth={2} />
                            </View>
                            <Text className="text-sm text-safe-700 ml-3 flex-1 font-medium">
                                You'll receive safety alerts along your route
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        <View className="flex-row">
                            {/* Cancel Button */}
                            <TouchableOpacity
                                onPress={onClose}
                                className="flex-1 rounded-xl py-4 mr-2 bg-neutral-100"
                                activeOpacity={0.8}
                                accessible={true}
                                accessibilityLabel="Cancel navigation"
                                accessibilityRole="button"
                            >
                                <Text className="text-neutral-600 text-center font-bold text-base">
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            {/* Start Button */}
                            <TouchableOpacity
                                onPress={onConfirm}
                                activeOpacity={0.8}
                                accessible={true}
                                accessibilityLabel="Start navigation"
                                accessibilityRole="button"
                                className="flex-1 ml-2 overflow-hidden rounded-xl"
                            >
                                <LinearGradient
                                    colors={['#3b82f6', '#2563eb']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-4 rounded-xl"
                                    style={{
                                        shadowColor: '#2563eb',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 8,
                                        elevation: 6,
                                    }}
                                >
                                    <View className="flex-row items-center justify-center">
                                        <Navigation color="#ffffff" size={18} strokeWidth={2.5} />
                                        <Text className="text-white text-center font-bold text-base ml-2">
                                            Start
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}
