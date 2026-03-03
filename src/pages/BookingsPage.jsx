import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { useBookings } from '../hooks/useBookings';
import { useToast } from '../context/ToastContext';
import { MY_ORGANIZATION } from '../graphql/queries';
import { generateInvoicePDF } from '../utils/invoicePdf';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import StatusBadge from '../components/ui/StatusBadge';
import { format } from 'date-fns';
import { Search, Eye, BookOpen, Phone, Users, Copy, ExternalLink, FileDown } from 'lucide-react';

export default function BookingsPage() {
  const { data: bookingsList, loading, error } = useBookings();
  const { data: orgData } = useQuery(MY_ORGANIZATION);
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const filtered = useMemo(() => {
    return bookingsList.filter(b => {
      const q = search.toLowerCase();
      const matchesSearch =
        (b.txnid || '').toLowerCase().includes(q) ||
        (b.trekName || '').toLowerCase().includes(q) ||
        (b.phone || '').toLowerCase().includes(q) ||
        (b._id || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || (b.status || '').toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [bookingsList, search, statusFilter]);

  const statusMap = {
    paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    failed: { label: 'Failed', color: 'bg-red-50 text-red-700 border-red-200' },
  };

  const getStatusBadge = (status) => {
    const s = statusMap[status] || { label: status, color: 'bg-slate-50 text-slate-600 border-slate-200' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.color}`}>{s.label}</span>;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleDownloadInvoice = (booking) => {
    const org = orgData?.myOrganization || {};
    generateInvoicePDF({
      booking,
      company: {
        name: org.name || '',
        address: org.address || '',
        gst: org.gst || '',
        website: org.website || '',
        logo: org.logo || '',
      },
    });
  };

  const totalRevenue = useMemo(() => {
    return bookingsList.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.amount || 0), 0);
  }, [bookingsList]);

  const paidCount = bookingsList.filter(b => b.status === 'paid').length;
  const pendingCount = bookingsList.filter(b => b.status === 'pending').length;

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl skeleton" />
        <div className="space-y-2"><div className="h-5 w-40 skeleton rounded" /><div className="h-3 w-24 skeleton rounded" /></div>
      </div>
      {[1, 2, 3, 4].map(i => <div key={i} className="card p-6 skeleton rounded-2xl h-20" />)}
    </div>
  );

  if (error) return (
    <div className="card p-8 text-center">
      <p className="text-red-500 font-medium">Failed to load bookings</p>
      <p className="text-sm text-slate-400 mt-1">{error.message}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary-600" /> Bookings</h1>
          <p className="page-subtitle mt-1">{filtered.length} bookings • ₹{totalRevenue.toLocaleString('en-IN')} revenue</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{bookingsList.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Bookings</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-1">Revenue (Paid)</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{paidCount}</p>
          <p className="text-xs text-slate-500 mt-1">Paid</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-slate-500 mt-1">Pending</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID, trek, phone..." className="input-field pl-10" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-field sm:w-40">
            <option value="All">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="table-header">Txn ID</th>
                <th className="table-header">Trek</th>
                <th className="table-header">Phone</th>
                <th className="table-header">People</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(booking => (
                <tr key={booking._id} className="table-row hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedBooking(booking)}>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-primary-600 font-medium">{booking.txnid}</span>
                      <button onClick={(e) => { e.stopPropagation(); copyToClipboard(booking.txnid); }} className="p-0.5 hover:bg-slate-100 rounded">
                        <Copy className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {(booking.trekName || '?').charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900 truncate max-w-[200px]">{booking.trekName}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="flex items-center gap-1 text-sm text-slate-600">
                      <Phone className="w-3 h-3" /> {booking.phone}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="flex items-center gap-1 text-sm">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> {booking.peopleCount}
                    </span>
                  </td>
                  <td className="table-cell font-semibold text-slate-900">₹{(booking.amount || 0).toLocaleString('en-IN')}</td>
                  <td className="table-cell">{getStatusBadge(booking.status)}</td>
                  <td className="table-cell text-sm text-slate-500">{booking.createdAt ? format(new Date(booking.createdAt), 'MMM dd, yyyy') : '—'}</td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="View Details">
                        <Eye className="w-4 h-4 text-slate-400" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(booking); }} className="p-1.5 hover:bg-primary-50 rounded-lg transition-colors" title="Download Invoice">
                        <FileDown className="w-4 h-4 text-primary-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="8" className="text-center py-12 text-slate-400">No bookings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Detail Drawer */}
      <Drawer isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Booking Details">
        {selectedBooking && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-medium text-primary-600">{selectedBooking.txnid}</span>
              {getStatusBadge(selectedBooking.status)}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Trek</p>
                <p className="font-medium text-slate-900">{selectedBooking.trekName}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Phone</p>
                <p className="font-medium text-slate-900 flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedBooking.phone}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Participants</p>
                <p className="font-medium text-slate-900 flex items-center gap-1"><Users className="w-3 h-3" /> {selectedBooking.peopleCount} people</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Amount</p>
                <p className="font-bold text-lg text-primary-700">₹{(selectedBooking.amount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Booked On</p>
                <p className="font-medium text-slate-900">{selectedBooking.createdAt ? format(new Date(selectedBooking.createdAt), 'PPP') : '—'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Price / person</p>
                <p className="font-medium text-slate-700">₹{selectedBooking.peopleCount > 0 ? Math.round(selectedBooking.amount / selectedBooking.peopleCount).toLocaleString('en-IN') : '—'}</p>
              </div>
            </div>

            {/* Payment Link */}
            {selectedBooking.paymentLink && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Payment Link</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-primary-600 break-all flex-1">{selectedBooking.paymentLink}</span>
                  <button onClick={() => copyToClipboard(selectedBooking.paymentLink)} className="p-1.5 hover:bg-white rounded-lg shrink-0" title="Copy link">
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <a href={selectedBooking.paymentLink} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white rounded-lg shrink-0" title="Open link">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              </div>
            )}

            {/* Invoice / Receipt Summary */}
            <div className="bg-gradient-to-br from-primary-50 to-slate-50 rounded-xl p-4 border border-primary-100">
              <h4 className="text-xs uppercase tracking-wider text-primary-600/80 font-semibold mb-3">Receipt Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Trek</span><span className="font-medium">{selectedBooking.trekName}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Participants</span><span className="font-medium">{selectedBooking.peopleCount}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Price per person</span><span className="font-medium">₹{selectedBooking.peopleCount > 0 ? Math.round(selectedBooking.amount / selectedBooking.peopleCount).toLocaleString('en-IN') : '—'}</span></div>
                <div className="border-t border-primary-200/50 pt-2 flex justify-between text-base">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-bold text-primary-700">₹{(selectedBooking.amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Download Invoice Button */}
            <button onClick={() => handleDownloadInvoice(selectedBooking)} className="w-full btn-primary flex items-center justify-center gap-2 py-3">
              <FileDown className="w-4 h-4" /> Download Invoice PDF
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
