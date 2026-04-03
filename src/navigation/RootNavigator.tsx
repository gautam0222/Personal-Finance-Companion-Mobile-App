import React, { useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppStore }          from '../store/useAppStore';
import { useTransactionStore }  from '../store/useTransactionStore';
import { useGoalStore }         from '../store/useGoalStore';

import { OnboardingScreen }     from '../screens/OnboardingScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { TabNavigator }         from './TabNavigator';

import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Loading UI shown while AsyncStorage is being read ────────────────────────
const HydrationSplash: React.FC = () => (
  <View style={styles.splash}>
    <View style={styles.logoBox}>
      <Text style={styles.logoMark}>✦</Text>
    </View>
    <ActivityIndicator color="#7C3AED" size="large" style={{ marginTop: 32 }} />
  </View>
);

// ─── Root navigator ───────────────────────────────────────────────────────────
export const RootNavigator: React.FC = () => {
  const { settings, isLoading, isHydrated, hydrate } = useAppStore();
  const hydrateTransactions = useTransactionStore((s) => s.hydrate);
  const hydrateGoals        = useGoalStore((s) => s.hydrate);

  // Hydrate all three stores in parallel on first mount.
  // This is the ONLY place hydration is called — App.tsx just observes
  // isHydrated to know when to hide the native splash screen.
  useEffect(() => {
    Promise.all([
      hydrate(),
      hydrateTransactions(),
      hydrateGoals(),
    ]).catch((err) => {
      console.warn('[RootNavigator] hydration error:', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show internal loading screen until every store has finished reading
  // from AsyncStorage. This also keeps the UI stable — no flash of the
  // wrong initial route.
  if (!isHydrated || isLoading) {
    return <HydrationSplash />;
  }

  const initialRoute: keyof RootStackParamList = settings.hasOnboarded
    ? 'MainTabs'
    : 'Onboarding';

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          animation:         'slide_from_bottom',
          presentation:      'card',
          gestureEnabled:    true,
          gestureDirection:  'vertical',
        }}
      />
    </Stack.Navigator>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  splash: {
    flex:            1,
    backgroundColor: '#0D0D14',
    alignItems:      'center',
    justifyContent:  'center',
  },
  logoBox: {
    width:           80,
    height:          80,
    borderRadius:    24,
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderWidth:     1,
    borderColor:     'rgba(124,58,237,0.40)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  logoMark: {
    fontSize:   36,
    color:      '#9B68F0',
    fontWeight: '700',
  },
});