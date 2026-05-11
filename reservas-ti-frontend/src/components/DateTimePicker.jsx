/**
 * DateTimePicker — seletor de data + hora intuitivo
 * Separa o calendário nativo (date) de um select de horários (HH:MM)
 * Value/onChange usam o formato ISO: "YYYY-MM-DDTHH:MM"
 */

const HORARIOS = (() => {
  const slots = [];
  for (let h = 6; h <= 23; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
})();

export default function DateTimePicker({ label, value, onChange, required, min }) {
  const date = value ? value.slice(0, 10) : '';
  const time = value ? value.slice(11, 16) : '';

  function handleDate(e) {
    const newDate = e.target.value;
    onChange(`${newDate}T${time || '08:00'}`);
  }

  function handleTime(e) {
    if (!date) return; // exige que a data seja escolhida primeiro
    onChange(`${date}T${e.target.value}`);
  }

  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Calendário */}
        <input
          className="form-input"
          type="date"
          value={date}
          min={min ? min.slice(0, 10) : undefined}
          onChange={handleDate}
          required={required}
          style={{ flex: 1 }}
        />
        {/* Horário */}
        <select
          className="form-input"
          value={time}
          onChange={handleTime}
          disabled={!date}
          required={required}
          style={{ width: 110, flexShrink: 0 }}
        >
          <option value="">Hora</option>
          {HORARIOS.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
