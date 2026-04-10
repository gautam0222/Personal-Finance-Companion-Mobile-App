import { format, subMonths, startOfMonth } from 'date-fns';
import {
  NetWorthEntry, NetWorthSnapshot,
  AssetSubtype, LiabilitySubtype, NetWorthSubtype,
} from '../types';

// ─── Subtype metadata — icons are Ionicons glyph names ────────────────────────
export interface SubtypeMeta {
  label: string;
  icon:  string;
  color: string;
}

export const ASSET_SUBTYPES: Record<AssetSubtype, SubtypeMeta> = {
  savings_account: { label: 'Savings Account', icon: 'business-outline',    color: '#10B981' },
  fixed_deposit:   { label: 'Fixed Deposit',   icon: 'lock-closed-outline', color: '#6366F1' },
  mutual_fund:     { label: 'Mutual Fund',      icon: 'trending-up-outline', color: '#8B5CF6' },
  stocks:          { label: 'Stocks',           icon: 'bar-chart-outline',   color: '#F59E0B' },
  real_estate:     { label: 'Real Estate',      icon: 'home-outline',        color: '#14B8A6' },
  gold:            { label: 'Gold',             icon: 'star-outline',        color: '#EAB308' },
  crypto:          { label: 'Crypto',           icon: 'logo-bitcoin',        color: '#F97316' },
  cash:            { label: 'Cash',             icon: 'cash-outline',        color: '#34D399' },
  other_asset:     { label: 'Other Asset',      icon: 'wallet-outline',      color: '#94A3B8' },
};

export const LIABILITY_SUBTYPES: Record<LiabilitySubtype, SubtypeMeta> = {
  home_loan:       { label: 'Home Loan',       icon: 'home-outline',          color: '#F43F5E' },
  car_loan:        { label: 'Car Loan',         icon: 'car-outline',           color: '#FB923C' },
  personal_loan:   { label: 'Personal Loan',    icon: 'person-outline',        color: '#F87171' },
  credit_card:     { label: 'Credit Card',      icon: 'card-outline',          color: '#E11D48' },
  education_loan:  { label: 'Education Loan',   icon: 'school-outline',        color: '#F59E0B' },
  other_liability: { label: 'Other Liability',  icon: 'alert-circle-outline',  color: '#94A3B8' },
};

export function getSubtypeMeta(subtype: NetWorthSubtype): SubtypeMeta {
  return (
    (ASSET_SUBTYPES as Record<string, SubtypeMeta>)[subtype] ??
    (LIABILITY_SUBTYPES as Record<string, SubtypeMeta>)[subtype] ??
    { label: 'Other', icon: 'grid-outline', color: '#94A3B8' }
  );
}

// ─── Totals ───────────────────────────────────────────────────────────────────
export interface NetWorthTotals {
  totalAssets:      number;
  totalLiabilities: number;
  netWorth:         number;
}

export function calcNetWorth(entries: NetWorthEntry[]): NetWorthTotals {
  let totalAssets = 0, totalLiabilities = 0;
  for (const e of entries) {
    if (e.kind === 'asset') totalAssets      += e.value;
    else                     totalLiabilities += e.value;
  }
  return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
}

// ─── Month key — canonical dedup key, format "yyyy-MM" ────────────────────────
// Using yyyy-MM (not yyyy-MM-dd) means two calls in the same month
// always produce the same key and the upsert in the store is unambiguous.
export function currentMonthKey(): string {
  return format(new Date(), 'yyyy-MM');
}

// ─── Snapshot trend — 6 months, gaps filled with 0 ───────────────────────────
export function buildTrend(
  snapshots: NetWorthSnapshot[],
): { label: string; value: number }[] {
  const result: { label: string; value: number }[] = [];
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const d       = subMonths(today, i);
    const key     = format(d, 'yyyy-MM');               // match monthKey format
    const label   = format(d, 'MMM');
    const snap    = snapshots.find((s) => s.monthKey === key);
    result.push({ label, value: snap?.netWorth ?? 0 });
  }
  return result;
}

// ─── Month-over-month change ──────────────────────────────────────────────────
export function getMonthChangePercent(snapshots: NetWorthSnapshot[]): number | null {
  if (snapshots.length < 2) return null;
  const sorted  = [...snapshots].sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  const current = sorted[0].netWorth;
  const prev    = sorted[1].netWorth;
  if (prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

// ─── Group entries by kind then subtype for sectioned display ─────────────────
export interface EntryGroup {
  subtype:  NetWorthSubtype;
  meta:     SubtypeMeta;
  entries:  NetWorthEntry[];
  subtotal: number;
}

export function groupEntriesBySubtype(
  entries:  NetWorthEntry[],
  kind:     'asset' | 'liability',
): EntryGroup[] {
  const filtered = entries.filter((e) => e.kind === kind);
  const map      = new Map<NetWorthSubtype, NetWorthEntry[]>();

  for (const e of filtered) {
    if (!map.has(e.subtype)) map.set(e.subtype, []);
    map.get(e.subtype)!.push(e);
  }

  return Array.from(map.entries())
    .map(([subtype, items]) => ({
      subtype,
      meta:     getSubtypeMeta(subtype),
      entries:  items,
      subtotal: items.reduce((s, e) => s + e.value, 0),
    }))
    .sort((a, b) => b.subtotal - a.subtotal);
}

// ─── Debt-to-asset ratio ──────────────────────────────────────────────────────
export function debtToAssetRatio(totalAssets: number, totalLiabilities: number): number | null {
  if (totalAssets === 0) return null;
  return totalLiabilities / totalAssets;
}