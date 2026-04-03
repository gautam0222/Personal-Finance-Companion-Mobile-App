import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { useGoalStore } from '../store/useGoalStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { PasscodePanel } from '../components/security/PasscodePanel';
import { CURRENCY_OPTIONS } from '../constants/categories';
import { Radius, Spacing } from '../constants/spacing';
import { FontSize } from '../constants/typography';
import type { RootStackParamList } from '../types';
import { calcBalanceStats } from '../utils/calculations';
import { exportAppDataAsync } from '../utils/export';
import { formatCurrency } from '../utils/formatters';
import {
  authenticateForUnlockAsync,
  getBiometricSupportAsync,
  type BiometricSupportResult,
} from '../utils/biometrics';
import {
  disableDailyReminderAsync,
  ensureNotificationPermissionsAsync,
  formatReminderTime,
  getNotificationSupport,
  scheduleDailyReminderAsync,
} from '../utils/notifications';
import {
  removeAppPasscodeAsync,
  saveAppPasscodeAsync,
  verifyAppPasscodeAsync,
} from '../utils/passcode';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type BusyAction = 'biometric' | 'notifications' | 'export' | 'security' | null;
type SecurityIntent = 'enable' | 'change';
type PasscodeStep = 'create' | 'confirm' | 'verifyCurrent' | 'createNew' | 'confirmNew';

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  iconColor?: string;
  danger?: boolean;
  last?: boolean;
  rightElement?: React.ReactNode;
}

function formatLockDelay(seconds: number): string {
  if (seconds <= 0) return 'Immediately';
  if (seconds < 60) return `${seconds} sec`;
  return `${Math.round(seconds / 60)} min`;
}

const Row: React.FC<RowProps> = ({
  icon,
  label,
  value,
  onPress,
  iconColor,
  danger = false,
  last = false,
  rightElement,
}) => {
  const { colors } = useTheme();
  const chipBg = danger ? colors.expenseMuted : colors.primaryMuted;
  const chipColor = iconColor ?? (danger ? colors.expenseText : colors.primaryLight);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.72 : 1}
      style={[
        styles.row,
        !last && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.rowChip, { backgroundColor: chipBg }]}>
        <Ionicons name={icon} size={15} color={chipColor} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? colors.expenseText : colors.text }]}>
        {label}
      </Text>
      <View style={styles.rowRight}>
        {value != null && (
          <Text style={[styles.rowValue, { color: colors.textTertiary }]}>{value}</Text>
        )}
        {rightElement}
        {onPress != null && !rightElement && (
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const Group: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Card style={styles.group} padding="none" radius={Radius.xl}>
    {children}
  </Card>
);

export const SettingsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { settings, updateSettings, setTheme, resetApp } = useAppStore();
  const { transactions, deleteAllTransactions } = useTransactionStore();
  const goals = useGoalStore((s) => s.goals);

  const [showModal, setShowModal] = useState(false);
  const [editName, setEditName] = useState(settings.userName);
  const [editBudget, setEditBudget] = useState(
    settings.monthlyBudget > 0 ? String(settings.monthlyBudget) : '',
  );
  const [editCurrency, setEditCurrency] = useState(
    CURRENCY_OPTIONS.find((c) => c.code === settings.currency) ?? CURRENCY_OPTIONS[0],
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [nameError, setNameError] = useState('');
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [biometricSupport, setBiometricSupport] = useState<BiometricSupportResult | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityIntent, setSecurityIntent] = useState<SecurityIntent>('enable');
  const [passcodeStep, setPasscodeStep] = useState<PasscodeStep>('create');
  const [passcodeValue, setPasscodeValue] = useState('');
  const [pendingPasscode, setPendingPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [passcodeStatus, setPasscodeStatus] = useState('');
  // Track biometric-in-flight separately so the button shows a spinner
  const [biometricAuthFlow, setBiometricAuthFlow] = useState(false);
  // Stable ref to biometricSupport for use inside async callbacks
  const biometricSupportRef = useRef<BiometricSupportResult | null>(null);
  // Re-entrancy guard for the passcode-advance effect — a ref so it never
  // triggers a re-render / effect restart (unlike busyAction state).
  const isAdvancingRef = useRef(false);

  const stats = calcBalanceStats(transactions);
  const sym = settings.currencySymbol;
  const reminderTime = formatReminderTime(settings.reminderHour, settings.reminderMinute);
  const notificationSupport = getNotificationSupport();

  useEffect(() => {
    let active = true;
    void getBiometricSupportAsync().then((support) => {
      if (active) {
        setBiometricSupport(support);
        biometricSupportRef.current = support;
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const resetPasscodeFlow = () => {
    // Reset the re-entrancy guard so a re-opened modal starts clean.
    isAdvancingRef.current = false;
    setPasscodeValue('');
    setPendingPasscode('');
    setPasscodeError('');
    setPasscodeStatus('');
  };

  const closeSecurityModal = (force = false) => {
    if (!force && busyAction === 'security') return;
    setShowSecurityModal(false);
    resetPasscodeFlow();
  };

  const openEnableAppLock = () => {
    setSecurityIntent('enable');
    setPasscodeStep('create');
    resetPasscodeFlow();
    setShowSecurityModal(true);
  };

  const openChangePasscode = () => {
    setSecurityIntent('change');
    setPasscodeStep('verifyCurrent');
    resetPasscodeFlow();
    setShowSecurityModal(true);
  };

  const openModal = () => {
    setEditName(settings.userName);
    setEditBudget(settings.monthlyBudget > 0 ? String(settings.monthlyBudget) : '');
    setEditCurrency(
      CURRENCY_OPTIONS.find((c) => c.code === settings.currency) ?? CURRENCY_OPTIONS[0],
    );
    setNameError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      setNameError('Please enter your name');
      return;
    }

    setSavingProfile(true);
    try {
      await updateSettings({
        userName: editName.trim(),
        monthlyBudget: parseFloat(editBudget) || 0,
        currency: editCurrency.code,
        currencySymbol: editCurrency.symbol,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    setBusyAction('biometric');
    try {
      if (enabled) {
        const support = await getBiometricSupportAsync();
        setBiometricSupport(support);
        biometricSupportRef.current = support;
        if (!support.supported) {
          Alert.alert('Biometric unlock unavailable', support.reason);
          return;
        }

        setBiometricAuthFlow(true);
        const authenticated = await authenticateForUnlockAsync(`Enable ${support.label} unlock`);
        setBiometricAuthFlow(false);
        if (!authenticated) return;
      }

      await updateSettings({ biometricLockEnabled: enabled });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setBiometricAuthFlow(false);
      setBusyAction(null);
    }
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    setBusyAction('notifications');
    try {
      if (enabled) {
        const permission = await ensureNotificationPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Notifications unavailable',
            permission.reason ??
              'Permission was not granted, so daily reminders could not be enabled.',
          );
          return;
        }

        await scheduleDailyReminderAsync(settings.reminderHour, settings.reminderMinute);
      } else {
        await disableDailyReminderAsync();
      }

      await updateSettings({ notificationsEnabled: enabled });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(
        'Reminder setup failed',
        'Something went wrong while updating your daily reminder settings.',
      );
    } finally {
      setBusyAction(null);
    }
  };

  const setReminderTime = async (hour: number, minute: number) => {
    await updateSettings({ reminderHour: hour, reminderMinute: minute });
    if (settings.notificationsEnabled) {
      await scheduleDailyReminderAsync(hour, minute);
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleReminderTimePress = () => {
    Alert.alert('Reminder time', 'Choose when Flo should remind you to log your finances.', [
      { text: '8:00 AM', onPress: () => void setReminderTime(8, 0) },
      { text: '8:00 PM', onPress: () => void setReminderTime(20, 0) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ─── Passcode finalization helpers ───────────────────────────────────────────

  const completePasscodeSetup = async (code: string) => {
    setBusyAction('security');
    setPasscodeStatus('Saving passcode...');
    try {
      await saveAppPasscodeAsync(code);
      let nextBiometricSetting = false;
      const support = biometricSupportRef.current;
      if (support?.supported) {
        setBiometricAuthFlow(true);
        setPasscodeStatus(`Enable ${support.label}?`);
        nextBiometricSetting = await authenticateForUnlockAsync(`Enable ${support.label} unlock`);
        setBiometricAuthFlow(false);
      }
      await updateSettings({ appLockEnabled: true, biometricLockEnabled: nextBiometricSetting });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeSecurityModal(true);
    } catch {
      Alert.alert('App lock failed', 'Flo could not save your passcode. Please try again.');
    } finally {
      setBiometricAuthFlow(false);
      setBusyAction(null);
      setPasscodeStatus('');
    }
  };

  const completePasscodeChange = async (code: string) => {
    setBusyAction('security');
    setPasscodeStatus('Updating passcode...');
    try {
      await saveAppPasscodeAsync(code);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeSecurityModal(true);
    } catch {
      Alert.alert('Passcode update failed', 'Flo could not update your passcode. Please try again.');
    } finally {
      setBusyAction(null);
      setPasscodeStatus('');
    }
  };

  // ─── Passcode state machine ──────────────────────────────────────────────────
  // Implemented as a plain async event handler rather than a useEffect so that
  // passcodeStep / pendingPasscode are always read from the CURRENT render's
  // closure (the handler is re-created on every render because passcodeValue
  // changes on each digit press, so the closure is never stale).
  //
  // isAdvancingRef is a synchronous ref-based re-entrancy guard.  Using a ref
  // (not state) means setting it never causes a re-render or effect restart.

  const handleSecurityDigitPress = (digit: string) => {
    if (isAdvancingRef.current || passcodeValue.length >= 4) return;
    setPasscodeError('');
    setPasscodeStatus('');
    setPasscodeValue((current) => current + digit);
  };

  const handlePasscodeSubmit = async () => {
    if (passcodeValue.length < 4 || isAdvancingRef.current) return;
    
    isAdvancingRef.current = true;
    try {
      switch (passcodeStep) {
        case 'create':
          setPendingPasscode(passcodeValue);
          setPasscodeValue('');
          setPasscodeStatus('Confirm your passcode');
          setPasscodeStep('confirm');
          break;

        case 'confirm':
          if (passcodeValue !== pendingPasscode) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setPasscodeValue('');
            setPendingPasscode('');
            setPasscodeError("Codes don't match. Start over.");
            setPasscodeStatus('');
            setPasscodeStep('create');
            break;
          }
          await completePasscodeSetup(passcodeValue);
          break;

        case 'verifyCurrent': {
          setBusyAction('security');
          setPasscodeStatus('Checking passcode…');
          const matches = await verifyAppPasscodeAsync(passcodeValue);
          setBusyAction(null);
          if (!matches) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setPasscodeValue('');
            setPasscodeError('Incorrect passcode. Try again.');
            setPasscodeStatus('');
            break;
          }
          setPasscodeValue('');
          setPasscodeStatus('');
          setPasscodeStep('createNew');
          break;
        }

        case 'createNew':
          setPendingPasscode(passcodeValue);
          setPasscodeValue('');
          setPasscodeStatus('Confirm your new passcode');
          setPasscodeStep('confirmNew');
          break;

        case 'confirmNew':
          if (passcodeValue !== pendingPasscode) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setPasscodeValue('');
            setPendingPasscode('');
            setPasscodeError("Codes don't match. Start over.");
            setPasscodeStatus('');
            setPasscodeStep('createNew');
            break;
          }
          await completePasscodeChange(passcodeValue);
          break;
      }
    } finally {
      isAdvancingRef.current = false;
    }
  };

  const handleSecurityBackspace = () => {
    if (isAdvancingRef.current) return;
    setPasscodeError('');
    setPasscodeStatus('');
    setPasscodeValue((current) => current.slice(0, -1));
  };

  const securityPanelCopy = useMemo(() => {
    switch (passcodeStep) {
      case 'create':
        return {
          title: 'Create your app passcode',
          subtitle: 'Choose a 4-digit code for moments when biometrics are unavailable.',
        };
      case 'confirm':
        return { title: 'Confirm your passcode', subtitle: 'Enter the same 4 digits again.' };
      case 'verifyCurrent':
        return {
          title: 'Enter current passcode',
          subtitle: 'We need to verify your existing code before changing it.',
        };
      case 'createNew':
        return {
          title: 'Choose a new passcode',
          subtitle: 'Pick a fresh 4-digit code that is easy for you to remember.',
        };
      case 'confirmNew':
        return { title: 'Confirm new passcode', subtitle: 'Re-enter the new code to finish.' };
    }
  }, [passcodeStep]);

  const handleAppLockToggle = async (enabled: boolean) => {
    if (enabled) {
      openEnableAppLock();
      return;
    }

    // NOTE: Do NOT set busyAction here — that would disable the Switch *before*
    // the Alert appears, causing it to snap back visually.
    Alert.alert(
      'Turn off app lock?',
      'Flo will stop asking for your passcode or biometrics when reopened.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Turn Off',
          style: 'destructive',
          onPress: async () => {
            // Only mark busy after the user confirms.
            setBusyAction('security');
            try {
              await removeAppPasscodeAsync();
              await updateSettings({ appLockEnabled: false, biometricLockEnabled: false });
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } finally {
              setBusyAction(null);
            }
          },
        },
      ],
    );
  };

  const handleLockDelayPress = () => {
    Alert.alert('Lock when app is away', 'Choose how quickly Flo should relock.', [
      { text: 'Immediately', onPress: () => void updateSettings({ lockGracePeriodSeconds: 0 }) },
      { text: '30 seconds', onPress: () => void updateSettings({ lockGracePeriodSeconds: 30 }) },
      { text: '1 minute', onPress: () => void updateSettings({ lockGracePeriodSeconds: 60 }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleExport = async () => {
    setBusyAction('export');
    try {
      const fileUri = await exportAppDataAsync(settings, transactions, goals);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Export ready', `Your data export was prepared successfully.\n\n${fileUri}`);
    } catch {
      Alert.alert('Export failed', 'Your data could not be exported right now.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleClear = () => {
    Alert.alert('Clear All Transactions', `Permanently delete all ${transactions.length} transactions?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteAllTransactions();
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset App',
      'Delete ALL data and return to onboarding? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              try { await disableDailyReminderAsync(); } catch {}
              try { await removeAppPasscodeAsync(); } catch {}
              await resetApp();
              // Navigate after resetting so the store is settled before routing
              navigation.replace('Onboarding');
            } catch {
              Alert.alert('Reset failed', 'Something went wrong. Please try again.');
            }
          },
        },
      ],
    );
  };


  const securityHelperCopy = settings.appLockEnabled
    ? `Flo relocks ${formatLockDelay(settings.lockGracePeriodSeconds).toLowerCase()} after you leave the app. Your 4-digit passcode always stays available as backup.${settings.biometricLockEnabled && biometricSupport?.supported ? ` ${biometricSupport.label} stays on for faster unlock.` : ''}`
    : 'Turn on App Lock to add a 4-digit passcode and protect the app when you leave it.';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          onPress={openModal}
          activeOpacity={0.85}
          style={[
            styles.profileCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}>
            <Text style={[styles.avatarInitial, { color: colors.primaryLight }]}>
              {settings.userName ? settings.userName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {settings.userName || 'Set your name'}
            </Text>
            <Text style={[styles.profileSub, { color: colors.textTertiary }]}>
              {settings.currency} /{' '}
              {settings.monthlyBudget > 0
                ? `${sym}${settings.monthlyBudget.toLocaleString()} budget`
                : 'No budget set'}
            </Text>
          </View>

          <View style={[styles.editChip, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="pencil-outline" size={14} color={colors.primaryLight} />
          </View>
        </TouchableOpacity>

        <Card style={{ marginBottom: Spacing[5] }} padding={Spacing[4]}>
          <Text
            style={[
              styles.groupLabel,
              { color: colors.textTertiary, marginTop: 0, marginBottom: Spacing[3] },
            ]}
          >
            Overview
          </Text>
          <View style={styles.summaryRow}>
            {([
              { label: 'Transactions', value: String(transactions.length) },
              { label: 'Goals', value: String(goals.length) },
              { label: 'Net Balance', value: formatCurrency(stats.totalBalance, sym, true, true) },
            ] as const).map((item) => (
              <View key={item.label} style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: colors.text }]}>{item.value}</Text>
                <Text style={[styles.summaryLbl, { color: colors.textTertiary }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>Appearance</Text>
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

        <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>Preferences</Text>
        <Group>
          <Row icon="person-outline" label="Name" value={settings.userName || 'Not set'} onPress={openModal} />
          <Row
            icon="swap-horizontal-outline"
            label="Currency"
            value={`${settings.currencySymbol} ${settings.currency}`}
            onPress={openModal}
          />
          <Row
            icon="wallet-outline"
            label="Monthly Budget"
            value={settings.monthlyBudget > 0 ? formatCurrency(settings.monthlyBudget, sym) : 'Not set'}
            onPress={openModal}
            last
          />
        </Group>

        <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>Security</Text>
        <Group>
          <Row
            icon="shield-checkmark-outline"
            label="App Lock"
            value={busyAction === 'security' ? 'Updating...' : undefined}
            rightElement={
              <Switch
                value={settings.appLockEnabled}
                onValueChange={(val) => void handleAppLockToggle(val)}
                disabled={busyAction === 'security'}
                trackColor={{ false: colors.border, true: `${colors.primary}99` }}
                thumbColor={settings.appLockEnabled ? colors.primary : colors.textTertiary}
              />
            }
          />
          {settings.appLockEnabled && (
            <Row icon="key-outline" label="Backup Passcode" value="Change" onPress={openChangePasscode} />
          )}
          {settings.appLockEnabled && biometricSupport?.supported && (
            <Row
              icon="scan-outline"
              label={`Use ${biometricSupport.label}`}
              value={busyAction === 'biometric' ? 'Updating...' : undefined}
              rightElement={
                <Switch
                  value={settings.biometricLockEnabled}
                  onValueChange={(val) => void handleBiometricToggle(val)}
                  disabled={busyAction === 'biometric' || busyAction === 'security'}
                  trackColor={{ false: colors.border, true: `${colors.primary}99` }}
                  thumbColor={settings.biometricLockEnabled ? colors.primary : colors.textTertiary}
                />
              }
            />
          )}
          <Row
            icon="timer-outline"
            label="Lock when app is away"
            value={settings.appLockEnabled ? formatLockDelay(settings.lockGracePeriodSeconds) : 'Off'}
            onPress={handleLockDelayPress}
            last
          />
        </Group>
        <Text style={[styles.helperText, { color: colors.textTertiary }]}>{securityHelperCopy}</Text>
        {!biometricSupport?.supported && biometricSupport?.reason && settings.appLockEnabled && (
          <Text style={[styles.helperText, { color: colors.textTertiary, marginTop: 6 }]}>
            {biometricSupport.reason}
          </Text>
        )}

        <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>Reminders</Text>
        <Group>
          <Row
            icon="notifications-outline"
            label="Daily Reminder"
            value={busyAction === 'notifications' ? 'Updating...' : undefined}
            rightElement={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(val) => void handleNotificationsToggle(val)}
                disabled={busyAction === 'notifications' || !notificationSupport.supported}
                trackColor={{ false: colors.border, true: `${colors.primary}99` }}
                thumbColor={settings.notificationsEnabled ? colors.primary : colors.textTertiary}
              />
            }
          />
          <Row icon="time-outline" label="Reminder Time" value={reminderTime} onPress={handleReminderTimePress} last />
        </Group>
        {!notificationSupport.supported && (
          <Text style={[styles.helperText, { color: colors.textTertiary }]}>
            {notificationSupport.reason}
          </Text>
        )}

        <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>Data</Text>
        <Group>
          <Row 
            icon="cloud-upload-outline" 
            label="Cloud Backup Vault" 
            onPress={() => navigation.navigate('Backup')} 
          />
          <Row
            icon="download-outline"
            label="Export Data"
            value={busyAction === 'export' ? 'Preparing...' : 'JSON'}
            onPress={() => void handleExport()}
          />
          <Row icon="trash-outline" label="Clear All Transactions" danger onPress={handleClear} />
          <Row icon="refresh-outline" label="Reset App" danger onPress={handleReset} last />
        </Group>

        <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>About</Text>
        <Group>
          <Row icon="information-circle-outline" label="Flo Finance" value="v1.0.0" iconColor={colors.primaryLight} />
          <Row icon="lock-closed-outline" label="Privacy" value="100% local data" iconColor={colors.incomeText} />
          <Row icon="heart-outline" label="Competition Edition" value="Built with care" iconColor="#F43F5E" last />
        </Group>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalNav, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowModal(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
              <View style={{ width: 22 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Input
                label="Your name"
                value={editName}
                onChangeText={(t) => {
                  setEditName(t);
                  setNameError('');
                }}
                placeholder="e.g. Aryan"
                leftIcon="person-outline"
                autoCapitalize="words"
                error={nameError}
                containerStyle={{ marginBottom: Spacing[5] }}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Currency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing[2], marginBottom: Spacing[5] }}>
                {CURRENCY_OPTIONS.map((c) => {
                  const active = editCurrency.code === c.code;
                  return (
                    <TouchableOpacity
                      key={c.code}
                      onPress={async () => {
                        await Haptics.selectionAsync();
                        setEditCurrency(c);
                      }}
                      activeOpacity={0.8}
                      style={[
                        styles.currencyChip,
                        {
                          backgroundColor: active ? colors.primaryMuted : colors.cardElevated,
                          borderColor: active ? colors.primary : colors.border,
                          borderWidth: active ? 1.5 : 1,
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
                label={`Monthly budget (${editCurrency.symbol}) - optional`}
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

      <Modal
        visible={showSecurityModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => closeSecurityModal()}
      >
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalNav, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => closeSecurityModal()}
              disabled={busyAction === 'security'}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ opacity: busyAction === 'security' ? 0.35 : 1 }}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {securityIntent === 'enable' ? 'App Lock' : 'Change Passcode'}
            </Text>
            <View style={{ width: 22 }} />
          </View>

          <View style={styles.securityBody}>
            <PasscodePanel
              title={securityPanelCopy.title}
              subtitle={securityPanelCopy.subtitle}
              code={passcodeValue}
              processing={busyAction === 'security' || isAdvancingRef.current}
              error={passcodeError}
              status={passcodeStatus}
              onDigitPress={handleSecurityDigitPress}
              onBackspace={handleSecurityBackspace}
              secondaryActionIcon={passcodeValue.length === 4 ? 'checkmark' : undefined}
              secondaryActionLabel={passcodeValue.length === 4 ? 'Submit' : undefined}
              onSecondaryAction={passcodeValue.length === 4 ? handlePasscodeSubmit : undefined}
              biometricAuthenticating={biometricAuthFlow}
            />
            <Text style={[styles.helperText, { color: colors.textTertiary, marginTop: Spacing[4] }]}>
              Your passcode stays on this device in secure storage.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  title: { fontSize: FontSize['3xl'], fontWeight: '700', letterSpacing: -0.5 },
  scroll: { paddingHorizontal: Spacing[4] },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: Spacing[4],
    marginBottom: Spacing[5],
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: FontSize['2xl'], fontWeight: '700' },
  profileName: { fontSize: FontSize.lg, fontWeight: '600', marginBottom: 3 },
  profileSub: { fontSize: FontSize.xs },
  editChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryVal: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: 2,
    fontVariant: ['tabular-nums'] as never,
  },
  summaryLbl: { fontSize: FontSize.xs },
  groupLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: Spacing[2],
    marginTop: Spacing[2],
    paddingLeft: 2,
  },
  group: { marginBottom: Spacing[3], overflow: 'hidden' },
  helperText: {
    fontSize: FontSize.xs,
    lineHeight: 19,
    marginBottom: Spacing[5],
    paddingHorizontal: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  rowChip: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: FontSize.md },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  rowValue: { fontSize: FontSize.sm },
  modal: { flex: 1 },
  modalNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[4],
    borderBottomWidth: 0.5,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  modalBody: { padding: Spacing[4], paddingTop: Spacing[5] },
  securityBody: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[8],
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing[2],
    letterSpacing: 0.3,
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
  },
});
