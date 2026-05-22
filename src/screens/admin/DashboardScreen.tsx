import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { user } = useAuth();

  async function handleLogout() {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await signOut(auth);
          }
        }
      ]
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.role}>Administrador</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#e53935" />
        </TouchableOpacity>
      </View>

      {/* Cards resumo */}
      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: '#e8f0fe' }]}>
          <Ionicons name="car-outline" size={28} color="#1a73e8" />
          <Text style={styles.cardNum}>--</Text>
          <Text style={styles.cardLabel}>Veículos</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#fce8e6' }]}>
          <Ionicons name="construct-outline" size={28} color="#e53935" />
          <Text style={styles.cardNum}>--</Text>
          <Text style={styles.cardLabel}>Manutenções</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#e6f4ea' }]}>
          <Ionicons name="people-outline" size={28} color="#34a853" />
          <Text style={styles.cardNum}>--</Text>
          <Text style={styles.cardLabel}>Funcionários</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Acesso rápido</Text>

      <View style={styles.menuGrid}>
        <View style={styles.menuItem}>
          <Ionicons name="qr-code-outline" size={32} color="#1a73e8" />
          <Text style={styles.menuLabel}>QR Codes</Text>
        </View>
        <View style={styles.menuItem}>
          <Ionicons name="document-text-outline" size={32} color="#1a73e8" />
          <Text style={styles.menuLabel}>Relatórios</Text>
        </View>
        <View style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={32} color="#1a73e8" />
          <Text style={styles.menuLabel}>Alertas</Text>
        </View>
        <View style={styles.menuItem}>
          <Ionicons name="settings-outline" size={32} color="#1a73e8" />
          <Text style={styles.menuLabel}>Configurações</Text>
        </View>
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
    marginBottom: 24,
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
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  cardNum: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  cardLabel: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 14,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuItem: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a2e',
  },
});