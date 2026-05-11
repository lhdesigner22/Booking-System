import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale/pt-BR';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pt-BR', ptBR);

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d) ? null : d;
}

function toISO(date, showTime) {
  if (!date) return '';
  const pad = n => String(n).padStart(2, '0');
  // Modo só-data: usa data LOCAL (sem fuso) — usado apenas em filtros de busca
  if (!showTime) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  // Modo data+hora: envia em UTC com offset para o servidor interpretar corretamente
  return date.toISOString();
}

// showTime={true}  → data + hora (padrão, usado em reservas)
// showTime={false} → só data (usado em filtros)
export default function DateTimePicker({ label, value, onChange, required, minDate, showTime = true }) {
  // filterTime é reavaliado cada vez que o picker abre — sempre usa new Date() fresco
  // Adiciona 1 min de margem para não bloquear horários escolhidos "agora"
  const filterTime = showTime && minDate
    ? (time) => new Date(time).getTime() >= Date.now() - 60 * 1000
    : undefined;

  return (
    <div className="form-group dtp-wrap" style={{ marginBottom: 0 }}>
      {label && <label className="form-label">{label}</label>}
      <DatePicker
        selected={toDate(value)}
        onChange={date => onChange(toISO(date, showTime))}
        locale="pt-BR"
        showTimeSelect={showTime}
        timeIntervals={30}
        timeCaption="Hora"
        dateFormat={showTime ? "dd/MM/yyyy 'às' HH:mm" : "dd/MM/yyyy"}
        timeFormat="HH:mm"
        minDate={toDate(minDate)}
        filterTime={filterTime}
        placeholderText={showTime ? 'Selecione a data e hora' : 'Selecione a data'}
        className="form-input"
        wrapperClassName="dtp-wrapper"
        required={required}
        autoComplete="off"
        showPopperArrow={false}
        isClearable={!required}
      />
    </div>
  );
}
