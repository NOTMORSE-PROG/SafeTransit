# SafeTransit - Women's Journey Protection Network

A safety-first navigation app designed for women commuters in Philippine cities. Built with React Native, Expo SDK 54, and NativeWind (Tailwind CSS).

## 🎯 Features

### Core Safety Features
- **Background Protection**: Monitors location even when app is closed, alerts on entering danger zones
- **Safe Route Planning**: Color-coded routes (Green/Yellow/Red) for Walking, Driving, and Transit
- **Community Tips**: Verified, anonymous safety tips from fellow travelers
- **Silent Panic Button**: Discreet emergency alerts to helpers and contacts
- **Quick Exit Screen**: Instantly disguises app as weather forecast for privacy
- **Real-time Danger Zones**: Visual map overlays showing safety levels

### User Experience
- Beautiful, modern UI with smooth animations
- Fully responsive design for all Android screen sizes
- Intuitive navigation with Expo Router
- Accessible and easy to use
- Works on Android 11-16 (SDK 30-35)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI (will be installed with dependencies)
- Android Studio (for Android emulator) or physical Android device
- Expo Go app (for testing on physical device)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Run on Android**
   ```bash
   npm run android
   ```

   Or scan the QR code with Expo Go app on your Android device.

## 📱 App Structure

```
SafeTransit/
├── app/                          # App screens (Expo Router)
│   ├── (tabs)/                   # Main app tabs
│   │   ├── index.tsx            # Home/Map screen
│   │   ├── community.tsx        # Community tips
│   │   └── profile.tsx          # User profile & settings
│   ├── onboarding/              # Onboarding flow
│   │   ├── welcome.tsx          # Welcome screen
│   │   ├── permissions.tsx      # Permission requests
│   │   └── tutorial.tsx         # Tutorial carousel
│   ├── route-planning.tsx       # Route planning modal
│   ├── add-tip.tsx              # Add community tip
│   ├── quick-exit.tsx           # Emergency quick exit
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Entry point
├── assets/                       # Images and icons (add your own)
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
├── tailwind.config.js           # Tailwind configuration
└── tsconfig.json                # TypeScript configuration
```

## 🎨 Design System

### Color Palette
- **Primary (Purple)**: `#8B5CF6` - Main brand color
- **Success (Green)**: `#22C55E` - Safe zones
- **Warning (Yellow)**: `#F59E0B` - Caution zones
- **Danger (Red)**: `#EF4444` - High-risk zones

### Typography
- Uses system fonts for optimal performance
- Responsive text sizing
- Clear hierarchy with Tailwind classes

## 🗺️ Maps Implementation

Currently uses **react-native-maps** with mock data for demonstration purposes. The map is:
- Free to use
- No API keys required for basic functionality
- Works offline with cached map tiles

### For Production
To use real map data and routing:
1. Get a free Mapbox access token at [mapbox.com](https://www.mapbox.com)
2. Add to your environment variables
3. Replace mock zones with real PostGIS data from backend

## 📦 Key Dependencies

- **expo**: ^54.0.0 - React Native framework
- **expo-router**: ~4.0.0 - File-based routing
- **react-native-maps**: 1.18.0 - Map component
- **nativewind**: ^4.0.1 - Tailwind for React Native
- **expo-location**: ~18.0.4 - Location services
- **expo-haptics**: ~14.0.0 - Haptic feedback
- **react-native-reanimated**: ~3.16.1 - Smooth animations

## 🔐 Permissions

The app requests these permissions:
- **Location (Background)**: Monitor location for danger zone alerts
- **Notifications**: Send critical safety alerts
- **Camera**: Optional for adding photos to community tips

All permissions are explained to users during onboarding.

## 🎭 Mock Data

For UI demonstration, the app includes:
- Mock safety zones (3 zones: green, yellow, red)
- Mock community tips (4 sample tips)
- Mock routes (2 route options)
- Mock user data

**For production**: Replace with real API calls to Laravel backend.

## 📱 Screens Overview

### Onboarding Flow
1. **Welcome**: Brand introduction and key features
2. **Permissions**: Request location and notification permissions
3. **Tutorial**: 3-slide carousel explaining main features

### Main App
1. **Home/Map**:
   - Interactive map with safety zones
   - Background protection toggle
   - Quick access to route planning
   - Panic button and quick exit

2. **Route Planning**:
   - Destination search
   - Travel mode selection (Walk/Drive/Transit)
   - Multiple route options with safety ratings
   - Visual route comparison

3. **Community**:
   - Browse verified safety tips
   - Filter by category
   - Search by location
   - Upvote helpful tips

4. **Profile**:
   - Safety settings toggles
   - Emergency contacts management
   - App information
   - Logout option

5. **Add Tip**:
   - Category selection
   - Location picker
   - Photo upload
   - Form validation

6. **Quick Exit**:
   - Weather app disguise
   - Seamless transition
   - Hidden return button

## 🎨 UI/UX Highlights

### Responsive Design
- Adapts to all Android screen sizes
- Uses percentage-based layouts
- Flexible typography scaling
- Optimized for one-handed use

### Animations
- Smooth page transitions
- Staggered list animations
- Interactive feedback
- Haptic responses

### Accessibility
- Clear visual hierarchy
- High contrast ratios
- Large touch targets
- Descriptive labels

## 🔧 Customization

### Changing Colors
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: { ... },
      danger: { ... },
      // Add your colors
    }
  }
}
```

### Adding Icons/Images
Place assets in the `assets/` folder:
- `icon.png` (1024x1024) - App icon
- `splash.png` (1284x2778) - Splash screen
- `adaptive-icon.png` (1024x1024) - Android adaptive icon

### Modifying Map Region
Edit initial region in `app/(tabs)/index.tsx`:
```typescript
const INITIAL_REGION = {
  latitude: 14.5995,  // Your latitude
  longitude: 120.9842, // Your longitude
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};
```

## 🐛 Troubleshooting

### Maps not showing
- Ensure Google Play Services is installed on device/emulator
- For iOS: Add location permissions to Info.plist

### Permissions not working
- Check app.json permissions array
- Reinstall app after permission changes
- Clear app data and cache

### Build errors
```bash
# Clear cache
npx expo start -c

# Reinstall dependencies
rm -rf node_modules
npm install
```

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [NativeWind Documentation](https://www.nativewind.dev)
- [Expo Router](https://docs.expo.dev/router/introduction/)

## 👥 Team

Developed by TIP Manila students:
- Mark Andrei Condino - Team Lead
- Jaycee Thea Guarino
- Nikola Ng
- Daniel Espela
- Jeremy Dimasacat

## 📄 License

This is a student project for educational purposes.

## 🚀 Next Steps for Production

1. **Backend Integration**
   - Connect to Laravel API
   - Implement real authentication
   - Fetch live safety zone data
   - Real-time notifications via Pusher

2. **Enhanced Features**
   - Real GPS navigation
   - Offline mode improvements
   - Push notification handling
   - Background location tracking

3. **Testing**
   - Unit tests with Jest
   - E2E tests with Detox
   - Performance optimization
   - Security audit

4. **Deployment**
   - Build production APK
   - Submit to Google Play Store
   - Set up crash reporting
   - Analytics integration

---

**Made with ❤️ for women's safety in Philippine cities**
