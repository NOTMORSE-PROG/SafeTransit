require('dotenv').config({ quiet: true });

module.exports = {
  expo: {
    name: "SafeTransit",
    slug: "safetransit",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#8B5CF6"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.safetransit.app",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#8B5CF6"
      },
      package: "com.safetransit.app",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "VIBRATE",
        "CAMERA"
      ],
      minSdkVersion: 30,
      targetSdkVersion: 35,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow SafeTransit to use your location to warn you of danger zones even when your phone is in your pocket."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#8B5CF6"
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            manifestPlaceholders: {
              GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY
            }
          }
        }
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID
            ? `com.googleusercontent.apps.${process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID.split('-')[0]}`
            : "com.googleusercontent.apps.placeholder"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    scheme: "safetransit",
    extra: {
      EXPO_PUBLIC_GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID
    }
  }
};
