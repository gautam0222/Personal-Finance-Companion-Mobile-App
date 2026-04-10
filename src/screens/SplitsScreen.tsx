import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, KeyboardAvoidingView, Platform, TextInput, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { useTheme }      from '../hooks/useTheme';
import { useAppStore }   from '../store/useAppStore';
import { useSplitStore } from '../store/useSplitStore';
import { EmptyState }    from '../components/common/EmptyState';
import { Button }        from '../components/common/Button';
import { Card }          from '../components/common/Card';
import { SectionHeader } from '../components/common/SectionHeader';

import {
  calcFriendBalances, splitsForFriend, calcEqualShares,
  validateCustomShares, totalOutstanding, nameToAvatarColor,
  FriendBalance,
} from '../utils/splits';
import { formatCurrency, formatDateShort } from '../utils/formatters';
import { Spacing, Radius }  from '../constants/spacing';
import { FontSize }         from '../constants/typography';
import { Friend, Split, SplitMode, SplitParticipant } from '../types';

// ─── Friend Avatar ────────────────────────────────────────────────────────────
const FA: React.FC<{ friend: Friend; size?: number }> = ({ friend, size = 40 }) => (
  <View style={{
    width: size, height: size, borderRadius: size / 2,
    backgroundColor: `${friend.avatarColor}20`,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }}>
    <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: friend.avatarColor }}>
      {friend.name.charAt(0).toUpperCase()}
    </Text>
  </View>
);

// ─── Add Friend Modal ─────────────────────────────────────────────────────────
const AddFriendModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { colors }    = useTheme();
  const { addFriend } = useSplitStore();
  const [name,   setName]   = useState('');
  const [phone,  setPhone]  = useState('');
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setErr('Enter a name'); return; }
    setSaving(true);
    try {
      await addFriend(name.trim(), phone.trim() || undefined);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setName(''); setPhone(''); setErr('');
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[p.modal, { backgroundColor: useTheme().colors.background }]}>
          <View style={[p.nav, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[p.navTitle, { color: colors.text }]}>Add Friend</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={{ padding: Spacing[5], gap: Spacing[4] }}>
            <View style={[p.inputRow, { backgroundColor: colors.cardElevated, borderColor: err ? colors.expense : colors.border }]}>
              <Ionicons name="person-outline" size={16} color={colors.textTertiary} />
              <TextInput
                value={name} onChangeText={(t) => { setName(t); setErr(''); }}
                placeholder="Friend's name"
                placeholderTextColor={colors.textTertiary}
                style={{ flex: 1, fontSize: FontSize.md, color: colors.text, padding: 0 }}
                autoFocus autoCapitalize="words" returnKeyType="next"
              />
            </View>
            {err ? <Text style={{ fontSize: FontSize.xs, color: colors.expenseText }}>{err}</Text> : null}
            <View style={[p.inputRow, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
              <Ionicons name="call-outline" size={16} color={colors.textTertiary} />
              <TextInput
                value={phone} onChangeText={setPhone}
                placeholder="Phone number (optional)"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad" returnKeyType="done"
                style={{ flex: 1, fontSize: FontSize.md, color: colors.text, padding: 0 }}
              />
            </View>
            <Button label="Add Friend" onPress={handleSave} loading={saving} style={{ marginTop: Spacing[4] }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Add Split Modal ──────────────────────────────────────────────────────────
interface AddSplitProps {
  visible:  boolean;
  friends:  Friend[];
  sym:      string;
  onClose:  () => void;
}

const AddSplitModal: React.FC<AddSplitProps> = ({ visible, friends, sym, onClose }) => {
  const { colors }  = useTheme();
  const { addSplit } = useSplitStore();

  const [totalAmt,    setTotalAmt]    = useState('');
  const [note,        setNote]        = useState('');
  const [date,        setDate]        = useState(format(new Date(), 'yyyy-MM-dd'));
  const [splitMode,   setSplitMode]   = useState<SplitMode>('equal');
  const [selected,    setSelected]    = useState<string[]>([]);   // friend ids
  const [customShares,setCustomShares]= useState<Record<string, string>>({});
  const [saving,      setSaving]      = useState(false);
  const [amtErr,      setAmtErr]      = useState('');

  const total   = parseFloat(totalAmt) || 0;
  const { friendShare, myShare: eqMyShare } = useMemo(
    () => calcEqualShares(total, selected.length),
    [total, selected.length],
  );

  const customResult = useMemo(() => {
    if (splitMode !== 'custom') return null;
    const shares: Record<string, number> = {};
    selected.forEach((id) => { shares[id] = parseFloat(customShares[id] ?? '0') || 0; });
    return validateCustomShares(total, shares, selected);
  }, [splitMode, total, customShares, selected]);

  const toggleFriend = async (id: string) => {
    await Haptics.selectionAsync();
    setSelected((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  };

  const reset = () => {
    setTotalAmt(''); setNote(''); setDate(format(new Date(), 'yyyy-MM-dd'));
    setSplitMode('equal'); setSelected([]); setCustomShares({}); setAmtErr('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!totalAmt || isNaN(total) || total <= 0) { setAmtErr('Enter a valid amount'); return; }
    if (selected.length === 0) { setAmtErr('Select at least one friend'); return; }
    if (splitMode === 'custom' && customResult && !customResult.valid) {
      setAmtErr(customResult.error ?? 'Invalid shares'); return;
    }

    setSaving(true);
    try {
      const participants: SplitParticipant[] = selected.map((friendId) => ({
        friendId,
        share:  splitMode === 'equal'
          ? friendShare
          : parseFloat(customShares[friendId] ?? '0') || 0,
        status:    'pending',
      }));
      const myShare = splitMode === 'equal'
        ? eqMyShare
        : (customResult?.myShare ?? 0);

      await addSplit({
        totalAmount: total,
        myShare,
        splitMode,
        note:    note.trim() || 'Shared expense',
        date,
        participants,
        // transactionId is optional — standalone splits have none
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[p.modal, { backgroundColor: colors.background }]}>
          <View style={[p.nav, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[p.navTitle, { color: colors.text }]}>New Split</Text>
            <TouchableOpacity onPress={handleSave} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: saving ? colors.textTertiary : colors.primary }}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: Spacing[4], paddingTop: Spacing[5] }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Amount */}
            <View style={[p.amtBox, { backgroundColor: colors.cardElevated, borderColor: amtErr ? colors.expense : colors.border }]}>
              <Text style={{ fontSize: FontSize.xl, color: colors.textSecondary, fontWeight: '600' }}>{sym}</Text>
              <TextInput
                value={totalAmt}
                onChangeText={(t) => { setTotalAmt(t); setAmtErr(''); }}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                style={{ flex: 1, fontSize: 32, fontWeight: '700', color: colors.text, padding: 0, letterSpacing: -1 }}
                autoFocus
              />
            </View>
            {amtErr ? <Text style={{ fontSize: FontSize.xs, color: colors.expenseText, marginBottom: Spacing[2] }}>{amtErr}</Text> : null}

            {/* Note */}
            <View style={[p.inputRow, { backgroundColor: colors.cardElevated, borderColor: colors.border, marginBottom: Spacing[4] }]}>
              <Ionicons name="receipt-outline" size={16} color={colors.textTertiary} />
              <TextInput
                value={note} onChangeText={setNote}
                placeholder="e.g. Dinner at Barbeque Nation"
                placeholderTextColor={colors.textTertiary}
                style={{ flex: 1, fontSize: FontSize.md, color: colors.text, padding: 0 }}
                returnKeyType="next"
              />
            </View>

            {/* Date chips */}
            <Text style={[p.fieldLabel, { color: colors.textSecondary }]}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing[2], marginBottom: Spacing[5] }}>
              {[0, -1, -2, -3, -4, -5, -6].map((offset) => {
                const d     = new Date(); d.setDate(d.getDate() + offset);
                const ds    = format(d, 'yyyy-MM-dd');
                const label = offset === 0 ? 'Today' : offset === -1 ? 'Yesterday' : format(d, 'EEE d');
                const active = date === ds;
                return (
                  <TouchableOpacity
                    key={offset}
                    onPress={async () => { await Haptics.selectionAsync(); setDate(ds); }}
                    style={[p.chip, { backgroundColor: active ? colors.primaryMuted : colors.cardElevated, borderColor: active ? colors.primaryMutedBorder : colors.border, borderWidth: active ? 1.5 : 1 }]}
                  >
                    <Text style={{ fontSize: FontSize.sm, fontWeight: active ? '600' : '400', color: active ? colors.primaryLight : colors.textSecondary }}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Friends */}
            <Text style={[p.fieldLabel, { color: colors.textSecondary }]}>Split with</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[4] }}>
              {friends.map((f) => {
                const sel = selected.includes(f.id);
                return (
                  <TouchableOpacity
                    key={f.id} onPress={() => toggleFriend(f.id)} activeOpacity={0.8}
                    style={[p.friendChip, {
                      backgroundColor: sel ? `${f.avatarColor}18` : colors.cardElevated,
                      borderColor:     sel ? `${f.avatarColor}55` : colors.border,
                      borderWidth:     sel ? 1.5 : 1,
                    }]}
                  >
                    <FA friend={f} size={24} />
                    <Text style={{ fontSize: FontSize.xs, fontWeight: sel ? '600' : '400', color: sel ? colors.text : colors.textSecondary }}>
                      {f.name.split(' ')[0]}
                    </Text>
                    {sel && <Ionicons name="checkmark-circle" size={14} color={f.avatarColor} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Equal / Custom split mode */}
            {selected.length > 0 && total > 0 && (
              <>
                {/* Mode toggle */}
                <View style={[p.modeToggle, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
                  {(['equal', 'custom'] as SplitMode[]).map((mode) => {
                    const active = splitMode === mode;
                    return (
                      <TouchableOpacity
                        key={mode}
                        onPress={async () => { await Haptics.selectionAsync(); setSplitMode(mode); }}
                        activeOpacity={0.8}
                        style={[p.modeBtn, active && { backgroundColor: colors.primaryMuted, borderColor: colors.primaryMutedBorder, borderWidth: 1 }]}
                      >
                        <Ionicons
                          name={mode === 'equal' ? 'git-branch-outline' : 'create-outline'}
                          size={14}
                          color={active ? colors.primaryLight : colors.textTertiary}
                        />
                        <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: active ? colors.primaryLight : colors.textTertiary }}>
                          {mode === 'equal' ? 'Equal split' : 'Custom'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {splitMode === 'equal' ? (
                  /* Equal split preview */
                  <View style={[p.splitPreview, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryMutedBorder }]}>
                    {selected.map((id) => {
                      const friend = friends.find((f) => f.id === id);
                      if (!friend) return null;
                      return (
                        <View key={id} style={p.splitPreviewRow}>
                          <FA friend={friend} size={22} />
                          <Text style={[p.splitPreviewName, { color: colors.text }]}>{friend.name.split(' ')[0]}</Text>
                          <Text style={[p.splitPreviewAmt, { color: colors.primaryLight }]}>
                            {sym}{friendShare.toFixed(2)}
                          </Text>
                        </View>
                      );
                    })}
                    <View style={[p.splitPreviewDivider, { backgroundColor: colors.primaryMutedBorder }]} />
                    <View style={p.splitPreviewRow}>
                      <View style={[{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="person-outline" size={12} color={colors.primaryLight} />
                      </View>
                      <Text style={[p.splitPreviewName, { color: colors.textSecondary }]}>You</Text>
                      <Text style={[p.splitPreviewAmt, { color: colors.primaryLight }]}>
                        {sym}{eqMyShare.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  /* Custom share inputs */
                  <View style={[p.splitPreview, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
                    {selected.map((id) => {
                      const friend = friends.find((f) => f.id === id);
                      if (!friend) return null;
                      return (
                        <View key={id} style={p.splitPreviewRow}>
                          <FA friend={friend} size={22} />
                          <Text style={[p.splitPreviewName, { color: colors.text, flex: 1 }]}>{friend.name.split(' ')[0]}</Text>
                          <TextInput
                            value={customShares[id] ?? ''}
                            onChangeText={(v) => setCustomShares((prev) => ({ ...prev, [id]: v }))}
                            placeholder={friendShare.toFixed(2)}
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="numeric"
                            style={[p.customInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                          />
                        </View>
                      );
                    })}
                    {customResult && (
                      <>
                        <View style={[p.splitPreviewDivider, { backgroundColor: colors.border }]} />
                        <View style={p.splitPreviewRow}>
                          <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, flex: 1 }}>Your share</Text>
                          <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: customResult.valid ? colors.incomeText : colors.expenseText, fontVariant: ['tabular-nums'] as any }}>
                            {sym}{customResult.myShare.toFixed(2)}
                          </Text>
                        </View>
                        {!customResult.valid && (
                          <Text style={{ fontSize: FontSize.xs, color: colors.expenseText }}>{customResult.error}</Text>
                        )}
                      </>
                    )}
                  </View>
                )}
              </>
            )}

            <Button label="Create Split" onPress={handleSave} loading={saving} style={{ marginTop: Spacing[6] }} />
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Friend Detail Modal ──────────────────────────────────────────────────────
const FriendDetailModal: React.FC<{
  visible:     boolean;
  balance:     FriendBalance | null;
  splits:      Split[];
  friends:     Friend[];
  sym:         string;
  onClose:     () => void;
  onSettle:    () => void;
  onSettleOne: (splitId: string) => void;
  onUnsettle:  (splitId: string) => void;
  onDelete:    () => void;
}> = ({ visible, balance, splits, friends, sym, onClose, onSettle, onSettleOne, onUnsettle, onDelete }) => {
  const { colors } = useTheme();
  if (!balance) return null;

  const history = splitsForFriend(splits, balance.friendId);
  const hasOwed = balance.totalOwed > 0.005;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[p.modal, { backgroundColor: colors.background }]}>
        <View style={[p.nav, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[p.navTitle, { color: colors.text }]}>{balance.friend.name}</Text>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="trash-outline" size={18} color={colors.expenseText} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing[4] }} showsVerticalScrollIndicator={false}>
          {/* Balance hero */}
          <View style={[p.detailHero, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FA friend={balance.friend} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={[p.detailName, { color: colors.text }]}>{balance.friend.name}</Text>
              {hasOwed ? (
                <>
                  <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary, marginBottom: 4 }}>owes you</Text>
                  <Text style={[p.detailAmount, { color: colors.incomeText }]}>
                    {formatCurrency(balance.totalOwed, sym)}
                  </Text>
                </>
              ) : (
                <Text style={{ fontSize: FontSize.sm, color: colors.incomeText, marginTop: 4 }}>
                  All settled up
                </Text>
              )}
            </View>
            {balance.friend.phone && (
              <View style={[p.phoneBadge, { backgroundColor: colors.cardElevated }]}>
                <Ionicons name="call-outline" size={12} color={colors.textTertiary} />
                <Text style={{ fontSize: 10, color: colors.textTertiary }}>{balance.friend.phone}</Text>
              </View>
            )}
          </View>

          {hasOwed && (
            <Button
              label={`Settle all — ${formatCurrency(balance.totalOwed, sym, false, true)}`}
              onPress={onSettle}
              variant="success"
              style={{ marginBottom: Spacing[5] }}
            />
          )}

          {/* History */}
          {history.length === 0 ? (
            <EmptyState icon="receipt-outline" title="No shared expenses yet" compact />
          ) : (
            <View>
              <Text style={[p.groupLabel, { color: colors.textTertiary }]}>History</Text>
              {history.map((split) => {
                const participant = split.participants.find((pp) => pp.friendId === balance.friendId);
                if (!participant) return null;
                const settled = participant.status === 'settled';
                return (
                  <View key={split.id} style={[p.historyRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={p.historyLeft}>
                      <Text style={[p.historyNote, { color: colors.text }]} numberOfLines={1}>{split.note}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[1.5], marginTop: 2 }}>
                        <Text style={[p.historyDate, { color: colors.textTertiary }]}>{formatDateShort(split.date)}</Text>
                        <View style={[{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textTertiary }]} />
                        <Text style={[p.historyDate, { color: colors.textTertiary }]}>
                          {split.splitMode === 'equal' ? 'Equal split' : 'Custom split'}
                        </Text>
                      </View>
                    </View>
                    <View style={p.historyRight}>
                      <Text style={[p.historyAmt, { color: settled ? colors.textTertiary : colors.incomeText }]}>
                        {formatCurrency(participant.share, sym, false, true)}
                      </Text>
                      {settled ? (
                        <TouchableOpacity
                          onPress={() => onUnsettle(split.id)}
                          style={[p.settlePill, { backgroundColor: colors.cardElevated }]}
                        >
                          <Ionicons name="checkmark-outline" size={11} color={colors.textTertiary} />
                          <Text style={{ fontSize: 10, color: colors.textTertiary }}>Settled</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => onSettleOne(split.id)}
                          style={[p.settlePill, { backgroundColor: colors.incomeMuted, borderColor: `${colors.income}40`, borderWidth: 1 }]}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '600', color: colors.incomeText }}>Settle</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const SplitsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation          = useNavigation();
  const settings            = useAppStore((s) => s.settings);
  const { friends, splits, settleAllForFriend, settleOneParticipant, unsettle, deleteFriend } = useSplitStore();
  const sym = settings.currencySymbol;

  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showAddSplit,  setShowAddSplit]  = useState(false);
  const [selBalance,    setSelBalance]    = useState<FriendBalance | null>(null);
  const [showDetail,    setShowDetail]    = useState(false);

  // All balances derived from splits array — never stored
  const balances    = useMemo(() => calcFriendBalances(splits, friends), [splits, friends]);
  const outstanding = useMemo(() => totalOutstanding(splits), [splits]);

  const withBalance  = balances.filter((b) => b.totalOwed > 0.005);
  const withoutBalance = balances.filter((b) => b.totalOwed <= 0.005);

  const handleSettle = async () => {
    if (!selBalance) return;
    Alert.alert(
      'Settle Up',
      `Mark all of ${selBalance.friend.name}'s splits as settled?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settle All', onPress: async () => {
          await settleAllForFriend(selBalance.friendId);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }},
      ],
    );
  };

  const handleDelete = () => {
    if (!selBalance) return;
    Alert.alert(
      'Remove Friend',
      `Remove ${selBalance.friend.name}? Their split history will be kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => {
          await deleteFriend(selBalance.friendId);
          setShowDetail(false);
        }},
      ],
    );
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.text }]}>Splits</Text>
          <View style={{ flexDirection: 'row', gap: Spacing[2] }}>
            <TouchableOpacity
              onPress={() => setShowAddFriend(true)}
              style={[s.iconBtn, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={16} color={colors.text} />
            </TouchableOpacity>
            {friends.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowAddSplit(true)}
                style={[s.addBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Outstanding banner */}
        {outstanding > 0.005 && (
          <View style={[s.banner, { backgroundColor: colors.incomeMuted, borderColor: `${colors.income}30` }]}>
            <Ionicons name="people-outline" size={18} color={colors.incomeText} />
            <View style={{ flex: 1 }}>
              <Text style={[s.bannerTitle, { color: colors.incomeText }]}>
                {formatCurrency(outstanding, sym)} owed to you
              </Text>
              <Text style={[s.bannerSub, { color: colors.incomeText, opacity: 0.75 }]}>
                across {withBalance.length} friend{withBalance.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        )}

        {friends.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No friends yet"
            description="Add friends to split expenses and track who owes what. Tap + to add someone."
            actionLabel="Add a friend"
            onAction={() => setShowAddFriend(true)}
          />
        ) : (
          <>
            {/* Friends with outstanding balance */}
            {withBalance.length > 0 && (
              <View style={s.group}>
                <Text style={[s.groupLabel, { color: colors.textTertiary }]}>Outstanding</Text>
                {withBalance.map((b) => (
                  <TouchableOpacity
                    key={b.friendId}
                    onPress={() => { setSelBalance(b); setShowDetail(true); }}
                    activeOpacity={0.75}
                    style={[s.friendCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <FA friend={b.friend} />
                    <View style={s.friendInfo}>
                      <Text style={[s.friendName, { color: colors.text }]}>{b.friend.name}</Text>
                      <Text style={[s.friendMeta, { color: colors.textTertiary }]}>
                        {b.pendingCount} pending · {b.settledCount} settled
                      </Text>
                    </View>
                    <View style={s.friendRight}>
                      <Text style={[s.friendOwedLabel, { color: colors.textTertiary }]}>owes you</Text>
                      <Text style={[s.friendOwedAmt, { color: colors.incomeText }]}>
                        {formatCurrency(b.totalOwed, sym, false, true)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Friends settled / no splits yet */}
            {withoutBalance.length > 0 && (
              <View style={s.group}>
                <Text style={[s.groupLabel, { color: colors.textTertiary }]}>Settled</Text>
                {withoutBalance.map((b) => (
                  <TouchableOpacity
                    key={b.friendId}
                    onPress={() => { setSelBalance(b); setShowDetail(true); }}
                    activeOpacity={0.75}
                    style={[s.friendCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <FA friend={b.friend} />
                    <View style={s.friendInfo}>
                      <Text style={[s.friendName, { color: colors.text }]}>{b.friend.name}</Text>
                      <Text style={[s.friendMeta, { color: colors.textTertiary }]}>
                        {b.totalSplits > 0 ? `${b.totalSplits} split${b.totalSplits > 1 ? 's' : ''}` : 'No splits yet'}
                      </Text>
                    </View>
                    <View style={[s.settledBadge, { backgroundColor: colors.cardElevated }]}>
                      <Ionicons name="checkmark-outline" size={12} color={colors.textTertiary} />
                      <Text style={{ fontSize: 10, color: colors.textTertiary }}>All clear</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Add split CTA */}
            <TouchableOpacity
              onPress={() => setShowAddSplit(true)}
              activeOpacity={0.8}
              style={[s.addSplitCta, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryMutedBorder }]}
            >
              <Ionicons name="receipt-outline" size={18} color={colors.primaryLight} />
              <Text style={[s.addSplitCtaText, { color: colors.primaryLight }]}>Record a shared expense</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primaryLight} />
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <AddFriendModal visible={showAddFriend} onClose={() => setShowAddFriend(false)} />

      <AddSplitModal
        visible={showAddSplit}
        friends={friends}
        sym={sym}
        onClose={() => setShowAddSplit(false)}
      />

      <FriendDetailModal
        visible={showDetail}
        balance={selBalance}
        splits={splits}
        friends={friends}
        sym={sym}
        onClose={() => setShowDetail(false)}
        onSettle={handleSettle}
        onSettleOne={(splitId) => {
          if (!selBalance) return;
          settleOneParticipant(splitId, selBalance.friendId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        onUnsettle={(splitId) => {
          if (!selBalance) return;
          unsettle(splitId, selBalance.friendId);
          Haptics.selectionAsync();
        }}
        onDelete={handleDelete}
      />
    </View>
  );
};

// ─── Modal styles (p = panel) ─────────────────────────────────────────────────
const p = StyleSheet.create({
  modal:    { flex: 1 },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingTop: Spacing[5], paddingBottom: Spacing[4],
    borderBottomWidth: 0.5,
  },
  navTitle:  { fontSize: FontSize.lg, fontWeight: '700' },
  fieldLabel:{ fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing[2], letterSpacing: 0.3 },
  amtBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    borderWidth: 1, borderRadius: Radius.xl,
    paddingHorizontal: Spacing[5], height: 68, marginBottom: Spacing[2],
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    borderWidth: 1, borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4], height: 50,
  },
  chip: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2.5], borderRadius: Radius.full },
  friendChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: Radius.lg,
  },
  modeToggle: {
    flexDirection: 'row', borderRadius: Radius.lg,
    padding: Spacing[1], marginBottom: Spacing[3],
    gap: Spacing[2], borderWidth: 1,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing[2.5], borderRadius: Radius.md, gap: 6,
  },
  splitPreview: {
    borderRadius: Radius.xl, borderWidth: 1,
    padding: Spacing[4], gap: Spacing[3], marginBottom: Spacing[2],
  },
  splitPreviewRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  splitPreviewName:    { flex: 1, fontSize: FontSize.sm },
  splitPreviewAmt:     { fontSize: FontSize.sm, fontWeight: '700', fontVariant: ['tabular-nums'] as any },
  splitPreviewDivider: { height: 0.5 },
  customInput: {
    width: 80, height: 36, borderRadius: Radius.md, borderWidth: 1,
    paddingHorizontal: Spacing[3], fontSize: FontSize.sm, fontWeight: '600',
    textAlign: 'right', fontVariant: ['tabular-nums'] as any,
  },
  detailHero: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[4],
    borderRadius: Radius.xl, borderWidth: 1,
    padding: Spacing[5], marginBottom: Spacing[4],
  },
  detailName:   { fontSize: FontSize.xl, fontWeight: '700', marginBottom: 2 },
  detailAmount: { fontSize: FontSize['3xl'], fontWeight: '700', letterSpacing: -0.5, fontVariant: ['tabular-nums'] as any },
  phoneBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  groupLabel: {
    fontSize: 10, fontWeight: '600', letterSpacing: 0.9,
    textTransform: 'uppercase', marginBottom: Spacing[2], paddingLeft: 2,
  },
  historyRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.lg, borderWidth: 0.5,
    padding: Spacing[4], marginBottom: Spacing[2],
  },
  historyLeft:  { flex: 1, marginRight: Spacing[3] },
  historyNote:  { fontSize: FontSize.md, fontWeight: '500', marginBottom: 2 },
  historyDate:  { fontSize: FontSize.xs },
  historyRight: { alignItems: 'flex-end', gap: Spacing[1.5] },
  historyAmt:   { fontSize: FontSize.md, fontWeight: '700', fontVariant: ['tabular-nums'] as any },
  settlePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing[2.5], paddingVertical: 3,
    borderRadius: Radius.full,
  },
});

// ─── Screen styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:  { flex: 1 },
  header:{
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
  },
  title: { fontSize: FontSize['2xl'], fontWeight: '700', letterSpacing: -0.5 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing[4] },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    borderRadius: Radius.xl, borderWidth: 1,
    padding: Spacing[4], marginBottom: Spacing[4],
  },
  bannerTitle: { fontSize: FontSize.md, fontWeight: '700' },
  bannerSub:   { fontSize: FontSize.xs, marginTop: 2 },
  group:       { marginBottom: Spacing[5] },
  groupLabel: {
    fontSize: 10, fontWeight: '600', letterSpacing: 0.9,
    textTransform: 'uppercase', marginBottom: Spacing[2], paddingLeft: 2,
  },
  friendCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    borderRadius: Radius.xl, borderWidth: 0.5,
    padding: Spacing[4], marginBottom: Spacing[2],
  },
  friendInfo:     { flex: 1 },
  friendName:     { fontSize: FontSize.md, fontWeight: '600', marginBottom: 2 },
  friendMeta:     { fontSize: FontSize.xs },
  friendRight:    { alignItems: 'flex-end', gap: 3 },
  friendOwedLabel:{ fontSize: 10 },
  friendOwedAmt:  { fontSize: FontSize.md, fontWeight: '700', fontVariant: ['tabular-nums'] as any },
  settledBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing[3], paddingVertical: 4, borderRadius: Radius.full,
  },
  addSplitCta: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    borderRadius: Radius.xl, borderWidth: 1,
    padding: Spacing[4], marginTop: Spacing[2],
  },
  addSplitCtaText: { flex: 1, fontSize: FontSize.sm, fontWeight: '500' },
});