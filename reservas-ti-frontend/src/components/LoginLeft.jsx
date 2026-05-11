import { motion } from 'framer-motion';
import logo from '../assets/logo2.png';

const FEATURES = [
  {
    title: 'Reservas em tempo real',
    desc:  'Agende equipamentos de TI em segundos, sem conflitos.',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    title: 'Controle de estoque',
    desc:  'Visualize disponibilidade e gerencie quantidades em tempo real.',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    title: 'Histórico e relatórios',
    desc:  'Acompanhe aprovações e devoluções com rastreabilidade total.',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>
      </svg>
    ),
  },
];

const STATS = [
  { value: '99%',  label: 'Uptime'       },
  { value: '+200', label: 'Equipamentos' },
  { value: '24/7', label: 'Online'       },
];

export default function LoginLeft({ badges = [], tagline }) {
  return (
    <div className="login-left">
      {/* Orbes de luz */}
      <div className="login-orb-1" />
      <div className="login-orb-2" />
      <div className="login-orb-3" />

      {/* Badges flutuantes de status */}
      {badges.map((text, i) => (
        <div key={i} className="login-float-badge">
          <span className="badge-dot" />
          <span>{text}</span>
        </div>
      ))}

      {/* Conteúdo centralizado */}
      <div className="login-left-content">

        {/* Logo */}
        <motion.div
          className="login-logo-box"
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
        >
          <img src={logo} alt="Logo" />
        </motion.div>

        {/* Brand */}
        <motion.div
          className="login-brand"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="login-brand-chip">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="#4ADE80">
              <circle cx="4" cy="4" r="4"/>
            </svg>
            Sistema ativo
          </div>
          <h1>Help Desk Team<br /><span>Booking System</span></h1>
          <p>{tagline}</p>
        </motion.div>

        {/* Divisor */}
        <motion.div
          className="login-divider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <span>por que usar</span>
        </motion.div>

        {/* Features */}
        <motion.div
          className="login-features"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="login-feature-item"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.3 }}
            >
              <div className="login-feature-icon">{f.icon}</div>
              <div className="login-feature-text">
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          className="login-stats"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          {STATS.map(s => (
            <div key={s.label} className="login-stat">
              <div className="login-stat-value">{s.value}</div>
              <div className="login-stat-label">{s.label}</div>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
