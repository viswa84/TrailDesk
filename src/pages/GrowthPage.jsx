import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_ACQUISITION_OVERVIEW, GET_META_ADS } from '../graphql/queries';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, Users, UserPlus, Repeat, Megaphone, Target, Zap, AlertCircle, Link2 } from 'lucide-react';
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
    amber:   'bg-amber-50 text-amber-600',
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const INR = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

export default function GrowthPage() {
  const [days, setDays] = useState(30);

  const { data, loading, error } = useQuery(GET_ACQUISITION_OVERVIEW, {
    variables: { days },
    fetchPolicy: 'cache-and-network',
  });
  const { data: metaData } = useQuery(GET_META_ADS, {
    variables: { days },
    fetchPolicy: 'cache-and-network',
  });

  const stats = data?.getAcquisitionOverview;
  const meta = metaData?.getMetaAds;

  const dailyChartData = useMemo(() => {
    if (!stats?.daily) return [];
    return stats.daily.map((d) => ({
      date: d.date,
      label: (() => { try { return format(parseISO(d.date), 'dd MMM'); } catch { return d.date; } })(),
      New: d.newCustomers,
      Returning: d.returning,
    }));
  }, [stats]);

  const adRows = useMemo(() => {
    if (!stats?.adAttribution) return [];
    return [...stats.adAttribution].sort((a, b) => b.conversations - a.conversations);
  }, [stats]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Growth</h1>
          <p className="text-sm text-slate-500 mt-0.5">Acquisition & engagement — where customers come from and how they return</p>
        </div>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          {PERIOD_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setDays(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all ${days === opt.value ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !stats && (
        <div className="flex items-center justify-center h-48 text-slate-400">Loading growth data…</div>
      )}
      {error && (
        <div className="card p-6 text-center text-red-500">Failed to load growth data. {error.message}</div>
      )}

      {stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Users}    label="Total Customers"  value={stats.totalUnique.toLocaleString()}  sub={`Last ${days} days`}        color="primary" />
            <StatCard icon={UserPlus} label="New Customers"     value={stats.totalNew.toLocaleString()}     sub="First seen in range"      color="blue"    />
            <StatCard icon={Repeat}   label="Returning"         value={stats.totalReturning.toLocaleString()} sub="Seen before this range" color="violet"  />
            <StatCard icon={Target}   label="Ad Conversion"     value={`${stats.adConversionRate.toFixed(1)}%`} sub={`${stats.adBookings} of ${stats.adConversations} ad leads`} color="amber" />
          </div>

          {/* Daily customers stacked bar */}
          <div className="card p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary-500" />
              <h2 className="font-semibold text-slate-800">Daily Customers</h2>
              <span className="text-xs text-slate-400">New vs returning</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="New"       stackId="c" fill="#22c55e" radius={[0, 0, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="Returning" stackId="c" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Re-engagement card */}
          <div className="card p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-orange-500" />
              <h2 className="font-semibold text-slate-800">Re-engagement</h2>
              <span className="text-xs text-slate-400">Customers who went quiet then messaged again</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.reengagement.reactivatedAfter24h.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Reactivated after 24h+</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.reengagement.returnedAfter7d.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Returned after 7d+</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.reengagement.returnedAfter30d.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Returned after 30d+</p>
              </div>
            </div>
          </div>

          {/* Ad attribution table */}
          <div className="card p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-4 h-4 text-primary-500" />
              <h2 className="font-semibold text-slate-800">Click-to-WhatsApp Ad Attribution</h2>
              <span className="text-xs text-slate-400">First-touch · {stats.organicConversations.toLocaleString()} organic</span>
            </div>
            {adRows.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No click-to-WhatsApp ad traffic yet — once customers click your WhatsApp ads, attribution shows here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                      <th className="py-2 pr-3 font-medium">Ad</th>
                      <th className="py-2 px-2 font-medium text-right">Conversations</th>
                      <th className="py-2 px-2 font-medium text-right">Bookings</th>
                      <th className="py-2 px-2 font-medium text-right">Conv %</th>
                      <th className="py-2 pl-2 font-medium text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adRows.map((r) => {
                      const conv = Math.round(r.conversionRate);
                      return (
                        <tr key={r.key + (r.adId || '')} className="border-b border-slate-50 last:border-0">
                          <td className="py-2 pr-3">
                            <span className="font-medium text-slate-700">{r.key}</span>
                            {r.adId && <span className="block text-xs font-mono text-slate-400">{r.adId}</span>}
                          </td>
                          <td className="py-2 px-2 text-right text-slate-600">{r.conversations}</td>
                          <td className="py-2 px-2 text-right font-semibold text-green-600">{r.bookings}</td>
                          <td className="py-2 px-2 text-right">
                            <span className={`font-bold ${conv >= 20 ? 'text-green-600' : conv > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{conv}%</span>
                          </td>
                          <td className="py-2 pl-2 text-right text-slate-700">{INR(r.revenue)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Meta Ads section */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-slate-800">Meta Ad Spend</h2>
            </div>

            {!meta && <p className="text-sm text-slate-400">Loading Meta ads…</p>}

            {meta && meta.configured === false && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm text-slate-600">
                  <p className="font-medium text-slate-800 mb-1">Connect your Meta ad account</p>
                  <p>Set <code className="px-1 py-0.5 bg-white rounded text-xs font-mono text-slate-700">META_AD_ACCOUNT_ID</code> (e.g. <code className="px-1 py-0.5 bg-white rounded text-xs font-mono text-slate-700">act_123456789</code>) and <code className="px-1 py-0.5 bg-white rounded text-xs font-mono text-slate-700">META_ADS_TOKEN</code> (a token with the <code className="px-1 py-0.5 bg-white rounded text-xs font-mono text-slate-700">ads_read</code> permission) in your server environment to see campaign spend, impressions, clicks, CPC and CTR here.</p>
                </div>
              </div>
            )}

            {meta && meta.configured && meta.error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-sm text-red-600">
                  <p className="font-medium mb-1">Meta API error</p>
                  <p className="font-mono text-xs">{meta.error}</p>
                </div>
              </div>
            )}

            {meta && meta.configured && !meta.error && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-2xl font-bold text-slate-900">{INR(meta.totalSpend)}</p>
                    <p className="text-xs text-slate-500 mt-1">Total spend</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-2xl font-bold text-slate-900">{(meta.totalClicks || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">Total clicks</p>
                  </div>
                </div>
                {(!meta.ads || meta.ads.length === 0) ? (
                  <p className="text-sm text-slate-400">No campaign data for this period.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                          <th className="py-2 pr-3 font-medium">Campaign</th>
                          <th className="py-2 px-2 font-medium text-right">Spend</th>
                          <th className="py-2 px-2 font-medium text-right">Impressions</th>
                          <th className="py-2 px-2 font-medium text-right">Clicks</th>
                          <th className="py-2 px-2 font-medium text-right">CPC</th>
                          <th className="py-2 pl-2 font-medium text-right">CTR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meta.ads.map((a, i) => (
                          <tr key={(a.campaign || 'campaign') + i} className="border-b border-slate-50 last:border-0">
                            <td className="py-2 pr-3 font-medium text-slate-700">{a.campaign || '—'}</td>
                            <td className="py-2 px-2 text-right text-slate-600">{INR(a.spend)}</td>
                            <td className="py-2 px-2 text-right text-slate-600">{(a.impressions || 0).toLocaleString()}</td>
                            <td className="py-2 px-2 text-right text-slate-600">{(a.clicks || 0).toLocaleString()}</td>
                            <td className="py-2 px-2 text-right text-slate-600">{INR(a.cpc)}</td>
                            <td className="py-2 pl-2 text-right text-slate-600">{(a.ctr || 0).toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
