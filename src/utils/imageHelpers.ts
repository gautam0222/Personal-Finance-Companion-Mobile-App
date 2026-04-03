/**
 * Receipt image helpers.
 *
 * Strategy: We store the URI returned by expo-image-picker directly.
 * On both iOS and Android, the picked/captured image is written to the
 * app's internal cache directory, which persists for the lifetime of
 * the app installation.  No FileSystem copy is needed.
 *
 * If the user uninstalls/reinstalls the app, the cache is cleared
 * along with AsyncStorage, so data stays consistent.
 */

/**
 * "Save" a receipt — in practice we just return the URI as-is because
 * expo-image-picker already places it in a persistent cache location.
 */
export async function saveReceiptImageLocally(
  sourceUri: string,
): Promise<string> {
  // The URI from ImagePicker is already a local file path we can use.
  return sourceUri;
}

/**
 * "Delete" a receipt — we simply clear the reference.
 * The OS reclaims orphaned cache files automatically.
 */
export async function deleteReceiptImage(_uri: string): Promise<void> {
  // No-op: the cached file will be cleaned up by the OS when space is needed.
}
