import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface CloudBackupRecord {
  payload: string; // The AES-encrypted JSON string
  updatedAt: string;
}

export const uploadBackupToCloud = async (encryptedPayload: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to sync to the cloud.');
  }

  const backupRef = doc(db, 'backups', user.uid);
  const record: CloudBackupRecord = {
    payload: encryptedPayload,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(backupRef, record);
};

export const downloadBackupFromCloud = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to restore from the cloud.');
  }

  const backupRef = doc(db, 'backups', user.uid);
  const snap = await getDoc(backupRef);
  
  if (!snap.exists()) {
    return null;
  }

  const data = snap.data() as CloudBackupRecord;
  return data.payload;
};
