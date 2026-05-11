import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition.jsx';

const PDF_URL = '/como-abrir-chamado.pdf';

export default function Suporte() {
  const [pdfError, setPdfError] = useState(false);

  return (
    <PageTransition>
      <div className="page-layout">
        <Sidebar />
        <main className="main-content">

          {/* Header */}
          <motion.div
            className="page-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <h2>Suporte</h2>
              <p>Central de ajuda — saiba como abrir um chamado e obter atendimento</p>
            </div>
            <motion.a
              href={PDF_URL}
              download="Como abrir um chamado por e-mail.pdf"
              className="btn btn-primary"
              whileHover={{ scale: 1.03, boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}
              whileTap={{ scale: 0.97 }}
              style={{ gap: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Baixar PDF
            </motion.a>
          </motion.div>

          {/* Card com o PDF */}
          <motion.div
            className="card"
            style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            {/* Barra superior do card */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" fill="none" stroke="var(--brand-green)" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                  Como abrir um chamado por e-mail
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  Guia passo a passo para solicitar suporte à equipe de TI
                </div>
              </div>
            </div>

            {/* Viewer do PDF */}
            {pdfError ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '60px 20px', gap: 16, color: 'var(--text-muted)',
              }}>
                <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ opacity: 0.4 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p style={{ fontSize: 14, textAlign: 'center' }}>
                  Seu navegador não conseguiu exibir o PDF inline.<br />
                  Use o botão abaixo para baixar e abrir no seu leitor de PDF.
                </p>
                <motion.a
                  href={PDF_URL}
                  download="Como abrir um chamado por e-mail.pdf"
                  className="btn btn-primary"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Baixar PDF
                </motion.a>
              </div>
            ) : (
              <iframe
                src={PDF_URL}
                title="Como abrir um chamado por e-mail"
                onError={() => setPdfError(true)}
                style={{
                  width: '100%',
                  height: 'calc(100vh - 220px)',
                  minHeight: 500,
                  border: 'none',
                  display: 'block',
                }}
              />
            )}
          </motion.div>

        </main>
      </div>
    </PageTransition>
  );
}
