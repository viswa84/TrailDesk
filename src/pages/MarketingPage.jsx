import { useState } from 'react';
import { useCampaigns } from '../hooks/useCampaigns';
import { useToast } from '../context/ToastContext';
import { v, validateForm } from '../utils/validators';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { Search, Plus, Edit, Trash2, Megaphone, TrendingUp, DollarSign, Users, Target } from 'lucide-react';

const emptyCampaign = { name: '', platform: 'Google Ads', spend: '', leads: '', conversions: '', status: 'Active', startDate: '', endDate: '' };

export default function MarketingPage() {
  const { data: list, kpis, loading, error, add: addCampaign, update: updateCampaign, remove: removeCampaign } = useCampaigns();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyCampaign);
  const [delId, setDelId] = useState(null);
  const [errors, setErrors] = useState({});

  const filtered = list.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.platform || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalSpend = kpis.totalSpend;
  const totalLeads = kpis.totalLeads;
  const totalConv = kpis.totalConversions;
  const avgROAS = kpis.avgROAS;

  const openAdd = () => { setEditing(null); setFormData(emptyCampaign); setErrors({}); setShowForm(true); };
  const openEdit = (c) => { setEditing(c); setFormData({ ...c, spend: String(c.spend), leads: String(c.leads), conversions: String(c.conversions) }); setErrors({}); setShowForm(true); };

  const save = () => {
    const { valid, errors: errs } = validateForm({
      name: v.required(formData.name, 'Campaign name'),
      spend: v.number(formData.spend, 'Spend'),
      leads: v.number(formData.leads, 'Leads'),
      conversions: v.number(formData.conversions, 'Conversions'),
    });
    if (!valid) { setErrors(errs); toast.error('Please fix the form errors'); return; }
    const spend = Number(formData.spend), leads = Number(formData.leads), conv = Number(formData.conversions);
    const cpl = leads > 0 ? Math.round(spend / leads) : 0;
    const roas = spend > 0 ? Number(((conv * 8500) / spend).toFixed(2)) : 0;
    if (editing) {
      updateCampaign(editing.id, { ...formData, spend, leads, conversions: conv, cpl, roas });
      toast.success('Campaign updated');
    } else {
      addCampaign({ ...formData, spend, leads, conversions: conv, cpl, roas });
      toast.success('Campaign added');
    }
    setShowForm(false);
    setErrors({});
  };

  const fieldClass = (name) => `input-field ${errors[name] ? 'input-error' : ''}`;
  const errMsg = (name) => errors[name] ? <p className="text-xs text-red-500 mt-1">{errors[name]}</p> : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="page-title">Marketing ROI</h1><p className="page-subtitle mt-1">Track campaign performance</p></div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Campaign</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend', val: `₹${(totalSpend/1000).toFixed(0)}K`, icon: DollarSign, bg: 'bg-blue-100', fg: 'text-blue-600' },
          { label: 'Total Leads', val: totalLeads.toLocaleString(), icon: Users, bg: 'bg-emerald-100', fg: 'text-emerald-600' },
          { label: 'Conversions', val: totalConv, icon: Target, bg: 'bg-purple-100', fg: 'text-purple-600' },
          { label: 'Avg. ROAS', val: `${avgROAS}x`, icon: TrendingUp, bg: 'bg-amber-100', fg: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}><s.icon className={`w-5 h-5 ${s.fg}`} /></div>
              <div><p className="text-xs text-slate-500">{s.label}</p><p className="text-lg font-bold text-slate-900">{s.val}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..." className="input-field pl-10" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="table-header">Campaign</th><th className="table-header">Platform</th>
                <th className="table-header">Spend</th><th className="table-header">Leads</th>
                <th className="table-header">CPL</th><th className="table-header">Conv.</th>
                <th className="table-header">ROAS</th><th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="table-cell"><div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><Megaphone className="w-4 h-4 text-purple-600" /></div><span className="font-medium text-slate-900 text-sm">{c.name}</span></div></td>
                  <td className="table-cell"><span className="badge-slate">{c.platform}</span></td>
                  <td className="table-cell font-medium">₹{c.spend.toLocaleString()}</td>
                  <td className="table-cell">{c.leads}</td>
                  <td className="table-cell">₹{c.cpl}</td>
                  <td className="table-cell font-medium">{c.conversions}</td>
                  <td className="table-cell"><span className={`font-semibold ${c.roas >= 3 ? 'text-emerald-600' : c.roas >= 2 ? 'text-amber-600' : 'text-red-600'}`}>{c.roas}x</span></td>
                  <td className="table-cell"><StatusBadge status={c.status} /></td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-slate-100 rounded-lg"><Edit className="w-4 h-4 text-slate-400" /></button>
                      <button onClick={() => setDelId(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Campaign' : 'Add Campaign'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input value={formData.name} onChange={e => { setFormData({...formData, name: e.target.value}); if (errors.name) setErrors({...errors, name: null}); }} className={fieldClass('name')} />
            {errMsg('name')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Platform</label>
              <select value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})} className="select-field">
                {['Google Ads','Facebook','Instagram','YouTube','LinkedIn','Email'].map(p=><option key={p}>{p}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="select-field">
                {['Active','Paused','Completed'].map(s=><option key={s}>{s}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Spend (₹) *</label>
              <input type="number" value={formData.spend} onChange={e => { setFormData({...formData, spend: e.target.value}); if (errors.spend) setErrors({...errors, spend: null}); }} className={fieldClass('spend')} />
              {errMsg('spend')}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Leads *</label>
              <input type="number" value={formData.leads} onChange={e => { setFormData({...formData, leads: e.target.value}); if (errors.leads) setErrors({...errors, leads: null}); }} className={fieldClass('leads')} />
              {errMsg('leads')}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Conversions *</label>
              <input type="number" value={formData.conversions} onChange={e => { setFormData({...formData, conversions: e.target.value}); if (errors.conversions) setErrors({...errors, conversions: null}); }} className={fieldClass('conversions')} />
              {errMsg('conversions')}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          <button onClick={save} className="btn-primary">{editing ? 'Save' : 'Add'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!delId} onClose={() => setDelId(null)} title="Delete Campaign" size="sm">
        <p className="text-sm text-slate-600 mb-4">Delete this campaign?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDelId(null)} className="btn-secondary">Cancel</button>
          <button onClick={() => { removeCampaign(delId); setDelId(null); toast.success('Campaign deleted'); }} className="btn-danger">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
