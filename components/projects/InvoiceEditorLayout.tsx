'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { InvoicePreview, InvoicePreviewData } from '@/components/projects/InvoicePreview';

// ── Split-screen invoice editor layout ───────────────────────────────────────
// Renders a full-viewport overlay with the editor form on the left and a live
// A4 invoice preview on the right. The preview updates instantly as the form
// state changes — the form keeps its own state and passes a live `previewData`
// prop each render; no second data model is introduced.
//
// On screens < 1024px the two panes stack vertically (form above, preview below)
// so the editor stays usable on tablets and small laptops.

export interface InvoiceEditorLayoutProps {
  /** Title shown in the form panel header. */
  title?: string;
  /** Subtitle shown under the title. */
  subtitle?: string;
  /** Live invoice data derived from the form's current state. */
  previewData: InvoicePreviewData;
  /** The existing form content (inputs, controls). */
  children: React.ReactNode;
  /** Footer actions (Save / Cancel), same as SidePanel. */
  footer?: React.ReactNode;
  onClose: () => void;
}

export function InvoiceEditorLayout({
  title,
  subtitle,
  previewData,
  children,
  footer,
  onClose,
}: InvoiceEditorLayoutProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const visibleRef = useRef<number | null>(null);
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
    <>
      {/* Frosted glass overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-280 ${visible ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'rgba(220,218,212,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
        onClick={handleClose}
      />

      {/* Full-screen editor */}
      <div
        className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-card transition-opacity duration-280 print:static print:bg-white"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Form pane (left) ── */}
        <div className="flex flex-col w-full lg:w-[46%] lg:max-w-[640px] border-r border-border flex-shrink-0 print:hidden">
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-4 pb-3 border-b border-border flex-shrink-0">
            <div className="min-w-0 pt-1">
              {title && <h2 className="font-semibold text-base">{title}</h2>}
              {subtitle && <p className={`text-xs text-muted-foreground ${title ? 'mt-0.5' : 'mt-0'}`}>{subtitle}</p>}
            </div>
            <button onClick={handleClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors -mt-0.5">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="flex-1 min-h-0 modal-scroll">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card flex-shrink-0">
              {footer}
            </div>
          )}
        </div>

        {/* ── Live preview pane (right) ── */}
        <div className="flex-1 min-h-0 h-[40vh] lg:h-auto print:h-auto">
          <InvoicePreview data={previewData} />
        </div>
      </div>
    </>,
    document.body,
  );
}
