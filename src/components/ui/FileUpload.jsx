/**
 * FileUpload — reusable file upload component for the entire app.
 *
 * Usage examples:
 *
 * // Image upload (logo)
 * <FileUpload
 *   folder="logos"
 *   accept="image"
 *   label="Company Logo"
 *   value={form.logoUrl}
 *   onChange={(url) => setForm(f => ({ ...f, logoUrl: url }))}
 * />
 *
 * // PDF upload (departure document)
 * <FileUpload
 *   folder="departures"
 *   accept="pdf"
 *   label="Trek Itinerary PDF"
 *   value={form.itineraryUrl}
 *   onChange={(url) => setForm(f => ({ ...f, itineraryUrl: url }))}
 * />
 *
 * // Any file type
 * <FileUpload
 *   folder="documents"
 *   accept="any"
 *   label="Attachment"
 *   value={form.attachmentUrl}
 *   onChange={(url) => setForm(f => ({ ...f, attachmentUrl: url }))}
 * />
 */

import { useRef, useState } from 'react';
import { Upload, X, Loader2, FileText, FileSpreadsheet, File, Image, CheckCircle } from 'lucide-react';
import { uploadFile, deleteFile } from '../../utils/fileUpload';

// ── MIME type configs ─────────────────────────────────────────────────────────
const ACCEPT_CONFIG = {
  image:  { mime: 'image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/gif', label: 'JPG, PNG, WebP, SVG', maxMB: 5 },
  pdf:    { mime: 'application/pdf', label: 'PDF', maxMB: 20 },
  excel:  { mime: 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'XLS, XLSX', maxMB: 20 },
  word:   { mime: 'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOC, DOCX', maxMB: 20 },
  csv:    { mime: 'text/csv', label: 'CSV', maxMB: 10 },
  any:    { mime: 'image/*,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv', label: 'images, PDF, XLS, DOC, CSV', maxMB: 20 },
};

// Determine which icon + preview type to use for a URL or MIME
function getFileType(url = '', mimeType = '') {
  const u = url.toLowerCase();
  const m = mimeType.toLowerCase();
  if (m.startsWith('image/') || /\.(jpg|jpeg|png|webp|svg|gif)(\?|$)/.test(u)) return 'image';
  if (m === 'application/pdf'            || u.endsWith('.pdf'))  return 'pdf';
  if (m.includes('spreadsheet') || m.includes('excel') || /\.(xls|xlsx)(\?|$)/.test(u)) return 'excel';
  if (m.includes('word') || /\.(doc|docx)(\?|$)/.test(u)) return 'word';
  if (m === 'text/csv' || u.endsWith('.csv')) return 'csv';
  return 'file';
}

function FileIcon({ type, className = 'w-8 h-8' }) {
  switch (type) {
    case 'image': return <Image className={`${className} text-blue-400`} />;
    case 'pdf':   return <FileText className={`${className} text-red-400`} />;
    case 'excel': return <FileSpreadsheet className={`${className} text-green-500`} />;
    case 'word':  return <FileText className={`${className} text-blue-500`} />;
    default:      return <File className={`${className} text-slate-400`} />;
  }
}

function getFilename(url = '') {
  try { return decodeURIComponent(url.split('/').pop().split('?')[0]); } catch { return url; }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FileUpload({
  folder     = 'documents',   // R2 subfolder key
  accept     = 'any',         // 'image' | 'pdf' | 'excel' | 'word' | 'csv' | 'any'
  label      = 'Upload File', // display label
  value      = '',            // current file URL (from DB / form state)
  onChange,                   // (url: string) => void  — called after successful upload
  onDelete,                   // () => void             — called after successful delete (optional)
  disabled   = false,
  className  = '',
}) {
  const inputRef   = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [error,     setError]     = useState('');

  const config   = ACCEPT_CONFIG[accept] || ACCEPT_CONFIG.any;
  const fileType = getFileType(value);
  const isImage  = fileType === 'image';

  // ── Upload ────────────────────────────────────────────────────────────────
  async function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Client-side size check
    if (file.size > config.maxMB * 1024 * 1024) {
      setError(`File too large. Max ${config.maxMB} MB.`);
      return;
    }
    setError('');
    setUploading(true);
    try {
      const result = await uploadFile(file, { folder, oldUrl: value }); // auto-deletes old
      onChange?.(result.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = ''; // reset input so same file can be re-selected
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(e) {
    e.stopPropagation();
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

  const busy = uploading || deleting || disabled;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label */}
      <label className="block text-sm font-medium text-slate-700">{label}</label>

      {/* Upload zone */}
      <div
        onClick={() => !busy && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed
          transition-all duration-200 overflow-hidden bg-slate-50 group
          ${busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary-400 hover:bg-primary-50/30'}
          ${value ? 'border-slate-200 h-36' : 'border-slate-200 h-36'}
        `}
      >
        {/* ── Has a file ──────────────────────────────────── */}
        {value ? (
          <>
            {isImage ? (
              <img src={value} alt={label} className="max-h-full max-w-full object-contain p-2" />
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 text-center">
                <FileIcon type={fileType} className="w-10 h-10" />
                <p className="text-xs text-slate-600 font-medium truncate max-w-[180px]">
                  {getFilename(value)}
                </p>
                <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Uploaded
                </span>
              </div>
            )}

            {/* Hover overlay: change or delete */}
            {!busy && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <span className="text-white text-xs font-medium flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Replace
                </span>
              </div>
            )}
          </>
        ) : (
          /* ── Empty state ─────────────────────────────────── */
          <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-primary-500 transition-colors">
            {uploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-primary-500" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
            <p className="text-xs font-medium">
              {uploading ? 'Uploading…' : `Click to upload ${label}`}
            </p>
            <p className="text-[10px] text-slate-400">{config.label} · max {config.maxMB} MB</p>
          </div>
        )}

        {/* Loading overlay when uploading over an existing file */}
        {uploading && value && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        )}
      </div>

      {/* Delete button — shown below when file exists */}
      {value && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
        >
          {deleting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <X className="w-3.5 h-3.5" />
          }
          {deleting ? 'Removing…' : 'Remove file'}
        </button>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={config.mime}
        className="hidden"
        onChange={handleChange}
        disabled={busy}
      />
    </div>
  );
}
