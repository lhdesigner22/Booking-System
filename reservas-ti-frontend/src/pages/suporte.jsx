import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition.jsx';

const PDF_URL = '/como-abrir-chamado.pdf';

const GUIA_RAPIDO = [
  { num: '1', title: 'Acesse Equipamentos',     desc: 'No menu lateral, clique em "Equipamentos". Você verá todos os itens disponíveis com filtros por categoria e status.' },
  { num: '2', title: 'Escolha e reserve',        desc: 'Clique em "Reservar" no equipamento desejado. Preencha as datas de início e fim, a quantidade e o local de uso.' },
  { num: '3', title: 'Aguarde aprovação',         desc: 'Sua reserva ficará com status "Pendente". A equipe de TI receberá uma notificação e aprovará ou recusará em breve.' },
  { num: '4', title: 'Acompanhe em Minhas Reservas', desc: 'Você receberá um e-mail quando o status mudar. Também pode acompanhar em tempo real na aba "Minhas Reservas".' },
  { num: '5', title: 'Use o chat da reserva',    desc: 'Clique em qualquer reserva para abrir os detalhes. Use o chat interno para tirar dúvidas diretamente com o TI.' },
  { num: '6', title: 'Devolva no prazo',          desc: 'Devolva o equipamento conforme combinado. O admin registrará a devolução no sistema para liberar o estoque.' },
];

const FAQ = [
  {
    q: 'Quanto tempo leva para minha reserva ser aprovada?',
    a: 'Geralmente entre alguns minutos e algumas horas, dependendo da disponibilidade da equipe de TI. Você receberá um e-mail assim que o status mudar.',
  },
  {
    q: 'Posso cancelar uma reserva?',
    a: 'Sim. Reservas com status "Pendente" podem ser canceladas diretamente em "Minhas Reservas". Reservas já aprovadas devem ser tratadas pelo chat ou contato direto com o TI.',
  },
  {
    q: 'O que acontece se eu não devolver o equipamento no prazo?',
    a: 'A reserva ficará marcada como "Atrasada" no painel de devoluções e o administrador será notificado. Por favor, entre em contato com o TI o quanto antes.',
  },
  {
    q: 'Posso reservar mais de um equipamento ao mesmo tempo?',
    a: 'Sim. Você pode fazer quantas reservas forem necessárias. Para equipamentos com múltiplas unidades, também é possível reservar mais de uma quantidade em uma única reserva.',
  },
  {
    q: 'Como altero minha senha?',
    a: 'Acesse "Meu Perfil" no menu lateral. Na seção de segurança, preencha a nova senha e salve. Se esqueceu a senha, use o link "Esqueci minha senha" na tela de login.',
  },
  {
    q: 'Posso usar o sistema pelo celular?',
    a: 'Sim! O sistema é responsivo e funciona em qualquer navegador mobile. Não precisa instalar nenhum aplicativo.',
  },
  {
    q: 'Por que minha reserva foi recusada?',
    a: 'Pode haver conflito de horário, indisponibilidade do equipamento ou outra razão operacional. O admin pode deixar uma mensagem no chat da reserva explicando. Entre em contato se tiver dúvidas.',
  },
  {
    q: 'Como reservar o mesmo equipamento novamente?',
    a: 'Em "Minhas Reservas", clique no botão "Duplicar" em qualquer reserva para reabrir o formulário com o mesmo equipamento pré-selecionado. Basta escolher as novas datas.',
  },
];

const GUIAS = [
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    title: 'Equipamentos',
    color: '#818CF8',
    items: [
      'Filtre por categoria (Notebook, Monitor, Headset…)',
      'Veja a disponibilidade em tempo real na barra de estoque',
      'Use o calendário para checar datas ocupadas antes de reservar',
      'Equipamentos com disponível = 0 não aceitam novas reservas',
    ],
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
    title: 'Minhas Reservas',
    color: '#22C55E',
    items: [
      'Status Pendente = aguardando análise do TI',
      'Status Aprovada = pode retirar o equipamento',
      'Status Recusada = veja o chat para entender o motivo',
      'Status Devolvida = ciclo completo encerrado',
      'Use "Duplicar" para remarcar o mesmo equipamento rapidamente',
    ],
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    title: 'Meu Perfil',
    color: '#F59E0B',
    items: [
      'Atualize nome, e-mail e setor a qualquer momento',
      'Adicione uma foto de perfil (recorte direto no navegador)',
      'Troque a senha na aba de segurança',
      'Alterne entre tema escuro e claro pelo botão na sidebar',
    ],
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Chat da Reserva',
    color: '#F87171',
    items: [
      'Clique em qualquer reserva para abrir os detalhes',
      'Use o chat para se comunicar diretamente com o TI',
      'Mensagens são atualizadas automaticamente a cada 8 segundos',
      'Admins podem ver e responder todos os chats pelo Painel Admin',
    ],
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 0', gap: 16, textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}
          style={{ color: 'var(--brand-green)', flexShrink: 0, display: 'flex' }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, paddingBottom: 18 }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Suporte() {
  const [abaGuia, setAbaGuia] = useState(0);

  return (
    <PageTransition>
      <div className="page-layout">
        <Sidebar />
        <main className="main-content">

          {/* ── Header ── */}
          <motion.div className="page-header"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div>
              <h2>Central de Ajuda</h2>
              <p>Guias, perguntas frequentes e canais de atendimento</p>
            </div>
          </motion.div>

          {/* ── Guia Rápido ── */}
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.3 }} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" fill="none" stroke="var(--brand-green)" strokeWidth="2" viewBox="0 0 24 24">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Guia Rápido</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Como fazer sua primeira reserva</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {GUIA_RAPIDO.map((s, i) => (
                <motion.div key={s.num}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.25 }}
                  style={{ display: 'flex', gap: 12, padding: '14px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: 'var(--brand-green)', fontFamily: 'DM Mono, monospace' }}>
                    {s.num}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Guias por seção ── */}
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" fill="none" stroke="#818CF8" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Documentação por Seção</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Guias detalhados de cada parte do sistema</div>
              </div>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
              {GUIAS.map((g, i) => (
                <button key={g.title} onClick={() => setAbaGuia(i)}
                  style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all .15s', background: abaGuia === i ? `${g.color}18` : 'var(--surface-2)', color: abaGuia === i ? g.color : 'var(--text-muted)', outline: abaGuia === i ? `1px solid ${g.color}35` : '1px solid var(--border)' }}>
                  {g.title}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={abaGuia} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${GUIAS[abaGuia].color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GUIAS[abaGuia].color }}>
                    {GUIAS[abaGuia].icon}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{GUIAS[abaGuia].title}</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {GUIAS[abaGuia].items.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <svg width="14" height="14" fill="none" stroke={GUIAS[abaGuia].color} strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginTop: 2, flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* ── FAQ ── */}
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" fill="none" stroke="#F59E0B" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Perguntas Frequentes</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Respostas para as dúvidas mais comuns</div>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              {FAQ.map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </motion.div>

          {/* ── Como abrir chamado + Contatos ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>

            {/* PDF */}
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" stroke="var(--brand-green)" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Como abrir um chamado por e-mail</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Guia passo a passo em PDF</div>
                </div>
              </div>
              <motion.a href={PDF_URL} target="_blank" rel="noopener noreferrer"
                className="btn btn-primary"
                whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }} whileTap={{ scale: 0.97 }}
                style={{ gap: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Abrir PDF
              </motion.a>
            </motion.div>

            {/* E-mail FECAF */}
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>E-mail para Contato</div>
                  <a href="mailto:meajuda@fecaf.com.br"
                    style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                    meajuda@fecaf.com.br
                  </a>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Suporte FECAF</div>
                </div>
              </div>
            </motion.div>

            {/* WhatsApp */}
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.3 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--brand-green)">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>Telefone para Contato</div>
                  <a href="https://wa.me/5511967239015" target="_blank" rel="noopener noreferrer"
                    style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                    (11) 96723-9015
                  </a>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Somente WhatsApp</div>
                </div>
              </div>
            </motion.div>

          </div>

        </main>
      </div>
    </PageTransition>
  );
}
