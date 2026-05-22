import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyB0NWGRGF8EWF26ecJ6AGQwpSg4ZadBrEg",
  authDomain: "ribasapp.firebaseapp.com",
  projectId: "ribasapp",
  storageBucket: "ribasapp.firebasestorage.app",
  messagingSenderId: "491740078806",
  appId: "1:491740078806:web:d1593dc3fc715fe1929f77"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);