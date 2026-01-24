import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider } from '../contexts/AuthContext';
import '../global.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <AuthProvider>
            <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#ffffff' },
              animation: 'slide_from_right',
            }}
          >
          <Stack.Screen name="index" />
          <Stack.Screen name="landing" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="route-planning"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom'
            }}
          />
          <Stack.Screen
            name="add-tip"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom'
            }}
          />
          <Stack.Screen
            name="quick-exit"
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade'
            }}
          />
          <Stack.Screen
            name="notification-settings"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom'
            }}
          />
          <Stack.Screen
            name="how-it-works"
            options={{
              animation: 'slide_from_right'
            }}
          />
          <Stack.Screen
            name="emergency-contacts"
            options={{
              animation: 'slide_from_right'
            }}
          />
        </Stack>
          </AuthProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
