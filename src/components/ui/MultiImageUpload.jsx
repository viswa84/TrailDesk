/**
 * MultiImageUpload — manage an unbounded list of images for a record.
 *  • Upload multiple images at once (click or drag & drop)
 *  • Remove / delete any image individually
 *  • Reorder via "Make cover" — the first image is the cover/hero
 *
 * Usage:
 *   <MultiImageUpload
 *     folder="treks"
 *     label="Trek Images"
 *     value={formData.images}
 *     onChange={(imgs) => setFormData({ ...formData, images: imgs })}
 *   />
 */

import { useRef, useState } from 'react';
import { Upload, X, Loader2, Star } from 'lucide-react';
import { uploadFile, deleteFile } from '../../utils/fileUpload';

const MAX_MB = 5;
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/gif';

export default function MultiImageUpload({
  folder = 'treks',
  label = 'Images',
  value = [],
  onChange,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(0);   // count of in-flight uploads
  const [removing, setRemoving] = useState(null);  // url currently being removed
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const images = Array.isArray(value) ? value : [];
  const busy = uploading > 0 || disabled;

  // ── Upload one or more files, appending their URLs to the list ────────────
  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setError('');

    const tooBig = files.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (tooBig) { setError(`Each image must be under ${MAX_MB} MB.`); return; }

    setUploading((n) => n + files.length);
    const uploaded = [];
    for (const file of files) {
      try {
        const result = await uploadFile(file, { folder }, () => {});
        uploaded.push(result.url);
      } catch (err) {
        setError(err.message || 'Upload failed');
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (uploaded.length) onChange?.([...images, ...uploaded]);
  }

  function handleInputChange(e) {
    const files = e.target.files;
    e.target.value = '';
    handleFiles(files);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (!busy) handleFiles(e.dataTransfer.files);
  }

  // ── Remove an image — delete from R2, then drop it from the list ──────────
  async function handleRemove(url) {
    setRemoving(url);
    setError('');
    try {
      await deleteFile(url);
    } catch {
      /* even if the R2 delete fails, still remove it from the trek */
    }
    onChange?.(images.filter((u) => u !== url));
    setRemoving(null);
  }

  // ── Promote an image to first position (cover/hero) ───────────────────────
  function makeCover(url) {
    onChange?.([url, ...images.filter((u) => u !== url)]);
  }

  return (
    <div className="space-y-1.5 sm:col-span-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {images.length > 0 && (
          <span className="ml-1.5 text-xs font-normal text-slate-400">({images.length})</span>
        )}
      </label>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {/* Existing images */}
        {images.map((url, idx) => (
          <div
            key={url}
            className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
          >
            <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />

            {/* Cover badge on the first image */}
            {idx === 0 && (
              <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-primary-600 text-white shadow-sm">
                <Star className="w-2.5 h-2.5 fill-current" /> Cover
              </span>
            )}

            {/* Hover actions */}
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 group-hover:bg-black/40 transition-colors">
              {idx !== 0 && (
                <button
                  type="button"
                  title="Make cover image"
                  onClick={() => makeCover(url)}
                  disabled={busy || removing === url}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white/90 text-slate-700 hover:bg-white transition shadow-sm disabled:opacity-40"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                title="Remove image"
                onClick={() => handleRemove(url)}
                disabled={busy || removing === url}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white/90 text-red-600 hover:bg-white transition shadow-sm disabled:opacity-40"
              >
                {removing === url
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <X className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}

        {/* Add tile */}
        <div
          onClick={() => !busy && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
          onDrop={handleDrop}
          className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-center select-none transition-all
            ${busy
              ? 'border-primary-300 bg-primary-50/40 cursor-not-allowed'
              : dragging
                ? 'border-primary-400 bg-primary-50 cursor-copy'
                : 'border-slate-200 bg-slate-50 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30'}`}
        >
          {uploading > 0 ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
              <p className="text-[10px] font-medium text-primary-600">Uploading {uploading}…</p>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-slate-400" />
              <p className="text-[10px] font-semibold text-slate-500">Add images</p>
            </>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Upload as many images as you like. The first image is the cover — hover an image to make it the cover or remove it.
      </p>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <X className="w-3 h-3 shrink-0" /> {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={handleInputChange}
        disabled={busy}
      />
    </div>
  );
}
