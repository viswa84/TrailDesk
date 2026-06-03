import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Database, ChevronDown, ChevronRight, ThumbsUp, ThumbsDown,
  Download, RefreshCcw, Loader2, AlertTriangle, ShieldAlert, CloudSun, Search as SearchIcon,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/').replace(/\/$/, '');
const getToken = () => localStorage.getItem('trekops_token') || '';

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

const RATINGS = [
  { value: '', label: 'All ratings' },
  { value: 'good', label: '👍 Good' },
  { value: 'bad', label: '👎 Bad' },
  { value: 'unrated', label: 'Unrated' },
];

const PROVIDER_BADGE = {
  'gemini-flash': 'bg-blue-50 text-blue-700',
  'gemini-lite': 'bg-sky-50 text-sky-700',
  groq: 'bg-orange-50 text-orange-700',
};

const maskPhone = (phone) => (phone ? `91XXXXX${String(phone).slice(-5)}` : '—');
const truncate = (s, n = 60) => {
  const str = (s || '').replace(/\s+/g, ' ').trim();
  return str.length > n ? `${str.slice(0, n)}…` : str || '—';
};

function LogRow({ log, onRated }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [rating, setRating] = useState(log.rating || 'unrated');

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !detail) {
      setLoadingDetail(true);
      try {
        const full = await api(`/api/ai-logs/${log._id}`);
        setDetail(full);
      } catch (e) {
        toast.error(`Failed to load log: ${e.message}`);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const rate = async (e, value) => {
    e.stopPropagation();
    const newRating = rating === value ? 'unrated' : value;
    try {
      await api(`/api/ai-logs/${log._id}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating: newRating }),
      });
      setRating(newRating);
      onRated?.(log._id, newRating);
      toast.success(`Marked as ${newRating}`);
    } catch (err) {
      toast.error(err.message || 'Failed to rate');
    }
  };

  const providerCls = PROVIDER_BADGE[log.provider] || 'bg-slate-100 text-slate-600';

  return (
    <>
      <tr onClick={toggle} className="border-t border-slate-100 cursor-pointer hover:bg-slate-50 align-top">
        <td className="px-3 py-2 text-slate-400">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </td>
        <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
          {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
        </td>
        <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{maskPhone(log.phone)}</td>
        <td className="px-3 py-2 text-xs text-slate-700 max-w-[200px]">{truncate(log.userMessage, 70)}</td>
        <td className="px-3 py-2 text-xs text-slate-600 max-w-[220px]">{truncate(log.reply, 80)}</td>
        <td className="px-3 py-2 whitespace-nowrap">
          {log.provider && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${providerCls}`}>{log.provider}</span>
          )}
          {log.safetyOverride && (
            <span title="Payment-hallucination safety gate fired" className="ml-1 inline-flex">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            </span>
          )}
        </td>
        <td className="px-3 py-2 text-right font-mono text-xs text-slate-500 whitespace-nowrap">
          {(log.promptTokens || 0)} / {(log.completionTokens || 0)}
        </td>
        <td className="px-3 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => rate(e, 'good')}
              title="Mark good"
              className={`p-1.5 rounded-lg transition-colors ${rating === 'good' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-300 hover:bg-emerald-50 hover:text-emerald-500'}`}
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => rate(e, 'bad')}
              title="Mark bad"
              className={`p-1.5 rounded-lg transition-colors ${rating === 'bad' ? 'bg-red-100 text-red-600' : 'text-slate-300 hover:bg-red-50 hover:text-red-500'}`}
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-50/60">
          <td colSpan={8} className="px-6 py-4">
            {loadingDetail && <p className="text-xs text-slate-400 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</p>}
            {detail && (
              <div className="space-y-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-600">Model:</span> <span className="font-mono">{detail.model || '—'}</span>
                  <span className="font-semibold text-slate-600 ml-3">Latency:</span> <span>{detail.latencyMs || 0} ms</span>
                  <span className="font-semibold text-slate-600 ml-3">Booking:</span> <span>{detail.bookingStatus || '—'}</span>
                  {detail.weatherUsed && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded"><CloudSun className="w-3 h-3" /> weather</span>}
                  {detail.searchUsed && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded"><SearchIcon className="w-3 h-3" /> search</span>}
                  {detail.safetyOverride && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-600 rounded"><ShieldAlert className="w-3 h-3" /> safety override</span>}
                </div>

                <div>
                  <p className="font-semibold text-slate-600 uppercase tracking-wider text-[10px] mb-1">
                    Full input to model ({Array.isArray(detail.messages) ? detail.messages.length : 0} messages)
                  </p>
                  <div className="space-y-1.5 max-h-80 overflow-y-auto bg-white rounded-lg border border-slate-200 p-2">
                    {(Array.isArray(detail.messages) ? detail.messages : []).map((m, i) => (
                      <div key={i} className="rounded border border-slate-100">
                        <div className="px-2 py-0.5 bg-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{m.role}</div>
                        <pre className="px-2 py-1.5 whitespace-pre-wrap break-words font-mono text-[11px] text-slate-700">{m.content}</pre>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="font-semibold text-slate-600 uppercase tracking-wider text-[10px] mb-1">Final reply</p>
                    <pre className="p-2 bg-white rounded-lg border border-slate-200 whitespace-pre-wrap break-words text-[11px] text-slate-700">{detail.reply || '—'}</pre>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600 uppercase tracking-wider text-[10px] mb-1">Raw model output</p>
                    <pre className="p-2 bg-white rounded-lg border border-slate-200 whitespace-pre-wrap break-words text-[11px] text-slate-500">{detail.rawReply || '—'}</pre>
                  </div>
                </div>

                {detail.action && (
                  <div>
                    <p className="font-semibold text-slate-600 uppercase tracking-wider text-[10px] mb-1">Action</p>
                    <pre className="p-2 bg-white rounded-lg border border-slate-200 overflow-x-auto text-[11px] text-slate-700">{JSON.stringify(detail.action, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function AiLogsPage() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, good: 0, bad: 0, unrated: 0 });
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (ratingFilter) params.set('rating', ratingFilter);
      if (phoneFilter.trim()) params.set('phone', phoneFilter.trim());
      const data = await api(`/api/ai-logs?${params.toString()}`);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, ratingFilter, phoneFilter]);

  useEffect(() => { load(); }, [load]);

  // Stat cards — fetch counts per rating (total=1 limit keeps payloads tiny).
  const loadStats = useCallback(async () => {
    try {
      const [all, good, bad, unrated] = await Promise.all([
        api('/api/ai-logs?page=1&limit=1'),
        api('/api/ai-logs?page=1&limit=1&rating=good'),
        api('/api/ai-logs?page=1&limit=1&rating=bad'),
        api('/api/ai-logs?page=1&limit=1&rating=unrated'),
      ]);
      setStats({
        total: all.total || 0,
        good: good.total || 0,
        bad: bad.total || 0,
        unrated: unrated.total || 0,
      });
    } catch (e) {
      console.error('[ai-logs] stats load failed', e);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const onRated = useCallback((id, newRating) => {
    // Update local row + refresh stat counts (cheap).
    setLogs((prev) => prev.map((l) => (l._id === id ? { ...l, rating: newRating } : l)));
    loadStats();
  }, [loadStats]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (ratingFilter) params.set('rating', ratingFilter);
      const qs = params.toString();
      const res = await fetch(`${API_URL}/api/ai-logs/export.jsonl${qs ? `?${qs}` : ''}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-training-data${ratingFilter ? `-${ratingFilter}` : ''}.jsonl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Training data downloaded');
    } catch (e) {
      toast.error(e.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const statCards = useMemo(() => ([
    { label: 'Total logged', val: stats.total, color: 'text-slate-900' },
    { label: 'Good', val: stats.good, color: 'text-emerald-600' },
    { label: 'Bad', val: stats.bad, color: 'text-red-600' },
    { label: 'Unrated', val: stats.unrated, color: 'text-slate-400' },
  ]), [stats]);

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-primary-600" /> AI Interaction Logs
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Every AI conversation is logged. Rate them good/bad, then export the curated set for fine-tuning.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export Training Data{ratingFilter ? ` (${ratingFilter})` : ''}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card p-5">
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-sm font-medium text-slate-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Rating</label>
          <select
            value={ratingFilter}
            onChange={(e) => { setPage(1); setRatingFilter(e.target.value); }}
            className="select-field"
          >
            {RATINGS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Phone (exact, country code, no +)</label>
          <input
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load(); } }}
            placeholder="e.g. 919182748724"
            className="input-field font-mono text-sm"
          />
        </div>
        <button onClick={() => { setPage(1); load(); }} className="btn-secondary flex items-center gap-2">
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <span className="text-xs text-red-600">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">User message</th>
                <th className="px-3 py-2">AI reply</th>
                <th className="px-3 py-2">Provider</th>
                <th className="px-3 py-2 text-right">Tokens (in/out)</th>
                <th className="px-3 py-2">Rate</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <LogRow key={log._id} log={log} onRated={onRated} />
              ))}
            </tbody>
          </table>
        </div>

        {loading && logs.length === 0 && (
          <div className="flex items-center justify-center h-32 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading logs…
          </div>
        )}
        {!loading && logs.length === 0 && !error && (
          <div className="p-10 text-center text-slate-400">
            <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No AI interactions logged yet.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
