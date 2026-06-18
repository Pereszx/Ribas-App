import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Modal, ScrollView, ActivityIndicator, Image
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { doc, getDoc, collection, getDocs, query, where, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function ScannerScreen() {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [vehicle, setVehicle] = useState<any>(null);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalReport, setModalReport] = useState(false);
  const [reportDesc, setReportDesc] = useState('');
  const [reportType, setReportType] = useState<'preventive' | 'corrective'>('corrective');
  const [savingReport, setSavingReport] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    setScanning(false);
    setLoadingVehicle(true);
    setModalVisible(true);

    try {
      const vehicleDoc = await getDoc(doc(db, 'vehicles', data));
      if (!vehicleDoc.exists()) {
        Alert.alert('QR Code inválido', 'Veículo não encontrado.');
        setModalVisible(false);
        setLoadingVehicle(false);
        return;
      }
      const vehicleData = { id: vehicleDoc.id, ...vehicleDoc.data() };
      setVehicle(vehicleData);

      const mSnap = await getDocs(
        query(
          collection(db, 'manutencoes'),
          where('vehicleId', '==', data),
          orderBy('createdAt', 'desc')
        )
      );
      setMaintenances(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.log('Erro ao buscar veículo:', e);
      Alert.alert('Erro', 'Não foi possível carregar os dados do veículo.');
      setModalVisible(false);
    } finally {
      setLoadingVehicle(false);
    }
  }

  async function handleSaveReport() {
    if (!reportDesc) {
      Alert.alert('Atenção', 'Descreva a ocorrência.');
      return;
    }
    setSavingReport(true);
    try {
      await addDoc(collection(db, 'manutencoes'), {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        vehiclePlate: vehicle.plate,
        type: reportType,
        description: reportDesc,
        photoUrls: [],
        createdBy: user?.uid,
        createdByName: user?.name,
        status: 'pending',
        createdAt: Timestamp.now(),
      });
      Alert.alert('✅ Relatório enviado!', 'O administrador foi notificado.');
      setModalReport(false);
      setReportDesc('');
      // Recarrega manutenções
      const mSnap = await getDocs(
        query(collection(db, 'manutencoes'), where('vehicleId', '==', vehicle.id), orderBy('createdAt', 'desc'))
      );
      setMaintenances(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível enviar o relatório.');
    } finally {
      setSavingReport(false);
    }
  }

  function formatDate(ts: any) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('pt-BR');
  }

  const typeLabel: any = { guindaste: '🏗️ Guindaste', caminhao: '🚛 Caminhão', veiculo: '🚗 Veículo' };
  const statusLabel: any = { active: 'Ativo', maintenance: 'Em manutenção', inactive: 'Inativo' };
  const statusColor: any = { active: '#34a853', maintenance: '#f57c00', inactive: '#e53935' };
  const mTypeLabel: any = { preventive: 'Preventiva', corrective: 'Corretiva' };
  const mTypeColor: any = { preventive: '#1a73e8', corrective: '#e53935' };
  const mStatusLabel: any = { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluída' };

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut(auth) }
    ]);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.role}>Funcionário</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#e53935" />
        </TouchableOpacity>
      </View>

      {/* Área principal */}
      {!scanning ? (
        <View style={styles.scanArea}>
          <View style={styles.scanIconArea}>
            <Ionicons name="qr-code-outline" size={90} color="#1a73e8" />
          </View>
          <Text style={styles.scanTitle}>Scanner QR Code</Text>
          <Text style={styles.scanSubtitle}>
            Aponte a câmera para o QR Code do veículo para acessar a ficha completa
          </Text>
          {hasPermission === false && (
            <View style={styles.permissionBox}>
              <Ionicons name="camera-off-outline" size={24} color="#e53935" />
              <Text style={styles.permissionText}>Permissão de câmera negada. Ative nas configurações.</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.scanBtn, hasPermission === false && styles.scanBtnDisabled]}
            onPress={() => { setScanned(false); setScanning(true); }}
            disabled={hasPermission === false}
          >
            <Ionicons name="camera-outline" size={22} color="#fff" />
            <Text style={styles.scanBtnText}>Abrir câmera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // ─── CÂMERA ───
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.cameraHint}>Aponte para o QR Code do veículo</Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setScanning(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ─── MODAL FICHA DO VEÍCULO ─── */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.fichaContainer}>
          {loadingVehicle ? (
            <View style={styles.loadingArea}>
              <ActivityIndicator size="large" color="#1a73e8" />
              <Text style={styles.loadingText}>Carregando ficha...</Text>
            </View>
          ) : vehicle ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Banner do veículo */}
              <View style={[styles.vehicleBanner, { backgroundColor: vehicle.type === 'guindaste' ? '#1a73e8' : vehicle.type === 'caminhao' ? '#f57c00' : '#34a853' }]}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => { setModalVisible(false); setVehicle(null); setMaintenances([]); }}
                >
                  <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.vehicleBannerIcon}>
                  <Text style={{ fontSize: 48 }}>
                    {vehicle.type === 'guindaste' ? '🏗️' : vehicle.type === 'caminhao' ? '🚛' : '🚗'}
                  </Text>
                </View>
                <Text style={styles.vehicleBannerName}>{vehicle.name}</Text>
                <Text style={styles.vehicleBannerPlate}>{vehicle.plate}</Text>
                <View style={[styles.vehicleStatusBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <View style={[styles.statusDotSmall, { backgroundColor: statusColor[vehicle.status] }]} />
                  <Text style={styles.vehicleStatusText}>{statusLabel[vehicle.status]}</Text>
                </View>
              </View>

              {/* Informações */}
              <View style={styles.fichaSection}>
                <Text style={styles.sectionTitle}>📋 Informações do veículo</Text>
                <View style={styles.infoGrid}>
                  {vehicle.brand ? <InfoRow label="Marca" value={vehicle.brand} /> : null}
                  {vehicle.model ? <InfoRow label="Modelo" value={vehicle.model} /> : null}
                  <InfoRow label="Ano" value={String(vehicle.year)} />
                  {vehicle.color ? <InfoRow label="Cor" value={vehicle.color} /> : null}
                  {vehicle.chassis ? <InfoRow label="Chassi" value={vehicle.chassis} /> : null}
                  <InfoRow label="Tipo" value={typeLabel[vehicle.type]} />
                </View>
                {vehicle.notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Observações</Text>
                    <Text style={styles.notesText}>{vehicle.notes}</Text>
                  </View>
                ) : null}
              </View>

              {/* Botão de relatório */}
              <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                <TouchableOpacity style={styles.reportBtn} onPress={() => setModalReport(true)}>
                  <Ionicons name="document-text-outline" size={20} color="#fff" />
                  <Text style={styles.reportBtnText}>Registrar ocorrência</Text>
                </TouchableOpacity>
              </View>

              {/* Histórico de manutenções */}
              <View style={styles.fichaSection}>
                <Text style={styles.sectionTitle}>🔧 Histórico de manutenções ({maintenances.length})</Text>
                {maintenances.length === 0 ? (
                  <View style={styles.emptyMaintenance}>
                    <Ionicons name="checkmark-circle-outline" size={36} color="#ccc" />
                    <Text style={styles.emptyMaintenanceText}>Nenhuma manutenção registrada</Text>
                  </View>
                ) : (
                  maintenances.map(m => (
                    <View key={m.id} style={styles.maintenanceCard}>
                      <View style={[styles.mTypeBadge, { backgroundColor: m.type === 'preventive' ? '#e8f0fe' : '#fce8e6' }]}>
                        <Text style={[styles.mTypeText, { color: mTypeColor[m.type] }]}>
                          {mTypeLabel[m.type]}
                        </Text>
                      </View>
                      <Text style={styles.mDesc}>{m.description}</Text>
                      <View style={styles.mFooter}>
                        <Text style={styles.mDate}>{formatDate(m.createdAt)}</Text>
                        <Text style={styles.mBy}>por {m.createdByName || 'Sistema'}</Text>
                        <View style={[styles.mStatusBadge, {
                          backgroundColor: m.status === 'completed' ? '#e6f4ea' : m.status === 'in_progress' ? '#fff3e0' : '#f5f5f5'
                        }]}>
                          <Text style={{
                            fontSize: 11, fontWeight: '600',
                            color: m.status === 'completed' ? '#34a853' : m.status === 'in_progress' ? '#f57c00' : '#888'
                          }}>
                            {mStatusLabel[m.status]}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      {/* ─── MODAL RELATÓRIO ─── */}
      <Modal visible={modalReport} animationType="slide" transparent>
        <View style={styles.reportOverlay}>
          <View style={styles.reportModal}>
            <View style={styles.reportModalHeader}>
              <Text style={styles.reportModalTitle}>Nova ocorrência</Text>
              <TouchableOpacity onPress={() => setModalReport(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            {vehicle && <Text style={styles.reportVehicleName}>{vehicle.name} · {vehicle.plate}</Text>}

            <Text style={styles.reportLabel}>Tipo</Text>
            <View style={styles.reportTypeRow}>
              <TouchableOpacity
                style={[styles.reportTypeBtn, reportType === 'corrective' && styles.reportTypeBtnActive]}
                onPress={() => setReportType('corrective')}
              >
                <Text style={[styles.reportTypeBtnText, reportType === 'corrective' && { color: '#fff' }]}>
                  🔴 Corretiva
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportTypeBtn, reportType === 'preventive' && styles.reportTypeBtnActiveBlue]}
                onPress={() => setReportType('preventive')}
              >
                <Text style={[styles.reportTypeBtnText, reportType === 'preventive' && { color: '#fff' }]}>
                  🔵 Preventiva
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.reportLabel}>Descrição da ocorrência *</Text>
            <View style={styles.reportTextArea}>
              <Text
                style={styles.reportTextInput}
                onPress={() => { }}
              />
            </View>
            {/* TextInput separado para evitar bug */}
            <View style={{ marginBottom: 16 }}>
              <View style={styles.textAreaContainer}>
                <Text
                  style={{ color: reportDesc ? '#1a1a2e' : '#aaa', fontSize: 15, minHeight: 80 }}
                  onPress={() => { }}
                />
              </View>
              {/* TextInput real */}
              <ReportTextInput value={reportDesc} onChange={setReportDesc} />
            </View>

            <TouchableOpacity style={styles.reportSaveBtn} onPress={handleSaveReport} disabled={savingReport}>
              {savingReport
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.reportSaveBtnText}>Enviar relatório</Text>
              }
            </TouchableOpacity>
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

function ReportTextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { TextInput } = require('react-native');
  return (
    <TextInput
      style={{
        backgroundColor: '#f5f7ff', borderRadius: 10, padding: 14,
        fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0e7ff',
        minHeight: 100, textAlignVertical: 'top',
      }}
      placeholder="Descreva o problema ou ocorrência observada..."
      placeholderTextColor="#aaa"
      multiline
      value={value}
      onChangeText={onChange}
    />
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  label: { fontSize: 13, color: '#888', fontWeight: '500' },
  value: { fontSize: 13, color: '#1a1a2e', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff', paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  role: { fontSize: 12, color: '#1a73e8', fontWeight: '500', marginTop: 2 },
  logoutBtn: { backgroundColor: '#fce8e6', borderRadius: 10, padding: 8 },
  scanArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  scanIconArea: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#e8f0fe', justifyContent: 'center', alignItems: 'center' },
  scanTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  scanSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
  permissionBox: { flexDirection: 'row', gap: 8, backgroundColor: '#fce8e6', borderRadius: 10, padding: 14, alignItems: 'center' },
  permissionText: { flex: 1, fontSize: 13, color: '#e53935' },
  scanBtn: { flexDirection: 'row', backgroundColor: '#1a73e8', borderRadius: 14, padding: 16, paddingHorizontal: 32, alignItems: 'center', gap: 10, marginTop: 8 },
  scanBtnDisabled: { backgroundColor: '#aaa' },
  scanBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 220, height: 220, borderWidth: 3, borderColor: '#fff', borderRadius: 16, backgroundColor: 'transparent' },
  cameraHint: { color: '#fff', fontSize: 14, marginTop: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  cancelBtn: { position: 'absolute', bottom: 50, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  cancelBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  fichaContainer: { flex: 1, backgroundColor: '#f0f4ff' },
  loadingArea: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: '#888', fontSize: 16 },
  vehicleBanner: { paddingTop: 60, paddingBottom: 28, paddingHorizontal: 20, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 56, left: 16, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 8 },
  vehicleBannerIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  vehicleBannerName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  vehicleBannerPlate: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginTop: 4 },
  vehicleStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10 },
  statusDotSmall: { width: 8, height: 8, borderRadius: 4 },
  vehicleStatusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  fichaSection: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 14 },
  infoGrid: { gap: 2 },
  notesBox: { marginTop: 12, backgroundColor: '#f5f7ff', borderRadius: 10, padding: 12 },
  notesLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  notesText: { fontSize: 14, color: '#1a1a2e' },
  reportBtn: { backgroundColor: '#1a73e8', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  reportBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  emptyMaintenance: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyMaintenanceText: { color: '#aaa', fontSize: 14 },
  maintenanceCard: { backgroundColor: '#f5f7ff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#1a73e8' },
  mTypeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  mTypeText: { fontSize: 11, fontWeight: '600' },
  mDesc: { fontSize: 14, color: '#1a1a2e', marginBottom: 8, lineHeight: 20 },
  mFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  mDate: { fontSize: 11, color: '#888' },
  mBy: { fontSize: 11, color: '#888', flex: 1 },
  mStatusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  reportOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  reportModal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  reportModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reportModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  reportVehicleName: { fontSize: 13, color: '#1a73e8', marginBottom: 16 },
  reportLabel: { fontSize: 13, color: '#555', fontWeight: '500', marginBottom: 8, marginTop: 12 },
  reportTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  reportTypeBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#e0e7ff', alignItems: 'center' },
  reportTypeBtnActive: { backgroundColor: '#e53935', borderColor: '#e53935' },
  reportTypeBtnActiveBlue: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  reportTypeBtnText: { color: '#888', fontWeight: '500', fontSize: 13 },
  reportTextArea: {},
  reportTextInput: {},
  textAreaContainer: {},
  reportSaveBtn: { backgroundColor: '#1a73e8', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  reportSaveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});