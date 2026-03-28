/**
 * File upload/delete API utility for the frontend.
 *
 * uploadFile(file, options, onProgress)
 *   Uses XHR so we can report real upload progress (0-100%).
 *
 * deleteFile(url)
 *   Deletes a file from R2 by its public URL.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function getToken() {
  return localStorage.getItem('trekops_token') || '';
}

/**
 * Upload a file to R2 via the generic /api/upload endpoint.
 * Uses XHR to track real upload progress.
 *
 * @param {File}     file
 * @param {object}   options
 * @param {string}   options.folder   - R2 subfolder: 'logos' | 'signatures' | 'departures' | ...
 * @param {string}   [options.oldUrl] - Previous file URL to auto-delete on server
 * @param {function} [onProgress]     - (percent: number 0-100) => void
 * @returns {Promise<{ url, filename, size, mimeType, folder }>}
 */
export function uploadFile(file, { folder = 'documents', oldUrl = '' } = {}, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', file);
    if (oldUrl) fd.append('oldUrl', oldUrl);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/upload?folder=${encodeURIComponent(folder)}`);
    xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);

    // Real upload progress
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(json);
        } else {
          reject(new Error(json.error || 'Upload failed'));
        }
      } catch {
        reject(new Error('Invalid server response'));
      }
    };

    xhr.onerror   = () => reject(new Error('Network error — upload failed'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));

    xhr.send(fd);
  });
}

/**
 * Delete a file from R2 by its full public URL.
 *
 * @param {string} url
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
