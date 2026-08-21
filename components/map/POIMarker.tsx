import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { Shield, Hospital, TrainFront } from 'lucide-react-native';
import type { SafetyPOI } from '@/types/safetyPOI';
import { colors } from '@/constants/theme';

interface POIMarkerProps {
  poi: SafetyPOI;
  onPress: (poi: SafetyPOI) => void;
}

const TYPE_STYLE = {
  police: {
    bg: colors.primary[500],
    border: colors.primary[700],
    label: 'Police station',
  },
  hospital: {
    bg: colors.danger[500],
    border: colors.danger[700],
    label: 'Hospital',
  },
  transit: {
    bg: '#7c3aed',
    border: '#5b21b6',
    label: 'Transit station',
  },
} as const;

function POIMarkerInner({ poi, onPress }: POIMarkerProps) {
  if (!poi || !isFinite(poi.latitude) || !isFinite(poi.longitude)) {
    return null;
  }

  const style = TYPE_STYLE[poi.type] || TYPE_STYLE.police;

  let Icon = Shield;
  if (poi.type === 'hospital') Icon = Hospital;
  else if (poi.type === 'transit') Icon = TrainFront;

  return (
    <Marker
      coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
      onPress={() => onPress(poi)}
      tracksViewChanges={false}
      accessible
      accessibilityLabel={`${style.label}: ${poi.name}`}
      accessibilityHint="Double tap to view details"
    >
      <View style={styles.wrapper}>
        <View
          style={[
            styles.container,
            { backgroundColor: style.bg, borderColor: style.border },
          ]}
        >
          <Icon color="white" size={16} strokeWidth={2.4} />
        </View>
        {poi.subtype ? (
          <View style={styles.subtypeBadge}>
            <Text style={styles.subtypeText}>{poi.subtype}</Text>
          </View>
        ) : null}
      </View>
    </Marker>
  );
}

const POIMarker = memo(POIMarkerInner, (prev, next) => {
  return (
    prev.poi.id === next.poi.id &&
    prev.poi.latitude === next.poi.latitude &&
    prev.poi.longitude === next.poi.longitude &&
    prev.poi.type === next.poi.type
  );
});

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  container: {
    borderRadius: 18,
    padding: 7,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  subtypeBadge: {
    position: 'absolute',
    top: -8,
    right: -14,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  subtypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#374151',
  },
});

export default POIMarker;
