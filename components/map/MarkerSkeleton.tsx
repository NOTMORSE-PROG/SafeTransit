/**
 * MarkerSkeleton Loading Component
 * Displays animated skeleton placeholders for markers during initial load
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Marker } from 'react-native-maps';
import { colors } from '@/constants/theme';

interface MarkerSkeletonProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

const MarkerSkeleton: React.FC<MarkerSkeletonProps> = ({ coordinate }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Marker
      coordinate={coordinate}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <Animated.View style={[styles.skeleton, { opacity: pulseAnim }]}>
        <View style={styles.skeletonInner} />
      </Animated.View>
    </Marker>
  );
};

// Display multiple skeleton markers in a grid pattern
interface MarkerSkeletonGridProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  count?: number;
}

export const MarkerSkeletonGrid: React.FC<MarkerSkeletonGridProps> = ({
  region,
  count = 12,
}) => {
  // Generate grid of skeleton markers
  const skeletons = [];
  const cols = 4;
  const rows = Math.ceil(count / cols);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (skeletons.length >= count) break;

      // Calculate position within region
      const latOffset = (row / (rows - 1) - 0.5) * region.latitudeDelta * 0.8;
      const lonOffset = (col / (cols - 1) - 0.5) * region.longitudeDelta * 0.8;

      skeletons.push({
        latitude: region.latitude + latOffset,
        longitude: region.longitude + lonOffset,
        key: `skeleton-${row}-${col}`,
      });
    }
  }

  return (
    <>
      {skeletons.map((skeleton) => (
        <MarkerSkeleton
          key={skeleton.key}
          coordinate={{
            latitude: skeleton.latitude,
            longitude: skeleton.longitude,
          }}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skeletonInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.neutral[400],
  },
});

export default MarkerSkeleton;
