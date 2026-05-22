import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function PendingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconArea}>
          <Ionicons name="time-outline" size={64} color="#f57c00" />
        </View>
        <Text style={styles.title}>Cadastro em análise</Text>
        <Text style={styles.subtitle}>
          Seu cadastro foi recebido e está aguardando aprovação do administrador.{'\n\n'}
          Você será notificado assim que seu acesso for liberado.
        </Text>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color="#1a73e8" />
          <Text style={styles.infoText}>
            Entre em contato com o seu gestor caso precise de acesso urgente.
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut(auth)}>
          <Ionicons name="log-out-outline" size={18} color="#e53935" />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  iconArea: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#fff8e1', justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  infoBox: {
    flexDirection: 'row', gap: 8, backgroundColor: '#e8f0fe',
    borderRadius: 10, padding: 14, marginBottom: 24, alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: '#1a73e8', lineHeight: 20 },
  logoutBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: '#fce8e6', borderRadius: 10, padding: 12, paddingHorizontal: 24,
  },
  logoutText: { color: '#e53935', fontWeight: '600', fontSize: 14 },
});