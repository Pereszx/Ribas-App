import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import {
  collection, getDocs, addDoc, updateDoc, query, orderBy, Timestamp, doc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { EmployeeDocument, AppUser } from '../../types';

type Tab = 'pendentes' | 'funcionarios' | 'documentos';

export default function HRScreen() {
  const [tab, setTab] = useState<Tab>('pendentes');
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [pending, setPending] = useState<AppUser[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalDocument, setModalDocument] = useState(false);
  const [docEmployeeName, setDocEmployeeName] = useState('');
  const [docType, setDocType] = useState<'exam' | 'attestation'>('exam');
  const [docDescription, setDocDescription] = useState('');
  const [docExpiration, setDocExpiration] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [empSnap, docSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), orderBy('name'))),
        getDocs(query(collection(db, 'employeeDocuments'), orderBy('createdAt', 'desc'))),
      ]);
      const all = empSnap.docs.map(d => ({ uid: d.id, ...d.data() })) as AppUser[];
      const employees_only = all.filter(e => e.role === 'employee');
      setPending(employees_only.filter(e => e.status === 'pending' || !e.status));
      setEmployees(employees_only.filter(e => e.status === 'approved'));
      setDocuments(docSnap.docs.map(d => ({ id: d.id, ...d.data() })) as EmployeeDocument[]);
    } catch (e) {
      console.log('Erro ao carregar RH:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(uid: string, approve: boolean) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: approve ? 'approved' : 'rejected'
      });
      Alert.alert('Sucesso', approve ? '✅ Funcionário aprovado!' : '❌ Acesso negado.');
      loadData();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
  }

  async function handleAddDocument() {
    if (!docEmployeeName || !docDescription) {
      Alert.alert('Atenção', 'Preencha o nome do funcionário e a descrição.');
      return;
    }
    setSaving(true);
    try {
      let expDate = null;
      if (docExpiration) {
        const [day, month, year] = docExpiration.split('/');
        expDate = Timestamp.fromDate(new Date(+year, +month - 1, +day));
      }
      await addDoc(collection(db, 'employeeDocuments'), {
        employeeId: 'manual',
        employeeName: docEmployeeName,
        type: docType,
        description: docDescription,
        expirationDate: expDate,
        createdAt: Timestamp.now(),
      });
      Alert.alert('Sucesso', 'Documento registrado!');
      setModalDocument(false);
      setDocEmployeeName('');
      setDocDescription('');
      setDocExpiration('');
      setDocType('exam');
      loadData();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o documento.');
    } finally {
      setSaving(false);
    }
  }

  function getExpirationStatus(doc: EmployeeDocument) {
    if (!doc.expirationDate) return 'none';
    const exp = (doc.expirationDate as any).toDate
      ? (doc.expirationDate as any).toDate()
      : new Date(doc.expirationDate);
    const diffDays = Math.ceil((exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'warning';
    return 'ok';
  }

  function formatDate(date: any) {
    if (!date) return '—';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('pt-BR');
  }

  const statusColor = { expired: '#e53935', warning: '#f57c00', ok: '#34a853', none: '#aaa' };
  const statusLabel = { expired: 'Vencido', warning: 'Vence em breve', ok: 'Em dia', none: 'Sem vencimento' };
  const expiredCount = documents.filter(d => getExpirationStatus(d) === 'expired').length;
  const warningCount = documents.filter(d => getExpirationStatus(d) === 'warning').length;

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Módulo RH</Text>
        {tab === 'documentos' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalDocument(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Alertas */}
      {(expiredCount > 0 || warningCount > 0) && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning-outline" size={18} color="#f57c00" />
          <Text style={styles.alertText}>
            {expiredCount > 0 && `${expiredCount} doc(s) vencido(s)  `}
            {warningCount > 0 && `${warningCount} vence(m) em breve`}
          </Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'pendentes' && styles.tabActive]}
          onPress={() => setTab('pendentes')}
        >
          <Ionicons name="time-outline" size={15} color={tab === 'pendentes' ? '#1a73e8' : '#888'} />
          <Text style={[styles.tabText, tab === 'pendentes' && styles.tabTextActive]}>
            Pendentes {pending.length > 0 && `(${pending.length})`}
          </Text>
          {pending.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{pending.length}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'funcionarios' && styles.tabActive]}
          onPress={() => setTab('funcionarios')}
        >
          <Ionicons name="people-outline" size={15} color={tab === 'funcionarios' ? '#1a73e8' : '#888'} />
          <Text style={[styles.tabText, tab === 'funcionarios' && styles.tabTextActive]}>
            Aprovados ({employees.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'documentos' && styles.tabActive]}
          onPress={() => setTab('documentos')}
        >
          <Ionicons name="document-text-outline" size={15} color={tab === 'documentos' ? '#1a73e8' : '#888'} />
          <Text style={[styles.tabText, tab === 'documentos' && styles.tabTextActive]}>
            Docs ({documents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1a73e8" style={{ marginTop: 40 }} />
      ) : tab === 'pendentes' ? (

        // ─── PENDENTES ───
        <FlatList
          data={pending}
          keyExtractor={item => item.uid}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={56} color="#34a853" />
              <Text style={styles.emptyText}>Nenhum cadastro pendente</Text>
              <Text style={styles.emptySubText}>Todos os funcionários foram avaliados</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.pendingCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardSub}>{item.email}</Text>
                {item.position ? <Text style={styles.cardPosition}>{item.position}</Text> : null}
                {item.phone ? <Text style={styles.cardSub}>{item.phone}</Text> : null}
              </View>
              <View style={styles.approveRow}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(item.uid, true)}
                >
                  <Ionicons name="checkmark-outline" size={20} color="#34a853" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleApprove(item.uid, false)}
                >
                  <Ionicons name="close-outline" size={20} color="#e53935" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

      ) : tab === 'funcionarios' ? (

        // ─── APROVADOS ───
        <FlatList
          data={employees}
          keyExtractor={item => item.uid}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum funcionário aprovado</Text>
              <Text style={styles.emptySubText}>Aprove cadastros na aba Pendentes</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardSub}>{item.email}</Text>
                {item.position ? <Text style={styles.cardPosition}>{item.position}</Text> : null}
              </View>
              <View style={[styles.statusPill, { backgroundColor: '#e6f4ea' }]}>
                <Text style={{ fontSize: 11, color: '#34a853', fontWeight: '600' }}>Ativo</Text>
              </View>
            </View>
          )}
        />

      ) : (

        // ─── DOCUMENTOS ───
        <FlatList
          data={documents}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum documento registrado</Text>
            </View>
          }
          renderItem={({ item }) => {
            const status = getExpirationStatus(item);
            return (
              <View style={styles.docCard}>
                <View style={[styles.docIcon, { backgroundColor: item.type === 'exam' ? '#e8f0fe' : '#fce8e6' }]}>
                  <Ionicons
                    name={item.type === 'exam' ? 'medical-outline' : 'document-attach-outline'}
                    size={22}
                    color={item.type === 'exam' ? '#1a73e8' : '#e53935'}
                  />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{item.description}</Text>
                  <Text style={styles.docEmployee}>{item.employeeName}</Text>
                  <Text style={styles.docType}>{item.type === 'exam' ? 'Exame admissional' : 'Atestado'}</Text>
                </View>
                <View style={styles.docStatus}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor[status] }]} />
                  <Text style={[styles.statusText, { color: statusColor[status] }]}>{statusLabel[status]}</Text>
                  {item.expirationDate && <Text style={styles.expDate}>{formatDate(item.expirationDate)}</Text>}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ─── MODAL NOVO DOCUMENTO ─── */}
      <Modal visible={modalDocument} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Documento</Text>
              <TouchableOpacity onPress={() => setModalDocument(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Nome do funcionário *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: João da Silva"
                placeholderTextColor="#aaa"
                value={docEmployeeName}
                onChangeText={setDocEmployeeName}
              />
              <Text style={styles.label}>Tipo de documento *</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, docType === 'exam' && styles.typeBtnActive]}
                  onPress={() => setDocType('exam')}
                >
                  <Ionicons name="medical-outline" size={16} color={docType === 'exam' ? '#fff' : '#888'} />
                  <Text style={[styles.typeBtnText, docType === 'exam' && styles.typeBtnTextActive]}>Exame</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, docType === 'attestation' && styles.typeBtnActive]}
                  onPress={() => setDocType('attestation')}
                >
                  <Ionicons name="document-attach-outline" size={16} color={docType === 'attestation' ? '#fff' : '#888'} />
                  <Text style={[styles.typeBtnText, docType === 'attestation' && styles.typeBtnTextActive]}>Atestado</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Descrição *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Exame admissional NR-35"
                placeholderTextColor="#aaa"
                value={docDescription}
                onChangeText={setDocDescription}
              />
              <Text style={styles.label}>Data de vencimento (DD/MM/AAAA)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 31/12/2025"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={docExpiration}
                onChangeText={setDocExpiration}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddDocument} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Salvar documento</Text>}
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' },
  addBtn: {
    backgroundColor: '#1a73e8', borderRadius: 10,
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff8e1', marginHorizontal: 16,
    borderRadius: 10, padding: 12, marginBottom: 8,
    borderLeftWidth: 4, borderLeftColor: '#f57c00',
  },
  alertText: { color: '#f57c00', fontSize: 13, fontWeight: '500' },
  tabs: {
    flexDirection: 'row', marginHorizontal: 16,
    backgroundColor: '#fff', borderRadius: 12,
    padding: 4, marginBottom: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 4, padding: 10, borderRadius: 10,
  },
  tabActive: { backgroundColor: '#e8f0fe' },
  tabText: { fontSize: 11, color: '#888', fontWeight: '500' },
  tabTextActive: { color: '#1a73e8' },
  badge: {
    backgroundColor: '#e53935', borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  pendingCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    borderLeftWidth: 4, borderLeftColor: '#f57c00',
  },
  approveRow: { flexDirection: 'column', gap: 8 },
  approveBtn: {
    backgroundColor: '#e6f4ea', borderRadius: 8,
    padding: 8, alignItems: 'center',
  },
  rejectBtn: {
    backgroundColor: '#fce8e6', borderRadius: 8,
    padding: 8, alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#e8f0fe', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#1a73e8', fontWeight: 'bold', fontSize: 15 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e' },
  cardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  cardPosition: { fontSize: 12, color: '#1a73e8', marginTop: 2 },
  statusPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  docCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
  },
  docIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: 'bold', color: '#1a1a2e' },
  docEmployee: { fontSize: 12, color: '#555', marginTop: 2 },
  docType: { fontSize: 11, color: '#888', marginTop: 1 },
  docStatus: { alignItems: 'flex-end', gap: 3 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  expDate: { fontSize: 11, color: '#888' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#aaa' },
  emptySubText: { fontSize: 13, color: '#bbb', textAlign: 'center', paddingHorizontal: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 24, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  label: { fontSize: 13, color: '#555', fontWeight: '500', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#f5f7ff', borderRadius: 10, padding: 14,
    fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0e7ff',
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#e0e7ff',
  },
  typeBtnActive: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  typeBtnText: { color: '#888', fontSize: 12, fontWeight: '500' },
  typeBtnTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: '#1a73e8', borderRadius: 10,
    padding: 15, alignItems: 'center', marginTop: 20, marginBottom: 10,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});