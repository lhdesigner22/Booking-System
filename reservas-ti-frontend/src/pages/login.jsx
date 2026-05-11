import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import PageTransition from '../components/PageTransition.jsx';
import LoginLeft from '../components/LoginLeft.jsx';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const BADGES = ['3 reservas aprovadas hoje', 'Sistema online', '12 equipamentos disponíveis'];

const itemVariant = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

export default function Login() {
  const [form, setForm]         = useState({ email: '', senha: '' });
  const [erro, setErro]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const loginGoogle = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      setLoadingGoogle(true);
      setErro('');
      try {
        const res = await api.post('/auth/google', { credential: access_token });
        login(res.data.token);
        navigate('/equipamentos');
      } catch {
        setErro('Erro ao autenticar com o Google. Tente novamente.');
      } finally {
        setLoadingGoogle(false);
      }
    },
    onError: () => setErro('Login com Google cancelado ou falhou.'),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await api.post('/usuarios/login', form);
      login(res.data.token);
      navigate('/equipamentos');
    } catch (err) {
      setErro(err.response?.data?.error || 'Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="login-page">

        <LoginLeft
          badges={BADGES}
          tagline="Gerencie reservas de equipamentos de TI de forma simples, rápida e sem conflitos."
        />

        {/* ── Painel direito ── */}
        <div className="login-right">
          <motion.div
            className="login-box"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
          >
            {/* Header */}
            <motion.div variants={itemVariant} className="login-box-header">
              <div className="login-box-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <h2>Bem-vindo de volta</h2>
                <p className="subtitle">Entre com sua conta para continuar</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariant} className="login-box-divider" />

            {/* Erro */}
            <AnimatePresence>
              {erro && (
                <motion.div
                  className="alert alert-error"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginBottom: 16, overflow: 'hidden' }}
                >
                  {erro}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Campos */}
            <motion.div variants={itemVariant} className="form-group">
              <label className="form-label-sm">Email</label>
              <div className="input-icon-wrap">
                <svg className="input-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
                </svg>
                <input
                  className="form-input"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariant} className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label-sm">Senha</label>
              <div className="input-icon-wrap">
                <svg className="input-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={e => setForm({ ...form, senha: e.target.value })}
                  required
                  autoComplete="current-password"
                />
              </div>
            </motion.div>

            {/* Botão */}
            <motion.div variants={itemVariant}>
              <motion.button
                className="btn btn-primary btn-login-shimmer"
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, borderRadius: 10 }}
              >
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner /> Entrando...</span>
                  : <>
                      Entrar
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginLeft: 4 }}>
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </>
                }
              </motion.button>
            </motion.div>

            {/* Divisor */}
            <motion.div variants={itemVariant} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ou</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </motion.div>

            {/* Botão Google */}
            <motion.div variants={itemVariant}>
              <motion.button
                type="button"
                onClick={() => loginGoogle()}
                disabled={loadingGoogle}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 10, padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                  background: 'var(--surface-2)', border: '1.5px solid var(--border-strong)',
                  color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
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
            <motion.p
              variants={itemVariant}
              style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}
            >
              Não tem conta?{' '}
              <Link to="/register" style={{ color: 'var(--brand-green)', fontWeight: 600 }}>
                Cadastre-se gratuitamente
              </Link>
            </motion.p>
          </motion.div>
        </div>

      </div>
    </PageTransition>
  );
}
