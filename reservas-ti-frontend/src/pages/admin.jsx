import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition.jsx';
import Modal from '../components/Modal.jsx';
import SkeletonTable from '../components/SkeletonTable.jsx';
import ChatReserva from '../components/ChatReserva.jsx';
import DateTimePicker from '../components/DateTimePicker.jsx';
import { useToast } from '../context/ToastContext.jsx';

const STATUS_LABEL = { pendente: 'Pendente', aprovada: 'Aprovada', cancelada: 'Cancelada', recusada: 'Recusada' };
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

  // Chat reserva
  const [chatReserva, setChatReserva] = useState(null);

  // Modais equipamento
  const [showModalEq,  setShowModalEq]  = useState(false);
  const [novoEq,       setNovoEq]       = useState(EMPTY_EQ);
  const [editEq,       setEditEq]       = useState(null);

  // Modais usuário
  const [showModalUser, setShowModalUser] = useState(false);
  const [novoUser,      setNovoUser]      = useState({ nome: '', email: '', senha: '', admin: false, setor: '' });
  const [editUser,      setEditUser]      = useState(null);
  const [resetUser,     setResetUser]     = useState(null);
  const [novaSenha,     setNovaSenha]     = useState('');

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
  async function atualizarStatus(id, status) {
    try {
      await api.patch(`/admin/reservas/${id}/status`, { status });
      toast({ message: `Reserva ${STATUS_LABEL[status].toLowerCase()} com sucesso!` });
      carregarDados();
    } catch { toast({ message: 'Erro ao atualizar status', type: 'error' }); }
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

  async function excluirEquipamento(id) {
    if (!confirm('Excluir este equipamento?')) return;
    try {
      await api.delete(`/equipamentos/${id}`);
      carregarDados();
      toast({ message: 'Equipamento removido.', type: 'info' });
    } catch { toast({ message: 'Erro ao excluir equipamento', type: 'error' }); }
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

  async function excluirUsuario(id) {
    if (!confirm('Excluir este usuário?')) return;
    try {
      await api.delete(`/admin/usuarios/${id}`);
      carregarDados();
      toast({ message: 'Usuário removido.', type: 'info' });
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Erro ao excluir usuário', type: 'error' });
    }
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
              { label: 'Total de reservas',    value: reservas.length,      color: '#4F46E5' },
              { label: 'Aguardando aprovação', value: pendentes,            color: '#F59E0B' },
              { label: 'Aprovadas',            value: counts.aprovada || 0, color: '#22C55E' },
              { label: 'Usuários',             value: usuarios.length,      color: '#6366F1' },
            ].map((s, i) => (
              <motion.div key={s.label} className="stat-card"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
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
                                          onClick={() => atualizarStatus(r.id, 'aprovada')}>✓ Aprovar</motion.button>
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
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <motion.button className="btn btn-primary" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setShowModalEq(true)}>+ Novo equipamento</motion.button>
                  </div>
                  <div className="card" style={{ padding: 0 }}>
                    <div className="table-wrap">
                      {loading ? <SkeletonTable rows={4} cols={5} /> : equipamentos.length === 0 ? (
                        <div className="empty-state"><p>Nenhum equipamento cadastrado</p></div>
                      ) : (
                        <table>
                          <thead><tr><th>#</th><th>Nome</th><th>Categoria</th><th>Qtd</th><th>Status</th><th>Ações</th></tr></thead>
                          <tbody>
                            <AnimatePresence mode="popLayout">
                              {equipamentos.map((eq, i) => (
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
                      )}
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
    </PageTransition>
  );
}
