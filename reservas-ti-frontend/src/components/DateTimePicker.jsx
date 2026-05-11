import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale/pt-BR';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pt-BR', ptBR);

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d) ? null : d;
}

function toISO(date) {
  if (!date) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function DateTimePicker({ label, value, onChange, required, minDate }) {
  return (
    <div className="form-group dtp-wrap" style={{ marginBottom: 0 }}>
      <label className="form-label">{label}</label>
      <DatePicker
        selected={toDate(value)}
        onChange={date => onChange(toISO(date))}
        locale="pt-BR"
        showTimeSelect
        timeIntervals={30}
        timeCaption="Hora"
        dateFormat="dd/MM/yyyy 'às' HH:mm"
        timeFormat="HH:mm"
        minDate={toDate(minDate)}
        placeholderText="Selecione a data e hora"
        className="form-input"
        wrapperClassName="dtp-wrapper"
        required={required}
        autoComplete="off"
        showPopperArrow={false}
      />
    </div>
  );
}
