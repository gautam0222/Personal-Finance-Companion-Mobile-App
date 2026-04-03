import { initializeApp, getApp, getApps } from 'firebase/app';
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBCdu9Au0ZHndncOcAzeVd6VD2f7ICXK7U",
  authDomain: "flo-finance-6038b.firebaseapp.com",
  projectId: "flo-finance-6038b",
  storageBucket: "flo-finance-6038b.firebasestorage.app",
  messagingSenderId: "158823124867",
  appId: "1:158823124867:web:bc648522702b89d4ecf0b6",
  measurementId: "G-N6F236ZD75"
};

let app;
let auth: ReturnType<typeof getAuth>;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
