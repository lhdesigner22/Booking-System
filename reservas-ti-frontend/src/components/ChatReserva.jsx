import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

function fmtHora(d) {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function ChatReserva({ reservaId }) {
  const { usuario } = useAuth();
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);

  useEffect(() => {
    if (!reservaId) return;
    carregar();
    const intervalo = setInterval(carregar, 8000);
    return () => clearInterval(intervalo);
  }, [reservaId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  async function carregar() {
    try {
      const res = await api.get(`/reservas/${reservaId}/comentarios`);
      setMensagens(res.data);
    } catch {
      // silencioso — não interrompe o usuário
    } finally {
      setLoading(false);
    }
  }

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/reservas/${reservaId}/comentarios`, { mensagem: texto.trim() });
      setMensagens(prev => [...prev, res.data]);
      setTexto('');
      inputRef.current?.focus();
    } catch {
      // silencioso
    } finally {
      setSending(false);
    }
  }

  const meuId = usuario?.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        paddingBottom: 10, marginBottom: 10,
        borderBottom: '1px solid var(--border)',
      }}>
        <svg width="14" height="14" fill="none" stroke="var(--brand-green)" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          Mensagens
        </span>
        {mensagens.length > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            background: 'rgba(34,197,94,0.12)', color: '#4ADE80',
            border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 10, padding: '1px 7px',
          }}>
            {mensagens.length}
          </span>
        )}
      </div>

      {/* Lista de mensagens */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
        gap: 8, minHeight: 0, maxHeight: 280, paddingRight: 4,
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            Carregando...
          </div>
        ) : mensagens.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center', padding: '24px 16px',
              color: 'var(--text-muted)', fontSize: 13,
            }}
          >
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
              style={{ marginBottom: 8, opacity: 0.4 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <div>Nenhuma mensagem ainda.</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Envie uma mensagem para iniciar a conversa.</div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {mensagens.map(m => {
              const isMeu = m.usuario_id === meuId;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    display: 'flex',
                    flexDirection: isMeu ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 8,
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff',
                    background: m.usuario_admin
                      ? 'linear-gradient(135deg, #6366F1, #4F46E5)'
                      : 'linear-gradient(135deg, #22C55E, #16A34A)',
                  }}>
                    {m.usuario_nome?.[0]?.toUpperCase() ?? '?'}
                  </div>

                  {/* Balão */}
                  <div style={{ maxWidth: '72%' }}>
                    <div style={{
                      fontSize: 10, color: 'var(--text-muted)', marginBottom: 3,
                      textAlign: isMeu ? 'right' : 'left',
                      display: 'flex', alignItems: 'center', gap: 4,
                      flexDirection: isMeu ? 'row-reverse' : 'row',
                    }}>
                      <span style={{ fontWeight: 600, color: m.usuario_admin ? '#818CF8' : 'var(--text-secondary)' }}>
                        {isMeu ? 'Você' : m.usuario_nome}
                      </span>
                      {m.usuario_admin && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                          padding: '1px 5px', borderRadius: 4,
                          background: 'rgba(99,102,241,0.15)', color: '#818CF8',
                          border: '1px solid rgba(99,102,241,0.25)',
                        }}>ADMIN</span>
                      )}
                      <span>{fmtHora(m.created_at)}</span>
                    </div>
                    <div style={{
                      padding: '9px 13px', borderRadius: isMeu ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
                      background: isMeu
                        ? 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(34,197,94,0.10))'
                        : 'var(--surface-2)',
                      border: isMeu
                        ? '1px solid rgba(34,197,94,0.25)'
                        : '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}>
                      {m.mensagem}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={enviar}
        style={{
          display: 'flex', gap: 8, marginTop: 12,
          paddingTop: 10, borderTop: '1px solid var(--border)',
        }}
      >
        <input
          ref={inputRef}
          className="form-input"
          placeholder="Escreva uma mensagem..."
          value={texto}
          onChange={e => setTexto(e.target.value)}
          maxLength={1000}
          disabled={sending}
          style={{ flex: 1, marginBottom: 0, fontSize: 13 }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) enviar(e); }}
        />
        <motion.button
          type="submit"
          className="btn btn-primary"
          disabled={!texto.trim() || sending}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{ padding: '0 16px', flexShrink: 0, opacity: (!texto.trim() || sending) ? 0.5 : 1 }}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </motion.button>
      </form>
    </div>
  );
}
