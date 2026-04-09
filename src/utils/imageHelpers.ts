import { Directory, File, Paths } from 'expo-file-system';

const receiptsDirectory = new Directory(Paths.document, 'receipts');

function getFileExtension(uri: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : 'jpg';
}

async function ensureReceiptsDirectory(): Promise<void> {
  if (!receiptsDirectory.exists) {
    receiptsDirectory.create({ idempotent: true, intermediates: true });
  }
}

export async function saveReceiptImageLocally(sourceUri: string): Promise<string> {
  if (!sourceUri) {
    throw new Error('Receipt image URI is missing.');
  }

  if (sourceUri.startsWith(receiptsDirectory.uri)) {
    return sourceUri;
  }

  await ensureReceiptsDirectory();

  const ext = getFileExtension(sourceUri);
  const targetFile = new File(
    receiptsDirectory,
    `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`,
  );
  const sourceFile = new File(sourceUri);

  sourceFile.copy(targetFile);

  return targetFile.uri;
}

export async function deleteReceiptImage(uri: string): Promise<void> {
  if (!uri || !uri.startsWith(receiptsDirectory.uri)) {
    return;
  }

  const file = new File(uri);
  if (file.exists) {
    file.delete();
  }
}
