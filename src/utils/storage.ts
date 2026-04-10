import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  APP_SETTINGS: '@flo:app_settings',
  TRANSACTIONS: '@flo:transactions',
  RECURRING_TRANSACTIONS: '@flo:recurring',
  GOALS: '@flo:goals',
  NET_WORTH_ENTRIES: '@flo:net_worth_entries',
  NET_WORTH_SNAPSHOTS: '@flo:net_worth_snapshots',
  FRIENDS: '@flo:friends',
  SPLITS: '@flo:splits',
  KARMA: '@flo:karma',
  LAST_LOG_DATE: '@flo:last_log_date',
  STREAK: '@flo:streak',
} as const;

export { KEYS };

async function getItem<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function setItem<T>(key: string, value: T): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

async function removeItem(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

async function clearAll(): Promise<boolean> {
  try {
    const keys = Object.values(KEYS);
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch {
    return false;
  }
}

async function getAllKeys(): Promise<readonly string[]> {
  try {
    return await AsyncStorage.getAllKeys();
  } catch {
    return [];
  }
}

export const Storage = {
  get: getItem,
  set: setItem,
  remove: removeItem,
  clearAll,
  getAllKeys,
  KEYS,
};
