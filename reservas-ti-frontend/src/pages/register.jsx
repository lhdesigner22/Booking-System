import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import PageTransition from '../components/PageTransition.jsx';
import LoginLeft from '../components/LoginLeft.jsx';
import Spinner from '../components/Spinner.jsx';

const BADGES = ['Cadastro gratuito', 'Sistema online', '12 equipamentos disponíveis'];

const itemVariant = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

export default function Register() {
  const [form, setForm]       = useState({ nome: '', email: '', senha: '' });
  const [erro, setErro]       = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await api.post('/usuarios/register', form);
      setSucesso(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="login-page">

        <LoginLeft
          badges={BADGES}
          tagline="Crie sua conta e comece a reservar equipamentos de TI hoje mesmo."
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <div>
                <h2>Criar conta</h2>
                <p className="subtitle">Preencha os dados para se cadastrar</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariant} className="login-box-divider" />

            {/* Alertas */}
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
              {sucesso && (
                <motion.div
                  className="alert alert-success"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginBottom: 16, overflow: 'hidden' }}
                >
                  ✓ Conta criada! Redirecionando para o login...
                </motion.div>
              )}
            </AnimatePresence>

            {/* Campos */}
            <motion.div variants={itemVariant} className="form-group">
              <label className="form-label-sm">Nome completo</label>
              <div className="input-icon-wrap">
                <svg className="input-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="7" r="4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>
                </svg>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Seu nome completo"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  required
                  autoComplete="name"
                />
              </div>
            </motion.div>

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
                  placeholder="Mínimo 4 caracteres"
                  value={form.senha}
                  onChange={e => setForm({ ...form, senha: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </div>
            </motion.div>

            {/* Botão */}
            <motion.div variants={itemVariant}>
              <motion.button
                className="btn btn-primary btn-login-shimmer"
                type="button"
                onClick={handleSubmit}
                disabled={loading || sucesso}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, borderRadius: 10 }}
              >
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner /> Cadastrando...</span>
                  : sucesso
                  ? '✓ Conta criada!'
                  : <>
                      Criar conta
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginLeft: 4 }}>
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </>
                }
              </motion.button>
            </motion.div>

            {/* Rodapé */}
            <motion.p
              variants={itemVariant}
              style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}
            >
              Já tem conta?{' '}
              <Link to="/login" style={{ color: 'var(--brand-green)', fontWeight: 600 }}>
                Entrar agora
              </Link>
            </motion.p>
          </motion.div>
        </div>

      </div>
    </PageTransition>
  );
}
