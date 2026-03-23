import { useQuery, useMutation } from '@apollo/client/react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GET_ALL_PARTICIPANTS, GET_DEPARTURES } from '../graphql/queries';
import { DELETE_PARTICIPANT } from '../graphql/mutations';
import { format, parseISO } from 'date-fns';
import { Users, Search, Trash2, Phone, CalendarDays, MapPin, ArrowUpRight } from 'lucide-react';

export default function ParticipantsPage() {
    const navigate = useNavigate();
    const { data: partData, loading, refetch } = useQuery(GET_ALL_PARTICIPANTS);
    const { data: depData } = useQuery(GET_DEPARTURES);
    const [deleteParticipant] = useMutation(DELETE_PARTICIPANT);
    const [search, setSearch] = useState('');

    const participants = partData?.getAllParticipants || [];
    const departures = depData?.getDepartures || [];

    // Build lookup maps
    const departureMap = useMemo(() => {
        const map = {};
        departures.forEach(d => { map[d._id] = d; });
        return map;
    }, [departures]);

    // Filter by search
    const filtered = useMemo(() => {
        if (!search.trim()) return participants;
        const q = search.toLowerCase();
        return participants.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.phone.includes(q) ||
            (departureMap[p.departureId]?.trekName || '').toLowerCase().includes(q)
        );
    }, [participants, search, departureMap]);

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this participant?')) return;
        try {
            await deleteParticipant({ variables: { id } });
            refetch();
        } catch (err) {
            console.error('Failed to delete participant:', err);
        }
    };

    const formatPhone = (p) => {
        if (!p) return '—';
        const d = p.replace(/\D/g, '');
        if (d.length > 10) return `+${d.slice(0, d.length - 10)} ${d.slice(-10, -5)} ${d.slice(-5)}`;
        return d;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                    <h1 className="page-title flex items-center gap-2"><Users className="w-6 h-6 text-primary-600" /> Participants</h1>
                    <p className="page-subtitle">{filtered.length} participant{filtered.length !== 1 ? 's' : ''} total</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text" placeholder="Search by name, phone, or trek..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="card p-4">
                    <p className="text-xs text-slate-400 mb-0.5">Total Participants</p>
                    <p className="text-xl font-bold text-slate-900">{participants.length}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-slate-400 mb-0.5">Unique Departures</p>
                    <p className="text-xl font-bold text-slate-900">{new Set(participants.map(p => p.departureId)).size}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-slate-400 mb-0.5">Unique Bookings</p>
                    <p className="text-xl font-bold text-slate-900">{new Set(participants.map(p => p.bookingId)).size}</p>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="card p-8 text-center">
                    <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="card p-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">{search ? 'No participants match your search' : 'No participants yet'}</p>
                    <p className="text-sm text-slate-400 mt-1">Participants are collected via WhatsApp after payment or can be added manually on the departure detail page.</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-160 text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-400 uppercase tracking-wider bg-slate-50/70 border-b border-slate-100">
                                    <th className="px-5 py-3 w-10">#</th>
                                    <th className="px-5 py-3">Name</th>
                                    <th className="px-5 py-3">Phone</th>
                                    <th className="px-5 py-3">Trek / Departure</th>
                                    <th className="px-5 py-3">Booking ID</th>
                                    <th className="px-5 py-3">Added</th>
                                    <th className="px-5 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p, idx) => {
                                    const dep = departureMap[p.departureId];
                                    let dateStr = '';
                                    try { dateStr = format(parseISO(p.createdAt), 'dd/MM/yyyy'); } catch { }

                                    return (
                                        <tr key={p._id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                                            <td className="px-5 py-3 font-medium text-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-xs font-bold text-primary-700 shrink-0">
                                                        {p.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    {p.name}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600 font-mono text-xs flex items-center gap-1">
                                                <Phone className="w-3 h-3 text-slate-400" />
                                                {formatPhone(p.phone)}
                                            </td>
                                            <td className="px-5 py-3">
                                                {dep ? (
                                                    <button
                                                        onClick={() => navigate(`/departures/${dep._id}`)}
                                                        className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                                                    >
                                                        {dep.trekName}
                                                        <ArrowUpRight className="w-3 h-3" />
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-mono">{p.departureId?.slice(-6) || '—'}</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 font-mono text-xs text-slate-500">{p.bookingId?.slice(-8) || '—'}</td>
                                            <td className="px-5 py-3 text-xs text-slate-400">{dateStr}</td>
                                            <td className="px-5 py-3">
                                                <button onClick={() => handleDelete(p._id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Remove">
                                                    <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
