// Execute apenas uma vez para criar o ADM
// Depois delete este arquivo

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const CPF = '12345678900';        // CPF do ADM sem pontos
const MATRICULA = 'ADM001';       // Matrícula do ADM
const NOME = 'Administrador Ribas';

async function criarAdmin() {
  const email = `${CPF}@ribasadmin.com`;
  const credential = await createUserWithEmailAndPassword(auth, email, MATRICULA);
  await setDoc(doc(db, 'users', credential.user.uid), {
    name: NOME,
    email,
    role: 'admin',
    status: 'approved',
    cpf: CPF,
    matricula: MATRICULA,
    createdAt: Timestamp.now(),
  });
  console.log('ADM criado com sucesso!');
}

criarAdmin();