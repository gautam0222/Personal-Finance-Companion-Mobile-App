import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme }            from '../hooks/useTheme';
import { useAppStore }         from '../store/useAppStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useGoalStore }        from '../store/useGoalStore';

import { Button }  from '../components/common/Button';
import { Input }   from '../components/common/Input';
import { Card }    from '../components/common/Card';

import { CURRENCY_OPTIONS }   from '../constants/categories';
import { calcBalanceStats }   from '../utils/calculations';
import { formatCurrency }     from '../utils/formatters';
import { Spacing, Radius }    from '../constants/spacing';
import { FontSize }           from '../constants/typography';
import type { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ── Setting row ───────────────────────────────────────────────────────────────
interface RowProps {
  icon:          keyof typeof Ionicons.glyphMap;
  iconColor?:    string;
  label:         string;
  value?:        string;
  onPress?:      () => void;
  danger?:       boolean;
  last?:         boolean;
  rightElement?: React.ReactNode;
}

const Row: React.FC<RowProps> = ({
  icon, iconColor, label, value, onPress,
  danger = false, last = false, rightElement,
}) => {
  const { colors } = useTheme();
  const ic = iconColor ?? (danger ? colors.expenseText : colors.primaryLight);
  const bg = danger ? colors.expenseMuted : colors.primaryMuted;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        s.row,
        !last && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
      ]}
    >
      <View style={[s.rowChip, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={15} color={ic} />
      </View>

      <Text style={[s.rowLabel, { color: danger ? colors.expenseText : colors.text }]}>
        {label}
      </Text>

      <View style={s.rowRight}>
        {value != null && (
          <Text style={[s.rowValue, { color: colors.textTertiary }]}>{value}</Text>
        )}
        {rightElement}
        {onPress != null && !rightElement && (
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        )}
      </View>
    </TouchableOpacity>
  );
};

// ── Group wrapper ─────────────────────────────────────────────────────────────
const Group: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Card style={s.group} padding="none" radius={Radius.xl}>
    {children}
  </Card>
);

// ── Screen ────────────────────────────────────────────────────────────────────
export const SettingsScreen: React.FC = () => {
  const { colors, isDark }                          = useTheme();
  const navigation                                  = useNavigation<NavProp>();
  const { settings, updateSettings, setTheme, resetApp } = useAppStore();
  const { transactions, deleteAllTransactions }     = useTransactionStore();
  const { goals }                                   = useGoalStore();

  const [showModal,     setShowModal]     = useState(false);
  const [editName,      setEditName]      = useState(settings.userName);
  const [editBudget,    setEditBudget]    = useState(settings.monthlyBudget > 0 ? String(settings.monthlyBudget) : '');
  const [editCurrency,  setEditCurrency]  = useState(
    CURRENCY_OPTIONS.find((c) => c.code === settings.currency) ?? CURRENCY_OPTIONS[0],
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [nameError,     setNameError]     = useState('');

  const stats = calcBalanceStats(transactions);
  const sym   = settings.currencySymbol;

  const openModal = () => {
    setEditName(settings.userName);
    setEditBudget(settings.monthlyBudget > 0 ? String(settings.monthlyBudget) : '');
    setEditCurrency(CURRENCY_OPTIONS.find((c) => c.code === settings.currency) ?? CURRENCY_OPTIONS[0]);
    setNameError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editName.trim()) { setNameError('Please enter your name'); return; }
    setSavingProfile(true);
    try {
      await updateSettings({
        userName:       editName.trim(),
        monthlyBudget:  parseFloat(editBudget) || 0,
        currency:       editCurrency.code,
        currencySymbol: editCurrency.symbol,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleClear = () => Alert.alert(
    'Clear All Transactions',
    `Permanently delete all ${transactions.length} transactions?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteAllTransactions();
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ],
  );

  const handleReset = () => Alert.alert(
    'Reset App',
    'Delete all data and return to onboarding? This cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: async () => { await resetApp(); navigation.replace('Onboarding'); },
      },
    ],
  );

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <Text style={[s.title, { color: colors.text }]}>Settings</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Profile card */}
        <TouchableOpacity
          onPress={openModal}
          activeOpacity={0.85}
          style={[s.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          {/* Avatar */}
          <View style={[s.avatar, { backgroundColor: colors.primaryMuted }]}>
            <Text style={[s.avatarInitial, { color: colors.primaryLight }]}>
              {settings.userName ? settings.userName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[s.profileName, { color: colors.text }]}>
              {settings.userName || 'Set your name'}
            </Text>
            <Text style={[s.profileSub, { color: colors.textTertiary }]}>
              {settings.currency} ·{' '}
              {settings.monthlyBudget > 0
                ? `${sym}${settings.monthlyBudget.toLocaleString()} budget`
                : 'No budget set'}
            </Text>
          </View>

          <View style={[s.editChip, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="pencil-outline" size={14} color={colors.primaryLight} />
          </View>
        </TouchableOpacity>

        {/* Data summary */}
        <Card style={{ marginBottom: Spacing[5] }} padding={Spacing[4]}>
          <Text style={[s.groupLabel, { color: colors.textTertiary, marginTop: 0, marginBottom: Spacing[3] }]}>
            Overview
          </Text>
          <View style={s.summaryRow}>
            {([
              { label: 'Transactions', value: String(transactions.length) },
              { label: 'Goals',        value: String(goals.length)        },
              { label: 'Net Balance',  value: formatCurrency(stats.totalBalance, sym, true, true) },
            ] as const).map((item) => (
              <View key={item.label} style={s.summaryItem}>
                <Text style={[s.summaryVal, { color: colors.text }]}>{item.value}</Text>
                <Text style={[s.summaryLbl, { color: colors.textTertiary }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Appearance */}
        <Text style={[s.groupLabel, { color: colors.textTertiary }]}>Appearance</Text>
        <Group>
          <Row
            icon="sunny-outline"
            iconColor="#F59E0B"
            label="Light Mode"
            last
            rightElement={
              <Switch
                value={settings.theme === 'light'}
                onValueChange={async (val) => {
                  await Haptics.selectionAsync();
                  await setTheme(val ? 'light' : 'dark');
                }}
                trackColor={{ false: colors.border, true: `${colors.primary}99` }}
                thumbColor={settings.theme === 'light' ? colors.primary : colors.textTertiary}
              />
            }
          />
        </Group>

        {/* Preferences */}
        <Text style={[s.groupLabel, { color: colors.textTertiary }]}>Preferences</Text>
        <Group>
          <Row icon="person-outline"       label="Name"           value={settings.userName || 'Not set'}                                        onPress={openModal} />
          <Row icon="swap-horizontal-outline" label="Currency"    value={`${settings.currencySymbol} ${settings.currency}`}                    onPress={openModal} />
          <Row icon="wallet-outline"        label="Monthly Budget" value={settings.monthlyBudget > 0 ? formatCurrency(settings.monthlyBudget, sym) : 'Not set'} onPress={openModal} last />
        </Group>

        {/* Notifications placeholder */}
        <Text style={[s.groupLabel, { color: colors.textTertiary }]}>Data</Text>
        <Group>
          <Row icon="trash-outline"  label="Clear All Transactions" danger onPress={handleClear} />
          <Row icon="refresh-outline" label="Reset App"            danger onPress={handleReset} last />
        </Group>

        {/* About */}
        <Text style={[s.groupLabel, { color: colors.textTertiary }]}>About</Text>
        <Group>
          <Row icon="information-circle-outline" label="Flo Finance"         value="v1.0.0"          iconColor={colors.primaryLight} />
          <Row icon="lock-closed-outline"        label="Privacy"             value="100% local data"  iconColor={colors.incomeText}   />
          <Row icon="heart-outline"              label="Competition Edition"  value="Built with care"  iconColor="#F43F5E" last />
        </Group>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={[s.modal, { backgroundColor: colors.background }]}>

            <View style={[s.modalNav, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[s.modalTitle, { color: colors.text }]}>Edit Profile</Text>
              <View style={{ width: 22 }} />
            </View>

            <ScrollView
              contentContainerStyle={s.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Input
                label="Your name"
                value={editName}
                onChangeText={(t) => { setEditName(t); setNameError(''); }}
                placeholder="e.g. Aryan"
                leftIcon="person-outline"
                autoCapitalize="words"
                error={nameError}
                containerStyle={{ marginBottom: Spacing[5] }}
              />

              <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Currency</Text>
              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing[2], marginBottom: Spacing[5] }}
              >
                {CURRENCY_OPTIONS.map((c) => {
                  const active = editCurrency.code === c.code;
                  return (
                    <TouchableOpacity
                      key={c.code}
                      onPress={async () => { await Haptics.selectionAsync(); setEditCurrency(c); }}
                      activeOpacity={0.8}
                      style={[
                        s.currencyChip,
                        {
                          backgroundColor: active ? colors.primaryMuted     : colors.cardElevated,
                          borderColor:     active ? colors.primary          : colors.border,
                          borderWidth:     active ? 1.5 : 1,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: FontSize.xl, color: colors.text, fontWeight: '700' }}>{c.symbol}</Text>
                      <Text style={{ fontSize: FontSize.sm, color: active ? colors.primaryLight : colors.textSecondary, fontWeight: '500' }}>
                        {c.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Input
                label={`Monthly budget (${editCurrency.symbol}) — optional`}
                value={editBudget}
                onChangeText={setEditBudget}
                placeholder="e.g. 30000"
                keyboardType="numeric"
                prefix={editCurrency.symbol}
                hint="Tracks spending progress on the home screen"
                containerStyle={{ marginBottom: Spacing[8] }}
              />

              <Button label="Save changes" onPress={handleSave} loading={savingProfile} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  title:  { fontSize: FontSize['3xl'], fontWeight: '700', letterSpacing: -0.5 },
  scroll: { paddingHorizontal: Spacing[4] },

  // Profile card
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[4],
    borderRadius: Radius['2xl'], borderWidth: 1,
    padding: Spacing[4], marginBottom: Spacing[5],
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: FontSize['2xl'], fontWeight: '700' },
  profileName:   { fontSize: FontSize.lg, fontWeight: '600', marginBottom: 3 },
  profileSub:    { fontSize: FontSize.xs },
  editChip: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // Summary
  summaryRow:  { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryVal:  { fontSize: FontSize.lg, fontWeight: '700', marginBottom: 2, fontVariant: ['tabular-nums'] as any },
  summaryLbl:  { fontSize: FontSize.xs },

  // Group / rows
  groupLabel: {
    fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.9,
    textTransform: 'uppercase', marginBottom: Spacing[2], marginTop: Spacing[2], paddingLeft: 2,
  },
  group: { marginBottom: Spacing[5], overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  rowChip: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: FontSize.md },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  rowValue: { fontSize: FontSize.sm },

  // Modal
  modal:    { flex: 1 },
  modalNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingTop: Spacing[5], paddingBottom: Spacing[4],
    borderBottomWidth: 0.5,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  modalBody:  { padding: Spacing[4], paddingTop: Spacing[5] },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing[2], letterSpacing: 0.3 },
  currencyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
  },
});