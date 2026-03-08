import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  SUPER_ADMIN_DASHBOARD, GET_ALL_TENANTS, GET_ALL_USERS_ADMIN, GET_PLATFORM_ACTIVITY_LOG
} from '../graphql/queries';
import {
  CREATE_TENANT, SUSPEND_TENANT, ACTIVATE_TENANT, DELETE_TENANT,
  UPDATE_TENANT_PLAN, CREATE_ADMIN_USER, DELETE_USER_ADMIN, RESET_USER_PASSWORD
} from '../graphql/mutations';
import {
  Shield, Building2, Users, DollarSign, TrendingUp, Activity,
  Plus, Search, ChevronDown, MoreVertical, AlertTriangle, CheckCircle,
  XCircle, Clock, Crown, Zap, Star, RefreshCw, Trash2, Lock, UserPlus,
  Package, Globe, Mail, Phone, Calendar, Edit3, Eye, LogOut, X, BookOpen,
  GitBranch, Database, Layers, Key, FileCode, ArrowRight, Server, Monitor
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

// ── Helpers ────────────────────────────────────────────────────────────────────

function safeDate(d) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd/MM/yyyy'); } catch { return '—'; }
}

const PLAN_COLORS = {
  free: 'bg-slate-100 text-slate-600',
  pro: 'bg-blue-100 text-blue-700',
  enterprise: 'bg-purple-100 text-purple-700',
};

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
  trial: 'bg-amber-100 text-amber-700',
};

const PLAN_ICON = { free: Package, pro: Zap, enterprise: Crown };

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className={`rounded-2xl p-5 border border-slate-100 bg-white shadow-sm flex gap-4 items-start`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, colorClass }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${colorClass}`}>
      {label}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Create Tenant Form ────────────────────────────────────────────────────────
function CreateTenantModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', slug: '', plan: 'pro',
    adminName: '', adminEmail: '', adminPhone: '', adminPassword: '',
    licenseExpiry: '', gst: '', address: '', website: '',
  });
  const [createTenant, { loading }] = useMutation(CREATE_TENANT, {
    refetchQueries: [{ query: GET_ALL_TENANTS }],
    onCompleted: () => { onCreated?.(); onClose(); },
    onError: (e) => alert(e.message),
  });

  const change = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    createTenant({ variables: { input: form } });
  };

  return (
    <Modal title="Create New Company" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Company Name *</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={form.name} onChange={change('name')} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Slug (URL key) *</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={form.slug} onChange={change('slug')} placeholder="my-company" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Plan</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.plan} onChange={change('plan')}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Licence Expiry</label>
            <DatePickerInput
              selected={form.licenseExpiry ? new Date(form.licenseExpiry) : null}
              onChange={(date) => setForm({ ...form, licenseExpiry: date ? date.toISOString().split('T')[0] : '' })}
            />
          </div>
        </div>
        <hr className="border-slate-100" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Admin User</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Admin Name *</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.adminName} onChange={change('adminName')} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Admin Phone *</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.adminPhone} onChange={(e) => setForm({ ...form, adminPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })} maxLength={10} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Admin Email</label>
            <input type="email" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.adminEmail} onChange={change('adminEmail')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Admin Password *</label>
            <input type="password" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.adminPassword} onChange={change('adminPassword')} required />
          </div>
        </div>
        <hr className="border-slate-100" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">GST</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.gst} onChange={change('gst')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Website</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.website} onChange={change('website')} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Company'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Plan Badge ─────────────────────────────────────────────────────────────────
function PlanBadge({ plan }) {
  const PIcon = PLAN_ICON[plan] || Package;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${PLAN_COLORS[plan] || 'bg-slate-100 text-slate-600'}`}>
      <PIcon className="w-3 h-3" />{plan}
    </span>
  );
}

// ── Tenant Row Actions ─────────────────────────────────────────────────────────
function TenantActions({ tenant, refetch }) {
  const [open, setOpen] = useState(false);
  const [suspendTenant] = useMutation(SUSPEND_TENANT, { onCompleted: refetch, onError: e => alert(e.message) });
  const [activateTenant] = useMutation(ACTIVATE_TENANT, { onCompleted: refetch, onError: e => alert(e.message) });
  const [deleteTenant] = useMutation(DELETE_TENANT, { onCompleted: refetch, onError: e => alert(e.message) });

  const actions = [
    tenant.status !== 'active' && {
      label: 'Activate', icon: CheckCircle, color: 'text-emerald-600',
      onClick: () => activateTenant({ variables: { id: tenant._id } }),
    },
    tenant.status === 'active' && {
      label: 'Suspend', icon: XCircle, color: 'text-amber-600',
      onClick: () => { const reason = prompt('Reason for suspension?'); if (reason !== null) suspendTenant({ variables: { id: tenant._id, reason } }); },
    },
    {
      label: 'Delete', icon: Trash2, color: 'text-red-600',
      onClick: () => { if (window.confirm(`Delete "${tenant.name}"? This cannot be undone.`)) deleteTenant({ variables: { id: tenant._id } }); },
    },
  ].filter(Boolean);

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="p-1.5 hover:bg-slate-100 rounded-lg">
        <MoreVertical className="w-4 h-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[140px]">
          {actions.map((a) => (
            <button key={a.label} onClick={() => { a.onClick(); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-50 ${a.color}`}>
              <a.icon className="w-3.5 h-3.5" />{a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Documentation Helpers ───────────────────────────────────────────────────────
function DocSection({ title, icon: Icon, iconColor, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={`flex items-center gap-3 px-6 py-4 border-b border-slate-100 ${iconColor || 'bg-slate-50'}`}>
        <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Code({ children, label, lang = 'graphql' }) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 my-3">
      {label && (
        <div className="flex items-center justify-between bg-slate-800 px-4 py-2">
          <span className="text-xs font-mono text-slate-400">{label}</span>
          <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded">{lang}</span>
        </div>
      )}
      <pre className="bg-slate-900 text-emerald-300 text-xs font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre">{children}</pre>
    </div>
  );
}

function FolderTree({ items }) {
  return (
    <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs leading-6 overflow-x-auto">
      {items.map((line, i) => (
        <div key={i} className={
          line.startsWith('#') ? 'text-slate-500 mt-2' :
            line.includes('.js') || line.includes('.jsx') || line.includes('.json') ? 'text-amber-300' :
              (line.endsWith('/') || line.match(/\/$/)) ? 'text-blue-300' :
                'text-slate-300'
        }>
          {line}
        </div>
      ))}
    </div>
  );
}

function Pill({ label, color }) {
  const colors = {
    query: 'bg-blue-100 text-blue-700',
    mutation: 'bg-violet-100 text-violet-700',
    required: 'bg-red-100 text-red-700',
    optional: 'bg-slate-100 text-slate-500',
    superadmin: 'bg-purple-100 text-purple-700',
    auth: 'bg-emerald-100 text-emerald-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color] || 'bg-slate-100 text-slate-600'}`}>{label}</span>;
}

function GqlRef({ name, type, auth, params, returns, description }) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 space-y-2 hover:border-slate-200 transition-colors">
      <div className="flex items-center flex-wrap gap-2">
        <code className="font-bold text-slate-900 text-sm">{name}</code>
        <Pill label={type} color={type} />
        <Pill label={auth} color={auth === 'superadmin' ? 'superadmin' : 'auth'} />
      </div>
      {description && <p className="text-sm text-slate-500">{description}</p>}
      {params && (
        <div className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Params: </span>
          {params.map((p, i) => (
            <span key={i}>
              <code className="bg-slate-100 px-1 rounded text-slate-700">{p.name}</code>: {p.type}{' '}
              {p.required ? <Pill label="required" color="required" /> : <Pill label="optional" color="optional" />}
              {i < params.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}
      {returns && <div className="text-xs text-slate-500"><span className="font-semibold text-slate-700">Returns: </span><code className="bg-slate-100 px-1 rounded text-slate-700">{returns}</code></div>}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SuperAdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTenants, setSearchTenants] = useState('');
  const [searchUsers, setSearchUsers] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [showCreateTenant, setShowCreateTenant] = useState(false);

  // Redirect non-superadmins
  if (user?.role !== 'superadmin') return <Navigate to="/dashboard" replace />;

  const { data: dashData, loading: dashLoading, refetch: refetchDash } = useQuery(SUPER_ADMIN_DASHBOARD);
  const { data: tenantsData, loading: tenantsLoading, refetch: refetchTenants } = useQuery(GET_ALL_TENANTS, {
    variables: { status: filterStatus || undefined, plan: filterPlan || undefined, search: searchTenants || undefined },
    errorPolicy: 'all',
  });
  const { data: usersData, loading: usersLoading } = useQuery(GET_ALL_USERS_ADMIN, {
    variables: { search: searchUsers || undefined },
    skip: activeTab !== 'users',
    errorPolicy: 'all',
  });
  const { data: activityData } = useQuery(GET_PLATFORM_ACTIVITY_LOG, {
    variables: { limit: 15 },
    skip: activeTab !== 'activity',
    errorPolicy: 'all',
  });

  const dash = dashData?.superAdminDashboard;
  const tenants = tenantsData?.getAllTenants || [];
  const allUsers = usersData?.getAllUsers || [];
  const activityLog = activityData?.getPlatformActivityLog || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'tenants', label: 'Companies', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'activity', label: 'Activity Log', icon: Clock },
    { id: 'docs', label: 'Documentation', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-600 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Super Admin Panel</h1>
                <p className="text-white/60 text-sm">TrailDesk Platform Control</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateTenant(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Company
            </button>
          </div>

          {/* Tab nav */}
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.id
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── OVERVIEW TAB ───────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {dashLoading ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : (
              <>
                {/* KPI grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard label="Total Companies" value={dash?.totalTenants ?? 0} icon={Building2} color="bg-purple-100 text-purple-600" />
                  <KpiCard label="Active" value={dash?.activeTenants ?? 0} sub={`${dash?.trialTenants ?? 0} on trial`} icon={CheckCircle} color="bg-emerald-100 text-emerald-600" />
                  <KpiCard label="Total Users" value={dash?.totalUsers ?? 0} icon={Users} color="bg-blue-100 text-blue-600" />
                  <KpiCard label="Platform Revenue" value={`₹${((dash?.totalRevenueAcrossPlatform ?? 0) / 1000).toFixed(0)}K`} sub={`${dash?.totalBookingsAcrossPlatform ?? 0} bookings`} icon={DollarSign} color="bg-amber-100 text-amber-600" />
                </div>

                {/* Suspended alert */}
                {(dash?.suspendedTenants ?? 0) > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span><strong>{dash.suspendedTenants}</strong> companies currently suspended.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Plan breakdown */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-base font-bold text-slate-900 mb-4">Plan Distribution</h3>
                    <div className="space-y-3">
                      {(dash?.planBreakdown || []).map((p) => {
                        const pct = dash.totalTenants > 0 ? Math.round((p.count / dash.totalTenants) * 100) : 0;
                        const colorBar = p.plan === 'enterprise' ? 'bg-purple-500' : p.plan === 'pro' ? 'bg-blue-500' : 'bg-slate-300';
                        return (
                          <div key={p.plan}>
                            <div className="flex items-center justify-between mb-1">
                              <PlanBadge plan={p.plan} />
                              <span className="text-xs text-slate-500">{p.count} companies</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className={`h-2 rounded-full ${colorBar}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top tenants by bookings */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-base font-bold text-slate-900 mb-4">Top Companies by Bookings</h3>
                    <div className="space-y-3">
                      {(dash?.topTenantsByBookings || []).map((t, i) => (
                        <div key={t.tenantId} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">{t.tenantName}</div>
                            <div className="text-xs text-slate-400">{t.bookings} bookings · ₹{(t.revenue / 1000).toFixed(0)}K</div>
                          </div>
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        </div>
                      ))}
                      {(!dash?.topTenantsByBookings?.length) && (
                        <p className="text-sm text-slate-400 text-center py-4">No booking data yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent signups */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Recent Signups</h3>
                  <div className="divide-y divide-slate-50">
                    {(dash?.recentSignups || []).map((t) => (
                      <div key={t._id} className="flex items-center gap-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {t.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900">{t.name}</div>
                          <div className="text-xs text-slate-400">{t.adminEmail || t.slug}</div>
                        </div>
                        <PlanBadge plan={t.plan} />
                        <Badge label={t.status} colorClass={STATUS_COLORS[t.status] || ''} />
                        <span className="text-xs text-slate-400">{safeDate(t.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TENANTS TAB ────────────────────────────────────────────────── */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Search companies…"
                  value={searchTenants}
                  onChange={(e) => setSearchTenants(e.target.value)}
                />
              </div>
              <select
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
              </select>
              <select
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <button onClick={() => setShowCreateTenant(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> New Company
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {tenantsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Company</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Plan</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Users</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Bookings</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Licence Expiry</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Joined</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tenants.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {t.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                              <div className="text-xs text-slate-400">{t.adminEmail || t.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4"><PlanBadge plan={t.plan} /></td>
                        <td className="px-3 py-4"><Badge label={t.status} colorClass={STATUS_COLORS[t.status] || ''} /></td>
                        <td className="px-3 py-4 text-sm text-slate-600">{t.userCount}</td>
                        <td className="px-3 py-4 text-sm text-slate-600">{t.bookingCount}</td>
                        <td className="px-3 py-4 text-sm text-slate-500">
                          {t.licenseExpiry
                            ? <span className={new Date(t.licenseExpiry) < new Date() ? 'text-red-500 font-medium' : ''}>
                              {safeDate(t.licenseExpiry)}
                            </span>
                            : '—'}
                        </td>
                        <td className="px-3 py-4 text-xs text-slate-400">{safeDate(t.createdAt)}</td>
                        <td className="px-3 py-4">
                          <TenantActions tenant={t} refetch={refetchTenants} />
                        </td>
                      </tr>
                    ))}
                    {tenants.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center text-sm text-slate-400 py-12">
                          No companies found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── USERS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Search users by name, email or phone…"
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {usersLoading ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">User</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Role</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Company</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Phone</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-3 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900">{u.name}</div>
                              <div className="text-xs text-slate-400">{u.email || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge label={u.role}
                            colorClass={u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}
                          />
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-600">{u.tenantName || '—'}</td>
                        <td className="px-3 py-3 text-sm text-slate-600">{u.phone || '—'}</td>
                        <td className="px-3 py-3 text-xs text-slate-400">{safeDate(u.createdAt)}</td>
                      </tr>
                    ))}
                    {allUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-sm text-slate-400 py-12">No users found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── ACTIVITY LOG TAB ────────────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Platform Activity Log</h3>
              <p className="text-sm text-slate-400 mt-0.5">Recent events across all companies</p>
            </div>
            <div className="divide-y divide-slate-50">
              {activityLog.map((a) => (
                <div key={a.id} className="flex items-start gap-4 px-5 py-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.action.includes('CREATED') ? 'bg-emerald-100 text-emerald-600' :
                    a.action.includes('SUSPENDED') ? 'bg-red-100 text-red-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                    {a.action.includes('TENANT') ? <Building2 className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800">
                      <span className="font-semibold">{a.targetName}</span> —{' '}
                      <span className="text-slate-500">{a.action.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      By {a.performedBy} · {safeDate(a.timestamp)}
                    </div>
                  </div>
                  <Badge
                    label={a.targetType}
                    colorClass="bg-slate-100 text-slate-500"
                  />
                </div>
              ))}
              {activityLog.length === 0 && (
                <div className="text-center text-sm text-slate-400 py-12">No activity yet</div>
              )}
            </div>
          </div>
        )}

        {/* ── DOCUMENTATION TAB ───────────────────────────────────────────── */}
        {activeTab === 'docs' && (
          <div className="space-y-6">

            {/* ── ARCHITECTURE OVERVIEW ── */}
            <DocSection title="System Architecture Overview" icon={Layers} iconColor="bg-gradient-to-r from-violet-50 to-indigo-50">
              <p className="text-sm text-slate-600 mb-4">TrailDesk is a <strong>multi-tenant SaaS</strong> built on a shared-database model. A single MongoDB cluster stores all tenant data — each document is tagged with a <code className="bg-slate-100 px-1 rounded text-violet-700">tenantId</code> that acts as the invisible row-level security filter on every query.</p>

              {/* ASCII Architecture Diagram */}
              <div className="bg-slate-900 rounded-xl p-5 font-mono text-xs leading-6 overflow-x-auto text-slate-300 mb-4">
                <div className="text-slate-500 mb-1"># High-level request flow</div>
                <div className="text-blue-300">Browser (React + Apollo Client)</div>
                <div>  │  Authorization: Bearer &lt;JWT&gt;</div>
                <div>  ▼</div>
                <div className="text-amber-300">Express Server (port 8080)</div>
                <div>  │  authMiddleware → decodes JWT → req.user = {'{'} userId, tenantId, role {'}'}</div>
                <div>  ▼</div>
                <div className="text-emerald-300">GraphQL Engine (graphql-http)</div>
                <div>  │  context = {'{'} user: req.user {'}'} passed to every resolver</div>
                <div>  ▼</div>
                <div className="text-pink-300">Resolvers (per domain module)</div>
                <div>  │  requireAuth(context) → throws if no JWT</div>
                <div>  │  filter = {'{'} tenantId: user.tenantId {'}'} → tenant isolation</div>
                <div>  ▼</div>
                <div className="text-cyan-300">MongoDB (Mongoose models)</div>
                <div>  │  tenantId field indexed on every collection</div>
                <div>  ▼</div>
                <div className="text-slate-400">Response → Apollo Cache → React UI</div>
              </div>

              {/* Layer boxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {[
                  { icon: Monitor, label: 'Frontend', color: 'bg-blue-50 border-blue-200', tc: 'text-blue-700', items: ['React 19 + Vite', 'Apollo Client 4', 'React Router 7', 'Tailwind CSS 4', 'date-fns, lucide-react'] },
                  { icon: Server, label: 'Backend', color: 'bg-emerald-50 border-emerald-200', tc: 'text-emerald-700', items: ['Node.js + Express', 'graphql-http', '@graphql-tools/schema', 'jsonwebtoken', 'bcryptjs'] },
                  { icon: Database, label: 'Database', color: 'bg-amber-50 border-amber-200', tc: 'text-amber-700', items: ['MongoDB (Replica Set)', 'Mongoose ODM', 'tenantId indexes', 'Shared collections', 'Timestamps on all docs'] },
                ].map(layer => (
                  <div key={layer.label} className={`rounded-xl border p-4 ${layer.color}`}>
                    <div className={`flex items-center gap-2 mb-3 font-bold text-sm ${layer.tc}`}>
                      <layer.icon className="w-4 h-4" />{layer.label}
                    </div>
                    <ul className="space-y-1">
                      {layer.items.map(i => <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-slate-300" />{i}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </DocSection>

            {/* ── MULTI-TENANCY MODEL ── */}
            <DocSection title="Multi-Tenancy: How Data Isolation Works" icon={Database} iconColor="bg-emerald-50">
              <p className="text-sm text-slate-600 mb-3">All companies share the <strong>same MongoDB collections</strong>. Every document has a <code className="bg-slate-100 px-1 rounded">tenantId</code> field referencing the <code className="bg-slate-100 px-1 rounded">Tenant</code> model. Queries always filter by the tenant extracted from the JWT token — company data never crosses boundaries.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Database layout</p>
                  <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs leading-6">
                    <div className="text-slate-500"># bookings collection</div>
                    <div className="text-amber-300">{'{"_id":"...", "tenantId":"A", "amount":5000}'}</div>
                    <div className="text-blue-300">{'{"_id":"...", "tenantId":"B", "amount":8000}'}</div>
                    <div className="text-amber-300">{'{"_id":"...", "tenantId":"A", "amount":3500}'}</div>
                    <div className="text-slate-500 mt-2"># Company A only sees their rows</div>
                    <div className="text-emerald-300">{'Booking.find({ tenantId: "A" })'}</div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Resolver pattern (every query)</p>
                  <Code lang="js">{`const user = requireAuth(context);
// user = { userId, tenantId, role }
// extracted from JWT — unforgeable

const docs = await Model.find({
  tenantId: user.tenantId  // enforced!
});`}</Code>
                </div>
              </div>
              <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                <p className="text-xs font-semibold text-violet-700 mb-1">Collections with tenantId isolation:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['Booking', 'Customer', 'Departure', 'Trek', 'Invoice', 'Payment', 'Refund', 'Campaign', 'Notification', 'ChatMessage', 'LiveTrek'].map(m => (
                    <code key={m} className="bg-white border border-violet-200 text-violet-700 text-xs px-2 py-0.5 rounded-lg">{m}</code>
                  ))}
                </div>
              </div>
            </DocSection>

            {/* ── AUTHENTICATION FLOW ── */}
            <DocSection title="Authentication Flow" icon={Key} iconColor="bg-amber-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Login sequence</p>
                  <div className="space-y-2">
                    {[
                      ['1', 'User sends phone + password to', 'mutation login(...)'],
                      ['2', 'Resolver finds User by phone, verifies bcrypt hash', ''],
                      ['3', 'Checks Tenant status (active/trial — rejects suspended)', ''],
                      ['4', 'Signs JWT with', '{ userId, tenantId, role } · 7d expiry'],
                      ['5', 'Frontend stores token in localStorage via AuthContext', ''],
                      ['6', 'Apollo adds', 'Authorization: Bearer <token> to every request'],
                      ['7', 'authMiddleware decodes token, sets req.user', ''],
                      ['8', 'Resolver calls requireAuth(context) → gets user object', ''],
                    ].map(([n, a, b]) => (
                      <div key={n} className="flex items-start gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
                        <span className="text-slate-600">{a} <code className="bg-slate-100 px-1 rounded text-slate-800 text-xs">{b}</code></span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">JWT payload structure</p>
                  <Code lang="json" label="Decoded JWT token">{`{
  "userId":   "68a12...",
  "tenantId": "68a09...",   // null for superadmin
  "role":     "admin",      // admin | staff | superadmin
  "iat":      1772229270,
  "exp":      1772834070    // 7 days
}`}</Code>
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide mt-4">Role hierarchy</p>
                  <div className="space-y-2">
                    {[
                      { role: 'superadmin', desc: 'Platform owner only. Can manage all tenants. No tenantId in JWT.', color: 'bg-purple-100 text-purple-700' },
                      { role: 'admin', desc: 'Full access to one tenant. Created when a company registers.', color: 'bg-blue-100 text-blue-700' },
                      { role: 'staff', desc: 'Limited access within a tenant. Future feature.', color: 'bg-slate-100 text-slate-600' },
                    ].map(r => (
                      <div key={r.role} className="flex items-start gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.color} flex-shrink-0`}>{r.role}</span>
                        <span className="text-xs text-slate-500">{r.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DocSection>

            {/* ── FOLDER STRUCTURE ── */}
            <DocSection title="Project Folder Structure" icon={FileCode} iconColor="bg-blue-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Backend — WhatsApp_ChatBot_Trek/</p>
                  <FolderTree items={[
                    'server.js              # Entry point',
                    'app.js                 # Express + middleware setup',
                    'src/',
                    '  seed.js              # Database seeder',
                    '  middleware/',
                    '    auth.js            # JWT verify + requireAuth',
                    '    tenantScope.js     # (future) tenant scoping',
                    '  models/',
                    '    Tenant.js',
                    '    User.js            # bcrypt + notificationPrefs',
                    '    Booking.js         # tenantId indexed',
                    '    Customer.js        # tenantId indexed',
                    '    Departure.js',
                    '    treks.js',
                    '    Invoice.js',
                    '    Payment.js',
                    '    Refund.js',
                    '    Campaign.js',
                    '    Notification.js',
                    '    ChatMessage.js',
                    '    liveTrek.js',
                    '  graphql/',
                    '    index.js           # Schema merge + resolvers',
                    '    auth/              # login, register, me',
                    '    superadmin/        # tenant + user management',
                    '    bookings/',
                    '    customers/',
                    '    departures/',
                    '    treks/',
                    '    finance/',
                    '    campaigns/',
                    '    notifications/',
                    '    chats/',
                    '    liveTreks/',
                    '    dashboard/',
                  ]} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Frontend — TrailDesk/src/</p>
                  <FolderTree items={[
                    'main.jsx               # Apollo + Router setup',
                    'App.jsx                # Routes + auth guards',
                    'index.css              # Tailwind + design tokens',
                    'context/',
                    '  AuthContext.jsx      # JWT state + localStorage',
                    'graphql/',
                    '  queries.js           # All GQL query definitions',
                    '  mutations.js         # All GQL mutation definitions',
                    'components/',
                    '  layout/',
                    '    AppLayout.jsx',
                    '    Sidebar.jsx        # Role-aware navigation',
                    '    TopBar.jsx',
                    'pages/',
                    '  LandingPage.jsx      # Public marketing page',
                    '  LoginPage.jsx        # Sign in + Register tabs',
                    '  DashboardPage.jsx    # Tenant dashboard',
                    '  TreksPage.jsx',
                    '  DeparturesPage.jsx',
                    '  BookingsPage.jsx',
                    '  CustomersPage.jsx',
                    '  FinancePage.jsx',
                    '  MarketingPage.jsx',
                    '  SupportChatPage.jsx',
                    '  SettingsPage.jsx     # Profile + org + notifications',
                    '  SuperAdminPage.jsx   # THIS PAGE — owner only',
                    '  ArchitectureDoc.jsx',
                  ]} />
                </div>
              </div>
            </DocSection>

            {/* ── SUPER ADMIN GRAPHQL REFERENCE ── */}
            <DocSection title="Super Admin GraphQL Reference" icon={GitBranch} iconColor="bg-violet-50">
              <p className="text-sm text-slate-500 mb-4">All queries and mutations below require a valid JWT with <code className="bg-slate-100 px-1 rounded">role: superadmin</code>. Regular tenant admins receive a <code className="bg-slate-100 px-1 rounded">403 Super admin access required</code> error.</p>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Queries</p>
                <GqlRef name="superAdminDashboard" type="query" auth="superadmin"
                  description="Platform-wide KPIs: total tenants, users, bookings, revenue, plan breakdown, top companies, recent signups."
                  returns="SuperAdminDashboard" />
                <GqlRef name="getAllTenants" type="query" auth="superadmin"
                  description="List all registered companies with optional filters."
                  params={[
                    { name: 'status', type: 'String', required: false },
                    { name: 'plan', type: 'String', required: false },
                    { name: 'search', type: 'String', required: false },
                  ]}
                  returns="[TenantDetail!]!" />
                <GqlRef name="getTenantById" type="query" auth="superadmin"
                  params={[{ name: 'id', type: 'ID!', required: true }]}
                  returns="TenantDetail" />
                <GqlRef name="getAllUsers" type="query" auth="superadmin"
                  description="List all users across all tenants."
                  params={[
                    { name: 'tenantId', type: 'ID', required: false },
                    { name: 'role', type: 'String', required: false },
                    { name: 'search', type: 'String', required: false },
                  ]}
                  returns="[AdminUser!]!" />
                <GqlRef name="getPlatformActivityLog" type="query" auth="superadmin"
                  params={[{ name: 'limit', type: 'Int', required: false }]}
                  returns="[ActivityLog!]!" />

                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Mutations</p>
                <GqlRef name="createTenant" type="mutation" auth="superadmin"
                  description="Create a new company + its first admin user in one operation."
                  params={[{ name: 'input', type: 'CreateTenantInput!', required: true }]}
                  returns="TenantDetail!" />
                <GqlRef name="updateTenant" type="mutation" auth="superadmin"
                  params={[
                    { name: 'id', type: 'ID!', required: true },
                    { name: 'input', type: 'UpdateTenantInput!', required: true },
                  ]}
                  returns="TenantDetail!" />
                <GqlRef name="suspendTenant" type="mutation" auth="superadmin"
                  description="Set tenant status to suspended. Customers will see an error on login."
                  params={[
                    { name: 'id', type: 'ID!', required: true },
                    { name: 'reason', type: 'String', required: false },
                  ]}
                  returns="TenantDetail!" />
                <GqlRef name="activateTenant" type="mutation" auth="superadmin"
                  params={[{ name: 'id', type: 'ID!', required: true }]}
                  returns="TenantDetail!" />
                <GqlRef name="deleteTenant" type="mutation" auth="superadmin"
                  description="Permanently deletes tenant and all its users. Data in booking/customer collections is retained for audit."
                  params={[{ name: 'id', type: 'ID!', required: true }]}
                  returns="Boolean!" />
                <GqlRef name="updateTenantPlan" type="mutation" auth="superadmin"
                  description="Change the subscription plan and set licence expiry date."
                  params={[
                    { name: 'id', type: 'ID!', required: true },
                    { name: 'plan', type: 'String!', required: true },
                    { name: 'licenseExpiry', type: 'String', required: false },
                  ]}
                  returns="TenantDetail!" />
                <GqlRef name="createAdminUser" type="mutation" auth="superadmin"
                  description="Add an admin or staff user to an existing tenant."
                  params={[
                    { name: 'tenantId', type: 'ID!', required: true },
                    { name: 'input', type: 'CreateAdminUserInput!', required: true },
                  ]}
                  returns="AdminUser!" />
                <GqlRef name="deleteUser" type="mutation" auth="superadmin"
                  params={[{ name: 'id', type: 'ID!', required: true }]}
                  returns="Boolean!" />
                <GqlRef name="resetUserPassword" type="mutation" auth="superadmin"
                  description="Override any user's password without knowing the old one."
                  params={[
                    { name: 'userId', type: 'ID!', required: true },
                    { name: 'newPassword', type: 'String!', required: true },
                  ]}
                  returns="Boolean!" />
              </div>
            </DocSection>

            {/* ── EXAMPLE PAYLOADS ── */}
            <DocSection title="Example Queries & Payloads" icon={BookOpen} iconColor="bg-slate-50">
              <div className="space-y-4">
                <Code lang="graphql" label="Login as admin">{`mutation {
  login(phone: "9999999999", password: "admin123") {
    token
    user { _id name role tenantId }
  }
}`}</Code>

                <Code lang="graphql" label="Super admin dashboard">{`query {
  superAdminDashboard {
    totalTenants activeTenants suspendedTenants trialTenants
    totalUsers totalBookingsAcrossPlatform totalRevenueAcrossPlatform
    planBreakdown { plan count }
    topTenantsByBookings { tenantId tenantName bookings revenue }
    recentSignups { _id name plan status createdAt }
  }
}`}</Code>

                <Code lang="graphql" label="Create a new company + admin">{`mutation {
  createTenant(input: {
    name: "Summit Treks",
    slug: "summit-treks",
    plan: "pro",
    licenseExpiry: "2027-01-01",
    adminName: "Ravi Kumar",
    adminPhone: "9876543210",
    adminEmail: "ravi@summittreks.com",
    adminPassword: "SecurePass123",
    gst: "27AABCS1429B1ZB",
    website: "https://summittreks.com"
  }) {
    _id name plan status adminEmail
  }
}`}</Code>

                <Code lang="graphql" label="Tenant dashboard (admin user)">{`query {
  getDashboard {
    kpis {
      totalBookings revenue activeTreks totalChats
    }
    recentActivity { type message time }
    alerts { type message }
  }
}`}</Code>

                <Code lang="json" label="Typical JWT Authorization header (send with every request)">{`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}</Code>
              </div>
            </DocSection>

            {/* ── PLANS ── */}
            <DocSection title="Subscription Plans" icon={Crown} iconColor="bg-amber-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    plan: 'free', icon: Package, color: 'border-slate-200 bg-slate-50', hdr: 'bg-slate-100 text-slate-700',
                    features: ['1 admin user', 'Up to 50 bookings/month', 'Basic dashboard', 'WhatsApp chatbot', 'Community support'],
                    limits: 'No finance module, no campaigns'
                  },
                  {
                    plan: 'pro', icon: Zap, color: 'border-blue-200 bg-blue-50', hdr: 'bg-blue-600 text-white',
                    features: ['5 users', 'Unlimited bookings', 'Full finance module', 'Campaign manager', 'Live trek tracking', 'Email support'],
                    limits: 'No custom branding'
                  },
                  {
                    plan: 'enterprise', icon: Crown, color: 'border-purple-200 bg-purple-50', hdr: 'bg-purple-700 text-white',
                    features: ['Unlimited users', 'White-label branding', 'Dedicated support', 'Custom integrations', 'API access', 'Priority SLA'],
                    limits: null
                  },
                ].map(p => (
                  <div key={p.plan} className={`rounded-xl border-2 overflow-hidden ${p.color}`}>
                    <div className={`flex items-center gap-2 px-4 py-3 font-bold text-sm capitalize ${p.hdr}`}>
                      <p.icon className="w-4 h-4" /> {p.plan}
                    </div>
                    <div className="p-4">
                      <ul className="space-y-1 mb-3">
                        {p.features.map(f => <li key={f} className="flex items-center gap-1.5 text-xs text-slate-700"><CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />{f}</li>)}
                      </ul>
                      {p.limits && <p className="text-xs text-slate-400 italic">{p.limits}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </DocSection>

            {/* ── FUTURE ROADMAP ── */}
            <DocSection title="Future Features Roadmap" icon={Star} iconColor="bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="space-y-3">
                {[
                  { phase: 'Phase 3', label: 'Google Sign-In OAuth', status: 'planned', desc: 'One-click login via Google. Requires Google Client ID in .env. Library: @react-oauth/google.' },
                  { phase: 'Phase 3', label: 'Real OTP (SMS)', status: 'planned', desc: 'Replace mock OTP with Twilio / Msg91. Backend: /api/send-otp + /api/verify-otp endpoints.' },
                  { phase: 'Phase 4', label: 'Licence Expiry Enforcement', status: 'planned', desc: 'Auto-suspend tenants whose licenseExpiry has passed. Cron job or check on login.' },
                  { phase: 'Phase 4', label: 'Audit Log Model', status: 'planned', desc: 'Replace in-memory activity log with a real AuditLog MongoDB model storing every mutation.' },
                  { phase: 'Phase 4', label: 'Email Notifications', status: 'planned', desc: 'Send booking confirmations, payment receipts and invoice PDFs via Nodemailer / SendGrid.' },
                  { phase: 'Phase 5', label: 'White-labelling', status: 'future', desc: 'Per-tenant logo, colour palette, and custom subdomain (tenant.traildesk.app).' },
                  { phase: 'Phase 5', label: 'Staff Role + Permissions', status: 'future', desc: 'Granular permissions per staff member — read-only, bookings-only, etc.' },
                  { phase: 'Phase 5', label: 'Billing Integration', status: 'future', desc: 'Razorpay Subscriptions for automatic plan renewals + invoice generation.' },
                  { phase: 'Phase 6', label: 'Mobile App', status: 'future', desc: 'React Native / Expo app sharing the same GraphQL backend.' },
                  { phase: 'Phase 6', label: 'Analytics Dashboard', status: 'future', desc: 'Revenue trends, customer retention, booking funnels — per tenant and platform-wide.' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 mt-0.5 ${item.status === 'planned' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>{item.phase}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${item.status === 'planned' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                          }`}>{item.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DocSection>

            {/* ── MANDATORY FIELDS CHECKLIST ── */}
            <DocSection title="Mandatory Fields Checklist" icon={AlertTriangle} iconColor="bg-red-50">
              <p className="text-sm text-slate-500 mb-4">Every time you add a new collection or feature, these fields <strong>must</strong> be included to maintain multi-tenancy and data integrity.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Model requirements</p>
                  {[
                    ['tenantId', 'ObjectId ref Tenant, index: true', 'critical'],
                    ['timestamps: true', 'Always include in schema options', 'critical'],
                    ['createdAt / updatedAt', 'Auto from timestamps', 'auto'],
                    ['status enum', 'Standard lifecycle states', 'recommended'],
                  ].map(([field, desc, level]) => (
                    <div key={field} className="flex items-start gap-2 text-xs">
                      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${level === 'critical' ? 'bg-red-100 text-red-700' :
                        level === 'auto' ? 'bg-slate-100 text-slate-500' :
                          'bg-amber-100 text-amber-700'
                        }`}>{level}</span>
                      <span><code className="font-mono text-slate-800">{field}</code> — <span className="text-slate-500">{desc}</span></span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Resolver requirements</p>
                  {[
                    ['requireAuth(context)', 'First line of every resolver', 'critical'],
                    ['{ tenantId: user.tenantId }', 'Every find/findOne/findById query', 'critical'],
                    ['findOneAndUpdate with tenantId', 'Mutations — never findByIdAndUpdate alone', 'critical'],
                    ['errorPolicy: all', 'Apollo queries — graceful degradation', 'recommended'],
                  ].map(([field, desc, level]) => (
                    <div key={field} className="flex items-start gap-2 text-xs">
                      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${level === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>{level}</span>
                      <span><code className="font-mono text-slate-800">{field}</code> — <span className="text-slate-500">{desc}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </DocSection>

          </div>
        )}

      </div>

      {/* Create tenant modal */}
      {showCreateTenant && (
        <CreateTenantModal
          onClose={() => setShowCreateTenant(false)}
          onCreated={refetchTenants}
        />
      )}
    </div>
  );
}
