import { pool } from '../config/database.js';

const FRONTEND_URL   = process.env.FRONTEND_URL  || 'https://booking-reservas-ti.vercel.app';
const SENDER_NAME    = process.env.EMAIL_FROM_NAME  || 'Booking System';
const SENDER_EMAIL   = process.env.EMAIL_FROM_ADDR  || 'booking.system@colegioser.com';

// ── Utilitários ───────────────────────────────────────────────────────────────
function fmt(d) {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

async function emailsDosAdmins() {
  const r = await pool.query("SELECT email FROM usuarios WHERE admin = true AND email IS NOT NULL");
  return r.rows.map(r => r.email);
}

async function enviar({ to, subject, html }) {
  if (!process.env.BREVO_API_KEY) {
    console.log('[Email] BREVO_API_KEY não configurada — notificação ignorada.');
    return;
  }
  const lista = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (lista.length === 0) return;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key':     process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender:      { name: SENDER_NAME, email: SENDER_EMAIL },
      to:          lista.map(email => ({ email })),
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
}

// ── Templates base ────────────────────────────────────────────────────────────
function wrapEmail({ titulo, subtitulo, badgeTexto, badgeCor, linhas, mensagemExtra, btnUrl, btnTexto }) {
  const linhasHtml = linhas.map(([k, v]) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #2D3748;color:#94A3B8;font-size:13px;white-space:nowrap">${k}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2D3748;color:#F1F5F9;font-size:13px;font-weight:500">${v}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <tr><td style="background:#1E293B;border-radius:12px 12px 0 0;padding:24px 32px;border-bottom:2px solid #22C55E">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:16px">
              <img src="${FRONTEND_URL}/logo.png" alt="Booking System" width="64" height="64" style="display:block;border-radius:12px">
            </td></tr>
            <tr>
            <td>
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:1px;color:#22C55E;text-transform:uppercase">Booking System</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#F1F5F9">${titulo}</h1>
              ${subtitulo ? `<p style="margin:6px 0 0;font-size:13px;color:#94A3B8">${subtitulo}</p>` : ''}
            </td>
            ${badgeTexto ? `<td align="right"><span style="display:inline-block;padding:5px 14px;border-radius:20px;background:${badgeCor}22;color:${badgeCor};font-size:12px;font-weight:700;border:1px solid ${badgeCor}55">${badgeTexto}</span></td>` : ''}
          </tr></table>
        </td></tr>

        <tr><td style="background:#1E293B;padding:24px 32px">
          ${mensagemExtra ? `<p style="margin:0 0 20px;font-size:14px;color:#94A3B8;line-height:1.6">${mensagemExtra}</p>` : ''}

          ${linhas.length > 0 ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;border-radius:10px;overflow:hidden;margin-bottom:24px">
            ${linhasHtml}
          </table>` : ''}

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${btnUrl}" style="display:inline-block;padding:13px 32px;background:#22C55E;color:#0F172A;text-decoration:none;font-weight:700;font-size:14px;border-radius:10px;letter-spacing:0.3px">
                ${btnTexto} →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="background:#162032;border-radius:0 0 12px 12px;padding:16px 32px;border-top:1px solid #2D3748">
          <p style="margin:0;font-size:11px;color:#475569;text-align:center">
            Este e-mail foi enviado automaticamente pelo Booking System · Colégio Ser<br>
            Não responda este e-mail — ele é gerado automaticamente.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ── 1. Nova reserva → admins ──────────────────────────────────────────────────
export async function notificarAdminsNovaReserva({ reserva, equipamento, usuario }) {
  try {
    const admins = await emailsDosAdmins();
    await enviar({
      to: admins,
      subject: `📋 Nova reserva: ${equipamento} — ${usuario.nome}`,
      html: wrapEmail({
        titulo:        '📋 Nova Reserva Registrada',
        badgeTexto:    'PENDENTE',
        badgeCor:      '#FCD34D',
        mensagemExtra: 'Uma nova solicitação de reserva foi criada e está <strong style="color:#FCD34D">aguardando aprovação</strong>. Acesse o painel para aprovar ou recusar.',
        linhas: [
          ['Equipamento',   equipamento],
          ['Quantidade',    reserva.quantidade ?? 1],
          ['Início',        fmt(reserva.data_inicio)],
          ['Término',       fmt(reserva.data_fim)],
          ['Local de uso',  reserva.local_uso || '—'],
          ['Solicitante',   usuario.nome],
          ['E-mail',        usuario.email],
          ['Setor/Curso',   usuario.setor || '—'],
          ['ID da reserva', `#${reserva.id}`],
        ],
        btnUrl:  `${FRONTEND_URL}/admin`,
        btnTexto: 'Abrir Painel Admin',
      }),
    });
    console.log(`[Email] Nova reserva notificada para admins`);
  } catch (err) {
    console.error('[Email] notificarAdminsNovaReserva:', err.message);
  }
}

// ── 2. Status atualizado → usuário ───────────────────────────────────────────
export async function notificarUsuarioStatusReserva({ nome, email, equipamento, status, data_inicio, data_fim }) {
  if (!email) return;
  const aprovada = status === 'aprovada';
  const recusada = status === 'recusada';
  if (!aprovada && !recusada) return;

  try {
    await enviar({
      to: [email],
      subject: aprovada
        ? `✅ Reserva aprovada: ${equipamento}`
        : `❌ Reserva recusada: ${equipamento}`,
      html: wrapEmail({
        titulo:        aprovada ? '✅ Reserva Aprovada!' : '❌ Reserva Recusada',
        subtitulo:     `Olá, ${nome}`,
        badgeTexto:    aprovada ? 'APROVADA' : 'RECUSADA',
        badgeCor:      aprovada ? '#4ADE80' : '#F87171',
        mensagemExtra: aprovada
          ? `Sua reserva foi <strong style="color:#4ADE80">aprovada</strong>. Retire o equipamento no horário combinado e lembre-se de devolvê-lo até o prazo.`
          : `Infelizmente sua reserva foi <strong style="color:#F87171">recusada</strong>. Entre em contato com a equipe de TI para mais informações.`,
        linhas: [
          ['Equipamento', equipamento],
          ['Início',      fmt(data_inicio)],
          ['Término',     fmt(data_fim)],
        ],
        btnUrl:  `${FRONTEND_URL}/reservas`,
        btnTexto: 'Ver Minhas Reservas',
      }),
    });
    console.log(`[Email] Status ${status} notificado para ${email}`);
  } catch (err) {
    console.error('[Email] notificarUsuarioStatusReserva:', err.message);
  }
}

// ── 3. Nova mensagem no chat ──────────────────────────────────────────────────
export async function notificarNovaMensagemChat({ reservaId, equipamento, remetente, mensagem, destinatarios }) {
  // destinatarios: [{ nome, email }]
  const lista = destinatarios.filter(d => d.email);
  if (lista.length === 0) return;

  try {
    await enviar({
      to: lista.map(d => d.email),
      subject: `💬 Nova mensagem na reserva: ${equipamento}`,
      html: wrapEmail({
        titulo:        '💬 Nova Mensagem no Chat',
        subtitulo:     `Reserva #${reservaId} — ${equipamento}`,
        mensagemExtra: `<strong style="color:#F1F5F9">${remetente}</strong> enviou uma mensagem na reserva:<br><br>
          <div style="background:#0F172A;border-left:3px solid #22C55E;border-radius:4px;padding:12px 16px;font-size:14px;color:#CBD5E1;font-style:italic">
            "${mensagem.length > 200 ? mensagem.slice(0, 200) + '…' : mensagem}"
          </div>`,
        linhas: [],
        btnUrl:  lista.some(d => d.isAdmin) ? `${FRONTEND_URL}/admin` : `${FRONTEND_URL}/reservas`,
        btnTexto: 'Visualizar',
      }),
    });
    console.log(`[Email] Mensagem do chat notificada — reserva #${reservaId}`);
  } catch (err) {
    console.error('[Email] notificarNovaMensagemChat:', err.message);
  }
}

// ── 4. Lembrete de devolução (cron diário) ────────────────────────────────────
export async function enviarLembretesDevoucao() {
  try {
    const result = await pool.query(`
      SELECT r.id, r.data_fim, r.local_uso,
             u.nome AS usuario_nome, u.email AS usuario_email,
             e.nome AS equipamento_nome
      FROM reservas r
      JOIN usuarios  u ON u.id = r.usuario_id
      JOIN equipamentos e ON e.id = r.equipamento_id
      WHERE r.status = 'aprovada'
        AND r.data_fim BETWEEN NOW() AND NOW() + INTERVAL '25 hours'
    `);

    for (const r of result.rows) {
      if (!r.usuario_email) continue;
      await enviar({
        to: [r.usuario_email],
        subject: `⏰ Lembrete: devolução de "${r.equipamento_nome}" se aproxima`,
        html: wrapEmail({
          titulo:        '⏰ Lembrete de Devolução',
          subtitulo:     `Olá, ${r.usuario_nome}`,
          badgeTexto:    'ATENÇÃO',
          badgeCor:      '#FCD34D',
          mensagemExtra: `O prazo de devolução do equipamento abaixo está se aproximando. Por favor, devolva-o até a data e hora indicadas.`,
          linhas: [
            ['Equipamento',   r.equipamento_nome],
            ['Devolver até',  fmt(r.data_fim)],
            ['Local de uso',  r.local_uso || '—'],
            ['ID da reserva', `#${r.id}`],
          ],
          btnUrl:  `${FRONTEND_URL}/reservas`,
          btnTexto: 'Ver Minhas Reservas',
        }),
      });
      console.log(`[Email] Lembrete enviado para ${r.usuario_email} — reserva #${r.id}`);
    }
  } catch (err) {
    console.error('[Email] enviarLembretesDevoucao:', err.message);
  }
}

// ── 5. Reset de senha ─────────────────────────────────────────────────────────
export async function enviarEmailResetSenha({ nome, email, resetUrl }) {
  if (!email) return;
  try {
    await enviar({
      to: [email],
      subject: '🔑 Redefinição de senha — Booking System',
      html: wrapEmail({
        titulo:        '🔑 Redefinir Senha',
        subtitulo:     `Olá, ${nome}`,
        mensagemExtra: `Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. O link expira em <strong style="color:#F1F5F9">1 hora</strong>.<br><br>Se você não solicitou isso, ignore este e-mail.`,
        linhas: [],
        btnUrl:   resetUrl,
        btnTexto: 'Redefinir Senha',
      }),
    });
    console.log(`[Email] Reset de senha enviado para ${email}`);
  } catch (err) {
    console.error('[Email] enviarEmailResetSenha:', err.message);
  }
}

// ── 6. Alertas de atraso → admins (cron diário) ───────────────────────────────
export async function enviarAlertasAtraso() {
  try {
    const result = await pool.query(`
      SELECT r.id, r.data_fim, r.local_uso,
             u.nome AS usuario_nome, u.email AS usuario_email,
             e.nome AS equipamento_nome
      FROM reservas r
      JOIN usuarios  u ON u.id = r.usuario_id
      JOIN equipamentos e ON e.id = r.equipamento_id
      WHERE r.status = 'aprovada'
        AND r.data_fim < NOW()
      ORDER BY r.data_fim ASC
    `);

    if (result.rows.length === 0) return;

    const admins = await emailsDosAdmins();
    if (admins.length === 0) return;

    const linhas = result.rows.flatMap(r => [
      ['Equipamento',    r.equipamento_nome],
      ['Usuário',        `${r.usuario_nome} &lt;${r.usuario_email}&gt;`],
      ['Prazo vencido',  fmt(r.data_fim)],
      ['ID da reserva',  `#${r.id}`],
    ]);

    await enviar({
      to: admins,
      subject: `🚨 ${result.rows.length} reserva(s) em atraso`,
      html: wrapEmail({
        titulo:        '🚨 Reservas em Atraso',
        badgeTexto:    `${result.rows.length} ATRASO(S)`,
        badgeCor:      '#F87171',
        mensagemExtra: `As reservas abaixo estão com prazo de devolução vencido. Por favor, entre em contato com os usuários.`,
        linhas,
        btnUrl:  `${FRONTEND_URL}/admin`,
        btnTexto: 'Abrir Painel Admin',
      }),
    });
    console.log(`[Email] Alerta de atraso enviado — ${result.rows.length} reserva(s)`);
  } catch (err) {
    console.error('[Email] enviarAlertasAtraso:', err.message);
  }
}
