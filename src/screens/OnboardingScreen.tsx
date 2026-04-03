import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, KeyboardAvoidingView,
  Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { CURRENCY_OPTIONS } from '../constants/categories';
import { Spacing, Radius } from '../constants/spacing';
import { FontSize } from '../constants/typography';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

const { width: SW } = Dimensions.get('window');

// No emoji — each slide has an Ionicon name
const SLIDES: {
  iconName:  keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title:     string;
  subtitle:  string;
}[] = [
  {
    iconName:  'wallet-outline',
    iconColor: '#6366F1',
    title:     'Take control of\nyour money',
    subtitle:  'Track every rupee, understand your habits, and make better decisions with your finances.',
  },
  {
    iconName:  'bar-chart-outline',
    iconColor: '#10B981',
    title:     'Insights that\nactually help',
    subtitle:  'Spending patterns, weekly trends, and a live Karma Score that keeps you accountable.',
  },
  {
    iconName:  'flag-outline',
    iconColor: '#F59E0B',
    title:     'Set goals.\nStay on track.',
    subtitle:  'Savings goals, budget limits, no-spend challenges. Build habits that compound over time.',
  },
];

interface NavProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export const OnboardingScreen: React.FC<NavProps> = ({ navigation }) => {
  const { completeOnboarding } = useAppStore();

  const [step,             setStep]             = useState(0);
  const [name,             setName]             = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCY_OPTIONS[0]);
  const [budget,           setBudget]           = useState('');
  const [nameError,        setNameError]        = useState('');
  const [loading,          setLoading]          = useState(false);

  const scrollRef  = useRef<ScrollView>(null);
  const fadeAnim   = useRef(new Animated.Value(1)).current;
  const slideAnim  = useRef(new Animated.Value(0)).current;

  const goToSlide = async (next: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(next);
    scrollRef.current?.scrollTo({ x: next * SW, animated: true });
  };

  const goToSetup = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setStep(3);
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleFinish = async () => {
    if (!name.trim()) { setNameError('Please enter your name'); return; }
    setNameError('');
    setLoading(true);
    try {
      await completeOnboarding(
        name.trim(),
        selectedCurrency.code,
        selectedCurrency.symbol,
        parseFloat(budget) || 0,
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('MainTabs');
    } finally {
      setLoading(false);
    }
  };

  // ── Setup Screen ──────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <View style={[styles.root, { backgroundColor: '#080C14' }]}>
        <StatusBar style="light" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Animated.ScrollView
            style={{ opacity: fadeAnim }}
            contentContainerStyle={styles.setupScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <TouchableOpacity onPress={() => setStep(2)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#94A3B8" />
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
              <View style={styles.setupHeader}>
                <View style={[styles.setupIconBox, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.30)' }]}>
                  <Ionicons name="person-outline" size={28} color="#6366F1" />
                </View>
                <Text style={styles.setupTitle}>Quick setup</Text>
                <Text style={styles.setupSub}>
                  10 seconds and you're in.
                </Text>
              </View>

              {/* Name */}
              <Input
                label="Your first name"
                placeholder="e.g. Aryan"
                value={name}
                onChangeText={(t) => { setName(t); setNameError(''); }}
                error={nameError}
                autoCapitalize="words"
                autoFocus
                returnKeyType="next"
                leftIcon="person-outline"
                containerStyle={{ marginBottom: Spacing[5] }}
              />

              {/* Currency */}
              <Text style={styles.fieldLabel}>Currency</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing[2], marginBottom: Spacing[5] }}
              >
                {CURRENCY_OPTIONS.map((c) => {
                  const active = selectedCurrency.code === c.code;
                  return (
                    <TouchableOpacity
                      key={c.code}
                      onPress={async () => { await Haptics.selectionAsync(); setSelectedCurrency(c); }}
                      style={[
                        styles.currencyChip,
                        {
                          backgroundColor: active ? 'rgba(99,102,241,0.15)' : '#111827',
                          borderColor:     active ? '#6366F1'                 : '#1F2D3D',
                          borderWidth:     active ? 1.5                       : 1,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: FontSize.xl, color: '#E2E8F0', fontWeight: '600' }}>
                        {c.symbol}
                      </Text>
                      <Text style={{ fontSize: FontSize.sm, color: active ? '#818CF8' : '#64748B', fontWeight: '500' }}>
                        {c.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Budget */}
              <Input
                label={`Monthly budget (${selectedCurrency.symbol}) — optional`}
                placeholder="e.g. 30000"
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                returnKeyType="done"
                leftIcon="wallet-outline"
                hint="We'll track your spending against this limit"
                prefix={selectedCurrency.symbol}
                containerStyle={{ marginBottom: Spacing[8] }}
              />

              <Button label={loading ? 'Setting up…' : 'Get started'} onPress={handleFinish} loading={loading} />

              <Text style={styles.privacyNote}>
                Your data stays on your device. No account needed.
              </Text>
            </Animated.View>
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── Slides ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: '#080C14' }]}>
      <StatusBar style="light" />
      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: SW }]}>
            <SafeAreaView style={styles.slideInner}>
              {/* Icon */}
              <View style={styles.slideIconArea}>
                <View style={[styles.slideIconBox, { borderColor: `${slide.iconColor}30` }]}>
                  <View style={[styles.slideIconInner, { backgroundColor: `${slide.iconColor}18` }]}>
                    <Ionicons name={slide.iconName} size={44} color={slide.iconColor} />
                  </View>
                </View>
              </View>

              {/* Text */}
              <View style={styles.slideText}>
                <Text style={styles.slideTitle}>{slide.title}</Text>
                <Text style={styles.slideSub}>{slide.subtitle}</Text>
              </View>

              {/* Dots */}
              <View style={styles.dots}>
                {SLIDES.map((_, d) => (
                  <View key={d} style={[
                    styles.dot,
                    {
                      backgroundColor: d === step ? '#6366F1' : '#1F2D3D',
                      width: d === step ? 20 : 6,
                    },
                  ]} />
                ))}
              </View>

              {/* CTA */}
              <Button
                label={step === 2 ? 'Get started' : 'Continue'}
                onPress={() => step < 2 ? goToSlide(step + 1) : goToSetup()}
                style={{ marginHorizontal: Spacing[4] }}
              />

              {step < 2 && (
                <TouchableOpacity onPress={goToSetup} style={styles.skipBtn}>
                  <Text style={styles.skipText}>Skip intro</Text>
                </TouchableOpacity>
              )}
            </SafeAreaView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Slides
  slide:      { flex: 1 },
  slideInner: {
    flex: 1,
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[8],
    justifyContent: 'flex-end',
  },
  slideIconArea: {
    alignItems: 'center',
    marginBottom: 'auto',
    marginTop: 80,
  },
  slideIconBox: {
    width: 120, height: 120,
    borderRadius: 36,
    borderWidth: 1,
    padding: 12,
  },
  slideIconInner: {
    flex: 1,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideText:  { marginBottom: Spacing[10] },
  slideTitle: {
    fontSize: 34, fontWeight: '700',
    color: '#F1F5F9', letterSpacing: -1,
    lineHeight: 42, marginBottom: Spacing[4],
  },
  slideSub: {
    fontSize: FontSize.md, color: '#475569',
    lineHeight: FontSize.md * 1.7,
  },
  dots: { flexDirection: 'row', gap: 6, marginBottom: Spacing[6] },
  dot:  { height: 6, borderRadius: 3 },
  skipBtn: { alignItems: 'center', marginTop: Spacing[5] },
  skipText: { fontSize: FontSize.sm, color: '#334155' },

  // Setup
  setupScroll: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: 60,
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing[6],
  },
  setupHeader: { alignItems: 'center', marginBottom: Spacing[8] },
  setupIconBox: {
    width: 72, height: 72,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  setupTitle: {
    fontSize: 28, fontWeight: '700',
    color: '#E2E8F0', letterSpacing: -0.8,
    marginBottom: Spacing[2],
  },
  setupSub: {
    fontSize: FontSize.md, color: '#475569',
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: FontSize.sm, fontWeight: '500',
    color: '#64748B', marginBottom: Spacing[2], letterSpacing: 0.3,
  },
  currencyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
  },
  privacyNote: {
    textAlign: 'center', fontSize: FontSize.xs,
    color: '#334155', marginTop: Spacing[4],
  },
});