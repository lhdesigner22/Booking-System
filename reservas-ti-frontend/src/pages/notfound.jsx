import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

export default function NotFound() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const dest = usuario ? '/dashboard' : '/login';
  const destLabel = usuario ? 'Ir para o Dashboard' : 'Ir para o Login';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080F1D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'inherit',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 65%)',
        top: -200, right: -180, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 65%)',
        bottom: -180, left: -140, pointerEvents: 'none',
      }} />
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px', pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 520 }}
      >
        {/* 404 number */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}
        >
          <span style={{
            fontSize: 'clamp(96px, 18vw, 160px)',
            fontWeight: 900,
            letterSpacing: -8,
            background: 'linear-gradient(135deg, rgba(241,245,249,0.12) 0%, rgba(241,245,249,0.04) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
            userSelect: 'none',
            display: 'block',
          }}>
            404
          </span>
          {/* Green accent line under 404 */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', bottom: 10, left: '10%', right: '10%',
              height: 3, background: 'linear-gradient(90deg, transparent, #22C55E, transparent)',
              borderRadius: 99,
            }}
          />
        </motion.div>

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(34,197,94,0.1)',
            border: '1.5px solid rgba(34,197,94,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <svg width="28" height="28" fill="none" stroke="#4ADE80" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
            <path d="M11 8v3M11 14h.01" strokeLinecap="round" />
          </svg>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            fontSize: 'clamp(20px, 4vw, 28px)',
            fontWeight: 700,
            color: '#F1F5F9',
            letterSpacing: -0.5,
            marginBottom: 12,
          }}
        >
          Página não encontrada
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.4 }}
          style={{
            fontSize: 14,
            color: 'rgba(241,245,249,0.45)',
            lineHeight: 1.7,
            marginBottom: 36,
          }}
        >
          O endereço que você tentou acessar não existe ou foi movido.
          <br />
          Verifique o link ou volte para um lugar seguro.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <motion.button
            onClick={() => navigate(dest)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '12px 24px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.25)',
            }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {destLabel}
          </motion.button>

          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(241,245,249,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '12px 24px',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Voltar
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
