import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput, Image,
  Dimensions, FlatList
} from 'react-native';
import {
  doc, getDoc, updateDoc, collection, getDocs,
  query, where, orderBy, Timestamp, addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const SCREEN_W = Dimensions.get('window').width;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo', color: '#34a853', bg: '#e6f4ea', icon: 'checkmark-circle-outline' },
  { value: 'maintenance', label: 'Em manutenção', color: '#f57c00', bg: '#fff3e0', icon: 'construct-outline' },
  { value: 'inactive', label: 'Inativo', color: '#e53935', bg: '#fce8e6', icon: 'close-circle-outline' },
];

export default function VehicleDetailAdminScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<any>(null);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalStatus, setModalStatus] = useState(false);
  const [modalAddPhoto, setModalAddPhoto] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const vDoc = await getDoc(doc(db, 'vehicles', vehicleId));
      if (vDoc.exists()) {
        setVehicle({ id: vDoc.id, ...vDoc.data() });
      } else {
        setVehicle(null);
      }
    } catch (e) {
      console.log('Erro ao buscar veículo:', e);
      setVehicle(null);
    }

    try {
      const mSnap = await getDocs(
        query(collection(db, 'manutencoes'), where('vehicleId', '==', vehicleId))
      );
      const maint = mSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      maint.sort((a, b) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return tb - ta;
      });
      setMaintenances(maint);
    } catch (e) {
      console.log('Erro ao buscar manutenções:', e);
      setMaintenances([]);
    }

    setLoading(false);
  }

  async function handleStatusChange(newStatus: string) {
    try {
      await updateDoc(doc(db, 'vehicles', vehicleId), { status: newStatus });
      setVehicle((prev: any) => ({ ...prev, status: newStatus }));
      setModalStatus(false);
      Alert.alert('✅ Status atualizado!');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
  }

 async function handlePickFromCamera() {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.6,
    allowsEditing: true,
    aspect: [16, 9],
  });
  if (!result.canceled) {
    await uploadPhoto(result.assets[0].uri);
  }
}

async function handlePickFromGallery() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para selecionar fotos.');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.6,
    allowsEditing: true,
    aspect: [16, 9],
  });
  if (!result.canceled) {
    await uploadPhoto(result.assets[0].uri);
  }
}

async function uploadPhoto(uri: string) {
  setUploadingPhoto(true);
  try {
    console.log('Iniciando upload, URI:', uri);

    const response = await fetch(uri);
    const blob = await response.blob();
    console.log('Blob criado, tamanho:', blob.size);

    const storageRef = ref(storage, `vehicles/${vehicleId}/${Date.now()}.jpg`);
    console.log('Caminho no storage:', storageRef.fullPath);

    await uploadBytes(storageRef, blob);
    console.log('Upload concluído!');

    const url = await getDownloadURL(storageRef);
    console.log('URL obtida:', url);

    const currentPhotos = vehicle.photoUrls || [];
    const newPhotos = [...currentPhotos, url];
    await updateDoc(doc(db, 'vehicles', vehicleId), { photoUrls: newPhotos });
    setVehicle((prev: any) => ({ ...prev, photoUrls: newPhotos }));
    Alert.alert('✅ Foto adicionada!');
  } catch (e: any) {
    console.log('❌ ERRO DETALHADO:', e.code, '|', e.message);
    Alert.alert('Erro', `${e.code || 'erro'}: ${e.message || 'desconhecido'}`);
  } finally {
    setUploadingPhoto(false);
  }
}

function handleAddPhoto() {
  Alert.alert(
    'Adicionar foto',
    'De onde você quer adicionar a foto?',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: '📷 Câmera', onPress: handlePickFromCamera },
      { text: '🖼️ Galeria', onPress: handlePickFromGallery },
    ]
  );
}

  async function handleRemovePhoto(index: number) {
    Alert.alert('Remover foto', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          const newPhotos = (vehicle.photoUrls || []).filter((_: any, i: number) => i !== index);
          await updateDoc(doc(db, 'vehicles', vehicleId), { photoUrls: newPhotos });
          setVehicle((prev: any) => ({ ...prev, photoUrls: newPhotos }));
          setCurrentPhoto(0);
        }
      }
    ]);
  }

  function formatDate(ts: any) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('pt-BR');
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
      <TouchableOpacity
        style={{ position: 'absolute', top: 56, left: 16, backgroundColor: '#1a73e8', borderRadius: 10, padding: 10 }}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      <Ionicons name="alert-circle-outline" size={56} color="#ccc" />
      <Text style={{ marginTop: 12, color: '#888', fontSize: 15 }}>Veículo não encontrado</Text>
      <TouchableOpacity
        style={{ marginTop: 20, backgroundColor: '#1a73e8', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

  const photos: string[] = vehicle.photoUrls || [];
  const statusInfo = STATUS_OPTIONS.find(s => s.value === vehicle.status) || STATUS_OPTIONS[0];
  const typeLabel: any = { guindaste: '🏗️ Guindaste', caminhao: '🚛 Caminhão', veiculo: '🚗 Veículo' };
  const typeColor: any = { guindaste: '#1a73e8', caminhao: '#f57c00', veiculo: '#34a853' };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header banner */}
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
            <TouchableOpacity
              style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
              onPress={() => setModalStatus(true)}
            >
              <Ionicons name={statusInfo.icon as any} size={14} color="#fff" />
              <Text style={styles.statusBadgeText}>{statusInfo.label}</Text>
              <Ionicons name="chevron-down" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Carrossel de fotos */}
        <View style={styles.photoSection}>
          {photos.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={photos}
                keyExtractor={(_, i) => String(i)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={e => {
                  setCurrentPhoto(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
                }}
                renderItem={({ item, index }) => (
                  <View style={{ width: SCREEN_W, position: 'relative' }}>
                    <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {/* Dots */}
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

          <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhoto} disabled={uploadingPhoto}>
            {uploadingPhoto
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                <Ionicons name="camera-outline" size={18} color="#fff" />
                <Text style={styles.addPhotoBtnText}>Adicionar foto</Text>
              </>
            }
          </TouchableOpacity>
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
            {vehicle.cpfResponsavel && <InfoRow label="CPF Responsável" value={vehicle.cpfResponsavel} />}
            <InfoRow label="Cadastrado em" value={formatDate(vehicle.createdAt)} />
            {vehicle.createdByName && <InfoRow label="Cadastrado por" value={vehicle.createdByName} />}
          </View>
          {vehicle.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Observações</Text>
              <Text style={styles.notesText}>{vehicle.notes}</Text>
            </View>
          )}
        </View>

        {/* Histórico manutenções */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔧 Manutenções ({maintenances.length})</Text>
          </View>
          {maintenances.length === 0 ? (
            <View style={styles.emptyMaint}>
              <Ionicons name="checkmark-circle-outline" size={36} color="#ccc" />
              <Text style={styles.emptyMaintText}>Nenhuma manutenção registrada</Text>
            </View>
          ) : (
            maintenances.map(m => (
              <View key={m.id} style={[styles.maintCard, {
                borderLeftColor: m.type === 'preventive' ? '#1a73e8' : '#e53935'
              }]}>
                <View style={styles.maintHeader}>
                  <View style={[styles.maintTag, {
                    backgroundColor: m.type === 'preventive' ? '#e8f0fe' : '#fce8e6'
                  }]}>
                    <Text style={[styles.maintTagText, {
                      color: m.type === 'preventive' ? '#1a73e8' : '#e53935'
                    }]}>
                      {m.type === 'preventive' ? 'Preventiva' : 'Corretiva'}
                    </Text>
                  </View>
                  <View style={[styles.maintStatusTag, {
                    backgroundColor: m.status === 'completed' ? '#e6f4ea' : m.status === 'in_progress' ? '#fff3e0' : '#f5f5f5'
                  }]}>
                    <Text style={[styles.maintStatusText, {
                      color: m.status === 'completed' ? '#34a853' : m.status === 'in_progress' ? '#f57c00' : '#888'
                    }]}>
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

      {/* ─── MODAL STATUS ─── */}
      <Modal visible={modalStatus} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alterar status</Text>
              <TouchableOpacity onPress={() => setModalStatus(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            {STATUS_OPTIONS.map(s => (
              <TouchableOpacity
                key={s.value}
                style={[styles.statusOption, vehicle.status === s.value && { backgroundColor: s.bg, borderColor: s.color }]}
                onPress={() => handleStatusChange(s.value)}
              >
                <Ionicons name={s.icon as any} size={22} color={s.color} />
                <Text style={[styles.statusOptionText, { color: s.color }]}>{s.label}</Text>
                {vehicle.status === s.value && <Ionicons name="checkmark" size={18} color={s.color} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 6, alignSelf: 'flex-start' },
  bannerContent: { alignItems: 'center', gap: 6 },
  bannerEmoji: { fontSize: 48 },
  bannerName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  bannerPlate: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
  statusBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  photoSection: { backgroundColor: '#1a1a2e' },
  photo: { width: SCREEN_W, height: 220 },
  removePhotoBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(229,57,53,0.85)', borderRadius: 8, padding: 6 },
  noPhoto: { height: 160, justifyContent: 'center', alignItems: 'center', gap: 8 },
  noPhotoText: { color: '#888', fontSize: 14 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  addPhotoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1a73e8', margin: 12, borderRadius: 10, padding: 12 },
  addPhotoBtnText: { color: '#fff', fontWeight: '600' },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
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
  maintStatusText: { fontSize: 11, fontWeight: '600' },
  maintDesc: { fontSize: 14, color: '#1a1a2e', marginBottom: 8 },
  maintFooter: { flexDirection: 'row', gap: 10 },
  maintDate: { fontSize: 11, color: '#888' },
  maintBy: { fontSize: 11, color: '#888' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#e0e7ff' },
  statusOptionText: { flex: 1, fontSize: 15, fontWeight: '600' },
});