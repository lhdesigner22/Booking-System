import { AnimatePresence, motion } from 'framer-motion';
import { Children, isValidElement } from 'react';

/**
 * Modal com layout em 3 partes:
 *  - Header fixo  (título + botão X)
 *  - Body rolável (conteúdo do formulário)
 *  - Footer fixo  (botões de ação — detectado pelo className "modal-footer")
 */
export default function Modal({ open, onClose, title, subtitle, children }) {
  // Separa o modal-footer dos demais filhos para fixá-lo embaixo
  const childArray = Children.toArray(children);
  const footer = childArray.find(
    c => isValidElement(c) && c.props?.className?.includes('modal-footer')
  );
  const body = childArray.filter(
    c => !(isValidElement(c) && c.props?.className?.includes('modal-footer'))
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="modal"
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {/* ── Header fixo ── */}
            <div className="modal-header-wrap">
              <div className="modal-header">
                <div>
                  <h3>{title}</h3>
                  {subtitle && <p className="modal-sub" style={{ marginBottom: 0 }}>{subtitle}</p>}
                </div>
                <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '14px 0 0' }} />
            </div>

            {/* ── Body rolável ── */}
            <div className="modal-body" style={{ paddingTop: 20 }}>
              {body}
            </div>

            {/* ── Footer fixo ── */}
            {footer && (
              <div className="modal-footer-wrap">
                <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
