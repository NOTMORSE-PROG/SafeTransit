import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { MapPin, Check } from 'lucide-react-native';
import { colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface LocationPickerProps {
  initialLocation?: { latitude: number; longitude: number };
  onLocationSelect: (location: { latitude: number; longitude: number; locationName: string }) => void;
  onCancel: () => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation = { latitude: 14.5995, longitude: 120.9842 }, // Default Manila
  onLocationSelect,
  onCancel,
}) => {
  const mapRef = useRef<MapView>(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [locationName, setLocationName] = useState('Selected Location');

  const handleMapPress = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  };

  const handleConfirm = () => {
    onLocationSelect({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      locationName,
    });
  };

  const INITIAL_REGION: Region = {
    latitude: initialLocation.latitude,
    longitude: initialLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Selected Location Marker */}
        <Marker
          coordinate={selectedLocation}
          draggable
          onDragEnd={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setSelectedLocation({ latitude, longitude });
            setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }}
        >
          <View style={styles.markerContainer}>
            <MapPin size={32} color={colors.danger[500]} strokeWidth={2.5} />
          </View>
        </Marker>
      </MapView>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <View style={styles.instructionsBubble}>
          <MapPin size={20} color={colors.primary[600]} />
          <Text style={styles.instructionsText}>
            Tap or drag the pin to select location
          </Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>Selected Location</Text>
          <Text style={styles.locationCoords}>{locationName}</Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.7}
          >
            <Check size={20} color="white" />
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  map: {
    width,
    height: height * 0.7,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    gap: 8,
  },
  instructionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  locationInfo: {
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[500],
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default LocationPicker;
