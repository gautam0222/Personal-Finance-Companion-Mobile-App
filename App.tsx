import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useAppStore } from './src/store/useAppStore';
import { RootNavigator } from './src/navigation/RootNavigator';

// Prevent the splash screen from auto-hiding before stores are ready
SplashScreen.preventAutoHideAsync();

export default function App() {
  const isHydrated = useAppStore((s) => s.isHydrated);
  const theme      = useAppStore((s) => s.settings.theme);
  const isDark     = theme === 'dark';

  // ── Hide the native splash screen as soon as ALL stores have hydrated ──
  // useEffect (not onLayout!) so it re-runs whenever isHydrated flips to true.
  // onLayout fires once at mount when isHydrated is still false — that's the
  // bug that caused the blank screen.
  useEffect(() => {
    if (isHydrated) {
      SplashScreen.hideAsync().catch(() => {
        // Already hidden or not shown — safe to ignore
      });
    }
  }, [isHydrated]);

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary:      '#7C3AED',
          background:   '#0D0D14',
          card:         '#13131E',
          text:         '#F0F0FF',
          border:       '#1E1E30',
          notification: '#7C3AED',
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary:      '#7C3AED',
          background:   '#F5F5FF',
          card:         '#FFFFFF',
          text:         '#0D0D14',
          border:       '#E4E4F0',
          notification: '#7C3AED',
        },
      };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}