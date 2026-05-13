import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition.jsx';
import SkeletonTable from '../components/SkeletonTable.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';

const fmtData = (d) => {
  if (!d) return '—';
  const normalized = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d + 'T00:00' : d;
  return new Date(normalized).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

const STATUS_CONFIG = {
  aprovada:  { color: '#4ADE80', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   label: 'Aguardando Devolução' },
  devolvida: { color: '#818CF8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.3)', label: 'Devolvida' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
      padding: '3px 10px', borderRadius: 20,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      {status === 'aprovada'
        ? <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        : <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
      }
      {cfg.label}
    </span>
  );
}

export default function Devolucoes() {
  const [reservas,     setReservas]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [filtro,       setFiltro]       = useState('aprovada');
  const [busca,        setBusca]        = useState('');
  const [confirmando,  setConfirmando]  = useState(null);
  const toast = useToast();

  useEffect(() => { carregarDevolucoes(); }, []);

  async function carregarDevolucoes() {
    setLoading(true);
    try {
      const res = await api.get('/devolucoes');
      setReservas(res.data);
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Erro ao carregar devoluções', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const fecharModal = useCallback(() => {
    if (submittingId) return;
    setConfirmando(null);
  }, [submittingId]);

  async function confirmarDevolucao() {
    if (!confirmando) return;
    setSubmittingId(confirmando.id);
    try {
      const res = await api.patch(`/devolucoes/${confirmando.id}/devolver`);
      toast({ message: res.data.mensagem || 'Devolução confirmada!', type: 'success' });
      setConfirmando(null);
      await carregarDevolucoes();
    } catch (err) {
      const msg = err.response?.data?.error || `Erro ${err.response?.status || ''}: falha ao confirmar devolução`;
      toast({ message: msg, type: 'error' });
    } finally {
      setSubmittingId(null);
    }
  }

  const { totalAguardando, totalAtrasadas, totalDevolvidas } = useMemo(() => {
    const agora = new Date();
    return {
      totalAguardando: reservas.filter(r => r.status === 'aprovada').length,
      totalAtrasadas:  reservas.filter(r => r.status === 'aprovada' && new Date(r.data_fim) < agora).length,
      totalDevolvidas: reservas.filter(r => r.status === 'devolvida').length,
    };
  }, [reservas]);

  const reservasFiltradas = useMemo(() => reservas.filter(r => {
    if (filtro !== 'todas' && r.status !== filtro) return false;
    if (!busca) return true;
    const b = busca.toLowerCase();
    return (
      r.equipamento_nome?.toLowerCase().includes(b) ||
      r.usuario_nome?.toLowerCase().includes(b)     ||
      r.usuario_email?.toLowerCase().includes(b)
    );
  }), [reservas, filtro, busca]);

  const submitting = submittingId === confirmando?.id;

  const FILTROS = [
    { key: 'aprovada',  label: 'Aguardando' },
    { key: 'devolvida', label: 'Devolvidas' },
    { key: 'todas',     label: 'Todas'      },
  ];

  return (
    <PageTransition>
      <div className="page-layout">
        <Sidebar />
        <main className="main-content">

          {/* Header */}
          <motion.div
            className="page-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2>Devoluções</h2>
            <p>Confirme a devolução dos equipamentos e libere para o estoque</p>
          </motion.div>

          {/* Stat cards */}
          <div className="stats-row">
            {[
              { label: 'Aguardando Devolução', value: totalAguardando, color: '#4ADE80', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)',
                icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'Devoluções Atrasadas', value: totalAtrasadas,  color: '#F87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',
                icon: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
              { label: 'Devolvidas',           value: totalDevolvidas, color: '#818CF8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.2)',
                icon: 'M9 14l-4-4 4-4m11 4H5' },
            ].map((c, i) => (
              <motion.div
                key={c.label}
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}
                style={{ borderTop: `3px solid ${c.color}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="stat-label">{c.label}</div>
                    <div className="stat-value" style={{ color: c.color }}>
                      {loading ? '—' : c.value}
                    </div>
                  </div>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: c.bg, border: `1px solid ${c.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: c.color, flexShrink: 0,
                  }}>
                    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d={c.icon}/>
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filtros e busca */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <div className="filter-row" style={{ margin: 0 }}>
              {FILTROS.map(f => (
                <motion.button
                  key={f.key}
                  className={`filter-btn ${filtro === f.key ? 'active' : ''}`}
                  onClick={() => setFiltro(f.key)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {f.label}
                  {f.key === 'aprovada' && totalAguardando > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        marginLeft: 4,
                        background: filtro === f.key ? 'rgba(255,255,255,0.2)' : 'var(--border-strong)',
                        borderRadius: 10, fontSize: 11, padding: '1px 6px', fontWeight: 700,
                      }}
                    >
                      {totalAguardando}
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </div>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="form-input"
                placeholder="Buscar equipamento ou usuário..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ paddingLeft: 36, marginBottom: 0 }}
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
                <SkeletonTable rows={5} cols={6} />
              ) : reservasFiltradas.length === 0 ? (
                <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                  <p>
                    {filtro === 'aprovada'
                      ? 'Nenhum equipamento aguardando devolução.'
                      : 'Nenhuma devolução encontrada para os filtros aplicados.'}
                  </p>
                </motion.div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Equipamento</th>
                      <th>Usuário</th>
                      <th>Local de uso</th>
                      <th>Início</th>
                      <th>Devolução Prevista</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {reservasFiltradas.map((r, i) => {
                        const atrasada      = r.status === 'aprovada' && new Date(r.data_fim) < new Date();
                        const esteSubmetendo = submittingId === r.id;
                        return (
                          <motion.tr
                            key={r.id}
                            layout
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
                            transition={{ delay: i * 0.04, duration: 0.22 }}
                            style={{ background: atrasada ? 'rgba(239,68,68,0.04)' : 'transparent' }}
                          >
                            <td>
                              <div style={{ fontWeight: 600 }}>{r.equipamento_nome}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'DM Mono, monospace' }}>
                                #{r.equipamento_id}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{r.usuario_nome}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{r.usuario_email}</div>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                              {r.local_uso || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: 13, whiteSpace: 'nowrap' }}>
                              {fmtData(r.data_inicio)}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: atrasada ? '#F87171' : 'var(--text-primary)' }}>
                                {fmtData(r.data_fim)}
                              </span>
                              {atrasada && (
                                <span style={{
                                  marginLeft: 6, display: 'inline-flex', alignItems: 'center',
                                  fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
                                  padding: '2px 8px', borderRadius: 20,
                                  color: '#F87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                                }}>
                                  ATRASADO
                                </span>
                              )}
                              {r.devolvida_em && (
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                  Devolvido: {fmtData(r.devolvida_em)}
                                </div>
                              )}
                            </td>
                            <td><StatusBadge status={r.status} /></td>
                            <td>
                              {r.status === 'aprovada' ? (
                                <motion.button
                                  className="btn btn-primary btn-sm"
                                  whileHover={{ scale: esteSubmetendo ? 1 : 1.03 }}
                                  whileTap={{ scale: esteSubmetendo ? 1 : 0.97 }}
                                  onClick={() => !esteSubmetendo && setConfirmando(r)}
                                  disabled={esteSubmetendo}
                                  style={{ whiteSpace: 'nowrap', opacity: esteSubmetendo ? 0.6 : 1 }}
                                >
                                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                  {esteSubmetendo ? 'Confirmando...' : 'Confirmar Devolução'}
                                </motion.button>
                              ) : (
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
                              )}
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

          {!loading && reservasFiltradas.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
              {reservasFiltradas.length} registro{reservasFiltradas.length !== 1 ? 's' : ''} exibido{reservasFiltradas.length !== 1 ? 's' : ''}
            </div>
          )}
        </main>
      </div>

      {/* Modal confirmação */}
      <Modal open={!!confirmando} onClose={fecharModal} title="Confirmar Devolução"
        subtitle={confirmando ? confirmando.equipamento_nome : ''}>
        {confirmando && (
          <div>
            <div style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '14px 16px', marginBottom: 20,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {[
                ['Equipamento',   confirmando.equipamento_nome],
                ['Usuário',       confirmando.usuario_nome],
                ['Local de uso',  confirmando.local_uso || '—'],
                ['Reservado de',  fmtData(confirmando.data_inicio)],
                ['Reservado até', fmtData(confirmando.data_fim)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{k}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              O equipamento será marcado como <strong>disponível</strong> e voltará ao estoque imediatamente.
            </p>
            <div className="modal-footer">
              <motion.button className="btn btn-ghost" whileTap={{ scale: 0.97 }}
                onClick={fecharModal} disabled={submitting}>
                Cancelar
              </motion.button>
              <motion.button className="btn btn-primary" whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: submitting ? 1 : 0.97 }}
                onClick={confirmarDevolucao} disabled={submitting}
                style={{ opacity: submitting ? 0.7 : 1 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {submitting ? 'Confirmando...' : 'Confirmar Devolução'}
              </motion.button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
