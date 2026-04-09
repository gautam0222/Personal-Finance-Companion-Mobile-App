import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import * as Haptics from '../../utils/haptics';
import { useTheme } from '../../hooks/useTheme';
import { useTransactionStore } from '../../store/useTransactionStore';
import { TransactionFilter, DateRangeFilter } from '../../types';
import { Radius, Spacing } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

const TYPE_FILTERS: { label: string; value: TransactionFilter }[] = [
  { label: 'All',      value: 'all' },
  { label: 'Income',   value: 'income' },
  { label: 'Expense',  value: 'expense' },
];

const DATE_FILTERS: { label: string; value: DateRangeFilter }[] = [
  { label: 'All time', value: 'all' },
  { label: 'This week',  value: 'week' },
  { label: 'This month', value: 'month' },
  { label: '3 months',   value: '3months' },
];

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  activeColor?: string;
}

const Chip: React.FC<ChipProps> = ({ label, active, onPress, activeColor }) => {
  const { colors } = useTheme();
  const c = activeColor ?? colors.primary;

  return (
    <TouchableOpacity
      onPress={async () => {
        await Haptics.selectionAsync();
        onPress();
      }}
      activeOpacity={0.75}
      style={{
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[2],
        borderRadius: Radius.full,
        backgroundColor: active ? `${c}22` : colors.cardElevated,
        borderWidth: 1,
        borderColor: active ? `${c}66` : colors.border,
      }}
    >
      <Text
        style={{
          fontSize: FontSize.sm,
          fontWeight: active ? '600' : '400',
          color: active ? c : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const FilterBar: React.FC = () => {
  const { colors } = useTheme();
  const { filter, setFilter } = useTransactionStore();

  return (
    <View style={{ gap: Spacing[2] }}>
      {/* Type row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: Spacing[2], paddingHorizontal: Spacing[4] }}
      >
        {TYPE_FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            active={filter.type === f.value}
            onPress={() => setFilter({ type: f.value })}
            activeColor={
              f.value === 'income' ? colors.income
              : f.value === 'expense' ? colors.expense
              : colors.primary
            }
          />
        ))}

        <View style={{ width: 1, backgroundColor: colors.border, marginHorizontal: Spacing[1] }} />

        {DATE_FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            active={filter.dateRange === f.value}
            onPress={() => setFilter({ dateRange: f.value })}
          />
        ))}
      </ScrollView>
    </View>
  );
};
