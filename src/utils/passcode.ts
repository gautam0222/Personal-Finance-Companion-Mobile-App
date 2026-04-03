import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PASSCODE_KEY = 'flo:app_passcode';
const FALLBACK_KEY = '@flo:passcode_fallback';
const PASSCODE_REGEX = /^\d{4}$/;

export function isValidPasscode(passcode: string): boolean {
  return PASSCODE_REGEX.test(passcode);
}

async function getStoredPasscode(): Promise<string | null> {
  try {
    const existing = await SecureStore.getItemAsync(PASSCODE_KEY);
    if (existing) return existing;
  } catch {
    // Ignore SecureStore read errors
  }
  // Fallback
  try {
    return await AsyncStorage.getItem(FALLBACK_KEY);
  } catch {
    return null;
  }
}

export async function hasAppPasscodeAsync(): Promise<boolean> {
  const existing = await getStoredPasscode();
  return isValidPasscode(existing ?? '');
}

export async function saveAppPasscodeAsync(passcode: string): Promise<void> {
  if (!isValidPasscode(passcode)) {
    throw new Error('App passcode must be exactly 4 digits.');
  }

  let saved = false;
  try {
    await SecureStore.setItemAsync(PASSCODE_KEY, passcode);
    saved = true;
  } catch {
    // If SecureStore fails (common on emulators without screen lock), we fallback
  }

  if (!saved) {
    try {
      await AsyncStorage.setItem(FALLBACK_KEY, passcode);
    } catch {
      throw new Error('Failed to save passcode to both SecureStore and AsyncStorage.');
    }
  }
}

export async function verifyAppPasscodeAsync(passcode: string): Promise<boolean> {
  if (!isValidPasscode(passcode)) {
    return false;
  }

  const existing = await getStoredPasscode();
  return existing === passcode;
}

export async function removeAppPasscodeAsync(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PASSCODE_KEY);
  } catch {}
  try {
    await AsyncStorage.removeItem(FALLBACK_KEY);
  } catch {}
}
