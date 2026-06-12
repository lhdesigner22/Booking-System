import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import SkeletonTable from '../components/SkeletonTable.jsx';
import ChatReserva from '../components/ChatReserva.jsx';
import DateTimePicker from '../components/DateTimePicker.jsx';
import { useToast } from '../context/ToastContext.jsx';

const STATUS_LABEL = { pendente: 'Pendente', aprovada: 'Aprovada', cancelada: 'Cancelada', recusada: 'Recusada', devolvida: 'Devolvida' };

function exportarCSV(linhas, nomeArquivo) {
  const bom = '﻿';
  const csv = bom + linhas.map(l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nomeArquivo; a.click();
  URL.revokeObjectURL(url);
}
const CATEGORIAS   = ['Notebook', 'Monitor', 'Teclado', 'Mouse', 'Headset', 'Webcam', 'Cabo', 'Adaptador', 'Outro'];
const EMPTY_EQ     = { nome: '', descricao: '', categoria: '', numero_serie: '', quantidade_total: 1, disponivel: true };
const ABAS = [
  ['reservas',     'Reservas'],
  ['equipamentos', 'Equipamentos'],
  ['usuarios',     'Usuários'],
  ['relatorios',   'Relatórios'],
];

// ── Mini bar chart ─────────────────────────────────────────────────────────────
function BarChart({ data, labelKey, valueKey, color = '#4F46E5', title }) {
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);
  return (
    <div>
      {title && <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>{title}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 130, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={d[labelKey]}>{d[labelKey]}</div>
            <div style={{ flex: 1, background: 'var(--surface-2, #F3F4F6)', borderRadius: 4, height: 18, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(Number(d[valueKey]) / max) * 100}%` }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
                style={{ height: '100%', background: color, borderRadius: 4 }}
              />
            </div>
            <div style={{ width: 32, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
              {d[valueKey]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const [reservas,     setReservas]     = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [usuarios,     setUsuarios]     = useState([]);
  const [relatorios,   setRelatorios]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [aba,          setAba]          = useState('reservas');
  const toast = useToast();

  // Filtros reservas
  const [filtroStatus, setFiltroStatus] = useState('pendente');
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [buscaEquip,   setBuscaEquip]   = useState('');
  const [buscaData,    setBuscaData]    = useState('');

  // Busca equipamentos (aba admin)
  const [buscaEqAdmin,    setBuscaEqAdmin]    = useState('');
  const [filtroStatusEq,  setFiltroStatusEq]  = useState('todos');

  // Chat reserva
  const [chatReserva, setChatReserva] = useState(null);

  // Modais equipamento
  const [showModalEq,  setShowModalEq]  = useState(false);
  const [novoEq,       setNovoEq]       = useState(EMPTY_EQ);
  const [editEq,       setEditEq]       = useState(null);

  // Patrimônios
  const [patrimonioEq,        setPatrimonioEq]        = useState(null); // equipamento cujos patrimônios estão sendo gerenciados
  const [patrimonios,         setPatrimonios]         = useState([]);
  const [loadingPat,          setLoadingPat]          = useState(false);
  const [novoPat,             setNovoPat]             = useState({ codigo: '', descricao: '' });
  const [editPat,             setEditPat]             = useState(null);
  const [submittingPat,       setSubmittingPat]       = useState(false);

  // Modal aprovação com patrimônios
  const [aprovarReserva,      setAprovarReserva]      = useState(null);
  const [patrimoniosDisp,     setPatrimoniosDisp]     = useState([]);
  const [patrimoniosSel,      setPatrimoniosSel]      = useState([]);
  const [loadingAprovar,      setLoadingAprovar]      = useState(false);
  const [submittingAprovar,   setSubmittingAprovar]   = useState(false);

  // Modais usuário
  const [showModalUser, setShowModalUser] = useState(false);
  const [novoUser,      setNovoUser]      = useState({ nome: '', email: '', senha: '', admin: false, setor: '' });
  const [editUser,      setEditUser]      = useState(null);
  const [resetUser,     setResetUser]     = useState(null);
  const [novaSenha,     setNovaSenha]     = useState('');
  const [confirmDlg,    setConfirmDlg]    = useState({ open: false, title: '', message: '', action: null });

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const [resR, resE, resU, resRel] = await Promise.all([
        api.get('/admin/reservas'),
        api.get('/equipamentos'),
        api.get('/admin/usuarios'),
        api.get('/admin/relatorios'),
      ]);
      setReservas(resR.data);
      setEquipamentos(resE.data);
      setUsuarios(resU.data);
      setRelatorios(resRel.data);
    } catch (err) {
      toast({ message: err.response?.status === 403 ? 'Acesso negado. Apenas administradores.' : 'Erro ao carregar dados', type: 'error' });
    } finally { setLoading(false); }
  }

  /* ── Reservas ──────────────────────────────────────────── */
  async function atualizarStatus(id, status, patrimonios_ids) {
    try {
      await api.patch(`/admin/reservas/${id}/status`, { status, patrimonios_ids });
      toast({ message: `Reserva ${STATUS_LABEL[status].toLowerCase()} com sucesso!` });
      carregarDados();
    } catch (err) { toast({ message: err.response?.data?.error || 'Erro ao atualizar status', type: 'error' }); }
  }

  async function abrirModalAprovar(reserva) {
    setAprovarReserva(reserva);
    setPatrimoniosSel([]);
    setLoadingAprovar(true);
    try {
      const res = await api.get(`/patrimonios?equipamento_id=${reserva.equipamento_id}`);
      setPatrimoniosDisp(res.data.filter(p => !p.em_uso));
    } catch {
      setPatrimoniosDisp([]);
    } finally {
      setLoadingAprovar(false);
    }
  }

  async function confirmarAprovacao() {
    if (!aprovarReserva) return;
    setSubmittingAprovar(true);
    try {
      await atualizarStatus(aprovarReserva.id, 'aprovada', patrimoniosSel.length > 0 ? patrimoniosSel : undefined);
      setAprovarReserva(null);
    } finally {
      setSubmittingAprovar(false);
    }
  }

  function togglePatrimonio(id) {
    setPatrimoniosSel(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  /* ── Patrimônios ─────────────────────────────────────── */
  async function abrirPatrimonios(eq) {
    setPatrimonioEq(eq);
    setNovoPat({ codigo: '', descricao: '' });
    setEditPat(null);
    setLoadingPat(true);
    try {
      const res = await api.get(`/patrimonios?equipamento_id=${eq.id}`);
      setPatrimonios(res.data);
    } catch {
      setPatrimonios([]);
    } finally {
      setLoadingPat(false);
    }
  }

  async function criarPatrimonio(e) {
    e.preventDefault();
    if (!novoPat.codigo.trim()) return toast({ message: 'Código é obrigatório', type: 'error' });
    setSubmittingPat(true);
    try {
      await api.post('/patrimonios', { equipamento_id: patrimonioEq.id, ...novoPat });
      setNovoPat({ codigo: '', descricao: '' });
      const res = await api.get(`/patrimonios?equipamento_id=${patrimonioEq.id}`);
      setPatrimonios(res.data);
      toast({ message: 'Patrimônio cadastrado!' });
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Erro ao cadastrar patrimônio', type: 'error' });
    } finally { setSubmittingPat(false); }
  }

  async function salvarEdicaoPat(e) {
    e.preventDefault();
    if (!editPat?.codigo?.trim()) return toast({ message: 'Código é obrigatório', type: 'error' });
    setSubmittingPat(true);
    try {
      await api.put(`/patrimonios/${editPat.id}`, { codigo: editPat.codigo, descricao: editPat.descricao });
      setEditPat(null);
      const res = await api.get(`/patrimonios?equipamento_id=${patrimonioEq.id}`);
      setPatrimonios(res.data);
      toast({ message: 'Patrimônio atualizado!' });
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Erro ao atualizar patrimônio', type: 'error' });
    } finally { setSubmittingPat(false); }
  }

  async function excluirPatrimonio(pat) {
    setConfirmDlg({
      open: true,
      title: 'Excluir patrimônio',
      message: `Excluir o patrimônio "${pat.codigo}"? Esta ação não pode ser desfeita.`,
      action: async () => {
        try {
          await api.delete(`/patrimonios/${pat.id}`);
          const res = await api.get(`/patrimonios?equipamento_id=${patrimonioEq.id}`);
          setPatrimonios(res.data);
          toast({ message: 'Patrimônio removido.', type: 'info' });
        } catch (err) {
          toast({ message: err.response?.data?.error || 'Erro ao excluir patrimônio', type: 'error' });
        }
      },
    });
  }

  /* ── Equipamentos ──────────────────────────────────────── */
  async function toggleDisponivel(eq) {
    try {
      await api.put(`/equipamentos/${eq.id}`, { disponivel: !eq.disponivel });
      toast({ message: `Equipamento ${eq.disponivel ? 'desativado' : 'ativado'}.`, type: 'info' });
      carregarDados();
    } catch { toast({ message: 'Erro ao atualizar equipamento', type: 'error' }); }
  }

  async function criarEquipamento(e) {
    e.preventDefault();
    if (!novoEq.nome.trim()) return toast({ message: 'Nome é obrigatório', type: 'error' });
    if ((novoEq.quantidade_total ?? 1) < 1) return toast({ message: 'Quantidade deve ser ao menos 1', type: 'error' });
    setSubmitting(true);
    try {
      await api.post('/equipamentos', novoEq);
      setNovoEq(EMPTY_EQ);
      setShowModalEq(false);
      carregarDados();
      toast({ message: 'Equipamento cadastrado com sucesso!' });
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Erro ao criar equipamento', type: 'error' });
    } finally { setSubmitting(false); }
  }

  async function salvarEdicaoEq(e) {
    e.preventDefault();
    if (!editEq.nome.trim()) return toast({ message: 'Nome é obrigatório', type: 'error' });
    if ((editEq.quantidade_total ?? 1) < 1) return toast({ message: 'Quantidade deve ser ao menos 1', type: 'error' });
    setSubmitting(true);
    try {
      await api.put(`/equipamentos/${editEq.id}`, {
        nome:             editEq.nome,
        descricao:        editEq.descricao,
        categoria:        editEq.categoria,
        numero_serie:     editEq.numero_serie,
        quantidade_total: editEq.quantidade_total,
        disponivel:       editEq.disponivel,
      });
      setEditEq(null);
      carregarDados();
      toast({ message: 'Equipamento atualizado!' });
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Erro ao editar equipamento', type: 'error' });
    } finally { setSubmitting(false); }
  }

  function excluirEquipamento(id) {
    setConfirmDlg({
      open: true,
      title: 'Excluir equipamento',
      message: 'Excluir este equipamento? Esta ação não pode ser desfeita.',
      action: async () => {
        try {
          await api.delete(`/equipamentos/${id}`);
          carregarDados();
          toast({ message: 'Equipamento removido.', type: 'info' });
        } catch { toast({ message: 'Erro ao excluir equipamento', type: 'error' }); }
      },
    });
  }

  /* ── Usuários ──────────────────────────────────────────── */
  async function criarUsuario(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/usuarios', novoUser);
      setNovoUser({ nome: '', email: '', senha: '', admin: false, setor: '' });
      setShowModalUser(false);
      carregarDados();
      toast({ message: 'Usuário criado com sucesso!' });
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Erro ao criar usuário', type: 'error' });
    } finally { setSubmitting(false); }
  }

  async function salvarEdicaoUsuario(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/admin/usuarios/${editUser.id}`, { nome: editUser.nome, email: editUser.email, admin: editUser.admin, setor: editUser.setor });
      setEditUser(null);
      carregarDados();
      toast({ message: 'Usuário atualizado com sucesso!' });
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Erro ao atualizar usuário', type: 'error' });
    } finally { setSubmitting(false); }
  }

  function excluirUsuario(id) {
    setConfirmDlg({
      open: true,
      title: 'Excluir usuário',
      message: 'Excluir este usuário? Todas as reservas e comentários vinculados serão removidos.',
      action: async () => {
        try {
          await api.delete(`/admin/usuarios/${id}`);
          carregarDados();
          toast({ message: 'Usuário removido.', type: 'info' });
        } catch (err) {
          toast({ message: err.response?.data?.error || 'Erro ao excluir usuário', type: 'error' });
        }
      },
    });
  }

  async function resetarSenha(e) {
    e.preventDefault();
    if (!novaSenha || novaSenha.length < 4)
      return toast({ message: 'Senha deve ter ao menos 4 caracteres', type: 'error' });
    setSubmitting(true);
    try {
      const res = await api.patch(`/admin/usuarios/${resetUser.id}/resetsenha`, { novaSenha });
      toast({ message: res.data.mensagem || 'Senha redefinida!' });
      setResetUser(null);
      setNovaSenha('');
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Erro ao redefinir senha', type: 'error' });
    } finally { setSubmitting(false); }
  }

  /* ── Filtros de reservas ───────────────────────────────── */
  const filtradas = reservas.filter(r => {
    const passaStatus = filtroStatus === 'todas' || r.status === filtroStatus;
    const passaUser   = !buscaUsuario || r.usuario_nome?.toLowerCase().includes(buscaUsuario.toLowerCase());
    const passaEquip  = !buscaEquip   || r.equipamento_nome?.toLowerCase().includes(buscaEquip.toLowerCase());
    const passaData   = !buscaData    || r.data_inicio?.startsWith(buscaData);
    return passaStatus && passaUser && passaEquip && passaData;
  });

  const counts   = reservas.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  const pendentes = counts.pendente || 0;

  return (
    <PageTransition>
      <div className="page-layout">
        <Sidebar />
        <main className="main-content">
          <motion.div className="page-header" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <h2>Painel Admin</h2>
            <p>Gerencie reservas, equipamentos, usuários e veja relatórios</p>
          </motion.div>

          {/* Stats */}
          <div className="stats-row">
            {[
              { label: 'Total de reservas',    value: reservas.length,      color: '#818CF8', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.2)',
                icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
              { label: 'Aguardando aprovação', value: pendentes,            color: '#FCD34D', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',
                icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'Aprovadas',            value: counts.aprovada || 0, color: '#4ADE80', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)',
                icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'Usuários cadastrados', value: usuarios.length,      color: '#C084FC', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)',
                icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z' },
            ].map((s, i) => (
              <motion.div key={s.label} className="stat-card"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, ease: [0.22,1,0.36,1] }}
                whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}
                style={{ borderTop: `3px solid ${s.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  </div>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: s.bg, border: `1px solid ${s.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: s.color, flexShrink: 0,
                  }}>
                    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d={s.icon}/>
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Abas */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
            {ABAS.map(([key, label]) => (
              <motion.button key={key} whileTap={{ scale: 0.97 }} onClick={() => setAba(key)}
                style={{
                  padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                  color: aba === key ? 'var(--brand-green)' : 'var(--text-muted)',
                  borderBottom: aba === key ? '2px solid var(--brand-green)' : '2px solid transparent',
                  marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.18s',
                }}>
                {label}
                {key === 'reservas' && pendentes > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{ background: '#EF4444', color: '#fff', borderRadius: 10, fontSize: 11, padding: '1px 7px', fontWeight: 700 }}>
                    {pendentes}
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={aba}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}>

              {/* ──────────────── ABA RESERVAS ──────────────── */}
              {aba === 'reservas' && (
                <>
                  {/* Filtros avançados */}
                  <div className="card" style={{ marginBottom: 16, padding: '14px 16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                      <div>
                        <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Status</label>
                        <select className="form-input" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
                          style={{ marginBottom: 0 }}>
                          {['todas','pendente','aprovada','cancelada','recusada'].map(s => (
                            <option key={s} value={s}>{s === 'todas' ? 'Todas' : STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Usuário</label>
                        <input className="form-input" placeholder="Buscar usuário..." value={buscaUsuario}
                          onChange={e => setBuscaUsuario(e.target.value)} style={{ marginBottom: 0 }} />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Equipamento</label>
                        <input className="form-input" placeholder="Buscar equipamento..." value={buscaEquip}
                          onChange={e => setBuscaEquip(e.target.value)} style={{ marginBottom: 0 }} />
                      </div>
                      <div>
                        <DateTimePicker
                          label="Data (início)"
                          value={buscaData}
                          onChange={v => setBuscaData(v)}
                          showTime={false}
                        />
                      </div>
                    </div>
                    {(buscaUsuario || buscaEquip || buscaData) && (
                      <motion.button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setBuscaUsuario(''); setBuscaEquip(''); setBuscaData(''); }}>
                        ✕ Limpar filtros
                      </motion.button>
                    )}
                  </div>

                  <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    {filtradas.length} reserva{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}
                  </div>

                  <div className="card" style={{ padding: 0 }}>
                    <div className="table-wrap">
                      {loading ? <SkeletonTable rows={5} cols={7} /> : filtradas.length === 0 ? (
                        <div className="empty-state">
                          <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                          </svg>
                          <p>Nenhuma reserva nesta categoria</p>
                        </div>
                      ) : (
                        <table>
                          <thead><tr><th>#</th><th>Usuário</th><th>Equipamento</th><th>Qtd</th><th>Local de uso</th><th>Início</th><th>Fim</th><th>Status</th><th>Chat</th><th>Ações</th></tr></thead>
                          <tbody>
                            <AnimatePresence mode="popLayout">
                              {filtradas.map((r, i) => (
                                <motion.tr key={r.id} layout
                                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 16 }} transition={{ delay: i * 0.04 }}>
                                  <td style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}>#{r.id}</td>
                                  <td style={{ fontWeight: 500 }}>{r.usuario_nome}</td>
                                  <td>{r.equipamento_nome}</td>
                                  <td style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>{r.quantidade ?? 1}</td>
                                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                    {r.local_uso || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                                  </td>
                                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{new Date(r.data_inicio).toLocaleString('pt-BR')}</td>
                                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{new Date(r.data_fim).toLocaleString('pt-BR')}</td>
                                  <td><span className={`badge badge-${r.status}`}>{STATUS_LABEL[r.status]}</span></td>
                                  <td>
                                    <motion.button
                                      className="btn btn-ghost btn-sm"
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => setChatReserva(r)}
                                      title="Abrir chat"
                                      style={{ padding: '4px 10px' }}
                                    >
                                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                      </svg>
                                    </motion.button>
                                  </td>
                                  <td>
                                    {r.status === 'pendente' && (
                                      <div className="actions">
                                        <motion.button className="btn btn-success btn-sm" whileTap={{ scale: 0.95 }}
                                          onClick={() => abrirModalAprovar(r)}>✓ Aprovar</motion.button>
                                        <motion.button className="btn btn-danger btn-sm" whileTap={{ scale: 0.95 }}
                                          onClick={() => atualizarStatus(r.id, 'recusada')}>✕ Recusar</motion.button>
                                      </div>
                                    )}
                                  </td>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ──────────────── ABA EQUIPAMENTOS ──────────────── */}
              {aba === 'equipamentos' && (
                <>
                  <div style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                      <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                        width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      </svg>
                      <input className="form-input" placeholder="Buscar por nome ou categoria..."
                        value={buscaEqAdmin} onChange={e => setBuscaEqAdmin(e.target.value)}
                        style={{ paddingLeft: 36, marginBottom: 0 }} />
                    </div>
                    <select className="form-input" value={filtroStatusEq} onChange={e => setFiltroStatusEq(e.target.value)}
                      style={{ width: 160, marginBottom: 0 }}>
                      <option value="todos">Todos os status</option>
                      <option value="disponivel">Disponível</option>
                      <option value="indisponivel">Indisponível</option>
                    </select>
                    <motion.button className="btn btn-primary" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setShowModalEq(true)}>+ Novo equipamento</motion.button>
                  </div>
                  <div className="card" style={{ padding: 0 }}>
                    <div className="table-wrap">
                      {(() => {
                        const eqFiltrados = equipamentos.filter(eq => {
                          const q = buscaEqAdmin.toLowerCase();
                          const passaBusca = !q || eq.nome?.toLowerCase().includes(q) || eq.categoria?.toLowerCase().includes(q) || eq.numero_serie?.toLowerCase().includes(q);
                          const passaStatus = filtroStatusEq === 'todos' || (filtroStatusEq === 'disponivel' ? eq.disponivel : !eq.disponivel);
                          return passaBusca && passaStatus;
                        });
                        return loading ? <SkeletonTable rows={4} cols={5} /> : eqFiltrados.length === 0 ? (
                          <div className="empty-state"><p>{equipamentos.length === 0 ? 'Nenhum equipamento cadastrado' : 'Nenhum equipamento encontrado para os filtros aplicados'}</p></div>
                        ) : (
                        <table>
                          <thead><tr><th>#</th><th>Nome</th><th>Categoria</th><th>Qtd</th><th>Status</th><th>Ações</th></tr></thead>
                          <tbody>
                            <AnimatePresence mode="popLayout">
                              {eqFiltrados.map((eq, i) => (
                                <motion.tr key={eq.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                  exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}>
                                  <td style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}>#{eq.id}</td>
                                  <td>
                                    <div style={{ fontWeight: 500 }}>{eq.nome}</div>
                                    {eq.numero_serie && (
                                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{eq.numero_serie}</div>
                                    )}
                                    {eq.descricao && (
                                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{eq.descricao}</div>
                                    )}
                                  </td>
                                  <td>
                                    {eq.categoria
                                      ? <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: '#818CF8', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)' }}>{eq.categoria}</span>
                                      : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>
                                    }
                                  </td>
                                  <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    {eq.quantidade_disponivel ?? eq.quantidade_total}
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/{eq.quantidade_total}</span>
                                  </td>
                                  <td><span className={`badge badge-${eq.disponivel ? 'disponivel' : 'indisponivel'}`}>
                                    {eq.disponivel ? '● Disponível' : '● Indisponível'}
                                  </span></td>
                                  <td>
                                    <div className="actions">
                                      <motion.button className="btn btn-ghost btn-sm" whileTap={{ scale: 0.95 }}
                                        onClick={() => abrirPatrimonios(eq)}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                        Patrimônios
                                        <span style={{
                                          background: eq.total_patrimonios > 0 ? 'rgba(34,197,94,0.15)' : 'var(--surface-2)',
                                          color: eq.total_patrimonios > 0 ? '#4ADE80' : 'var(--text-muted)',
                                          border: `1px solid ${eq.total_patrimonios > 0 ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                                          borderRadius: 10, fontSize: 11, fontWeight: 700,
                                          padding: '1px 7px', minWidth: 20, textAlign: 'center',
                                        }}>
                                          {eq.total_patrimonios ?? 0}
                                        </span>
                                      </motion.button>
                                      <motion.button className="btn btn-ghost btn-sm" whileTap={{ scale: 0.95 }}
                                        onClick={() => setEditEq({ ...eq, numero_serie: eq.numero_serie || '', categoria: eq.categoria || '', descricao: eq.descricao || '' })}>Editar</motion.button>
                                      <motion.button className="btn btn-ghost btn-sm" whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleDisponivel(eq)}>{eq.disponivel ? 'Desativar' : 'Ativar'}</motion.button>
                                      <motion.button className="btn btn-danger btn-sm" whileTap={{ scale: 0.95 }}
                                        onClick={() => excluirEquipamento(eq.id)}>Excluir</motion.button>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          </tbody>
                        </table>
                        );
                      })()}
                    </div>
                  </div>
                </>
              )}

              {/* ──────────────── ABA USUÁRIOS ──────────────── */}
              {aba === 'usuarios' && (
                <>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <motion.button className="btn btn-primary" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setShowModalUser(true)}>+ Novo usuário</motion.button>
                  </div>
                  <div className="card" style={{ padding: 0 }}>
                    <div className="table-wrap">
                      {loading ? <SkeletonTable rows={4} cols={5} /> : usuarios.length === 0 ? (
                        <div className="empty-state"><p>Nenhum usuário cadastrado</p></div>
                      ) : (
                        <table>
                          <thead><tr><th>#</th><th>Nome</th><th>E-mail</th><th>Setor / Curso</th><th>Papel</th><th>Ações</th></tr></thead>
                          <tbody>
                            <AnimatePresence mode="popLayout">
                              {usuarios.map((u, i) => (
                                <motion.tr key={u.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                  exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}>
                                  <td style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}>#{u.id}</td>
                                  <td style={{ fontWeight: 500 }}>{u.nome}</td>
                                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                                  <td>
                                    {u.setor
                                      ? <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.setor}</span>
                                      : <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Não informado</span>
                                    }
                                  </td>
                                  <td><span className={`badge badge-${u.admin ? 'aprovada' : 'pendente'}`}>
                                    {u.admin ? '⚑ Admin' : '● Colaborador'}
                                  </span></td>
                                  <td>
                                    <div className="actions">
                                      <motion.button className="btn btn-ghost btn-sm" whileTap={{ scale: 0.95 }}
                                        onClick={() => setEditUser({ ...u, setor: u.setor || '' })}>Editar</motion.button>
                                      <motion.button className="btn btn-ghost btn-sm" whileTap={{ scale: 0.95 }}
                                        onClick={() => { setResetUser(u); setNovaSenha(''); }}
                                        title="Redefinir senha">🔑 Senha</motion.button>
                                      <motion.button className="btn btn-danger btn-sm" whileTap={{ scale: 0.95 }}
                                        onClick={() => excluirUsuario(u.id)}>Excluir</motion.button>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ──────────────── ABA RELATÓRIOS ──────────────── */}
              {aba === 'relatorios' && (
                <>
                  {/* Botões de exportação */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
                    <motion.button className="btn btn-ghost" whileTap={{ scale: 0.97 }} style={{ gap: 7, fontSize: 13 }}
                      onClick={() => {
                        const linhas = [
                          ['#', 'Equipamento', 'Usuário', 'E-mail', 'Setor', 'Início', 'Fim', 'Status', 'Quantidade', 'Local de uso'],
                          ...reservas.map(r => [r.id, r.equipamento_nome, r.usuario_nome, r.usuario_email, r.usuario_setor || '', new Date(r.data_inicio).toLocaleString('pt-BR'), new Date(r.data_fim).toLocaleString('pt-BR'), STATUS_LABEL[r.status] || r.status, r.quantidade || 1, r.local_uso || '']),
                        ];
                        exportarCSV(linhas, `reservas_${new Date().toISOString().slice(0,10)}.csv`);
                      }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Exportar Reservas
                    </motion.button>
                    <motion.button className="btn btn-ghost" whileTap={{ scale: 0.97 }} style={{ gap: 7, fontSize: 13 }}
                      onClick={() => {
                        const linhas = [
                          ['#', 'Nome', 'Categoria', 'Nº Série', 'Qtd Total', 'Disponível'],
                          ...equipamentos.map(e => [e.id, e.nome, e.categoria || '', e.numero_serie || '', e.quantidade_total, e.disponivel ? 'Sim' : 'Não']),
                        ];
                        exportarCSV(linhas, `equipamentos_${new Date().toISOString().slice(0,10)}.csv`);
                      }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Exportar Equipamentos
                    </motion.button>
                    <motion.button className="btn btn-ghost" whileTap={{ scale: 0.97 }} style={{ gap: 7, fontSize: 13 }}
                      onClick={() => {
                        const linhas = [
                          ['#', 'Nome', 'E-mail', 'Setor', 'Admin'],
                          ...usuarios.map(u => [u.id, u.nome, u.email, u.setor || '', u.admin ? 'Sim' : 'Não']),
                        ];
                        exportarCSV(linhas, `usuarios_${new Date().toISOString().slice(0,10)}.csv`);
                      }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Exportar Usuários
                    </motion.button>
                  </div>

                  {loading || !relatorios ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando relatórios...</div>
                  ) : (
                    <>
                      {/* Totais */}
                      <div className="stats-row" style={{ marginBottom: 20 }}>
                        {[
                          ['Total geral', relatorios.totais.total, '#4F46E5'],
                          ['Aprovadas',   relatorios.totais.aprovadas, '#22C55E'],
                          ['Pendentes',   relatorios.totais.pendentes, '#F59E0B'],
                          ['Recusadas',   relatorios.totais.recusadas, '#EF4444'],
                          ['Canceladas',  relatorios.totais.canceladas, '#6B7280'],
                        ].map(([label, value, color], i) => (
                          <motion.div key={label} className="stat-card"
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            whileHover={{ y: -2 }}>
                            <div className="stat-label">{label}</div>
                            <div className="stat-value" style={{ color }}>{value}</div>
                          </motion.div>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        {/* Por período */}
                        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                          {relatorios.porPeriodo.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem dados de período</div>
                          ) : (
                            <BarChart
                              data={relatorios.porPeriodo}
                              labelKey="mes"
                              valueKey="total"
                              color="#4F46E5"
                              title="Reservas por mês (últimos 6 meses)"
                            />
                          )}
                        </motion.div>

                        {/* Por equipamento */}
                        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                          {relatorios.porEquipamento.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem dados de equipamentos</div>
                          ) : (
                            <BarChart
                              data={relatorios.porEquipamento}
                              labelKey="nome"
                              valueKey="total"
                              color="#22C55E"
                              title="Top equipamentos mais reservados"
                            />
                          )}
                        </motion.div>
                      </div>

                      {/* Por usuário */}
                      <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        {relatorios.porUsuario.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem dados de usuários</div>
                        ) : (
                          <>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>
                              Top usuários com mais reservas
                            </div>
                            <div className="table-wrap">
                              <table>
                                <thead><tr><th>Usuário</th><th>E-mail</th><th>Total</th><th>Aprovadas</th></tr></thead>
                                <tbody>
                                  {relatorios.porUsuario.map((u, i) => (
                                    <motion.tr key={u.email}
                                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.04 }}>
                                      <td style={{ fontWeight: 500 }}>{u.nome}</td>
                                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                                      <td><span className="badge badge-disponivel">{u.total}</span></td>
                                      <td style={{ color: '#22C55E', fontWeight: 600 }}>{u.aprovadas}</td>
                                    </motion.tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </motion.div>
                    </>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Modal novo equipamento ── */}
      <Modal open={showModalEq} onClose={() => { setShowModalEq(false); setNovoEq(EMPTY_EQ); }} title="Novo equipamento" subtitle="Preencha os dados do equipamento">
        <form onSubmit={criarEquipamento}>
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-input" type="text" placeholder="Ex: Notebook Dell"
              value={novoEq.nome} onChange={e => setNovoEq({ ...novoEq, nome: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <select className="form-input" value={novoEq.categoria}
              onChange={e => setNovoEq({ ...novoEq, categoria: e.target.value })}>
              <option value="">Sem categoria</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Número de Série / Patrimônio</label>
            <input className="form-input" type="text" placeholder="Ex: SN-20240001"
              value={novoEq.numero_serie} onChange={e => setNovoEq({ ...novoEq, numero_serie: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Quantidade Total</label>
            <input className="form-input" type="number" min={1}
              value={novoEq.quantidade_total}
              onChange={e => setNovoEq({ ...novoEq, quantidade_total: parseInt(e.target.value) || 1 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input className="form-input" type="text" placeholder="Ex: i7, 16GB RAM, SSD 512GB"
              value={novoEq.descricao} onChange={e => setNovoEq({ ...novoEq, descricao: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={novoEq.disponivel}
                onChange={e => setNovoEq({ ...novoEq, disponivel: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: 'var(--brand-green)', cursor: 'pointer' }} />
              Equipamento habilitado para reservas
            </label>
          </div>
          <div className="modal-footer">
            <motion.button type="button" className="btn btn-ghost" whileTap={{ scale: 0.97 }} onClick={() => { setShowModalEq(false); setNovoEq(EMPTY_EQ); }}>Cancelar</motion.button>
            <motion.button type="submit" className="btn btn-primary" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              {submitting ? 'Cadastrando...' : 'Cadastrar'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* ── Modal editar equipamento ── */}
      <Modal open={!!editEq} onClose={() => setEditEq(null)} title="Editar equipamento" subtitle="Altere os dados do equipamento">
        {editEq && (
          <form onSubmit={salvarEdicaoEq}>
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input className="form-input" type="text" value={editEq.nome}
                onChange={e => setEditEq({ ...editEq, nome: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select className="form-input" value={editEq.categoria || ''}
                onChange={e => setEditEq({ ...editEq, categoria: e.target.value })}>
                <option value="">Sem categoria</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Número de Série / Patrimônio</label>
              <input className="form-input" type="text" placeholder="Ex: SN-20240001"
                value={editEq.numero_serie || ''}
                onChange={e => setEditEq({ ...editEq, numero_serie: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Quantidade Total</label>
              <input className="form-input" type="number" min={1}
                value={editEq.quantidade_total}
                onChange={e => setEditEq({ ...editEq, quantidade_total: parseInt(e.target.value) || 1 })} />
              {(() => {
                const emUso = (editEq.quantidade_total ?? 0) - (editEq.quantidade_disponivel ?? editEq.quantidade_total ?? 0);
                return emUso > 0 ? (
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#FCD34D' }}>
                    ⚠️ {emUso} unidade(s) em uso — não é possível reduzir abaixo disso.
                  </p>
                ) : null;
              })()}
            </div>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input className="form-input" type="text" placeholder="Ex: i7, 16GB RAM, SSD 512GB"
                value={editEq.descricao || ''}
                onChange={e => setEditEq({ ...editEq, descricao: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={editEq.disponivel}
                  onChange={e => setEditEq({ ...editEq, disponivel: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--brand-green)', cursor: 'pointer' }} />
                Equipamento habilitado para reservas
              </label>
            </div>
            <div className="modal-footer">
              <motion.button type="button" className="btn btn-ghost" whileTap={{ scale: 0.97 }} onClick={() => setEditEq(null)}>Cancelar</motion.button>
              <motion.button type="submit" className="btn btn-primary" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                {submitting ? 'Salvando...' : 'Salvar alterações'}
              </motion.button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Modal novo usuário ── */}
      <Modal open={showModalUser} onClose={() => setShowModalUser(false)} title="Novo usuário" subtitle="Crie um usuário e defina seu nível de acesso">
        <form onSubmit={criarUsuario}>
          <div className="form-group">
            <label className="form-label">Nome completo *</label>
            <input className="form-input" type="text" placeholder="João Silva"
              value={novoUser.nome} onChange={e => setNovoUser({ ...novoUser, nome: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail *</label>
            <input className="form-input" type="email" placeholder="joao@empresa.com"
              value={novoUser.email} onChange={e => setNovoUser({ ...novoUser, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Senha *</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={novoUser.senha} onChange={e => setNovoUser({ ...novoUser, senha: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Setor / Curso</label>
            <input className="form-input" type="text" placeholder="Ex: TI, Administração, Ensino Médio A..."
              value={novoUser.setor} onChange={e => setNovoUser({ ...novoUser, setor: e.target.value })} />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={novoUser.admin}
                onChange={e => setNovoUser({ ...novoUser, admin: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#22C55E', cursor: 'pointer' }} />
              Conceder permissão de administrador
            </label>
          </div>
          <div className="modal-footer">
            <motion.button type="button" className="btn btn-ghost" whileTap={{ scale: 0.97 }} onClick={() => setShowModalUser(false)}>Cancelar</motion.button>
            <motion.button type="submit" className="btn btn-primary" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              {submitting ? 'Criando...' : 'Criar usuário'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* ── Modal editar usuário ── */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Editar usuário" subtitle="Altere os dados ou o nível de acesso">
        {editUser && (
          <form onSubmit={salvarEdicaoUsuario}>
            <div className="form-group">
              <label className="form-label">Nome completo *</label>
              <input className="form-input" type="text"
                value={editUser.nome} onChange={e => setEditUser({ ...editUser, nome: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail *</label>
              <input className="form-input" type="email"
                value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Setor / Curso</label>
              <input className="form-input" type="text" placeholder="Ex: TI, Administração, Ensino Médio A..."
                value={editUser.setor || ''} onChange={e => setEditUser({ ...editUser, setor: e.target.value })} />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={editUser.admin}
                  onChange={e => setEditUser({ ...editUser, admin: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: '#22C55E', cursor: 'pointer' }} />
                Permissão de administrador
              </label>
            </div>
            <div className="modal-footer">
              <motion.button type="button" className="btn btn-ghost" whileTap={{ scale: 0.97 }} onClick={() => setEditUser(null)}>Cancelar</motion.button>
              <motion.button type="submit" className="btn btn-primary" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                {submitting ? 'Salvando...' : 'Salvar alterações'}
              </motion.button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Modal reset senha ── */}
      <Modal open={!!resetUser} onClose={() => setResetUser(null)} title="Redefinir Senha"
        subtitle={resetUser ? `Definir nova senha para ${resetUser.nome}` : ''}>
        {resetUser && (
          <form onSubmit={resetarSenha}>
            <div className="form-group">
              <label className="form-label">Nova senha *</label>
              <input className="form-input" type="password" placeholder="Mínimo 4 caracteres"
                value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              O usuário precisará usar essa senha no próximo login.
            </p>
            <div className="modal-footer">
              <motion.button type="button" className="btn btn-ghost" whileTap={{ scale: 0.97 }}
                onClick={() => setResetUser(null)}>Cancelar</motion.button>
              <motion.button type="submit" className="btn btn-primary" disabled={submitting}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                {submitting ? 'Redefinindo...' : '🔑 Redefinir senha'}
              </motion.button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Modal chat reserva ── */}
      <Modal
        open={!!chatReserva}
        onClose={() => setChatReserva(null)}
        title={`Chat — Reserva #${chatReserva?.id ?? ''}`}
        subtitle={chatReserva ? `${chatReserva.usuario_nome} · ${chatReserva.equipamento_nome}` : ''}
      >
        {chatReserva && (
          <div style={{ minHeight: 340 }}>
            <ChatReserva reservaId={chatReserva.id} />
            <div className="modal-footer" style={{ marginTop: 12 }}>
              <motion.button className="btn btn-ghost" whileTap={{ scale: 0.97 }}
                onClick={() => setChatReserva(null)}>
                Fechar
              </motion.button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDlg.open}
        title={confirmDlg.title}
        message={confirmDlg.message}
        confirmLabel="Excluir"
        onClose={() => setConfirmDlg(d => ({ ...d, open: false }))}
        onConfirm={() => confirmDlg.action?.()}
      />

      {/* ── Modal Aprovação com Patrimônios ── */}
      <Modal open={!!aprovarReserva} onClose={() => !submittingAprovar && setAprovarReserva(null)}
        title="Aprovar Reserva" subtitle={aprovarReserva ? `${aprovarReserva.equipamento_nome} — ${aprovarReserva.usuario_nome}` : ''}>
        {aprovarReserva && (
          <div>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Equipamento', aprovarReserva.equipamento_nome],
                ['Quantidade',  aprovarReserva.quantidade ?? 1],
                ['Usuário',     aprovarReserva.usuario_nome],
                ['Período',     `${new Date(aprovarReserva.data_inicio).toLocaleString('pt-BR')} → ${new Date(aprovarReserva.data_fim).toLocaleString('pt-BR')}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            {loadingAprovar ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>Carregando patrimônios...</p>
            ) : patrimoniosDisp.length === 0 ? (
              <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                Nenhum patrimônio cadastrado para este equipamento. A reserva será aprovada diretamente.
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Selecione {aprovarReserva.quantidade ?? 1} patrimônio(s) a liberar
                  <span style={{ marginLeft: 8, fontSize: 12, color: patrimoniosSel.length === (aprovarReserva.quantidade ?? 1) ? '#4ADE80' : 'var(--text-muted)', fontWeight: 500 }}>
                    ({patrimoniosSel.length}/{aprovarReserva.quantidade ?? 1} selecionado{patrimoniosSel.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                  {patrimoniosDisp.map(p => {
                    const sel = patrimoniosSel.includes(p.id);
                    const maxAtingido = !sel && patrimoniosSel.length >= (aprovarReserva.quantidade ?? 1);
                    return (
                      <label key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                        borderRadius: 8, cursor: maxAtingido ? 'not-allowed' : 'pointer',
                        border: `1px solid ${sel ? 'rgba(34,197,94,0.5)' : 'var(--border)'}`,
                        background: sel ? 'rgba(34,197,94,0.08)' : 'var(--surface-2)',
                        opacity: maxAtingido ? 0.5 : 1, transition: 'all 0.15s',
                      }}>
                        <input type="checkbox" checked={sel} disabled={maxAtingido}
                          onChange={() => togglePatrimonio(p.id)}
                          style={{ accentColor: '#22C55E', width: 15, height: 15, cursor: maxAtingido ? 'not-allowed' : 'pointer' }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{p.codigo}</span>
                          {p.descricao && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>{p.descricao}</span>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="modal-footer">
              <motion.button className="btn btn-ghost" whileTap={{ scale: 0.97 }}
                onClick={() => setAprovarReserva(null)} disabled={submittingAprovar}>Cancelar</motion.button>
              <motion.button className="btn btn-success" whileTap={{ scale: 0.97 }}
                disabled={submittingAprovar || (!loadingAprovar && patrimoniosDisp.length > 0 && patrimoniosSel.length !== (aprovarReserva.quantidade ?? 1))}
                onClick={confirmarAprovacao}
                style={{ opacity: (submittingAprovar || (!loadingAprovar && patrimoniosDisp.length > 0 && patrimoniosSel.length !== (aprovarReserva.quantidade ?? 1))) ? 0.6 : 1 }}>
                {submittingAprovar ? 'Aprovando...' : '✓ Confirmar Aprovação'}
              </motion.button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal Gestão de Patrimônios ── */}
      <Modal open={!!patrimonioEq} onClose={() => { setPatrimonioEq(null); setEditPat(null); }}
        title="Patrimônios" subtitle={patrimonioEq?.nome}>
        {patrimonioEq && (
          <div>
            {/* Formulário adicionar */}
            {!editPat && (
              <form onSubmit={criarPatrimonio} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input className="form-input" placeholder="Código de patrimônio *" style={{ flex: 2, minWidth: 120, marginBottom: 0 }}
                  value={novoPat.codigo} onChange={e => setNovoPat({ ...novoPat, codigo: e.target.value })} />
                <input className="form-input" placeholder="Descrição (opcional)" style={{ flex: 3, minWidth: 140, marginBottom: 0 }}
                  value={novoPat.descricao} onChange={e => setNovoPat({ ...novoPat, descricao: e.target.value })} />
                <motion.button type="submit" className="btn btn-primary btn-sm" disabled={submittingPat} whileTap={{ scale: 0.97 }}
                  style={{ whiteSpace: 'nowrap' }}>
                  {submittingPat ? '...' : '+ Adicionar'}
                </motion.button>
              </form>
            )}

            {/* Formulário editar */}
            {editPat && (
              <form onSubmit={salvarEdicaoPat} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', background: 'rgba(34,197,94,0.06)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)' }}>
                <input className="form-input" placeholder="Código *" style={{ flex: 2, minWidth: 120, marginBottom: 0 }}
                  value={editPat.codigo} onChange={e => setEditPat({ ...editPat, codigo: e.target.value })} />
                <input className="form-input" placeholder="Descrição" style={{ flex: 3, minWidth: 140, marginBottom: 0 }}
                  value={editPat.descricao || ''} onChange={e => setEditPat({ ...editPat, descricao: e.target.value })} />
                <motion.button type="submit" className="btn btn-primary btn-sm" disabled={submittingPat} whileTap={{ scale: 0.97 }}>Salvar</motion.button>
                <motion.button type="button" className="btn btn-ghost btn-sm" whileTap={{ scale: 0.97 }} onClick={() => setEditPat(null)}>✕</motion.button>
              </form>
            )}

            {/* Lista */}
            {loadingPat ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</p>
            ) : patrimonios.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
                Nenhum patrimônio cadastrado para este equipamento.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                {patrimonios.map(p => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                  }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{p.codigo}</span>
                    {p.descricao && <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 2 }}>{p.descricao}</span>}
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                      color: p.em_uso ? '#FCD34D' : '#4ADE80',
                      background: p.em_uso ? 'rgba(252,211,77,0.1)' : 'rgba(74,222,128,0.1)',
                      border: `1px solid ${p.em_uso ? 'rgba(252,211,77,0.3)' : 'rgba(74,222,128,0.3)'}`,
                      whiteSpace: 'nowrap',
                    }}>
                      {p.em_uso ? 'Em uso' : 'Disponível'}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <motion.button className="btn btn-ghost btn-sm" whileTap={{ scale: 0.95 }}
                        onClick={() => setEditPat({ ...p })} disabled={p.em_uso} style={{ opacity: p.em_uso ? 0.4 : 1 }}>
                        Editar
                      </motion.button>
                      <motion.button className="btn btn-danger btn-sm" whileTap={{ scale: 0.95 }}
                        onClick={() => excluirPatrimonio(p)} disabled={p.em_uso} style={{ opacity: p.em_uso ? 0.4 : 1 }}>
                        Excluir
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
              {patrimonios.length} patrimônio{patrimonios.length !== 1 ? 's' : ''} cadastrado{patrimonios.length !== 1 ? 's' : ''}
            </div>

            <div className="modal-footer">
              <motion.button className="btn btn-ghost" whileTap={{ scale: 0.97 }}
                onClick={() => { setPatrimonioEq(null); setEditPat(null); }}>Fechar</motion.button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
