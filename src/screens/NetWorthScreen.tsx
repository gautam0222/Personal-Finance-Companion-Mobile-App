import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, KeyboardAvoidingView, Platform, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useTheme }         from '../hooks/useTheme';
import { useAppStore }      from '../store/useAppStore';
import { useNetWorthStore } from '../store/useNetWorthStore';

import { Card }              from '../components/common/Card';
import { SectionHeader }     from '../components/common/SectionHeader';
import { EmptyState }        from '../components/common/EmptyState';
import { Button }            from '../components/common/Button';
import { LineChart }         from '../components/charts/LineChart';
import { NetWorthEntryItem } from '../components/networth/NetWorthEntryItem';

import {
  ASSET_SUBTYPES, LIABILITY_SUBTYPES, getSubtypeMeta,
  calcNetWorth, buildTrend, getMonthChangePercent,
  groupEntriesBySubtype, debtToAssetRatio,
} from '../utils/networth';
import { formatCurrency }  from '../utils/formatters';
import { Spacing, Radius } from '../constants/spacing';
import { FontSize }        from '../constants/typography';
import {
  NetWorthEntry, NetWorthEntryKind,
  AssetSubtype, LiabilitySubtype, NetWorthSubtype,
} from '../types';

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
interface ModalProps {
  visible:     boolean;
  editEntry?:  NetWorthEntry | null;
  defaultKind?: NetWorthEntryKind;
  onClose:     () => void;
  onDelete?:   (id: string) => void;
}

const EntryModal: React.FC<ModalProps> = ({ visible, editEntry, defaultKind = 'asset', onClose, onDelete }) => {
  const { colors }                  = useTheme();
  const settings                    = useAppStore((s) => s.settings);
  const { addEntry, updateEntry }   = useNetWorthStore();
  const isEdit = !!editEntry;
  const sym    = settings.currencySymbol;

  const [kind,        setKind]        = useState<NetWorthEntryKind>(editEntry?.kind       ?? defaultKind);
  const [subtype,     setSubtype]     = useState<NetWorthSubtype>  (editEntry?.subtype     ?? 'savings_account');
  const [name,        setName]        = useState(editEntry?.name        ?? '');
  const [value,       setValue]       = useState(editEntry ? String(editEntry.value) : '');
  const [institution, setInstitution] = useState(editEntry?.institution ?? '');
  const [note,        setNote]        = useState(editEntry?.note        ?? '');
  const [saving,      setSaving]      = useState(false);
  const [nameErr,     setNameErr]     = useState('');
  const [valueErr,    setValueErr]    = useState('');

  // Sync form fields when editEntry or defaultKind changes (modal reuse across entries)
  useEffect(() => {
    if (editEntry) {
      setKind(editEntry.kind);
      setSubtype(editEntry.subtype);
      setName(editEntry.name);
      setValue(String(editEntry.value));
      setInstitution(editEntry.institution ?? '');
      setNote(editEntry.note ?? '');
    } else {
      setKind(defaultKind);
      setSubtype(defaultKind === 'asset' ? 'savings_account' : 'home_loan');
      setName('');
      setValue('');
      setInstitution('');
      setNote('');
    }
    setNameErr('');
    setValueErr('');
  }, [editEntry, defaultKind]);

  const subtypeList = kind === 'asset'
    ? (Object.entries(ASSET_SUBTYPES)     as [AssetSubtype,     any][])
    : (Object.entries(LIABILITY_SUBTYPES) as [LiabilitySubtype, any][]);

  const selectedMeta = getSubtypeMeta(subtype);

  const handleKindChange = async (k: NetWorthEntryKind) => {
    await Haptics.selectionAsync();
    setKind(k);
    setSubtype(k === 'asset' ? 'savings_account' : 'home_loan');
  };

  const reset = () => {
    setKind(defaultKind); setSubtype('savings_account'); setName('');
    setValue(''); setInstitution(''); setNote(''); setNameErr(''); setValueErr('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    let ok = true;
    if (!name.trim())                           { setNameErr('Enter a name');          ok = false; }
    if (!value || isNaN(+value) || +value <= 0) { setValueErr('Enter a valid amount'); ok = false; }
    if (!ok) return;

    setSaving(true);
    try {
      const data = {
        kind, subtype,
        name:        name.trim(),
        value:       parseFloat(value),
        institution: institution.trim() || undefined,
        note:        note.trim()        || undefined,
      };
      if (isEdit && editEntry) await updateEntry(editEntry.id, data);
      else                     await addEntry(data);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[m.modal, { backgroundColor: colors.background }]}>

          <View style={[m.nav, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[m.title, { color: colors.text }]}>{isEdit ? 'Edit Entry' : 'Add Entry'}</Text>
            <TouchableOpacity onPress={handleSave} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={[m.saveLink, { color: saving ? colors.textTertiary : colors.primary }]}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={m.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Asset / Liability toggle */}
            <View style={[m.toggle, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
              {(['asset', 'liability'] as NetWorthEntryKind[]).map((k) => {
                const active = kind === k;
                const c = k === 'asset' ? colors.incomeText : colors.expenseText;
                return (
                  <TouchableOpacity
                    key={k} onPress={() => handleKindChange(k)} activeOpacity={0.8}
                    style={[m.toggleBtn, active && { backgroundColor: k === 'asset' ? colors.incomeMuted : colors.expenseMuted, borderColor: `${c}40`, borderWidth: 1 }]}
                  >
                    <Ionicons name={k === 'asset' ? 'trending-up-outline' : 'trending-down-outline'} size={15} color={active ? c : colors.textTertiary} />
                    <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: active ? c : colors.textTertiary, textTransform: 'capitalize' }}>
                      {k}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Subtype grid */}
            <Text style={[m.fieldLabel, { color: colors.textSecondary }]}>Type</Text>
            <View style={m.subtypeGrid}>
              {subtypeList.map(([key, meta]) => {
                const active = subtype === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={async () => { await Haptics.selectionAsync(); setSubtype(key); }}
                    activeOpacity={0.8}
                    style={[m.subtypeChip, {
                      backgroundColor: active ? `${meta.color}18` : colors.cardElevated,
                      borderColor:     active ? `${meta.color}50` : colors.border,
                      borderWidth:     active ? 1.5 : 1,
                    }]}
                  >
                    <Ionicons name={meta.icon as any} size={14} color={active ? meta.color : colors.textTertiary} />
                    <Text style={{ fontSize: FontSize.xs, fontWeight: active ? '600' : '400', color: active ? meta.color : colors.textSecondary }}>
                      {meta.label.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Amount */}
            <View style={[m.amtBox, { backgroundColor: colors.cardElevated, borderColor: valueErr ? colors.expense : colors.border }]}>
              <Text style={{ fontSize: FontSize.xl, color: colors.textSecondary, fontWeight: '600' }}>{sym}</Text>
              <TextInput
                value={value}
                onChangeText={(t) => { setValue(t); setValueErr(''); }}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                style={{ flex: 1, fontSize: 34, fontWeight: '700', color: colors.text, padding: 0, letterSpacing: -1 }}
                autoFocus={!isEdit}
              />
            </View>
            {valueErr ? <Text style={[m.err, { color: colors.expenseText }]}>{valueErr}</Text> : null}

            {/* Name */}
            <View style={[m.inputRow, { backgroundColor: colors.cardElevated, borderColor: nameErr ? colors.expense : colors.border }]}>
              <Ionicons name={selectedMeta.icon as any} size={16} color={selectedMeta.color} />
              <TextInput
                value={name}
                onChangeText={(t) => { setName(t); setNameErr(''); }}
                placeholder={`e.g. ${selectedMeta.label} name`}
                placeholderTextColor={colors.textTertiary}
                style={{ flex: 1, fontSize: FontSize.md, color: colors.text, padding: 0 }}
                returnKeyType="next"
              />
            </View>
            {nameErr ? <Text style={[m.err, { color: colors.expenseText }]}>{nameErr}</Text> : null}

            {/* Institution */}
            <View style={[m.inputRow, { backgroundColor: colors.cardElevated, borderColor: colors.border, marginTop: Spacing[3] }]}>
              <Ionicons name="business-outline" size={16} color={colors.textTertiary} />
              <TextInput
                value={institution} onChangeText={setInstitution}
                placeholder="Bank / Institution (optional)"
                placeholderTextColor={colors.textTertiary}
                style={{ flex: 1, fontSize: FontSize.md, color: colors.text, padding: 0 }}
                returnKeyType="next"
              />
            </View>

            {/* Note */}
            <View style={[m.inputRow, { backgroundColor: colors.cardElevated, borderColor: colors.border, marginTop: Spacing[3], marginBottom: Spacing[8] }]}>
              <Ionicons name="document-text-outline" size={16} color={colors.textTertiary} />
              <TextInput
                value={note} onChangeText={setNote}
                placeholder="Note (optional)"
                placeholderTextColor={colors.textTertiary}
                style={{ flex: 1, fontSize: FontSize.md, color: colors.text, padding: 0 }}
                returnKeyType="done"
              />
            </View>

            <Button label={isEdit ? 'Save Changes' : 'Add to Net Worth'} onPress={handleSave} loading={saving} />

            {isEdit && editEntry && onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(editEntry.id)}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing[4], paddingVertical: Spacing[3] }}
              >
                <Ionicons name="trash-outline" size={16} color={colors.expenseText} />
                <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.expenseText }}>Delete Entry</Text>
              </TouchableOpacity>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const NetWorthScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation          = useNavigation();
  const settings            = useAppStore((s) => s.settings);
  const { entries, snapshots, deleteEntry } = useNetWorthStore();
  const sym = settings.currencySymbol;

  const [showModal,    setShowModal]    = useState(false);
  const [editEntry,    setEditEntry]    = useState<NetWorthEntry | null>(null);
  const [defaultKind,  setDefaultKind]  = useState<NetWorthEntryKind>('asset');

  const openAdd = (kind: NetWorthEntryKind = 'asset') => {
    setEditEntry(null); setDefaultKind(kind); setShowModal(true);
  };
  const openEdit = (entry: NetWorthEntry) => {
    setEditEntry(entry); setDefaultKind(entry.kind); setShowModal(true);
  };

  const handleDeleteEntry = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    Alert.alert(
      'Delete Entry',
      `Remove "${entry?.name ?? 'this entry'}" from your net worth?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteEntry(id);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowModal(false);
        }},
      ],
    );
  };

  const { totalAssets, totalLiabilities, netWorth } = useMemo(() => calcNetWorth(entries),   [entries]);
  const trend        = useMemo(() => buildTrend(snapshots),                                   [snapshots]);
  const changePercent = useMemo(() => getMonthChangePercent(snapshots),                       [snapshots]);
  const assetGroups  = useMemo(() => groupEntriesBySubtype(entries, 'asset'),                 [entries]);
  const liabGroups   = useMemo(() => groupEntriesBySubtype(entries, 'liability'),             [entries]);
  const dta          = useMemo(() => debtToAssetRatio(totalAssets, totalLiabilities),        [totalAssets, totalLiabilities]);

  const nwPositive = netWorth >= 0;
  const nwColor    = nwPositive ? colors.incomeText : colors.expenseText;
  const nwBg       = nwPositive ? colors.incomeMuted : colors.expenseMuted;

  const hasData = entries.length > 0;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.text }]}>Net Worth</Text>
          <TouchableOpacity onPress={() => openAdd()} style={[s.addBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Hero card ── */}
        <View style={[s.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Top accent bar coloured by positive/negative */}
          <View style={[s.heroAccentBar, { backgroundColor: nwColor }]} />

          <View style={s.heroBody}>
            <Text style={[s.heroLabel, { color: colors.textTertiary }]}>NET WORTH</Text>
            <Text style={[s.heroValue, { color: nwColor }]}>
              {netWorth < 0 ? '-' : ''}{formatCurrency(Math.abs(netWorth), sym)}
            </Text>

            {/* Month change badge */}
            {changePercent !== null && (
              <View style={[s.changeBadge, { backgroundColor: changePercent >= 0 ? colors.incomeMuted : colors.expenseMuted }]}>
                <Ionicons
                  name={changePercent >= 0 ? 'trending-up-outline' : 'trending-down-outline'}
                  size={13}
                  color={changePercent >= 0 ? colors.incomeText : colors.expenseText}
                />
                <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: changePercent >= 0 ? colors.incomeText : colors.expenseText }}>
                  {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}% vs last month
                </Text>
              </View>
            )}
          </View>

          {/* Assets / Liabilities row */}
          <View style={[s.heroRow, { borderTopColor: colors.border }]}>
            <View style={s.heroItem}>
              <View style={[s.heroDot, { backgroundColor: colors.income }]} />
              <View>
                <Text style={[s.heroItemLabel, { color: colors.textTertiary }]}>Assets</Text>
                <Text style={[s.heroItemValue, { color: colors.incomeText }]}>
                  {formatCurrency(totalAssets, sym, false, true)}
                </Text>
              </View>
            </View>
            <View style={[s.heroSep, { backgroundColor: colors.border }]} />
            <View style={s.heroItem}>
              <View style={[s.heroDot, { backgroundColor: colors.expense }]} />
              <View>
                <Text style={[s.heroItemLabel, { color: colors.textTertiary }]}>Liabilities</Text>
                <Text style={[s.heroItemValue, { color: colors.expenseText }]}>
                  {formatCurrency(totalLiabilities, sym, false, true)}
                </Text>
              </View>
            </View>
            {dta !== null && (
              <>
                <View style={[s.heroSep, { backgroundColor: colors.border }]} />
                <View style={s.heroItem}>
                  <View style={[s.heroDot, { backgroundColor: colors.warning }]} />
                  <View>
                    <Text style={[s.heroItemLabel, { color: colors.textTertiary }]}>Debt ratio</Text>
                    <Text style={[s.heroItemValue, {
                      color: dta < 0.3 ? colors.incomeText : dta < 0.6 ? colors.warning : colors.expenseText,
                    }]}>
                      {(dta * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── 6-month trend ── */}
        {snapshots.length > 1 && (
          <View style={s.section}>
            <SectionHeader title="6-Month Trend" />
            <Card padding={Spacing[5]}>
              <LineChart data={trend} height={160} color={nwColor} showZeroLine />
            </Card>
          </View>
        )}

        {/* ── Quick-add row ── */}
        {hasData && (
          <View style={[s.quickAddRow, { gap: Spacing[3] }]}>
            <TouchableOpacity
              onPress={() => openAdd('asset')}
              activeOpacity={0.8}
              style={[s.quickAddBtn, { backgroundColor: colors.incomeMuted, borderColor: `${colors.income}35` }]}
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.incomeText} />
              <Text style={[s.quickAddText, { color: colors.incomeText }]}>Add Asset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openAdd('liability')}
              activeOpacity={0.8}
              style={[s.quickAddBtn, { backgroundColor: colors.expenseMuted, borderColor: `${colors.expense}35` }]}
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.expenseText} />
              <Text style={[s.quickAddText, { color: colors.expenseText }]}>Add Liability</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Assets by subtype ── */}
        {assetGroups.length > 0 && (
          <View style={s.section}>
            <SectionHeader
              title="Assets"
              subtitle={formatCurrency(totalAssets, sym, false, true)}
            />
            {assetGroups.map((group) => (
              <View key={group.subtype} style={{ marginBottom: Spacing[4] }}>
                {/* Subtype header */}
                <View style={s.subtypeHeader}>
                  <View style={[s.subtypeIconBox, { backgroundColor: `${group.meta.color}18` }]}>
                    <Ionicons name={group.meta.icon as any} size={14} color={group.meta.color} />
                  </View>
                  <Text style={[s.subtypeLabel, { color: colors.textSecondary }]}>{group.meta.label}</Text>
                  <Text style={[s.subtypeTotal, { color: group.meta.color }]}>
                    {formatCurrency(group.subtotal, sym, false, true)}
                  </Text>
                </View>
                {group.entries.map((e) => (
                  <NetWorthEntryItem key={e.id} entry={e} onPress={() => openEdit(e)} />
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ── Liabilities by subtype ── */}
        {liabGroups.length > 0 && (
          <View style={s.section}>
            <SectionHeader
              title="Liabilities"
              subtitle={formatCurrency(totalLiabilities, sym, false, true)}
            />
            {liabGroups.map((group) => (
              <View key={group.subtype} style={{ marginBottom: Spacing[4] }}>
                <View style={s.subtypeHeader}>
                  <View style={[s.subtypeIconBox, { backgroundColor: `${group.meta.color}18` }]}>
                    <Ionicons name={group.meta.icon as any} size={14} color={group.meta.color} />
                  </View>
                  <Text style={[s.subtypeLabel, { color: colors.textSecondary }]}>{group.meta.label}</Text>
                  <Text style={[s.subtypeTotal, { color: group.meta.color }]}>
                    {formatCurrency(group.subtotal, sym, false, true)}
                  </Text>
                </View>
                {group.entries.map((e) => (
                  <NetWorthEntryItem key={e.id} entry={e} onPress={() => openEdit(e)} />
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ── Empty state ── */}
        {!hasData && (
          <EmptyState
            icon="trending-up-outline"
            title="Track your net worth"
            description="Add savings accounts, FDs, investments, loans, and credit cards to see your complete financial picture."
            actionLabel="Add your first entry"
            onAction={() => openAdd()}
          />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <EntryModal
        visible={showModal}
        editEntry={editEntry}
        defaultKind={defaultKind}
        onClose={() => setShowModal(false)}
        onDelete={handleDeleteEntry}
      />
    </View>
  );
};

// ─── Modal styles ─────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  modal: { flex: 1 },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingTop: Spacing[5], paddingBottom: Spacing[4],
    borderBottomWidth: 0.5,
  },
  title:     { fontSize: FontSize.lg, fontWeight: '700' },
  saveLink:  { fontSize: FontSize.md, fontWeight: '600' },
  body:      { padding: Spacing[4], paddingTop: Spacing[5] },
  fieldLabel:{ fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing[2], letterSpacing: 0.3 },
  toggle: {
    flexDirection: 'row', borderRadius: Radius.full,
    padding: Spacing[1.5], marginBottom: Spacing[5],
    gap: Spacing[2], borderWidth: 1,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing[2.5], borderRadius: Radius.full, gap: 6,
  },
  subtypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[5] },
  subtypeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: Radius.full,
  },
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
  err: { fontSize: FontSize.xs, marginTop: 4, marginBottom: Spacing[2] },
});

// ─── Screen styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
  },
  title:  { fontSize: FontSize['2xl'], fontWeight: '700', letterSpacing: -0.5 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing[4] },
  section:{ marginBottom: Spacing[6] },

  hero: {
    borderRadius: Radius['2xl'], borderWidth: 1,
    marginBottom: Spacing[6], overflow: 'hidden',
  },
  heroAccentBar: { height: 3 },
  heroBody:      { padding: Spacing[5], paddingBottom: Spacing[4] },
  heroLabel:     { fontSize: 10, fontWeight: '600', letterSpacing: 1.5, marginBottom: Spacing[2] },
  heroValue:     { fontSize: 40, fontWeight: '700', letterSpacing: -2, fontVariant: ['tabular-nums'] as any, marginBottom: Spacing[3] },
  changeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[1.5], borderRadius: Radius.full,
  },
  heroRow: {
    flexDirection: 'row', borderTopWidth: 0.5,
    paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[3],
  },
  heroItem:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  heroDot:       { width: 7, height: 7, borderRadius: 3.5 },
  heroSep:       { width: 1 },
  heroItemLabel: { fontSize: 9, marginBottom: 2 },
  heroItemValue: { fontSize: FontSize.sm, fontWeight: '700', fontVariant: ['tabular-nums'] as any },

  quickAddRow: { flexDirection: 'row', marginBottom: Spacing[6] },
  quickAddBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing[2], borderRadius: Radius.xl, borderWidth: 1, paddingVertical: Spacing[3],
  },
  quickAddText: { fontSize: FontSize.sm, fontWeight: '600' },

  subtypeHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[2], paddingLeft: 2 },
  subtypeIconBox:{ width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  subtypeLabel:  { flex: 1, fontSize: FontSize.xs, fontWeight: '500' },
  subtypeTotal:  { fontSize: FontSize.xs, fontWeight: '700', fontVariant: ['tabular-nums'] as any },
});