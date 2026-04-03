import * as SecureStore from 'expo-secure-store';

const PASSCODE_KEY = 'flo:app_passcode';
const PASSCODE_REGEX = /^\d{4}$/;

export function isValidPasscode(passcode: string): boolean {
  return PASSCODE_REGEX.test(passcode);
}

export async function hasAppPasscodeAsync(): Promise<boolean> {
  const existing = await SecureStore.getItemAsync(PASSCODE_KEY);
  return isValidPasscode(existing ?? '');
}

export async function saveAppPasscodeAsync(passcode: string): Promise<void> {
  if (!isValidPasscode(passcode)) {
    throw new Error('App passcode must be exactly 4 digits.');
  }

  await SecureStore.setItemAsync(PASSCODE_KEY, passcode);
}

export async function verifyAppPasscodeAsync(passcode: string): Promise<boolean> {
  if (!isValidPasscode(passcode)) {
    return false;
  }

  const existing = await SecureStore.getItemAsync(PASSCODE_KEY);
  return existing === passcode;
}

export async function removeAppPasscodeAsync(): Promise<void> {
  await SecureStore.deleteItemAsync(PASSCODE_KEY);
}
