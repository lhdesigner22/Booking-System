import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition.jsx';
import SkeletonTable from '../components/SkeletonTable.jsx';
import { useToast } from '../context/ToastContext.jsx';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function exportCSV(retiradas) {
  const COLS = [
    { key: 'colaborador_nome',  label: 'Nome do Colaborador' },
    { key: 'colaborador_email', label: 'E-mail' },
    { key: 'local_setor',       label: 'Local/Setor' },
    { key: 'equipamento_nome',  label: 'Item Retirado' },
    { key: 'quantidade',        label: 'Quantidade' },
    { key: 'criado_em',         label: 'Data e Hora' },
    { key: 'responsavel_nome',  label: 'Responsável' },
    { key: 'observacoes',       label: 'Observações' },
  ];

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const rows = [
    COLS.map(c => esc(c.label)).join(';'),
    ...retiradas.map(r =>
      COLS.map(c => {
        if (c.key === 'criado_em') return esc(fmtDate(r[c.key]));
        return esc(r[c.key]);
      }).join(';')
    ),
  ];

  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `retiradas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RetiradasLog() {
  const [retiradas, setRetiradas] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [busca, setBusca]         = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim]       = useState('');
  const toast = useToast();

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 500 });
      if (busca)      params.set('busca',       busca);
      if (dataInicio) params.set('data_inicio', dataInicio);
      if (dataFim)    params.set('data_fim',    dataFim);

      const res = await api.get(`/retiradas?${params}`);
      setRetiradas(res.data.retiradas);
      setTotal(res.data.total);
    } catch {
      toast({ message: 'Erro ao carregar histórico de retiradas', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [busca, dataInicio, dataFim]);

  useEffect(() => {
    const id = setTimeout(() => carregar(), busca ? 350 : 0);
    return () => clearTimeout(id);
  }, [carregar]);

  const totais = useMemo(() => ({
    registros: retiradas.length,
    itens:     retiradas.reduce((s, r) => s + r.quantidade, 0),
    setores:   new Set(retiradas.map(r => r.local_setor)).size,
  }), [retiradas]);

  function limparFiltros() {
    setBusca('');
    setDataInicio('');
    setDataFim('');
  }

  const temFiltro = busca || dataInicio || dataFim;

  return (
    <PageTransition>
      <div className="page-layout">
        <Sidebar />
        <main className="main-content">

          {/* Header */}
          <motion.div
            className="page-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <h2>Logs de Retirada</h2>
              <p>Histórico completo de itens retirados do estoque</p>
            </div>

            <motion.button
              className="btn btn-primary"
              onClick={() => exportCSV(retiradas)}
              disabled={retiradas.length === 0}
              whileHover={{ scale: 1.03, boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}
              whileTap={{ scale: 0.97 }}
              style={{ gap: 8 }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar CSV
            </motion.button>
          </motion.div>

          {/* Stat cards */}
          <div className="stats-row">
            {[
              {
                label: 'Total de Registros',
                value: totais.registros,
                color: '#818CF8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)',
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
              },
              {
                label: 'Itens Retirados',
                value: totais.itens,
                color: '#F87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)',
                icon: 'M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16',
              },
              {
                label: 'Setores Diferentes',
                value: totais.setores,
                color: '#4ADE80', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)',
                icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
              },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}
                style={{ borderTop: `3px solid ${s.color}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  </div>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: s.bg, border: `1px solid ${s.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color,
                  }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d={s.icon} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filtros */}
          <motion.div
            className="card"
            style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '14px 18px' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {/* Busca */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="form-input"
                placeholder="Buscar por nome, item ou setor..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ paddingLeft: 34, marginBottom: 0 }}
              />
            </div>

            {/* Data início */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>De:</span>
              <input
                type="date"
                className="form-input"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                style={{ maxWidth: 160, marginBottom: 0 }}
              />
            </div>

            {/* Data fim */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Até:</span>
              <input
                type="date"
                className="form-input"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                style={{ maxWidth: 160, marginBottom: 0 }}
              />
            </div>

            {/* Limpar filtros */}
            <AnimatePresence>
              {temFiltro && (
                <motion.button
                  className="btn btn-ghost btn-sm"
                  onClick={limparFiltros}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  whileTap={{ scale: 0.93 }}
                  style={{ gap: 6, whiteSpace: 'nowrap' }}
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Limpar
                </motion.button>
              )}
            </AnimatePresence>

            {/* Contador */}
            {!loading && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                {retiradas.length} registro{retiradas.length !== 1 ? 's' : ''}
                {total > retiradas.length ? ` de ${total}` : ''}
              </span>
            )}
          </motion.div>

          {/* Tabela */}
          <motion.div
            className="card"
            style={{ padding: 0, overflow: 'hidden' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
          >
            <div className="table-wrap">
              {loading ? (
                <SkeletonTable rows={5} cols={7} />
              ) : retiradas.length === 0 ? (
                <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  <p>
                    {temFiltro
                      ? 'Nenhuma retirada encontrada com esses filtros'
                      : 'Nenhuma retirada registrada ainda'}
                  </p>
                  {temFiltro && (
                    <button className="btn btn-ghost btn-sm" onClick={limparFiltros} style={{ marginTop: 8 }}>
                      Limpar filtros
                    </button>
                  )}
                </motion.div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Colaborador</th>
                      <th>Local / Setor</th>
                      <th>Item Retirado</th>
                      <th style={{ textAlign: 'center' }}>Qtd</th>
                      <th>Data e Hora</th>
                      <th>Responsável</th>
                      <th>Obs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {retiradas.map((r, i) => (
                        <motion.tr
                          key={r.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.2 }}
                        >
                          {/* Colaborador */}
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.colaborador_nome}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {r.colaborador_email}
                            </div>
                          </td>

                          {/* Setor */}
                          <td>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 12, fontWeight: 500,
                              padding: '2px 10px', borderRadius: 99,
                              background: 'rgba(99,102,241,0.1)',
                              border: '1px solid rgba(99,102,241,0.2)',
                              color: '#818CF8',
                            }}>
                              {r.local_setor}
                            </span>
                          </td>

                          {/* Item */}
                          <td style={{ fontWeight: 500, fontSize: 13 }}>{r.equipamento_nome}</td>

                          {/* Quantidade */}
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              minWidth: 28, height: 24, borderRadius: 6,
                              background: 'rgba(248,113,113,0.1)',
                              border: '1px solid rgba(248,113,113,0.2)',
                              color: '#F87171', fontSize: 13, fontWeight: 700,
                            }}>
                              {r.quantidade}
                            </span>
                          </td>

                          {/* Data */}
                          <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {fmtDate(r.criado_em)}
                          </td>

                          {/* Responsável */}
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {r.responsavel_nome || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>

                          {/* Observações */}
                          <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 180 }}>
                            {r.observacoes
                              ? <span title={r.observacoes} style={{ cursor: 'help' }}>
                                  {r.observacoes.length > 40 ? r.observacoes.slice(0, 40) + '…' : r.observacoes}
                                </span>
                              : '—'
                            }
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>

        </main>
      </div>
    </PageTransition>
  );
}
