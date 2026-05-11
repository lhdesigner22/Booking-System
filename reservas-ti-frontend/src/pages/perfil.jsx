import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition.jsx';
import CropAvatarModal from '../components/CropAvatarModal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function fotoKey(userId) { return `avatar_foto_${userId}`; }

export default function Perfil() {
  const { usuario, login }          = useAuth();
  const [form, setForm]             = useState({ nome: '', email: '', senha: '', confirmar: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showSenha, setShowSenha]   = useState(false);
  const [foto, setFoto]             = useState(null);
  const [fotoHover, setFotoHover]   = useState(false);
  const [cropSrc, setCropSrc]       = useState(null);
  const fileInputRef                = useRef(null);
  const toast = useToast();

  useEffect(() => {
    if (!usuario) return;
    const salva = localStorage.getItem(fotoKey(usuario.id));
    if (salva) setFoto(salva);
    api.get('/usuarios/perfil').then(r => {
      setForm(f => ({ ...f, nome: r.data.nome ?? '', email: r.data.email ?? '' }));
    }).catch(() => {});
  }, [usuario?.id]);

  function handleFotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // reset input so selecting the same file again still triggers onChange
    e.target.value = '';
    if (!file.type.startsWith('image/'))
      return toast({ message: 'Selecione um arquivo de imagem válido', type: 'error' });
    if (file.size > 10 * 1024 * 1024)
      return toast({ message: 'A imagem deve ter no máximo 10 MB', type: 'error' });
    const reader = new FileReader();
    reader.onload = ev => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleCropConfirm(base64) {
    setCropSrc(null);
    setFoto(base64);
    localStorage.setItem(fotoKey(usuario.id), base64);
    window.dispatchEvent(new CustomEvent('avatar:updated', { detail: base64 }));
    toast({ message: 'Foto atualizada com sucesso!' });
  }

  function handleRemoverFoto() {
    setFoto(null);
    localStorage.removeItem(fotoKey(usuario.id));
    window.dispatchEvent(new CustomEvent('avatar:updated', { detail: null }));
    toast({ message: 'Foto removida' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (showSenha && form.senha !== form.confirmar)
      return toast({ message: 'As senhas não coincidem', type: 'error' });
    if (showSenha && form.senha.length < 4)
      return toast({ message: 'Senha deve ter ao menos 4 caracteres', type: 'error' });
    setSubmitting(true);
    try {
      const payload = { nome: form.nome, email: form.email };
      if (showSenha && form.senha) payload.senha = form.senha;
      const res = await api.patch('/usuarios/perfil', payload);
      if (res.data?.token) login(res.data.token);
      setForm(f => ({ ...f, senha: '', confirmar: '' }));
      setShowSenha(false);
      toast({ message: 'Perfil atualizado com sucesso!' });
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Erro ao atualizar perfil', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const inicial = usuario?.nome?.[0]?.toUpperCase() || '?';

  if (!usuario) {
    return (
      <div className="page-layout">
        <Sidebar />
        <main className="main-content">
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
        </main>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="page-layout">
        <Sidebar />
        <main className="main-content">

          <motion.div
            className="page-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2>Meu Perfil</h2>
            <p>Edite suas informações pessoais e senha de acesso</p>
          </motion.div>

          <div style={{ maxWidth: 540 }}>

            {/* Avatar card */}
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ marginBottom: 16, borderTop: '2px solid rgba(34,197,94,0.3)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <motion.div
                    style={{
                      width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 30, fontWeight: 700, color: '#fff', position: 'relative',
                      boxShadow: fotoHover
                        ? '0 0 0 3px rgba(34,197,94,0.4), 0 4px 20px rgba(34,197,94,0.2)'
                        : '0 0 0 3px rgba(34,197,94,0.2)',
                      transition: 'box-shadow 0.2s',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onHoverStart={() => setFotoHover(true)}
                    onHoverEnd={() => setFotoHover(false)}
                    onClick={() => fileInputRef.current?.click()}
                    title="Clique para trocar a foto"
                  >
                    {foto
                      ? <img src={foto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : inicial
                    }
                    <AnimatePresence>
                      {fotoHover && (
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: '50%',
                          }}
                        >
                          <span style={{ fontSize: 18 }}>📷</span>
                          <span style={{ fontSize: 9, color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>TROCAR</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <AnimatePresence>
                    {foto && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        onClick={handleRemoverFoto}
                        title="Remover foto"
                        style={{
                          position: 'absolute', bottom: 0, right: -2,
                          width: 24, height: 24, borderRadius: '50%',
                          background: '#EF4444', border: '2px solid var(--card-bg)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 10, color: '#fff', padding: 0,
                        }}
                      >✕</motion.button>
                    )}
                  </AnimatePresence>

                  <input ref={fileInputRef} type="file" accept="image/*"
                    style={{ display: 'none' }} onChange={handleFotoChange} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {usuario.nome}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {usuario.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${usuario.admin ? 'aprovada' : 'pendente'}`}>
                      {usuario.admin ? '⚑ Administrador' : '● Colaborador'}
                    </span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        fontSize: 12, color: 'var(--brand-green)', background: 'none',
                        border: 'none', cursor: 'pointer', padding: 0,
                        textDecoration: 'underline', textUnderlineOffset: 2,
                      }}
                    >
                      {foto ? 'Trocar foto' : 'Adicionar foto'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Edit form */}
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ADE80',
                }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                  Editar informações
                </h3>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Nome completo</label>
                  <input className="form-input" type="text"
                    value={form.nome}
                    onChange={e => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input className="form-input" type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>

                {/* Toggle senha */}
                <div className="form-group">
                  <motion.button
                    type="button"
                    onClick={() => setShowSenha(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                      fontSize: 14, color: 'var(--text-secondary)', background: 'none',
                      border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px',
                      width: '100%', fontFamily: 'inherit',
                    }}
                    whileHover={{ borderColor: 'var(--brand-green)', color: '#4ADE80' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.svg
                      width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                      animate={{ rotate: showSenha ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <path d="M9 18l6-6-6-6"/>
                    </motion.svg>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    {showSenha ? 'Cancelar alteração de senha' : 'Alterar senha'}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {showSenha && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        background: 'var(--surface-2)', borderRadius: 10,
                        padding: '16px', marginBottom: 16,
                        border: '1px solid var(--border)',
                      }}>
                        <div className="form-group">
                          <label className="form-label">Nova senha</label>
                          <input className="form-input" type="password" placeholder="Mínimo 4 caracteres"
                            value={form.senha}
                            onChange={e => setForm({ ...form, senha: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Confirmar nova senha</label>
                          <input className="form-input" type="password" placeholder="Repita a nova senha"
                            value={form.confirmar}
                            onChange={e => setForm({ ...form, confirmar: e.target.value })} />
                          <AnimatePresence>
                            {form.senha && form.confirmar && form.senha !== form.confirmar && (
                              <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{ color: '#F87171', fontSize: 12, marginTop: 6 }}
                              >
                                As senhas não coincidem
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <motion.button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    style={{ gap: 8 }}
                  >
                    {submitting ? (
                      <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                        Salvando...
                      </motion.span>
                    ) : (
                      <>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                          <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Salvar alterações
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </main>
      </div>

      {cropSrc && (
        <CropAvatarModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </PageTransition>
  );
}