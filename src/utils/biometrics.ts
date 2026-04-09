import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricSupportResult {
  supported: boolean;
  label: string;
  hasStrongBiometrics: boolean;
  reason?: string;
}

function getBiometricLabel(
  types: LocalAuthentication.AuthenticationType[],
): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return Platform.OS === 'ios' ? 'Face ID' : 'Face unlock';
  }

  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
  }

  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Iris';
  }

  return 'Biometrics';
}

export async function getBiometricSupportAsync(): Promise<BiometricSupportResult> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    return {
      supported: false,
      label: 'Biometrics',
      hasStrongBiometrics: false,
      reason: 'This device does not support biometric authentication.',
    };
  }

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  const label = getBiometricLabel(types);

  if (!isEnrolled) {
    return {
      supported: false,
      label,
      hasStrongBiometrics: false,
      reason: 'No fingerprint, Face ID, or device biometrics are enrolled on this device.',
    };
  }

  return {
    supported: level >= LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK,
    label,
    hasStrongBiometrics: level >= LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG,
    reason:
      level >= LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK
        ? undefined
        : 'Your device has a screen lock, but no enrolled biometrics are available for quick unlock.',
  };
}

export async function authenticateForUnlockAsync(
  promptMessage: string = 'Unlock WalletWarp',
): Promise<boolean> {
  const support = await getBiometricSupportAsync();
  if (!support.supported) {
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    disableDeviceFallback: false,
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use device passcode',
    // On Android, requesting "strong" can exclude camera-based face unlock on
    // devices where fingerprint is Class 3 but face is only Class 2. Using
    // "weak" still allows strong biometrics while also permitting enrolled face
    // unlock when the device exposes it through BiometricPrompt.
    biometricsSecurityLevel: Platform.OS === 'android' ? 'weak' : undefined,
  });

  return result.success;
}
