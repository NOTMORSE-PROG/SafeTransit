import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Navigation, Clock, Ruler, ShieldCheck, X } from 'lucide-react-native';

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
                entering={FadeIn.duration(200)}
                className="flex-1 bg-black/50 justify-end"
            >
                {/* Modal Content */}
                <Animated.View
                    entering={SlideInDown.duration(300).springify().damping(18)}
                    exiting={SlideOutDown.duration(200)}
                    className="bg-white rounded-t-3xl shadow-2xl"
                >
                    {/* Handle Bar */}
                    <View className="items-center pt-4 pb-2">
                        <View className="w-12 h-1.5 bg-neutral-300 rounded-full" />
                    </View>

                    <View className="px-6 pb-10">
                        {/* Header with Icon */}
                        <View className="items-center mb-6">
                            <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center mb-4">
                                <Navigation color="#2563eb" size={32} strokeWidth={2} />
                            </View>
                            <Text className="text-2xl font-bold text-neutral-900 text-center">
                                Start Navigation
                            </Text>
                            <Text className="text-base text-neutral-500 text-center mt-1">
                                Ready to navigate via
                            </Text>
                            <Text className="text-lg font-semibold text-primary-600 text-center mt-1">
                                {routeName}
                            </Text>
                        </View>

                        {/* Route Info Cards */}
                        <View className="flex-row mb-6">
                            {/* Duration Card */}
                            <View className="flex-1 bg-neutral-100 rounded-2xl p-4 mr-2">
                                <View className="flex-row items-center mb-2">
                                    <Clock color="#4b5563" size={18} strokeWidth={2} />
                                    <Text className="text-sm text-neutral-500 ml-2">Duration</Text>
                                </View>
                                <Text className="text-xl font-bold text-neutral-900">{duration}</Text>
                            </View>

                            {/* Distance Card */}
                            <View className="flex-1 bg-neutral-100 rounded-2xl p-4 ml-2">
                                <View className="flex-row items-center mb-2">
                                    <Ruler color="#4b5563" size={18} strokeWidth={2} />
                                    <Text className="text-sm text-neutral-500 ml-2">Distance</Text>
                                </View>
                                <Text className="text-xl font-bold text-neutral-900">{distance}</Text>
                            </View>
                        </View>

                        {/* Safety Badge */}
                        <View className="bg-safe-50 border border-safe-200 rounded-xl p-3 mb-6 flex-row items-center">
                            <ShieldCheck color="#16a34a" size={20} strokeWidth={2} />
                            <Text className="text-sm text-safe-700 ml-2 flex-1 font-medium">
                                You'll receive safety alerts along your route
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        <View className="flex-row">
                            {/* Cancel Button */}
                            <TouchableOpacity
                                onPress={onClose}
                                className="flex-1 bg-neutral-200 rounded-xl py-4 mr-2"
                                activeOpacity={0.8}
                                accessible={true}
                                accessibilityLabel="Cancel navigation"
                                accessibilityRole="button"
                            >
                                <Text className="text-neutral-700 text-center font-bold text-base">
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            {/* Start Button */}
                            <TouchableOpacity
                                onPress={onConfirm}
                                className="flex-1 bg-primary-600 rounded-xl py-4 ml-2"
                                activeOpacity={0.8}
                                style={{
                                    shadowColor: '#2563eb',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 6,
                                }}
                                accessible={true}
                                accessibilityLabel="Start navigation"
                                accessibilityRole="button"
                            >
                                <View className="flex-row items-center justify-center">
                                    <Navigation color="#ffffff" size={18} strokeWidth={2.5} />
                                    <Text className="text-white text-center font-bold text-base ml-2">
                                        Start
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}
