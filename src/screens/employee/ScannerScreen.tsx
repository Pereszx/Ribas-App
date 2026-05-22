import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ScannerScreen() {
  const { user } = useAuth();

  async function handleLogout() {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: async () => await signOut(auth) }
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.role}>Funcionário</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#e53935" />
        </TouchableOpacity>
      </View>

      <View style={styles.scanArea}>
        <Ionicons name="qr-code-outline" size={80} color="#1a73e8" />
        <Text style={styles.scanTitle}>Scanner QR Code</Text>
        <Text style={styles.scanSubtitle}>
          Aponte a câmera para o QR Code do veículo para acessar sua ficha
        </Text>
        <TouchableOpacity style={styles.scanBtn}>
          <Ionicons name="camera-outline" size={22} color="#fff" />
          <Text style={styles.scanBtnText}>Abrir câmera</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  role: {
    fontSize: 13,
    color: '#1a73e8',
    fontWeight: '500',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#fce8e6',
    borderRadius: 10,
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  scanTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  scanSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  scanBtn: {
    flexDirection: 'row',
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});