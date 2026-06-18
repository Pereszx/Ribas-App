import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';

type LoginMode = 'employee' | 'admin';

export default function LoginScreen({ navigation, onGoToRegister }: any) {
  const [mode, setMode] = useState<LoginMode>('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [matricula, setMatricula] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  function formatCpf(value: string) {
    const nums = value.replace(/\D/g, '').slice(0, 11);
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  async function handleLogin() {
    if (mode === 'admin') {
      if (!cpf || !matricula || !adminPassword) {
        Alert.alert('Atenção', 'Preencha CPF, matrícula e senha.');
        return;
      }
      if (adminPassword !== '123321') {
        Alert.alert('Acesso negado', 'Senha incorreta.');
        return;
      }
      const adminEmail = `${cpf.replace(/\D/g, '')}@ribasadmin.com`;
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, adminEmail, matricula.trim());
      } catch {
        Alert.alert('Acesso negado', 'CPF ou matrícula incorretos.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!email || !password) {
        Alert.alert('Atenção', 'Preencha e-mail e senha.');
        return;
      }
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch {
        Alert.alert('Erro ao entrar', 'E-mail ou senha incorretos.');
      } finally {
        setLoading(false);
      }
    }
  }

  function handleGoToRegister() {
    if (onGoToRegister) onGoToRegister();
    navigation.navigate('Register');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>GR</Text>
          </View>
          <Text style={styles.title}>Guindastes Ribas</Text>
          <Text style={styles.subtitle}>Gestão de Manutenção</Text>
        </View>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'employee' && styles.modeBtnActive]}
            onPress={() => setMode('employee')}
          >
            <Ionicons name="construct-outline" size={16} color={mode === 'employee' ? '#fff' : '#888'} />
            <Text style={[styles.modeBtnText, mode === 'employee' && styles.modeBtnTextActive]}>
              Funcionário
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'admin' && styles.modeBtnActive]}
            onPress={() => setMode('admin')}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color={mode === 'admin' ? '#fff' : '#888'} />
            <Text style={[styles.modeBtnText, mode === 'admin' && styles.modeBtnTextActive]}>
              Administrador
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {mode === 'admin' ? (
            <>
              <Text style={styles.fieldLabel}>CPF</Text>
              <TextInput
                style={styles.input}
                placeholder="000.000.000-00"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={cpf}
                onChangeText={v => setCpf(formatCpf(v))}
              />
              <Text style={styles.fieldLabel}>Matrícula</Text>
              <TextInput
                style={styles.input}
                placeholder="Matrícula da empresa"
                placeholderTextColor="#aaa"
                value={matricula}
                onChangeText={setMatricula}
              />
              <Text style={styles.fieldLabel}>Senha</Text>
              <View style={styles.passRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Senha de acesso"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showAdminPass}
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowAdminPass(!showAdminPass)}>
                  <Ionicons name={showAdminPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.fieldLabel}>E-mail</Text>
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
              <Text style={styles.fieldLabel}>Senha</Text>
              <View style={styles.passRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Senha"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Entrar</Text>
            }
          </TouchableOpacity>

          {mode === 'employee' && (
            <TouchableOpacity style={styles.linkButton} onPress={handleGoToRegister}>
              <Text style={styles.linkText}>
                Não tem conta? <Text style={styles.linkBold}>Cadastre-se</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  logoText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 4 },
  modeRow: {
    flexDirection: 'row', gap: 10, marginBottom: 16,
    backgroundColor: '#fff', borderRadius: 14, padding: 4,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 12, borderRadius: 10,
  },
  modeBtnActive: { backgroundColor: '#1a73e8' },
  modeBtnText: { color: '#888', fontWeight: '600', fontSize: 13 },
  modeBtnTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  fieldLabel: { fontSize: 13, color: '#555', fontWeight: '500', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#f5f7ff', borderRadius: 10, padding: 14,
    fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0e7ff', marginBottom: 4,
  },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  eyeBtn: {
    backgroundColor: '#f5f7ff', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#e0e7ff',
  },
  button: {
    backgroundColor: '#1a73e8', borderRadius: 10,
    padding: 15, alignItems: 'center', marginTop: 20,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#888', fontSize: 14 },
  linkBold: { color: '#1a73e8', fontWeight: 'bold' },
});