# SafeTransit - Women's Journey Protection Network

A safety-first navigation app designed for women commuters in Philippine cities. Built with React Native, Expo SDK 54, and NativeWind (Tailwind CSS).

## 🎯 Features

### Core Safety Features
- **Background Protection**: Monitors location even when app is closed, alerts on entering danger zones
- **Safe Route Planning**: Color-coded routes (Green/Yellow/Red) for Walking, Driving, and Transit
- **Community Tips**: Verified, anonymous safety tips from fellow travelers
- **Profile Picture**: Personalize your account with a profile photo (Local persistence included).
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

- **React Native** with Expo SDK 54
- **Expo Router** for file-based navigation
- **Google Maps** for Android (react-native-maps)
- **NativeWind** (Tailwind CSS for React Native)
- **TypeScript** for type safety

> **Note:** Requires Google Maps API key (free tier available). See [SETUP.md](SETUP.md) for configuration.

## 📱 App Screens

- **Onboarding** - Welcome, permissions, tutorial
- **Home/Map** - Interactive map with safety zones, panic button, quick exit
- **Route Planning** - Safe routes with color-coded risk levels
- **Community** - Browse and share verified safety tips
- **Profile** - Settings, emergency contacts, app info

## 🐛 Common Issues

**Maps not showing?** → Check `.env` file has `GOOGLE_MAPS_API_KEY` and rebuild
**SDK location error?** → See [SETUP.md](SETUP.md) for Android SDK configuration
**App crashes?** → Run `npx expo run:android` at least once (uses dev client, not Expo Go)
**Build errors?** → Try `npx expo start -c` to clear cache

> **Full troubleshooting guide:** See [SETUP.md](SETUP.md)

## 👥 Team

Developed by TIP Manila students:
- Mark Andrei Condino - Team Lead
- Jaycee Thea Guarino
- Nikola Ng
- Daniel Espela
- Jeremy Dimasacat

## 📄 License

This is a student project for educational purposes.

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Local development setup guide
- [Expo Docs](https://docs.expo.dev) - Expo framework documentation
- [React Native Maps](https://github.com/react-native-maps/react-native-maps) - Maps library docs

---

**Made with ❤️ for women's safety in Philippine cities**
