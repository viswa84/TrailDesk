import { useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import StatusBadge from '../components/ui/StatusBadge';
import { format } from 'date-fns';
import { Search, Plus, Eye, Edit, Trash2, BookOpen, Users, AlertCircle } from 'lucide-react';

const emptyBooking = { customerName: '', trekName: '', departureId: '', amount: '', paymentStatus: 'Unpaid', bookingStatus: 'Pending', participants: [{ name: '', age: '', medical: '' }] };

export default function BookingsPage() {
  const { data: bookingsList, loading, error, add: addBooking, update: updateBooking, remove: removeBooking } = useBookings();
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState(emptyBooking);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const filtered = bookingsList.filter(b => {
    const matchesSearch = b.customerName.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase()) || b.trekName.toLowerCase().includes(search.toLowerCase());
    const matchesPayment = paymentFilter === 'All' || b.paymentStatus === paymentFilter;
    const matchesStatus = statusFilter === 'All' || b.bookingStatus === statusFilter;
    return matchesSearch && matchesPayment && matchesStatus;
  });

  const handleAdd = () => { setEditingBooking(null); setFormData(emptyBooking); setShowForm(true); };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setFormData({ ...booking, amount: String(booking.amount) });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingBooking) {
      updateBooking(editingBooking.id, { ...formData, amount: Number(formData.amount) });
    } else {
      addBooking({ ...formData, amount: Number(formData.amount), date: formData.date || new Date().toISOString().slice(0, 10) });
    }
    setShowForm(false);
  };

  const handleDelete = (id) => { removeBooking(id); setShowDeleteConfirm(null); };

  const addParticipant = () => { setFormData({ ...formData, participants: [...formData.participants, { name: '', age: '', medical: '' }] }); };
  const removeParticipant = (idx) => { setFormData({ ...formData, participants: formData.participants.filter((_, i) => i !== idx) }); };
  const updateParticipant = (idx, field, value) => {
    const updated = [...formData.participants];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData({ ...formData, participants: updated });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="page-subtitle mt-1">{filtered.length} total bookings</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Booking</button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID, name, or trek..." className="input-field pl-10" />
          </div>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="select-field sm:w-40">
            <option value="All">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-field sm:w-40">
            <option value="All">All Status</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="table-header">Booking ID</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Trek</th>
                <th className="table-header">Date</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Payment</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(booking => (
                <tr key={booking.id} className="table-row">
                  <td className="table-cell font-mono text-xs text-slate-500">{booking.id}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {booking.customerName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-slate-900">{booking.customerName}</span>
                    </div>
                  </td>
                  <td className="table-cell text-slate-600">{booking.trekName}</td>
                  <td className="table-cell">{format(new Date(booking.date), 'MMM dd, yyyy')}</td>
                  <td className="table-cell font-medium">₹{booking.amount.toLocaleString()}</td>
                  <td className="table-cell"><StatusBadge status={booking.paymentStatus} /></td>
                  <td className="table-cell"><StatusBadge status={booking.bookingStatus} /></td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedBooking(booking)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4 text-slate-400" /></button>
                      <button onClick={() => handleEdit(booking)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Edit"><Edit className="w-4 h-4 text-slate-400" /></button>
                      <button onClick={() => setShowDeleteConfirm(booking.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Participant Detail Drawer */}
      <Drawer isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Booking Details">
        {selectedBooking && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-slate-400">{selectedBooking.id}</span>
              <StatusBadge status={selectedBooking.bookingStatus} />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-500">Customer</p><p className="font-medium text-slate-900">{selectedBooking.customerName}</p></div>
                <div><p className="text-slate-500">Trek</p><p className="font-medium text-slate-900">{selectedBooking.trekName}</p></div>
                <div><p className="text-slate-500">Date</p><p className="font-medium">{format(new Date(selectedBooking.date), 'PPP')}</p></div>
                <div><p className="text-slate-500">Amount</p><p className="font-medium text-primary-700">₹{selectedBooking.amount.toLocaleString()}</p></div>
                <div><p className="text-slate-500">Payment</p><StatusBadge status={selectedBooking.paymentStatus} /></div>
                <div><p className="text-slate-500">Booked On</p><p className="font-medium">{format(new Date(selectedBooking.bookedOn), 'PPP')}</p></div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Participants ({selectedBooking.participants.length})</h4>
              <div className="space-y-3">
                {selectedBooking.participants.map((p, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-slate-900">{p.name}</span>
                      <span className="text-xs text-slate-500">Age: {p.age}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <AlertCircle className={`w-3 h-3 ${p.medical === 'None' ? 'text-emerald-500' : 'text-amber-500'}`} />
                      <span className={p.medical === 'None' ? 'text-emerald-600' : 'text-amber-600'}>{p.medical}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* CRUD Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingBooking ? 'Edit Booking' : 'New Booking'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label><input value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Trek</label><input value={formData.trekName} onChange={(e) => setFormData({...formData, trekName: e.target.value})} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label><input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Date</label><input type="date" value={formData.date || ''} onChange={(e) => setFormData({...formData, date: e.target.value})} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Payment Status</label>
              <select value={formData.paymentStatus} onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})} className="select-field">
                <option value="Unpaid">Unpaid</option><option value="Partial">Partial</option><option value="Paid">Paid</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Booking Status</label>
              <select value={formData.bookingStatus} onChange={(e) => setFormData({...formData, bookingStatus: e.target.value})} className="select-field">
                <option value="Pending">Pending</option><option value="Confirmed">Confirmed</option><option value="Canceled">Canceled</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">Participants</label>
              <button type="button" onClick={addParticipant} className="text-sm text-primary-600 hover:text-primary-700 font-medium">+ Add Participant</button>
            </div>
            <div className="space-y-3">
              {formData.participants.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-slate-50 rounded-lg p-3">
                  <input value={p.name} onChange={(e) => updateParticipant(idx, 'name', e.target.value)} placeholder="Name" className="input-field flex-1" />
                  <input value={p.age} onChange={(e) => updateParticipant(idx, 'age', e.target.value)} placeholder="Age" className="input-field w-16" type="number" />
                  <input value={p.medical} onChange={(e) => updateParticipant(idx, 'medical', e.target.value)} placeholder="Medical info" className="input-field flex-1" />
                  {formData.participants.length > 1 && (
                    <button onClick={() => removeParticipant(idx)} className="p-2 hover:bg-red-100 rounded-lg mt-0.5"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">{editingBooking ? 'Save' : 'Create Booking'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Booking" size="sm">
        <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this booking?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">Cancel</button>
          <button onClick={() => handleDelete(showDeleteConfirm)} className="btn-danger">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
