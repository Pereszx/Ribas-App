import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Dimensions, FlatList
} from 'react-native';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_W = Dimensions.get('window').width;

export default function VehicleViewScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<any>(null);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const vDoc = await getDoc(doc(db, 'vehicles', vehicleId));
      if (vDoc.exists()) setVehicle({ id: vDoc.id, ...vDoc.data() });
    } catch (e) {
      console.log('Erro veículo:', e);
    }
    try {
      const mSnap = await getDocs(query(collection(db, 'manutencoes'), where('vehicleId', '==', vehicleId)));
      const maint = mSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      maint.sort((a, b) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return tb - ta;
      });
      setMaintenances(maint);
    } catch (e) {
      console.log('Erro manutenções:', e);
    }
    setLoading(false);
  }

  function formatDate(ts: any) {
    if (!ts) return '—';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('pt-BR');
    } catch { return '—'; }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.loading}>
        <TouchableOpacity style={styles.backFloating} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Ionicons name="alert-circle-outline" size={56} color="#ccc" />
        <Text style={{ marginTop: 12, color: '#888' }}>Veículo não encontrado</Text>
        <TouchableOpacity style={styles.backBtnFull} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photos: string[] = vehicle.photoUrls || [];
  const typeLabel: any = { guindaste: '🏗️ Guindaste', caminhao: '🚛 Caminhão', veiculo: '🚗 Veículo' };
  const typeColor: any = { guindaste: '#1a73e8', caminhao: '#f57c00', veiculo: '#34a853' };
  const statusLabel: any = { active: 'Ativo', maintenance: 'Em manutenção', inactive: 'Inativo' };
  const statusColor: any = { active: '#34a853', maintenance: '#f57c00', inactive: '#e53935' };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: typeColor[vehicle.type] || '#1a73e8' }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerEmoji}>
              {vehicle.type === 'guindaste' ? '🏗️' : vehicle.type === 'caminhao' ? '🚛' : '🚗'}
            </Text>
            <Text style={styles.bannerName}>{vehicle.name}</Text>
            <Text style={styles.bannerPlate}>{vehicle.plate}</Text>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor[vehicle.status] }]} />
              <Text style={styles.statusBadgeText}>{statusLabel[vehicle.status] || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Fotos (somente visualização) */}
        <View style={styles.photoSection}>
          {photos.length > 0 ? (
            <>
              <FlatList
                data={photos}
                keyExtractor={(_, i) => String(i)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={e => setCurrentPhoto(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
                )}
              />
              <View style={styles.dots}>
                {photos.map((_, i) => (
                  <View key={i} style={[styles.dot, i === currentPhoto && styles.dotActive]} />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.noPhoto}>
              <Ionicons name="camera-outline" size={40} color="#ccc" />
              <Text style={styles.noPhotoText}>Nenhuma foto cadastrada</Text>
            </View>
          )}
        </View>

        {/* Informações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Informações</Text>
          <View style={styles.infoBox}>
            <InfoRow label="Tipo" value={typeLabel[vehicle.type]} />
            <InfoRow label="Ano" value={String(vehicle.year)} />
            {vehicle.brand && <InfoRow label="Marca" value={vehicle.brand} />}
            {vehicle.model && <InfoRow label="Modelo" value={vehicle.model} />}
            {vehicle.color && <InfoRow label="Cor" value={vehicle.color} />}
            {vehicle.chassis && <InfoRow label="Chassi" value={vehicle.chassis} />}
          </View>
          {vehicle.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Observações</Text>
              <Text style={styles.notesText}>{vehicle.notes}</Text>
            </View>
          )}
        </View>

        {/* Histórico de manutenções (somente leitura) */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <Text style={styles.sectionTitle}>🔧 Manutenções ({maintenances.length})</Text>
          {maintenances.length === 0 ? (
            <View style={styles.emptyMaint}>
              <Ionicons name="checkmark-circle-outline" size={36} color="#ccc" />
              <Text style={styles.emptyMaintText}>Nenhuma manutenção registrada</Text>
            </View>
          ) : (
            maintenances.map(m => (
              <View key={m.id} style={[styles.maintCard, { borderLeftColor: m.type === 'preventive' ? '#1a73e8' : '#e53935' }]}>
                <View style={styles.maintHeader}>
                  <View style={[styles.maintTag, { backgroundColor: m.type === 'preventive' ? '#e8f0fe' : '#fce8e6' }]}>
                    <Text style={[styles.maintTagText, { color: m.type === 'preventive' ? '#1a73e8' : '#e53935' }]}>
                      {m.type === 'preventive' ? 'Preventiva' : 'Corretiva'}
                    </Text>
                  </View>
                  <View style={[styles.maintStatusTag, {
                    backgroundColor: m.status === 'completed' ? '#e6f4ea' : m.status === 'in_progress' ? '#fff3e0' : '#f5f5f5'
                  }]}>
                    <Text style={{
                      fontSize: 11, fontWeight: '600',
                      color: m.status === 'completed' ? '#34a853' : m.status === 'in_progress' ? '#f57c00' : '#888'
                    }}>
                      {m.status === 'completed' ? 'Concluída' : m.status === 'in_progress' ? 'Em andamento' : 'Pendente'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.maintDesc}>{m.description}</Text>
                <View style={styles.maintFooter}>
                  <Text style={styles.maintDate}>{formatDate(m.createdAt)}</Text>
                  <Text style={styles.maintBy}>por {m.createdByName || 'Sistema'}</Text>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  label: { fontSize: 13, color: '#888' },
  value: { fontSize: 13, color: '#1a1a2e', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' },
  backFloating: { position: 'absolute', top: 56, left: 16, backgroundColor: '#1a73e8', borderRadius: 10, padding: 10 },
  backBtnFull: { marginTop: 20, backgroundColor: '#1a73e8', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  banner: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 6, alignSelf: 'flex-start' },
  bannerContent: { alignItems: 'center', gap: 6 },
  bannerEmoji: { fontSize: 48 },
  bannerName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  bannerPlate: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  photoSection: { backgroundColor: '#1a1a2e' },
  photo: { width: SCREEN_W, height: 220 },
  noPhoto: { height: 160, justifyContent: 'center', alignItems: 'center', gap: 8 },
  noPhotoText: { color: '#888', fontSize: 14 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 14 },
  infoBox: { gap: 2 },
  notesBox: { marginTop: 12, backgroundColor: '#f5f7ff', borderRadius: 10, padding: 12 },
  notesLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  notesText: { fontSize: 14, color: '#1a1a2e' },
  emptyMaint: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyMaintText: { color: '#aaa', fontSize: 14 },
  maintCard: { backgroundColor: '#f5f7ff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 3 },
  maintHeader: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  maintTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  maintTagText: { fontSize: 11, fontWeight: '600' },
  maintStatusTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  maintDesc: { fontSize: 14, color: '#1a1a2e', marginBottom: 8 },
  maintFooter: { flexDirection: 'row', gap: 10 },
  maintDate: { fontSize: 11, color: '#888' },
  maintBy: { fontSize: 11, color: '#888' },
});