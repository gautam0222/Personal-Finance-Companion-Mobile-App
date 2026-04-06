import React, { useState, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    Modal, KeyboardAvoidingView, Platform, TextInput,
    Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { format, addMonths, addWeeks, addYears } from 'date-fns';

import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { useRecurringStore } from '../store/useRecurringStore';
import { CategoryPicker } from '../components/transactions/CategoryPicker';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { RecurringItem } from '../components/recurring/RecurringItem';

import { RecurringTransaction, RecurrenceFrequency } from '../types';
import { FREQUENCY_LABELS, FREQUENCY_SHORT } from '../utils/recurring';
import { formatCurrency } from '../utils/formatters';
import { Spacing, Radius } from '../constants/spacing';
import { FontSize } from '../constants/typography';

const FREQUENCIES: RecurrenceFrequency[] = [
    'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly',
];

// ── Default start date quick picks ───────────────────────────────────────────
function getStartDateOptions() {
    const today = new Date();
    return [
        { label: 'Today', value: format(today, 'yyyy-MM-dd') },
        { label: 'Next week', value: format(addWeeks(today, 1), 'yyyy-MM-dd') },
        { label: 'Next month', value: format(addMonths(today, 1), 'yyyy-MM-dd') },
    ];
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
interface ModalProps {
    visible: boolean;
    editRule?: RecurringTransaction | null;
    onClose: () => void;
}

const AddEditModal: React.FC<ModalProps> = ({ visible, editRule, onClose }) => {
    const { colors } = useTheme();
    const settings = useAppStore((s) => s.settings);
    const { addRule, updateRule } = useRecurringStore();
    const sym = settings.currencySymbol;
    const isEdit = !!editRule;

    const [type, setType] = useState<'income' | 'expense'>(editRule?.type ?? 'expense');
    const [amount, setAmount] = useState(editRule ? String(editRule.amount) : '');
    const [category, setCategory] = useState(editRule?.category ?? 'food');
    const [frequency, setFrequency] = useState<RecurrenceFrequency>(editRule?.frequency ?? 'monthly');
    const [startDate, setStartDate] = useState(editRule?.startDate ?? format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(editRule?.endDate ?? '');
    const [note, setNote] = useState(editRule?.note ?? '');
    const [hasEndDate, setHasEndDate] = useState(!!editRule?.endDate);
    const [saving, setSaving] = useState(false);
    const [amtError, setAmtError] = useState('');

    const startOpts = getStartDateOptions();

    const resetAndClose = () => {
        setType('expense'); setAmount(''); setCategory('food');
        setFrequency('monthly'); setStartDate(format(new Date(), 'yyyy-MM-dd'));
        setEndDate(''); setNote(''); setHasEndDate(false);
        setAmtError('');
        onClose();
    };

    const handleSave = async () => {
        const parsed = parseFloat(amount);
        if (!amount || isNaN(parsed) || parsed <= 0) {
            setAmtError('Enter a valid amount');
            return;
        }
        setSaving(true);
        try {
            const data = {
                type, amount: parsed, category, frequency,
                startDate, note,
                endDate: hasEndDate && endDate ? endDate : undefined,
                isActive: true,
            };
            if (isEdit && editRule) {
                await updateRule(editRule.id, {
                    ...data,
                    // Don't reset nextDueDate on edit if rule is already active
                    nextDueDate: editRule.nextDueDate,
                });
            } else {
                await addRule({ ...data });
            }
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            resetAndClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={resetAndClose}
        >
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={[styles.modal, { backgroundColor: colors.background }]}>

                    {/* Header */}
                    <View style={[styles.modalNav, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={resetAndClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                            <Ionicons name="close" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {isEdit ? 'Edit Recurring' : 'New Recurring'}
                        </Text>
                        <View style={{ width: 22 }} />
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.modalBody}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Income / Expense toggle */}
                        <View style={[styles.typeToggle, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
                            {(['expense', 'income'] as const).map((t) => {
                                const active = type === t;
                                const c = t === 'income' ? colors.incomeText : colors.expenseText;
                                return (
                                    <TouchableOpacity
                                        key={t}
                                        onPress={async () => { await Haptics.selectionAsync(); setType(t); setCategory(t === 'income' ? 'salary' : 'food'); }}
                                        activeOpacity={0.8}
                                        style={[styles.typeBtn, active && { backgroundColor: `${c}14`, borderColor: `${c}40`, borderWidth: 1 }]}
                                    >
                                        <Ionicons
                                            name={t === 'income' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
                                            size={15}
                                            color={active ? c : colors.textTertiary}
                                        />
                                        <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: active ? c : colors.textTertiary, textTransform: 'capitalize' }}>
                                            {t}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Amount */}
                        <View style={[styles.amountBox, { backgroundColor: colors.cardElevated, borderColor: amtError ? colors.expense : colors.border }]}>
                            <Text style={{ fontSize: FontSize.xl, color: colors.textSecondary, fontWeight: '600' }}>{sym}</Text>
                            <TextInput
                                value={amount}
                                onChangeText={(t) => { setAmount(t); setAmtError(''); }}
                                placeholder="0"
                                placeholderTextColor={colors.textTertiary}
                                keyboardType="numeric"
                                style={{ flex: 1, fontSize: FontSize['4xl'], fontWeight: '700', color: colors.text, padding: 0, letterSpacing: -1 }}
                                autoFocus={!isEdit}
                            />
                        </View>
                        {amtError ? <Text style={[styles.errText, { color: colors.expenseText }]}>{amtError}</Text> : null}

                        {/* Category */}
                        <View style={styles.field}>
                            <CategoryPicker type={type} selected={category} onSelect={setCategory} />
                        </View>

                        {/* Frequency */}
                        <View style={styles.field}>
                            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Repeats</Text>
                            <View style={styles.freqGrid}>
                                {FREQUENCIES.map((f) => {
                                    const active = frequency === f;
                                    return (
                                        <TouchableOpacity
                                            key={f}
                                            onPress={async () => { await Haptics.selectionAsync(); setFrequency(f); }}
                                            activeOpacity={0.8}
                                            style={[
                                                styles.freqChip,
                                                {
                                                    backgroundColor: active ? colors.primaryMuted : colors.cardElevated,
                                                    borderColor: active ? colors.primaryMutedBorder : colors.border,
                                                    borderWidth: active ? 1.5 : 1,
                                                },
                                            ]}
                                        >
                                            <Text style={{ fontSize: FontSize.xs, fontWeight: active ? '600' : '400', color: active ? colors.primaryLight : colors.textSecondary }}>
                                                {FREQUENCY_SHORT[f]}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Start date */}
                        <View style={styles.field}>
                            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Start date</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing[2] }}>
                                {startOpts.map((opt) => {
                                    const active = startDate === opt.value;
                                    return (
                                        <TouchableOpacity
                                            key={opt.value}
                                            onPress={async () => { await Haptics.selectionAsync(); setStartDate(opt.value); }}
                                            style={[styles.dateChip, {
                                                backgroundColor: active ? colors.primaryMuted : colors.cardElevated,
                                                borderColor: active ? colors.primaryMutedBorder : colors.border,
                                                borderWidth: active ? 1.5 : 1,
                                            }]}
                                        >
                                            <Text style={{ fontSize: FontSize.sm, fontWeight: active ? '600' : '400', color: active ? colors.primaryLight : colors.textSecondary }}>
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                                {/* Custom date input */}
                                <View style={[styles.dateChip, { backgroundColor: colors.cardElevated, borderColor: colors.border, borderWidth: 1, minWidth: 120 }]}>
                                    <TextInput
                                        value={!startOpts.find(o => o.value === startDate) ? startDate : ''}
                                        onChangeText={setStartDate}
                                        placeholder="yyyy-mm-dd"
                                        placeholderTextColor={colors.textTertiary}
                                        style={{ fontSize: FontSize.sm, color: colors.text, padding: 0 }}
                                    />
                                </View>
                            </ScrollView>
                        </View>

                        {/* End date toggle */}
                        <View style={styles.field}>
                            <TouchableOpacity
                                onPress={async () => { await Haptics.selectionAsync(); setHasEndDate(!hasEndDate); }}
                                activeOpacity={0.75}
                                style={styles.endDateToggle}
                            >
                                <View style={[styles.checkbox, {
                                    backgroundColor: hasEndDate ? colors.primaryMuted : 'transparent',
                                    borderColor: hasEndDate ? colors.primary : colors.border,
                                }]}>
                                    {hasEndDate && <Ionicons name="checkmark" size={13} color={colors.primaryLight} />}
                                </View>
                                <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                                    Set an end date (optional)
                                </Text>
                            </TouchableOpacity>
                            {hasEndDate && (
                                <View style={[styles.amountBox, { backgroundColor: colors.cardElevated, borderColor: colors.border, height: 48, marginTop: Spacing[2] }]}>
                                    <TextInput
                                        value={endDate}
                                        onChangeText={setEndDate}
                                        placeholder={`e.g. ${format(addYears(new Date(), 1), 'yyyy-MM-dd')}`}
                                        placeholderTextColor={colors.textTertiary}
                                        style={{ flex: 1, fontSize: FontSize.md, color: colors.text, padding: 0 }}
                                    />
                                </View>
                            )}
                        </View>

                        {/* Note */}
                        <View style={styles.field}>
                            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Label</Text>
                            <View style={[styles.noteBox, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
                                <TextInput
                                    value={note}
                                    onChangeText={setNote}
                                    placeholder={type === 'income' ? 'e.g. Monthly salary' : 'e.g. Rent, Netflix, SIP'}
                                    placeholderTextColor={colors.textTertiary}
                                    style={{ fontSize: FontSize.md, color: colors.text, padding: 0 }}
                                    returnKeyType="done"
                                    maxLength={60}
                                />
                            </View>
                        </View>

                        <Button label={isEdit ? 'Save Changes' : 'Create Recurring'} onPress={handleSave} loading={saving} />
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export const RecurringScreen: React.FC = () => {
    const { colors, isDark } = useTheme();
    const navigation = useNavigation();
    const settings = useAppStore((s) => s.settings);
    const { rules } = useRecurringStore();
    const sym = settings.currencySymbol;

    const [showModal, setShowModal] = useState(false);
    const [editRule, setEditRule] = useState<RecurringTransaction | null>(null);

    const openAdd = () => { setEditRule(null); setShowModal(true); };
    const openEdit = (rule: RecurringTransaction) => { setEditRule(rule); setShowModal(true); };

    // Summary stats
    const activeRules = rules.filter((r) => r.isActive);
    const monthlyOutflow = activeRules
        .filter((r) => r.type === 'expense')
        .reduce((sum, r) => {
            const multipliers: Record<RecurrenceFrequency, number> = {
                daily: 30, weekly: 4.33, biweekly: 2.17, monthly: 1, quarterly: 0.33, yearly: 0.083,
            };
            return sum + r.amount * (multipliers[r.frequency as RecurrenceFrequency] ?? 1);
        }, 0);
    const monthlyInflow = activeRules
        .filter((r) => r.type === 'income')
        .reduce((sum, r) => {
            const multipliers: Record<RecurrenceFrequency, number> = {
                daily: 30, weekly: 4.33, biweekly: 2.17, monthly: 1, quarterly: 0.33, yearly: 0.083,
            };
            return sum + r.amount * (multipliers[r.frequency as RecurrenceFrequency] ?? 1);
        }, 0);

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <Ionicons name="arrow-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>Recurring</Text>
                    <TouchableOpacity
                        onPress={openAdd}
                        style={[styles.addBtn, { backgroundColor: colors.primary }]}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* Summary cards — only when rules exist */}
                {rules.length > 0 && (
                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryCard, { backgroundColor: colors.incomeMuted, borderColor: `${colors.income}30` }]}>
                            <View style={styles.summaryTop}>
                                <Ionicons name="arrow-up-circle-outline" size={16} color={colors.incomeText} />
                                <Text style={[styles.summaryLabel, { color: colors.incomeText }]}>Monthly in</Text>
                            </View>
                            <Text style={[styles.summaryValue, { color: colors.incomeText }]}>
                                {formatCurrency(monthlyInflow, sym, false, true)}
                            </Text>
                        </View>

                        <View style={[styles.summaryCard, { backgroundColor: colors.expenseMuted, borderColor: `${colors.expense}30` }]}>
                            <View style={styles.summaryTop}>
                                <Ionicons name="arrow-down-circle-outline" size={16} color={colors.expenseText} />
                                <Text style={[styles.summaryLabel, { color: colors.expenseText }]}>Monthly out</Text>
                            </View>
                            <Text style={[styles.summaryValue, { color: colors.expenseText }]}>
                                {formatCurrency(monthlyOutflow, sym, false, true)}
                            </Text>
                        </View>

                        <View style={[styles.summaryCard, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
                            <View style={styles.summaryTop}>
                                <Ionicons name="repeat-outline" size={16} color={colors.textSecondary} />
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Active rules</Text>
                            </View>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>
                                {activeRules.length}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Info banner */}
                {rules.length > 0 && (
                    <View style={[styles.infoBanner, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryMutedBorder }]}>
                        <Ionicons name="information-circle-outline" size={15} color={colors.primaryLight} />
                        <Text style={[styles.infoText, { color: colors.primaryLight }]}>
                            Transactions are auto-created each time you open the app
                        </Text>
                    </View>
                )}

                {/* List */}
                {rules.length === 0 ? (
                    <EmptyState
                        icon="repeat-outline"
                        title="No recurring rules yet"
                        description="Add EMIs, rent, SIPs, subscriptions — anything that repeats. Flo will auto-log them for you."
                        actionLabel="Add your first rule"
                        onAction={openAdd}
                    />
                ) : (
                    <View>
                        {/* Active */}
                        {activeRules.length > 0 && (
                            <View style={styles.group}>
                                <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>Active</Text>
                                {rules.filter((r) => r.isActive).map((rule) => (
                                    <RecurringItem key={rule.id} rule={rule} onPress={() => openEdit(rule)} />
                                ))}
                            </View>
                        )}

                        {/* Paused */}
                        {rules.filter((r) => !r.isActive).length > 0 && (
                            <View style={styles.group}>
                                <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>Paused</Text>
                                {rules.filter((r) => !r.isActive).map((rule) => (
                                    <RecurringItem key={rule.id} rule={rule} onPress={() => openEdit(rule)} />
                                ))}
                            </View>
                        )}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            <AddEditModal
                visible={showModal}
                editRule={editRule}
                onClose={() => setShowModal(false)}
            />
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    },
    title: { fontSize: FontSize['2xl'], fontWeight: '700', letterSpacing: -0.5 },
    addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: Spacing[4] },

    summaryRow: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[3] },
    summaryCard: { flex: 1, borderRadius: Radius.xl, borderWidth: 1, padding: Spacing[3], gap: Spacing[1.5] },
    summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    summaryLabel: { fontSize: 10, fontWeight: '500' },
    summaryValue: { fontSize: FontSize.md, fontWeight: '700', fontVariant: ['tabular-nums'] as any },

    infoBanner: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
        borderRadius: Radius.lg, borderWidth: 1,
        padding: Spacing[3], marginBottom: Spacing[4],
    },
    infoText: { flex: 1, fontSize: FontSize.xs, lineHeight: 16 },

    group: { marginBottom: Spacing[5] },
    groupLabel: {
        fontSize: 10, fontWeight: '600', letterSpacing: 0.9,
        textTransform: 'uppercase', marginBottom: Spacing[2], paddingLeft: 2,
    },

    // Modal
    modal: { flex: 1 },
    modalNav: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing[4], paddingTop: Spacing[5], paddingBottom: Spacing[4],
        borderBottomWidth: 0.5,
    },
    modalTitle: { fontSize: FontSize.lg, fontWeight: '700' },
    modalBody: { padding: Spacing[4], paddingTop: Spacing[5] },

    typeToggle: {
        flexDirection: 'row', borderRadius: Radius.full,
        padding: Spacing[1.5], marginBottom: Spacing[5],
        gap: Spacing[2], borderWidth: 1,
    },
    typeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: Spacing[2.5], borderRadius: Radius.full, gap: 6,
    },
    amountBox: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
        borderWidth: 1, borderRadius: Radius.xl,
        paddingHorizontal: Spacing[5], height: 72, marginBottom: Spacing[2],
    },
    errText: { fontSize: FontSize.xs, marginBottom: Spacing[3] },

    field: { marginBottom: Spacing[5] },
    fieldLabel: { fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing[2], letterSpacing: 0.3 },

    freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
    freqChip: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2.5], borderRadius: Radius.full },

    dateChip: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2.5], borderRadius: Radius.full },

    endDateToggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
    checkbox: {
        width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
        alignItems: 'center', justifyContent: 'center',
    },
    noteBox: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing[4], minHeight: 52 },
});