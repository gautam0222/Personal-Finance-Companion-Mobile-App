import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { getMonthlyStats } from '../../utils/calculations';
import { formatCurrency, toPercent } from '../../utils/formatters';
import { Radius, Spacing } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

export const QuickStats: React.FC = () => {
  const { colors } = useTheme();
  const settings     = useAppStore((s) => s.settings);
  const transactions = useTransactionStore((s) => s.transactions);
  const { totalIncome, totalExpense, savingsRate } = getMonthlyStats(transactions);
  const sym = settings.currencySymbol;

  const budgetUsed = settings.monthlyBudget > 0
    ? toPercent(totalExpense, settings.monthlyBudget)
    : null;

  const budgetColor =
    budgetUsed === null        ? colors.primary
    : budgetUsed >= 90         ? colors.expense
    : budgetUsed >= 70         ? colors.warning
    : colors.income;

  const savingsColor =
    savingsRate >= 20 ? colors.incomeText
    : savingsRate > 0 ? colors.warning
    : colors.textTertiary;

  return (
    <View style={styles.grid}>
      {/* Savings Rate */}
      <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.boxTop}>
          <Text style={[styles.boxLabel, { color: colors.textTertiary }]}>Savings Rate</Text>
          <View style={[styles.iconDot, { backgroundColor: `${savingsColor}18` }]}>
            <Ionicons name="trending-up-outline" size={13} color={savingsColor} />
          </View>
        </View>
        <Text style={[styles.boxValue, { color: savingsColor }]}>
          {Math.round(savingsRate)}%
        </Text>
        <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.barFill, {
            width: `${Math.min(100, savingsRate)}%`,
            backgroundColor: savingsColor,
          }]} />
        </View>
      </View>

      {/* Budget or Spend */}
      <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.boxTop}>
          <Text style={[styles.boxLabel, { color: colors.textTertiary }]}>
            {settings.monthlyBudget > 0 ? 'Budget Used' : 'Monthly Spend'}
          </Text>
          <View style={[styles.iconDot, { backgroundColor: `${budgetColor}18` }]}>
            <Ionicons name="wallet-outline" size={13} color={budgetColor} />
          </View>
        </View>
        <Text style={[styles.boxValue, { color: budgetColor }]}>
          {budgetUsed !== null
            ? `${Math.round(budgetUsed)}%`
            : formatCurrency(totalExpense, sym, false, true)}
        </Text>
        {budgetUsed !== null && (
          <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.barFill, {
              width: `${Math.min(100, budgetUsed)}%`,
              backgroundColor: budgetColor,
            }]} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: Spacing[3] },
  box: {
    flex:          1,
    borderRadius:  Radius.xl,
    borderWidth:   1,
    padding:       Spacing[4],
    gap:           Spacing[2],
  },
  boxTop: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  boxLabel:   { fontSize: FontSize.xs, fontWeight: '500' },
  iconDot: {
    width:          26, height: 26,
    borderRadius:   8,
    alignItems:     'center',
    justifyContent: 'center',
  },
  boxValue: {
    fontSize:    FontSize['2xl'],
    fontWeight:  '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'] as any,
  },
  barTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  barFill:  { height: 3, borderRadius: 2 },
});