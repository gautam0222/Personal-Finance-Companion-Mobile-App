import { create } from 'zustand';
import { format } from 'date-fns';
import { RecurringTransaction, RecurrenceFrequency } from '../types';
import { Storage } from '../utils/storage';
import { computeNextDueDate, processAllDueRecurring } from '../utils/recurring';

function genId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type NewRecurring = Omit<
    RecurringTransaction,
    'id' | 'createdAt' | 'nextDueDate' | 'totalExecuted' | 'lastExecutedDate'
>;

interface RecurringStore {
    rules: RecurringTransaction[];
    isHydrated: boolean;
    isLoading: boolean;
    // Count of transactions auto-created in the most recent engine run
    lastAutoCreatedCount: number;

    hydrate: () => Promise<void>;
    addRule: (data: NewRecurring) => Promise<RecurringTransaction>;
    updateRule: (id: string, data: Partial<Omit<RecurringTransaction, 'id' | 'createdAt'>>) => Promise<void>;
    deleteRule: (id: string) => Promise<void>;
    toggleActive: (id: string) => Promise<void>;

    // Called by RootNavigator after all stores hydrate
    // Returns the total number of transactions created
    runEngine: (addTransactions: (txns: any[]) => Promise<void>) => Promise<number>;

    clearAutoCreatedCount: () => void;
}

export const useRecurringStore = create<RecurringStore>((set, get) => ({
    rules: [],
    isHydrated: false,
    isLoading: false,
    lastAutoCreatedCount: 0,

    hydrate: async () => {
        set({ isLoading: true });
        try {
            const saved = await Storage.get<RecurringTransaction[]>(
                Storage.KEYS.RECURRING_TRANSACTIONS,
            );
            set({ rules: saved ?? [], isHydrated: true });
        } catch {
            set({ rules: [], isHydrated: true });
        } finally {
            set({ isLoading: false });
        }
    },

    addRule: async (data) => {
        const rule: RecurringTransaction = {
            ...data,
            id: genId(),
            nextDueDate: data.startDate,   // first fire is on the start date
            totalExecuted: 0,
            createdAt: new Date().toISOString(),
        };
        const next = [rule, ...get().rules];
        set({ rules: next });
        await Storage.set(Storage.KEYS.RECURRING_TRANSACTIONS, next);
        return rule;
    },

    updateRule: async (id, data) => {
        const next = get().rules.map((r) => (r.id === id ? { ...r, ...data } : r));
        set({ rules: next });
        await Storage.set(Storage.KEYS.RECURRING_TRANSACTIONS, next);
    },

    deleteRule: async (id) => {
        const next = get().rules.filter((r) => r.id !== id);
        set({ rules: next });
        await Storage.set(Storage.KEYS.RECURRING_TRANSACTIONS, next);
    },

    toggleActive: async (id) => {
        const next = get().rules.map((r) =>
            r.id === id ? { ...r, isActive: !r.isActive } : r,
        );
        set({ rules: next });
        await Storage.set(Storage.KEYS.RECURRING_TRANSACTIONS, next);
    },

    runEngine: async (addTransactions) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const results = processAllDueRecurring(get().rules, today);

        if (results.length === 0) return 0;

        // Collect all new transactions across all rules
        const allNewTxns = results.flatMap((r) => r.transactionsCreated);

        // Write them to the transaction store in one batch
        if (allNewTxns.length > 0) {
            await addTransactions(allNewTxns);
        }

        // Update each rule's nextDueDate + counters
        const updatedRules = get().rules.map((rule) => {
            const result = results.find((r) => r.recurringId === rule.id);
            if (!result) return rule;
            return {
                ...rule,
                nextDueDate: result.updatedNextDueDate,
                lastExecutedDate: result.updatedLastExecuted,
                totalExecuted: result.updatedTotalExecuted,
            };
        });

        set({ rules: updatedRules, lastAutoCreatedCount: allNewTxns.length });
        await Storage.set(Storage.KEYS.RECURRING_TRANSACTIONS, updatedRules);

        return allNewTxns.length;
    },

    clearAutoCreatedCount: () => set({ lastAutoCreatedCount: 0 }),
}));