import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { Lightbulb, AlertTriangle, Bus, Shield, Construction, MapPin, Clock, LucideIcon, SlidersHorizontal, X } from 'lucide-react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { TipCategory, TimeRelevance, getCategoryColor } from '@/services/tipsService';
import { colors } from '@/constants/theme';

export interface FilterState {
  categories: TipCategory[];
  radius: number;
  timeRelevance: TimeRelevance | null;
}

interface FilterChipsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const CATEGORY_OPTIONS: { value: TipCategory; label: string; icon: LucideIcon }[] = [
  { value: 'lighting', label: 'Lighting', icon: Lightbulb },
  { value: 'harassment', label: 'Harassment', icon: AlertTriangle },
  { value: 'transit', label: 'Transit', icon: Bus },
  { value: 'safe_haven', label: 'Safe Haven', icon: Shield },
  { value: 'construction', label: 'Construction', icon: Construction },
];

const RADIUS_OPTIONS = [
  { value: 500, label: '500m' },
  { value: 1000, label: '1km' },
  { value: 5000, label: '5km' },
];

const TIME_OPTIONS: { value: TimeRelevance; label: string; emoji: string }[] = [
  { value: 'morning', label: 'Morning', emoji: '🌅' },
  { value: 'afternoon', label: 'Afternoon', emoji: '☀️' },
  { value: 'evening', label: 'Evening', emoji: '🌆' },
  { value: 'night', label: 'Night', emoji: '🌙' },
  { value: '24/7', label: '24/7', emoji: '⏰' },
];

const FilterChips: React.FC<FilterChipsProps> = ({ filters, onFiltersChange }) => {
  const [showFilterModal, setShowFilterModal] = useState(false);

  const toggleCategory = (category: TipCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];

    onFiltersChange({ ...filters, categories: newCategories });
  };

  const setRadius = (radius: number) => {
    onFiltersChange({ ...filters, radius });
  };

  const setTimeRelevance = (time: TimeRelevance) => {
    const newTime = filters.timeRelevance === time ? null : time;
    onFiltersChange({ ...filters, timeRelevance: newTime });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      radius: 5000,
      timeRelevance: null,
    });
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.timeRelevance !== null;
  const activeFilterCount = filters.categories.length + (filters.timeRelevance ? 1 : 0);

  return (
    <>
      {/* Floating Filter Button */}
      <TouchableOpacity
        style={[styles.floatingButton, hasActiveFilters && styles.floatingButtonActive]}
        onPress={() => setShowFilterModal(true)}
        activeOpacity={0.9}
        accessible={true}
        accessibilityLabel={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
        accessibilityRole="button"
      >
        <SlidersHorizontal
          size={20}
          color={hasActiveFilters ? colors.primary[600] : colors.neutral[700]}
          strokeWidth={2.5}
        />
        {activeFilterCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <Animated.View
            entering={SlideInDown.duration(300).springify()}
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
                accessible={true}
                accessibilityLabel="Close filters"
                accessibilityRole="button"
              >
                <X size={24} color={colors.neutral[700]} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Category Filter Section */}
              <View style={styles.filterSection}>
                <View style={styles.sectionHeaderStatic}>
                  <MapPin size={20} color={colors.neutral[700]} strokeWidth={2} />
                  <Text style={styles.sectionTitle}>Category</Text>
                  {filters.categories.length > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{filters.categories.length}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.categoryGrid}>
                  {CATEGORY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = filters.categories.includes(option.value);
                    const color = getCategoryColor(option.value);

                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.categoryChip,
                          isSelected && { backgroundColor: `${color}20`, borderColor: color },
                        ]}
                        onPress={() => toggleCategory(option.value)}
                        accessible={true}
                        accessibilityLabel={`${option.label} category${isSelected ? ', selected' : ''}`}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                      >
                        <Icon size={20} color={isSelected ? color : colors.neutral[500]} />
                        <Text
                          style={[
                            styles.categoryLabel,
                            isSelected && { color, fontWeight: '600' },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Radius Filter Section */}
              <View style={styles.filterSection}>
                <View style={styles.sectionHeaderStatic}>
                  <MapPin size={20} color={colors.neutral[700]} strokeWidth={2} />
                  <Text style={styles.sectionTitle}>Search Radius</Text>
                </View>

                <View style={styles.radiusRow}>
                  {RADIUS_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.radiusChip, filters.radius === option.value && styles.radiusChipActive]}
                      onPress={() => setRadius(option.value)}
                      accessible={true}
                      accessibilityLabel={`${option.label} radius filter${filters.radius === option.value ? ', selected' : ''}`}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: filters.radius === option.value }}
                    >
                      <Text
                        style={[
                          styles.radiusText,
                          filters.radius === option.value && styles.radiusTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Time Filter Section */}
              <View style={styles.filterSection}>
                <View style={styles.sectionHeaderStatic}>
                  <Clock size={20} color={colors.neutral[700]} strokeWidth={2} />
                  <Text style={styles.sectionTitle}>Time Relevance</Text>
                  {filters.timeRelevance && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>1</Text>
                    </View>
                  )}
                </View>

                <View style={styles.timeGrid}>
                  {TIME_OPTIONS.map((option) => {
                    const isSelected = filters.timeRelevance === option.value;

                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.timeChip,
                          isSelected && styles.timeChipActive,
                        ]}
                        onPress={() => setTimeRelevance(option.value)}
                        accessible={true}
                        accessibilityLabel={`${option.label} time filter${isSelected ? ', selected' : ''}`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                      >
                        <Text style={styles.timeEmoji}>{option.emoji}</Text>
                        <Text
                          style={[
                            styles.timeLabel,
                            isSelected && styles.timeLabelActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            {hasActiveFilters && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    clearAllFilters();
                    setShowFilterModal(false);
                  }}
                  accessible={true}
                  accessibilityLabel="Clear all filters"
                  accessibilityRole="button"
                >
                  <Text style={styles.clearButtonText}>Clear All Filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 180,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonActive: {
    backgroundColor: colors.primary[50],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary[600],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  filterSection: {
    marginTop: 24,
  },
  sectionHeaderStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
    marginLeft: 8,
  },
  countBadge: {
    backgroundColor: colors.primary[600],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  countBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    backgroundColor: 'white',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[700],
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    backgroundColor: 'white',
    alignItems: 'center',
  },
  radiusChipActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  radiusText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[700],
  },
  radiusTextActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeChip: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    backgroundColor: 'white',
    minWidth: 80,
  },
  timeChipActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  timeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral[700],
  },
  timeLabelActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  clearButton: {
    backgroundColor: colors.danger[50],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger[500],
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.danger[600],
  },
});

export default FilterChips;
