import React, { useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { useTransactionStore } from '../store/useTransactionStore';

import { BalanceCard }    from '../components/home/BalanceCard';
import { KarmaRing }      from '../components/home/KarmaRing';
import { QuickStats }     from '../components/home/QuickStats';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { BarChart }       from '../components/charts/BarChart';
import { SectionHeader }  from '../components/common/SectionHeader';
import { EmptyState }     from '../components/common/EmptyState';
import { Card }           from '../components/common/Card';

import { getWeeklyBarData } from '../utils/calculations';
import { Spacing } from '../constants/spacing';
import { FontSize } from '../constants/typography';
import type { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// Staggered fade-in for sections
function useFadeIn(delay = 0) {
  const anim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  React.useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(anim,       { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return { opacity: anim, transform: [{ translateY }] };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const HomeScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation         = useNavigation<NavProp>();
  const settings           = useAppStore((s) => s.settings);
  const transactions       = useTransactionStore((s) => s.transactions);
  const [refreshing, setRefreshing] = React.useState(false);

  const recent = transactions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const weeklyData = getWeeklyBarData(transactions);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  }, []);

  const anim0 = useFadeIn(0);
  const anim1 = useFadeIn(80);
  const anim2 = useFadeIn(160);
  const anim3 = useFadeIn(220);
  const anim4 = useFadeIn(280);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetSub, { color: colors.textTertiary }]}>
              {greeting()},
            </Text>
            <Text style={[styles.greetName, { color: colors.text }]}>
              {settings.userName || 'Welcome'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddTransaction')}
            activeOpacity={0.82}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Balance card */}
        <Animated.View style={[styles.section, anim0]}>
          <BalanceCard />
        </Animated.View>

        {/* Karma */}
        <Animated.View style={[styles.section, anim1]}>
          <SectionHeader title="Karma Score" subtitle="Your financial health" />
          <KarmaRing />
        </Animated.View>

        {/* This month */}
        <Animated.View style={[styles.section, anim2]}>
          <SectionHeader title="This Month" />
          <QuickStats />
        </Animated.View>

        {/* Weekly chart */}
        <Animated.View style={[styles.section, anim3]}>
          <SectionHeader title="This Week" subtitle="Daily spending" />
          <Card>
            {weeklyData.every((d) => d.value === 0) ? (
              <View style={styles.chartEmpty}>
                <Ionicons name="bar-chart-outline" size={28} color={colors.textTertiary} />
                <Text style={[styles.chartEmptyText, { color: colors.textTertiary }]}>
                  No spending this week
                </Text>
              </View>
            ) : (
              <BarChart data={weeklyData} height={150} highlightLast />
            )}
          </Card>
        </Animated.View>

        {/* Recent transactions */}
        <Animated.View style={[styles.section, anim4]}>
          <SectionHeader
            title="Recent"
            actionLabel={transactions.length > 5 ? 'See all' : undefined}
            onAction={() => (navigation as any).navigate('Transactions')}
          />
          {recent.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No transactions yet"
              description="Tap + to record your first income or expense"
              actionLabel="Add Transaction"
              onAction={() => navigation.navigate('AddTransaction')}
              compact
            />
          ) : (
            recent.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                showDate
                onPress={() => navigation.navigate('AddTransaction', { transactionId: t.id })}
              />
            ))
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical:   Spacing[4],
  },
  greetSub:  { fontSize: FontSize.sm, letterSpacing: 0.2 },
  greetName: { fontSize: FontSize['2xl'], fontWeight: '700', letterSpacing: -0.6, marginTop: 2 },
  addBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll:  { paddingHorizontal: Spacing[4] },
  section: { marginBottom: Spacing[6] },
  chartEmpty: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing[8], gap: Spacing[2],
  },
  chartEmptyText: { fontSize: FontSize.sm },
});
