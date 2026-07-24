'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { InvoicePreview, InvoicePreviewData } from '@/components/projects/InvoicePreview';

// ── Floating live preview modal ──────────────────────────────────────────────
// Sits to the LEFT of the invoice editor side panel. Smaller than the full
// preview modal — a floating card with the A4 invoice inside. Updates live as
// the form state changes.

export interface FloatingPreviewModalProps {
  data: InvoicePreviewData;
  onClose: () => void;
}

export function FloatingPreviewModal({ data, onClose }: FloatingPreviewModalProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const visibleRef = useRef<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => setVisible(true));
      visibleRef.current = r2;
    });
    return () => {
      cancelAnimationFrame(r1);
      if (visibleRef.current) cancelAnimationFrame(visibleRef.current);
    };
  }, [mounted]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed z-30 transition-all duration-280 print:hidden ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      style={{
        top: '50%',
        left: '50%',
        transform: visible ? 'translate(-50%, -50%)' : 'translate(-50%, -50%) scale(0.95)',
      }}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
        style={{ width: 'min(42vw, 560px)', height: 'min(82vh, 760px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Live Preview</p>
            <p className="text-[11px] text-muted-foreground truncate">{data.number || 'Invoice'} · {data.clientName || '—'}</p>
          </div>
          <button onClick={() => window.print()} className="btn-primary text-xs px-3 py-1.5">
            <Printer size={13} />
            Export
          </button>
        </div>

        {/* Preview area */}
        <div className="flex-1 min-h-0 overflow-y-auto modal-scroll bg-muted/20 print:overflow-visible">
          <InvoicePreview data={data} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
