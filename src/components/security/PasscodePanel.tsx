import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Spacing } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

interface Props {
  title: string;
  subtitle: string;
  code: string;
  processing?: boolean;
  error?: string;
  status?: string;
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
  secondaryActionLabel?: string;
  secondaryActionIcon?: keyof typeof Ionicons.glyphMap;
  onSecondaryAction?: () => void;
  secondaryActionDisabled?: boolean;
  /** Set to true while biometric auth is in-flight to show a spinner */
  biometricAuthenticating?: boolean;
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Animated dot — springs up slightly when filled
function AnimatedDot({ filled, color, border }: { filled: boolean; color: string; border: string }) {
  const scale = useRef(new Animated.Value(filled ? 1 : 0.85)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: filled ? 1.15 : 0.85,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start(() => {
      if (filled) {
        Animated.spring(scale, {
          toValue: 1,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [filled]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor: filled ? color : 'transparent',
          borderColor: filled ? color : border,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

export const PasscodePanel: React.FC<Props> = ({
  title,
  subtitle,
  code,
  processing = false,
  error,
  status,
  onDigitPress,
  onBackspace,
  secondaryActionLabel,
  secondaryActionIcon = 'scan-outline',
  onSecondaryAction,
  secondaryActionDisabled = false,
  biometricAuthenticating = false,
}) => {
  const { colors, isDark } = useTheme();
  const tone = error ? colors.expenseText : status ? colors.primaryLight : colors.textSecondary;

  // Shake animation on error
  const shakeX = useRef(new Animated.Value(0)).current;
  const prevError = useRef(error);
  useEffect(() => {
    if (error && error !== prevError.current) {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
    prevError.current = error;
  }, [error]);

  const renderDigit = (digit: string) => (
    <TouchableOpacity
      key={digit}
      activeOpacity={0.75}
      disabled={processing}
      onPress={() => onDigitPress(digit)}
      style={[
        styles.key,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.cardElevated,
          borderColor: isDark ? 'rgba(255,255,255,0.10)' : colors.border,
        },
      ]}
    >
      <Text style={[styles.keyLabel, { color: colors.text }]}>{digit}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={isDark ? ['#08101A', '#111827'] : ['#FFFFFF', '#F8FAFC']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[
        styles.card,
        {
          borderColor: isDark ? 'rgba(129,140,248,0.20)' : colors.border,
          shadowColor: isDark ? '#000000' : '#0F172A',
        },
      ]}
    >
      {/* Shield icon */}
      <View style={[styles.hero, { backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}35` }]}>
        <Ionicons name="shield-checkmark-outline" size={28} color={colors.primaryLight} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>

      {/* Animated dots */}
      <Animated.View style={[styles.dots, { transform: [{ translateX: shakeX }] }]}>
        {[0, 1, 2, 3].map((index) => (
          <AnimatedDot
            key={index}
            filled={index < code.length}
            color={colors.primary}
            border={colors.border}
          />
        ))}
      </Animated.View>

      {/* Status / error line — always reserves space */}
      <Text style={[styles.meta, { color: tone }]} numberOfLines={1}>
        {error ?? status ?? (processing && !biometricAuthenticating ? 'Checking passcode…' : '')}
      </Text>

      {/* Numpad grid */}
      <View style={styles.grid}>
        {/* Row 1-2-3 */}
        <View style={styles.row}>{['1','2','3'].map(renderDigit)}</View>
        {/* Row 4-5-6 */}
        <View style={styles.row}>{['4','5','6'].map(renderDigit)}</View>
        {/* Row 7-8-9 */}
        <View style={styles.row}>{['7','8','9'].map(renderDigit)}</View>
        {/* Row biometric | 0 | backspace */}
        <View style={styles.row}>
          {onSecondaryAction ? (
            <TouchableOpacity
              activeOpacity={0.75}
              disabled={processing || secondaryActionDisabled}
              onPress={onSecondaryAction}
              style={[
                styles.key,
                {
                  backgroundColor: `${colors.primary}12`,
                  borderColor: `${colors.primary}28`,
                  opacity: processing || secondaryActionDisabled ? 0.45 : 1,
                },
              ]}
            >
              {biometricAuthenticating ? (
                <ActivityIndicator size="small" color={colors.primaryLight} />
              ) : (
                <>
                  <Ionicons name={secondaryActionIcon} size={20} color={colors.primaryLight} />
                  {secondaryActionLabel != null && (
                    <Text
                      style={[styles.secondaryLabel, { color: colors.primaryLight }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {secondaryActionLabel}
                    </Text>
                  )}
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.keySpacer} />
          )}

          {renderDigit('0')}

          <TouchableOpacity
            activeOpacity={0.75}
            disabled={processing || code.length === 0}
            onPress={onBackspace}
            style={[
              styles.key,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.cardElevated,
                borderColor: isDark ? 'rgba(255,255,255,0.10)' : colors.border,
                opacity: processing || code.length === 0 ? 0.45 : 1,
              },
            ]}
          >
            <Ionicons name="backspace-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius['3xl'],
    borderWidth: 1,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[6],
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  hero: {
    width: 62,
    height: 62,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing[2],
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.sm,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing[5],
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[2],
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  meta: {
    minHeight: 20,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginBottom: Spacing[4],
    letterSpacing: 0.1,
  },
  grid: {
    gap: Spacing[3],
  },
  row: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  key: {
    flex: 1,
    aspectRatio: 1.5,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 52,
  },
  keyLabel: {
    fontSize: 26,
    fontWeight: '500',
  },
  keySpacer: {
    flex: 1,
  },
  secondaryLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
