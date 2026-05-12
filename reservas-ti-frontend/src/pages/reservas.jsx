import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition.jsx';
import SkeletonTable from '../components/SkeletonTable.jsx';
import CalendarioDisponibilidade from '../components/CalendarioDisponibilidade.jsx';
import DateTimePicker from '../components/DateTimePicker.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ChatReserva from '../components/ChatReserva.jsx';
import { useToast } from '../context/ToastContext.jsx';

const STATUS_LABEL  = { pendente: 'Pendente', aprovada: 'Aprovada', cancelada: 'Cancelada', recusada: 'Recusada', devolvida: 'Devolvida' };
const STATUS_CONFIG = {
  pendente:  { color: '#FCD34D', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  icon: '⏳' },
  aprovada:  { color: '#4ADE80', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   icon: '✓'  },
  cancelada: { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)',  icon: '✕'  },
  recusada:  { color: '#F87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   icon: '✗'  },
  devolvida: { color: '#818CF8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)', icon: '↩'  },
};

const STAT_META = [
  { key: 'total',     label: 'Total',              color: '#818CF8', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { key: 'pendente',  label: 'Pendente',            color: '#FCD34D', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'aprovada',  label: 'Aprovada',            color: '#4ADE80', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'devolvida', label: 'Devolvida',           color: '#818CF8', icon: 'M9 14l-4-4 4-4m11 4H5' },
  { key: 'negadas',   label: 'Cancelada\nRecusada', color: '#F87171', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export default function Reservas() {
  const [reservas, setReservas]         = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [form, setForm]                 = useState({ equipamento_id: '', data_inicio: '', data_fim: '', quantidade: 1, local_uso: '' });
  const [equipNome, setEquipNome]       = useState('');
  const [filtro, setFiltro]             = useState('todas');
  const [busca, setBusca]           = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [showCal, setShowCal]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detalhe, setDetalhe]       = useState(null);
  const [confirmDlg, setConfirmDlg] = useState({ open: false, title: '', message: '', action: null });
  const prevStatusRef               = useRef({});
  const location = useLocation();
  const toast    = useToast();

  useEffect(() => {
    api.get('/equipamentos').then(r => setEquipamentos(r.data)).catch(() => {});
    if (location.state?.equipamento_id) {
      setForm(f => ({ ...f, equipamento_id: location.state.equipamento_id }));
      setEquipNome(location.state.nome || '');
      setShowForm(true);
    }
    carregarReservas();
  }, [location.state]);

  async function carregarReservas() {
    setLoading(true);
    try {
      const res = await api.get('/reservas');
      res.data.forEach(r => {
        const prev = prevStatusRef.current[r.id];
        if (prev && prev !== r.status) {
          toast({
            message: `"${r.equipamento_nome}" foi ${STATUS_LABEL[r.status]?.toLowerCase() ?? r.status}`,
            type: r.status === 'aprovada' ? 'success' : r.status === 'recusada' ? 'error' : 'info',
          });
        }
        prevStatusRef.current[r.id] = r.status;
      });
      setReservas(res.data);
    } catch {
      toast({ message: 'Erro ao carregar reservas', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (new Date(form.data_inicio) >= new Date(form.data_fim))
      return toast({ message: 'Data de início deve ser anterior à data de fim', type: 'error' });
    setSubmitting(true);
    try {
      await api.post('/reservas', form);
      toast({ message: 'Reserva criada! Aguardando aprovação.' });
      setForm({ equipamento_id: '', data_inicio: '', data_fim: '', quantidade: 1, local_uso: '' });
      setEquipNome(''); setShowForm(false); setShowCal(false);
      carregarReservas();
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Erro ao criar reserva', type: 'error' });
    } finally { setSubmitting(false); }
  }

  function duplicar(r) {
    setForm({ equipamento_id: r.equipamento_id, data_inicio: '', data_fim: '', quantidade: r.quantidade || 1, local_uso: r.local_uso || '' });
    setEquipNome(r.equipamento_nome);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelar(id) {
    setConfirmDlg({
      open: true,
      title: 'Cancelar reserva',
      message: 'Tem certeza que deseja cancelar esta reserva?',
      action: async () => {
        try {
          await api.patch(`/reservas/${id}/status`, { status: 'cancelada' });
          toast({ message: 'Reserva cancelada.', type: 'info' });
          carregarReservas();
        } catch { toast({ message: 'Erro ao cancelar', type: 'error' }); }
      },
    });
  }

  const filtradas = reservas.filter(r => {
    const passaStatus = filtro === 'todas' || r.status === filtro;
    const passaBusca  = !busca || r.equipamento_nome?.toLowerCase().includes(busca.toLowerCase());
    return passaStatus && passaBusca;
  });

  const counts   = reservas.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  const pendentes = counts.pendente || 0;

  const statValues = {
    total:     reservas.length,
    pendente:  counts.pendente  || 0,
    aprovada:  counts.aprovada  || 0,
    devolvida: counts.devolvida || 0,
    negadas:   (counts.cancelada || 0) + (counts.recusada || 0),
  };

  return (
    <PageTransition>
      <div className="page-layout">
        <Sidebar />
        <main className="main-content">

          {/* Header */}
          <motion.div
            className="page-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <h2>Minhas Reservas</h2>
              <p>Acompanhe e gerencie suas solicitações</p>
            </div>
            <motion.button
              className="btn btn-primary"
              whileHover={{ scale: 1.03, boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setShowForm(v => !v); setShowCal(false); }}
              style={{ gap: 8 }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={showForm ? 'close' : 'open'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  {showForm ? '✕' : '+'}
                </motion.span>
              </AnimatePresence>
              {showForm ? 'Fechar' : 'Nova reserva'}
            </motion.button>
          </motion.div>

          {/* Banner pendentes */}
          <AnimatePresence>
            {pendentes > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  borderLeft: '3px solid #F59E0B',
                  borderRadius: 10, padding: '10px 16px', marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 13, color: '#FCD34D', overflow: 'hidden',
                }}
              >
                <motion.span
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
                  style={{ fontSize: 16 }}
                >⏳</motion.span>
                <span>Você tem <strong>{pendentes}</strong> reserva{pendentes > 1 ? 's' : ''} aguardando aprovação.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stat cards */}
          <div className="stats-row">
            {STAT_META.map((s, i) => (
              <motion.div
                key={s.key}
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}
                style={{ borderTop: `3px solid ${s.color}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="stat-label" style={s.key === 'negadas' ? { fontSize: 11, lineHeight: 1.35 } : {}}>
                      {s.label.split('\n').map((line, i) => (
                        <span key={i} style={{ display: 'block' }}>{line}</span>
                      ))}
                    </div>
                    <div className="stat-value" style={{ color: s.color }}>{statValues[s.key]}</div>
                  </div>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `${s.color}18`,
                    border: `1px solid ${s.color}30`,
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

          {/* Form nova reserva */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                className="card"
                style={{ marginBottom: 20, borderTop: '2px solid rgba(34,197,94,0.3)' }}
                initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                      {equipNome ? `Reservar: ${equipNome}` : 'Nova reserva'}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Preencha o período desejado</p>
                  </div>
                  {form.equipamento_id && (
                    <motion.button
                      className="btn btn-ghost btn-sm"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCal(v => !v)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                      </svg>
                      {showCal ? 'Ocultar calendário' : 'Ver disponibilidade'}
                    </motion.button>
                  )}
                </div>

                <AnimatePresence>
                  {showCal && form.equipamento_id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        overflow: 'hidden', marginBottom: 20,
                        background: 'var(--surface-2)', borderRadius: 10, padding: 16,
                        border: '1px solid var(--border)',
                      }}
                    >
                      <CalendarioDisponibilidade equipamentoId={form.equipamento_id} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit}>
                  {/* Linha 1: Equipamento + Local de uso */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Equipamento</label>
                      <select className="form-input" required
                        value={form.equipamento_id}
                        onChange={e => {
                          const id = e.target.value;
                          const eq = equipamentos.find(eq => String(eq.id) === id);
                          setForm({ ...form, equipamento_id: id });
                          setEquipNome(eq?.nome || '');
                        }}
                      >
                        <option value="">Selecione um equipamento...</option>
                        {equipamentos.map(eq => (
                          <option key={eq.id} value={eq.id} disabled={eq.quantidade_disponivel === 0}>
                            {eq.nome}{eq.categoria ? ` — ${eq.categoria}` : ''}{eq.quantidade_disponivel === 0 ? ' (indisponível)' : ` (${eq.quantidade_disponivel} disponível)`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Local de uso</label>
                      <input className="form-input" type="text" placeholder="Ex: Sala 3, Auditório, Lab..."
                        value={form.local_uso}
                        onChange={e => setForm({ ...form, local_uso: e.target.value })} />
                    </div>
                  </div>

                  {/* Linha 2: Datas + Quantidade + Botão */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px auto', gap: 12, alignItems: 'end' }}>
                    <DateTimePicker
                      label="Data de início"
                      value={form.data_inicio}
                      onChange={v => setForm({ ...form, data_inicio: v })}
                      minDate={new Date().toISOString()}
                      required
                    />
                    <DateTimePicker
                      label="Data de fim"
                      value={form.data_fim}
                      min={form.data_inicio}
                      onChange={v => setForm({ ...form, data_fim: v })}
                      required
                    />
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Quantidade</label>
                      <input className="form-input" type="number" min="1" max="10" placeholder="1"
                        value={form.quantidade}
                        onChange={e => setForm({ ...form, quantidade: Math.min(10, Math.max(1, parseInt(e.target.value) || 1)) })} required />
                    </div>
                    <motion.button
                      className="btn btn-primary"
                      type="submit"
                      disabled={submitting}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {submitting ? (
                        <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                          Criando...
                        </motion.span>
                      ) : 'Criar'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filtros + busca */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="filter-row" style={{ flex: 1, minWidth: 0 }}>
              {['todas', 'pendente', 'aprovada', 'devolvida', 'cancelada', 'recusada'].map(f => (
                <motion.button
                  key={f}
                  className={`filter-btn ${filtro === f ? 'active' : ''}`}
                  onClick={() => setFiltro(f)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {f === 'todas' ? 'Todas' : STATUS_LABEL[f]}
                  {f !== 'todas' && counts[f] > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        marginLeft: 4,
                        background: filtro === f ? 'rgba(255,255,255,0.2)' : 'var(--border-strong)',
                        borderRadius: 10, fontSize: 11, padding: '1px 6px', fontWeight: 700,
                      }}
                    >
                      {counts[f]}
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="form-input"
                placeholder="Buscar equipamento..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ paddingLeft: 32, maxWidth: 220, marginBottom: 0 }}
              />
            </div>
          </div>

          {/* Tabela */}
          <motion.div
            className="card"
            style={{ padding: 0, overflow: 'hidden' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="table-wrap">
              {loading ? (
                <SkeletonTable rows={4} cols={5} />
              ) : filtradas.length === 0 ? (
                <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  <p>Nenhuma reserva encontrada</p>
                </motion.div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Equipamento</th>
                      <th>Qtd</th>
                      <th>Local de uso</th>
                      <th>Início</th>
                      <th>Fim</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {filtradas.map((r, i) => {
                        const cfg = STATUS_CONFIG[r.status] || {};
                        return (
                          <motion.tr
                            key={r.id}
                            layout
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
                            transition={{ delay: i * 0.04, duration: 0.22 }}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setDetalhe(r)}
                            whileHover={{ backgroundColor: 'var(--table-hover)' }}
                          >
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: 8,
                                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 14, flexShrink: 0,
                                }}>
                                  {cfg.icon}
                                </div>
                                <span style={{ fontWeight: 500 }}>{r.equipamento_nome}</span>
                              </div>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                              {r.quantidade ?? 1}
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                              {r.local_uso || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                              {new Date(r.data_inicio).toLocaleString('pt-BR')}
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                              {new Date(r.data_fim).toLocaleString('pt-BR')}
                            </td>
                            <td>
                              <span className={`badge badge-${r.status}`}>
                                {cfg.icon} {STATUS_LABEL[r.status]}
                              </span>
                            </td>
                            <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {r.status === 'pendente' && (
                                  <motion.button
                                    className="btn btn-ghost btn-sm"
                                    whileHover={{ scale: 1.04, color: '#F87171' }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => cancelar(r.id)}
                                  >
                                    Cancelar
                                  </motion.button>
                                )}
                                <motion.button
                                  className="btn btn-ghost btn-sm"
                                  title="Reservar novamente o mesmo equipamento"
                                  whileHover={{ scale: 1.04, color: '#4ADE80' }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => duplicar(r)}
                                >
                                  Duplicar
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </main>
      </div>

      {/* Modal detalhe */}
      <Modal open={!!detalhe} onClose={() => setDetalhe(null)} title="Detalhes da Reserva" subtitle={detalhe?.equipamento_nome}>
        {detalhe && (() => {
          const cfg = STATUS_CONFIG[detalhe.status] || {};
          return (
            <div>
              {/* Status highlight */}
              <div style={{
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 18 }}>{cfg.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: cfg.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</div>
                  <div style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 }}>{STATUS_LABEL[detalhe.status]}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Equipamento', detalhe.equipamento_nome],
                  ['Quantidade', detalhe.quantidade ?? 1],
                  ['Local de uso', detalhe.local_uso || '—'],
                  ['Início', new Date(detalhe.data_inicio).toLocaleString('pt-BR')],
                  ['Fim',    new Date(detalhe.data_fim).toLocaleString('pt-BR')],
                  ['ID da reserva', `#${detalhe.id}`],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 14, padding: '10px 0',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Chat */}
              <div style={{
                marginTop: 20, paddingTop: 16,
                borderTop: '1px solid var(--border)',
              }}>
                <ChatReserva reservaId={detalhe.id} />
              </div>

              <div className="modal-footer" style={{ marginTop: 16 }}>
                <motion.button className="btn btn-ghost" whileTap={{ scale: 0.97 }} onClick={() => setDetalhe(null)}>
                  Fechar
                </motion.button>
                {detalhe.status === 'pendente' && (
                  <motion.button
                    className="btn btn-danger"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { cancelar(detalhe.id); setDetalhe(null); }}
                  >
                    Cancelar reserva
                  </motion.button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      <ConfirmDialog
        open={confirmDlg.open}
        title={confirmDlg.title}
        message={confirmDlg.message}
        confirmLabel="Cancelar reserva"
        onClose={() => setConfirmDlg(d => ({ ...d, open: false }))}
        onConfirm={() => confirmDlg.action?.()}
      />
    </PageTransition>
  );
}