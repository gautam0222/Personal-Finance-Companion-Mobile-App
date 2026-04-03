import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';

import { auth } from '../utils/firebase';
import { uploadBackupToCloud, downloadBackupFromCloud } from '../utils/cloudSync';
import { createEncryptedBackup, decryptBackup } from '../utils/encryption';
import { useTheme } from '../hooks/useTheme';
import { Spacing, Radius } from '../constants/spacing';
import { FontSize } from '../constants/typography';
import { Input } from '../components/common/Input';

import { useAppStore } from '../store/useAppStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useGoalStore } from '../store/useGoalStore';

type NavProp = NativeStackNavigationProp<any>;

export const BackupScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<NavProp>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const appState = useAppStore();
  const txStore = useTransactionStore();
  const goalStore = useGoalStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingContext(false);
    });
    return unsub;
  }, []);

  const handleLoginSignup = async () => {
    if (!email || !password || password.length < 6) {
      Alert.alert('Invalid Input', 'Please provide a valid email and a password of at least 6 characters.');
      return;
    }
    setBusyAction('auth');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert('Account Created', 'Your secure vault account has been created.');
      } catch (e: any) {
        Alert.alert('Authentication Failed', e.message);
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleLogout = async () => {
    setBusyAction('logout');
    await signOut(auth);
    setEmail('');
    setPassword('');
    setBusyAction(null);
  };

  const handleBackup = async () => {
    if (!password) {
      Alert.alert('Missing Password', 'Please re-enter your encryption password to secure the backup.');
      return;
    }
    Alert.alert('Backup to Cloud', 'This will override any existing backup in the cloud. Proceed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Backup', style: 'default', onPress: executeBackup }
    ]);
  };

  const executeBackup = async () => {
    setBusyAction('backup');
    try {
      const dump = {
        settings: appState.settings,
        transactions: txStore.transactions,
        goals: goalStore.goals,
        exportedAt: new Date().toISOString()
      };
      const encrypted = createEncryptedBackup(dump, password);
      await uploadBackupToCloud(encrypted);
      Alert.alert('Success', 'Your data is securely backed up to the cloud.');
    } catch (e: any) {
      Alert.alert('Backup Failed', e.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleRestore = async () => {
    if (!password) {
      Alert.alert('Missing Password', 'Please re-enter your encryption password to unlock the backup.');
      return;
    }
    Alert.alert('Restore Data', 'This will OVERWRITE all your current local data. This cannot be undone. Proceed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', style: 'destructive', onPress: executeRestore }
    ]);
  };

  const executeRestore = async () => {
    setBusyAction('restore');
    try {
      const encrypted = await downloadBackupFromCloud();
      if (!encrypted) {
        Alert.alert('No Backup Found', 'There is no backup associated with this account.');
        return;
      }
      const decrypted = decryptBackup(encrypted, password);
      
      // Override local stores and persist to AsyncStorage
      const { settings, transactions, goals } = decrypted;
      await appState.updateSettings(settings);
      await txStore.restoreState(transactions);
      await goalStore.restoreState(goals);
      
      Alert.alert('Restore Complete', 'Your local app data has been fully overwritten with the cloud backup.');
    } catch (e: any) {
      Alert.alert('Restore Failed', e.message);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Cloud Sync (Beta)</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loadingContext ? (
          <ActivityIndicator color={colors.primary} />
        ) : !currentUser ? (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Secure Vault Access</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Create or access your private encrypted backup vault. Your password never leaves your device and acts as your End-to-End Encryption key.
            </Text>
            
            <Input label="Vault Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Input label="Vault Encryption Password" value={password} onChangeText={setPassword} secureTextEntry />
            
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: colors.primary, marginTop: Spacing[4] }]}
              onPress={handleLoginSignup}
              disabled={busyAction !== null}
            >
              <Text style={styles.btnText}>{busyAction === 'auth' ? 'Authenticating...' : 'Access Vault'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Vault Connected</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Logged in as {currentUser.email}. To backup or restore, please confirm your Encryption Password to lock/unlock the data.
            </Text>
            
            <Input label="Verify Encryption Password" value={password} onChangeText={setPassword} secureTextEntry />

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: colors.success, flex: 1 }]}
                onPress={handleBackup}
                disabled={busyAction !== null}
              >
                <Text style={styles.btnText}>{busyAction === 'backup' ? 'Working...' : 'Backup'}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: '#F43F5E', flex: 1 }]}
                onPress={handleRestore}
                disabled={busyAction !== null}
              >
                <Text style={styles.btnText}>{busyAction === 'restore' ? 'Working...' : 'Restore'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ marginTop: Spacing[6] }} onPress={handleLogout}>
              <Text style={{ color: colors.primary, textAlign: 'center', fontWeight: '600' }}>Log Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: '700', flex: 1, textAlign: 'center' },
  scroll: { padding: Spacing[4] },
  card: { padding: Spacing[5], borderRadius: Radius.xl, borderWidth: 1, borderColor: '#333' },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing[2] },
  cardSubtitle: { fontSize: FontSize.sm, marginBottom: Spacing[5], lineHeight: 20 },
  btn: { padding: Spacing[4], borderRadius: Radius.lg, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: FontSize.md },
  actionRow: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[5] }
});
