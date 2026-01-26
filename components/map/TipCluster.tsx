import React, { memo, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { TipCluster as TipClusterType } from '@/services/clusteringService';
import { colors } from '@/constants/theme';

interface TipClusterProps {
  cluster: TipClusterType;
  onPress: (cluster: TipClusterType) => void;
}

const TipCluster: React.FC<TipClusterProps> = ({ cluster, onPress }) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // After initial render, disable tracking for performance
  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 200);
    return () => clearTimeout(timer);
  }, []);

  // Critical: Validate cluster data to prevent crashes
  if (!cluster?.properties?.point_count || !cluster?.geometry?.coordinates) {
    console.warn('[TipCluster] Invalid cluster data:', cluster);
    return null;
  }

  const { point_count } = cluster.properties;
  const [longitude, latitude] = cluster.geometry.coordinates;

  // Validate coordinates are finite numbers
  if (!isFinite(latitude) || !isFinite(longitude)) {
    console.warn('[TipCluster] Invalid coordinates:', { latitude, longitude });
    return null;
  }

  // Size cluster marker based on point count (iOS 44px minimum)
  const getClusterSize = (count: number): number => {
    if (count < 10) return 48;  // Increased from 40 to meet 44px minimum
    if (count < 50) return 56;  // Increased from 50
    if (count < 100) return 64; // Increased from 60
    return 72;                  // Increased from 70
  };

  const size = getClusterSize(point_count);

  return (
    <Marker
      coordinate={{
        latitude,
        longitude,
      }}
      onPress={() => onPress(cluster)}
      tracksViewChanges={tracksViewChanges}
      accessible={true}
      accessibilityLabel={`Cluster of ${point_count} tips`}
      accessibilityHint="Double tap to expand cluster"
    >
      <View
        style={[
          styles.clusterContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text style={styles.clusterText}>{point_count}</Text>
      </View>
    </Marker>
  );
};

// Memoize component with custom comparison for optimal performance
const MemoizedTipCluster = memo(TipCluster, (prevProps, nextProps) => {
  return (
    prevProps.cluster.properties.cluster_id === nextProps.cluster.properties.cluster_id &&
    prevProps.cluster.properties.point_count === nextProps.cluster.properties.point_count
  );
});

const styles = StyleSheet.create({
  clusterContainer: {
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clusterText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MemoizedTipCluster;
