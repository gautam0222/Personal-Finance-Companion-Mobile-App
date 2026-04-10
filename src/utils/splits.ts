import { Split, Friend, SplitMode } from '../types';

// ─── Friend balance — purely DERIVED from split records, never stored ─────────
// Direction: positive totalOwed = they owe YOU.
// All friend totals are computed fresh from the splits array every render.
// No cached or stored balance values anywhere.
export interface FriendBalance {
  friendId:         string;
  friend:           Friend;
  totalOwed:        number;   // sum of pending participant.share values
  pendingCount:     number;
  settledCount:     number;
  totalSplits:      number;
  lastActivityDate: string | null;
}

export function calcFriendBalances(
  splits:  Split[],
  friends: Friend[],
): FriendBalance[] {
  // Build a map from friendId → aggregated numbers
  const map = new Map<string, {
    owed: number; pending: number; settled: number; lastDate: string | null;
  }>();

  for (const split of splits) {
    for (const p of split.participants) {
      if (!map.has(p.friendId)) {
        map.set(p.friendId, { owed: 0, pending: 0, settled: 0, lastDate: null });
      }
      const row = map.get(p.friendId)!;
      if (p.status === 'pending') {
        row.owed    += p.share;
        row.pending += 1;
      } else {
        row.settled += 1;
      }
      if (!row.lastDate || split.date > row.lastDate) row.lastDate = split.date;
    }
  }

  return friends
    .map((f) => {
      const row = map.get(f.id) ?? { owed: 0, pending: 0, settled: 0, lastDate: null };
      return {
        friendId:         f.id,
        friend:           f,
        totalOwed:        Math.round(row.owed * 100) / 100,
        pendingCount:     row.pending,
        settledCount:     row.settled,
        totalSplits:      row.pending + row.settled,
        lastActivityDate: row.lastDate,
      };
    })
    .sort((a, b) => b.totalOwed - a.totalOwed);  // highest owed first
}

// ─── Equal split calculation ──────────────────────────────────────────────────
// Splits total among (you + participantCount friends).
// Rounds to 2dp and gives remainder to your share so the sum is always exact.
export function calcEqualShares(
  total:            number,
  participantCount: number,
): { friendShare: number; myShare: number } {
  if (participantCount <= 0) return { friendShare: 0, myShare: total };
  const perPerson    = Math.floor((total / (participantCount + 1)) * 100) / 100;
  const friendsTotal = perPerson * participantCount;
  const myShare      = Math.round((total - friendsTotal) * 100) / 100;
  return { friendShare: perPerson, myShare };
}

// ─── Validate custom shares ────────────────────────────────────────────────────
export function validateCustomShares(
  total:        number,
  shares:       Record<string, number>,
  friendIds:    string[],
): { valid: boolean; friendsTotal: number; myShare: number; error?: string } {
  const friendsTotal = friendIds.reduce((s, id) => s + (shares[id] ?? 0), 0);
  const myShare      = Math.round((total - friendsTotal) * 100) / 100;

  if (friendsTotal > total + 0.01) {
    return { valid: false, friendsTotal, myShare: 0, error: "Friends' shares exceed the total" };
  }
  if (myShare < 0) {
    return { valid: false, friendsTotal, myShare: 0, error: 'Your share cannot be negative' };
  }
  return { valid: true, friendsTotal, myShare };
}

// ─── Splits for one friend ────────────────────────────────────────────────────
export function splitsForFriend(splits: Split[], friendId: string): Split[] {
  return splits
    .filter((s) => s.participants.some((p) => p.friendId === friendId))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Total outstanding across all friends ────────────────────────────────────
export function totalOutstanding(splits: Split[]): number {
  return splits.reduce((total, split) =>
    total + split.participants
      .filter((p) => p.status === 'pending')
      .reduce((s, p) => s + p.share, 0),
  0);
}

// ─── Avatar colour from name — deterministic ─────────────────────────────────
const AVATAR_COLORS = [
  '#6366F1', '#10B981', '#F43F5E', '#F59E0B',
  '#14B8A6', '#8B5CF6', '#EC4899', '#0EA5E9',
];

export function nameToAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}