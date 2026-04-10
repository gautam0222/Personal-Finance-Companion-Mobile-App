import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Haptics from 'expo-haptics';
import { useAppStore } from './src/store/useAppStore';
import { RootNavigator } from './src/navigation/RootNavigator';
import {
  hasAppPasscodeAsync,
  verifyAppPasscodeAsync,
} from './src/utils/passcode';
import { PasscodePanel } from './src/components/security/PasscodePanel';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const isHydrated = useAppStore((s) => s.isHydrated);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const isDark = settings.theme === 'dark';

  const [securityReady, setSecurityReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [passcodeStatus, setPasscodeStatus] = useState('');

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAtRef = useRef<number | null>(null);
  const getLockedMessage = useCallback(() => 'Enter your 4-digit passcode to continue.', []);

  const finishUnlock = useCallback(() => {
    backgroundedAtRef.current = null;
    setPasscode('');
    setPasscodeError('');
    setPasscodeStatus('');
    setIsLocked(false);
  }, []);

  const lockApp = useCallback(
    (message?: string) => {
      setPasscode('');
      setPasscodeError('');
      setPasscodeStatus(message ?? getLockedMessage());
      setIsLocked(true);
    },
    [getLockedMessage],
  );

  useEffect(() => {
    if (isHydrated) {
      SplashScreen.hideAsync().catch(() => {
        // No-op if already hidden.
      });
    }
  }, [isHydrated]);

  useEffect(() => {
    let active = true;

    if (!isHydrated) {
      return undefined;
    }

    const prepareSecurity = async () => {
      if (!settings.hasOnboarded || !settings.appLockEnabled) {
        if (!active) return;
        finishUnlock();
        setSecurityReady(true);
        return;
      }

      const hasPasscode = await hasAppPasscodeAsync();

      if (!active) {
        return;
      }

      if (!hasPasscode) {
        await updateSettings({
          appLockEnabled: false,
        });
        if (!active) return;
        finishUnlock();
        setSecurityReady(true);
        return;
      }

      lockApp(getLockedMessage());
      setSecurityReady(true);
    };

    void prepareSecurity();

    return () => {
      active = false;
    };
  }, [
    finishUnlock,
    getLockedMessage,
    isHydrated,
    lockApp,
    settings.appLockEnabled,
    settings.hasOnboarded,
    updateSettings,
  ]);

  useEffect(() => {
    if (!isLocked || passcode.length !== 4 || isVerifyingPasscode) {
      return;
    }

    let active = true;

    const verifyPasscode = async () => {
      setIsVerifyingPasscode(true);
      setPasscodeStatus('Checking passcode...');

      const valid = await verifyAppPasscodeAsync(passcode);
      if (!active) {
        return;
      }

      if (valid) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsVerifyingPasscode(false);
        finishUnlock();
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPasscode('');
      setPasscodeStatus('');
      setPasscodeError('Incorrect passcode. Try again.');
      setIsVerifyingPasscode(false);
    };

    void verifyPasscode();

    return () => {
      active = false;
    };
  }, [finishUnlock, isLocked, isVerifyingPasscode, passcode]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      // Only record background timestamp when truly backgrounded (not a brief
      // 'inactive' pulse from a system dialog/notification on Android).
      if (nextState === 'background') {
        backgroundedAtRef.current = Date.now();
      }

      const wasBackground = appState.current === 'background';
      appState.current = nextState;

      if (
        wasBackground &&
        nextState === 'active' &&
        securityReady &&
        settings.appLockEnabled &&
        settings.hasOnboarded
      ) {
        const elapsed =
          backgroundedAtRef.current == null
            ? Number.MAX_SAFE_INTEGER
            : Date.now() - backgroundedAtRef.current;

        if (elapsed >= settings.lockGracePeriodSeconds * 1000) {
          lockApp(getLockedMessage());
        }
      }
    });

    return () => subscription.remove();
  }, [
    getLockedMessage,
    lockApp,
    securityReady,
    settings.appLockEnabled,
    settings.hasOnboarded,
    settings.lockGracePeriodSeconds,
  ]);

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (isVerifyingPasscode || passcode.length >= 4) {
        return;
      }

      setPasscodeError('');
      setPasscodeStatus('');
      setPasscode((current) => `${current}${digit}`);
    },
    [isVerifyingPasscode, passcode.length],
  );

  const handleBackspace = useCallback(() => {
    if (isVerifyingPasscode || passcode.length === 0) {
      return;
    }

    setPasscodeError('');
    setPasscodeStatus('');
    setPasscode((current) => current.slice(0, -1));
  }, [isVerifyingPasscode, passcode.length]);

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: '#6366F1',
          background: '#080C14',
          card: '#111827',
          text: '#E2E8F0',
          border: '#1F2D3D',
          notification: '#6366F1',
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: '#4F46E5',
          background: '#F8FAFC',
          card: '#FFFFFF',
          text: '#0F172A',
          border: '#E2E8F0',
          notification: '#4F46E5',
        },
      };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <RootNavigator />
          {securityReady && isLocked && (
            <View
              style={[
                styles.lockOverlay,
                { backgroundColor: isDark ? 'rgba(8,12,20,0.95)' : 'rgba(248,250,252,0.96)' },
              ]}
            >
              {/* App brand mark */}
              <View style={styles.lockBrand}>
                <View style={[styles.lockLogo, { backgroundColor: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(79,70,229,0.10)', borderColor: isDark ? 'rgba(99,102,241,0.35)' : 'rgba(79,70,229,0.25)' }]}>
                  <Text style={[styles.lockLogoMark, { color: isDark ? '#818CF8' : '#4F46E5' }]}>✦</Text>
                </View>
                <Text style={[styles.lockAppName, { color: isDark ? '#94A3B8' : '#64748B' }]}>WalletWarp</Text>
              </View>

              <View style={styles.lockCard}>
                <PasscodePanel
                  title="WalletWarp is locked"
                  subtitle={getLockedMessage()}
                  code={passcode}
                  processing={isVerifyingPasscode}
                  error={passcodeError}
                  status={passcodeStatus}
                  onDigitPress={handleDigitPress}
                  onBackspace={handleBackspace}
                />
              </View>
            </View>
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  lockBrand: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  lockLogo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockLogoMark: {
    fontSize: 22,
    fontWeight: '700',
  },
  lockAppName: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  lockCard: {
    width: '100%',
    maxWidth: 420,
  },
});
