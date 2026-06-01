import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_TRAFFIC_OVERVIEW } from '../graphql/queries';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, Eye, Mountain, CalendarRange, ChevronDown, ChevronRight, ExternalLink, Smartphone } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PERIOD_OPTIONS = [
  { label: 'Last 7 days',  value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

function StatCard({ icon: Icon, label, value, sub, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    blue:    'bg-blue-50 text-blue-600',
    violet:  'bg-violet-50 text-violet-600',
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function TrekRow({ trek, baseUrl }) {
  const [open, setOpen] = useState(false);
  const pct = trek.totalVisits > 0 ? Math.round((trek.trekPageVisits / trek.totalVisits) * 100) : 0;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
          <Mountain className="w-4 h-4 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">{trek.trekName}</p>
          <p className="text-xs text-slate-400">
            {trek.trekPageVisits} trek-page · {trek.depPageVisits} departure-page
            {trek.departures.length > 0 && ` · ${trek.departures.length} departure link${trek.departures.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {/* Mini bar */}
        <div className="hidden sm:flex items-center gap-2 w-32 shrink-0">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-bold text-slate-700 w-8 text-right">{trek.totalVisits}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
      </div>

      {/* Expanded */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 space-y-4">
          {/* Trend chart */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Daily Trend</p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trek.trend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id={`tg-${trek.trekId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--color-primary-500, #22c55e)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary-500, #22c55e)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={d => { try { return format(parseISO(d), 'dd MMM'); } catch { return d; } }}
                    interval="preserveStartEnd" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    labelFormatter={d => { try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; } }}
                  />
                  <Area type="monotone" dataKey="visits" stroke="#22c55e" fill={`url(#tg-${trek.trekId})`} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Links table */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Links</p>
            <div className="space-y-1.5">
              {/* Trek page link */}
              {trek.trekPageVisits > 0 && (
                <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mountain className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span className="text-xs font-mono text-slate-500 truncate">/book/trek/{trek.trekId}</span>
                    {baseUrl && (
                      <a href={`${baseUrl}/book/trek/${trek.trekId}`} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()} className="text-slate-300 hover:text-primary-500 shrink-0">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <span className="ml-4 text-xs font-bold text-slate-700 shrink-0">{trek.trekPageVisits} visits</span>
                </div>
              )}
              {/* Per-departure links */}
              {trek.departures.map(dep => (
                <div key={dep.depUniqueId} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <CalendarRange className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-xs font-mono text-slate-500 truncate">/book/{dep.depUniqueId}</span>
                    {baseUrl && (
                      <a href={`${baseUrl}/book/${dep.depUniqueId}`} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()} className="text-slate-300 hover:text-blue-500 shrink-0">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <span className="ml-4 text-xs font-bold text-slate-700 shrink-0">{dep.totalVisits} visits</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrafficPage() {
  const [days, setDays] = useState(30);
  const { data, loading, error } = useQuery(GET_TRAFFIC_OVERVIEW, {
    variables: { days },
    fetchPolicy: 'cache-and-network',
  });

  const stats = data?.getTrafficOverview;

  // Base URL for external links (just the origin of the API)
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

  const chartData = useMemo(() => {
    if (!stats?.trend) return [];
    return stats.trend.map(d => ({
      date: d.date,
      label: (() => { try { return format(parseISO(d.date), 'dd MMM'); } catch { return d.date; } })(),
      visits: d.visits,
    }));
  }, [stats]);

  const trekBarData = useMemo(() => {
    if (!stats?.treks) return [];
    return stats.treks.slice(0, 10).map(t => ({
      name: t.trekName.length > 16 ? t.trekName.slice(0, 15) + '…' : t.trekName,
      fullName: t.trekName,
      'Trek page': t.trekPageVisits,
      'Dep page': t.depPageVisits,
    }));
  }, [stats]);

  const hourlyChartData = useMemo(() => {
    if (!stats?.hourlyTrend) return [];
    return stats.hourlyTrend.map(({ hour, visits }) => {
      let label;
      if (hour === 0)       label = '12am';
      else if (hour < 12)   label = `${hour}am`;
      else if (hour === 12) label = '12pm';
      else                  label = `${hour - 12}pm`;
      return { label, visits };
    });
  }, [stats]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Traffic Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Book-page visits per trek and departure link</p>
        </div>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setDays(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all ${days === opt.value ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !stats && (
        <div className="flex items-center justify-center h-48 text-slate-400">Loading traffic data…</div>
      )}
      {error && (
        <div className="card p-6 text-center text-red-500">Failed to load traffic data. {error.message}</div>
      )}

      {stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard icon={Eye}          label="Total Visits"         value={stats.totalVisits}     sub={`Last ${days} days`}            color="primary" />
            <StatCard icon={Mountain}     label="Trek Page Visits"     value={stats.trekPageVisits}  sub="/book/trek/… links"             color="blue"    />
            <StatCard icon={CalendarRange} label="Departure Page Visits" value={stats.depPageVisits}  sub="/book/DEP-… links"              color="violet"  />
          </div>

          {/* Overall trend */}
          <div className="card p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary-500" />
              <h2 className="font-semibold text-slate-800">Overall Daily Traffic</h2>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="overall-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Area type="monotone" dataKey="visits" name="Visits" stroke="#22c55e" fill="url(#overall-grad)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly traffic chart */}
          {stats.hourlyTrend && (
            <div className="card p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                <h2 className="font-semibold text-slate-800">Today's Hourly Traffic</h2>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyChartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="visits" name="Visits" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Trek comparison bar chart */}
          {trekBarData.length > 0 && (
            <div className="card p-5 mb-6">
              <h2 className="font-semibold text-slate-800 mb-4">Visits by Trek</h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trekBarData} margin={{ top: 4, right: 8, bottom: 24, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      formatter={(val, name, props) => [val, name]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Trek page" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Dep page"  fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Per-trek breakdown */}
          <div className="mb-6">
            <h2 className="font-semibold text-slate-800 mb-3">Trek-wise Detail</h2>
            {stats.treks.length === 0 ? (
              <div className="card p-10 text-center text-slate-400">
                <Eye className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No visits recorded yet. Share your booking links to start tracking.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.treks.map(trek => (
                  <TrekRow key={trek.trekId} trek={trek} baseUrl={baseUrl} />
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp Visitors */}
          {stats.whatsappVisitors && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-4 h-4 text-green-500" />
                <h2 className="font-semibold text-slate-800">WhatsApp Visitors</h2>
              </div>
              {stats.whatsappVisitors.length === 0 ? (
                <p className="text-sm text-slate-400">No WhatsApp visitors yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {stats.whatsappVisitors.map(({ phone, visits }) => {
                    const masked = `91XXXXX${phone.slice(-5)}`;
                    return (
                      <div key={phone} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-sm font-mono text-slate-700">{masked}</span>
                        <span className="text-sm font-bold text-slate-700">{visits} {visits === 1 ? 'visit' : 'visits'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
