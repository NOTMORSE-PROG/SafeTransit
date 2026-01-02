module.exports = {
  expo: {
    name: 'SafeTransit',
    slug: 'safetransit',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#8B5CF6',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.safetransit.app',
      infoPlist: {
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'SafeTransit needs access to your location to warn you of danger zones even when your phone is in your pocket.',
        NSLocationWhenInUseUsageDescription:
          'SafeTransit needs access to your location to show your position on the map and provide safe routes.',
        NSLocationAlwaysUsageDescription:
          'SafeTransit needs background location access to monitor your safety and send alerts when you enter high-risk areas.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#8B5CF6',
      },
      package: 'com.safetransit.app',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'VIBRATE',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
      ],
      minSdkVersion: 30,
      targetSdkVersion: 35,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      'expo-asset',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow SafeTransit to use your location to warn you of danger zones even when your phone is in your pocket.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#8B5CF6',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    scheme: 'safetransit',
  },
};
