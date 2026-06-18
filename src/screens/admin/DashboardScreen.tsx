import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Dimensions, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
const SCREEN_W = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVehicles: 0, activeVehicles: 0, maintenanceVehicles: 0,
    totalEmployees: 0, pendingApproval: 0,
    pendingMaint: 0, inProgressMaint: 0, completedMaint: 0,
    preventive: 0, corrective: 0,
    expiredDocs: 0, warningDocs: 0,
  });

  useFocusEffect(
  useCallback(() => {
    loadStats();
  }, [])
);

  async function loadStats() {
    setLoading(true);
    try {
      const [vSnap, uSnap, mSnap, dSnap] = await Promise.all([
        getDocs(collection(db, 'vehicles')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'manutencoes')),
        getDocs(collection(db, 'employeeDocuments')),
      ]);

      const vehicles = vSnap.docs.map(d => d.data());
      const users = uSnap.docs.map(d => d.data());
      const maints = mSnap.docs.map(d => d.data());
      const docs = dSnap.docs.map(d => d.data());

      const today = new Date();
      let expiredDocs = 0, warningDocs = 0;
      docs.forEach((d: any) => {
        if (!d.expirationDate) return;
        const exp = d.expirationDate.toDate ? d.expirationDate.toDate() : new Date(d.expirationDate);
        const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) expiredDocs++;
        else if (diff <= 30) warningDocs++;
      });

      setStats({
        totalVehicles: vehicles.length,
        activeVehicles: vehicles.filter((v: any) => v.status === 'active').length,
        maintenanceVehicles: vehicles.filter((v: any) => v.status === 'maintenance').length,
        totalEmployees: users.filter((u: any) => u.role === 'employee' && u.status === 'approved').length,
        pendingApproval: users.filter((u: any) => u.role === 'employee' && u.status === 'pending').length,
        pendingMaint: maints.filter((m: any) => m.status === 'pending').length,
        inProgressMaint: maints.filter((m: any) => m.status === 'in_progress').length,
        completedMaint: maints.filter((m: any) => m.status === 'completed').length,
        preventive: maints.filter((m: any) => m.type === 'preventive').length,
        corrective: maints.filter((m: any) => m.type === 'corrective').length,
        expiredDocs, warningDocs,
      });
    } catch (e) {
      console.log('Erro dashboard:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut(auth) }
    ]);
  }

  // Gráfico de barras simples
  function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
    const max = Math.max(...data.map(d => d.value), 1);
    const barW = (SCREEN_W - 80) / data.length - 12;
    return (
      <View style={chartStyles.container}>
        <View style={chartStyles.barsRow}>
          {data.map((item, i) => (
            <View key={i} style={chartStyles.barCol}>
              <Text style={chartStyles.barValue}>{item.value}</Text>
              <View style={[chartStyles.bar, {
                height: Math.max((item.value / max) * 100, 4),
                backgroundColor: item.color,
                width: barW,
              }]} />
              <Text style={chartStyles.barLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Gráfico de pizza simples (dois valores)
  function DonutChart({ value, total, color, label }: { value: number; total: number; color: string; label: string }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <View style={donutStyles.container}>
        <View style={[donutStyles.circle, { borderColor: color }]}>
          <Text style={[donutStyles.pct, { color }]}>{pct}%</Text>
          <Text style={donutStyles.pctLabel}>{label}</Text>
        </View>
        <Text style={donutStyles.values}>{value} / {total}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  const totalMaint = stats.pendingMaint + stats.inProgressMaint + stats.completedMaint;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.role}>Administrador</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#e53935" />
        </TouchableOpacity>
      </View>

      {/* Alertas */}
      {(stats.expiredDocs > 0 || stats.warningDocs > 0 || stats.pendingApproval > 0) && (
        <View style={styles.alertsBox}>
          {stats.expiredDocs > 0 && (
            <View style={styles.alertItem}>
              <Ionicons name="warning" size={16} color="#e53935" />
              <Text style={styles.alertTextRed}>{stats.expiredDocs} documento(s) vencido(s)</Text>
            </View>
          )}
          {stats.warningDocs > 0 && (
            <View style={styles.alertItem}>
              <Ionicons name="warning-outline" size={16} color="#f57c00" />
              <Text style={styles.alertTextOrange}>{stats.warningDocs} documento(s) vence(m) em breve</Text>
            </View>
          )}
          {stats.pendingApproval > 0 && (
            <View style={styles.alertItem}>
              <Ionicons name="person-add-outline" size={16} color="#1a73e8" />
              <Text style={styles.alertTextBlue}>{stats.pendingApproval} funcionário(s) aguardando aprovação</Text>
            </View>
          )}
        </View>
      )}

      {/* Cards resumo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visão geral</Text>
        <View style={styles.cardsGrid}>
          <StatCard icon="car-outline" label="Veículos" value={stats.totalVehicles} color="#1a73e8" bg="#e8f0fe" />
          <StatCard icon="construct-outline" label="Em manutenção" value={stats.maintenanceVehicles} color="#f57c00" bg="#fff3e0" />
          <StatCard icon="people-outline" label="Funcionários" value={stats.totalEmployees} color="#34a853" bg="#e6f4ea" />
          <StatCard icon="time-outline" label="Pendentes RH" value={stats.pendingApproval} color="#e53935" bg="#fce8e6" />
        </View>
      </View>

      {/* Gráfico manutenções por status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manutenções por status</Text>
        <View style={styles.chartCard}>
          <BarChart data={[
            { label: 'Pendentes', value: stats.pendingMaint, color: '#f57c00' },
            { label: 'Andamento', value: stats.inProgressMaint, color: '#1a73e8' },
            { label: 'Concluídas', value: stats.completedMaint, color: '#34a853' },
          ]} />
        </View>
      </View>

      {/* Gráfico preventiva vs corretiva */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tipo de manutenção</Text>
        <View style={styles.chartCard}>
          <BarChart data={[
            { label: 'Preventiva', value: stats.preventive, color: '#1a73e8' },
            { label: 'Corretiva', value: stats.corrective, color: '#e53935' },
          ]} />
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#1a73e8' }]} />
              <Text style={styles.legendText}>Preventiva: {stats.preventive}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#e53935' }]} />
              <Text style={styles.legendText}>Corretiva: {stats.corrective}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Taxa de conclusão */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Indicadores</Text>
        <View style={styles.donutRow}>
          <DonutChart
            value={stats.completedMaint}
            total={totalMaint}
            color="#34a853"
            label="Concluídas"
          />
          <DonutChart
            value={stats.activeVehicles}
            total={stats.totalVehicles}
            color="#1a73e8"
            label="Ativos"
          />
          <DonutChart
            value={stats.totalEmployees}
            total={stats.totalEmployees + stats.pendingApproval}
            color="#f57c00"
            label="Aprovados"
          />
        </View>
      </View>

      {/* Frota */}
      <View style={[styles.section, { marginBottom: 32 }]}>
        <Text style={styles.sectionTitle}>Status da frota</Text>
        <View style={styles.chartCard}>
          <BarChart data={[
            { label: 'Ativos', value: stats.activeVehicles, color: '#34a853' },
            { label: 'Manutenção', value: stats.maintenanceVehicles, color: '#f57c00' },
            { label: 'Inativos', value: stats.totalVehicles - stats.activeVehicles - stats.maintenanceVehicles, color: '#e53935' },
          ]} />
        </View>
      </View>

    </ScrollView>
  );
}

function StatCard({ icon, label, value, color, bg }: any) {
  return (
    <View style={[statStyles.card, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { width: '47%', borderRadius: 14, padding: 16, alignItems: 'center', gap: 6 },
  value: { fontSize: 28, fontWeight: 'bold' },
  label: { fontSize: 12, color: '#555', textAlign: 'center' },
});

const chartStyles = StyleSheet.create({
  container: { paddingVertical: 8 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 130, paddingBottom: 4 },
  barCol: { alignItems: 'center', gap: 4 },
  bar: { borderRadius: 6 },
  barValue: { fontSize: 12, fontWeight: 'bold', color: '#1a1a2e' },
  barLabel: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4 },
});

const donutStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 6 },
  circle: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 6, justifyContent: 'center', alignItems: 'center',
  },
  pct: { fontSize: 15, fontWeight: 'bold' },
  pctLabel: { fontSize: 9, color: '#888' },
  values: { fontSize: 11, color: '#888' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  role: { fontSize: 13, color: '#1a73e8', fontWeight: '500', marginTop: 2 },
  logoutBtn: { backgroundColor: '#fce8e6', borderRadius: 10, padding: 8 },
  alertsBox: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, gap: 8, marginBottom: 4,
    borderLeftWidth: 4, borderLeftColor: '#e53935',
  },
  alertItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertTextRed: { fontSize: 13, color: '#e53935', fontWeight: '500' },
  alertTextOrange: { fontSize: 13, color: '#f57c00', fontWeight: '500' },
  alertTextBlue: { fontSize: 13, color: '#1a73e8', fontWeight: '500' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chartCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#555' },
  donutRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
});