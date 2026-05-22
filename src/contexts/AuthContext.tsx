import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AppUser } from '../types';

interface AuthContextData {
  user: AppUser | null;
  firebaseUser: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser(fbUser: User) {
    try {
      const docRef = doc(db, 'users', fbUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUser({ uid: fbUser.uid, ...docSnap.data() } as AppUser);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.log('Erro fetchUser:', e);
      setUser(null);
    }
  }

  async function refreshUser() {
    if (firebaseUser) await fetchUser(firebaseUser);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          setFirebaseUser(fbUser);
          await fetchUser(fbUser);
        } else {
          setFirebaseUser(null);
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    const timeout = setTimeout(() => setLoading(false), 10000);
    return () => { unsubscribe(); clearTimeout(timeout); };
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);