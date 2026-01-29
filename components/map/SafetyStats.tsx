/**
 * SafetyStats Dashboard Widget
 * Displays real-time statistics for tips in the current viewport
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { Tip } from '@/services/tipsService';
import { HeatmapZone } from '@/services/heatmapCacheService';
import { colors } from '@/constants/theme';

interface SafetyStatsProps {
  tips: Tip[];
  heatmapZones?: HeatmapZone[];
}

interface CategoryBreakdown {
  [key: string]: number;
}

const SafetyStats: React.FC<SafetyStatsProps> = ({ tips, heatmapZones = [] }) => {
  const [expanded, setExpanded] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const byCategory: CategoryBreakdown = {
      lighting: 0,
      harassment: 0,
      transit: 0,
      safe_haven: 0,
      construction: 0,
    };

    const bySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    let verifiedCount = 0;

    tips.forEach((tip) => {
      // Count by category
      if (byCategory[tip.category] !== undefined) {
        byCategory[tip.category]++;
      }

      // Count by severity
      if (bySeverity[tip.severity]) {
        bySeverity[tip.severity]++;
      }

      // Count verified
      if (tip.verified) {
        verifiedCount++;
      }
    });

    // Calculate average safety score from heatmap zones
    const avgSafety = heatmapZones.length > 0
      ? Math.round(
          heatmapZones.reduce((sum, zone) => sum + zone.safety_score, 0) / heatmapZones.length
        )
      : null;

    return {
      total: tips.length,
      byCategory,
      bySeverity,
      avgSafety,
      verifiedCount,
    };
  }, [tips, heatmapZones]);

  const getSafetyColor = (score: number | null) => {
    if (score === null) return colors.neutral[500];
    if (score >= 70) return colors.safe[500];
    if (score >= 50) return colors.caution[400];
    if (score >= 30) return colors.caution[600];
    return colors.danger[500];
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      lighting: '💡 Lighting',
      harassment: '⚠️ Harassment',
      transit: '🚌 Transit',
      safe_haven: '🛡️ Safe Haven',
      construction: '🚧 Construction',
    };
    return labels[category] || category;
  };

  return (
    <View style={styles.container}>
      {/* Header - Always Visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Safety Overview</Text>
          <View style={styles.quickStats}>
            <Text style={styles.quickStatText}>{stats.total} tips</Text>
            {stats.bySeverity.critical > 0 && (
              <View style={styles.criticalBadge}>
                <AlertTriangle size={12} color="white" />
                <Text style={styles.criticalText}>{stats.bySeverity.critical}</Text>
              </View>
            )}
          </View>
        </View>
        {expanded ? (
          <ChevronUp size={20} color={colors.neutral[600]} />
        ) : (
          <ChevronDown size={20} color={colors.neutral[600]} />
        )}
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.content}>
          {/* Severity Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Severity</Text>
            <View style={styles.statsGrid}>
              <StatItem
                label="Critical"
                value={stats.bySeverity.critical}
                color={colors.danger[500]}
                bgColor={colors.danger[50]}
              />
              <StatItem
                label="High"
                value={stats.bySeverity.high}
                color={colors.caution[600]}
                bgColor={colors.caution[50]}
              />
              <StatItem
                label="Medium"
                value={stats.bySeverity.medium}
                color={colors.caution[500]}
                bgColor={colors.caution[100]}
              />
              <StatItem
                label="Low"
                value={stats.bySeverity.low}
                color={colors.neutral[500]}
                bgColor={colors.neutral[100]}
              />
            </View>
          </View>

          {/* Category Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoryList}>
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <View key={category} style={styles.categoryRow}>
                  <Text style={styles.categoryLabel}>{getCategoryLabel(category)}</Text>
                  <Text style={styles.categoryCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Additional Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metrics</Text>
            <View style={styles.metricsRow}>
              {stats.avgSafety !== null && (
                <View style={styles.metricBox}>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: getSafetyColor(stats.avgSafety) },
                    ]}
                  >
                    {stats.avgSafety}/100
                  </Text>
                  <Text style={styles.metricLabel}>Avg Safety</Text>
                </View>
              )}

              <View style={styles.metricBox}>
                <View style={styles.verifiedRow}>
                  <CheckCircle size={16} color={colors.success[500]} />
                  <Text style={[styles.metricValue, { color: colors.success[600] }]}>
                    {stats.verifiedCount}
                  </Text>
                </View>
                <Text style={styles.metricLabel}>Verified</Text>
              </View>

              {heatmapZones.length > 0 && (
                <View style={styles.metricBox}>
                  <Text style={[styles.metricValue, { color: colors.primary[600] }]}>
                    {heatmapZones.length}
                  </Text>
                  <Text style={styles.metricLabel}>Zones</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// Reusable StatItem component
interface StatItemProps {
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, color, bgColor }) => (
  <View style={[styles.statItem, { backgroundColor: bgColor }]}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 280,
    minWidth: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickStatText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  criticalText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    padding: 12,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    flex: 1,
    minWidth: 70,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  categoryList: {
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  categoryLabel: {
    fontSize: 13,
    color: colors.neutral[700],
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
});

export default SafetyStats;
