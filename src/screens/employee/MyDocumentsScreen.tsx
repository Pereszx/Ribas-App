import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Modal, TextInput, Alert, ScrollView
} from 'react-native';
import { collection, getDocs, addDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const DOC_TYPES = [
  { value: 'exam', label: 'Exame admissional', icon: 'medical-outline', color: '#1a73e8', bg: '#e8f0fe' },
  { value: 'attestation', label: 'Atestado médico', icon: 'document-attach-outline', color: '#e53935', bg: '#fce8e6' },
  { value: 'declaration', label: 'Declaração', icon: 'document-text-outline', color: '#f57c00', bg: '#fff3e0' },
  { value: 'certificate', label: 'Certificado/Curso', icon: 'ribbon-outline', color: '#34a853', bg: '#e6f4ea' },
  { value: 'other', label: 'Outro', icon: 'folder-outline', color: '#888', bg: '#f5f5f5' },
];

export default function MyDocumentsScreen() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAdd, setModalAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campos do novo documento
  const [docType, setDocType] = useState('attestation');
  const [description, setDescription] = useState('');
  const [expiration, setExpiration] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    if (!user) return;
    setLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'employeeDocuments'),
          where('employeeId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
      );
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.log('Erro:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!description) {
      Alert.alert('Atenção', 'Preencha a descrição do documento.');
      return;
    }
    setSaving(true);
    try {
      let expDate = null;
      if (expiration) {
        const [day, month, year] = expiration.split('/');
        if (day && month && year) {
          expDate = Timestamp.fromDate(new Date(+year, +month - 1, +day));
        }
      }

      await addDoc(collection(db, 'employeeDocuments'), {
        employeeId: user?.uid,
        employeeName: user?.name,
        type: docType,
        description,
        notes: notes || '',
        expirationDate: expDate,
        addedByEmployee: true,
        createdAt: Timestamp.now(),
      });

      Alert.alert('✅ Documento adicionado!', 'Seu documento foi salvo com sucesso.');
      setModalAdd(false);
      resetForm();
      loadDocs();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o documento.');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setDocType('attestation');
    setDescription('');
    setExpiration('');
    setNotes('');
  }

  function getStatus(doc: any) {
    if (!doc.expirationDate) return 'none';
    const exp = doc.expirationDate.toDate ? doc.expirationDate.toDate() : new Date(doc.expirationDate);
    const diff = Math.ceil((exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'expired';
    if (diff <= 30) return 'warning';
    return 'ok';
  }

  function formatDate(date: any) {
    if (!date) return '—';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('pt-BR');
  }

  function getDocInfo(type: string) {
    return DOC_TYPES.find(d => d.value === type) || DOC_TYPES[DOC_TYPES.length - 1];
  }

  const statusColor: any = { expired: '#e53935', warning: '#f57c00', ok: '#34a853', none: '#aaa' };
  const statusLabel: any = { expired: 'Vencido', warning: 'Vence em breve', ok: 'Em dia', none: 'Sem vencimento' };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Documentos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalAdd(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1a73e8" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={documents}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="folder-open-outline" size={56} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum documento ainda</Text>
              <Text style={styles.emptySubText}>
                Adicione seus atestados, declarações e certificados
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalAdd(true)}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.emptyBtnText}>Adicionar documento</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const status = getStatus(item);
            const docInfo = getDocInfo(item.type);
            return (
              <View style={[styles.card, { borderLeftColor: statusColor[status] }]}>
                <View style={[styles.iconBox, { backgroundColor: docInfo.bg }]}>
                  <Ionicons name={docInfo.icon as any} size={24} color={docInfo.color} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.description}</Text>
                  <Text style={styles.cardType}>{docInfo.label}</Text>
                  {item.expirationDate && (
                    <Text style={styles.cardDate}>Vence: {formatDate(item.expirationDate)}</Text>
                  )}
                  {item.addedByEmployee && (
                    <View style={styles.selfBadge}>
                      <Text style={styles.selfBadgeText}>Adicionado por você</Text>
                    </View>
                  )}
                </View>
                <View style={styles.statusArea}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor[status] }]} />
                  <Text style={[styles.statusText, { color: statusColor[status] }]}>
                    {statusLabel[status]}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ─── MODAL ADICIONAR DOCUMENTO ─── */}
      <Modal visible={modalAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Documento</Text>
              <TouchableOpacity onPress={() => { setModalAdd(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Tipo de documento *</Text>
              <View style={styles.typeGrid}>
                {DOC_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.typeCard, docType === t.value && { borderColor: t.color, backgroundColor: t.bg }]}
                    onPress={() => setDocType(t.value)}
                  >
                    <Ionicons name={t.icon as any} size={22} color={docType === t.value ? t.color : '#888'} />
                    <Text style={[styles.typeCardText, docType === t.value && { color: t.color }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Descrição *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Atestado médico — 3 dias"
                placeholderTextColor="#aaa"
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.label}>Data de vencimento (DD/MM/AAAA)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 31/12/2025"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={expiration}
                onChangeText={setExpiration}
              />

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
                  Documentos adicionados por você ficam visíveis para o administrador.
                </Text>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>Salvar documento</Text>
                }
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' },
  addBtn: { backgroundColor: '#1a73e8', borderRadius: 10, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    borderLeftWidth: 4,
  },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: 'bold', color: '#1a1a2e' },
  cardType: { fontSize: 12, color: '#888', marginTop: 2 },
  cardDate: { fontSize: 12, color: '#555', marginTop: 2 },
  selfBadge: { backgroundColor: '#e8f0fe', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  selfBadgeText: { fontSize: 10, color: '#1a73e8', fontWeight: '500' },
  statusArea: { alignItems: 'center', gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#aaa' },
  emptySubText: { fontSize: 13, color: '#bbb', textAlign: 'center', paddingHorizontal: 30 },
  emptyBtn: { flexDirection: 'row', backgroundColor: '#1a73e8', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12, gap: 6, alignItems: 'center', marginTop: 4 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  label: { fontSize: 13, color: '#555', fontWeight: '500', marginBottom: 8, marginTop: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeCard: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#e0e7ff',
  },
  typeCardText: { fontSize: 12, color: '#888', fontWeight: '500', flex: 1 },
  input: { backgroundColor: '#f5f7ff', borderRadius: 10, padding: 14, fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0e7ff' },
  infoBox: { flexDirection: 'row', gap: 8, backgroundColor: '#e8f0fe', borderRadius: 10, padding: 12, marginTop: 16, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 12, color: '#1a73e8', lineHeight: 18 },
  saveBtn: { backgroundColor: '#1a73e8', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 16, marginBottom: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});