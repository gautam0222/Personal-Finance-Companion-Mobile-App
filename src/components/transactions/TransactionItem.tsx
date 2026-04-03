import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, PanResponder, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { Transaction } from '../../types';
import { getCategoryById } from '../../constants/categories';
import { formatCurrency, formatDateShort } from '../../utils/formatters';
import { Radius, Spacing } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

const SWIPE_THRESHOLD = -72;

interface Props {
  transaction: Transaction;
  onPress?:    () => void;
  showDate?:   boolean;
}

export const TransactionItem: React.FC<Props> = ({
  transaction, onPress, showDate = false,
}) => {
  const { colors }          = useTheme();
  const settings            = useAppStore((s) => s.settings);
  const deleteTransaction   = useTransactionStore((s) => s.deleteTransaction);
  const translateX          = useRef(new Animated.Value(0)).current;
  const deleteOpacity       = useRef(new Animated.Value(0)).current;

  const cat      = getCategoryById(transaction.category);
  const isIncome = transaction.type === 'income';
  const sym      = settings.currencySymbol;

  const resetSwipe = () => {
    Animated.parallel([
      Animated.spring(translateX,    { toValue: 0,    useNativeDriver: true, bounciness: 6 }),
      Animated.timing(deleteOpacity, { toValue: 0,    duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * 1.5,
      onPanResponderMove: (_, { dx }) => {
        const clamped = Math.min(0, Math.max(-110, dx));
        translateX.setValue(clamped);
        deleteOpacity.setValue(Math.min(1, Math.abs(clamped) / 80));
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx < SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -80, useNativeDriver: true, bounciness: 0,
          }).start();
        } else {
          resetSwipe();
        }
      },
    }),
  ).current;

  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel', onPress: resetSwipe },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.timing(translateX, {
            toValue: -420, duration: 260, useNativeDriver: true,
          }).start(() => deleteTransaction(transaction.id));
        },
      },
    ]);
  };

  return (
    <View style={styles.wrapper}>
      {/* Delete zone */}
      <Animated.View style={[styles.deleteZone, { opacity: deleteOpacity }]}>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteAction}>
          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Row */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.row, { backgroundColor: colors.card, transform: [{ translateX }] }]}
      >
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.inner}>
          {/* Category icon */}
          <View style={[styles.iconBox, { backgroundColor: `${cat.color}18` }]}>
            <Ionicons
              name={cat.icon as any}
              size={18}
              color={cat.color}
            />
          </View>

          {/* Details */}
          <View style={styles.details}>
            <Text style={[styles.note, { color: colors.text }]} numberOfLines={1}>
              {transaction.note || cat.label}
            </Text>
            <View style={styles.meta}>
              <Text style={[styles.catLabel, { color: cat.color }]}>
                {cat.label}
              </Text>
              {showDate && (
                <>
                  <View style={[styles.metaDot, { backgroundColor: colors.textTertiary }]} />
                  <Text style={[styles.dateLabel, { color: colors.textTertiary }]}>
                    {formatDateShort(transaction.date)}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Amount */}
          <Text style={[
            styles.amount,
            { color: isIncome ? colors.incomeText : colors.expenseText },
          ]}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, sym)}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position:     'relative',
    overflow:     'hidden',
    borderRadius: Radius.xl,
    marginBottom: Spacing[2],
  },
  deleteZone: {
    position:       'absolute',
    right:          0, top: 0, bottom: 0,
    width:          80,
    backgroundColor:'#E11D48',
    borderRadius:   Radius.xl,
    alignItems:     'center',
    justifyContent: 'center',
  },
  deleteAction: {
    width:          80,
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  row:   { borderRadius: Radius.xl },
  inner: {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       Spacing[4],
    gap:           Spacing[3],
  },
  iconBox: {
    width:          42,
    height:         42,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  details:  { flex: 1 },
  note: {
    fontSize:     FontSize.md,
    fontWeight:   '500',
    marginBottom: 3,
    letterSpacing: -0.1,
  },
  meta: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing[1.5],
  },
  catLabel: {
    fontSize:   FontSize.xs,
    fontWeight: '500',
  },
  metaDot: {
    width: 3, height: 3, borderRadius: 1.5,
  },
  dateLabel: { fontSize: FontSize.xs },
  amount: {
    fontSize:    FontSize.md,
    fontWeight:  '700',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'] as any,
  },
});
