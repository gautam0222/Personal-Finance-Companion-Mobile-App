import { create } from 'zustand';
import { Friend, Split, SplitParticipant, SplitStatus } from '../types';
import { Storage } from '../utils/storage';
import { nameToAvatarColor } from '../utils/splits';

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Friend balances are NEVER stored — they're always derived from splits at read time.
// See utils/splits.ts → calcFriendBalances()

interface SplitStore {
  friends:    Friend[];
  splits:     Split[];
  isHydrated: boolean;

  hydrate: () => Promise<void>;

  // ── Friends ──
  addFriend:    (name: string, phone?: string) => Promise<Friend>;
  updateFriend: (id: string, name: string, phone?: string) => Promise<void>;
  deleteFriend: (id: string) => Promise<void>;

  // ── Splits ──
  // transactionId is optional — splits can be created standalone
  addSplit:    (data: Omit<Split, 'id' | 'createdAt'>) => Promise<Split>;
  updateSplit: (id: string, data: Partial<Omit<Split, 'id' | 'createdAt'>>) => Promise<void>;
  deleteSplit: (id: string) => Promise<void>;

  // ── Settlement — these are the ONLY mutations to participant.status ──
  // All balances read from participants[], never from a cached field.
  settleAllForFriend: (friendId: string) => Promise<void>;
  settleOneParticipant: (splitId: string, friendId: string) => Promise<void>;
  unsettle: (splitId: string, friendId: string) => Promise<void>;
}

export const useSplitStore = create<SplitStore>((set, get) => ({
  friends:    [],
  splits:     [],
  isHydrated: false,

  hydrate: async () => {
    const [friends, splits] = await Promise.all([
      Storage.get<Friend[]>(Storage.KEYS.FRIENDS),
      Storage.get<Split[]>(Storage.KEYS.SPLITS),
    ]);
    set({ friends: friends ?? [], splits: splits ?? [], isHydrated: true });
  },

  // ── Friends ───────────────────────────────────────────────────────────────

  addFriend: async (name, phone) => {
    const friend: Friend = {
      id:          genId('fr'),
      name:        name.trim(),
      phone:       phone?.trim() || undefined,
      avatarColor: nameToAvatarColor(name.trim()),
      createdAt:   new Date().toISOString(),
    };
    const next = [...get().friends, friend];
    set({ friends: next });
    await Storage.set(Storage.KEYS.FRIENDS, next);
    return friend;
  },

  updateFriend: async (id, name, phone) => {
    const next = get().friends.map((f) =>
      f.id === id
        ? { ...f, name: name.trim(), phone: phone?.trim() || undefined, avatarColor: nameToAvatarColor(name.trim()) }
        : f,
    );
    set({ friends: next });
    await Storage.set(Storage.KEYS.FRIENDS, next);
  },

  deleteFriend: async (id) => {
    // Splits referencing this friend are kept for history.
    // Their participant rows remain in the record.
    const next = get().friends.filter((f) => f.id !== id);
    set({ friends: next });
    await Storage.set(Storage.KEYS.FRIENDS, next);
  },

  // ── Splits ────────────────────────────────────────────────────────────────

  addSplit: async (data) => {
    const split: Split = { ...data, id: genId('sp'), createdAt: new Date().toISOString() };
    const next = [split, ...get().splits];
    set({ splits: next });
    await Storage.set(Storage.KEYS.SPLITS, next);
    return split;
  },

  updateSplit: async (id, data) => {
    const next = get().splits.map((s) => s.id === id ? { ...s, ...data } : s);
    set({ splits: next });
    await Storage.set(Storage.KEYS.SPLITS, next);
  },

  deleteSplit: async (id) => {
    const next = get().splits.filter((s) => s.id !== id);
    set({ splits: next });
    await Storage.set(Storage.KEYS.SPLITS, next);
  },

  // ── Settlement ───────────────────────────────────────────────────────────
  // Mutates participant.status in the splits array.
  // Balances in calcFriendBalances() re-derive automatically from the new state.

  settleAllForFriend: async (friendId) => {
    const now  = new Date().toISOString();
    const next = get().splits.map((s) => ({
      ...s,
      participants: s.participants.map((p) =>
        p.friendId === friendId && p.status === 'pending'
          ? { ...p, status: 'settled' as SplitStatus, settledAt: now }
          : p,
      ),
    }));
    set({ splits: next });
    await Storage.set(Storage.KEYS.SPLITS, next);
  },

  settleOneParticipant: async (splitId, friendId) => {
    const now  = new Date().toISOString();
    const next = get().splits.map((s) => {
      if (s.id !== splitId) return s;
      return {
        ...s,
        participants: s.participants.map((p) =>
          p.friendId === friendId
            ? { ...p, status: 'settled' as SplitStatus, settledAt: now }
            : p,
        ),
      };
    });
    set({ splits: next });
    await Storage.set(Storage.KEYS.SPLITS, next);
  },

  unsettle: async (splitId, friendId) => {
    const next = get().splits.map((s) => {
      if (s.id !== splitId) return s;
      return {
        ...s,
        participants: s.participants.map((p) =>
          p.friendId === friendId
            ? { ...p, status: 'pending' as SplitStatus, settledAt: undefined }
            : p,
        ),
      };
    });
    set({ splits: next });
    await Storage.set(Storage.KEYS.SPLITS, next);
  },
}));