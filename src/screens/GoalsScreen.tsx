import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from '../utils/haptics';
import { format, addMonths } from 'date-fns';

import { useTheme }    from '../hooks/useTheme';
import { useGoalStore } from '../store/useGoalStore';
import { useAppStore }  from '../store/useAppStore';

import { GoalCard }      from '../components/goals/GoalCard';
import { Button }        from '../components/common/Button';
import { Input }         from '../components/common/Input';
import { EmptyState }    from '../components/common/EmptyState';
import { SectionHeader } from '../components/common/SectionHeader';

import { Goal, GoalType } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Spacing, Radius } from '../constants/spacing';
import { FontSize }         from '../constants/typography';

// All icons are Ionicon glyph names — stored in goal.icon
interface GoalTemplate {
  type:      GoalType;
  label:     string;
  sublabel:  string;
  icon:      keyof typeof Ionicons.glyphMap;
  color:     string;
}

const TEMPLATES: GoalTemplate[] = [
  {
    type:     'savings',
    label:    'Savings Goal',
    sublabel: 'Save toward a target',
    icon:     'wallet-outline',
    color:    '#10B981',
  },
  {
    type:     'no-spend',
    label:    'No-Spend',
    sublabel: 'Spend nothing in a category',
    icon:     'ban-outline',
    color:    '#F43F5E',
  },
  {
    type:     'budget-limit',
    label:    'Budget Limit',
    sublabel: 'Cap monthly spending',
    icon:     'pie-chart-outline',
    color:    '#F59E0B',
  },
];

export const GoalsScreen: React.FC = () => {
  const { colors, isDark }                                                = useTheme();
  const { goals, addGoal, updateGoalProgress, getActiveGoals, getCompletedGoals } = useGoalStore();
  const settings                                                          = useAppStore((s) => s.settings);
  const sym = settings.currencySymbol;

  // ── Modal visibility ──
  const [showAdd,        setShowAdd]        = useState(false);
  const [showContribute, setShowContribute] = useState(false);
  const [selectedGoal,   setSelectedGoal]   = useState<Goal | null>(null);

  // ── Contribute form ──
  const [contributeAmt, setContributeAmt] = useState('');
  const [contributing,  setContributing]  = useState(false);

  // ── Add Goal form ──
  const [goalType,    setGoalType]    = useState<GoalType>('savings');
  const [goalTitle,   setGoalTitle]   = useState('');
  const [goalTarget,  setGoalTarget]  = useState('');
  const [goalDeadline,setGoalDeadline]= useState('');
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  const active    = getActiveGoals();
  const completed = getCompletedGoals();

  const resetForm = () => {
    setGoalTitle(''); setGoalTarget(''); setGoalDeadline('');
    setGoalType('savings'); setErrors({});
  };

  const openContribute = (goal: Goal) => {
    setSelectedGoal(goal);
    setContributeAmt('');
    setShowContribute(true);
  };

  // ── Handlers ──
  const handleCreate = async () => {
    const e: Record<string, string> = {};
    if (!goalTitle.trim())                                            e.title   = 'Enter a title';
    if (!goalTarget || isNaN(+goalTarget) || +goalTarget <= 0)        e.target  = 'Enter a valid amount';
    if (!goalDeadline)                                                e.deadline = 'Pick a deadline';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    try {
      const tmpl = TEMPLATES.find((t) => t.type === goalType)!;
      await addGoal({
        title:        goalTitle.trim(),
        description:  '',
        targetAmount: parseFloat(goalTarget),
        deadline:     goalDeadline,
        type:         goalType,
        icon:         tmpl.icon,      // ionicon name stored in goal record
        color:        tmpl.color,
        isActive:     true,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  };

  const handleContribute = async () => {
    const amt = parseFloat(contributeAmt);
    if (!contributeAmt || isNaN(amt) || amt <= 0 || !selectedGoal) return;
    setContributing(true);
    try {
      await updateGoalProgress(selectedGoal.id, amt);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowContribute(false);
    } finally {
      setContributing(false);
    }
  };

  const selectedTemplate = TEMPLATES.find((t) => t.type === goalType)!;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Goals</Text>
          <TouchableOpacity
            onPress={() => setShowAdd(true)}
            activeOpacity={0.8}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {goals.length === 0 ? (
          <EmptyState
            icon="flag-outline"
            title="No goals yet"
            description="Set a savings goal, budget cap, or no-spend challenge to grow your Karma Score"
            actionLabel="Create a goal"
            onAction={() => setShowAdd(true)}
          />
        ) : (
          <>
            {active.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Active"
                  subtitle={`${active.length} goal${active.length > 1 ? 's' : ''}`}
                />
                {active.map((g) => (
                  <GoalCard key={g.id} goal={g} onContribute={openContribute} />
                ))}
              </View>
            )}

            {completed.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Completed"
                  subtitle={`${completed.length} achieved`}
                />
                {completed.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Add Goal Modal ── */}
      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { resetForm(); setShowAdd(false); }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>

            {/* Modal nav */}
            <View style={[styles.modalNav, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => { resetForm(); setShowAdd(false); }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Goal</Text>
              <View style={{ width: 22 }} />
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Goal type cards */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Goal type</Text>
              <View style={styles.typeGrid}>
                {TEMPLATES.map((tmpl) => {
                  const active = goalType === tmpl.type;
                  return (
                    <TouchableOpacity
                      key={tmpl.type}
                      onPress={async () => { await Haptics.selectionAsync(); setGoalType(tmpl.type); }}
                      activeOpacity={0.8}
                      style={[
                        styles.typeCard,
                        {
                          backgroundColor: active ? `${tmpl.color}14` : colors.cardElevated,
                          borderColor:     active ? `${tmpl.color}50`  : colors.border,
                          borderWidth:     active ? 1.5 : 1,
                        },
                      ]}
                    >
                      <View style={[styles.typeIconBox, { backgroundColor: `${tmpl.color}${active ? '25' : '15'}` }]}>
                        <Ionicons name={tmpl.icon} size={20} color={tmpl.color} />
                      </View>
                      <Text style={[styles.typeLabel, { color: active ? tmpl.color : colors.text }]}>
                        {tmpl.label}
                      </Text>
                      <Text style={[styles.typeSublabel, { color: colors.textTertiary }]} numberOfLines={1}>
                        {tmpl.sublabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Input
                label="Goal title"
                placeholder="e.g. Emergency fund"
                value={goalTitle}
                onChangeText={(t) => { setGoalTitle(t); setErrors((e) => ({ ...e, title: '' })); }}
                error={errors.title}
                leftIcon="pencil-outline"
                containerStyle={{ marginBottom: Spacing[4] }}
              />

              <Input
                label={`Target amount (${sym})`}
                placeholder="e.g. 50000"
                value={goalTarget}
                onChangeText={(t) => { setGoalTarget(t); setErrors((e) => ({ ...e, target: '' })); }}
                error={errors.target}
                keyboardType="numeric"
                prefix={sym}
                containerStyle={{ marginBottom: Spacing[4] }}
              />

              {/* Quick deadline chips */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Deadline</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing[2], marginBottom: Spacing[4] }}
              >
                {[1, 3, 6, 12].map((months) => {
                  const d      = format(addMonths(new Date(), months), 'yyyy-MM-dd');
                  const label  = months === 1 ? '1 month' : months === 12 ? '1 year' : `${months} months`;
                  const active = goalDeadline === d;
                  return (
                    <TouchableOpacity
                      key={months}
                      onPress={async () => { await Haptics.selectionAsync(); setGoalDeadline(d); setErrors((e) => ({ ...e, deadline: '' })); }}
                      style={[
                        styles.deadlineChip,
                        {
                          backgroundColor: active ? colors.primaryMuted     : colors.cardElevated,
                          borderColor:     active ? colors.primaryMutedBorder : colors.border,
                          borderWidth:     active ? 1.5 : 1,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: FontSize.sm, fontWeight: active ? '600' : '400', color: active ? colors.primaryLight : colors.textSecondary }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Input
                label="Or enter a custom date"
                placeholder={format(addMonths(new Date(), 3), 'yyyy-MM-dd')}
                value={goalDeadline}
                onChangeText={(t) => { setGoalDeadline(t); setErrors((e) => ({ ...e, deadline: '' })); }}
                error={errors.deadline}
                leftIcon="calendar-outline"
                containerStyle={{ marginBottom: Spacing[8] }}
              />

              <Button label="Create goal" onPress={handleCreate} loading={saving} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Contribute Modal ── */}
      <Modal
        visible={showContribute}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowContribute(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalNav, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setShowContribute(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Funds</Text>
            <View style={{ width: 22 }} />
          </View>

          <View style={styles.modalBody}>
            {/* Goal preview */}
            {selectedGoal && (
              <View style={[styles.goalPreview, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
                <View style={[styles.previewIcon, { backgroundColor: `${selectedGoal.color}18` }]}>
                  <Ionicons
                    name={selectedGoal.icon as any}
                    size={20}
                    color={selectedGoal.color}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.previewTitle, { color: colors.text }]}>{selectedGoal.title}</Text>
                  <Text style={[styles.previewSub, { color: colors.textTertiary }]}>
                    {formatCurrency(selectedGoal.currentAmount, sym)} of {formatCurrency(selectedGoal.targetAmount, sym)}
                  </Text>
                </View>
                {/* Mini progress bar */}
                <View style={[styles.miniBarTrack, { backgroundColor: colors.border }]}>
                  <View style={[
                    styles.miniBarFill,
                    {
                      height: `${Math.min(100, (selectedGoal.currentAmount / selectedGoal.targetAmount) * 100)}%`,
                      backgroundColor: selectedGoal.color,
                    },
                  ]} />
                </View>
              </View>
            )}

            <Input
              label={`Amount to add (${sym})`}
              placeholder="How much are you putting in?"
              value={contributeAmt}
              onChangeText={setContributeAmt}
              keyboardType="numeric"
              prefix={sym}
              autoFocus
              containerStyle={{ marginBottom: Spacing[6] }}
            />

            <Button label="Add funds" onPress={handleContribute} loading={contributing} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
  },
  title:  { fontSize: FontSize['3xl'], fontWeight: '700', letterSpacing: -0.5 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing[4] },
  section:{ marginBottom: Spacing[6] },

  // Modal
  modal: { flex: 1 },
  modalNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingTop: Spacing[5], paddingBottom: Spacing[4],
    borderBottomWidth: 0.5,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  modalBody:  { padding: Spacing[4], paddingTop: Spacing[5] },

  // Type cards
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing[2], letterSpacing: 0.3 },
  typeGrid:   { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[5] },
  typeCard: {
    flex: 1, borderRadius: Radius.xl,
    paddingVertical: Spacing[4], paddingHorizontal: Spacing[2],
    alignItems: 'center', gap: Spacing[2],
  },
  typeIconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  typeLabel:    { fontSize: FontSize.xs, fontWeight: '600', textAlign: 'center' },
  typeSublabel: { fontSize: 9, textAlign: 'center' },

  // Deadline chips
  deadlineChip: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2.5],
    borderRadius: Radius.full,
  },

  // Goal preview in contribute modal
  goalPreview: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    borderRadius: Radius.xl, borderWidth: 1,
    padding: Spacing[4], marginBottom: Spacing[5],
  },
  previewIcon: {
    width: 40, height: 40, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  previewTitle: { fontSize: FontSize.md, fontWeight: '600', marginBottom: 2 },
  previewSub:   { fontSize: FontSize.xs },
  miniBarTrack: {
    width: 4, height: 40, borderRadius: 2,
    overflow: 'hidden', justifyContent: 'flex-end',
  },
  miniBarFill:  { width: 4, borderRadius: 2 },
});
