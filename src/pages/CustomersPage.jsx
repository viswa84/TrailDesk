import { useState } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { useToast } from '../context/ToastContext';
import { v, validateForm, onlyDigits } from '../utils/validators';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { Search, Plus, Edit, Trash2, Users, Mail, Phone, X } from 'lucide-react';

const emptyCustomer = { name: '', email: '', phone: '', city: '', tags: [] };

export default function CustomersPage() {
  const { data: customersList, loading, error, add: addCustomer, update: updateCustomer, remove: removeCustomer } = useCustomers();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState(emptyCustomer);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});

  const allTags = ['All', ...new Set(customersList.flatMap(c => c.tags))];

  const filtered = customersList.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search);
    const matchesTag = tagFilter === 'All' || (c.tags || []).includes(tagFilter);
    return matchesSearch && matchesTag;
  });

  const handleAdd = () => { setEditingCustomer(null); setFormData(emptyCustomer); setErrors({}); setShowForm(true); };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({ ...customer });
    setErrors({});
    setShowForm(true);
  };

  const handleSave = () => {
    const { valid, errors: errs } = validateForm({
      name: v.required(formData.name, 'Name'),
      email: v.email(formData.email),
      phone: v.phone(formData.phone),
    });
    if (!valid) { setErrors(errs); toast.error('Please fix the form errors'); return; }
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, { ...formData });
      toast.success('Customer updated');
    } else {
      addCustomer({ ...formData });
      toast.success('Customer added');
    }
    setShowForm(false);
    setErrors({});
  };

  const handleDelete = (id) => { removeCustomer(id); setShowDeleteConfirm(null); toast.success('Customer deleted'); };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag) => { setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) }); };

  const fieldClass = (name) => `input-field ${errors[name] ? 'input-error' : ''}`;
  const errMsg = (name) => errors[name] ? <p className="text-xs text-red-500 mt-1">{errors[name]}</p> : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle mt-1">{filtered.length} customers</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Customer</button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="input-field pl-10" />
          </div>
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="select-field sm:w-40">
            {allTags.map(t => <option key={t} value={t}>{t === 'All' ? 'All Tags' : t}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="table-header">Customer</th>
                <th className="table-header">Contact</th>
                <th className="table-header">City</th>
                <th className="table-header">Total Treks</th>
                <th className="table-header">Lifetime Value</th>
                <th className="table-header">Tags</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(customer => (
                <tr key={customer.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-emerald-400 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{customer.name}</p>
                        <p className="text-xs text-slate-400">Since {new Date(customer.joinDate).getFullYear()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-600 flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</p>
                    </div>
                  </td>
                  <td className="table-cell text-slate-600">{customer.city}</td>
                  <td className="table-cell">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">{customer.totalTreks}</span>
                  </td>
                  <td className="table-cell font-semibold text-primary-700">₹{customer.ltv.toLocaleString()}</td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.map(tag => <StatusBadge key={tag} status={tag} />)}
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(customer)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><Edit className="w-4 h-4 text-slate-400" /></button>
                      <button onClick={() => setShowDeleteConfirm(customer.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingCustomer ? 'Edit Customer' : 'Add Customer'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
            <input value={formData.name} onChange={(e) => { setFormData({...formData, name: e.target.value}); if (errors.name) setErrors({...errors, name: null}); }} className={fieldClass('name')} />
            {errMsg('name')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input type="email" value={formData.email} onChange={(e) => { setFormData({...formData, email: e.target.value}); if (errors.email) setErrors({...errors, email: null}); }} className={fieldClass('email')} />
              {errMsg('email')}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
              <input value={formData.phone} onChange={(e) => { setFormData({...formData, phone: onlyDigits(e.target.value, 10)}); if (errors.phone) setErrors({...errors, phone: null}); }} className={fieldClass('phone')} maxLength={10} placeholder="10-digit number" />
              {errMsg('phone')}
            </div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">City</label><input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="input-field" /></div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.tags.map(tag => (
                <span key={tag} className="badge-blue flex items-center gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag..." className="input-field flex-1" />
              <button type="button" onClick={addTag} className="btn-secondary text-sm">Add</button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">{editingCustomer ? 'Save' : 'Add Customer'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Customer" size="sm">
        <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this customer?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">Cancel</button>
          <button onClick={() => handleDelete(showDeleteConfirm)} className="btn-danger">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
