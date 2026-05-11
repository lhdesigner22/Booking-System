import { motion } from 'framer-motion';

export default function SkeletonCards({ count = 6 }) {
  return (
    <div className="eq-grid">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          style={{ padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="skeleton" style={{ height: 16, width: '55%', borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 22, width: 80, borderRadius: 20 }} />
          </div>
          <div className="skeleton" style={{ height: 13, width: '90%', borderRadius: 4, marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 13, width: '65%', borderRadius: 4, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 36, width: '100%', borderRadius: 8 }} />
        </motion.div>
      ))}
    </div>
  );
}
