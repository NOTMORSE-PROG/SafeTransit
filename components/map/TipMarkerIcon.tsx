import React from 'react';
import { View } from 'react-native';
import { AlertTriangle, Lightbulb, Construction, Bus, Shield } from 'lucide-react-native';

interface TipMarkerIconProps {
  category: string;
  size?: number;
}

export function TipMarkerIcon({ category, size = 20 }: TipMarkerIconProps) {
  const config: Record<string, { icon: typeof AlertTriangle; bgColor: string; iconColor: string }> = {
    harassment: {
      icon: AlertTriangle,
      bgColor: '#DC2626', // Red
      iconColor: '#FFFFFF',
    },
    lighting: {
      icon: Lightbulb,
      bgColor: '#EAB308', // Yellow
      iconColor: '#FFFFFF',
    },
    construction: {
      icon: Construction,
      bgColor: '#F97316', // Orange
      iconColor: '#FFFFFF',
    },
    transit: {
      icon: Bus,
      bgColor: '#3B82F6', // Blue
      iconColor: '#FFFFFF',
    },
    safe_haven: {
      icon: Shield,
      bgColor: '#22C55E', // Green
      iconColor: '#FFFFFF',
    },
  };

  const { icon: Icon, bgColor, iconColor } = config[category] || config.harassment;

  return (
    <View
      style={{
        backgroundColor: bgColor,
        width: size + 12,
        height: size + 12,
        borderRadius: (size + 12) / 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
      }}
    >
      <Icon color={iconColor} size={size} strokeWidth={2.5} />
    </View>
  );
}
