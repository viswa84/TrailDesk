import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  Contact, Download, RefreshCcw, Loader2, Users, AlertTriangle, Ban,
  Cloud, CheckCircle2, Link2, Unlink, Info, Settings, MessageCircle,
} from 'lucide-react';

// API base — same convention as BroadcastPage / sibling pages.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/').replace(/\/$/, '');
const getToken = () => localStorage.getItem('trekops_token') || '';

// Single source of truth for the contacts API mount point.
// If the backend ends up mounted at '/api/contacts-export', change this one line.
const API_PREFIX = '/api/contacts';

// JSON fetch helper (Bearer auth).
async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const emptyFilters = {
  trek: '',
  city: '',
  from: '',
  to: '',
  includeOptedOut: false,
};

// Build the query string shared by BOTH the list fetch and the export downloads,
// so the export always matches exactly what's on screen.
function buildQuery(filters) {
  const params = new URLSearchParams();
  if (filters.trek) params.set('trek', filters.trek);
  if (filters.city) params.set('city', filters.city);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  params.set('includeOptedOut', filters.includeOptedOut ? 'true' : 'false');
  return params.toString();
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Pull the filename out of a Content-Disposition header, if present.
function filenameFromDisposition(header, fallback) {
  if (!header) return fallback;
  // Handles: attachment; filename="contacts.csv"  and  filename*=UTF-8''contacts.csv
  const star = /filename\*=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(header);
  if (star && star[1]) return decodeURIComponent(star[1]);
  const plain = /filename=["']?([^"';]+)["']?/i.exec(header);
  if (plain && plain[1]) return plain[1];
  return fallback;
}

export default function ContactsPage() {
  const toast = useToast();

  const [filters, setFilters] = useState(emptyFilters);
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dropdown options.
  const [treks, setTreks] = useState([]);
  const [cities, setCities] = useState([]);

  // Per-format export button loading state.
  const [downloading, setDownloading] = useState(''); // '', 'google-csv', or 'vcard'

  // ── Google Contacts sync state ─────────────────────────────────────────────
  // `configured` = app OAuth creds saved in Settings (clientId/clientSecret).
  // `connected`  = OAuth flow completed for an account → can Sync.
  const [google, setGoogle] = useState({ connected: false, configured: false, email: null });
  const [googleLoading, setGoogleLoading] = useState(true); // initial status fetch
  const [connecting, setConnecting] = useState(false);      // popup + poll in progress
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncNote, setSyncNote] = useState('');             // optional dedup note from backend

  // Refs so the connect-poll can be cleaned up reliably on unmount.
  const pollRef = useRef(null);
  const popupRef = useRef(null);
  const pollDeadlineRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ── Load Google connection status once on mount ───────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api(`${API_PREFIX}/google/status`);
        if (alive) setGoogle({
          connected: !!data.connected,
          configured: !!data.configured,
          email: data.email || null,
        });
      } catch (e) {
        // Soft-fail: treat as not-connected if the status endpoint is unavailable.
        console.error('[contacts] google status failed', e);
      } finally {
        if (alive) setGoogleLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Clean up the connect-poll interval if the component unmounts mid-flow.
  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Connect Google: open consent popup + poll status until connected ──────
  const handleConnectGoogle = async () => {
    setConnecting(true);
    try {
      const { url } = await api(`${API_PREFIX}/google/auth`);
      const popup = window.open(url, 'google-oauth', 'width=500,height=650');
      popupRef.current = popup;

      pollDeadlineRef.current = Date.now() + 2 * 60 * 1000; // ~2 min timeout
      stopPolling(); // guard against a stale interval
      pollRef.current = setInterval(async () => {
        // Stop if the user closed the popup or we passed the timeout.
        if ((popupRef.current && popupRef.current.closed) || Date.now() > pollDeadlineRef.current) {
          stopPolling();
          setConnecting(false);
          return;
        }
        try {
          const data = await api(`${API_PREFIX}/google/status`);
          if (data.connected) {
            stopPolling();
            setGoogle({ connected: true, configured: true, email: data.email || null });
            setConnecting(false);
            try { if (popupRef.current && !popupRef.current.closed) popupRef.current.close(); } catch { /* cross-origin close guard */ }
            toast.success(`Google connected${data.email ? ` as ${data.email}` : ''}`);
          }
        } catch {
          // Transient errors during polling are ignored; the timeout still applies.
        }
      }, 1500);
    } catch (e) {
      setConnecting(false);
      toast.error(`Could not start Google connect: ${e.message}`);
    }
  };

  // ── Sync now: push the CURRENT filtered set to Google ─────────────────────
  const handleSyncGoogle = async () => {
    setSyncing(true);
    setSyncNote('');
    try {
      const qs = buildQuery(filters); // same filters as the on-screen list / export
      const data = await api(`${API_PREFIX}/google/sync?${qs}`, { method: 'POST' });
      const created = data.created ?? 0;
      const failed = data.failed ?? 0;
      const totalSynced = data.total ?? (created + failed);
      toast.success(`Synced ${totalSynced} contact${totalSynced === 1 ? '' : 's'} to Google (created ${created}, failed ${failed})`);
      if (data.note) {
        setSyncNote(data.note);
        toast.info ? toast.info(data.note) : toast.success(data.note);
      }
    } catch (e) {
      toast.error(`Sync failed: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // ── Disconnect Google ─────────────────────────────────────────────────────
  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Disconnect this Google account? TrailDesk will stop being able to sync contacts until you reconnect.')) return;
    setDisconnecting(true);
    try {
      await api(`${API_PREFIX}/google/disconnect`, { method: 'DELETE' });
      // App creds stay saved in Settings, so remain "configured" (can reconnect).
      setGoogle((g) => ({ ...g, connected: false, email: null }));
      setSyncNote('');
      toast.success('Google account disconnected');
    } catch (e) {
      toast.error(`Disconnect failed: ${e.message}`);
    } finally {
      setDisconnecting(false);
    }
  };

  // ── Load dropdown options once on mount ───────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { treks: t, cities: c } = await api(`${API_PREFIX}/filters`);
        setTreks(Array.isArray(t) ? t : []);
        setCities(Array.isArray(c) ? c : []);
      } catch (e) {
        // Soft-fail: dropdowns just stay at "All" if filters endpoint is unavailable.
        console.error('[contacts] filters load failed', e);
      }
    })();
  }, []);

  // ── Load the contact list for the current filters ─────────────────────────
  const loadContacts = useCallback(async (f) => {
    setLoading(true);
    setError('');
    try {
      const qs = buildQuery(f);
      const data = await api(`${API_PREFIX}?${qs}`);
      setContacts(Array.isArray(data.contacts) ? data.contacts : []);
      setTotal(typeof data.total === 'number' ? data.total : (data.contacts?.length || 0));
    } catch (e) {
      setError(e.message);
      setContacts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial list (no filters).
  useEffect(() => { loadContacts(emptyFilters); }, [loadContacts]);

  const applyFilters = () => loadContacts(filters);

  const resetFilters = () => {
    setFilters(emptyFilters);
    loadContacts(emptyFilters);
  };

  // ── Export (CSV / vCard) — MUST send the Bearer header, so we fetch+blob ───
  // (a bare <a href> can't carry the Authorization header).
  const handleExport = async (format) => {
    setDownloading(format);
    try {
      const qs = buildQuery(filters); // identical filters to the on-screen list
      const res = await fetch(`${API_URL}${API_PREFIX}/export?format=${encodeURIComponent(format)}&${qs}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const fallback = format === 'vcard' ? 'contacts.vcf' : 'contacts.csv';
      const filename = filenameFromDisposition(res.headers.get('Content-Disposition'), fallback);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${filename}`);
    } catch (e) {
      toast.error(`Export failed: ${e.message}`);
    } finally {
      setDownloading('');
    }
  };

  const hasContacts = contacts.length > 0;

  const countLabel = useMemo(() => {
    const n = total || contacts.length;
    return `${n} contact${n === 1 ? '' : 's'}`;
  }, [total, contacts.length]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ───── Header ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle mt-1">
            View and export WhatsApp contacts for Google Contacts sync
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('google-csv')}
            disabled={downloading !== ''}
            className="btn-secondary flex items-center gap-2"
          >
            {downloading === 'google-csv'
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
            Download Google CSV
          </button>
          <button
            onClick={() => handleExport('vcard')}
            disabled={downloading !== ''}
            className="btn-primary flex items-center gap-2"
          >
            {downloading === 'vcard'
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
            Download vCard
          </button>
        </div>
      </div>

      {/* Next-step helper note */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary-50 border border-primary-100 rounded-xl">
        <Contact className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600">
          Tip: export the Google CSV, then import it at{' '}
          <a href="https://contacts.google.com" target="_blank" rel="noreferrer" className="font-semibold text-primary-700 hover:underline">
            contacts.google.com
          </a>{' '}
          → <span className="font-semibold">Import</span>. The export always matches the filters applied below.
        </p>
      </div>

      {/* ───── Google Contacts Sync ───── */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Google Contacts Sync</h2>
              {googleLoading ? (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking connection…
                </p>
              ) : google.connected ? (
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Connected{google.email ? <> as <span className="font-semibold text-slate-700">{google.email}</span></> : null}
                </p>
              ) : google.configured ? (
                <p className="text-xs text-slate-500 mt-1">
                  Push the filtered contacts below straight into a Google account.
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">
                  Set up Google API credentials in{' '}
                  <Link to="/settings" className="font-semibold text-primary-700 hover:underline">
                    Settings → Integrations
                  </Link>{' '}
                  to enable sync. You can still download CSV/vCard above.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {googleLoading ? null : !google.configured ? (
              // No app credentials yet — don't offer Connect (it would fail).
              <Link to="/settings" className="btn-secondary flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Set up in Settings
              </Link>
            ) : !google.connected ? (
              <button
                onClick={handleConnectGoogle}
                disabled={connecting}
                className="btn-primary flex items-center gap-2"
              >
                {connecting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Link2 className="w-4 h-4" />}
                {connecting ? 'Waiting for Google…' : 'Connect Google'}
              </button>
            ) : (
              <>
                <button
                  onClick={handleSyncGoogle}
                  disabled={syncing || disconnecting}
                  className="btn-primary flex items-center gap-2"
                >
                  {syncing
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <RefreshCcw className="w-4 h-4" />}
                  {syncing ? 'Syncing…' : 'Sync now'}
                </button>
                <button
                  onClick={handleDisconnectGoogle}
                  disabled={syncing || disconnecting}
                  className="btn-secondary flex items-center gap-2"
                >
                  {disconnecting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Unlink className="w-4 h-4" />}
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dedup caveat — always shown so the operator knows re-syncs duplicate. */}
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
          <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Re-syncing the same people creates duplicates in Google — sync a filtered set, or remove old ones first.
          </p>
        </div>

        {/* Optional dedup/warning note returned by the last sync. */}
        {syncNote && (
          <div className="flex items-start gap-2 px-3 py-2 bg-primary-50 border border-primary-100 rounded-lg">
            <Info className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600">{syncNote}</p>
          </div>
        )}
      </div>

      {/* ───── Filters ───── */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Filters</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trek</label>
            <select
              value={filters.trek}
              onChange={(e) => setFilters({ ...filters, trek: e.target.value })}
              className="select-field"
            >
              <option value="">All treks</option>
              {treks.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="select-field"
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last contact — from</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last contact — to</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.includeOptedOut}
              onChange={(e) => setFilters({ ...filters, includeOptedOut: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            Include opted-out contacts
          </label>
          <div className="flex items-center gap-2">
            <button onClick={resetFilters} className="btn-secondary flex items-center gap-2">
              <RefreshCcw className="w-4 h-4" /> Reset
            </button>
            <button onClick={applyFilters} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* ───── Result count ───── */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Users className="w-4 h-4 text-slate-400" />
        {loading ? 'Loading…' : <span className="font-semibold text-slate-700">{countLabel}</span>}
      </div>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <span className="text-xs text-red-600">{error}</span>
        </div>
      )}

      {/* ───── Table ───── */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Trek</th>
                <th className="table-header">City</th>
                <th className="table-header">Email</th>
                <th className="table-header">Last contact</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && !hasContacts && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Contact className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No contacts match these filters.</p>
                  </td>
                </tr>
              )}

              {hasContacts && contacts.map((c, idx) => (
                <tr key={c.phone || idx} className="table-row">
                  <td className="table-cell font-medium text-slate-800">{c.name || '—'}</td>
                  <td className="table-cell font-mono text-xs text-slate-600">{c.phone || '—'}</td>
                  <td className="table-cell text-slate-600">{c.trek || '—'}</td>
                  <td className="table-cell text-slate-600">{c.city || '—'}</td>
                  <td className="table-cell text-slate-600">{c.email || '—'}</td>
                  <td className="table-cell text-xs text-slate-500">{formatDate(c.lastContact)}</td>
                  <td className="table-cell">
                    {c.optedOut ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-600">
                        <Ban className="w-3 h-3" /> Opted out
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="table-cell text-right">
                    {/* Opens the WhatsApp Chat page in a new tab with this
                        contact's conversation already selected. A real anchor
                        rather than window.open so middle-click and
                        open-in-new-window behave as expected. */}
                    {c.phone ? (
                      <a
                        href={`/support-chat?phone=${encodeURIComponent(String(c.phone).replace(/\D/g, ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open WhatsApp chat with ${c.name || c.phone}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Chat
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
