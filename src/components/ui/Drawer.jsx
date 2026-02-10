import { X } from 'lucide-react';

export default function Drawer({ isOpen, onClose, title, children, width = 'w-full sm:w-[480px]' }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-overlay animate-fade-in" onClick={onClose} />
      <div className={`drawer-content ${width} animate-slide-right`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </>
  );
}
