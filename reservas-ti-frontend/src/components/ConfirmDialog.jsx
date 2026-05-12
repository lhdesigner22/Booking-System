import { motion } from 'framer-motion';
import Modal from './Modal.jsx';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger = true }) {
  function handleConfirm() {
    onConfirm();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {message && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: -4, marginBottom: 24, lineHeight: 1.5 }}>
          {message}
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <motion.button
          className="btn btn-ghost"
          onClick={onClose}
          whileTap={{ scale: 0.97 }}
        >
          Cancelar
        </motion.button>
        <motion.button
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={handleConfirm}
          whileTap={{ scale: 0.97 }}
        >
          {confirmLabel}
        </motion.button>
      </div>
    </Modal>
  );
}
