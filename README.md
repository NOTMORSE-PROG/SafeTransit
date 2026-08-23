# SafeTransit - Women's Journey Protection Network

A comprehensive safety-first navigation app designed for women commuters in Philippine cities. Built with React Native, Expo SDK 54, and NativeWind (Tailwind CSS).

## 🎯 Overview

SafeTransit empowers women travelers with real-time safety information, community-powered alerts, and intelligent route planning. The app combines location-based safety tips, background protection monitoring, and a supportive community forum to create a comprehensive safety network.

## Repository Layout

| Path | Component |
|---|---|
| `/` | Expo/React Native mobile application |
| `backend/` | Vercel serverless API |

The canonical repository is `https://github.com/NOTMORSE-PROG/SafeTransit`. The mobile app and API are maintained together, while each component keeps its own dependencies and runtime commands.

## ✨ Core Features

### 🛡️ Safety & Protection
- **Background Protection**: Monitors location continuously, even when app is closed, and alerts on entering danger zones
- **Silent Panic Button**: Discreet emergency alerts sent to helpers and emergency contacts
- **Quick Exit Screen**: Instantly disguises app as a weather forecast for privacy protection
- **Danger Zone Alerts**: Real-time notifications when approaching or entering high-risk areas
- **Safety Heatmap**: Visual overlay showing area safety levels based on community data

### 🗺️ Navigation & Routing
- **Safe Route Planning**: Multi-modal route planning (Walking, Driving, Transit) with real-time safety assessments
- **Color-Coded Routes**: Visual safety indicators showing danger zones, safe segments, and overall route safety score
- **Turn-by-Turn Navigation**: Step-by-step guidance with distance and direction indicators
- **Route Safety Analysis**: Automatic assessment based on nearby safety tips and danger zones
- **Hybrid Routing Engine**: Uses OpenRouteService for pedestrian routes and LocationIQ for driving routes

### 📍 Community Map Tips
Location-specific, admin-verified safety alerts with categories:
- 🔦 **Poor Lighting** - Areas with inadequate street lighting
- ⚠️ **Harassment** - Reported harassment incidents
- 🚌 **Transit Issues** - Public transportation safety concerns
- 🛡️ **Safe Havens** - Verified safe places and establishments
- 🚧 **Construction** - Road closures and construction zones

**Features:**
- Tip markers color-coded by severity (High/Critical, Medium, Low)
- Intelligent clustering for better map readability
- Filter by category, radius, and time relevance
- Auto-expanding tip detail cards with full information
- Admin verification system for tip quality

### 💬 Community Forum
Discussion-based posts with:
- Upvoting and downvoting system
- Threaded comments with nested replies
- Post flairs (Safety Alert, Discussion, Question, etc.)
- Location tags for area-specific discussions
- Photo attachments via UploadThing
- Report and moderation system

### 👨‍👩‍👧‍👦 Family Location Sharing
- Real-time location tracking with trusted family members
- Live location indicators on map
- Quick navigation to family member locations
- Privacy controls and permission management

### 🎨 User Experience
- Beautiful, modern UI with smooth animations and glassmorphic design
- Fully responsive design for all Android screen sizes
- Intuitive navigation with Expo Router (file-based routing)
- Interactive map with clustering and custom markers
- Haptic feedback for important interactions
- Accessible and easy to use
- Works on Android 11-16 (SDK 30-35)

## 🚀 Getting Started

### Prerequisites
- **Node.js 20+** installed ([Download](https://nodejs.org/))
- **npm** package manager
- **Android Studio** with Android SDK installed
- **Physical Android device** with USB debugging enabled (recommended over emulator)
- **Google Maps API key** (free tier available - $200/month credit)

### Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/NOTMORSE-PROG/SafeTransit.git
   cd SafeTransit
   npm install
   ```

2. **Configure Environment**
   See [SETUP.md](SETUP.md) for detailed local setup instructions including:
   - Android SDK path configuration
   - Google Maps API key setup
   - Environment variables

3. **Build and Install (First Time)**
   ```bash
   npx expo run:android
   ```
   This builds and installs the development build on your device. You only need to do this once per device.

4. **Start Development Server**
   ```bash
   npm start
   ```
   After the initial build, just use this command for daily development. Press `a` to open on Android, `r` to reload.

### Backend Development

From the repository root:

```bash
cd backend
npm install
npm test
npm run dev
```

The API has its own environment variables and deployment configuration. See [`backend/README.md`](backend/README.md).

## 🛠️ Tech Stack

### Frontend
- **React Native 0.81.5** with **Expo SDK 54**
- **Expo Router 6.0.21** - File-based navigation with typed routes
- **TypeScript 5.9** - Full type safety
- **NativeWind 4.0** - Tailwind CSS for React Native
- **React Native Reanimated 4.1** - Smooth 60fps animations
- **React Native Gesture Handler** - Advanced gesture support
- **React Native Maps 1.20** - Google Maps integration with clustering
- **React Native Map Clustering** - Efficient marker clustering
- **Lucide React Native** - Icon library

### Backend & Services
- **Vercel** - Serverless functions for API endpoints
- **Neon PostgreSQL** - Serverless database with HTTP/WebSocket driver
- **UploadThing** - Image upload service
- **JWT** - Token-based authentication
- **AsyncStorage** - Local data persistence

### External APIs & Services
- **Google Maps SDK** - Map rendering and geocoding
- **LocationIQ** - Driving route planning and geocoding
- **OpenRouteService** - Pedestrian and cycling route planning
- **Nominatim** - Reverse geocoding (OpenStreetMap)
- **Overpass API** - OpenStreetMap data queries

### Development Tools
- **ESLint** - Code quality and linting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **Patch Package** - Dependency patching for compatibility
- **Expo Dev Client** - Custom development build

## 📱 App Architecture

### Screen Structure
```
app/
├── index.tsx                    # Splash/loading screen
├── landing.tsx                  # Landing page (unauthenticated)
├── (tabs)/                      # Main tab navigation
│   ├── index.tsx               # Home/Map screen
│   ├── community.tsx           # Forum feed
│   ├── notifications.tsx       # Notifications
│   └── profile.tsx             # User profile
├── auth/                        # Authentication
│   ├── login.tsx
│   └── signup.tsx
├── onboarding/                  # First-time user flow
│   ├── welcome.tsx
│   ├── tutorial.tsx
│   ├── permissions.tsx
│   ├── contact-number.tsx
│   └── emergency-contacts.tsx
├── route-planning.tsx           # Route planning screen
├── navigation.tsx               # Turn-by-turn navigation
├── add-tip.tsx                  # Submit safety tip
├── create-post.tsx              # Create forum post
├── post-detail.tsx              # Forum post detail
├── my-tips.tsx                  # User's submitted tips
├── my-posts.tsx                 # User's forum posts
├── family.tsx                   # Family management
├── emergency-contacts.tsx       # Emergency contacts
├── notification-settings.tsx   # Notification preferences
├── how-it-works.tsx             # Feature explanations
└── quick-exit.tsx               # Privacy disguise screen
```

### Service Layer Architecture
```
services/
├── auth/                        # Authentication services
│   ├── jwt.ts                  # JWT token handling
│   └── validation.ts           # Input validation
├── database.ts                 # Neon PostgreSQL connection
├── tipsService.ts              # Safety tips CRUD operations
├── forumService.ts             # Forum posts and comments
├── routeSafetyService.ts       # Route safety analysis
├── locationIQRouting.ts        # LocationIQ routing
├── openRouteService.ts         # OpenRouteService routing
├── nominatim.ts                # Geocoding service
├── familyLocationService.ts     # Family location sharing
├── familyService.ts            # Family member management
├── notifications.ts            # Push notification handling
├── clusteringService.ts        # Map marker clustering
├── heatmapCacheService.ts      # Safety heatmap caching
├── locationStorage.ts          # Local location storage
├── uploadthing.ts              # Image upload service
└── repositories/                # Data access layer
    ├── tipsRepository.ts
    ├── forumRepository.ts
    ├── userRepository.ts
    └── familyRepository.ts
```

### Component Structure
```
components/
├── map/                         # Map-related components
│   ├── TipMarker.tsx           # Safety tip markers
│   ├── TipCluster.tsx          # Clustered markers
│   ├── TipDetailCard.tsx       # Tip detail modal
│   ├── SafetyHeatmap.tsx       # Heatmap overlay
│   ├── FilterChips.tsx         # Tip filtering UI
│   ├── OptimizedMarker.tsx     # Performance-optimized marker
│   └── FamilyMemberMarker.tsx  # Family location markers
├── forum/                       # Forum components
│   ├── ForumPostCard.tsx
│   ├── CommentItem.tsx
│   ├── VoteButtons.tsx
│   └── FlairBadge.tsx
├── EmergencyAlertModal.tsx     # Panic button modal
├── ProtectionEnabledModal.tsx  # Background protection confirmation
├── NavigationConfirmModal.tsx  # Route navigation confirmation
├── LocationSearchInput.tsx     # Location search component
└── UserAvatar.tsx              # User profile image
```

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

## 🔐 Authentication & Security

- **JWT-based authentication** with secure token storage
- **Google Sign-In** integration (requires development build)
- **Email/Password** authentication
- **Token refresh** mechanism
- **Secure API communication** with bearer tokens
- **Background location permissions** with user consent

## 📊 Database Schema

The app uses PostgreSQL with Neon serverless driver. Key tables include:
- `users` - User accounts and profiles
- `tips` - Safety tips with location, category, status
- `forum_posts` - Community forum posts
- `forum_comments` - Threaded comments
- `family_members` - Family location sharing relationships
- `emergency_contacts` - User emergency contacts
- `notifications` - Push notification records

## 🚦 Route Planning & Safety Analysis

### Route Safety Algorithm
1. **Route Fetching**: Gets multiple route options from LocationIQ/OpenRouteService
2. **Bounding Box Calculation**: Determines area to search for safety tips
3. **Tip Aggregation**: Fetches all tips within route buffer (50m)
4. **Segment Analysis**: Divides route into ~100m segments
5. **Scoring**: Each segment scored based on nearby tip severity:
   - Harassment: 10 points (highest danger)
   - Poor Lighting: 5 points
   - Construction: 3 points
   - Transit Issues: 2 points
   - Safe Havens: -5 points (reduces danger)
6. **Color Coding**: Segments colored green/yellow/red based on safety score
7. **Overall Rating**: Calculates overall route safety score and danger zone count

### Route Display
- Color-coded polylines showing safe/dangerous segments
- Safety score (0-100) with rating (Safe, Caution, Unsafe)
- Danger zone count
- Tip summary by category
- Multiple route options with comparison

## 🔔 Background Protection

### How It Works
1. User enables "Background Protection" toggle
2. App requests "Always Allow" location permission
3. Background location tracking starts (even when app closed)
4. Location updates checked against danger zones
5. Alerts sent when entering high-risk areas
6. Battery-optimized tracking (~3-5% per hour)

### Requirements
- Android 11+ (SDK 30+)
- "Always Allow" location permission
- Background location permission granted
- Notification permissions enabled

## 🧪 Development Scripts

```bash
npm start              # Start Expo development server
npm run android        # Build and run on Android
npm run ios            # Build and run on iOS (if configured)
npm run web            # Start web version
npm run lint           # Run ESLint
npm run db:test        # Test database connection
npm run db:migrate     # Run database migrations
npm run db:reset       # Reset database (development only)
```

## 🐛 Common Issues & Troubleshooting

**Maps not showing?**
- Check `.env` file has `GOOGLE_MAPS_API_KEY`
- Verify API key is enabled at Google Cloud Console
- Rebuild: `npx expo run:android`

**SDK location error?**
- See [SETUP.md](SETUP.md) for Android SDK configuration
- Ensure `ANDROID_HOME` environment variable is set

**App crashes?**
- Run `npx expo run:android` at least once (uses dev client, not Expo Go)
- Check that all native dependencies are properly installed

**Build errors?**
- Try `npx expo start -c` to clear cache
- Ensure Android SDK is properly configured
- Check Node.js version (requires 20+)

**Changes not appearing?**
- Make sure Metro bundler is running (`npm start`)
- Press `r` in terminal to reload
- Or shake device → "Reload"

> **Full troubleshooting guide:** See [SETUP.md](SETUP.md)

## 🤝 Contributing

This is a student project developed by TIP Manila students. For contributions:
1. Follow the existing code style (TypeScript, ESLint rules)
2. Write meaningful commit messages
3. Test on physical Android device
4. Ensure all lint checks pass (`npm run lint`)

## 📦 Build & Deployment

### GitHub Actions CI/CD
- **build-apk.yml** - Automated APK builds on push
- **code-quality.yml** - ESLint and TypeScript checks
- **notify.yml** - Build notifications

### Manual Build
```bash
# Development build
npx expo run:android

# Production build (requires EAS)
eas build --platform android
```

### Backend Deployment

The existing API remains available at `https://safetransitbackend.vercel.app`. Its Vercel project is connected to this repository with `backend/` as the root directory. Keep that project, root directory, environment configuration, and public alias unchanged when publishing backend updates.

## 👥 Team

Developed by TIP Manila students:
- **Mark Andrei Condino** - Team Lead
- **Daniel Espela**

## 📄 License

This is a student project for educational purposes.

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Detailed local development setup guide
- [Expo Documentation](https://docs.expo.dev) - Expo framework documentation
- [React Native Maps](https://github.com/react-native-maps/react-native-maps) - Maps library docs
- [NativeWind](https://www.nativewind.dev) - Tailwind CSS for React Native

## 🔗 External Services

- **Google Maps API** - Map rendering and geocoding ([Get API Key](https://console.cloud.google.com))
- **LocationIQ** - Driving route planning ([Documentation](https://locationiq.com/docs))
- **OpenRouteService** - Pedestrian/cycling routes ([Documentation](https://openrouteservice.org/dev/#/api-docs))
- **Neon** - Serverless PostgreSQL ([Documentation](https://neon.tech/docs))
- **Vercel** - Serverless functions ([Documentation](https://vercel.com/docs))
- **UploadThing** - Image uploads ([Documentation](https://docs.uploadthing.com))

---

**Made with ❤️ for women's safety in Philippine cities**
