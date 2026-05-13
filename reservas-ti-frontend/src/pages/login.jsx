import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import PageTransition from '../components/PageTransition.jsx';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/logo2.png';

const FEATURES = [
  {
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
    title: 'Reservas sem conflitos',
    desc: 'Agende equipamentos em segundos com aprovação em tempo real.',
  },
  {
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      </svg>
    ),
    title: 'Controle de estoque',
    desc: 'Disponibilidade atualizada e rastreio completo de devoluções.',
  },
  {
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Acesso seguro',
    desc: 'Login por e-mail institucional ou conta Google corporativa.',
  },
];

const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] } },
};

export default function Login() {
  const [form, setForm]         = useState({ email: '', senha: '' });
  const [erro, setErro]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const [modalEsqueci, setModalEsqueci]   = useState(false);
  const [esquecEmail, setEsquecEmail]     = useState('');
  const [esquecLoading, setEsquecLoading] = useState(false);
  const [esquecSucesso, setEsquecSucesso] = useState(false);
  const [esquecErro, setEsquecErro]       = useState('');

  const [modalSetor, setModalSetor]     = useState(false);
  const [setor, setSetor]               = useState('');
  const [setorErro, setSetorErro]       = useState('');
  const [setorLoading, setSetorLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const loginGoogle = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      setLoadingGoogle(true); setErro('');
      try {
        const res = await api.post('/auth/google', { credential: access_token });
        if (res.data.perfil_incompleto) {
          setPendingToken(res.data.token);
          setModalSetor(true);
        } else {
          login(res.data.token);
          navigate('/equipamentos');
        }
      } catch { setErro('Erro ao autenticar com o Google. Tente novamente.'); }
      finally { setLoadingGoogle(false); }
    },
    onError: () => setErro('Login com Google cancelado ou falhou.'),
  });

  async function handleSalvarSetor() {
    if (!setor.trim()) return setSetorErro('Informe o seu setor ou curso para continuar.');
    setSetorLoading(true); setSetorErro('');
    try {
      login(pendingToken);
      await api.patch('/usuarios/perfil', { setor: setor.trim() }, {
        headers: { Authorization: `Bearer ${pendingToken}` },
      });
      navigate('/equipamentos');
    } catch {
      setSetorErro('Erro ao salvar setor. Tente novamente.');
      setSetorLoading(false);
    }
  }

  async function handleEsqueci(e) {
    e.preventDefault();
    if (!esquecEmail.trim()) return setEsquecErro('Informe seu e-mail.');
    setEsquecErro(''); setEsquecLoading(true);
    try {
      await api.post('/usuarios/esqueci-senha', { email: esquecEmail.trim() });
      setEsquecSucesso(true);
    } catch { setEsquecErro('Erro ao enviar. Tente novamente.'); }
    finally { setEsquecLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(''); setLoading(true);
    try {
      const res = await api.post('/usuarios/login', form);
      login(res.data.token);
      navigate('/equipamentos');
    } catch (err) {
      setErro(err.response?.data?.error || 'Credenciais inválidas. Tente novamente.');
    } finally { setLoading(false); }
  }

  return (
    <PageTransition>

      {/* ── Modal: Setor (primeiro login Google) ── */}
      <AnimatePresence>
        {modalSetor && (
          <motion.div key="setor-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <motion.div key="setor-box"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.22,1,0.36,1] } }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              style={{ background: '#0F1E38', borderRadius: 16, padding: '32px 28px', width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ADE80' }}>
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
              </div>
              <h3 style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#F1F5F9' }}>Bem-vindo!</h3>
              <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(241,245,249,0.5)', marginBottom: 24 }}>Para finalizar o cadastro, informe o seu setor ou curso.</p>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <label className="form-label-sm">Setor / Curso</label>
                <div className="input-icon-wrap">
                  <svg className="input-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <input className="form-input" type="text" placeholder="Ex: TI, Administração, Ensino Médio A..."
                    value={setor} onChange={e => { setSetor(e.target.value); setSetorErro(''); }} autoFocus onKeyDown={e => e.key === 'Enter' && handleSalvarSetor()} />
                </div>
              </div>
              <AnimatePresence>
                {setorErro && <motion.div className="alert alert-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 12, overflow: 'hidden' }}>{setorErro}</motion.div>}
              </AnimatePresence>
              <motion.button className="btn btn-primary" type="button" onClick={handleSalvarSetor} disabled={setorLoading} whileTap={{ scale: 0.98 }} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, borderRadius: 10, marginTop: 8 }}>
                {setorLoading ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner /> Salvando...</span> : 'Continuar →'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Página principal ── */}
      <div style={{
        minHeight: '100vh', background: '#080F1D',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glows */}
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 65%)', top: -250, right: -200, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 65%)', bottom: -180, left: -150, pointerEvents: 'none' }} />

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: '100%', maxWidth: 880,
            display: 'grid', gridTemplateColumns: '1fr 1.45fr',
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 40px 100px rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
          className="login-card"
        >
          {/* ── Painel esquerdo (brand) ── */}
          <div style={{
            background: 'linear-gradient(160deg, #0A1628 0%, #0C1A32 60%, #0A1628 100%)',
            padding: '48px 36px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Glow interno */}
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', top: -80, right: -80, pointerEvents: 'none' }} />
            {/* Dot grid */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Logo */}
              <img src={logo} alt="Logo" style={{ width: 150, display: 'block', marginBottom: 28 }} />

              {/* Institution chip */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
                color: '#4ADE80', textTransform: 'uppercase',
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 99, padding: '4px 12px', marginBottom: 16,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.8)', flexShrink: 0 }} />
                Colégio Ser · FECAF
              </div>

              {/* Title */}
              <h2 style={{ fontSize: 26, fontWeight: 700, color: '#F1F5F9', letterSpacing: -0.6, lineHeight: 1.2, marginBottom: 10 }}>
                Help Desk<br />
                <span style={{ color: '#22C55E' }}>Booking System</span>
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', lineHeight: 1.65, marginBottom: 32 }}>
                Gerencie reservas de equipamentos de TI de forma simples, rápida e sem conflitos.
              </p>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {FEATURES.map((f, i) => (
                  <motion.div key={f.title}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.09, duration: 0.3 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ADE80', flexShrink: 0, marginTop: 1 }}>
                      {f.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(241,245,249,0.82)', marginBottom: 2 }}>{f.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(241,245,249,0.35)', lineHeight: 1.4 }}>{f.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Painel direito (formulário) ── */}
          <div style={{ background: '#0F1E38', padding: '48px 44px', display: 'flex', alignItems: 'center' }}>
            <motion.div
              style={{ width: '100%' }}
              initial="hidden" animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            >
              {/* Header */}
              <motion.div variants={itemVariant} style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', letterSpacing: -0.4, marginBottom: 4 }}>
                  Bem-vindo de volta
                </h3>
                <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.45)' }}>Entre com sua conta para continuar</p>
              </motion.div>

              {/* Erro */}
              <AnimatePresence>
                {erro && (
                  <motion.div className="alert alert-error"
                    initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 16, overflow: 'hidden' }}>
                    {erro}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <motion.div variants={itemVariant} className="form-group">
                <label className="form-label-sm">E-mail</label>
                <div className="input-icon-wrap">
                  <svg className="input-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
                  </svg>
                  <input className="form-input" type="email" placeholder="seu@email.com"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    required autoComplete="email" />
                </div>
              </motion.div>

              {/* Senha */}
              <motion.div variants={itemVariant} className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label-sm" style={{ marginBottom: 0 }}>Senha</label>
                  <button type="button"
                    onClick={() => { setModalEsqueci(true); setEsquecSucesso(false); setEsquecErro(''); setEsquecEmail(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(241,245,249,0.4)', padding: 0, fontFamily: 'inherit' }}>
                    Esqueci minha senha
                  </button>
                </div>
                <div className="input-icon-wrap">
                  <svg className="input-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input className="form-input" type="password" placeholder="••••••••"
                    value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })}
                    required autoComplete="current-password"
                    onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} />
                </div>
              </motion.div>

              {/* Botão entrar */}
              <motion.div variants={itemVariant} style={{ marginTop: 8 }}>
                <motion.button
                  className="btn btn-primary btn-login-shimmer"
                  type="button" onClick={handleSubmit} disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, borderRadius: 10 }}
                >
                  {loading
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner /> Entrando...</span>
                    : <><span>Entrar</span><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginLeft: 4 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                  }
                </motion.button>
              </motion.div>

              {/* Divisor */}
              <motion.div variants={itemVariant} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: 12, color: 'rgba(241,245,249,0.3)' }}>ou continue com</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </motion.div>

              {/* Google */}
              <motion.div variants={itemVariant}>
                <motion.button type="button" onClick={() => loginGoogle()} disabled={loadingGoogle} whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 10, padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                    background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)',
                    color: '#F1F5F9', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                  }}>
                  {loadingGoogle ? <Spinner /> : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                      Entrar com Google
                    </>
                  )}
                </motion.button>
              </motion.div>

              {/* Rodapé */}
              <motion.p variants={itemVariant} style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(241,245,249,0.4)' }}>
                Não tem conta?{' '}
                <Link to="/register" style={{ color: '#22C55E', fontWeight: 600 }}>Cadastre-se</Link>
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── Modal: Esqueci minha senha ── */}
      <AnimatePresence>
        {modalEsqueci && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => e.target === e.currentTarget && setModalEsqueci(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.22,1,0.36,1] } }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              style={{ background: '#0F1E38', borderRadius: 16, padding: '32px 28px', width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>Recuperar senha</h3>
                  <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.45)', lineHeight: 1.5 }}>
                    Informe o e-mail da sua conta para receber o link de redefinição.
                  </p>
                </div>
                <button onClick={() => setModalEsqueci(false)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(241,245,249,0.5)', flexShrink: 0, marginLeft: 12 }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {esquecSucesso ? (
                <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
                  <p style={{ fontWeight: 600, color: '#F1F5F9', marginBottom: 6 }}>E-mail enviado!</p>
                  <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.45)', lineHeight: 1.5, marginBottom: 20 }}>
                    Se o endereço estiver cadastrado, você receberá um link em instantes. Verifique também o spam.
                  </p>
                  <button onClick={() => setModalEsqueci(false)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Fechar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEsqueci}>
                  <AnimatePresence>
                    {esquecErro && <motion.div className="alert alert-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 12, overflow: 'hidden' }}>{esquecErro}</motion.div>}
                  </AnimatePresence>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label-sm">E-mail</label>
                    <div className="input-icon-wrap">
                      <svg className="input-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
                      </svg>
                      <input className="form-input" type="email" placeholder="seu@email.com" value={esquecEmail}
                        onChange={e => { setEsquecEmail(e.target.value); setEsquecErro(''); }} autoFocus required />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setModalEsqueci(false)} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                    <motion.button type="submit" className="btn btn-primary" disabled={esquecLoading} whileTap={{ scale: 0.97 }} style={{ flex: 1, justifyContent: 'center' }}>
                      {esquecLoading ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner /> Enviando...</span> : 'Enviar link'}
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
