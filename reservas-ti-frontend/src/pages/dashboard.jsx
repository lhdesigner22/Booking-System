import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const STATUS_COLOR = {
  pendente:  '#FCD34D',
  aprovada:  '#4ADE80',
  cancelada: '#94A3B8',
  recusada:  '#F87171',
  devolvida: '#818CF8',
};
const STATUS_LABEL = {
  pendente: 'Pendente', aprovada: 'Aprovada',
  cancelada: 'Cancelada', recusada: 'Recusada', devolvida: 'Devolvida',
};

const QUICK_ACTIONS = (isAdmin) => [
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>),
    label: 'Nova Reserva', desc: 'Agendar equipamento', to: '/reservas',
    color: '#4ADE80', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>),
    label: 'Equipamentos', desc: 'Ver catálogo', to: '/equipamentos',
    color: '#818CF8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>),
    label: 'Meu Perfil', desc: 'Editar dados', to: '/perfil',
    color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
    label: 'Suporte', desc: 'Ajuda e contato', to: '/suporte',
    color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  ...(isAdmin ? [
    { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
      label: 'Painel Admin', desc: 'Gerenciar sistema', to: '/admin',
      color: '#F87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
    { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 14l-4-4 4-4m11 4H5"/></svg>),
      label: 'Devoluções', desc: 'Confirmar retornos', to: '/devolucoes',
      color: '#C084FC', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)' },
  ] : []),
];

export default function Dashboard() {
  const [reservas, setReservas]           = useState([]);
  const [equipamentos, setEquipamentos]   = useState([]);
  const [pendentesAdmin, setPendentesAdmin] = useState([]);
  const [loading, setLoading]             = useState(true);
  const { usuario } = useAuth();
  const navigate    = useNavigate();

  useEffect(() => {
    document.title = 'Dashboard — Booking System';
    return () => { document.title = 'Booking System'; };
  }, []);

  useEffect(() => {
    if (!usuario) return;
    async function load() {
      setLoading(true);
      try {
        const [resR, resE] = await Promise.all([
          api.get('/reservas'),
          api.get('/equipamentos'),
        ]);
        setReservas(resR.data);
        setEquipamentos(resE.data);
        if (usuario.admin) {
          const resAdmin = await api.get('/admin/reservas');
          setPendentesAdmin(resAdmin.data.filter(r => r.status === 'pendente'));
        }
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [usuario]);

  const agora      = new Date();
  const ativas     = reservas.filter(r => r.status === 'aprovada' && new Date(r.data_fim) > agora);
  const pendentes  = reservas.filter(r => r.status === 'pendente');
  const disponiveis = equipamentos.filter(e => e.disponivel && e.quantidade_disponivel > 0);
  const recentes   = [...reservas].sort((a, b) => b.id - a.id).slice(0, 5);
  const proxDevolucoes = [...ativas]
    .sort((a, b) => new Date(a.data_fim) - new Date(b.data_fim))
    .slice(0, 4);

  const STATS = [
    { label: 'Reservas ativas',          value: ativas.length,      color: '#4ADE80', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)',   icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Aguardando aprovação',      value: pendentes.length,   color: '#FCD34D', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Equipamentos disponíveis', value: disponiveis.length, color: '#818CF8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.2)', icon: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18' },
    { label: 'Total de reservas',         value: reservas.length,    color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)',  icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  ];

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? '';

  return (
    <PageTransition>
      <div className="page-layout">
        <Sidebar />
        <main className="main-content">

          {/* ── Header ── */}
          <motion.div
            className="page-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2>{getGreeting()}{primeiroNome ? `, ${primeiroNome}` : ''} 👋</h2>
            <p>Aqui está o resumo da sua atividade</p>
          </motion.div>

          {/* ── Alerta admin: pendentes ── */}
          <AnimatePresence>
            {usuario?.admin && pendentesAdmin.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: 20 }}
              >
                <div style={{
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                  borderLeft: '3px solid #F59E0B', borderRadius: 10, padding: '12px 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <motion.span
                      style={{ fontSize: 18 }}
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.5 }}
                    >⏳</motion.span>
                    <span style={{ fontSize: 14, color: '#FCD34D' }}>
                      <strong>{pendentesAdmin.length}</strong> reserva{pendentesAdmin.length > 1 ? 's' : ''} aguardando sua aprovação
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/admin')}
                    style={{
                      padding: '5px 14px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                      background: 'rgba(245,158,11,0.15)', color: '#FCD34D',
                      border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Revisar agora →
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Stat cards ── */}
          <div className="stats-row">
            {STATS.map((s, i) => (
              <motion.div key={s.label} className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}
                style={{ borderTop: `3px solid ${s.color}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value" style={{ color: s.color }}>
                      {loading ? '—' : s.value}
                    </div>
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d={s.icon}/>
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Acesso rápido ── */}
          <motion.div className="card" style={{ marginBottom: 20 }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 16 }}>
              Acesso rápido
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {QUICK_ACTIONS(usuario?.admin).map((a, i) => (
                <motion.button
                  key={a.to}
                  initial={{ opacity: 0, scale: 0.93 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.32 + i * 0.05 }}
                  whileHover={{ y: -3, boxShadow: `0 8px 28px ${a.bg.replace('0.08', '0.2')}` }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(a.to)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 10, padding: '18px 12px', borderRadius: 12,
                    background: a.bg, border: `1px solid ${a.border}`,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: `${a.color}18`, border: `1px solid ${a.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color }}>
                    {a.icon}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: a.color, marginBottom: 2 }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>{a.desc}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ── Grid inferior: recentes + próximas devoluções ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Reservas recentes */}
            <motion.div className="card" style={{ padding: 0, overflow: 'hidden' }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            >
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Reservas recentes</span>
                <button onClick={() => navigate('/reservas')}
                  style={{ fontSize: 12, color: 'var(--brand-green)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                  Ver todas →
                </button>
              </div>

              {loading ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</div>
              ) : recentes.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 24px' }}>
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  <p style={{ marginTop: 8 }}>Nenhuma reserva ainda</p>
                  <small>Clique em Nova Reserva para começar</small>
                </div>
              ) : (
                <AnimatePresence>
                  {recentes.map((r, i) => (
                    <motion.div key={r.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{ padding: '11px 20px', borderBottom: i < recentes.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.equipamento_nome}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {fmtDate(r.data_inicio)} → {fmtDate(r.data_fim)}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 99,
                        background: `${STATUS_COLOR[r.status]}15`,
                        color: STATUS_COLOR[r.status],
                        border: `1px solid ${STATUS_COLOR[r.status]}28`,
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </motion.div>

            {/* Próximas devoluções */}
            <motion.div className="card" style={{ padding: 0, overflow: 'hidden' }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            >
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Próximas devoluções</span>
                <button onClick={() => navigate('/reservas')}
                  style={{ fontSize: 12, color: 'var(--brand-green)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                  Ver reservas →
                </button>
              </div>

              {loading ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</div>
              ) : proxDevolucoes.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 24px' }}>
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/>
                  </svg>
                  <p style={{ marginTop: 8 }}>Nenhuma devolução próxima</p>
                  <small>Reservas ativas aparecerão aqui</small>
                </div>
              ) : (
                <AnimatePresence>
                  {proxDevolucoes.map((r, i) => {
                    const fim = new Date(r.data_fim);
                    const dias = Math.ceil((fim - agora) / (1000 * 60 * 60 * 24));
                    const atrasado = dias < 0;
                    const urgente  = dias >= 0 && dias <= 1;
                    const cor = atrasado ? '#F87171' : urgente ? '#FCD34D' : '#4ADE80';
                    const label = atrasado ? `${Math.abs(dias)}d atrasado` : dias === 0 ? 'Hoje' : `em ${dias}d`;
                    return (
                      <motion.div key={r.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        style={{ padding: '11px 20px', borderBottom: i < proxDevolucoes.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.equipamento_nome}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            Devolver até {fmtDate(r.data_fim)}
                            {r.local_uso ? ` · ${r.local_uso}` : ''}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
                          background: `${cor}15`, color: cor, border: `1px solid ${cor}28`,
                          whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          {label}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </motion.div>
          </div>

        </main>
      </div>
    </PageTransition>
  );
}
