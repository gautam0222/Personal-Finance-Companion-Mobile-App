import * as ExpoHaptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';

export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;

function areHapticsEnabled(): boolean {
  return useAppStore.getState().settings.hapticsEnabled ?? true;
}

export async function selectionAsync(): Promise<void> {
  if (!areHapticsEnabled()) return;
  await ExpoHaptics.selectionAsync();
}

export async function impactAsync(
  style: ExpoHaptics.ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle.Light,
): Promise<void> {
  if (!areHapticsEnabled()) return;
  await ExpoHaptics.impactAsync(style);
}

export async function notificationAsync(
  type: ExpoHaptics.NotificationFeedbackType,
): Promise<void> {
  if (!areHapticsEnabled()) return;
  await ExpoHaptics.notificationAsync(type);
}
