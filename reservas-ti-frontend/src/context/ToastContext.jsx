import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'success', duration = 3500 }) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const ICONS = {
  success: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  ),
  error: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
    </svg>
  ),
};

const STYLES = {
  success: { bg: '#ECFDF5', border: '#6EE7B7', color: '#065F46', icon: '#10B981' },
  error:   { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', icon: '#EF4444' },
  info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF', icon: '#3B82F6' },
};

function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none',
    }}>
      <AnimatePresence mode="popLayout">
        {toasts.map(t => {
          const s = STYLES[t.type] || STYLES.success;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={() => onRemove(t.id)}
              style={{
                pointerEvents: 'all',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderRadius: 12,
                background: s.bg,
                border: `1px solid ${s.border}`,
                color: s.color,
                fontSize: 14,
                fontWeight: 500,
                boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                maxWidth: 340,
                minWidth: 240,
                userSelect: 'none',
              }}
            >
              <span style={{ color: s.icon, flexShrink: 0 }}>{ICONS[t.type]}</span>
              <span style={{ flex: 1 }}>{t.message}</span>
              <span style={{ opacity: 0.4, fontSize: 16, lineHeight: 1 }}>×</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
