import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_REFERRALS, GET_REFERRAL_SETTINGS } from '../graphql/queries';
import { UPDATE_REFERRAL, UPDATE_REFERRAL_SETTINGS } from '../graphql/mutations';
import { format } from 'date-fns';
import { Gift, ChevronDown, ChevronRight, Users, Pencil, Check, X, ToggleLeft, ToggleRight, Settings } from 'lucide-react';
import { useToast } from '../context/ToastContext';

function ReferralRow({ referral }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    discountAmount: referral.discountAmount,
    maxUses: referral.maxUses,
    active: referral.active,
  });
  const toast = useToast();

  const [updateReferral, { loading: saving }] = useMutation(UPDATE_REFERRAL, {
    refetchQueries: [{ query: GET_REFERRALS }],
  });

  const uses = referral.usedBy || [];

  const startEdit = (e) => {
    e.stopPropagation();
    setForm({
      discountAmount: referral.discountAmount,
      maxUses: referral.maxUses,
      active: referral.active,
    });
    setEditing(true);
    setOpen(true);
  };

  const save = async () => {
    try {
      await updateReferral({
        variables: {
          id: referral._id,
          input: {
            discountAmount: Number(form.discountAmount),
            maxUses: Number(form.maxUses),
            active: !!form.active,
          },
        },
      });
      toast.success('Referral updated');
      setEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update referral');
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={() => setOpen((o) => !o)}>
        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
          <Gift className="w-4 h-4 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 font-mono truncate">{referral.code}</p>
          <p className="text-xs text-slate-400">
            Referrer: 91XXXXX{(referral.referrerPhone || '').slice(-5)} · ₹{referral.discountAmount} off
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end shrink-0">
          <span className="text-sm font-bold text-slate-700">{referral.totalUses}/{referral.maxUses} uses</span>
          <span className={`text-xs font-medium ${referral.active ? 'text-green-600' : 'text-slate-400'}`}>
            {referral.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <button
          onClick={startEdit}
          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors shrink-0"
          title="Edit referral"
        >
          <Pencil className="w-4 h-4" />
        </button>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          {editing && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Edit Referral</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.discountAmount}
                    onChange={(e) => setForm((f) => ({ ...f, discountAmount: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Max uses</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxUses}
                    onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                    className="flex items-center gap-2 px-3 py-2 text-sm"
                  >
                    {form.active
                      ? <ToggleRight className="w-7 h-7 text-green-500" />
                      : <ToggleLeft className="w-7 h-7 text-slate-300" />}
                    <span className={form.active ? 'text-green-600 font-medium' : 'text-slate-400'}>
                      {form.active ? 'Active' : 'Inactive'}
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          )}

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Redeemed by
          </p>
          {uses.length === 0 ? (
            <p className="text-sm text-slate-400">Not used yet.</p>
          ) : (
            <div className="space-y-1.5">
              {uses.map((u, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-200 text-sm">
                  <span className="font-mono text-slate-600">91XXXXX{(u.phone || '').slice(-5)}</span>
                  <span className="text-xs text-slate-400">
                    {u.usedAt ? format(new Date(u.usedAt), 'dd MMM yyyy') : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReferralSettingsCard() {
  const toast = useToast();
  const [form, setForm] = useState({ enabled: true, discountAmount: 200, maxUsesPerCode: 5 });

  useQuery(GET_REFERRAL_SETTINGS, {
    fetchPolicy: 'cache-and-network',
    onCompleted: (d) => {
      if (d?.getReferralSettings) {
        const s = d.getReferralSettings;
        setForm({
          enabled: s.enabled,
          discountAmount: s.discountAmount,
          maxUsesPerCode: s.maxUsesPerCode,
        });
      }
    },
  });

  const [updateSettings, { loading: saving }] = useMutation(UPDATE_REFERRAL_SETTINGS, {
    refetchQueries: [{ query: GET_REFERRAL_SETTINGS }],
  });

  const save = async () => {
    try {
      await updateSettings({
        variables: {
          input: {
            enabled: !!form.enabled,
            discountAmount: Number(form.discountAmount),
            maxUsesPerCode: Number(form.maxUsesPerCode),
          },
        },
      });
      toast.success('Referral settings saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    }
  };

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
          <Settings className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800">Referral Settings</h2>
          <p className="text-xs text-slate-400">Defaults applied to new referral codes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="block text-xs font-medium text-slate-600 mb-1">Referral program</label>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
            className="flex items-center gap-2 py-2"
          >
            {form.enabled
              ? <ToggleRight className="w-8 h-8 text-green-500" />
              : <ToggleLeft className="w-8 h-8 text-slate-300" />}
            <span className={form.enabled ? 'text-green-600 font-medium text-sm' : 'text-slate-400 text-sm'}>
              {form.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </button>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Discount per referral (₹)</label>
          <input
            type="number"
            min="0"
            value={form.discountAmount}
            onChange={(e) => setForm((f) => ({ ...f, discountAmount: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Max uses per code</label>
          <input
            type="number"
            min="1"
            value={form.maxUsesPerCode}
            onChange={(e) => setForm((f) => ({ ...f, maxUsesPerCode: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          <Check className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

export default function ReferralPage() {
  const { data, loading, error } = useQuery(GET_REFERRALS, { fetchPolicy: 'cache-and-network' });
  const referrals = data?.getReferrals || [];

  const totalUses = referrals.reduce((s, r) => s + (r.totalUses || 0), 0);
  const totalDiscount = referrals.reduce((s, r) => s + (r.totalUses || 0) * (r.discountAmount || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Referrals</h1>
        <p className="text-sm text-slate-500 mt-0.5">Customer referral codes and their redemptions</p>
      </div>

      <ReferralSettingsCard />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-2xl font-bold text-slate-900">{referrals.length}</p>
          <p className="text-sm font-medium text-slate-600">Referral Codes</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-bold text-slate-900">{totalUses}</p>
          <p className="text-sm font-medium text-slate-600">Total Redemptions</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-bold text-slate-900">₹{totalDiscount.toLocaleString('en-IN')}</p>
          <p className="text-sm font-medium text-slate-600">Discount Given</p>
        </div>
      </div>

      {loading && referrals.length === 0 && (
        <div className="flex items-center justify-center h-40 text-slate-400">Loading referrals…</div>
      )}
      {error && (
        <div className="card p-6 text-center text-red-500">Failed to load referrals. {error.message}</div>
      )}

      {!loading && referrals.length === 0 && !error ? (
        <div className="card p-10 text-center text-slate-400">
          <Gift className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No referral codes yet. They're generated automatically after a customer's booking is paid.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {referrals.map((r) => <ReferralRow key={r._id} referral={r} />)}
        </div>
      )}
    </div>
  );
}
