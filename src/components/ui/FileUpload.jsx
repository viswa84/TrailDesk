/**
 * FileUpload — reusable file upload component with:
 *  • Drag & drop support
 *  • Real upload progress bar (XHR-based)
 *  • Compact card (Eye / Download / Replace / Delete) when file exists
 *  • Preview modal for images and PDFs
 *
 * Usage:
 *   <FileUpload folder="logos"      accept="image" label="Company Logo"   value={form.logoUrl}      onChange={(url) => ...} />
 *   <FileUpload folder="departures" accept="pdf"   label="Itinerary PDF"  value={form.itineraryUrl} onChange={(url) => ...} />
 *   <FileUpload folder="documents"  accept="any"   label="Attachment"     value={form.attachUrl}    onChange={(url) => ...} />
 */

import { useRef, useState, useCallback } from 'react';
import {
  Upload, X, Loader2, FileText, FileSpreadsheet, File,
  Eye, Download, Trash2, RefreshCw, Image as ImageIcon,
} from 'lucide-react';
import { uploadFile, deleteFile } from '../../utils/fileUpload';
import FilePreviewModal from './FilePreviewModal';

// ── MIME configs ──────────────────────────────────────────────────────────────
const ACCEPT_CONFIG = {
  image: { mime: 'image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/gif', label: 'JPG, PNG, WebP, SVG, GIF', maxMB: 5 },
  pdf:   { mime: 'application/pdf', label: 'PDF only', maxMB: 20 },
  excel: { mime: 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'XLS, XLSX', maxMB: 20 },
  word:  { mime: 'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOC, DOCX', maxMB: 20 },
  csv:   { mime: 'text/csv', label: 'CSV', maxMB: 10 },
  any:   { mime: 'image/*,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv', label: 'Images, PDF, XLS, DOC, CSV', maxMB: 20 },
};

// ── File type detection ───────────────────────────────────────────────────────
function detectType(url = '') {
  const u = url.toLowerCase().split('?')[0];
  if (/\.(jpg|jpeg|png|webp|svg|gif)$/.test(u)) return 'image';
  if (u.endsWith('.pdf'))                         return 'pdf';
  if (/\.(xls|xlsx)$/.test(u))                   return 'excel';
  if (/\.(doc|docx)$/.test(u))                   return 'word';
  if (u.endsWith('.csv'))                         return 'csv';
  return 'file';
}

function getFilename(url = '') {
  try { return decodeURIComponent(url.split('/').pop().split('?')[0]); } catch { return 'file'; }
}

const TYPE_META = {
  image: { icon: ImageIcon,       color: 'text-blue-400',  bg: 'bg-blue-50',   label: 'Image'      },
  pdf:   { icon: FileText,        color: 'text-red-500',   bg: 'bg-red-50',    label: 'PDF'        },
  excel: { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-50',  label: 'Spreadsheet'},
  word:  { icon: FileText,        color: 'text-blue-600',  bg: 'bg-blue-50',   label: 'Document'   },
  csv:   { icon: FileText,        color: 'text-slate-500', bg: 'bg-slate-50',  label: 'CSV'        },
  file:  { icon: File,            color: 'text-slate-400', bg: 'bg-slate-100', label: 'File'       },
};

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ percent }) {
  return (
    <div className="w-full mt-2 space-y-0.5">
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-150"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-[10px] text-primary-600 font-medium text-right">{percent}%</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FileUpload({
  folder    = 'documents',
  accept    = 'any',
  label     = 'Upload File',
  value     = '',
  onChange,
  onDelete,
  disabled  = false,
  className = '',
}) {
  const inputRef          = useRef(null);
  const [progress, setProgress] = useState(null);   // null = idle, 0-100 = uploading
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState('');
  const [preview,  setPreview]  = useState(false);
  const [dragging, setDragging] = useState(false);

  const config   = ACCEPT_CONFIG[accept] || ACCEPT_CONFIG.any;
  const fileType = detectType(value);
  const meta     = TYPE_META[fileType] || TYPE_META.file;
  const Icon     = meta.icon;
  const filename = getFilename(value);
  const busy     = progress !== null || deleting || disabled;

  // ── Core upload logic ─────────────────────────────────────────────────────
  const doUpload = useCallback(async (file) => {
    if (!file) return;
    // Client-side size check
    if (file.size > config.maxMB * 1024 * 1024) {
      setError(`File too large. Max ${config.maxMB} MB.`);
      return;
    }
    setError('');
    setProgress(0);
    try {
      const result = await uploadFile(
        file,
        { folder, oldUrl: value },
        (pct) => setProgress(pct),
      );
      onChange?.(result.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
    }
  }, [folder, value, onChange, config.maxMB]);

  // ── Input change ──────────────────────────────────────────────────────────
  function handleInputChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    doUpload(file);
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────
  function handleDragOver(e) {
    e.preventDefault();
    if (!busy) setDragging(true);
  }
  function handleDragLeave(e) {
    e.preventDefault();
    setDragging(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    const file = e.dataTransfer.files?.[0];
    doUpload(file);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!value) return;
    setDeleting(true);
    setError('');
    try {
      await deleteFile(value);
      onChange?.('');
      onDelete?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ── Empty state (upload zone) ─────────────────────────────────────────────
  const renderEmpty = () => (
    <div
      onClick={() => !busy && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center w-full h-36 rounded-xl
        border-2 border-dashed transition-all duration-200 overflow-hidden select-none
        ${busy
          ? 'border-primary-300 bg-primary-50/40 cursor-not-allowed'
          : dragging
            ? 'border-primary-400 bg-primary-50 scale-[1.01] cursor-copy'
            : 'border-slate-200 bg-slate-50 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30'
        }
      `}
    >
      {progress !== null ? (
        /* ── uploading state ── */
        <div className="flex flex-col items-center gap-1 w-full px-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <p className="text-xs font-medium text-primary-600">Uploading…</p>
          <ProgressBar percent={progress} />
        </div>
      ) : (
        /* ── idle / drag state ── */
        <div className={`flex flex-col items-center gap-2 transition-colors ${dragging ? 'text-primary-600' : 'text-slate-400'}`}>
          <Upload className={`w-7 h-7 transition-transform duration-200 ${dragging ? 'scale-125' : ''}`} />
          <p className="text-xs font-semibold">
            {dragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
          </p>
          <p className="text-[10px] text-slate-400">{config.label} · max {config.maxMB} MB</p>
        </div>
      )}
    </div>
  );

  // ── File-exists card ──────────────────────────────────────────────────────
  const renderCard = () => (
    <div className="flex items-start gap-3 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">

      {/* Thumbnail / icon — click to preview */}
      <div
        className={`shrink-0 w-14 h-14 rounded-lg ${meta.bg} flex items-center justify-center overflow-hidden cursor-pointer`}
        onClick={() => setPreview(true)}
        title="Click to preview"
      >
        {fileType === 'image' ? (
          <img
            src={value}
            alt={filename}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement.querySelector('svg')?.classList.remove('hidden');
            }}
          />
        ) : null}
        <Icon className={`w-7 h-7 ${meta.color} ${fileType === 'image' ? 'hidden' : ''}`} />
      </div>

      {/* Info + progress */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700 truncate leading-tight">{label}</p>
        <p className="text-[11px] text-slate-400 truncate mt-0.5" title={filename}>{filename}</p>
        <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
          {meta.label}
        </span>
        {/* Progress bar shown during replacement upload */}
        {progress !== null && <ProgressBar percent={progress} />}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button type="button" title="Preview" onClick={() => setPreview(true)} disabled={busy}
          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-40">
          <Eye className="w-4 h-4" />
        </button>

        <a href={value} download target="_blank" rel="noopener noreferrer" title="Download"
          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          onClick={(e) => e.stopPropagation()}>
          <Download className="w-4 h-4" />
        </a>

        <button type="button" title="Replace file" onClick={() => inputRef.current?.click()} disabled={busy}
          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40">
          {progress !== null
            ? <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
            : <RefreshCw className="w-4 h-4" />}
        </button>

        <button type="button" title="Delete file" onClick={handleDelete} disabled={busy}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
          {deleting
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>

      {value ? renderCard() : renderEmpty()}

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <X className="w-3 h-3 shrink-0" /> {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={config.mime}
        className="hidden"
        onChange={handleInputChange}
        disabled={busy}
      />

      {preview && (
        <FilePreviewModal url={value} onClose={() => setPreview(false)} />
      )}
    </div>
  );
}
