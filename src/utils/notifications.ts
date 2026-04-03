import Constants from 'expo-constants';
import { Platform } from 'react-native';

type ExpoNotificationsModule = typeof import('expo-notifications');

interface NotificationPermissionResult {
  granted: boolean;
  reason?: string;
}

const isExpoGo = Constants.executionEnvironment === 'storeClient';
let notificationsPromise: Promise<ExpoNotificationsModule> | null = null;
let handlerConfigured = false;

export function getNotificationSupport() {
  if (isExpoGo) {
    return {
      supported: false,
      reason:
        'Daily reminders need a development build on Expo SDK 53+, because Expo Go no longer fully supports expo-notifications on Android.',
    };
  }

  return { supported: true as const };
}

async function getNotificationsAsync(): Promise<ExpoNotificationsModule> {
  if (notificationsPromise == null) {
    notificationsPromise = import('expo-notifications');
  }

  const Notifications = await notificationsPromise;

  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  }

  return Notifications;
}

export async function ensureNotificationPermissionsAsync(): Promise<NotificationPermissionResult> {
  const support = getNotificationSupport();
  if (!support.supported) {
    return { granted: false, reason: support.reason };
  }

  const Notifications = await getNotificationsAsync();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminders', {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  if (
    existing.granted ||
    existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return { granted: true };
  }

  const requested = await Notifications.requestPermissionsAsync();
  return {
    granted:
      requested.granted ||
      requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL,
  };
}

export async function scheduleDailyReminderAsync(
  hour: number,
  minute: number,
): Promise<void> {
  const support = getNotificationSupport();
  if (!support.supported) {
    throw new Error(support.reason);
  }

  const Notifications = await getNotificationsAsync();

  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Check in with Flo Finance',
      body: "Log today's income or spending to keep your finances and Karma Score on track.",
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === 'android' ? 'daily-reminders' : undefined,
    },
  });
}

export async function disableDailyReminderAsync(): Promise<void> {
  const support = getNotificationSupport();
  if (!support.supported) {
    return;
  }

  const Notifications = await getNotificationsAsync();
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function formatReminderTime(hour: number, minute: number): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
