import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView, Image
} from 'react-native';
import { collection, getDocs, addDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Vehicle } from '../../types';

export default function VehiclesScreen({ navigation }: any) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAdd, setModalAdd] = useState(false);
  const [modalQR, setModalQR] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [type, setType] = useState<'guindaste' | 'caminhao' | 'veiculo'>('guindaste');
  const [year, setYear] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [chassis, setChassis] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { loadVehicles(); }, []);

  async function loadVehicles() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'vehicles'), orderBy('name')));
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Vehicle[]);
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
      const docRef = await addDoc(collection(db, 'vehicles'), {
        name, plate: plate.toUpperCase(), type, year: +year,
        brand, model, color, chassis, notes,
        status: 'active',
        createdAt: Timestamp.now(),
      });
      Alert.alert('✅ Veículo cadastrado!', 'QR Code gerado com sucesso.');
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
    setType('guindaste');
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
                <Text style={styles.emptyBtnText}>Cadastrar primeiro veículo</Text>
              </TouchableOpacity>
            </View>
          }

          
          
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
              activeOpacity={0.8}
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
                  {(item as any).brand ? (
                    <Text style={styles.cardSub}>{(item as any).brand} {(item as any).model} · {item.year}</Text>
                  ) : (
                    <Text style={styles.cardSub}>Ano: {item.year}</Text>
                  )}
                </View>
                <View style={styles.cardActions}>
                  <View style={[styles.statusDot, {
                    backgroundColor: item.status === 'active' ? '#34a853' : item.status === 'maintenance' ? '#f57c00' : '#e53935'
                  }]} />
                  <TouchableOpacity
                    style={styles.qrBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedVehicle(item);
                      setModalQR(true);
                    }}
                  >
                    <Ionicons name="qr-code-outline" size={22} color="#1a73e8" />
                  </TouchableOpacity>
                </View>
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
            <Text style={styles.qrHint}>Escaneie para acessar a ficha do veículo</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalQR(false)}>
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL CADASTRO ─── */}
      <Modal visible={modalAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Veículo</Text>
              <TouchableOpacity onPress={() => { setModalAdd(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>

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
  cardActions: { alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  qrBtn: { backgroundColor: '#e8f0fe', borderRadius: 10, padding: 8 },
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
  closeBtn: { marginTop: 20, backgroundColor: '#1a73e8', borderRadius: 10, paddingHorizontal: 32, paddingVertical: 12 },
  closeBtnText: { color: '#fff', fontWeight: 'bold' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%', width: '100%', position: 'absolute', bottom: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  label: { fontSize: 13, color: '#555', fontWeight: '500', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f5f7ff', borderRadius: 10, padding: 14, fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0e7ff' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e0e7ff', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  typeBtnText: { color: '#888', fontSize: 11, fontWeight: '500' },
  typeBtnTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: '#1a73e8', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});