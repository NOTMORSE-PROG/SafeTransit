/**
 * Grab-Style Map Pin Component
 * Teardrop-shaped pin with icon, exactly like Grab's design
 */

import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { LucideIcon } from 'lucide-react-native';

interface GrabStylePinProps {
  Icon: LucideIcon;
  color: string;
  size?: number;
  selected?: boolean;
}

export default function GrabStylePin({
  Icon,
  color,
  size = 40,
  selected = false
}: GrabStylePinProps) {
  const iconSize = size * 0.5;
  const gradientId = `grad-${color.replace('#', '')}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <View style={{ width: size * 1.2, height: size * 1.6, alignItems: 'center', justifyContent: 'center' }}>
      {/* Shadow */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: size * 0.5,
          height: size * 0.12,
          backgroundColor: 'rgba(0,0,0,0.15)',
          borderRadius: 999,
        }}
      />

      {/* Outer pulse ring for selected state */}
      {selected && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            width: size + 8,
            height: size + 8,
            borderRadius: 999,
            backgroundColor: `${color}20`,
            borderWidth: 2,
            borderColor: `${color}40`,
          }}
        />
      )}

      {/* Main Pin */}
      <View style={{ width: size, height: size * 1.4 }}>
        <Svg
          width={size}
          height={size * 1.4}
          viewBox="0 0 40 56"
        >
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="1" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.8" />
            </LinearGradient>
          </Defs>

          {/* Teardrop shape */}
          <Path
            d="M20 0C9 0 0 9 0 20C0 31 10 40 20 56C30 40 40 31 40 20C40 9 31 0 20 0Z"
            fill={`url(#${gradientId})`}
            stroke="#ffffff"
            strokeWidth="2.5"
          />

          {/* Inner white circle */}
          <Circle
            cx="20"
            cy="20"
            r="10"
            fill="#ffffff"
          />
        </Svg>

        {/* Icon */}
        <View
          style={{
            position: 'absolute',
            top: size * 0.25,
            left: size * 0.25,
            width: size * 0.5,
            height: size * 0.5,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon color={color} size={iconSize} strokeWidth={2.8} />
        </View>
      </View>
    </View>
  );
}
