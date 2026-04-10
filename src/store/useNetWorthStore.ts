import { create } from 'zustand';
import { NetWorthEntry, NetWorthSnapshot, NetWorthSubtype, NetWorthEntryKind } from '../types';
import { Storage } from '../utils/storage';
import { calcNetWorth, currentMonthKey } from '../utils/networth';

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

type NewEntry = Omit<NetWorthEntry, 'id' | 'createdAt' | 'updatedAt'>;

interface NetWorthStore {
  entries:    NetWorthEntry[];
  snapshots:  NetWorthSnapshot[];
  isHydrated: boolean;

  hydrate:      () => Promise<void>;
  addEntry:     (data: NewEntry) => Promise<NetWorthEntry>;
  updateEntry:  (id: string, data: Partial<Omit<NetWorthEntry, 'id' | 'createdAt'>>) => Promise<void>;
  deleteEntry:  (id: string) => Promise<void>;
  // Upserts a snapshot for the current calendar month.
  // Deduplication key = monthKey ("yyyy-MM"). Calling this multiple times
  // in the same month always produces exactly one snapshot row.
  saveSnapshot: () => Promise<void>;
}

export const useNetWorthStore = create<NetWorthStore>((set, get) => ({
  entries:    [],
  snapshots:  [],
  isHydrated: false,

  hydrate: async () => {
    const [entries, snapshots] = await Promise.all([
      Storage.get<NetWorthEntry[]>(Storage.KEYS.NET_WORTH_ENTRIES),
      Storage.get<NetWorthSnapshot[]>(Storage.KEYS.NET_WORTH_SNAPSHOTS),
    ]);
    set({
      entries:    entries    ?? [],
      snapshots:  snapshots  ?? [],
      isHydrated: true,
    });
    // Bring current month's snapshot up to date on every cold start
    await get().saveSnapshot();
  },

  addEntry: async (data) => {
    const now   = new Date().toISOString();
    const entry: NetWorthEntry = { ...data, id: genId('nw'), createdAt: now, updatedAt: now };
    const next  = [entry, ...get().entries];
    set({ entries: next });
    await Storage.set(Storage.KEYS.NET_WORTH_ENTRIES, next);
    await get().saveSnapshot();
    return entry;
  },

  updateEntry: async (id, data) => {
    const next = get().entries.map((e) =>
      e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e,
    );
    set({ entries: next });
    await Storage.set(Storage.KEYS.NET_WORTH_ENTRIES, next);
    await get().saveSnapshot();
  },

  deleteEntry: async (id) => {
    const next = get().entries.filter((e) => e.id !== id);
    set({ entries: next });
    await Storage.set(Storage.KEYS.NET_WORTH_ENTRIES, next);
    await get().saveSnapshot();
  },

  saveSnapshot: async () => {
    // If no entries, nothing meaningful to snapshot
    if (get().entries.length === 0) return;

    const { totalAssets, totalLiabilities, netWorth } = calcNetWorth(get().entries);
    const monthKey = currentMonthKey();   // "yyyy-MM" — the dedup key

    const snap: NetWorthSnapshot = {
      monthKey,
      totalAssets,
      totalLiabilities,
      netWorth,
      recordedAt: new Date().toISOString(),
    };

    // Upsert: one row per month, most recent first.
    // Filter by monthKey (not by id or date string) so format never causes duplication.
    const next = [
      snap,
      ...get().snapshots.filter((s) => s.monthKey !== monthKey),
    ].sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    set({ snapshots: next });
    await Storage.set(Storage.KEYS.NET_WORTH_SNAPSHOTS, next);
  },
}));