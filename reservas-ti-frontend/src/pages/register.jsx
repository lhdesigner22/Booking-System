import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import PageTransition from '../components/PageTransition.jsx';
import Spinner from '../components/Spinner.jsx';
import logo from '../assets/logo2.png';

const STEPS = [
  { label: 'Crie sua conta',         desc: 'Preencha seus dados' },
  { label: 'Acesso imediato',         desc: 'Faça login em seguida' },
  { label: 'Reserve equipamentos',    desc: 'Sem conflitos ou filas' },
];

const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] } },
};

export default function Register() {
  const [form, setForm]       = useState({ nome: '', email: '', senha: '', setor: '' });
  const [erro, setErro]       = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.senha.length < 4) return setErro('A senha deve ter pelo menos 4 caracteres.');
    setErro(''); setLoading(true);
    try {
      await api.post('/usuarios/register', form);
      setSucesso(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
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
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', top: -80, right: -80, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <img src={logo} alt="Logo" style={{ width: 150, display: 'block', marginBottom: 28 }} />

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

              <h2 style={{ fontSize: 26, fontWeight: 700, color: '#F1F5F9', letterSpacing: -0.6, lineHeight: 1.2, marginBottom: 10 }}>
                Crie sua conta<br />
                <span style={{ color: '#22C55E' }}>é gratuito</span>
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', lineHeight: 1.65, marginBottom: 32 }}>
                Cadastre-se e comece a reservar equipamentos de TI do Help Desk imediatamente.
              </p>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {STEPS.map((s, i) => (
                  <motion.div key={s.label}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.09, duration: 0.3 }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingBottom: i < STEPS.length - 1 ? 16 : 0 }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'rgba(34,197,94,0.15)', border: '1.5px solid rgba(34,197,94,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#4ADE80',
                      }}>
                        {i + 1}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div style={{ width: 1, flex: 1, minHeight: 18, background: 'rgba(34,197,94,0.15)', marginTop: 4 }} />
                      )}
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(241,245,249,0.82)', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(241,245,249,0.35)' }}>{s.desc}</div>
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
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            >
              {/* Header */}
              <motion.div variants={itemVariant} style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', letterSpacing: -0.4, marginBottom: 4 }}>
                  Criar conta
                </h3>
                <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.45)' }}>Preencha seus dados para se cadastrar</p>
              </motion.div>

              {/* Alertas */}
              <AnimatePresence>
                {erro && (
                  <motion.div className="alert alert-error"
                    initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 16, overflow: 'hidden' }}>
                    {erro}
                  </motion.div>
                )}
                {sucesso && (
                  <motion.div className="alert alert-success"
                    initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 16, overflow: 'hidden' }}>
                    ✓ Conta criada! Redirecionando para o login...
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nome */}
              <motion.div variants={itemVariant} className="form-group">
                <label className="form-label-sm">Nome completo</label>
                <div className="input-icon-wrap">
                  <svg className="input-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="7" r="4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>
                  </svg>
                  <input className="form-input" type="text" placeholder="Seu nome completo"
                    value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                    required autoComplete="name" />
                </div>
              </motion.div>

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
                <label className="form-label-sm">Senha</label>
                <div className="input-icon-wrap">
                  <svg className="input-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input className="form-input" type="password" placeholder="Mínimo 4 caracteres"
                    value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })}
                    required autoComplete="new-password" />
                </div>
              </motion.div>

              {/* Setor */}
              <motion.div variants={itemVariant} className="form-group" style={{ marginBottom: 28 }}>
                <label className="form-label-sm">Setor / Curso <span style={{ fontWeight: 400, color: 'rgba(241,245,249,0.3)' }}>(opcional)</span></label>
                <div className="input-icon-wrap">
                  <svg className="input-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  <input className="form-input" type="text" placeholder="Ex: TI, Administração, Ensino Médio A..."
                    value={form.setor} onChange={e => setForm({ ...form, setor: e.target.value })}
                    autoComplete="organization" />
                </div>
              </motion.div>

              {/* Botão */}
              <motion.div variants={itemVariant}>
                <motion.button
                  className="btn btn-primary btn-login-shimmer"
                  type="button" onClick={handleSubmit} disabled={loading || sucesso}
                  whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, borderRadius: 10 }}
                >
                  {loading
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner /> Cadastrando...</span>
                    : sucesso
                    ? '✓ Conta criada!'
                    : <><span>Criar conta</span><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginLeft: 4 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                  }
                </motion.button>
              </motion.div>

              {/* Rodapé */}
              <motion.p variants={itemVariant} style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(241,245,249,0.4)' }}>
                Já tem conta?{' '}
                <Link to="/login" style={{ color: '#22C55E', fontWeight: 600 }}>Entrar agora</Link>
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
