import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';

import { useTheme }            from '../hooks/useTheme';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAppStore }         from '../store/useAppStore';

import { DonutChart }    from '../components/charts/DonutChart';
import { BarChart }      from '../components/charts/BarChart';
import { Card }          from '../components/common/Card';
import { SectionHeader } from '../components/common/SectionHeader';
import { EmptyState }    from '../components/common/EmptyState';

import {
  getCategoryBreakdown, getWeekComparison,
  getMonthlyTrend, getMonthlyStats, getTopCategory,
} from '../utils/calculations';
import { generateInsights } from '../utils/insights';
import { formatCurrency, toPercent } from '../utils/formatters';
import { getCategoryById }  from '../constants/categories';
import { Spacing, Radius }  from '../constants/spacing';
import { FontSize }         from '../constants/typography';
import type { InsightType } from '../types';

type ChartTab = 'expense' | 'income';

// ── Per-type visual config ────────────────────────────────────────────────────
function useInsightConfig() {
  const { colors } = useTheme();
  return {
    achievement: { bg: colors.incomeMuted,  border: `${colors.income}44`,  accent: colors.incomeText  },
    warning:     { bg: colors.expenseMuted, border: `${colors.expense}44`, accent: colors.expenseText },
    tip:         { bg: colors.primaryMuted, border: `${colors.primary}44`, accent: colors.primaryLight },
    info:        { bg: colors.cardElevated, border: colors.border,          accent: colors.textSecondary },
  } satisfies Record<InsightType, { bg: string; border: string; accent: string }>;
}

// ── Horizontal comparison bar ─────────────────────────────────────────────────
const CompareBar: React.FC<{
  label: string; value: number; maxValue: number; color: string; display: string;
}> = ({ label, value, maxValue, color, display }) => {
  const { colors } = useTheme();
  const pct = toPercent(value, Math.max(maxValue, 1));
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary }}>{label}</Text>
        <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color, fontVariant: ['tabular-nums'] as any }}>{display}</Text>
      </View>
      <View style={[s.barTrack, { backgroundColor: colors.border }]}>
        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
export const InsightsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const transactions       = useTransactionStore((s) => s.transactions);
  const settings           = useAppStore((s) => s.settings);
  const sym                = settings.currencySymbol;
  const insightCfg         = useInsightConfig();

  const [chartTab, setChartTab] = useState<ChartTab>('expense');

  const donutData    = useMemo(() => getCategoryBreakdown(transactions, chartTab), [transactions, chartTab]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(transactions),               [transactions]);
  const weekComp     = useMemo(() => getWeekComparison(transactions),              [transactions]);
  const monthly      = useMemo(() => getMonthlyStats(transactions),                [transactions]);
  const topCat       = useMemo(() => getTopCategory(transactions),                 [transactions]);
  const insights     = useMemo(
    () => generateInsights(transactions, sym, settings.monthlyBudget),
    [transactions, sym, settings.monthlyBudget],
  );

  const donutTotal = donutData.reduce((acc, d) => acc + d.value, 0);
  const weekMax    = Math.max(weekComp.lastWeekTotal, weekComp.thisWeekTotal, 1);

  // ── Empty state ──
  if (transactions.length === 0) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <SafeAreaView edges={['top']}>
          <View style={s.header}><Text style={[s.title, { color: colors.text }]}>Insights</Text></View>
        </SafeAreaView>
        <EmptyState
          icon="bar-chart-outline"
          title="No data yet"
          description="Add a few transactions to unlock charts, trends, and smart insights"
        />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']}>
        <View style={s.header}><Text style={[s.title, { color: colors.text }]}>Insights</Text></View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── 1. Smart Insight cards ── */}
        {insights.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="Smart Insights" />
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: Spacing[3], paddingRight: Spacing[4] }}
            >
              {insights.map((insight) => {
                const cfg = insightCfg[insight.type];
                return (
                  <View key={insight.id} style={[s.insightCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                    {/* Icon + value */}
                    <View style={s.insightTopRow}>
                      <View style={[s.insightIconBox, { backgroundColor: `${cfg.accent}18` }]}>
                        <Ionicons
                          name={insight.icon as keyof typeof Ionicons.glyphMap}
                          size={16}
                          color={cfg.accent}
                        />
                      </View>
                      {insight.value != null && (
                        <Text style={[s.insightValue, { color: cfg.accent }]}>{insight.value}</Text>
                      )}
                    </View>
                    <Text style={[s.insightTitle, { color: colors.text }]} numberOfLines={2}>
                      {insight.title}
                    </Text>
                    <Text style={[s.insightDesc, { color: colors.textSecondary }]} numberOfLines={3}>
                      {insight.description}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── 2. Monthly grid ── */}
        <View style={s.section}>
          <SectionHeader title="This Month" />
          <View style={s.statsGrid}>
            {([
              { label: 'Income',       value: formatCurrency(monthly.totalIncome,                   sym, false, true), color: colors.incomeText,  bg: colors.incomeMuted   },
              { label: 'Expenses',     value: formatCurrency(monthly.totalExpense,                   sym, false, true), color: colors.expenseText, bg: colors.expenseMuted  },
              { label: 'Saved',        value: formatCurrency(Math.max(0, monthly.totalBalance),      sym, false, true), color: colors.text,        bg: colors.cardElevated  },
              { label: 'Savings Rate', value: `${Math.round(monthly.savingsRate)}%`,                                    color: monthly.savingsRate >= 20 ? colors.incomeText : colors.warning, bg: colors.cardElevated },
            ] as const).map((stat) => (
              <View key={stat.label} style={[s.statBox, { backgroundColor: stat.bg }]}>
                <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={[s.statLabel, { color: colors.textTertiary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 3. Week comparison ── */}
        <View style={s.section}>
          <SectionHeader title="Week Comparison" />
          <Card padding={Spacing[5]}>
            {/* Headline */}
            <View style={s.weekHeadline}>
              <View style={s.weekSide}>
                <Text style={[s.weekPeriodLabel, { color: colors.textTertiary }]}>Last week</Text>
                <Text style={[s.weekAmt, { color: colors.textSecondary }]}>
                  {formatCurrency(weekComp.lastWeekTotal, sym, false, true)}
                </Text>
              </View>

              <View style={[s.changePill, {
                backgroundColor: weekComp.isIncrease ? colors.expenseMuted : colors.incomeMuted,
              }]}>
                <Ionicons
                  name={weekComp.isIncrease ? 'trending-up-outline' : 'trending-down-outline'}
                  size={13}
                  color={weekComp.isIncrease ? colors.expenseText : colors.incomeText}
                />
                <Text style={[s.changeText, {
                  color: weekComp.isIncrease ? colors.expenseText : colors.incomeText,
                }]}>
                  {weekComp.changePercent}%
                </Text>
              </View>

              <View style={[s.weekSide, { alignItems: 'flex-end' }]}>
                <Text style={[s.weekPeriodLabel, { color: colors.textTertiary }]}>This week</Text>
                <Text style={[s.weekAmt, { color: weekComp.isIncrease ? colors.expenseText : colors.incomeText }]}>
                  {formatCurrency(weekComp.thisWeekTotal, sym, false, true)}
                </Text>
              </View>
            </View>

            {/* Comparison bars */}
            {(weekComp.lastWeekTotal > 0 || weekComp.thisWeekTotal > 0) && (
              <View style={{ marginTop: Spacing[5], gap: Spacing[4] }}>
                <CompareBar
                  label="Last week" value={weekComp.lastWeekTotal} maxValue={weekMax}
                  color={colors.textTertiary}
                  display={formatCurrency(weekComp.lastWeekTotal, sym, false, true)}
                />
                <CompareBar
                  label="This week" value={weekComp.thisWeekTotal} maxValue={weekMax}
                  color={weekComp.isIncrease ? colors.expense : colors.income}
                  display={formatCurrency(weekComp.thisWeekTotal, sym, false, true)}
                />
              </View>
            )}
          </Card>
        </View>

        {/* ── 4. Category breakdown ── */}
        <View style={s.section}>
          <SectionHeader title="By Category" />

          {/* Toggle */}
          <View style={[s.tabToggle, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
            {(['expense', 'income'] as ChartTab[]).map((tab) => {
              const active = chartTab === tab;
              const ac     = tab === 'expense' ? colors.expenseText : colors.incomeText;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={async () => { await Haptics.selectionAsync(); setChartTab(tab); }}
                  activeOpacity={0.75}
                  style={[s.tabBtn, active && { backgroundColor: tab === 'expense' ? colors.expenseMuted : colors.incomeMuted }]}
                >
                  <Ionicons
                    name={tab === 'expense' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                    size={14}
                    color={active ? ac : colors.textTertiary}
                  />
                  <Text style={[s.tabText, { color: active ? ac : colors.textTertiary }]}>
                    {tab === 'expense' ? 'Expenses' : 'Income'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Card padding={Spacing[5]}>
            {donutData.length === 0 ? (
              <View style={s.chartEmpty}>
                <Ionicons
                  name={chartTab === 'expense' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                  size={28}
                  color={colors.textTertiary}
                />
                <Text style={[s.chartEmptyText, { color: colors.textTertiary }]}>
                  No {chartTab === 'expense' ? 'expense' : 'income'} data yet
                </Text>
              </View>
            ) : (
              <View style={s.donutRow}>
                <DonutChart data={donutData} size={148} strokeWidth={20} centerLabel={`${donutData.length}`} centerSublabel="categories" />
                <View style={s.legend}>
                  {donutData.map((item) => {
                    const pct = Math.round(toPercent(item.value, donutTotal));
                    return (
                      <View key={item.label} style={s.legendRow}>
                        <View style={[s.legendDot, { backgroundColor: item.color }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[s.legendLabel, { color: colors.text }]} numberOfLines={1}>{item.label}</Text>
                          <Text style={[s.legendSub, { color: colors.textTertiary }]}>
                            {formatCurrency(item.value, sym, false, true)} · {pct}%
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </Card>
        </View>

        {/* ── 5. 6-month trend ── */}
        <View style={s.section}>
          <SectionHeader title="6-Month Trend" subtitle="Monthly expense totals" />
          <Card padding={Spacing[5]}>
            {monthlyTrend.every((d) => d.value === 0) ? (
              <View style={s.chartEmpty}>
                <Ionicons name="calendar-outline" size={28} color={colors.textTertiary} />
                <Text style={[s.chartEmptyText, { color: colors.textTertiary }]}>
                  Not enough history yet
                </Text>
              </View>
            ) : (
              <BarChart data={monthlyTrend} height={170} highlightLast={false} />
            )}
          </Card>
        </View>

        {/* ── 6. Top category spotlight ── */}
        {topCat != null && (() => {
          const cat = getCategoryById(topCat.id);
          return (
            <View style={s.section}>
              <SectionHeader title="Top Spend" />
              <View style={[s.spotlight, { backgroundColor: `${cat.color}0F`, borderColor: `${cat.color}28` }]}>
                <View style={[s.spotlightIcon, { backgroundColor: `${cat.color}18` }]}>
                  <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.spotlightName, { color: colors.text }]}>{cat.label}</Text>
                  <Text style={[s.spotlightSub, { color: colors.textSecondary }]}>
                    Highest spending category
                  </Text>
                </View>
                <Text style={[s.spotlightAmt, { color: cat.color }]}>
                  {formatCurrency(topCat.total, sym, false, true)}
                </Text>
              </View>
            </View>
          );
        })()}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1 },
  header:  { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  title:   { fontSize: FontSize['3xl'], fontWeight: '700', letterSpacing: -0.5 },
  scroll:  { paddingHorizontal: Spacing[4] },
  section: { marginBottom: Spacing[6] },

  // Insight cards
  insightCard: {
    width: 220, borderRadius: Radius.xl, borderWidth: 1,
    padding: Spacing[4], gap: Spacing[2],
  },
  insightTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  insightIconBox: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  insightValue:   { fontSize: FontSize.md, fontWeight: '700', fontVariant: ['tabular-nums'] as any },
  insightTitle:   { fontSize: FontSize.sm, fontWeight: '600', lineHeight: FontSize.sm * 1.4 },
  insightDesc:    { fontSize: FontSize.xs, lineHeight: FontSize.xs * 1.6 },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  statBox:   { width: '47%', borderRadius: Radius.lg, padding: Spacing[4] },
  statValue: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4, fontVariant: ['tabular-nums'] as any },
  statLabel: { fontSize: FontSize.xs },

  // Week comparison
  weekHeadline:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekSide:      { flex: 1, gap: 3 },
  weekPeriodLabel:{ fontSize: FontSize.xs },
  weekAmt:       { fontSize: FontSize.lg, fontWeight: '700', letterSpacing: -0.3, fontVariant: ['tabular-nums'] as any },
  changePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[1.5],
    borderRadius: Radius.full,
  },
  changeText: { fontSize: FontSize.sm, fontWeight: '700' },
  barTrack:   { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill:    { height: 5, borderRadius: 3 },

  // Category tab toggle
  tabToggle: {
    flexDirection: 'row', borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing[1], marginBottom: Spacing[3],
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: Spacing[2.5], borderRadius: Radius.md,
  },
  tabText: { fontSize: FontSize.sm, fontWeight: '600' },

  // Donut
  donutRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
  legend:     { flex: 1, gap: Spacing[3] },
  legendRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2] },
  legendDot:  { width: 7, height: 7, borderRadius: 3.5, marginTop: 4 },
  legendLabel:{ fontSize: FontSize.xs, fontWeight: '500' },
  legendSub:  { fontSize: 10, marginTop: 1 },

  // Empty chart
  chartEmpty:     { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing[8], gap: Spacing[2] },
  chartEmptyText: { fontSize: FontSize.sm },

  // Top category spotlight
  spotlight:     { flexDirection: 'row', alignItems: 'center', gap: Spacing[4], borderRadius: Radius.xl, borderWidth: 1, padding: Spacing[5] },
  spotlightIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  spotlightName: { fontSize: FontSize.lg, fontWeight: '600', marginBottom: 3 },
  spotlightSub:  { fontSize: FontSize.xs },
  spotlightAmt:  { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.4, fontVariant: ['tabular-nums'] as any },
});
