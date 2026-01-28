import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { Lightbulb, AlertTriangle, Bus, Shield, Construction, CheckCircle } from 'lucide-react-native';
import { Tip, TipCategory, getCategoryColor } from '@/services/tipsService';
import { colors } from '@/constants/theme';

interface TipMarkerProps {
  tip: Tip;
  onPress: (tip: Tip) => void;
}

const TipMarker: React.FC<TipMarkerProps> = ({ tip, onPress }) => {
  // Critical: Validate tip data and coordinates to prevent crashes
  if (!tip || !isFinite(tip.latitude) || !isFinite(tip.longitude)) {
    console.warn('[TipMarker] Invalid tip or coordinates:', tip);
    return null;
  }

  const getCategoryIcon = (category: TipCategory, iconColor?: string) => {
    const color = iconColor || getCategoryColor(category);
    const size = 20;
    const strokeWidth = 2;

    switch (category) {
      case 'lighting':
        return <Lightbulb color={color} size={size} strokeWidth={strokeWidth} />;
      case 'harassment':
        return <AlertTriangle color={color} size={size} strokeWidth={strokeWidth} />;
      case 'transit':
        return <Bus color={color} size={size} strokeWidth={strokeWidth} />;
      case 'safe_haven':
        return <Shield color={color} size={size} strokeWidth={strokeWidth} />;
      case 'construction':
        return <Construction color={color} size={size} strokeWidth={strokeWidth} />;
      default:
        return <AlertTriangle color={color} size={size} strokeWidth={strokeWidth} />;
    }
  };

  // Get marker style based on severity
  const getMarkerStyle = () => {
    const severityStyles = {
      critical: {
        backgroundColor: colors.danger[500],
        borderColor: colors.danger[700],
        shadowColor: colors.danger[500],
        shadowRadius: 8,
        shadowOpacity: 0.5,
      },
      high: {
        backgroundColor: colors.danger[500], // Changed from caution to danger
        borderColor: colors.danger[700],     // Now red like critical
        shadowColor: colors.danger[500],
        shadowRadius: 6,
        shadowOpacity: 0.4,
      },
      medium: {
        backgroundColor: colors.caution[500], // Yellow for medium severity
        borderColor: colors.caution[700],
        shadowColor: colors.caution[500],
        shadowRadius: 4,
        shadowOpacity: 0.3,
      },
      low: {
        backgroundColor: colors.safe[100],    // Light green for low
        borderColor: colors.safe[500],
        shadowColor: colors.safe[500],
        shadowRadius: 3,
        shadowOpacity: 0.2,
      },
    };

    return severityStyles[tip.severity] || severityStyles.medium;
  };

  const markerStyle = getMarkerStyle();
  // White icons for high-severity (red/yellow backgrounds), colored for low severity
  const iconColor = tip.severity === 'critical' || tip.severity === 'high' || tip.severity === 'medium'
    ? 'white'
    : getCategoryColor(tip.category);

  return (
    <Marker
      coordinate={{
        latitude: tip.latitude,
        longitude: tip.longitude,
      }}
      onPress={() => onPress(tip)}
      tracksViewChanges={false}
      accessible={true}
      accessibilityLabel={`${tip.severity} severity - ${tip.title} - ${tip.category} tip`}
      accessibilityHint="Double tap to view tip details"
    >
      <View style={styles.markerWrapper}>
        <View
          style={[
            styles.markerContainer,
            {
              backgroundColor: markerStyle.backgroundColor,
              borderColor: markerStyle.borderColor,
              borderWidth: tip.verified ? 3 : 2,
              shadowColor: markerStyle.shadowColor,
              shadowRadius: markerStyle.shadowRadius,
              shadowOpacity: markerStyle.shadowOpacity,
            },
          ]}
        >
          {getCategoryIcon(tip.category, iconColor)}

          {/* Verified badge */}
          {tip.verified && (
            <View style={styles.verifiedBadge}>
              <CheckCircle size={12} color={colors.success[500]} fill={colors.success[500]} />
            </View>
          )}

          {/* Helpful count badge */}
          {tip.helpful_count > 10 && (
            <View style={styles.helpfulBadge}>
              <Text style={styles.badgeText}>{tip.helpful_count}</Text>
            </View>
          )}
        </View>
      </View>
    </Marker>
  );
};

// Memoize component with custom comparison for optimal performance
const MemoizedTipMarker = memo(TipMarker, (prevProps, nextProps) => {
  return (
    prevProps.tip.id === nextProps.tip.id &&
    prevProps.tip.latitude === nextProps.tip.latitude &&
    prevProps.tip.longitude === nextProps.tip.longitude &&
    prevProps.tip.category === nextProps.tip.category &&
    prevProps.tip.severity === nextProps.tip.severity &&
    prevProps.tip.verified === nextProps.tip.verified &&
    prevProps.tip.helpful_count === nextProps.tip.helpful_count
  );
});

const styles = StyleSheet.create({
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerContainer: {
    borderRadius: 24,
    padding: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 6,
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  helpfulBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default MemoizedTipMarker;
