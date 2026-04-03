import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { AppSettings, Goal, Transaction } from '../types';

export async function exportAppDataAsync(
  settings: AppSettings,
  transactions: Transaction[],
  goals: Goal[],
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileUri = `${FileSystem.cacheDirectory}flo-finance-export-${timestamp}.json`;

  const payload = {
    app: 'Flo Finance',
    exportedAt: new Date().toISOString(),
    settings,
    transactions,
    goals,
  };

  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'Export Flo Finance data',
    });
  }

  return fileUri;
}
