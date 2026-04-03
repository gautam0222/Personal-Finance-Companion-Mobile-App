import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { getMonthlyStats } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { Radius, Spacing } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';
import { format } from 'date-fns';

// Animated counter hook — rolls number up from 0 on mount
function useCountUp(target: number, duration = 900) {
  const animated = useRef(new Animated.Value(0)).current;
  const display  = useRef('0');

  useEffect(() => {
    Animated.timing(animated, {
      toValue:         target,
      duration,
      useNativeDriver: false,
    }).start();
  }, [target]);

  animated.addListener(({ value }) => {
    display.current = Math.round(value).toString();
  });

  return animated;
}

export const BalanceCard: React.FC = () => {
  const { colors } = useTheme();
  const settings     = useAppStore((s) => s.settings);
  const transactions = useTransactionStore((s) => s.transactions);

  const { totalBalance, totalIncome, totalExpense } = getMonthlyStats(transactions);
  const sym     = settings.currencySymbol;
  const month   = format(new Date(), 'MMMM yyyy');

  // Animated balance value
  const animVal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    animVal.setValue(0);
    Animated.timing(animVal, {
      toValue:         totalBalance,
      duration:        1000,
      useNativeDriver: false,
    }).start();
  }, [totalBalance]);

  const [displayBalance, setDisplayBalance] = React.useState('0');
  useEffect(() => {
    const id = animVal.addListener(({ value }) => {
      setDisplayBalance(
        formatCurrency(value, sym),
      );
    });
    return () => animVal.removeListener(id);
  }, [animVal, sym]);

  return (
    <LinearGradient
      colors={['#0D1425', '#111827']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Subtle dot grid */}
      <View style={styles.gridOverlay} />

      {/* Accent line top */}
      <View style={styles.accentLine} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.cardLabel}>TOTAL BALANCE</Text>
        <View style={[styles.monthBadge, { borderColor: colors.border }]}>
          <Text style={styles.monthText}>{month}</Text>
        </View>
      </View>

      {/* Balance */}
      <View style={styles.balanceRow}>
        <Text style={[styles.balanceAmount, totalBalance < 0 && { color: '#FB7185' }]}>
          {displayBalance}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Income / Expense chips */}
      <View style={styles.chipsRow}>
        <View style={styles.chip}>
          <View style={[styles.chipIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
            <Ionicons name="arrow-up-outline" size={13} color="#34D399" />
          </View>
          <View>
            <Text style={styles.chipLabel}>Income</Text>
            <Text style={[styles.chipValue, { color: '#34D399' }]}>
              {formatCurrency(totalIncome, sym)}
            </Text>
          </View>
        </View>

        <View style={[styles.chipSeparator, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />

        <View style={styles.chip}>
          <View style={[styles.chipIcon, { backgroundColor: 'rgba(244,63,94,0.15)' }]}>
            <Ionicons name="arrow-down-outline" size={13} color="#FB7185" />
          </View>
          <View>
            <Text style={styles.chipLabel}>Expenses</Text>
            <Text style={[styles.chipValue, { color: '#FB7185' }]}>
              {formatCurrency(totalExpense, sym)}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius:  Radius['2xl'],
    overflow:      'hidden',
    borderWidth:   1,
    borderColor:   '#1F2D3D',
  },
  gridOverlay: {
    position:        'absolute',
    inset:           0,
    opacity:         0.035,
    // Static representation — real grid would use SVG but this hints at texture
    backgroundColor: 'transparent',
  },
  accentLine: {
    height:          2,
    backgroundColor: '#6366F1',
    opacity:         0.8,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop:        Spacing[5],
    paddingBottom:     Spacing[3],
  },
  cardLabel: {
    fontSize:      9,
    fontWeight:    '700',
    color:         '#475569',
    letterSpacing: 2,
  },
  monthBadge: {
    borderWidth:       1,
    borderRadius:      Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical:   3,
  },
  monthText: {
    fontSize:   10,
    color:      '#64748B',
    fontWeight: '500',
  },
  balanceRow: {
    paddingHorizontal: Spacing[5],
    paddingBottom:     Spacing[5],
  },
  balanceAmount: {
    fontSize:              44,
    fontWeight:            '700',
    color:                 '#F1F5F9',
    letterSpacing:         -2,
    fontVariant:           ['tabular-nums'] as any,
    lineHeight:            52,
  },
  divider: {
    height:            1,
    marginHorizontal:  Spacing[5],
    marginBottom:      Spacing[4],
  },
  chipsRow: {
    flexDirection:     'row',
    paddingHorizontal: Spacing[5],
    paddingBottom:     Spacing[5],
    gap:               Spacing[4],
  },
  chip: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing[3],
  },
  chipIcon: {
    width:          32,
    height:         32,
    borderRadius:   Radius.sm,
    alignItems:     'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 10,
    color:    '#475569',
    marginBottom: 2,
  },
  chipValue: {
    fontSize:    14,
    fontWeight:  '700',
    fontVariant: ['tabular-nums'] as any,
  },
  chipSeparator: {
    width:             1,
    height:            36,
    alignSelf:         'center',
  },
});
