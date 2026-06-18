import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView, Share
} from 'react-native';
import { collection, getDocs, addDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

export default function VehicleDetailScreen({ navigation }: any) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAdd, setModalAdd] = useState(false);
  const [modalQR, setModalQR] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [type, setType] = useState<'guindaste' | 'caminhao' | 'veiculo'>('guindaste');
  const [year, setYear] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [chassis, setChassis] = useState('');
  const [cpf, setCpf] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { loadVehicles(); }, []);

  async function loadVehicles() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'vehicles'));
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      all.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setVehicles(all);
    } catch (e) {
      console.log('Erro:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!name || !plate || !year) {
      Alert.alert('Atenção', 'Preencha nome, placa e ano.');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'vehicles'), {
        name, plate: plate.toUpperCase(), type, year: +year,
        brand, model, color, chassis, notes,
        cpfResponsavel: cpf,
        createdBy: user?.uid,
        createdByName: user?.name,
        status: 'active',
        pendingAdminApproval: true,
        createdAt: Timestamp.now(),
      });
      Alert.alert('✅ Veículo cadastrado!', 'O QR Code foi gerado. O administrador será notificado.');
      setModalAdd(false);
      resetForm();
      loadVehicles();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível cadastrar.');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setName(''); setPlate(''); setYear(''); setBrand('');
    setModel(''); setColor(''); setChassis(''); setNotes('');
    setCpf(''); setType('guindaste');
  }

  function formatCpf(value: string) {
    const nums = value.replace(/\D/g, '').slice(0, 11);
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  async function handleShareQR(vehicle: any) {
    try {
      await Share.share({
        message: `QR Code do veículo ${vehicle.name} (${vehicle.plate})\nID: ${vehicle.id}\nEscaneie no app Guindastes Ribas para acessar a ficha completa.`,
        title: `QR Code — ${vehicle.name}`,
      });
    } catch (e) {
      console.log('Erro ao compartilhar:', e);
    }
  }

  const typeLabel: any = { guindaste: '🏗️ Guindaste', caminhao: '🚛 Caminhão', veiculo: '🚗 Veículo' };
  const typeColor: any = { guindaste: '#1a73e8', caminhao: '#f57c00', veiculo: '#34a853' };
  const typeBg: any = { guindaste: '#e8f0fe', caminhao: '#fff3e0', veiculo: '#e6f4ea' };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Veículos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalAdd(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1a73e8" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={56} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum veículo cadastrado</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalAdd(true)}>
                <Text style={styles.emptyBtnText}>Cadastrar veículo</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('VehicleView', { vehicleId: item.id })}
            >
              <View style={[styles.typeTag, { backgroundColor: typeBg[item.type] }]}>
                <Text style={[styles.typeTagText, { color: typeColor[item.type] }]}>
                  {typeLabel[item.type]}
                </Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardPlate}>{item.plate}</Text>
                  <Text style={styles.cardSub}>{item.brand} {item.model} · {item.year}</Text>
                  {item.pendingAdminApproval && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>⏳ Aguarda aprovação ADM</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.qrBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedVehicle(item);
                    setModalQR(true);
                  }}
                >
                  <Ionicons name="qr-code-outline" size={24} color="#1a73e8" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ─── MODAL QR CODE ─── */}
      <Modal visible={modalQR} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <Text style={styles.qrTitle}>{selectedVehicle?.name}</Text>
            <Text style={styles.qrPlate}>{selectedVehicle?.plate}</Text>
            {selectedVehicle && (
              <View style={styles.qrBox}>
                <QRCode
                  value={selectedVehicle.id}
                  size={200}
                  color="#1a1a2e"
                  backgroundColor="#fff"
                />
              </View>
            )}
            <Text style={styles.qrHint}>Escaneie para acessar a ficha completa</Text>
            <View style={styles.qrActions}>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={() => selectedVehicle && handleShareQR(selectedVehicle)}
              >
                <Ionicons name="share-outline" size={18} color="#1a73e8" />
                <Text style={styles.shareBtnText}>Compartilhar / Imprimir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalQR(false)}>
                <Text style={styles.closeBtnText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL CADASTRO ─── */}
      <Modal visible={modalAdd} animationType="slide" transparent>
        <View style={styles.bottomSheet}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Veículo</Text>
              <TouchableOpacity onPress={() => { setModalAdd(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">

              <Text style={styles.label}>Tipo *</Text>
              <View style={styles.typeRow}>
                {(['guindaste', 'caminhao', 'veiculo'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                      {t === 'guindaste' ? '🏗️ Guindaste' : t === 'caminhao' ? '🚛 Caminhão' : '🚗 Veículo'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>CPF do responsável</Text>
              <TextInput style={styles.input} placeholder="000.000.000-00" placeholderTextColor="#aaa" keyboardType="numeric" value={cpf} onChangeText={v => setCpf(formatCpf(v))} />

              <Text style={styles.label}>Nome / Identificação *</Text>
              <TextInput style={styles.input} placeholder="Ex: Guindaste 01" placeholderTextColor="#aaa" value={name} onChangeText={setName} />

              <Text style={styles.label}>Placa *</Text>
              <TextInput style={styles.input} placeholder="Ex: ABC-1234" placeholderTextColor="#aaa" autoCapitalize="characters" value={plate} onChangeText={setPlate} />

              <Text style={styles.label}>Ano *</Text>
              <TextInput style={styles.input} placeholder="Ex: 2020" placeholderTextColor="#aaa" keyboardType="numeric" value={year} onChangeText={setYear} />

              <Text style={styles.label}>Marca</Text>
              <TextInput style={styles.input} placeholder="Ex: Mercedes-Benz" placeholderTextColor="#aaa" value={brand} onChangeText={setBrand} />

              <Text style={styles.label}>Modelo</Text>
              <TextInput style={styles.input} placeholder="Ex: Actros 2651" placeholderTextColor="#aaa" value={model} onChangeText={setModel} />

              <Text style={styles.label}>Cor</Text>
              <TextInput style={styles.input} placeholder="Ex: Branco" placeholderTextColor="#aaa" value={color} onChangeText={setColor} />

              <Text style={styles.label}>Chassi</Text>
              <TextInput style={styles.input} placeholder="Número do chassi" placeholderTextColor="#aaa" value={chassis} onChangeText={setChassis} />

              <Text style={styles.label}>Observações</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Informações adicionais..."
                placeholderTextColor="#aaa"
                multiline
                value={notes}
                onChangeText={setNotes}
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color="#1a73e8" />
                <Text style={styles.infoText}>
                  O veículo será cadastrado e o QR Code gerado imediatamente. O administrador será notificado para revisão.
                </Text>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Cadastrar e gerar QR Code</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff', paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' },
  addBtn: { backgroundColor: '#1a73e8', borderRadius: 10, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  typeTag: { paddingHorizontal: 14, paddingVertical: 6 },
  typeTagText: { fontSize: 12, fontWeight: '600' },
  cardBody: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  cardPlate: { fontSize: 13, color: '#1a73e8', fontWeight: '600', marginTop: 2 },
  cardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  pendingBadge: { backgroundColor: '#fff3e0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 6 },
  pendingBadgeText: { fontSize: 11, color: '#f57c00', fontWeight: '500' },
  qrBtn: { backgroundColor: '#e8f0fe', borderRadius: 10, padding: 10 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 14 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#aaa' },
  emptyBtn: { backgroundColor: '#1a73e8', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  qrModal: { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', width: '100%' },
  qrTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  qrPlate: { fontSize: 14, color: '#1a73e8', fontWeight: '600', marginBottom: 20 },
  qrBox: { padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e0e7ff' },
  qrHint: { fontSize: 12, color: '#888', marginTop: 16, textAlign: 'center' },
  qrActions: { width: '100%', gap: 10, marginTop: 16 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e8f0fe', borderRadius: 10, padding: 12 },
  shareBtnText: { color: '#1a73e8', fontWeight: '600' },
  closeBtn: { backgroundColor: '#1a73e8', borderRadius: 10, padding: 12, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: 'bold' },
  bottomSheet: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  label: { fontSize: 13, color: '#555', fontWeight: '500', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f5f7ff', borderRadius: 10, padding: 14, fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0e7ff' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e0e7ff', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  typeBtnText: { color: '#888', fontSize: 11, fontWeight: '500' },
  typeBtnTextActive: { color: '#fff' },
  infoBox: { flexDirection: 'row', gap: 8, backgroundColor: '#e8f0fe', borderRadius: 10, padding: 12, marginTop: 16 },
  infoText: { flex: 1, fontSize: 12, color: '#1a73e8', lineHeight: 18 },
  saveBtn: { backgroundColor: '#1a73e8', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 16, marginBottom: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});