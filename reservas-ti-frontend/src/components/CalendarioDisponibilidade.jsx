import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function getOccupiedDays(reservas, ano, mes) {
  const occupied = new Set();
  reservas.forEach(r => {
    const inicio = new Date(r.data_inicio);
    const fim    = new Date(r.data_fim);
    const cur    = new Date(inicio);
    while (cur <= fim) {
      if (cur.getFullYear() === ano && cur.getMonth() + 1 === mes)
        occupied.add(cur.getDate());
      cur.setDate(cur.getDate() + 1);
    }
  });
  return occupied;
}

export default function CalendarioDisponibilidade({ equipamentoId }) {
  const hoje = new Date();
  const [ano, setAno]         = useState(hoje.getFullYear());
  const [mes, setMes]         = useState(hoje.getMonth() + 1);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!equipamentoId) return;
    setLoading(true);
    api.get(`/equipamentos/${equipamentoId}/calendario`, { params: { ano, mes } })
      .then(r => setReservas(r.data))
      .catch(() => setReservas([]))
      .finally(() => setLoading(false));
  }, [equipamentoId, ano, mes]);

  function navMes(delta) {
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes > 12) { novoMes = 1;  novoAno++; }
    if (novoMes < 1)  { novoMes = 12; novoAno--; }
    setMes(novoMes);
    setAno(novoAno);
  }

  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  const diasNoMes   = new Date(ano, mes, 0).getDate();
  const occupied    = getOccupiedDays(reservas, ano, mes);
  const hojeNum     = hoje.getFullYear() === ano && hoje.getMonth() + 1 === mes ? hoje.getDate() : null;

  const cells = [];
  for (let i = 0; i < primeiroDia; i++) cells.push(null);
  for (let d = 1; d <= diasNoMes; d++) cells.push(d);

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Header mês */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <motion.button className="btn btn-ghost btn-sm" whileTap={{ scale: 0.95 }}
          onClick={() => navMes(-1)} style={{ padding: '4px 10px' }}>‹</motion.button>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
          {MESES[mes - 1]} {ano}
          {loading && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' }}>...</span>}
        </div>
        <motion.button className="btn btn-ghost btn-sm" whileTap={{ scale: 0.95 }}
          onClick={() => navMes(1)} style={{ padding: '4px 10px' }}>›</motion.button>
      </div>

      {/* Dias da semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Células */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        <AnimatePresence mode="wait">
          {cells.map((dia, idx) => {
            if (!dia) return <div key={`e${idx}`} />;
            const isOccupied = occupied.has(dia);
            const isHoje     = dia === hojeNum;
            const isPast     = new Date(ano, mes - 1, dia) < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

            return (
              <motion.div
                key={`${ano}-${mes}-${dia}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.008 }}
                style={{
                  textAlign: 'center',
                  padding: '6px 2px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: isHoje ? 700 : 400,
                  cursor: 'default',
                  background: isOccupied
                    ? 'rgba(239,68,68,0.12)'
                    : isPast
                    ? 'transparent'
                    : 'rgba(34,197,94,0.1)',
                  color: isOccupied
                    ? '#F87171'
                    : isPast
                    ? 'var(--text-muted)'
                    : 'var(--text-primary)',
                  border: isHoje
                    ? '1.5px solid var(--brand-green)'
                    : '1.5px solid transparent',
                  position: 'relative',
                }}
                title={isOccupied ? 'Dia com reserva' : isPast ? 'Data passada' : 'Disponível'}
              >
                {dia}
                {isOccupied && (
                  <div style={{
                    position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                    width: 4, height: 4, borderRadius: '50%', background: '#F87171',
                  }} />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11, color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)' }} />
          Disponível
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }} />
          Com reserva
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, border: '1.5px solid var(--brand-green)' }} />
          Hoje
        </div>
      </div>
    </div>
  );
}
