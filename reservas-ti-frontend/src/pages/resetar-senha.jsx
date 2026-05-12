import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import PageTransition from '../components/PageTransition.jsx';
import LoginLeft from '../components/LoginLeft.jsx';
import Spinner from '../components/Spinner.jsx';

const itemVariant = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

export default function ResetarSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha]   = useState('');
  const [confirmar, setConfirmar]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [erro, setErro]             = useState('');
  const [sucesso, setSucesso]       = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  if (!token) {
    return (
      <PageTransition>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Link inválido ou ausente.</p>
          <Link to="/login" style={{ color: 'var(--brand-green)', fontWeight: 600 }}>Voltar ao login</Link>
        </div>
      </PageTransition>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (novaSenha !== confirmar) return setErro('As senhas não coincidem.');
    if (novaSenha.length < 4) return setErro('A senha deve ter no mínimo 4 caracteres.');
    setErro('');
    setLoading(true);
    try {
      await api.post('/usuarios/resetar-senha', { token, novaSenha });
      setSucesso(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="login-page">
        <LoginLeft
          badges={['Link seguro', 'Expira em 1 hora', 'Sem compartilhamento']}
          tagline="Crie uma nova senha para acessar o Booking System."
        />

        <div className="login-right">
          <motion.div
            className="login-box"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
          >
            <motion.div variants={itemVariant} className="login-box-header">
              <div className="login-box-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
              </div>
              <div>
                <h2>Nova Senha</h2>
                <p className="subtitle">Crie uma senha segura para a sua conta</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariant} className="login-box-divider" />

            <AnimatePresence>
              {erro && (
                <motion.div className="alert alert-error"
                  initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 16, overflow: 'hidden' }}>
                  {erro}
                </motion.div>
              )}
            </AnimatePresence>

            {sucesso ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '24px 0' }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Senha atualizada!</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Redirecionando para o login...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                <motion.div variants={itemVariant} className="form-group">
                  <label className="form-label-sm">Nova Senha</label>
                  <div className="input-icon-wrap" style={{ position: 'relative' }}>
                    <svg className="input-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      className="form-input"
                      type={mostrarSenha ? 'text' : 'password'}
                      placeholder="Mínimo 4 caracteres"
                      value={novaSenha}
                      onChange={e => { setNovaSenha(e.target.value); setErro(''); }}
                      required
                      autoFocus
                    />
                    <button type="button" onClick={() => setMostrarSenha(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                      {mostrarSenha
                        ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={itemVariant} className="form-group" style={{ marginBottom: 24 }}>
                  <label className="form-label-sm">Confirmar Senha</label>
                  <div className="input-icon-wrap">
                    <svg className="input-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      className="form-input"
                      type={mostrarSenha ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      value={confirmar}
                      onChange={e => { setConfirmar(e.target.value); setErro(''); }}
                      required
                    />
                  </div>
                </motion.div>

                <motion.button variants={itemVariant} className="btn btn-primary"
                  type="submit" disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, borderRadius: 10 }}>
                  {loading
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner /> Salvando...</span>
                    : 'Salvar nova senha'}
                </motion.button>

                <motion.div variants={itemVariant} style={{ textAlign: 'center', marginTop: 16 }}>
                  <Link to="/login" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    ← Voltar ao login
                  </Link>
                </motion.div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
