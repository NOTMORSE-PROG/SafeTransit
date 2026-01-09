import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Map,
  Shield,
  Route,
  MessageCircle,
  Cloud,
  AlertCircle,
  BadgeCheck,
  Users,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react-native';

interface Section {
  id: string;
  icon: React.ComponentType<any>;
  iconBg: string;
  title: string;
  content: {
    subtitle?: string;
    paragraphs: string[];
    bullets?: { label: string; description: string; color?: string }[];
    notes?: string[];
  };
}

const sections: Section[] = [
  {
    id: 'safety-map',
    icon: Map,
    iconBg: 'bg-safe-500',
    title: 'Safety Map & Zones',
    content: {
      subtitle: 'Understanding Color-Coded Safety Zones',
      paragraphs: [
        'The SafeTransit map uses color-coded zones to help you quickly assess the safety level of different areas. These zones are determined by community reports, safety tips, and verified data.',
      ],
      bullets: [
        {
          label: '🟢 Green - Safe Areas',
          description: 'Well-lit, patrolled areas with high foot traffic. Generally safe for walking at any time.',
          color: 'text-safe-600',
        },
        {
          label: '🟡 Yellow - Caution Areas',
          description: 'Areas that require alertness. May have mixed safety reports or limited lighting. Stay aware of your surroundings.',
          color: 'text-caution-600',
        },
        {
          label: '🔴 Red - High-Risk Areas',
          description: 'Areas with safety concerns based on community reports. Avoid if possible or remain highly alert.',
          color: 'text-danger-600',
        },
      ],
      notes: [
        'Zone colors are based on community tips, safety reports, and real-time data.',
        'Tap any zone on the map to see detailed safety information and recent tips.',
      ],
    },
  },
  {
    id: 'background-protection',
    icon: Shield,
    iconBg: 'bg-primary-600',
    title: 'Background Protection',
    content: {
      subtitle: 'Stay Protected Even When App is Closed',
      paragraphs: [
        'Background Protection monitors your location continuously, even when SafeTransit is minimized or your screen is off. You\'ll receive instant alerts when entering danger zones.',
      ],
      bullets: [
        {
          label: 'Auto-Monitoring',
          description: 'Tracks your location in real-time and checks against safety zones automatically.',
        },
        {
          label: 'Danger Zone Alerts',
          description: 'Sends notifications when you\'re approaching or entering a high-risk area.',
        },
        {
          label: 'Easy Toggle',
          description: 'Enable or disable from the shield icon on your Home screen.',
        },
        {
          label: 'Battery Optimized',
          description: 'Uses efficient location tracking to minimize battery drain. Typical usage: 3-5% per hour.',
        },
      ],
      notes: [
        'Requires location permission set to "Always Allow" in your device settings.',
        'You can customize alert preferences in Notification Settings.',
      ],
    },
  },
  {
    id: 'route-planning',
    icon: Route,
    iconBg: 'bg-secondary-600',
    title: 'Route Planning',
    content: {
      subtitle: 'Find the Safest Route to Your Destination',
      paragraphs: [
        'SafeTransit calculates routes that prioritize your safety over speed. Choose from different travel modes and get detailed safety scores for each route option.',
      ],
      bullets: [
        {
          label: 'Travel Modes',
          description: 'Select Walking, Driving, or Transit to get mode-specific routes.',
        },
        {
          label: 'Safety Score',
          description: 'Each route is rated from 0-100 based on safety zones, lighting, and community reports. Higher is safer.',
        },
        {
          label: 'Route Warnings',
          description: 'See alerts for danger zones, poorly lit areas, or recent safety incidents along your route.',
        },
        {
          label: 'Alternative Routes',
          description: 'Compare up to 3 different routes with safety scores, distance, and estimated time.',
        },
      ],
      notes: [
        'Tap "Start Navigation" button to begin turn-by-turn guidance.',
        'Routes update in real-time if new safety information becomes available.',
      ],
    },
  },
  {
    id: 'community-tips',
    icon: MessageCircle,
    iconBg: 'bg-primary-500',
    title: 'Community Tips',
    content: {
      subtitle: 'Crowdsourced Safety Information',
      paragraphs: [
        'Community Tips are location-based safety reports shared by verified users. They help everyone stay informed about local conditions.',
      ],
      bullets: [
        {
          label: 'Tip Categories',
          description: 'Lighting, Safety, Transit, Harassment, Safe Havens - each color-coded for quick recognition.',
        },
        {
          label: 'Reading Tips',
          description: 'See the tip location, category, description, and upvote count. Tips with higher upvotes are generally more reliable.',
        },
        {
          label: 'Adding Tips (Verified Only)',
          description: 'Verified users can post tips by tapping the + button on the Community page.',
        },
        {
          label: 'Upvoting',
          description: 'Upvote helpful tips to increase their visibility and help others assess reliability.',
        },
      ],
      notes: [
        'Only verified users can post and upvote tips to maintain quality.',
        'Report inappropriate tips using the three-dot menu on each tip.',
      ],
    },
  },
  {
    id: 'quick-exit',
    icon: Cloud,
    iconBg: 'bg-neutral-400',
    title: 'Quick Exit / Weather Disguise',
    content: {
      subtitle: 'Discreet Protection When You Need It',
      paragraphs: [
        'The Weather Disguise feature instantly changes your screen to look like a weather app. Use it when someone is watching your screen or you need to hide that you\'re using a safety app.',
      ],
      bullets: [
        {
          label: 'When to Use',
          description: 'Someone is looking at your phone, you feel uncomfortable having SafeTransit visible, or you\'re in a situation where discretion is important.',
        },
        {
          label: 'How to Access',
          description: 'Tap the cloud icon in the top-right corner of your Home screen.',
        },
        {
          label: 'Returning to SafeTransit',
          description: 'After 3 seconds, a hidden back button appears. Tap it or tap anywhere on the screen to return.',
        },
        {
          label: 'Full Disguise',
          description: 'The weather screen shows realistic weather data for your current location.',
        },
      ],
      notes: [
        'Practice using Quick Exit a few times so you can access it quickly when needed.',
        'The feature works instantly - no loading time.',
      ],
    },
  },
  {
    id: 'emergency-button',
    icon: AlertCircle,
    iconBg: 'bg-danger-600',
    title: 'Emergency / Panic Button',
    content: {
      subtitle: 'Instant Help When You Need It Most',
      paragraphs: [
        'The Emergency Button is your fastest way to call for help. It sends alerts to your emergency contacts with your exact location.',
      ],
      bullets: [
        {
          label: 'Location',
          description: 'Red floating button on the bottom-right of your Home screen.',
        },
        {
          label: 'Single Tap',
          description: 'Opens a confirmation dialog before sending the alert. Gives you a chance to cancel if triggered accidentally.',
        },
        {
          label: 'Long Press (3 seconds)',
          description: 'Silent immediate alert with no confirmation. Use when you can\'t speak or need instant discretion.',
        },
        {
          label: 'What Happens',
          description: 'Alert sent to ALL emergency contacts with your current GPS location, timestamp, and a map link.',
        },
      ],
      notes: [
        'IMPORTANT: Set up emergency contacts FIRST in your Profile settings.',
        'Future update will also notify nearby SafeTransit helpers.',
        'Test the button (with confirmation) once to understand how it works.',
      ],
    },
  },
  {
    id: 'verification',
    icon: BadgeCheck,
    iconBg: 'bg-primary-600',
    title: 'Verification System',
    content: {
      subtitle: 'Building a Trusted Community',
      paragraphs: [
        'Verification ensures that community contributors are real, trustworthy users. It helps maintain the quality and reliability of safety information.',
      ],
      bullets: [
        {
          label: 'What is Verification',
          description: 'A one-time process where you verify your identity using facial recognition and a Philippine government ID.',
        },
        {
          label: 'Why It Matters',
          description: 'Prevents spam, fake reports, and maintains community trust. Only verified users can post tips and vote.',
        },
        {
          label: 'How to Get Verified',
          description: 'Go to Profile > Verify Your Account > Follow the Face Scan + PH ID upload process. Usually approved within 24 hours.',
        },
        {
          label: 'Benefits',
          description: 'Add community tips, upvote/downvote tips, comment on reports, and earn a trusted member badge.',
        },
      ],
      notes: [
        'Your verification data is encrypted and securely stored.',
        'Unverified users can still use all safety features (map, routes, protection, emergency button).',
      ],
    },
  },
  {
    id: 'emergency-contacts',
    icon: Users,
    iconBg: 'bg-secondary-600',
    title: 'Emergency Contacts',
    content: {
      subtitle: 'Your Safety Network',
      paragraphs: [
        'Emergency Contacts are the people who will be notified when you trigger the panic button. Choose people you trust who can respond quickly.',
      ],
      bullets: [
        {
          label: 'How to Add',
          description: 'Go to Profile > Emergency Contacts > Add Contact. Enter name and phone number.',
        },
        {
          label: 'When SOS Triggers',
          description: 'All contacts receive an SMS and notification with your exact location, timestamp, and a map link to find you.',
        },
        {
          label: 'Recommended Setup',
          description: 'Add at least 2-3 contacts: family member, close friend, trusted colleague or neighbor.',
        },
        {
          label: 'Contact Requirements',
          description: 'Must be someone who can respond quickly and knows you personally.',
        },
      ],
      notes: [
        'Inform your emergency contacts that they\'re listed in SafeTransit.',
        'Update contacts if phone numbers change.',
        'Test alerts are not sent - only real emergencies trigger notifications.',
      ],
    },
  },
];

export default function HowItWorksScreen() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const filteredSections = sections.filter(
    (section) => {
      if (searchQuery === '') return true;

      const query = searchQuery.toLowerCase().trim();
      return (
        section.title.toLowerCase().includes(query) ||
        section.content.subtitle?.toLowerCase().includes(query) ||
        section.content.paragraphs.some((p) => p.toLowerCase().includes(query)) ||
        section.content.bullets?.some((b) =>
          b.label.toLowerCase().includes(query) ||
          b.description.toLowerCase().includes(query)
        ) ||
        section.content.notes?.some((n) => n.toLowerCase().includes(query))
      );
    }
  );

  // Auto-expand first matching section when searching
  useEffect(() => {
    if (searchQuery && filteredSections.length > 0) {
      setExpandedSection(filteredSections[0].id);
    } else if (!searchQuery) {
      setExpandedSection(null);
    }
  }, [searchQuery, filteredSections.length]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-neutral-200">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <ArrowLeft size={24} color="#171717" />
            <Text className="text-lg font-semibold text-neutral-900 ml-2">
              How It Works
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-neutral-100 rounded-xl px-3 py-2">
          <Search size={20} color="#737373" />
          <TextInput
            className="flex-1 ml-2 text-neutral-900"
            placeholder="Search topics..."
            placeholderTextColor="#a3a3a3"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          className="px-4 py-6 bg-primary-50 border-b border-primary-100"
        >
          <View className="items-center">
            <View className="bg-primary-600 rounded-full p-4 mb-3">
              <Shield size={32} color="white" />
            </View>
            <Text className="text-2xl font-bold text-neutral-900 text-center mb-2">
              Your Complete Safety Guide
            </Text>
            <Text className="text-neutral-600 text-center max-w-sm">
              Learn how to use all of SafeTransit's features to stay safe, informed, and connected.
            </Text>
          </View>
        </Animated.View>

        {/* Sections */}
        <View className="px-4 py-4">
          {filteredSections.length === 0 ? (
            <View className="py-12 items-center">
              <Text className="text-neutral-500 text-center">
                No results found for "{searchQuery}"
              </Text>
            </View>
          ) : (
            filteredSections.map((section, index) => {
              const Icon = section.icon;
              const isExpanded = expandedSection === section.id;

              return (
                <Animated.View
                  key={section.id}
                  entering={FadeInDown.delay(index * 100 + 200)}
                  className="mb-4"
                >
                  <TouchableOpacity
                    onPress={() => toggleSection(section.id)}
                    className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden"
                    activeOpacity={0.7}
                  >
                    {/* Section Header */}
                    <View className="flex-row items-center justify-between p-4">
                      <View className="flex-row items-center flex-1">
                        <View className={`${section.iconBg} rounded-full p-3 mr-3`}>
                          <Icon size={24} color="white" />
                        </View>
                        <Text className="text-lg font-semibold text-neutral-900 flex-1">
                          {section.title}
                        </Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp size={24} color="#737373" />
                      ) : (
                        <ChevronDown size={24} color="#737373" />
                      )}
                    </View>

                    {/* Expandable Content */}
                    {isExpanded && (
                      <View className="px-4 pb-4 border-t border-neutral-100">
                        {section.content.subtitle && (
                          <Text className="text-base font-semibold text-neutral-800 mt-3 mb-2">
                            {section.content.subtitle}
                          </Text>
                        )}

                        {section.content.paragraphs.map((paragraph, i) => (
                          <Text
                            key={i}
                            className="text-neutral-600 leading-6 mb-3"
                          >
                            {paragraph}
                          </Text>
                        ))}

                        {section.content.bullets && (
                          <View className="mt-2">
                            {section.content.bullets.map((bullet, i) => (
                              <View key={i} className="mb-3">
                                <Text className={`font-semibold text-neutral-900 mb-1 ${bullet.color || ''}`}>
                                  {bullet.label}
                                </Text>
                                <Text className="text-neutral-600 leading-5 pl-4">
                                  {bullet.description}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {section.content.notes && section.content.notes.length > 0 && (
                          <View className="mt-4 bg-primary-50 rounded-xl p-3 border border-primary-200">
                            <Text className="text-sm font-semibold text-primary-700 mb-2">
                              Important Notes:
                            </Text>
                            {section.content.notes.map((note, i) => (
                              <Text key={i} className="text-sm text-primary-900 leading-5 mb-1">
                                • {note}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </View>

        {/* Footer */}
        <View className="px-4 py-6 items-center">
          <Text className="text-neutral-500 text-center text-sm mb-4">
            Still have questions? Contact us at support@safetransit.ph
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary-600 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
