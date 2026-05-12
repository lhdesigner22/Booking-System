import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition.jsx';

const PDF_URL = '/como-abrir-chamado.pdf';

export default function Suporte() {
  return (
    <PageTransition>
      <div className="page-layout">
        <Sidebar />
        <main className="main-content">

          {/* Header */}
          <motion.div
            className="page-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <h2>Suporte</h2>
              <p>Central de ajuda — saiba como abrir um chamado e obter atendimento</p>
            </div>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Card: Como abrir um chamado */}
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" fill="none" stroke="var(--brand-green)" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
                    Como abrir um chamado por e-mail
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    Guia passo a passo para solicitar suporte à equipe de TI
                  </div>
                </div>
                <motion.a
                  href={PDF_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  whileHover={{ scale: 1.03, boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  style={{ gap: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="9" y1="9" x2="15" y2="9"/>
                    <line x1="9" y1="13" x2="15" y2="13"/>
                    <line x1="9" y1="17" x2="12" y2="17"/>
                  </svg>
                  Abrir PDF
                </motion.a>
              </div>
            </motion.div>

            {/* Título da seção de contato */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 2 }}
            >
              Canais de Atendimento
            </motion.div>

            {/* Cards de contato */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>

              {/* E-mail */}
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="18" height="18" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>E-mail para Contato</div>
                    <a
                      href="mailto:meajuda@fecaf.com.br"
                      style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none' }}
                      onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.target.style.textDecoration = 'none'}
                    >
                      meajuda@fecaf.com.br
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Telefone / WhatsApp */}
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {/* WhatsApp icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--brand-green)">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>Telefone para Contato</div>
                    <a
                      href="https://wa.me/5511967239015"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none' }}
                      onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.target.style.textDecoration = 'none'}
                    >
                      (11) 96723-9015
                    </a>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Somente WhatsApp</div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>

        </main>
      </div>
    </PageTransition>
  );
}
