import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { NetWorthEntry } from '../../types';
import { getSubtypeMeta } from '../../utils/networth';
import { formatCurrency } from '../../utils/formatters';
import { Radius, Spacing } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

interface Props {
  entry: NetWorthEntry;
  onPress?: () => void;
}

export const NetWorthEntryItem: React.FC<Props> = ({ entry, onPress }) => {
  const { colors } = useTheme();
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);
  const meta = getSubtypeMeta(entry.subtype);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.iconBox, { backgroundColor: `${meta.color}16` }]}>
        <Ionicons name={meta.icon as any} size={16} color={meta.color} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {entry.name}
        </Text>
        <Text style={[styles.meta, { color: colors.textTertiary }]} numberOfLines={1}>
          {entry.institution || meta.label}
        </Text>
      </View>

      <View style={styles.amountWrap}>
        <Text
          style={[
            styles.amount,
            { color: entry.kind === 'asset' ? colors.incomeText : colors.expenseText },
          ]}
        >
          {formatCurrency(entry.value, currencySymbol, false, true)}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    marginBottom: Spacing[2],
    gap: Spacing[3],
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  meta: {
    fontSize: FontSize.xs,
  },
  amountWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    fontVariant: ['tabular-nums'] as any,
  },
});
