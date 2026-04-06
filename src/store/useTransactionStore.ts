import { create } from 'zustand';
import {
  endOfDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { FilterState, Transaction } from '../types';
import { Storage } from '../utils/storage';

function genId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function applyFilters(transactions: Transaction[], filter: FilterState): Transaction[] {
  let result = [...transactions];

  if (filter.type !== 'all') {
    result = result.filter((transaction) => transaction.type === filter.type);
  }

  if (filter.category) {
    result = result.filter((transaction) => transaction.category === filter.category);
  }

  if (filter.dateRange !== 'all') {
    const now = new Date();
    let start: Date;
    const end = endOfDay(now);

    switch (filter.dateRange) {
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(now);
        break;
      case '3months':
        start = startOfMonth(subMonths(now, 2));
        break;
      default:
        start = new Date(0);
    }

    result = result.filter((transaction) => {
      const date = parseISO(transaction.date);
      return isWithinInterval(date, { start: startOfDay(start), end });
    });
  }

  if (filter.searchQuery.trim()) {
    const query = filter.searchQuery.trim().toLowerCase();
    result = result.filter((transaction) =>
      (transaction.note ?? '').toLowerCase().includes(query) ||
      transaction.category.toLowerCase().includes(query) ||
      transaction.amount.toString().includes(query),
    );
  }

  result.sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );

  return result;
}

interface TransactionStore {
  transactions: Transaction[];
  filter: FilterState;
  isLoading: boolean;
  isHydrated: boolean;
  getFiltered: () => Transaction[];
  hydrate: () => Promise<void>;
  addTransaction: (
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<Transaction>;
  bulkAddTransactions: (newTransactions: Transaction[]) => Promise<void>;
  updateTransaction: (
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'createdAt'>>,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteAllTransactions: () => Promise<void>;
  restoreState: (transactions: Transaction[]) => Promise<void>;
  setFilter: (partial: Partial<FilterState>) => void;
  resetFilter: () => void;
}

const DEFAULT_FILTER: FilterState = {
  type: 'all',
  dateRange: 'all',
  category: null,
  searchQuery: '',
};

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  filter: DEFAULT_FILTER,
  isLoading: false,
  isHydrated: false,

  getFiltered: () => applyFilters(get().transactions, get().filter),

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const saved = await Storage.get<Transaction[]>(Storage.KEYS.TRANSACTIONS);
      set({ transactions: saved ?? [], isHydrated: true });
    } catch {
      set({ transactions: [], isHydrated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  addTransaction: async (data) => {
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...data,
      id: genId(),
      createdAt: now,
      updatedAt: now,
    };
    const next = [transaction, ...get().transactions];
    set({ transactions: next });
    await Storage.set(Storage.KEYS.TRANSACTIONS, next);
    return transaction;
  },

  bulkAddTransactions: async (newTransactions) => {
    const combined = [...newTransactions, ...get().transactions];
    combined.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    set({ transactions: combined });
    await Storage.set(Storage.KEYS.TRANSACTIONS, combined);
  },

  updateTransaction: async (id, data) => {
    const next = get().transactions.map((transaction) =>
      transaction.id === id
        ? { ...transaction, ...data, updatedAt: new Date().toISOString() }
        : transaction,
    );
    set({ transactions: next });
    await Storage.set(Storage.KEYS.TRANSACTIONS, next);
  },

  deleteTransaction: async (id) => {
    const next = get().transactions.filter((transaction) => transaction.id !== id);
    set({ transactions: next });
    await Storage.set(Storage.KEYS.TRANSACTIONS, next);
  },

  deleteAllTransactions: async () => {
    set({ transactions: [] });
    await Storage.set(Storage.KEYS.TRANSACTIONS, []);
  },

  restoreState: async (transactions) => {
    set({ transactions });
    await Storage.set(Storage.KEYS.TRANSACTIONS, transactions);
  },

  setFilter: (partial) => {
    set({ filter: { ...get().filter, ...partial } });
  },

  resetFilter: () => {
    set({ filter: DEFAULT_FILTER });
  },
}));
