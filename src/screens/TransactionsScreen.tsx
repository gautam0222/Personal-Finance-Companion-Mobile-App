import React, { useMemo, useState } from 'react';
import {
  View, Text, SectionList, StyleSheet,
  TouchableOpacity, TextInput, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme }            from '../hooks/useTheme';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAppStore }         from '../store/useAppStore';
import { useRecurringStore }   from '../store/useRecurringStore';
import { TransactionItem }     from '../components/transactions/TransactionItem';
import { FilterBar }           from '../components/transactions/FilterBar';
import { EmptyState }          from '../components/common/EmptyState';

import { groupTransactionsByDate, calcBalanceStats } from '../utils/calculations';
import { formatCurrency, formatTransactionGroupDate } from '../utils/formatters';
import { Spacing, Radius } from '../constants/spacing';
import { FontSize }         from '../constants/typography';
import type { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const TransactionsScreen: React.FC = () => {
  const { colors, isDark }                                        = useTheme();
  const navigation                                                = useNavigation<NavProp>();
  const { transactions, getFiltered, filter, setFilter, resetFilter } = useTransactionStore();
  const settings                                                  = useAppStore((s) => s.settings);
  const { rules, lastAutoCreatedCount, clearAutoCreatedCount }    = useRecurringStore();
  const [searchFocused, setSearchFocused]                         = useState(false);
  const sym = settings.currencySymbol;

  const filtered = getFiltered();
  const groups   = useMemo(() => groupTransactionsByDate(filtered), [filtered]);
  const stats    = useMemo(() => calcBalanceStats(filtered),        [filtered]);

  const hasActiveFilter =
    filter.type !== 'all'      ||
    filter.dateRange !== 'all' ||
    filter.category !== null   ||
    filter.searchQuery.trim() !== '';

  const sections = groups.map((g) => ({
    date:     g.date,
    data:     g.transactions,
    dayTotal: g.dayTotal,
  }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
          <View style={{ flexDirection: 'row', gap: Spacing[2] }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Recurring')}
              activeOpacity={0.8}
              style={[styles.addBtn, { backgroundColor: colors.cardElevated, borderWidth: 1, borderColor: colors.border }]}
            >
              <Ionicons name="repeat-outline" size={20} color={colors.textSecondary} />
              {rules.length > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: colors.primary, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.background }}>
                  <Text style={{ fontSize: 9, color: '#FFF', fontWeight: 'bold' }}>{rules.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddTransaction')}
              activeOpacity={0.8}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner */}
        {lastAutoCreatedCount > 0 && (
          <View style={{ marginHorizontal: Spacing[4], marginBottom: Spacing[3], backgroundColor: colors.primaryMuted, padding: Spacing[3], borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.primaryLight} />
              <Text style={{ color: colors.primaryLight, fontSize: FontSize.sm }}>{lastAutoCreatedCount} recurring transaction{lastAutoCreatedCount !== 1 ? 's' : ''} auto-added.</Text>
            </View>
            <TouchableOpacity onPress={clearAutoCreatedCount} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={16} color={colors.primaryLight} />
            </TouchableOpacity>
          </View>
        )}

        {/* Summary strip — only when there is data */}
        {transactions.length > 0 && (
          <View style={[styles.strip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {([
              { label: 'Income',   value: stats.totalIncome,   color: colors.incomeText  },
              { label: 'Expenses', value: stats.totalExpense,  color: colors.expenseText },
              { label: 'Net',      value: stats.totalBalance,  color: stats.totalBalance >= 0 ? colors.incomeText : colors.expenseText, signed: true },
            ] as const).map((item, i, arr) => (
              <React.Fragment key={item.label}>
                <View style={styles.stripItem}>
                  <Text style={[styles.stripLabel, { color: colors.textTertiary }]}>{item.label}</Text>
                  <Text style={[styles.stripValue, { color: item.color }]}>
                    {formatCurrency(item.value, sym, (item as any).signed, true)}
                  </Text>
                </View>
                {i < arr.length - 1 && (
                  <View style={[styles.stripSep, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Search */}
        <View style={[
          styles.searchBar,
          { backgroundColor: colors.cardElevated, borderColor: searchFocused ? colors.primary : colors.border },
        ]}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput
            value={filter.searchQuery}
            onChangeText={(t) => setFilter({ searchQuery: t })}
            placeholder="Search transactions…"
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
          />
          {filter.searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setFilter({ searchQuery: '' })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* Filter chips */}
      <View style={{ paddingBottom: Spacing[2] }}>
        <FilterBar />
        {hasActiveFilter && (
          <TouchableOpacity onPress={resetFilter} activeOpacity={0.7} style={styles.clearRow}>
            <Ionicons name="options-outline" size={12} color={colors.primary} />
            <Text style={{ fontSize: FontSize.xs, color: colors.primary, fontWeight: '500' }}>
              Clear filters
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {transactions.length === 0 ? (
        <EmptyState
          icon="card-outline"
          title="No transactions yet"
          description="Record your first income or expense to get started"
          actionLabel="Add transaction"
          onAction={() => navigation.navigate('AddTransaction')}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No results"
          description="Try adjusting your search or active filters"
          actionLabel="Clear filters"
          onAction={resetFilter}
          compact
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.groupHeader}>
              <Text style={[styles.groupDate, { color: colors.textSecondary }]}>
                {formatTransactionGroupDate(section.date)}
              </Text>
              <Text style={[
                styles.groupTotal,
                { color: section.dayTotal >= 0 ? colors.incomeText : colors.expenseText },
              ]}>
                {formatCurrency(section.dayTotal, sym, true, true)}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={() => navigation.navigate('AddTransaction', { transactionId: item.id })}
            />
          )}
          ListFooterComponent={<View style={{ height: 120 }} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
  },
  title:  { fontSize: FontSize['3xl'], fontWeight: '700', letterSpacing: -0.5 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  strip: {
    flexDirection: 'row',
    marginHorizontal: Spacing[4], marginBottom: Spacing[3],
    borderRadius: Radius.xl, borderWidth: 1,
    paddingVertical: Spacing[3], paddingHorizontal: Spacing[4],
  },
  stripItem:  { flex: 1, alignItems: 'center' },
  stripLabel: { fontSize: 10, marginBottom: 3, fontWeight: '500', letterSpacing: 0.3 },
  stripValue: { fontSize: FontSize.sm, fontWeight: '700', fontVariant: ['tabular-nums'] as any },
  stripSep:   { width: 1, marginHorizontal: Spacing[2] },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing[4], marginBottom: Spacing[3],
    borderRadius: Radius.xl, borderWidth: 1,
    paddingHorizontal: Spacing[4], height: 44,
    gap: Spacing[2],
  },
  searchInput: { flex: 1, fontSize: FontSize.md, padding: 0 },

  clearRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing[4], paddingBottom: Spacing[2],
  },

  list: { paddingHorizontal: Spacing[4] },
  groupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing[2], marginTop: Spacing[4],
  },
  groupDate:  { fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.2, textTransform: 'uppercase' },
  groupTotal: { fontSize: FontSize.sm, fontWeight: '700', fontVariant: ['tabular-nums'] as any },
});