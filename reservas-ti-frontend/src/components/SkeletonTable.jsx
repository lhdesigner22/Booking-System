import { motion } from 'framer-motion';

function SkeletonCell({ width = '80%' }) {
  return (
    <div className="skeleton" style={{ height: 13, width, borderRadius: 4 }} />
  );
}

export default function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--table-divider)' }}>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} style={{ padding: '12px 16px' }}>
              <div className="skeleton" style={{ height: 11, width: '60%', borderRadius: 4 }} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <motion.tr
            key={r}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: r * 0.06 }}
            style={{ borderBottom: '1px solid var(--table-divider)' }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} style={{ padding: '14px 16px' }}>
                <SkeletonCell width={c === 0 ? '40%' : c === cols - 1 ? '30%' : '75%'} />
              </td>
            ))}
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}
