import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation, onFinish }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', credential.user.uid), {
        name: name.trim(),
        email: email.trim(),
        role: 'employee',
        status: 'pending',
        phone: phone || '',
        position: position || '',
        createdAt: Timestamp.now(),
      });

      // Logout imediato após cadastro
      await signOut(auth);

      Alert.alert(
        '✅ Cadastro realizado!',
        'Aguarde a aprovação do administrador para acessar o app.',
        [{
          text: 'OK',
          onPress: () => {
            if (onFinish) onFinish();       // reseta o isRegistering
            navigation.navigate('Login');
          }
        }]
      );
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Erro', 'Este e-mail já está cadastrado.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Erro', 'E-mail inválido.');
      } else {
        Alert.alert('Erro', `Código: ${error.code}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (onFinish) onFinish();
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back-outline" size={20} color="#1a73e8" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Funcionário — preencha seus dados</Text>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#f57c00" />
            <Text style={styles.infoText}>
              Após o cadastro, aguarde o administrador aprovar seu acesso.
            </Text>
          </View>

          <Text style={styles.label}>Nome completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome completo"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>E-mail *</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            placeholder="(41) 99999-9999"
            placeholderTextColor="#aaa"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Cargo / Função</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Operador de guindaste"
            placeholderTextColor="#aaa"
            value={position}
            onChangeText={setPosition}
          />

          <Text style={styles.label}>Senha *</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPass}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar senha *</Text>
          <TextInput
            style={styles.input}
            placeholder="Repita a senha"
            placeholderTextColor="#aaa"
            secureTextEntry
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Cadastrar</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backText: { color: '#1a73e8', fontSize: 14 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  infoBox: {
    flexDirection: 'row', gap: 8, backgroundColor: '#fff8e1',
    borderRadius: 10, padding: 12, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: '#f57c00',
  },
  infoText: { flex: 1, fontSize: 12, color: '#f57c00', lineHeight: 18 },
  label: { fontSize: 13, color: '#555', fontWeight: '500', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#f5f7ff', borderRadius: 10, padding: 14,
    fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0e7ff', marginBottom: 4,
  },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    backgroundColor: '#f5f7ff', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#e0e7ff',
  },
  button: {
    backgroundColor: '#1a73e8', borderRadius: 10,
    padding: 15, alignItems: 'center', marginTop: 20,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});