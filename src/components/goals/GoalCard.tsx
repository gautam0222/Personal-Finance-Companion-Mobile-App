import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RingProgress } from '../charts/RingProgress';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { useGoalStore } from '../../store/useGoalStore';
import { Goal } from '../../types';
import { formatCurrency, formatDate, toPercent } from '../../utils/formatters';
import { Card } from '../common/Card';
import { Spacing, Radius } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';
import { parseISO, isPast } from 'date-fns';

interface Props {
  goal: Goal;
  onContribute?: (goal: Goal) => void;
}

export const GoalCard: React.FC<Props> = ({ goal, onContribute }) => {
  const { colors } = useTheme();
  const settings = useAppStore((s) => s.settings);
  const { deleteGoal } = useGoalStore();
  const sym = settings.currencySymbol;

  const progress = toPercent(goal.currentAmount, goal.targetAmount);
  const isOverdue = !goal.isCompleted && isPast(parseISO(goal.deadline));
  const remaining = goal.targetAmount - goal.currentAmount;

  const statusColor =
    goal.isCompleted ? colors.income
    : isOverdue       ? colors.expense
    : goal.color;

  const handleDelete = () => {
    Alert.alert('Delete Goal', `Remove "${goal.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await deleteGoal(goal.id);
        },
      },
    ]);
  };

  return (
    <Card style={styles.card} padding={Spacing[5]}>
      <View style={styles.header}>
        {/* Icon + Info */}
        <View style={[styles.iconWrap, { backgroundColor: `${goal.color}20` }]}>
          <Text style={styles.icon}>{goal.icon}</Text>
        </View>

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {goal.title}
          </Text>
          <Text style={[styles.deadline, { color: isOverdue ? colors.expense : colors.textTertiary }]}>
            {goal.isCompleted ? '🎉 Completed!' : isOverdue ? 'Overdue' : `Due ${formatDate(goal.deadline, 'dd MMM yyyy')}`}
          </Text>
        </View>

        {/* Ring */}
        <RingProgress
          progress={progress}
          size={52}
          strokeWidth={6}
          colors={[goal.color, goal.color]}
          animated={false}
        >
          <Text style={{ fontSize: 9, color: colors.textSecondary, fontWeight: '600' }}>
            {Math.round(progress)}%
          </Text>
        </RingProgress>
      </View>

      {/* Amount progress */}
      <View style={styles.amountRow}>
        <View>
          <Text style={[styles.current, { color: statusColor }]}>
            {formatCurrency(goal.currentAmount, sym)}
          </Text>
          <Text style={[styles.target, { color: colors.textTertiary }]}>
            of {formatCurrency(goal.targetAmount, sym)}
          </Text>
        </View>
        {!goal.isCompleted && (
          <Text style={[styles.remaining, { color: colors.textSecondary }]}>
            {formatCurrency(remaining, sym)} to go
          </Text>
        )}
      </View>

      {/* Bar */}
      <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(100, progress)}%`,
              backgroundColor: statusColor,
            },
          ]}
        />
      </View>

      {/* Actions */}
      {!goal.isCompleted && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onContribute?.(goal)}
            activeOpacity={0.8}
            style={[styles.contributeBtn, { backgroundColor: `${goal.color}18`, borderColor: `${goal.color}40` }]}
          >
            <Ionicons name="add" size={16} color={goal.color} />
            <Text style={[styles.contributeBtnText, { color: goal.color }]}>
              Add funds
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: Spacing[3] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  title: { fontSize: FontSize.md, fontWeight: '600', marginBottom: 2 },
  deadline: { fontSize: FontSize.xs },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  current: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.5 },
  target: { fontSize: FontSize.xs, marginTop: 2 },
  remaining: { fontSize: FontSize.sm },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: Spacing[4] },
  barFill: { height: 6, borderRadius: 3 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  contributeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1.5],
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing[2.5],
  },
  contributeBtnText: { fontSize: FontSize.sm, fontWeight: '600' },
  deleteBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});