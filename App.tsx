import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './src/config/firebase';

async function criarAdmin() {
  try {
    const CPF = '12117025960';
    const MATRICULA = '448923';
    const email = `${CPF}@ribasadmin.com`;
    const credential = await createUserWithEmailAndPassword(auth, email, MATRICULA);
    await setDoc(doc(db, 'users', credential.user.uid), {
      name: 'Administrador Ribas',
      email,
      role: 'admin',
      status: 'approved',
      cpf: CPF,
      matricula: MATRICULA,
      createdAt: Timestamp.now(),
    });
    console.log('✅ ADM criado com sucesso!');
  } catch (e: any) {
    console.log('ℹ️ Resultado:', e.code);
  }
}

export default function App() {
  useEffect(() => {
    criarAdmin();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}