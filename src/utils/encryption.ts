import CryptoJS from 'crypto-js';
import { AppSettings, Goal, Transaction } from '../types';

export interface AppStateDump {
  settings: AppSettings;
  transactions: Transaction[];
  goals: Goal[];
  exportedAt: string;
}

export const createEncryptedBackup = (
  state: AppStateDump,
  encryptionKey: string
): string => {
  const jsonPayload = JSON.stringify(state);
  // AES-256 encryption
  const encrypted = CryptoJS.AES.encrypt(jsonPayload, encryptionKey).toString();
  return encrypted;
};

export const decryptBackup = (
  encryptedPayload: string,
  encryptionKey: string
): AppStateDump => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPayload, encryptionKey);
    const decryptedJson = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedJson) {
      throw new Error('Invalid password or corrupted backup.');
    }
    
    const parsed = JSON.parse(decryptedJson) as AppStateDump;
    
    // Basic validation
    if (!parsed.settings || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.goals)) {
      throw new Error('Invalid backup format.');
    }
    
    return parsed;
  } catch (error) {
    throw new Error('Decryption failed. Please check your password.');
  }
};
