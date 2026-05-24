import { useEffect, useState, useCallback, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Modal
 *
 *  - Closes ONLY via the × button or the Escape key. Clicking outside the
 *    modal content does NOT close it (prevents accidental data loss).
 *  - When `confirmOnClose` is true, any close attempt (× or Escape) shows
 *    an inline "Discard unsaved changes?" prompt — the parent only needs
 *    to set the flag while the form has unsaved edits.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  confirmOnClose = false,
}) {
  const [confirming, setConfirming] = useState(false);
  const discardBtnRef = useRef(null);

  // When the discard-prompt opens, move keyboard focus onto the Discard button
  // so a single Enter press confirms (and Esc still cancels the prompt).
  useEffect(() => {
    if (confirming) {
      // requestAnimationFrame ensures the button is in the DOM before focus()
      const id = requestAnimationFrame(() => discardBtnRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [confirming]);

  // Reset the inline confirm prompt whenever the modal opens or closes.
  // (The lint rule discourages set-state-in-effect, but here we genuinely need
  // to clear state in response to a parent-driven prop change.)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!isOpen) setConfirming(false); }, [isOpen]);

  // Close attempt: shows the discard-changes prompt if needed, else closes.
  const requestClose = useCallback(() => {
    if (confirmOnClose) setConfirming(true);
    else onClose?.();
  }, [confirmOnClose, onClose]);

  // Escape key — close attempt (respects confirmOnClose).
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        // If the confirm prompt is open, Escape dismisses just the prompt.
        if (confirming) setConfirming(false);
        else requestClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, confirming, requestClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    // NOTE: overlay onClick intentionally removed — modal cannot close on outside-click.
    <div className="modal-overlay animate-fade-in">
      <div
        className={`modal-content ${sizes[size]} animate-scale-in relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={requestClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-4 sm:p-6">
          {children}
        </div>

        {/* ── Discard-changes prompt (inline, sits inside this modal) ── */}
        {confirming && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/40 rounded-2xl">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-[90%] p-5">
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">Discard unsaved changes?</h3>
              <p className="text-sm text-slate-600 mb-5">
                All the changes you made will be lost. Save them first, or discard to close.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="btn-secondary"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  ref={discardBtnRef}
                  onClick={() => { setConfirming(false); onClose?.(); }}
                  className="btn-danger"
                >
                  Discard &amp; Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
