/**
 * FilePreviewModal — universal file preview modal
 * Supports: images (inline), PDF (iframe), XLS/Word/CSV (download-only)
 */

import { X, Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { useEffect } from 'react';

function getFileType(url = '') {
  const u = url.toLowerCase().split('?')[0];
  if (/\.(jpg|jpeg|png|webp|svg|gif)$/.test(u)) return 'image';
  if (u.endsWith('.pdf'))                           return 'pdf';
  if (/\.(xls|xlsx)$/.test(u))                   return 'excel';
  if (/\.(doc|docx)$/.test(u))                   return 'word';
  if (u.endsWith('.csv'))                         return 'csv';
  return 'file';
}

function getFilename(url = '') {
  try { return decodeURIComponent(url.split('/').pop().split('?')[0]); } catch { return 'file'; }
}

function NonPreviewable({ url, type }) {
  const icons = {
    excel: <FileSpreadsheet className="w-16 h-16 text-green-500" />,
    word:  <FileText className="w-16 h-16 text-blue-500" />,
    csv:   <FileText className="w-16 h-16 text-slate-400" />,
    file:  <File className="w-16 h-16 text-slate-400" />,
  };
  const labels = { excel: 'Excel Spreadsheet', word: 'Word Document', csv: 'CSV File', file: 'File' };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-8">
      {icons[type] || icons.file}
      <p className="text-sm text-slate-500 text-center">{labels[type] || 'File'}</p>
      <p className="text-xs text-slate-400 italic text-center">In-browser preview not available for this file type.</p>
      <a
        href={url}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        <Download className="w-4 h-4" /> Download to view
      </a>
    </div>
  );
}

export default function FilePreviewModal({ url, onClose }) {
  if (!url) return null;

  const type     = getFileType(url);
  const filename = getFilename(url);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
          <p className="text-sm font-semibold text-slate-700 truncate max-w-xs">{filename}</p>
          <div className="flex items-center gap-2">
            <a
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-primary-600 border border-slate-200 rounded-lg hover:border-primary-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {type === 'image' && (
            <div className="flex items-center justify-center w-full h-full p-4 min-h-[300px]">
              <img
                src={url}
                alt={filename}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow"
              />
            </div>
          )}

          {type === 'pdf' && (
            <iframe
              src={url}
              title={filename}
              className="w-full h-full min-h-[70vh]"
              style={{ border: 'none' }}
            />
          )}

          {!['image', 'pdf'].includes(type) && (
            <NonPreviewable url={url} type={type} />
          )}
        </div>
      </div>
    </div>
  );
}
