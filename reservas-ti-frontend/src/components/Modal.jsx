import { AnimatePresence, motion } from 'framer-motion';

export default function Modal({ open, onClose, title, subtitle, children }) {
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
            <h3>{title}</h3>
            {subtitle && <p className="modal-sub">{subtitle}</p>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
