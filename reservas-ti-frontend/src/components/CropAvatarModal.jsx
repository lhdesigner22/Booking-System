import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';

async function cropImageToBase64(imageSrc, croppedAreaPixels) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const size = Math.min(croppedAreaPixels.width, croppedAreaPixels.height);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    size,
    size,
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

export default function CropAvatarModal({ imageSrc, onConfirm, onCancel }) {
  const [crop, setCrop]                   = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                   = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving]               = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const base64 = await cropImageToBase64(imageSrc, croppedAreaPixels);
      onConfirm(base64);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'var(--card-bg)',
            borderRadius: 16,
            border: '1px solid var(--border)',
            width: '100%',
            maxWidth: 420,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                Ajustar foto
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Arraste para reposicionar · Scroll ou slider para zoom
              </div>
            </div>
            <button
              onClick={onCancel}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: 'none',
                background: 'var(--surface-2)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', fontSize: 14,
              }}
            >✕</button>
          </div>

          {/* Crop area */}
          <div style={{ position: 'relative', width: '100%', height: 320, background: '#111' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { borderRadius: 0 },
                cropAreaStyle: {
                  border: '3px solid #22C55E',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                },
              }}
            />
          </div>

          {/* Zoom slider */}
          <div style={{ padding: '14px 20px 4px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="14" height="14" fill="none" stroke="var(--text-muted)" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
            </svg>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#22C55E', cursor: 'pointer' }}
            />
            <svg width="14" height="14" fill="none" stroke="var(--text-muted)" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
            </svg>
          </div>

          {/* Actions */}
          <div style={{
            padding: '12px 20px 20px',
            display: 'flex', gap: 10, justifyContent: 'flex-end',
          }}>
            <button
              onClick={onCancel}
              style={{
                padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'none', color: 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
              }}
            >
              Cancelar
            </button>
            <motion.button
              onClick={handleConfirm}
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                color: '#fff', cursor: 'pointer', fontSize: 13,
                fontWeight: 600, fontFamily: 'inherit',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Aplicando...' : 'Usar esta foto'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
