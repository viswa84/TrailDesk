import { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { format } from 'date-fns';
import { Search, Plus, Edit, Trash2, Download, FileText, CreditCard, RotateCcw } from 'lucide-react';

export default function FinancePage() {
  const { invoices: invoicesList, payments: paymentsList, refunds: refundsList, loading, error, addInvoice: addInv, updateInvoice: updateInv, removeInvoice: removeInv } = useFinance();
  const [activeTab, setActiveTab] = useState('invoices');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const tabs = [
    { id: 'invoices', label: 'Invoices', icon: FileText, count: invoicesList.length },
    { id: 'payments', label: 'Payments', icon: CreditCard, count: paymentsList.length },
    { id: 'refunds', label: 'Refunds', icon: RotateCcw, count: refundsList.length },
  ];

  const handleAddInvoice = () => {
    setEditingItem(null);
    setFormData({ customerName: '', amount: '', status: 'Sent', dueDate: '' });
    setShowForm(true);
  };

  const handleEditInvoice = (inv) => {
    setEditingItem(inv);
    setFormData({ ...inv, amount: String(inv.amount) });
    setShowForm(true);
  };

  const handleSaveInvoice = () => {
    if (editingItem) {
      updateInv(editingItem.id, { ...formData, amount: Number(formData.amount) });
    } else {
      addInv({ ...formData, amount: Number(formData.amount) });
    }
    setShowForm(false);
  };

  const handleDeleteInvoice = (id) => { removeInv(id); setShowDeleteConfirm(null); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Finance</h1>
          <p className="page-subtitle mt-1">Manage invoices, payments, and refunds</p>
        </div>
        {activeTab === 'invoices' && (
          <button onClick={handleAddInvoice} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Invoice</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${activeTab}...`} className="input-field pl-10" />
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="table-header">Invoice #</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Due Date</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoicesList.filter(i => i.customerName.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase())).map(inv => (
                  <tr key={inv.id} className="table-row">
                    <td className="table-cell font-mono text-xs text-slate-500">{inv.id}</td>
                    <td className="table-cell font-medium text-slate-900">{inv.customerName}</td>
                    <td className="table-cell">{format(new Date(inv.date), 'MMM dd, yyyy')}</td>
                    <td className="table-cell">{format(new Date(inv.dueDate), 'MMM dd, yyyy')}</td>
                    <td className="table-cell font-medium">₹{inv.amount.toLocaleString()}</td>
                    <td className="table-cell"><StatusBadge status={inv.status} /></td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Download PDF"><Download className="w-4 h-4 text-slate-400" /></button>
                        <button onClick={() => handleEditInvoice(inv)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><Edit className="w-4 h-4 text-slate-400" /></button>
                        <button onClick={() => setShowDeleteConfirm(inv.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="table-header">Payment ID</th>
                  <th className="table-header">Invoice</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Method</th>
                  <th className="table-header">Reference</th>
                </tr>
              </thead>
              <tbody>
                {paymentsList.filter(p => p.customerName.toLowerCase().includes(search.toLowerCase())).map(pay => (
                  <tr key={pay.id} className="table-row">
                    <td className="table-cell font-mono text-xs text-slate-500">{pay.id}</td>
                    <td className="table-cell font-mono text-xs text-slate-500">{pay.invoiceId}</td>
                    <td className="table-cell font-medium text-slate-900">{pay.customerName}</td>
                    <td className="table-cell">{format(new Date(pay.date), 'MMM dd, yyyy')}</td>
                    <td className="table-cell font-medium text-emerald-600">+ ₹{pay.amount.toLocaleString()}</td>
                    <td className="table-cell"><span className="badge-blue">{pay.method}</span></td>
                    <td className="table-cell font-mono text-xs text-slate-400">{pay.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refunds Tab */}
      {activeTab === 'refunds' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="table-header">Refund ID</th>
                  <th className="table-header">Booking</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Reason</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {refundsList.filter(r => r.customerName.toLowerCase().includes(search.toLowerCase())).map(ref => (
                  <tr key={ref.id} className="table-row">
                    <td className="table-cell font-mono text-xs text-slate-500">{ref.id}</td>
                    <td className="table-cell font-mono text-xs text-slate-500">{ref.bookingId}</td>
                    <td className="table-cell font-medium text-slate-900">{ref.customerName}</td>
                    <td className="table-cell">{format(new Date(ref.date), 'MMM dd, yyyy')}</td>
                    <td className="table-cell font-medium text-red-600">- ₹{ref.amount.toLocaleString()}</td>
                    <td className="table-cell text-slate-600 text-xs">{ref.reason}</td>
                    <td className="table-cell"><StatusBadge status={ref.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingItem ? 'Edit Invoice' : 'New Invoice'} size="md">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label><input value={formData.customerName || ''} onChange={(e) => setFormData({...formData, customerName: e.target.value})} className="input-field" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label><input type="number" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label><input type="date" value={formData.dueDate || ''} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="input-field" /></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={formData.status || 'Sent'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="select-field">
              <option value="Sent">Sent</option><option value="Paid">Paid</option><option value="Partial">Partial</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSaveInvoice} className="btn-primary">{editingItem ? 'Save' : 'Create Invoice'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Invoice" size="sm">
        <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this invoice?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">Cancel</button>
          <button onClick={() => handleDeleteInvoice(showDeleteConfirm)} className="btn-danger">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
