# Local Development Setup Guide

This guide will help you set up SafeTransit for local development on your machine.

## Prerequisites

Before you begin, ensure you have:
- **Node.js 20+** installed ([Download](https://nodejs.org/))
- **Android Studio** installed with Android SDK
- **Git** installed
- An **Android device** with USB debugging enabled (recommended over emulator)

---

## 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd SafeTransit
npm install
```

---

## 2. Configure Android SDK Path

The Android SDK location is unique to each developer's machine and must be configured locally.

### Find Your Android SDK Path

**Windows:**
- Usually: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
- Or check in Android Studio: Settings → Appearance & Behavior → System Settings → Android SDK

**Mac:**
- Usually: `~/Library/Android/sdk`
- Or: `/Users/YourUsername/Library/Android/sdk`

**Linux:**
- Usually: `~/Android/Sdk`

### Option 1: Set Environment Variable (Recommended)

**Windows (PowerShell):**
```powershell
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\YourUsername\AppData\Local\Android\Sdk', 'User')
[System.Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', 'C:\Users\YourUsername\AppData\Local\Android\Sdk', 'User')
```

**Mac/Linux (bash/zsh):**
Add to `~/.bashrc`, `~/.zshrc`, or `~/.bash_profile`:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/platform-tools
```
Then run: `source ~/.zshrc` (or appropriate file)

### Option 2: Create local.properties File

If the environment variable doesn't work, create `android/local.properties`:

**Windows:**
```properties
sdk.dir=C:/Users/YourUsername/AppData/Local/Android/Sdk
```

**Mac:**
```properties
sdk.dir=/Users/YourUsername/Library/Android/sdk
```

**Linux:**
```properties
sdk.dir=/home/YourUsername/Android/Sdk
```

**Note:** 
- Use forward slashes `/` even on Windows
- This file is gitignored (unique per developer)

---

## 3. Configure Google Maps API Key

The app requires a Google Maps API key to display maps.

### Get Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable **Maps SDK for Android**:
   - Go to "APIs & Services" → "Library"
   - Search for "Maps SDK for Android"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated key

### Optional: Restrict Your API Key

For security, restrict the key to your app:
1. Click on your API key in the Credentials page
2. Under "Application restrictions":
   - Select "Android apps"
   - Add package name: `com.safetransit.app`
   - Add SHA-1 fingerprint (get from Android Studio or `keytool`)

### Add Key to Project

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file:**
   ```env
   GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY_HERE
   ```

3. **Important:** 
   - The `.env` file is gitignored (never commit it!)
   - Each team member needs their own `.env` file
   - API key is free tier: $200/month credit (~28,000 map loads)

---

## 4. Build and Install the App

### First Time Setup

1. **Connect your Android device** via USB
2. **Enable USB debugging** on device:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"
3. **Authorize your computer** when prompted on device

### Build the Development App

```bash
npx expo run:android
```

This command will:
- Generate native Android code
- Inject your Google Maps API key
- Build the APK
- Install it on your connected device
- Open the app

**You only need to run this once per device** (or when native dependencies change).

### Troubleshooting Build Issues

**"SDK location not found":**
- Make sure you completed Step 2 (Android SDK configuration)
- Verify the path is correct
- Try restarting your terminal

**"Unable to delete directory" (Windows):**
- Close Android Studio
- Run: `cd android && .\gradlew.bat --stop`
- Try the build again

**"No connected devices":**
- Check USB cable connection
- Enable USB debugging on device
- Run `adb devices` to verify device is detected

---

## 5. Daily Development Workflow

After the initial build, you only need:

```bash
npm start
```

Then press:
- `a` - Open on Android
- `r` - Reload app
- `j` - Open debugger
- `m` - Toggle dev menu

The app will hot-reload when you save changes!

---

## 6. Team Collaboration Setup

### For Team Members Cloning the Repo

Each team member needs to:

1. **Clone the repo:**
   ```bash
   git clone <repo-url>
   cd SafeTransit
   npm install
   ```

2. **Configure their Android SDK path** (Step 2 above)

3. **Create their own `.env` file** with their API key (Step 3 above)

4. **Build once:**
   ```bash
   npx expo run:android
   ```

5. **Daily development:**
   ```bash
   npm start
   ```

### What Gets Committed to Git?

✅ **Committed:**
- `android/` folder (native code)
- `app.config.js` (config template)
- `.env.example` (template file)
- All source code

❌ **Not Committed (gitignored):**
- `.env` (your API key)
- `android/local.properties` (your SDK path)
- `node_modules/`

---

## 7. GitHub Actions / CI Setup

For automated APK builds via GitHub Actions:

1. **Add Google Maps API Key as GitHub Secret:**
   - Go to repo Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `GOOGLE_MAPS_API_KEY`
   - Value: Your API key
   - Click "Add secret"

2. The workflow will automatically:
   - Create `.env` file from the secret
   - Build the APK
   - Upload to GitHub Releases

---

## 8. Common Issues

### Maps not showing in app
- Check `.env` file exists and has correct API key
- Verify API key is enabled at Google Cloud Console
- Rebuild: `npx expo run:android`

### App won't install
- Enable "Install from Unknown Sources" on device
- Uninstall old version first
- Check device has enough storage

### Changes not appearing
- Make sure Metro bundler is running (`npm start`)
- Press `r` in terminal to reload
- Or shake device → "Reload"

### Build takes very long
- First build takes 3-5 minutes (normal)
- Subsequent builds with `npm start` are instant
- Use `--no-daemon` flag if gradle daemon causes issues

---

## Need Help?

- Check main [README.md](README.md) for project overview
- Review [Expo Documentation](https://docs.expo.dev)
- Check [React Native Maps docs](https://github.com/react-native-maps/react-native-maps)

---

**Made with ❤️ by TIP Manila students**
