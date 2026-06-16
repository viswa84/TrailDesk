import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Cpu, Coins, Phone, AlertTriangle, RefreshCcw } from 'lucide-react';
import { GET_AI_TOKEN_USAGE } from '../graphql/queries';

// ── Formatters ────────────────────────────────────────────────────────────────
const nf = new Intl.NumberFormat('en-IN');
const fmtTokens = (n) => nf.format(Math.round(n || 0));
const fmtInr = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PROVIDER_BADGE = {
  'gemini-flash': 'bg-blue-50 text-blue-700',
  'gemini-lite': 'bg-sky-50 text-sky-700',
  groq: 'bg-orange-50 text-orange-700',
};

const GRANULARITIES = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

function UsageTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200 text-sm">
      <p className="text-slate-500 mb-1">{label}</p>
      <p className="font-semibold text-slate-900">{fmtTokens(row.totalTokens)} tokens</p>
      <p className="text-xs text-slate-500">{fmtInr(row.costInr)} · {row.calls} calls</p>
    </div>
  );
}

// ── Shared section UI (reused by superadmin) ───────────────────────────────────
export function AiUsageSection({ usage, granularity, onGranularityChange }) {
  const total = usage?.total || {};
  const series = usage?.[granularity] || [];
  const byModel = usage?.byModel || [];

  return (
    <div className="space-y-6">
      {/* Headline totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{fmtTokens(total.totalTokens)}</p>
            <p className="text-sm font-medium text-slate-500">Total tokens</p>
          </div>
        </div>
        <div className="card p-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{fmtInr(total.costInr)}</p>
            <p className="text-sm font-medium text-slate-500">Total cost</p>
          </div>
        </div>
        <div className="card p-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{fmtTokens(total.calls)}</p>
            <p className="text-sm font-medium text-slate-500">AI calls</p>
          </div>
        </div>
      </div>

      {/* Time-series chart + granularity toggle */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Token usage over time</h3>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {GRANULARITIES.map((g) => (
              <button
                key={g.key}
                onClick={() => onGranularityChange(g.key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  granularity === g.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[280px]">
          {series.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              No usage data for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} barSize={series.length > 20 ? 12 : 36}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
                <Tooltip content={<UsageTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="totalTokens" fill="url(#aiUsageGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="aiUsageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Per-model table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Usage by model</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-2">Model</th>
                <th className="px-4 py-2">Provider</th>
                <th className="px-4 py-2 text-right">Calls</th>
                <th className="px-4 py-2 text-right">Prompt</th>
                <th className="px-4 py-2 text-right">Completion</th>
                <th className="px-4 py-2 text-right">Total tokens</th>
                <th className="px-4 py-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {byModel.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No model usage recorded.</td>
                </tr>
              ) : (
                byModel.map((m) => (
                  <tr key={`${m.provider}-${m.model}`} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-xs text-slate-800">{m.model || '—'}</td>
                    <td className="px-4 py-2">
                      {m.provider && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${PROVIDER_BADGE[m.provider] || 'bg-slate-100 text-slate-600'}`}>
                          {m.provider}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-slate-600">{fmtTokens(m.calls)}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-slate-600">{fmtTokens(m.promptTokens)}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-slate-600">{fmtTokens(m.completionTokens)}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs font-semibold text-slate-800">{fmtTokens(m.totalTokens)}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-slate-800">{fmtInr(m.costInr)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Date range filter (native inputs, wired to query vars) ─────────────────────
export function DateRangeFilter({ from, to, onChange, onClear }) {
  return (
    <div className="card p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
        <input type="date" value={from} onChange={(e) => onChange('from', e.target.value)} className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
        <input type="date" value={to} onChange={(e) => onChange('to', e.target.value)} className="input-field text-sm" />
      </div>
      {(from || to) && (
        <button onClick={onClear} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCcw className="w-4 h-4" /> Clear
        </button>
      )}
    </div>
  );
}

// ── Tenant page ────────────────────────────────────────────────────────────────
export default function AiUsagePage() {
  const [granularity, setGranularity] = useState('daily');
  const [range, setRange] = useState({ from: '', to: '' });

  const variables = useMemo(() => ({
    from: range.from || undefined,
    to: range.to || undefined,
  }), [range]);

  const { data, loading, error } = useQuery(GET_AI_TOKEN_USAGE, {
    variables,
    errorPolicy: 'all',
  });

  const usage = data?.getAiTokenUsage;

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Cpu className="w-6 h-6 text-violet-600" /> AI Usage
        </h1>
        <p className="page-subtitle mt-1">Token consumption and AI cost for your account.</p>
      </div>

      <DateRangeFilter
        from={range.from}
        to={range.to}
        onChange={(k, v) => setRange((r) => ({ ...r, [k]: v }))}
        onClear={() => setRange({ from: '', to: '' })}
      />

      {error && !usage && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <span className="text-xs text-red-600">{error.message}</span>
        </div>
      )}

      {loading && !usage ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="card p-6 skeleton rounded-2xl h-24" />)}
          </div>
          <div className="card skeleton rounded-2xl h-[340px]" />
        </div>
      ) : (
        <AiUsageSection usage={usage} granularity={granularity} onGranularityChange={setGranularity} />
      )}
    </div>
  );
}
