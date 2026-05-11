import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import logo from '../assets/logo2.png';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const IconMonitor = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const IconShield = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconReturn = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
// ── NOVO ──────────────────────────────────────────────────────────────────────
const IconEstoque = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
  </svg>
);
// ─────────────────────────────────────────────────────────────────────────────
const IconMenu = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IconX = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconLogout = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
);
const IconSun = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);
const IconMoon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);

const linkVariants = {
  initial: { opacity: 0, x: -12 },
  animate: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.07, duration: 0.22 } }),
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const [foto, setFoto] = useState(null);

  useEffect(() => {
    api.get('/usuarios/perfil').then(r => {
      setUser(r.data);
      const salva = localStorage.getItem(`avatar_foto_${r.data.id}`);
      if (salva) setFoto(salva);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function onAvatarUpdate(e) { setFoto(e.detail ?? null); }
    window.addEventListener('avatar:updated', onAvatarUpdate);
    return () => window.removeEventListener('avatar:updated', onAvatarUpdate);
  }, []);

  function sair() {
    logout();
    window.location.replace('/login');
  }

  function navClick(to) {
    navigate(to);
    setMobileOpen(false);
  }

  const links = [
    { to: '/equipamentos', label: 'Equipamentos',    icon: <IconMonitor /> },
    { to: '/reservas',     label: 'Minhas Reservas', icon: <IconCalendar /> },
    { to: '/perfil',       label: 'Meu Perfil',      icon: <IconUser /> },
    ...(user?.admin ? [
      { to: '/devolucoes', label: 'Devoluções',   icon: <IconReturn />,  badge: 'ADMIN' },
      { to: '/estoque',    label: 'Estoque',       icon: <IconEstoque />, badge: 'ADMIN' }, // ← NOVO
      { to: '/admin',      label: 'Painel Admin',  icon: <IconShield />,  badge: 'ADMIN' },
    ] : []),
  ];

  const inicial = user?.nome?.[0]?.toUpperCase() || '?';

  return (
    <>
    {/* Botão hambúrguer — só aparece no mobile */}
    <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
      <IconMenu />
    </button>

    {/* Overlay escuro ao abrir no mobile */}
    <AnimatePresence>
      {mobileOpen && (
        <motion.div
          className="sidebar-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </AnimatePresence>

    <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Botão fechar dentro da sidebar no mobile */}
      <button className="sidebar-close-btn" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
        <IconX />
      </button>
      {/* Logo */}
      <motion.div
        className="sidebar-logo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <img
          src={logo}
          alt="Help Desk Team Booking System"
          style={{ width: '100%', maxWidth: 180, display: 'block', margin: '0 auto' }}
        />
      </motion.div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {links.map((l, i) => {
          const active = location.pathname === l.to;
          return (
            <motion.button
              key={l.to}
              custom={i}
              variants={linkVariants}
              initial="initial"
              animate="animate"
              whileHover={{ x: 3, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
              className={`nav-link ${active ? 'active' : ''}`}
              onClick={() => navClick(l.to)}
            >
              {l.icon}
              <span style={{ flex: 1 }}>{l.label}</span>
              {l.badge && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 1,
                  padding: '2px 6px', borderRadius: 4,
                  background: 'rgba(34,197,94,0.18)', color: '#22C55E',
                  border: '1px solid rgba(34,197,94,0.3)',
                }}>
                  {l.badge}
                </span>
              )}
              {active && (
                <motion.div
                  layoutId="active-pill"
                  style={{
                    position: 'absolute', left: 0, top: 6, bottom: 6,
                    width: 3, borderRadius: '0 3px 3px 0',
                    background: '#22C55E',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <AnimatePresence>
          {user && (
            <motion.div
              className="sidebar-footer-top"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="user-info">
                <div className="avatar" style={{ overflow: 'hidden', padding: 0 }}>
                  {foto
                    ? <img src={foto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : inicial
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="user-name">{user.nome}</div>
                  <div className="user-role">{user.admin ? 'Administrador' : 'Colaborador'}</div>
                </div>
              </div>

              {/* Theme Toggle */}
              <motion.button
                className="theme-toggle"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={theme}
                    initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0,   scale: 1   }}
                    exit={{    opacity: 0, rotate:  30, scale: 0.7 }}
                    transition={{ duration: 0.18 }}
                    style={{ display: 'flex' }}
                  >
                    {theme === 'dark' ? <IconSun /> : <IconMoon />}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          className="btn-sair"
          onClick={sair}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <IconLogout /> Sair
        </motion.button>
      </div>
    </aside>
    </>
  );
}