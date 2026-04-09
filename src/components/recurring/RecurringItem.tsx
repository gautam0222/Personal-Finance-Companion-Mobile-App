import React, { useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, PanResponder, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../utils/haptics';

import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { useRecurringStore } from '../../store/useRecurringStore';
import { RecurringTransaction } from '../../types';
import { getCategoryById } from '../../constants/categories';
import { formatCurrency } from '../../utils/formatters';
import { FREQUENCY_SHORT, describeNextDue } from '../../utils/recurring';
import { Spacing, Radius } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';
import { format } from 'date-fns';

const SWIPE_THRESHOLD = -72;

interface Props {
    rule: RecurringTransaction;
    onPress: () => void;
}

export const RecurringItem: React.FC<Props> = ({ rule, onPress }) => {
    const { colors } = useTheme();
    const settings = useAppStore((s) => s.settings);
    const { deleteRule, toggleActive } = useRecurringStore();

    const translateX = useRef(new Animated.Value(0)).current;
    const deleteOpacity = useRef(new Animated.Value(0)).current;

    const cat = getCategoryById(rule.category);
    const isIncome = rule.type === 'income';
    const sym = settings.currencySymbol;
    const today = format(new Date(), 'yyyy-MM-dd');

    const isOverdue = rule.isActive && rule.nextDueDate < today;
    const isDueToday = rule.isActive && rule.nextDueDate === today;

    const resetSwipe = () => {
        Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
            Animated.timing(deleteOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
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
                    Animated.spring(translateX, { toValue: -80, useNativeDriver: true, bounciness: 0 }).start();
                } else {
                    resetSwipe();
                }
            },
        }),
    ).current;

    const handleDelete = () => {
        Alert.alert(
            'Delete Recurring Rule',
            `Remove "${rule.note || cat.label}"? Past transactions created by this rule will not be affected.`,
            [
                { text: 'Cancel', style: 'cancel', onPress: resetSwipe },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Animated.timing(translateX, { toValue: -420, duration: 260, useNativeDriver: true })
                            .start(() => deleteRule(rule.id));
                    },
                },
            ],
        );
    };

    const handleToggle = async () => {
        await Haptics.selectionAsync();
        await toggleActive(rule.id);
    };

    return (
        <View style={styles.wrapper}>
            {/* Delete zone */}
            <Animated.View style={[styles.deleteZone, { opacity: deleteOpacity }]}>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteAction}>
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            </Animated.View>

            <Animated.View
                {...panResponder.panHandlers}
                style={[styles.row, { backgroundColor: colors.card, transform: [{ translateX }] }]}
            >
                <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.inner}>
                    {/* Category icon */}
                    <View style={[styles.iconBox, {
                        backgroundColor: rule.isActive ? `${cat.color}18` : colors.cardElevated,
                        opacity: rule.isActive ? 1 : 0.6,
                    }]}>
                        <Ionicons
                            name={cat.icon as any}
                            size={18}
                            color={rule.isActive ? cat.color : colors.textTertiary}
                        />
                    </View>

                    {/* Details */}
                    <View style={styles.details}>
                        <View style={styles.topRow}>
                            <Text
                                style={[styles.note, { color: rule.isActive ? colors.text : colors.textTertiary }]}
                                numberOfLines={1}
                            >
                                {rule.note || cat.label}
                            </Text>
                            {/* Frequency pill */}
                            <View style={[styles.freqPill, { backgroundColor: `${colors.primary}14` }]}>
                                <Text style={[styles.freqText, { color: colors.primaryLight }]}>
                                    {FREQUENCY_SHORT[rule.frequency]}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.metaRow}>
                            {/* Category */}
                            <Text style={[styles.catLabel, { color: cat.color, opacity: rule.isActive ? 1 : 0.5 }]}>
                                {cat.label}
                            </Text>

                            <View style={[styles.metaDot, { backgroundColor: colors.textTertiary }]} />

                            {/* Next due */}
                            <Text style={[
                                styles.dueLabel,
                                {
                                    color: !rule.isActive ? colors.textTertiary
                                        : isOverdue ? colors.expenseText
                                            : isDueToday ? colors.warning
                                                : colors.textTertiary,
                                },
                            ]}>
                                {rule.isActive ? describeNextDue(rule.nextDueDate, today) : 'Paused'}
                            </Text>
                        </View>
                    </View>

                    {/* Right side: amount + toggle */}
                    <View style={styles.right}>
                        <Text style={[
                            styles.amount,
                            {
                                color: rule.isActive
                                    ? (isIncome ? colors.incomeText : colors.expenseText)
                                    : colors.textTertiary,
                            },
                        ]}>
                            {isIncome ? '+' : '-'}{formatCurrency(rule.amount, sym, false, true)}
                        </Text>
                        <Switch
                            value={rule.isActive}
                            onValueChange={handleToggle}
                            trackColor={{ false: colors.border, true: `${colors.primary}99` }}
                            thumbColor={rule.isActive ? colors.primary : colors.textTertiary}
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative', overflow: 'hidden',
        borderRadius: Radius.xl, marginBottom: Spacing[2],
    },
    deleteZone: {
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
        backgroundColor: '#E11D48', borderRadius: Radius.xl,
        alignItems: 'center', justifyContent: 'center',
    },
    deleteAction: { width: 80, flex: 1, alignItems: 'center', justifyContent: 'center' },
    row: { borderRadius: Radius.xl },
    inner: { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], gap: Spacing[3] },
    iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    details: { flex: 1, minWidth: 0 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: 4 },
    note: { flex: 1, fontSize: FontSize.md, fontWeight: '500', letterSpacing: -0.1 },
    freqPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full },
    freqText: { fontSize: 10, fontWeight: '600' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1.5] },
    catLabel: { fontSize: FontSize.xs, fontWeight: '500' },
    metaDot: { width: 3, height: 3, borderRadius: 1.5 },
    dueLabel: { fontSize: FontSize.xs },
    right: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
    amount: { fontSize: FontSize.md, fontWeight: '700', letterSpacing: -0.4, fontVariant: ['tabular-nums'] as any },
});
