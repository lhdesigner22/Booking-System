import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition.jsx';
import SkeletonCards from '../components/SkeletonCards.jsx';
import { useToast } from '../context/ToastContext.jsx';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

const STATS = (equipamentos, disponiveis) => [
  {
    label: 'Total',
    value: equipamentos.length,
    color: '#818CF8',
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.2)',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
  },
  {
    label: 'Disponíveis',
    value: disponiveis,
    color: '#4ADE80',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.2)',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>
      </svg>
    ),
  },
  {
    label: 'Indisponíveis',
    value: equipamentos.length - disponiveis,
    color: '#F87171',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.2)',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>
      </svg>
    ),
  },
];

export default function Equipamentos() {
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [busca, setBusca]               = useState('');
  const [filtroDisp, setFiltroDisp]     = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const navigate = useNavigate();
  const toast    = useToast();

  useEffect(() => {
    api.get('/equipamentos')
      .then(res => setEquipamentos(res.data))
      .catch(() => toast({ message: 'Erro ao carregar equipamentos', type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const disponiveis = equipamentos.filter(e => e.disponivel && e.quantidade_disponivel > 0).length;

  // Extract unique categories (uses 'categoria' or 'tipo' field)
  const categorias = ['todas', ...Array.from(
    new Set(equipamentos.map(e => e.categoria || e.tipo).filter(Boolean))
  ).sort()];

  const filtrados = equipamentos.filter(eq => {
    const passaBusca = eq.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (eq.descricao || '').toLowerCase().includes(busca.toLowerCase());
    const estaDisponivel = eq.disponivel && eq.quantidade_disponivel > 0;
    const passaDisp =
      filtroDisp === 'todos' ? true :
      filtroDisp === 'disponivel' ? estaDisponivel : !estaDisponivel;
    const catEq = eq.categoria || eq.tipo || null;
    const passaCategoria = filtroCategoria === 'todas' ? true : catEq === filtroCategoria;
    return passaBusca && passaDisp && passaCategoria;
  });

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
            <h2>Equipamentos</h2>
            <p>Visualize e reserve os equipamentos disponíveis</p>
          </motion.div>

          {/* Stat cards */}
          <div className="stats-row">
            {STATS(equipamentos, disponiveis).map((s, i) => (
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
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: s.color,
                  }}>
                    {s.icon}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Busca + filtro */}
          <motion.div
            className="card"
            style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="form-input"
                placeholder="Buscar equipamento..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
            <div className="filter-row" style={{ margin: 0 }}>
              {[['todos', 'Todos'], ['disponivel', 'Disponíveis'], ['indisponivel', 'Indisponíveis']].map(([key, label]) => (
                <motion.button
                  key={key}
                  className={`filter-btn ${filtroDisp === key ? 'active' : ''}`}
                  onClick={() => setFiltroDisp(key)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Category chips — only shown when there are named categories */}
          {!loading && categorias.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}
            >
              {categorias.map(cat => (
                <motion.button
                  key={cat}
                  onClick={() => setFiltroCategoria(cat)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.18s',
                    background: filtroCategoria === cat
                      ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                      : 'var(--card)',
                    color: filtroCategoria === cat ? '#fff' : 'var(--text-muted)',
                    border: filtroCategoria === cat
                      ? '1.5px solid transparent'
                      : '1.5px solid var(--border)',
                    boxShadow: filtroCategoria === cat ? '0 2px 12px rgba(34,197,94,0.25)' : 'none',
                  }}
                >
                  {cat === 'todas' ? (
                    <>
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                      </svg>
                      Todos os tipos
                    </>
                  ) : (
                    <>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: filtroCategoria === cat ? '#fff' : '#4ADE80',
                        flexShrink: 0,
                      }} />
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Grid */}
          {loading ? (
            <SkeletonCards count={6} />
          ) : filtrados.length === 0 ? (
            <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
              <p>Nenhum equipamento encontrado</p>
            </motion.div>
          ) : (
            <motion.div
              className="eq-grid"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              layout
            >
              <AnimatePresence mode="popLayout">
                {filtrados.map(eq => (
                  <motion.div
                    key={eq.id}
                    layout
                    variants={cardVariant}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
                    className="eq-card"
                    whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(0,0,0,0.15)', borderColor: (eq.disponivel && eq.quantidade_disponivel > 0) ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)' }}
                    style={{ borderTop: `2px solid ${(eq.disponivel && eq.quantidade_disponivel > 0) ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.3)'}` }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: (eq.disponivel && eq.quantidade_disponivel > 0) ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${(eq.disponivel && eq.quantidade_disponivel > 0) ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: (eq.disponivel && eq.quantidade_disponivel > 0) ? '#4ADE80' : '#F87171',
                        flexShrink: 0,
                      }}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                        </svg>
                      </div>
                      <span className={`badge badge-${(eq.disponivel && eq.quantidade_disponivel > 0) ? 'disponivel' : 'indisponivel'}`}>
                        {(eq.disponivel && eq.quantidade_disponivel > 0) ? `● Disponível (${eq.quantidade_disponivel})` : '● Indisponível'}
                      </span>
                    </div>

                    <h3 style={{ marginBottom: 6 }}>{eq.nome}</h3>
                    <p style={{ marginBottom: 16, minHeight: 40 }}>{eq.descricao || 'Sem descrição'}</p>

                    {(eq.disponivel && eq.quantidade_disponivel > 0) && (
                      <motion.button
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', gap: 8 }}
                        whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/reservas', { state: { equipamento_id: eq.id, nome: eq.nome } })}
                      >
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                        Reservar
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}