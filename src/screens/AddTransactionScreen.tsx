import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, TextInput, Alert, Image, ActionSheetIOS
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { saveReceiptImageLocally, deleteReceiptImage } from '../utils/imageHelpers';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { CategoryPicker } from '../components/transactions/CategoryPicker';
import { Button } from '../components/common/Button';
import { Spacing, Radius } from '../constants/spacing';
import { FontSize } from '../constants/typography';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction'>;

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'del'],
] as const;

export const AddTransactionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const settings             = useAppStore((s) => s.settings);
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactionStore();

  const editId   = route.params?.transactionId;
  const existing = editId ? transactions.find((t) => t.id === editId) : undefined;
  const isEdit   = !!existing;

  const [type,        setType]        = useState<'income' | 'expense'>(existing?.type ?? 'expense');
  const [amount,      setAmount]      = useState(existing ? String(existing.amount) : '');
  const [category,    setCategory]    = useState(existing?.category ?? 'food');
  const [date,        setDate]        = useState(existing?.date ?? format(new Date(), 'yyyy-MM-dd'));
  const [note,        setNote]        = useState(existing?.note ?? '');
  const [receipt,     setReceipt]     = useState<string | undefined>(existing?.receiptUri);
  const [loading,     setLoading]     = useState(false);
  const [amountError, setAmountError] = useState('');

  const sym = settings.currencySymbol;

  useEffect(() => {
    if (!isEdit) setCategory(type === 'income' ? 'salary' : 'food');
  }, [type]);

  const handleKey = async (key: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmountError('');
    if (key === 'del')              { setAmount((p) => p.slice(0, -1)); return; }
    if (key === '.' && amount.includes('.')) return;
    if (amount.split('.')[1]?.length >= 2)   return;
    if (amount.length >= 10)                  return;
    setAmount((p) => p + key);
  };

  const presentReceiptOptions = async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) void handleTakeReceipt();
          else if (buttonIndex === 2) void handlePickReceipt();
        }
      );
    } else {
      Alert.alert('Attach Receipt', 'Choose an option', [
        { text: 'Take Photo', onPress: handleTakeReceipt },
        { text: 'Choose from Library', onPress: handlePickReceipt },
        { text: 'Cancel', style: 'cancel' }
      ]);
    }
  };

  const handleTakeReceipt = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required to take photos.');
      return;
    }
    try {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        const localUri = await saveReceiptImageLocally(result.assets[0].uri);
        setReceipt(localUri);
      }
    } catch (err: any) {
      Alert.alert('Error', `Could not attach receipt: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePickReceipt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required to choose photos.');
      return;
    }
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        const localUri = await saveReceiptImageLocally(result.assets[0].uri);
        setReceipt(localUri);
      }
    } catch (err: any) {
      Alert.alert('Error', `Could not attach receipt image: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveReceipt = async () => {
    if (receipt && receipt !== existing?.receiptUri) {
      await deleteReceiptImage(receipt);
    }
    setReceipt(undefined);
  };

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setAmountError('Enter a valid amount');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      if (isEdit && editId) {
        await updateTransaction(editId, { amount: parsed, type, category, date, note, receiptUri: receipt });
        if (existing.receiptUri && existing.receiptUri !== receipt) {
          deleteReceiptImage(existing.receiptUri);
        }
      } else {
        await addTransaction({ amount: parsed, type, category, date, note, receiptUri: receipt });
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!editId) return;
    Alert.alert(
      'Delete Transaction',
      'This transaction will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(editId);
            if (existing?.receiptUri) {
              deleteReceiptImage(existing.receiptUri);
            }
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const accentColor = type === 'income' ? colors.incomeText : colors.expenseText;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']}>
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.text }]}>
            {isEdit ? 'Edit' : 'New'} Transaction
          </Text>
          <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        {/* Type Toggle */}
        <View style={[styles.typeToggle, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
          {(['expense', 'income'] as const).map((t) => {
            const active = type === t;
            const c      = t === 'income' ? colors.incomeText : colors.expenseText;
            return (
              <TouchableOpacity
                key={t}
                onPress={async () => { await Haptics.selectionAsync(); setType(t); }}
                activeOpacity={0.8}
                style={[
                  styles.typeBtn,
                  active && { backgroundColor: `${c}14`, borderColor: `${c}40`, borderWidth: 1 },
                ]}
              >
                <Ionicons
                  name={t === 'income' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
                  size={16}
                  color={active ? c : colors.textTertiary}
                />
                <Text style={{
                  fontSize: FontSize.sm, fontWeight: '600', textTransform: 'capitalize',
                  color: active ? c : colors.textTertiary,
                }}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Amount display */}
        <View style={styles.amountSection}>
          <Text style={[styles.currencyPrefix, { color: amount ? accentColor : colors.textTertiary }]}>
            {sym}
          </Text>
          <Text style={[styles.amountDisplay, { color: amount ? accentColor : colors.textTertiary }]}>
            {amount || '0'}
          </Text>
        </View>
        {amountError ? (
          <Text style={[styles.amountErr, { color: colors.expenseText }]}>{amountError}</Text>
        ) : null}

        {/* Keypad */}
        <View style={styles.keypad}>
          {KEYPAD.map((row, ri) => (
            <View key={ri} style={styles.keyRow}>
              {row.map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleKey(key)}
                  activeOpacity={0.6}
                  style={[styles.key, {
                    backgroundColor: key === 'del' ? colors.cardElevated : colors.card,
                    borderColor:     colors.border,
                  }]}
                >
                  {key === 'del'
                    ? <Ionicons name="backspace-outline" size={20} color={colors.textSecondary} />
                    : <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
                  }
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Category */}
        <View style={styles.field}>
          <CategoryPicker type={type} selected={category} onSelect={setCategory} />
        </View>

        {/* Date chips */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing[2] }}>
            {[-6,-5,-4,-3,-2,-1,0].map((offset) => {
              const d      = new Date(); d.setDate(d.getDate() + offset);
              const ds     = format(d, 'yyyy-MM-dd');
              const label  = offset === 0 ? 'Today' : offset === -1 ? 'Yesterday' : format(d, 'EEE d');
              const active = date === ds;
              return (
                <TouchableOpacity
                  key={offset}
                  onPress={async () => { await Haptics.selectionAsync(); setDate(ds); }}
                  style={[styles.dateChip, {
                    backgroundColor: active ? colors.primaryMuted : colors.cardElevated,
                    borderColor:     active ? colors.primaryMutedBorder : colors.border,
                    borderWidth:     active ? 1.5 : 1,
                  }]}
                >
                  <Text style={{ fontSize: FontSize.sm, fontWeight: active ? '600' : '400', color: active ? colors.primaryLight : colors.textSecondary }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Note */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Note</Text>
          <View style={[styles.noteBox, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={type === 'income' ? 'e.g. Monthly salary' : 'e.g. Lunch at café'}
              placeholderTextColor={colors.textTertiary}
              style={{ fontSize: FontSize.md, color: colors.text, padding: 0 }}
              multiline maxLength={100} returnKeyType="done"
            />
          </View>
        </View>

        {/* Receipt Attachment */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Receipt</Text>
          {receipt ? (
            <View style={[styles.receiptCard, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
              <Image 
                source={{ uri: receipt }} 
                style={styles.receiptImage}
                resizeMode="cover"
              />
              <View style={styles.receiptOverlay}>
                <TouchableOpacity
                  onPress={presentReceiptOptions}
                  style={[styles.receiptAction, { backgroundColor: `${colors.primary}CC` }]}
                >
                  <Ionicons name="camera-outline" size={16} color="#FFF" />
                  <Text style={styles.receiptActionText}>Replace</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRemoveReceipt}
                  style={[styles.receiptAction, { backgroundColor: `${colors.expenseText}CC` }]}
                >
                  <Ionicons name="trash-outline" size={16} color="#FFF" />
                  <Text style={styles.receiptActionText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={presentReceiptOptions}
              activeOpacity={0.7}
              style={[styles.receiptEmpty, { 
                backgroundColor: colors.cardElevated, 
                borderColor: `${colors.textTertiary}40`,
              }]}
            >
              <View style={[styles.receiptIconCircle, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="receipt-outline" size={28} color={colors.primary} />
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, fontWeight: '500', marginTop: Spacing[2] }}>
                Tap to attach a receipt
              </Text>
              <Text style={{ color: colors.textTertiary, fontSize: FontSize.xs, marginTop: 2 }}>
                Camera or photo library
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Button
          label={isEdit ? 'Save Changes' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
          onPress={handleSave}
          loading={loading}
          style={{ marginTop: Spacing[2], marginHorizontal: Spacing[4] }}
        />

        {/* Delete button — only shown in edit mode */}
        {isEdit && (
          <TouchableOpacity
            onPress={handleDelete}
            activeOpacity={0.75}
            style={[styles.deleteBtn, { borderColor: colors.expenseText + '40' }]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.expenseText} />
            <Text style={[styles.deleteBtnText, { color: colors.expenseText }]}>
              Delete Transaction
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
  },
  navTitle: { fontSize: FontSize.lg, fontWeight: '600' },
  scroll: { paddingHorizontal: Spacing[4] },
  typeToggle: {
    flexDirection: 'row', borderRadius: Radius.full,
    padding: Spacing[1.5], marginBottom: Spacing[6],
    gap: Spacing[2], borderWidth: 1,
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing[3], borderRadius: Radius.full, gap: 6,
  },
  amountSection: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
    marginBottom: Spacing[2], gap: Spacing[1.5],
  },
  currencyPrefix: { fontSize: 26, fontWeight: '600', marginBottom: 8 },
  amountDisplay: {
    fontSize: 62, fontWeight: '700', letterSpacing: -3,
    lineHeight: 70, fontVariant: ['tabular-nums'] as any,
  },
  amountErr: { textAlign: 'center', fontSize: FontSize.sm, marginBottom: Spacing[3] },
  keypad:  { gap: Spacing[2], marginBottom: Spacing[5] },
  keyRow:  { flexDirection: 'row', gap: Spacing[2] },
  key: {
    flex: 1, height: 56, borderRadius: Radius.lg, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  keyText: { fontSize: FontSize['2xl'], fontWeight: '400' },
  field:   { marginBottom: Spacing[5] },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing[2], letterSpacing: 0.3 },
  dateChip: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2.5], borderRadius: Radius.full,
  },
  noteBox: {
    borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing[4], minHeight: 68,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[4],
    marginHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  deleteBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  receiptCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: 200,
  },
  receiptOverlay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
  },
  receiptAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
  },
  receiptActionText: {
    color: '#FFF',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  receiptEmpty: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[6],
  },
  receiptIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});