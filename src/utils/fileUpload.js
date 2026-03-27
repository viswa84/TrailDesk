/**
 * useFileUpload — reusable hook for R2 file uploads & deletes
 *
 * Usage:
 *   const { upload, remove, uploading } = useFileUpload();
 *
 *   // Upload a file
 *   const url = await upload(file, { folder: 'logos', oldUrl: currentUrl });
 *
 *   // Delete a file
 *   await remove(url);
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function getToken() {
  return localStorage.getItem('trekops_token') || '';
}

/**
 * Upload a file to R2 via the generic /api/upload endpoint.
 *
 * @param {File}   file
 * @param {object} options
 * @param {string} options.folder  - R2 subfolder: 'logos'|'signatures'|'departures'|'documents'|...
 * @param {string} [options.oldUrl] - Previous file URL to delete (optional)
 * @returns {Promise<{ url, filename, size, mimeType }>}
 */
export async function uploadFile(file, { folder = 'documents', oldUrl = '' } = {}) {
  const fd = new FormData();
  fd.append('file', file);
  if (oldUrl) fd.append('oldUrl', oldUrl);

  const res = await fetch(`${API_BASE}/api/upload?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Upload failed');
  return json; // { url, filename, size, mimeType, folder }
}

/**
 * Delete a file from R2.
 *
 * @param {string} url - The full R2 public URL to delete
 */
export async function deleteFile(url) {
  if (!url) return;
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Delete failed');
  }
}
