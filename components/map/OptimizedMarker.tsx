import { useEffect, useRef, useState } from 'react';
import { Marker, MapMarkerProps } from 'react-native-maps';
import { Platform } from 'react-native';

/**
 * A wrapper around react-native-maps Marker that handles the tracksViewChanges optimization.
 * On Android, custom markers can cause crashes or performance issues if tracksViewChanges is true.
 * However, setting it to false immediately can cause markers to be invisible.
 * This component handles the timing to ensure markers are rendered before freezing them.
 */
export const OptimizedMarker = (props: MapMarkerProps) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    // Start tracking changes to allow initial render
    setTracksViewChanges(true);

    // Stop tracking after a short delay to freeze the bitmap
    // 500ms is usually safe for most devices to ensure the view is fully rendered
    timeoutRef.current = setTimeout(() => {
      setTracksViewChanges(false);
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Marker
      {...props}
      tracksViewChanges={Platform.OS === 'android' ? tracksViewChanges : undefined}
    />
  );
};
