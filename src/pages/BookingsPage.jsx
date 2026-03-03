import { useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import Drawer from '../components/ui/Drawer';
import StatusBadge from '../components/ui/StatusBadge';
import { format } from 'date-fns';
import { Search, Eye, BookOpen, Phone, MapPin, Users, ExternalLink, RefreshCw } from 'lucide-react';

export default function BookingsPage() {
  const { data: bookingsList, loading, error } = useBookings();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const filtered = (bookingsList || []).filter(b => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      (b.txnid || '').toLowerCase().includes(searchLower) ||
      (b.trekName || '').toLowerCase().includes(searchLower) ||
      (b.phone || '').includes(search) ||
      (b.cityName || '').toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: bookingsList?.length || 0,
    paid: bookingsList?.filter(b => b.status === 'paid').length || 0,
    pending: bookingsList?.filter(b => b.status === 'pending').length || 0,
    failed: bookingsList?.filter(b => b.status === 'failed').length || 0,
    revenue: bookingsList?.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.amount || 0), 0) || 0,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
        <span className="ml-2 text-slate-500">Loading bookings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500 font-medium">Failed to load bookings</p>
        <p className="text-sm text-slate-400 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="page-subtitle mt-1">{filtered.length} of {stats.total} bookings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1">Total</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
          <p className="text-xs text-slate-500 mt-1">Paid</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-xs text-slate-500 mt-1">Pending</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">₹{stats.revenue.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Revenue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID, trek, phone, or city..." className="input-field pl-10" />
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
                <th className="table-header">Booking ID</th>
                <th className="table-header">Trek</th>
                <th className="table-header">City</th>
                <th className="table-header">Phone</th>
                <th className="table-header">People</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No bookings found</p>
                  </td>
                </tr>
              )}
              {filtered.map(booking => (
                <tr key={booking._id} className="table-row">
                  <td className="table-cell font-mono text-xs text-slate-500">{booking.txnid?.slice(-10) || booking._id?.slice(-8)}</td>
                  <td className="table-cell">
                    <span className="font-medium text-slate-900">{booking.trekName || 'N/A'}</span>
                  </td>
                  <td className="table-cell text-slate-600">{booking.cityName || '—'}</td>
                  <td className="table-cell">
                    <span className="flex items-center gap-1.5 text-sm">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {booking.phone}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {booking.peopleCount}
                    </span>
                  </td>
                  <td className="table-cell font-medium">₹{(booking.amount || 0).toLocaleString()}</td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="table-cell text-sm text-slate-500">
                    {booking.createdAt ? format(new Date(booking.createdAt), 'MMM dd, yyyy') : '—'}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedBooking(booking)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="View Details">
                        <Eye className="w-4 h-4 text-slate-400" />
                      </button>
                      {booking.paymentLink && (
                        <a href={booking.paymentLink} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Payment Link">
                          <ExternalLink className="w-4 h-4 text-primary-500" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      <Drawer isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Booking Details">
        {selectedBooking && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-slate-400">{selectedBooking.txnid}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusColor(selectedBooking.status)}`}>
                {selectedBooking.status}
              </span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Trek</p>
                  <p className="font-medium text-slate-900">{selectedBooking.trekName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500">City</p>
                  <p className="font-medium text-slate-900 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedBooking.cityName || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Phone</p>
                  <p className="font-medium flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{selectedBooking.phone}</p>
                </div>
                <div>
                  <p className="text-slate-500">People</p>
                  <p className="font-medium flex items-center gap-1"><Users className="w-3.5 h-3.5" />{selectedBooking.peopleCount}</p>
                </div>
                <div>
                  <p className="text-slate-500">Amount</p>
                  <p className="font-medium text-primary-700">₹{(selectedBooking.amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Booked On</p>
                  <p className="font-medium">{selectedBooking.createdAt ? format(new Date(selectedBooking.createdAt), 'PPP') : '—'}</p>
                </div>
              </div>
            </div>
            {selectedBooking.paymentLink && (
              <div>
                <p className="text-sm text-slate-500 mb-2">Payment Link</p>
                <a href={selectedBooking.paymentLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  <ExternalLink className="w-4 h-4" /> Open Payment Link
                </a>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
