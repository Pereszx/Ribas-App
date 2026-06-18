import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform, TextInput
} from 'react-native';
import {
  collection, getDocs, addDoc, updateDoc, doc, Timestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// Telas internas desta seção (sem usar <Modal>)
type Screen = 'list' | 'detail' | 'newForm' | 'pickVehicle';
type Tab = 'pendentes' | 'andamento' | 'concluidas';

const STATUS_LABEL: any = { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluída' };
const STATUS_COLOR: any = { pending: '#f57c00', in_progress: '#1a73e8', completed: '#34a853' };
const STATUS_BG: any = { pending: '#fff3e0', in_progress: '#e8f0fe', completed: '#e6f4ea' };
const TYPE_LABEL: any = { preventive: 'Preventiva', corrective: 'Corretiva' };
const TYPE_COLOR: any = { preventive: '#1a73e8', corrective: '#e53935' };
const TYPE_BG: any = { preventive: '#e8f0fe', corrective: '#fce8e6' };

export default function MaintenanceScreen() {
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen>('list');
  const [tab, setTab] = useState<Tab>('pendentes');

  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [schedVehicle, setSchedVehicle] = useState<any>(null);
  const [schedType, setSchedType] = useState<'preventive' | 'corrective'>('preventive');
  const [schedDesc, setSchedDesc] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedNotes, setSchedNotes] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const mSnap = await getDocs(collection(db, 'manutencoes'));
      const allMaint = mSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      allMaint.sort((a, b) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return tb - ta;
      });
      setMaintenances(allMaint);
    } catch (e) {
      console.log('Erro manutencoes:', e);
    }
    try {
      const vSnap = await getDocs(collection(db, 'vehicles'));
      setVehicles(vSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.log('Erro vehicles:', e);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function startNewMaintenance() {
    setSchedVehicle(null);
    setSchedType('preventive');
    setSchedDesc('');
    setSchedDate('');
    setSchedNotes('');
    setScreen('newForm');
  }

async function handleUpdateStatus(id: string, status: string) {
  try {
    const updateData: any = { status };
    if (status === 'completed') updateData.completedAt = Timestamp.now();
    if (status === 'in_progress') updateData.startedAt = Timestamp.now();
    await updateDoc(doc(db, 'manutencoes', id), updateData);

    // Atualiza também o status do veículo
    if (selected?.vehicleId) {
      if (status === 'in_progress') {
        await updateDoc(doc(db, 'vehicles', selected.vehicleId), { status: 'maintenance' });
      } else if (status === 'completed') {
        await updateDoc(doc(db, 'vehicles', selected.vehicleId), { status: 'active' });
      }
    }

    await loadData();
    setScreen('list');
    Alert.alert('Sucesso', 'Status atualizado!');
  } catch (e) {
    console.log('Erro ao atualizar:', e);
    Alert.alert('Erro', 'Não foi possível atualizar o status.');
  }
}

  async function handleSaveMaintenance() {
    if (!schedVehicle) { Alert.alert('Atenção', 'Selecione um veículo.'); return; }
    if (!schedDesc.trim()) { Alert.alert('Atenção', 'Preencha a descrição.'); return; }
    const parts = schedDate.split('/');
    if (parts.length !== 3 || parts.some(p => !p.trim())) {
      Alert.alert('Atenção', 'Preencha a data no formato DD/MM/AAAA.');
      return;
    }
    setSaving(true);
    try {
      const [day, month, year] = parts.map(p => parseInt(p, 10));
      const scheduledDate = new Date(year, month - 1, day);
      await addDoc(collection(db, 'manutencoes'), {
        vehicleId: schedVehicle.id,
        vehicleName: schedVehicle.name || '',
        vehiclePlate: schedVehicle.plate || '',
        type: schedType,
        description: schedDesc.trim(),
        notes: schedNotes.trim(),
        photoUrls: [],
        createdBy: user?.uid || '',
        createdByName: user?.name || 'Administrador',
        status: 'pending',
        scheduledDate: Timestamp.fromDate(scheduledDate),
        createdAt: Timestamp.now(),
      });
      await loadData();
      setScreen('list');
      Alert.alert('Sucesso', 'Manutenção agendada!');
    } catch (e) {
      console.log('Erro ao agendar:', e);
      Alert.alert('Erro', 'Não foi possível agendar.');
    } finally {
      setSaving(false);
    }
  }

  function formatDateInput(value: string) {
    const nums = value.replace(/\D/g, '').slice(0, 8);
    if (nums.length <= 2) return nums;
    if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`;
    return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4)}`;
  }

  function formatDate(ts: any) {
    if (!ts) return '—';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('pt-BR');
    } catch { return '—'; }
  }

  const filtered = maintenances.filter(m => {
    if (tab === 'pendentes') return m.status === 'pending';
    if (tab === 'andamento') return m.status === 'in_progress';
    return m.status === 'completed';
  });

  const counts = {
    pendentes: maintenances.filter(m => m.status === 'pending').length,
    andamento: maintenances.filter(m => m.status === 'in_progress').length,
    concluidas: maintenances.filter(m => m.status === 'completed').length,
  };

  const vehicleTypeIcon: any = { guindaste: 'construct-outline', caminhao: 'car-sport-outline', veiculo: 'car-outline' };

  // ═══════════════════ TELA: LISTA PRINCIPAL ═══════════════════
  if (screen === 'list') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Manutenções</Text>
          <TouchableOpacity style={styles.addBtn} onPress={startNewMaintenance} activeOpacity={0.7}>
            <Ionicons name="add" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#fff3e0' }]}>
            <Text style={[styles.summaryCount, { color: '#f57c00' }]}>{counts.pendentes}</Text>
            <Text style={[styles.summaryLabel, { color: '#f57c00' }]}>Pendentes</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#e8f0fe' }]}>
            <Text style={[styles.summaryCount, { color: '#1a73e8' }]}>{counts.andamento}</Text>
            <Text style={[styles.summaryLabel, { color: '#1a73e8' }]}>Andamento</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#e6f4ea' }]}>
            <Text style={[styles.summaryCount, { color: '#34a853' }]}>{counts.concluidas}</Text>
            <Text style={[styles.summaryLabel, { color: '#34a853' }]}>Concluídas</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'pendentes' && styles.tabActive]} onPress={() => setTab('pendentes')}>
            <Text style={[styles.tabText, tab === 'pendentes' && styles.tabTextActive]}>Pendentes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'andamento' && styles.tabActive]} onPress={() => setTab('andamento')}>
            <Text style={[styles.tabText, tab === 'andamento' && styles.tabTextActive]}>Andamento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'concluidas' && styles.tabActive]} onPress={() => setTab('concluidas')}>
            <Text style={[styles.tabText, tab === 'concluidas' && styles.tabTextActive]}>Concluídas</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1a73e8" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="construct-outline" size={56} color="#ccc" />
                <Text style={styles.emptyText}>Nenhuma manutenção aqui</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={startNewMaintenance}>
                  <Text style={styles.emptyBtnText}>Agendar manutenção</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => { setSelected(item); setScreen('detail'); }}
                activeOpacity={0.7}
              >
                <View style={styles.cardTags}>
                  <View style={[styles.tag, { backgroundColor: TYPE_BG[item.type] }]}>
                    <Text style={[styles.tagText, { color: TYPE_COLOR[item.type] }]}>{TYPE_LABEL[item.type] || item.type}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: STATUS_BG[item.status] }]}>
                    <Text style={[styles.tagText, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status] || item.status}</Text>
                  </View>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>🚗 {item.vehicleName || '—'}</Text>
                  <Text style={styles.cardFooterText}>📅 {formatDate(item.scheduledDate || item.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // ═══════════════════ TELA: DETALHE ═══════════════════
  if (screen === 'detail' && selected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('list')} style={styles.backRow}>
            <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
            <Text style={styles.title}>Detalhes</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          <View style={styles.cardTags}>
            <View style={[styles.tag, { backgroundColor: TYPE_BG[selected.type] }]}>
              <Text style={[styles.tagText, { color: TYPE_COLOR[selected.type] }]}>{TYPE_LABEL[selected.type]}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: STATUS_BG[selected.status] }]}>
              <Text style={[styles.tagText, { color: STATUS_COLOR[selected.status] }]}>{STATUS_LABEL[selected.status]}</Text>
            </View>
          </View>

          <Text style={styles.detailDesc}>{selected.description}</Text>

          <View style={styles.detailBox}>
            <Text style={styles.detailRow}>🚗 Veículo: {selected.vehicleName || '—'} {selected.vehiclePlate ? `(${selected.vehiclePlate})` : ''}</Text>
            <Text style={styles.detailRow}>📅 Agendado: {formatDate(selected.scheduledDate)}</Text>
            <Text style={styles.detailRow}>🕓 Registrado: {formatDate(selected.createdAt)}</Text>
            <Text style={styles.detailRow}>👤 Por: {selected.createdByName || '—'}</Text>
            {selected.completedAt && <Text style={styles.detailRow}>✅ Concluído: {formatDate(selected.completedAt)}</Text>}
            {selected.notes ? <Text style={styles.detailRow}>📝 {selected.notes}</Text> : null}
          </View>

          {selected.status === 'pending' && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e8f0fe' }]} onPress={() => handleUpdateStatus(selected.id, 'in_progress')}>
                <Text style={[styles.actionBtnText, { color: '#1a73e8' }]}>▶ Iniciar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e6f4ea' }]} onPress={() => handleUpdateStatus(selected.id, 'completed')}>
                <Text style={[styles.actionBtnText, { color: '#34a853' }]}>✔ Concluir</Text>
              </TouchableOpacity>
            </View>
          )}
          {selected.status === 'in_progress' && (
            <TouchableOpacity style={[styles.actionBtnFull, { backgroundColor: '#e6f4ea' }]} onPress={() => handleUpdateStatus(selected.id, 'completed')}>
              <Text style={[styles.actionBtnText, { color: '#34a853', fontSize: 15 }]}>✔ Marcar como concluída</Text>
            </TouchableOpacity>
          )}
          {selected.status === 'completed' && (
            <View style={styles.completedBanner}>
              <Text style={styles.completedText}>✅ Manutenção concluída</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════ TELA: SELECIONAR VEÍCULO ═══════════════════
  if (screen === 'pickVehicle') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('newForm')} style={styles.backRow}>
            <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
            <Text style={styles.title}>Veículos ({vehicles.length})</Text>
          </TouchableOpacity>
        </View>

        {vehicles.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="car-outline" size={56} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum veículo cadastrado ainda.{'\n'}Cadastre na aba Veículos primeiro.</Text>
          </View>
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.vehiclePickerItem}
                onPress={() => {
                  setSchedVehicle(item);
                  setScreen('newForm');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name={vehicleTypeIcon[item.type] || 'car-outline'} size={24} color="#1a73e8" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.vehiclePickerName}>{item.name || 'Sem nome'}</Text>
                  <Text style={styles.vehiclePickerPlate}>{item.plate || 'Sem placa'} {item.year ? `· ${item.year}` : ''}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // ═══════════════════ TELA: NOVO FORMULÁRIO ═══════════════════
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('list')} style={styles.backRow}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
          <Text style={styles.title}>Nova Manutenção</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Tipo</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity style={[styles.typeBtn, schedType === 'preventive' && styles.typeBtnBlue]} onPress={() => setSchedType('preventive')}>
            <Text style={[styles.typeBtnText, schedType === 'preventive' && { color: '#fff' }]}>Preventiva</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, schedType === 'corrective' && styles.typeBtnRed]} onPress={() => setSchedType('corrective')}>
            <Text style={[styles.typeBtnText, schedType === 'corrective' && { color: '#fff' }]}>Corretiva</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Veículo</Text>
        <TouchableOpacity style={styles.vehicleSelector} onPress={() => setScreen('pickVehicle')} activeOpacity={0.7}>
          <Text style={[styles.vehicleSelectorText, schedVehicle && styles.vehicleSelectorTextActive]}>
            {schedVehicle ? `${schedVehicle.name} (${schedVehicle.plate})` : `Toque para selecionar (${vehicles.length} disponíveis)`}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Troca de óleo e filtros"
          placeholderTextColor="#aaa"
          value={schedDesc}
          onChangeText={setSchedDesc}
        />

        <Text style={styles.label}>Data (DD/MM/AAAA)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 15/07/2025"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={schedDate}
          onChangeText={(v) => setSchedDate(formatDateInput(v))}
          maxLength={10}
        />

        <Text style={styles.label}>Observações</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Instruções adicionais..."
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={3}
          value={schedNotes}
          onChangeText={setSchedNotes}
        />

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSaveMaintenance} disabled={saving} activeOpacity={0.7}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Agendar manutenção</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff', paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  addBtn: { backgroundColor: '#1a73e8', borderRadius: 14, width: 48, height: 48, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  summaryCount: { fontSize: 24, fontWeight: 'bold' },
  summaryLabel: { fontSize: 11, fontWeight: '500' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 4 },
  tab: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#e8f0fe' },
  tabText: { fontSize: 13, color: '#888', fontWeight: '500' },
  tabTextActive: { color: '#1a73e8', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  cardTags: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tag: { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: '600' },
  cardDesc: { fontSize: 14, color: '#1a1a2e', fontWeight: '500', marginBottom: 10, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', gap: 16 },
  cardFooterText: { fontSize: 12, color: '#888' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 30, gap: 14 },
  emptyText: { fontSize: 15, fontWeight: 'bold', color: '#aaa', textAlign: 'center' },
  emptyBtn: { backgroundColor: '#1a73e8', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  detailDesc: { fontSize: 16, color: '#1a1a2e', fontWeight: '500', marginBottom: 16, lineHeight: 24 },
  detailBox: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, gap: 8 },
  detailRow: { fontSize: 13, color: '#333' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  actionBtn: { flex: 1, alignItems: 'center', borderRadius: 12, padding: 14 },
  actionBtnFull: { alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 10 },
  actionBtnText: { fontWeight: 'bold', fontSize: 14 },
  completedBanner: { alignItems: 'center', backgroundColor: '#e6f4ea', borderRadius: 12, padding: 14 },
  completedText: { color: '#34a853', fontWeight: 'bold', fontSize: 15 },
  label: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 8, marginTop: 14 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, padding: 13, borderRadius: 10, borderWidth: 1.5, borderColor: '#fff', backgroundColor: '#fff', alignItems: 'center' },
  typeBtnBlue: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  typeBtnRed: { backgroundColor: '#e53935', borderColor: '#e53935' },
  typeBtnText: { color: '#888', fontWeight: '600', fontSize: 13 },
  vehicleSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, padding: 15, borderWidth: 1, borderColor: '#e0e7ff' },
  vehicleSelectorText: { fontSize: 14, color: '#aaa' },
  vehicleSelectorTextActive: { color: '#1a1a2e', fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 15, fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0e7ff' },
  textArea: { height: 90, textAlignVertical: 'top' },
  vehiclePickerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  vehiclePickerName: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  vehiclePickerPlate: { fontSize: 12, color: '#888', marginTop: 2 },
  saveBtn: { backgroundColor: '#1a73e8', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});