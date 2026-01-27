# SafeTransit - Women's Journey Protection Network

A comprehensive safety-first navigation app designed for women commuters in Philippine cities. Built with React Native, Expo SDK 54, and NativeWind (Tailwind CSS).

## 🎯 Features

### Core Safety Features
- **Background Protection**: Monitors location even when app is closed, alerts on entering danger zones
- **Safe Route Planning**: Color-coded routes for Walking, Driving, and Transit with real-time safety assessments
- **Community Map Tips**: Location-specific, admin-verified safety alerts with categories:
  - 🔦 **Poor Lighting** - Areas with inadequate street lighting
  - ⚠️ **Harassment** - Reported harassment incidents
  - 🚌 **Transit Issues** - Public transportation safety concerns
  - 🛡️ **Safe Havens** - Verified safe places and establishments
  - 🚧 **Construction** - Road closures and construction zones
- **Community Forum**: Discussion-based posts with voting, commenting, and nested replies
- **Safety Heatmap**: Visual danger zones overlay showing area safety levels
- **Profile Picture**: Personalize your account with profile photos
- **Silent Panic Button**: Discreet emergency alerts to helpers and contacts
- **Quick Exit Screen**: Instantly disguises app as a weather forecast for privacy
- **Family Location Sharing**: Real-time location tracking with trusted family members

### User Experience
- Beautiful, modern UI with smooth animations and glassmorphic design
- Fully responsive design for all Android screen sizes
- Intuitive navigation with Expo Router
- Interactive map with clustering and custom markers
- Accessible and easy to use
- Works on Android 11-16 (SDK 30-35)

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ installed
- npm package manager
- Android Studio with Android SDK installed
- Physical Android device with USB debugging enabled (recommended)
- Google Maps API key (free tier available)

### Quick Start

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd SafeTransit
   npm install
   ```

2. **Configure Environment**
   See [SETUP.md](SETUP.md) for detailed local setup instructions (API keys, SDK paths, etc.)

3. **Build and Install (First Time)**
   ```bash
   npx expo run:android
   ```
   This builds and installs the development build on your device. You only need to do this once per device.

4. **Start Development Server**
   ```bash
   npm start
   ```
   After the initial build, just use this command for daily development.

## 🛠️ Tech Stack

### Frontend
- **React Native** with Expo SDK 54
- **Expo Router** for file-based navigation
- **Google Maps** for Android (react-native-maps with clustering)
- **NativeWind** (Tailwind CSS for React Native)
- **TypeScript** for type safety
- **React Native Reanimated** for smooth animations

### Backend
- **Vercel** serverless functions
- **Neon** PostgreSQL database
- **UploadThing** for image uploads
- **JWT** authentication

> **Note:** Requires Google Maps API key (free tier available). See [SETUP.md](SETUP.md) for configuration.

## 📱 App Screens

- **Onboarding** - Welcome flow with permissions and tutorial
- **Home/Map** - Interactive map with safety tips, heatmap, family locations, panic button, and quick exit
- **Route Planning** - Find safe routes with detailed safety assessments
- **Community Forum** - Browse and discuss safety topics with upvoting, commenting, and threaded replies
- **Add Tip** - Submit location-specific safety tips for admin verification
- **Profile** - User settings, emergency contacts, family management, and app info

## 🗺️ Map Features

### Map Tips vs Forum Posts
- **Map Tips**: Location-specific alerts verified by admins, pinned to exact coordinates, categorized by type (lighting, harassment, transit, safe havens, construction)
- **Forum Posts**: Community discussions for broader safety topics with voting and threaded comments

### Interactive Elements
- **Tip Markers**: Color-coded by severity with intelligent visual hierarchy
  - 🔴 **High/Critical** - Red markers for dangerous situations requiring immediate attention
  - 🟡 **Medium** - Yellow markers for areas requiring caution
  - 🟢 **Low** - Green markers for minor concerns
- **Clustering**: Automatically groups nearby tips for better map readability
- **Heatmap**: Toggle-able safety zone overlay showing danger levels
- **Family Markers**: Real-time locations of connected family members
- **Filter Chips**: Filter tips by category, radius, and time relevance
- **Smooth Modals**: Auto-expanding tip details with proper backdrop dimming

## 🐛 Common Issues

**Maps not showing?** → Check `.env` file has `GOOGLE_MAPS_API_KEY` and rebuild
**SDK location error?** → See [SETUP.md](SETUP.md) for Android SDK configuration
**App crashes?** → Run `npx expo run:android` at least once (uses dev client, not Expo Go)
**Build errors?** → Try `npx expo start -c` to clear cache

> **Full troubleshooting guide:** See [SETUP.md](SETUP.md)

## 👥 Team

Developed by TIP Manila students:
- Mark Andrei Condino - Team Lead
- Daniel Espela


## 📄 License

This is a student project for educational purposes.

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Local development setup guide
- [Expo Docs](https://docs.expo.dev) - Expo framework documentation
- [React Native Maps](https://github.com/react-native-maps/react-native-maps) - Maps library docs

---

**Made with ❤️ for women's safety in Philippine cities**
