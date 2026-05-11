import { pool } from '../config/database.js';

// ── Busca e-mails de todos os admins ──────────────────────────────────────────
async function emailsDosAdmins() {
  const result = await pool.query(
    "SELECT email FROM usuarios WHERE admin = true AND email IS NOT NULL"
  );
  return result.rows.map(r => r.email);
}

// ── Template HTML ─────────────────────────────────────────────────────────────
function templateNovaReserva({ reserva, equipamento, usuario }) {
  const fmt = (d) =>
    new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  const linhas = [
    ['Equipamento',  equipamento],
    ['Quantidade',   reserva.quantidade ?? 1],
    ['Início',       fmt(reserva.data_inicio)],
    ['Término',      fmt(reserva.data_fim)],
    ['Local de uso', reserva.local_uso || '—'],
    ['Solicitante',  usuario.nome],
    ['E-mail',       usuario.email],
    ['Setor/Curso',  usuario.setor || '—'],
    ['ID da reserva',`#${reserva.id}`],
  ].map(([k, v]) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #2D3748;color:#94A3B8;font-size:13px;white-space:nowrap">${k}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2D3748;color:#F1F5F9;font-size:13px;font-weight:500">${v}</td>
    </tr>`).join('');

  const adminUrl = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/admin`
    : 'https://booking-reservas-ti.vercel.app/admin';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <!-- Header -->
        <tr><td style="background:#1E293B;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:2px solid #22C55E">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:1px;color:#22C55E;text-transform:uppercase">Booking System</p>
                <h1 style="margin:0;font-size:22px;font-weight:700;color:#F1F5F9">📋 Nova Reserva Registrada</h1>
              </td>
              <td align="right">
                <span style="display:inline-block;padding:5px 14px;border-radius:20px;background:rgba(245,158,11,0.15);color:#FCD34D;font-size:12px;font-weight:700;border:1px solid rgba(245,158,11,0.35)">PENDENTE</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#1E293B;padding:24px 32px">
          <p style="margin:0 0 20px;font-size:14px;color:#94A3B8;line-height:1.6">
            Uma nova solicitação de reserva foi criada e está <strong style="color:#FCD34D">aguardando aprovação</strong>.
            Acesse o painel para aprovar ou recusar.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;border-radius:10px;overflow:hidden;margin-bottom:24px">
            ${linhas}
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${adminUrl}"
                 style="display:inline-block;padding:13px 32px;background:#22C55E;color:#0F172A;text-decoration:none;font-weight:700;font-size:14px;border-radius:10px;letter-spacing:0.3px">
                Abrir Painel Admin →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#162032;border-radius:0 0 12px 12px;padding:16px 32px;border-top:1px solid #2D3748">
          <p style="margin:0;font-size:11px;color:#475569;text-align:center">
            Este e-mail foi enviado automaticamente pelo Booking System · Colégio Ser<br>
            Não responda este e-mail — ele é gerado automaticamente.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Função principal exportada ────────────────────────────────────────────────
export async function notificarAdminsNovaReserva({ reserva, equipamento, usuario }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY não configurada — notificação ignorada.');
    return;
  }

  try {
    const admins = await emailsDosAdmins();
    if (admins.length === 0) {
      console.log('[Email] Nenhum admin com e-mail encontrado.');
      return;
    }

    const html = templateNovaReserva({ reserva, equipamento, usuario });

    const from = process.env.EMAIL_FROM || 'Booking System <onboarding@resend.dev>';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: admins,
        subject: `📋 Nova reserva: ${equipamento} — ${usuario.nome}`,
        html,
      }),
    });

    if (!response.ok) {
      const erro = await response.text();
      throw new Error(`Resend API ${response.status}: ${erro}`);
    }

    console.log(`[Email] Notificação enviada para: ${admins.join(', ')}`);
  } catch (err) {
    // Erro de e-mail nunca deve quebrar a reserva
    console.error('[Email] Falha ao enviar notificação:', err.message);
  }
}
