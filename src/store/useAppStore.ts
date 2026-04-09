import { create } from 'zustand';
import { AppSettings, Currency, ThemeMode } from '../types';
import { Storage } from '../utils/storage';

interface AppStore {
  settings: AppSettings;
  isLoading: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  completeOnboarding: (
    name: string,
    currency: Currency,
    symbol: string,
    budget: number,
  ) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  resetApp: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  avatarUri: undefined,
  currency: 'INR',
  currencySymbol: '₹',
  hasOnboarded: false,
  theme: 'dark',
  monthlyBudget: 0,
  appLockEnabled: false,
  biometricLockEnabled: false,
  lockGracePeriodSeconds: 30,
  notificationsEnabled: false,
  reminderHour: 20,
  reminderMinute: 0,
};

export const useAppStore = create<AppStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  isHydrated: false,

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const saved = await Storage.get<AppSettings>(Storage.KEYS.APP_SETTINGS);
      const merged = saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
      const settings: AppSettings = {
        ...merged,
        appLockEnabled:
          saved != null && 'appLockEnabled' in saved
            ? Boolean(merged.appLockEnabled)
            : Boolean(merged.biometricLockEnabled),
        biometricLockEnabled: Boolean(merged.biometricLockEnabled),
        lockGracePeriodSeconds: merged.lockGracePeriodSeconds ?? 30,
      };
      set({ settings, isHydrated: true });
    } catch {
      set({ settings: DEFAULT_SETTINGS, isHydrated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettings: async (partial) => {
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    await Storage.set(Storage.KEYS.APP_SETTINGS, next);
  },

  completeOnboarding: async (name, currency, symbol, budget) => {
    const next: AppSettings = {
      ...get().settings,
      userName: name.trim(),
      currency,
      currencySymbol: symbol,
      monthlyBudget: budget,
      hasOnboarded: true,
    };
    set({ settings: next });
    await Storage.set(Storage.KEYS.APP_SETTINGS, next);
  },

  setTheme: async (theme) => {
    const next = { ...get().settings, theme };
    set({ settings: next });
    await Storage.set(Storage.KEYS.APP_SETTINGS, next);
  },

  resetApp: async () => {
    await Storage.clearAll();
    set({ settings: DEFAULT_SETTINGS, isHydrated: true, isLoading: false });
  },
}));
