import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import logo from '../assets/logo2.png';

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
    title: 'Reservas sem conflito',
    desc: 'Sistema inteligente detecta sobreposições de horário e impede double-booking automático.',
    color: '#22C55E',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      </svg>
    ),
    title: 'Controle de estoque',
    desc: 'Monitore notebooks, monitores, headsets e muito mais com rastreamento de quantidade em tempo real.',
    color: '#818CF8',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Chat integrado',
    desc: 'Comunicação direta entre colaboradores e equipe de TI dentro de cada reserva, sem e-mails externos.',
    color: '#F59E0B',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'Relatórios e analytics',
    desc: 'Dashboards com os equipamentos mais usados, colaboradores mais ativos e tendências mensais.',
    color: '#F87171',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    title: 'Notificações por e-mail',
    desc: 'Alertas automáticos para aprovações, recusas e lembretes de devolução. Nunca perca um prazo.',
    color: '#22C55E',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Histórico completo',
    desc: 'Rastreabilidade total de quem usou o quê e quando, com exportação em CSV para relatórios externos.',
    color: '#818CF8',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Cadastre-se',
    desc: 'Crie sua conta com e-mail institucional ou Google. Preencha seu setor e comece em menos de 1 minuto.',
  },
  {
    num: '02',
    title: 'Escolha e reserve',
    desc: 'Navegue pelo catálogo de equipamentos, verifique a disponibilidade no calendário e faça sua reserva.',
  },
  {
    num: '03',
    title: 'Aguarde aprovação',
    desc: 'A equipe de TI recebe sua solicitação por e-mail e aprova ou recusa. Você é notificado automaticamente.',
  },
  {
    num: '04',
    title: 'Use e devolva',
    desc: 'Retire o equipamento conforme o combinado e registre a devolução no sistema para liberar o estoque.',
  },
];

const STATS = [
  { value: '99.9%', label: 'Uptime garantido' },
  { value: '< 1min', label: 'Para criar uma reserva' },
  { value: '100%', label: 'Rastreabilidade' },
  { value: '0', label: 'Conflitos de agenda' },
];

const NAV_LINKS = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Como funciona',   href: '#como-funciona'  },
  { label: 'Suporte',         href: '/suporte', external: false },
];

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ background: '#080F1D', minHeight: '100vh', color: '#F1F5F9', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <motion.header
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
          background: scrolled ? 'rgba(8,15,29,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          transition: 'all 0.3s ease',
          padding: '0 24px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 68, gap: 32 }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Booking System" style={{ height: 36 }} />
          </Link>

          {/* Nav links — desktop */}
          <nav style={{ display: 'flex', gap: 4, flex: 1, display: 'flex' }} className="landing-nav-desktop">
            {NAV_LINKS.map(l => (
              l.href.startsWith('#') ? (
                <button key={l.label} onClick={() => scrollTo(l.href.slice(1))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: 'rgba(241,245,249,0.65)', transition: 'color .15s' }}
                  onMouseEnter={e => e.target.style.color = '#F1F5F9'}
                  onMouseLeave={e => e.target.style.color = 'rgba(241,245,249,0.65)'}
                >
                  {l.label}
                </button>
              ) : (
                <Link key={l.label} to={l.href}
                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: 'rgba(241,245,249,0.65)', transition: 'color .15s', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = '#F1F5F9'}
                  onMouseLeave={e => e.target.style.color = 'rgba(241,245,249,0.65)'}
                >
                  {l.label}
                </Link>
              )
            ))}
          </nav>

          <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
            <Link to="/login"
              style={{ padding: '8px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#F1F5F9', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            >
              Entrar
            </Link>
            <Link to="/register"
              style={{ padding: '8px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#0A1628', background: '#22C55E', textDecoration: 'none', transition: 'all .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#16A34A'}
              onMouseLeave={e => e.currentTarget.style.background = '#22C55E'}
            >
              Criar conta
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', textAlign: 'center' }}>
        {/* Orbes de fundo */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', marginBottom: 28, fontSize: 13, fontWeight: 600, color: '#4ADE80' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E', display: 'inline-block' }} />
          Sistema ativo — Colégio Ser &amp; FECAF
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
          style={{ fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 24, maxWidth: 820 }}>
          Gestão de equipamentos de TI{' '}
          <span style={{ background: 'linear-gradient(135deg, #22C55E, #4ADE80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            simples e sem conflitos
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          style={{ fontSize: 18, color: 'rgba(241,245,249,0.6)', lineHeight: 1.7, maxWidth: 580, marginBottom: 44 }}>
          Reserve notebooks, monitores, headsets e outros periféricos com aprovação automática, chat integrado e notificações por e-mail.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/register"
            style={{ padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#0A1628', background: '#22C55E', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            onMouseEnter={e => e.currentTarget.style.background = '#16A34A'}
            onMouseLeave={e => e.currentTarget.style.background = '#22C55E'}
          >
            Começar gratuitamente
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <button onClick={() => scrollTo('como-funciona')}
            style={{ padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 600, color: '#F1F5F9', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          >
            Ver como funciona
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
          style={{ display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center', marginTop: 72, paddingTop: 48, borderTop: '1px solid rgba(255,255,255,0.07)', width: '100%', maxWidth: 700 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#22C55E', letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(241,245,249,0.45)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funcionalidades" style={{ padding: '100px 24px', background: 'rgba(15,30,56,0.4)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ADE80', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
              Funcionalidades
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 16 }}>
              Tudo que sua equipe de TI precisa
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(241,245,249,0.55)', maxWidth: 500, margin: '0 auto' }}>
              Funcionalidades pensadas para simplificar o dia a dia de quem gerencia e de quem usa os equipamentos.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                style={{ background: '#0F1E38', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 24px', cursor: 'default' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}18`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: f.color }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(241,245,249,0.5)', lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', color: '#818CF8', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
              Como funciona
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 16 }}>
              Reserve em 4 passos simples
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, position: 'relative' }}>
            {STEPS.map((s, i) => (
              <motion.div key={s.num}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }}
                style={{ background: '#0F1E38', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 22px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: 'rgba(34,197,94,0.08)', letterSpacing: -2, lineHeight: 1, marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: '#F1F5F9' }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.5)', lineHeight: 1.65 }}>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', top: 36, right: -6, color: 'rgba(34,197,94,0.3)', fontSize: 20, display: 'none' }}>→</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 24px', background: 'rgba(15,30,56,0.4)' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#22C55E' }}>
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.7px', marginBottom: 16 }}>
            Pronto para organizar o seu TI?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(241,245,249,0.55)', lineHeight: 1.7, marginBottom: 36 }}>
            Crie sua conta em menos de 1 minuto e comece a gerenciar reservas de equipamentos de forma profissional.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register"
              style={{ padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#0A1628', background: '#22C55E', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = '#16A34A'}
              onMouseLeave={e => e.currentTarget.style.background = '#22C55E'}
            >
              Criar conta grátis →
            </Link>
            <Link to="/login"
              style={{ padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 600, color: '#F1F5F9', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            >
              Já tenho conta
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src={logo} alt="Logo" style={{ height: 30, opacity: 0.8 }} />
            <span style={{ fontSize: 13, color: 'rgba(241,245,249,0.3)' }}>
              © {new Date().getFullYear()} Colégio Ser / FECAF — Help Desk TI
            </span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Entrar',       to: '/login'    },
              { label: 'Cadastrar',    to: '/register' },
              { label: 'Suporte',      to: '/suporte'  },
            ].map(l => (
              <Link key={l.label} to={l.to} style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e => e.target.style.color = '#F1F5F9'}
                onMouseLeave={e => e.target.style.color = 'rgba(241,245,249,0.4)'}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
