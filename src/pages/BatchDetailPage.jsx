import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { GET_DEPARTURE, GET_PARTICIPANTS_BY_DEPARTURE, GET_BOARDING_POINTS, GET_TREKS } from '../graphql/queries';
import { CREATE_PARTICIPANT, DELETE_PARTICIPANT, COLLECT_PENDING_PAYMENT, MARK_REFUNDED, UPDATE_DEPARTURE } from '../graphql/mutations';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ArrowLeft, MapPin, Clock, Users, IndianRupee, Phone, User, CalendarDays, FileText, Building2, AlertTriangle, Plus, Trash2, X, Download, Navigation, CreditCard, Copy, ExternalLink, Link2, Edit } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import DatePickerInput from '../components/ui/DatePickerInput';
import FileUpload from '../components/ui/FileUpload';
import { useToast } from '../context/ToastContext';
import { useCities } from '../hooks/useCities';
import { useGuides } from '../hooks/useGuides';
import { v, validateForm } from '../utils/validators';

// ── CityBoardingSection: per-city boarding-point checkbox list ──────────────
function CityBoardingSection({ cityName, cityId, selectedBpIds, onBpToggle }) {
    const { data, loading } = useQuery(GET_BOARDING_POINTS, {
        variables: { cityId },
        skip: !cityId,
    });
    const bpOptions = (data?.getBoardingPoints || []).map(bp => ({ ...bp, id: bp._id }));

    return (
        <div className="mb-3 border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">{cityName}</span>
                {selectedBpIds.length > 0 && (
                    <span className="text-[11px] text-primary-600 font-medium">{selectedBpIds.length} point{selectedBpIds.length !== 1 ? 's' : ''} selected</span>
                )}
            </div>
            {loading ? (
                <div className="px-3 py-2 text-xs text-slate-400">Loading boarding points...</div>
            ) : bpOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-400 italic">No boarding points configured for this city.</div>
            ) : (
                <div className="p-2 space-y-1 max-h-36 overflow-y-auto">
                    {bpOptions.map(bp => {
                        const bpId = bp._id || bp.id;
                        const checked = selectedBpIds.includes(bpId);
                        return (
                            <label key={bpId} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => onBpToggle(bpId, !checked)}
                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-slate-700">{bp.name}</span>
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const emptyEditForm = {
    trekId: '', trekName: '', cityId: '', startDate: '', endDate: '',
    nights: '', days: '', capacity: '', guideId: '', guideName: '', price: '',
    meetingPoint: '', transport: '', itinerary: '', thingsToCarry: '', contact: '',
    imageUrl: '', brochureUrl: '',
    whatsappGroupInviteLink: '', whatsappGroupName: '', status: 'Open', boardingPointIds: [],
    cityPickups: [],
    packages: [],
    acceptPartialPayment: false, partialPaymentAmount: '',
};

export default function BatchDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: depData, loading: depLoading, refetch: refetchDeparture } = useQuery(GET_DEPARTURE, { variables: { id } });
    const { data: partData, loading: partLoading, refetch: refetchParticipants } = useQuery(GET_PARTICIPANTS_BY_DEPARTURE, { variables: { departureId: id } });
    const departure = depData?.getDeparture;
    const { data: bpData } = useQuery(GET_BOARDING_POINTS, {
        variables: { cityId: departure?.cityId },
        skip: !departure?.cityId,
    });
    // Filter to only boarding points assigned to this departure
    const allBoardingPoints = bpData?.getBoardingPoints || [];
    const boardingPoints = departure?.boardingPointIds?.length
        ? allBoardingPoints.filter(bp => departure.boardingPointIds.includes(bp._id))
        : allBoardingPoints;

    // Edit departure dependencies
    const { data: citiesList } = useCities();
    const { guides } = useGuides();
    const { data: treksData } = useQuery(GET_TREKS, { variables: { isActive: true } });
    const treksList = (treksData?.getTreks || []).map(t => ({ ...t, id: t._id }));

    const [createParticipant, { loading: creating }] = useMutation(CREATE_PARTICIPANT);
    const [deleteParticipant] = useMutation(DELETE_PARTICIPANT);
    const [collectPendingPayment, { loading: collecting }] = useMutation(COLLECT_PENDING_PAYMENT);
    const [markRefunded] = useMutation(MARK_REFUNDED);
    const [updateDeparture] = useMutation(UPDATE_DEPARTURE, {
        refetchQueries: [{ query: GET_DEPARTURE, variables: { id } }],
    });

    const [showForm, setShowForm] = useState(false);
    const [bookingMeta, setBookingMeta] = useState({ bookingId: 'new', amount: '', paidAmount: '' });
    const [participants, setParticipants] = useState([{ name: '', phone: '', boardingPointId: '', bloodGroup: '', weight: '' }]);
    const [collectModal, setCollectModal] = useState(null);
    const [collectAmount, setCollectAmount] = useState('');
    const [deleteModal, setDeleteModal] = useState(null); // { participantId, participantName }
    const toast = useToast();

    // Edit departure modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState(emptyEditForm);
    const [editErrors, setEditErrors] = useState({});

    const handleOpenEdit = () => {
        if (!departure) return;
        setEditFormData({
            ...emptyEditForm,
            trekId: departure.trekId || '',
            trekName: departure.trekName || '',
            cityId: departure.cityId || '',
            cityName: departure.cityName || '',
            startDate: departure.startDate || '',
            endDate: departure.endDate || '',
            nights: departure.nights != null ? String(departure.nights) : '',
            days: departure.days != null ? String(departure.days) : '',
            capacity: String(departure.capacity || ''),
            price: String(departure.price || ''),
            guideId: departure.guideId ? String(departure.guideId) : '',
            guideName: departure.guideName || '',
            itinerary: departure.itinerary || '',
            thingsToCarry: departure.thingsToCarry || '',
            contact: departure.contact || '',
            transport: departure.transport || '',
            meetingPoint: departure.meetingPoint || '',
            imageUrl: departure.imageUrl || '',
            brochureUrl: departure.brochureUrl || '',
            whatsappGroupInviteLink: departure.whatsappGroupInviteLink || '',
            whatsappGroupName: departure.whatsappGroupName || '',
            status: departure.status || 'Open',
            boardingPointIds: departure.boardingPointIds || [],
            cityPickups: (departure.cityPickups && departure.cityPickups.length > 0)
                ? departure.cityPickups.map(cp => ({
                    cityId: cp.cityId,
                    boardingPointIds: (cp.boardingPoints || []).map(bp => bp._id),
                }))
                : (departure.cityId ? [{ cityId: departure.cityId, boardingPointIds: departure.boardingPointIds || [] }] : []),
            packages: (departure.packages || []).map(p => ({
                name: p.name || '',
                price: String(p.price ?? ''),
                inclusions: (p.inclusions || []).join('\n'),
                cityIds: (p.cityIds || []),
            })),
            acceptPartialPayment: departure.acceptPartialPayment || false,
            partialPaymentAmount: departure.partialPaymentAmount != null ? String(departure.partialPaymentAmount) : '',
        });
        setEditErrors({});
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        let { valid, errors: errs } = validateForm({
            trekName: v.required(editFormData.trekName || editFormData.trekId, 'Trek'),
            startDate: v.dateRequired(editFormData.startDate, 'Start date'),
            endDate: v.dateRequired(editFormData.endDate, 'End date'),
        });
        if (valid && editFormData.startDate && editFormData.endDate && new Date(editFormData.startDate) > new Date(editFormData.endDate)) {
            errs.endDate = 'End date must be after or equal to start date';
            valid = false;
        }
        if (!valid) { setEditErrors(errs); toast.error('Please fix the form errors'); return; }

        const trek = treksList.find(t => String(t.id || t._id) === String(editFormData.trekId));
        const city = citiesList?.find(c => String(c.id || c._id) === String(editFormData.cityId));
        const nightsNum = parseInt(editFormData.nights, 10) || 0;
        const daysNum = parseInt(editFormData.days, 10) || 0;
        const saveData = {
            trekName: trek?.name || editFormData.trekName || '',
            cityId: editFormData.cityId || undefined,
            cityName: city?.name || editFormData.cityName || '',
            startDate: editFormData.startDate,
            endDate: editFormData.endDate,
            nights: nightsNum,
            days: daysNum,
            duration: `${nightsNum} Night${nightsNum !== 1 ? 's' : ''} / ${daysNum} Day${daysNum !== 1 ? 's' : ''}`,
            capacity: parseInt(editFormData.capacity, 10),
            price: parseFloat(editFormData.price),
            itinerary: editFormData.itinerary || undefined,
            thingsToCarry: editFormData.thingsToCarry || undefined,
            contact: editFormData.contact || undefined,
            meetingPoint: editFormData.meetingPoint || undefined,
            transport: editFormData.transport?.trim() || undefined,
            imageUrl: editFormData.imageUrl || undefined,
            brochureUrl: editFormData.brochureUrl || undefined,
            guideId: editFormData.guideId || undefined,
            guideName: editFormData.guideName || undefined,
            status: editFormData.status,
            whatsappGroupInviteLink: editFormData.whatsappGroupInviteLink?.trim() || undefined,
            whatsappGroupName: editFormData.whatsappGroupName?.trim() || undefined,
            boardingPointIds: editFormData.boardingPointIds || [],
            cityPickups: (editFormData.cityPickups || [])
                .filter(cp => cp.cityId)
                .map(cp => ({ cityId: cp.cityId, boardingPointIds: cp.boardingPointIds || [] })),
            packages: (editFormData.packages || [])
                .filter(p => p.name.trim() && p.price !== '')
                .map(p => ({
                    name: p.name.trim(),
                    price: parseFloat(p.price),
                    inclusions: p.inclusions.split('\n').map(s => s.trim()).filter(Boolean),
                    cityIds: (p.cityIds || []),
                })),
            acceptPartialPayment: !!editFormData.acceptPartialPayment,
            partialPaymentAmount: editFormData.acceptPartialPayment && editFormData.partialPaymentAmount !== ''
                ? parseFloat(editFormData.partialPaymentAmount)
                : null,
        };

        try {
            await updateDeparture({ variables: { id, input: saveData } });
            toast.success('Departure updated successfully');
            setShowEditModal(false);
            setEditErrors({});
            refetchDeparture();
        } catch (err) {
            toast.error(err.message || 'Failed to update departure');
        }
    };

    const editFieldClass = (name) => `input-field ${editErrors[name] ? 'input-error' : ''}`;
    const editErrMsg = (name) => editErrors[name] ? <p className="text-xs text-red-500 mt-1">{editErrors[name]}</p> : null;

    const addParticipantRow = () => setParticipants(prev => [...prev, { name: '', phone: '', boardingPointId: '', bloodGroup: '', weight: '' }]);
    const removeParticipantRow = (idx) => setParticipants(prev => prev.filter((_, i) => i !== idx));
    const updateParticipantRow = (idx, field, value) =>
        setParticipants(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));

    const resetForm = () => {
        setParticipants([{ name: '', phone: '', boardingPointId: '', bloodGroup: '', weight: '' }]);
        setBookingMeta({ bookingId: 'new', amount: '', paidAmount: '' });
        setShowForm(false);
    };

    const handleAddParticipants = async () => {
        const valid = participants.filter(p => p.name.trim() && p.phone.trim());
        if (valid.length === 0) return;

        try {
            let createdBookingId = bookingMeta.bookingId;
            const isNew = createdBookingId === 'new';

            for (let i = 0; i < valid.length; i++) {
                const p = valid[i];
                const variables = {
                    departureId: id,
                    bookingId: createdBookingId,
                    name: p.name.trim(),
                    phone: p.phone.trim(),
                };
                if (p.boardingPointId) {
                    const bp = boardingPoints.find(b => b._id === p.boardingPointId);
                    variables.boardingPointId = p.boardingPointId;
                    if (bp) variables.boardingPointName = bp.name;
                }
                if (p.bloodGroup) variables.bloodGroup = p.bloodGroup;
                if (p.weight) variables.weight = parseFloat(p.weight);
                if (i === 0 && isNew) {
                    if (bookingMeta.amount) variables.amount = parseFloat(bookingMeta.amount);
                    if (bookingMeta.paidAmount !== '') variables.paidAmount = parseFloat(bookingMeta.paidAmount);
                    variables.peopleCount = valid.length;
                }
                const result = await createParticipant({ variables });
                // After first new-booking call, capture the bookingId for subsequent participants
                if (i === 0 && isNew) {
                    createdBookingId = result.data.createParticipant.bookingId;
                }
            }
            resetForm();
            refetchParticipants();
        } catch (err) {
            console.error('Failed to add participants:', err);
        }
    };

    const bookingsWithParticipants = partData?.getParticipantsByDeparture || [];
    const totalParticipants = bookingsWithParticipants.reduce((sum, b) => sum + b.participants.length, 0);
    const totalBookings = bookingsWithParticipants.length;
    const totalCollected = bookingsWithParticipants.reduce((sum, b) => {
        const paid = b.status === 'paid' && (b.paidAmount || 0) === 0 ? b.amount : (b.paidAmount || 0);
        return sum + paid;
    }, 0);
    const totalRefundDue = bookingsWithParticipants.reduce((sum, b) => sum + (b.refundDue || 0), 0);
    const netRevenue = totalCollected - totalRefundDue;

    const handleCollectPayment = async () => {
        if (!collectAmount || !collectModal) return;
        try {
            await collectPendingPayment({ variables: { bookingId: collectModal.bookingId, amount: parseFloat(collectAmount) } });
            setCollectModal(null);
            setCollectAmount('');
            refetchParticipants();
        } catch (err) {
            console.error('Failed to collect payment:', err);
        }
    };

    const handleDeleteParticipant = (participantId, participantName) => {
        setDeleteModal({ participantId, participantName });
    };

    const confirmDeleteParticipant = async () => {
        if (!deleteModal) return;
        try {
            await deleteParticipant({ variables: { id: deleteModal.participantId } });
            setDeleteModal(null);
            refetchParticipants();
            refetchDeparture();
        } catch (err) {
            console.error('Failed to delete participant:', err);
        }
    };

    if (depLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!departure) {
        return (
            <div className="text-center py-20">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="text-slate-500">Departure not found</p>
                <button onClick={() => navigate('/departures')} className="btn-primary mt-4">Back to Departures</button>
            </div>
        );
    }

    let startStr = '', endStr = '', duration = departure.duration || '';
    try {
        const s = parseISO(departure.startDate);
        const e = parseISO(departure.endDate);
        startStr = format(s, 'dd/MM/yyyy');
        endStr = format(e, 'dd/MM/yyyy');
        if (departure.nights || departure.days) {
            duration = `${departure.nights || 0}N / ${departure.days || 0}D`;
        } else if (!duration) {
            duration = `${differenceInDays(e, s) + 1} Days`;
        }
    } catch { }

    const occupancyRatio = departure.booked / departure.capacity;
    const occupancyColor = occupancyRatio >= 1 ? 'text-red-600' : occupancyRatio >= 0.85 ? 'text-amber-600' : 'text-emerald-600';
    const barColor = occupancyRatio >= 1 ? 'bg-red-500' : occupancyRatio >= 0.85 ? 'bg-amber-500' : 'bg-primary-500';

    const formatPhone = (p) => {
        if (!p) return '—';
        const d = p.replace(/\D/g, '');
        if (d.length > 10) return `+${d.slice(0, d.length - 10)} ${d.slice(-10, -5)} ${d.slice(-5)}`;
        return d;
    };

    const bookingSlug = departure.uniqueId || departure._id;
    const PUBLIC_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080/').replace(/\/$/, '');
    const bookingUrl = `${PUBLIC_BASE}/book/${bookingSlug}`;
    const trekBookingUrl = departure.trekId ? `${PUBLIC_BASE}/book/trek/${departure.trekId}` : null;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/departures')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        {departure.uniqueId && <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">{departure.uniqueId}</span>}
                        <h1 className="page-title">{departure.trekName}</h1>
                        <StatusBadge status={departure.status} />
                    </div>
                    <p className="page-subtitle mt-0.5 flex items-center gap-2 flex-wrap">
                        {(departure.cityPickups && departure.cityPickups.length > 0
                            ? departure.cityPickups.map(cp => cp.cityName).join(', ')
                            : departure.cityName
                          ) && (
                            <><Building2 className="w-3.5 h-3.5" /> From: {departure.cityPickups && departure.cityPickups.length > 0
                              ? departure.cityPickups.map(cp => cp.cityName).join(', ')
                              : departure.cityName}</>
                          )}
                        {startStr && <><span className="text-slate-300">•</span><CalendarDays className="w-3.5 h-3.5" /> {startStr} → {endStr}</>}
                    </p>
                </div>
                <button
                    onClick={handleOpenEdit}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium cursor-pointer shrink-0"
                    title="Edit this departure"
                >
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                    onClick={() => navigate('/departures', { state: { duplicateFrom: departure } })}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors text-sm font-medium cursor-pointer shrink-0"
                    title="Duplicate this departure"
                >
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Duplicate</span>
                </button>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="card p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1"><Clock className="w-3.5 h-3.5" /> Duration</div>
                    <p className="text-sm font-bold text-slate-800">{duration}</p>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1"><IndianRupee className="w-3.5 h-3.5" /> Price</div>
                    {departure.packages?.length > 0 ? (
                      <div className="space-y-0.5">
                        {departure.packages.map((pkg, i) => (
                          <p key={i} className="text-xs font-bold text-slate-800">{pkg.name}: ₹{pkg.price?.toLocaleString()}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-slate-800">₹{departure.price?.toLocaleString()}</p>
                    )}
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1"><Users className="w-3.5 h-3.5" /> Occupancy</div>
                    <p className={`text-sm font-bold ${occupancyColor}`}>{departure.booked}/{departure.capacity}</p>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(occupancyRatio * 100, 100)}%` }} />
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1"><User className="w-3.5 h-3.5" /> Guide</div>
                    <p className="text-sm font-bold text-slate-800">{departure.guideName || 'Not Assigned'}</p>
                </div>
            </div>

            {/* Booking Link */}
            <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Link2 className="w-4 h-4 text-primary-500" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Booking Link</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                    <span className="flex-1 font-mono text-sm text-primary-700 truncate">{bookingUrl}</span>
                    <button
                        onClick={() => { navigator.clipboard.writeText(bookingUrl); toast.success('Link copied!'); }}
                        className="p-1.5 hover:bg-white rounded-lg shrink-0 transition-colors"
                        title="Copy link"
                    >
                        <Copy className="w-4 h-4 text-slate-400" />
                    </button>
                    <a
                        href={bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-white rounded-lg shrink-0 transition-colors"
                        title="Open in new tab"
                    >
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                    </a>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">Share this link with customers to let them book online for <strong>this specific departure only</strong>.</p>
            </div>

            {/* Trek-wide booking link — all departures, customer chooses the date */}
            {trekBookingUrl && (
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-primary-500" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Share Entire Trek Page (All Dates)
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <span className="flex-1 font-mono text-sm text-primary-700 truncate">{trekBookingUrl}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(trekBookingUrl); toast.success('Link copied!'); }}
                    className="p-1.5 hover:bg-white rounded-lg shrink-0 transition-colors"
                    title="Copy link"
                  >
                    <Copy className="w-4 h-4 text-slate-400" />
                  </button>
                  <a
                    href={trekBookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-white rounded-lg shrink-0 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Use this when you want the customer to <strong>choose any upcoming date</strong> for this trek — not just this single departure. The booking page lists every open departure and lets them pick.
                </p>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {departure.itinerary && (
                    <div className="card p-5">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Itinerary</h3>
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{departure.itinerary}</p>
                    </div>
                )}
                {departure.thingsToCarry && (
                    <div className="card p-5">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Things to Carry</h3>
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{departure.thingsToCarry}</p>
                    </div>
                )}
                {(departure.meetingPoint || departure.transport || departure.contact || departure.whatsappGroupInviteLink) && (
                    <div className="card p-5">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Logistics</h3>
                        {departure.meetingPoint && <div className="flex items-center gap-2 text-sm text-slate-700 mb-2"><MapPin className="w-4 h-4 text-slate-400" /> Meeting: {departure.meetingPoint}</div>}
                        {departure.transport && <div className="flex items-center gap-2 text-sm text-slate-700 mb-2"><Navigation className="w-4 h-4 text-slate-400" /> Transport: {departure.transport}</div>}
                        {departure.contact && <div className="flex items-center gap-2 text-sm text-slate-700 mb-2"><Phone className="w-4 h-4 text-slate-400" /> Contact: {departure.contact}</div>}
                        {departure.whatsappGroupInviteLink && (
                            <div className="text-sm text-slate-700">
                                <div className="flex items-center gap-2 mb-1">
                                    <Navigation className="w-4 h-4 text-slate-400" />
                                    <span>WhatsApp Group{departure.whatsappGroupName ? `: ${departure.whatsappGroupName}` : ''}</span>
                                </div>
                                <a
                                    href={departure.whatsappGroupInviteLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary-600 underline break-all pl-6 hover:text-primary-700"
                                >
                                    {departure.whatsappGroupInviteLink}
                                </a>
                            </div>
                        )}
                    </div>
                )}
                {(departure.imageUrl || departure.brochureUrl) && (
                    <div className="card p-5">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Assets</h3>
                        <div className="space-y-3">
                            {departure.imageUrl && (
                                <div>
                                    <p className="text-xs text-slate-400 mb-2">Departure Image</p>
                                    <a href={departure.imageUrl} target="_blank" rel="noreferrer" className="block">
                                        <img
                                            src={departure.imageUrl}
                                            alt={departure.trekName || 'Departure'}
                                            className="w-full h-44 object-cover rounded-xl border border-slate-200"
                                        />
                                    </a>
                                </div>
                            )}
                            {departure.brochureUrl && (
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-400">Brochure</p>
                                        <p className="text-sm font-medium text-slate-700 truncate">Open uploaded PDF brochure</p>
                                    </div>
                                    <a
                                        href={departure.brochureUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-primary-700 border border-slate-200 hover:bg-slate-100"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Open
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Participants Section */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-600" />
                        Participants
                        <span className="text-sm font-normal text-slate-400">({totalParticipants} people across {totalBookings} booking{totalBookings !== 1 ? 's' : ''})</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <a
                            href={`${import.meta.env.VITE_API_URL || ''}/api/participants/export/${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary flex items-center gap-1.5 text-sm px-3 py-1.5 no-underline cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            Excel
                        </a>
                        <button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }} className="btn-primary flex items-center gap-1.5 text-sm px-3 py-1.5 cursor-pointer">
                            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {showForm ? 'Cancel' : 'Add Participant'}
                        </button>
                    </div>
                </div>

                {/* Add Participants Form */}
                {showForm && (
                    <div className="card p-4 mb-4 border-primary-200 bg-primary-50/30 animate-scale-in">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Participants</h3>

                        {/* Booking selector */}
                        <div className="mb-3">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Booking</label>
                            <select
                                value={bookingMeta.bookingId}
                                onChange={(e) => setBookingMeta({ ...bookingMeta, bookingId: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            >
                                <option value="new">Create New Booking</option>
                                {bookingsWithParticipants.map(b => (
                                    <option key={b.bookingId} value={b.bookingId}>Add to {b.txnid} — {b.peopleCount} people</option>
                                ))}
                            </select>
                        </div>

                        {/* Payment fields (only for new booking) */}
                        {bookingMeta.bookingId === 'new' && (() => {
                            const totalAmt = bookingMeta.amount !== '' ? parseFloat(bookingMeta.amount) : (departure?.price || 0) * participants.filter(p => p.name.trim()).length || (departure?.price || 0);
                            const paidAmt = bookingMeta.paidAmount !== '' ? parseFloat(bookingMeta.paidAmount) : totalAmt;
                            const pendingAmt = Math.max(totalAmt - paidAmt, 0);
                            const isPartial = pendingAmt > 0;
                            return (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 animate-fade-in">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Total Amount (₹)</label>
                                        <input
                                            type="number" placeholder={(departure?.price || 0).toString()}
                                            value={bookingMeta.amount}
                                            onChange={(e) => setBookingMeta({ ...bookingMeta, amount: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Amount Paid Now (₹)</label>
                                        <input
                                            type="number" placeholder={totalAmt.toString()}
                                            value={bookingMeta.paidAmount}
                                            onChange={(e) => setBookingMeta({ ...bookingMeta, paidAmount: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Pending</label>
                                        <div className={`px-3 py-2 text-sm rounded-lg font-semibold ${isPartial ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                            {isPartial ? `₹${pendingAmt.toLocaleString()} pending` : '✓ Fully paid'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Participant rows */}
                        <div className="space-y-2 mb-3">
                            {participants.map((p, idx) => (
                                <div key={idx} className="animate-fade-in">
                                    <div className="flex items-start gap-2">
                                        <span className="text-xs text-slate-400 font-mono w-5 shrink-0 text-center pt-2.5">{idx + 1}</span>
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <input
                                                type="text" placeholder="Full Name *"
                                                value={p.name}
                                                onChange={(e) => updateParticipantRow(idx, 'name', e.target.value)}
                                                className="sm:col-span-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            />
                                            <input
                                                type="text" placeholder="Phone *" maxLength={10}
                                                value={p.phone}
                                                onChange={(e) => updateParticipantRow(idx, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                className="sm:col-span-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            />
                                            {boardingPoints.length > 0 ? (
                                                <select
                                                    value={p.boardingPointId}
                                                    onChange={(e) => updateParticipantRow(idx, 'boardingPointId', e.target.value)}
                                                    className="sm:col-span-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                >
                                                    <option value="">Boarding Point (optional)</option>
                                                    {boardingPoints.map(bp => (
                                                        <option key={bp._id} value={bp._id}>{bp.name}</option>
                                                    ))}
                                                </select>
                                            ) : <div className="hidden sm:block" />}
                                            <select
                                                value={p.bloodGroup}
                                                onChange={(e) => updateParticipantRow(idx, 'bloodGroup', e.target.value)}
                                                className="sm:col-span-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            >
                                                <option value="">Blood Group (optional)</option>
                                                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                                                    <option key={bg} value={bg}>{bg}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number" placeholder="Weight kg (optional)" min={20} max={250}
                                                value={p.weight}
                                                onChange={(e) => updateParticipantRow(idx, 'weight', e.target.value)}
                                                className="sm:col-span-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            />
                                        </div>
                                        {participants.length > 1 && (
                                            <button onClick={() => removeParticipantRow(idx)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0 mt-1" title="Remove">
                                                <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add row + Submit */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={addParticipantRow}
                                className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors cursor-pointer"
                            >
                                <Plus className="w-4 h-4" /> Add another participant
                            </button>
                            <button
                                onClick={handleAddParticipants}
                                disabled={participants.every(p => !p.name.trim() || !p.phone.trim()) || creating}
                                className="btn-primary text-sm px-4 py-1.5 disabled:opacity-50 cursor-pointer"
                            >
                                {creating ? 'Saving...' : `Add ${participants.filter(p => p.name.trim() && p.phone.trim()).length || ''} Participant${participants.filter(p => p.name.trim() && p.phone.trim()).length !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                )}

                {/* Revenue Summary */}
            {!partLoading && bookingsWithParticipants.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="card p-3.5">
                        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Total Collected</div>
                        <p className="text-base font-bold text-emerald-600">₹{totalCollected.toLocaleString()}</p>
                    </div>
                    <div className="card p-3.5">
                        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Refund Due</div>
                        <p className={`text-base font-bold ${totalRefundDue > 0 ? 'text-blue-600' : 'text-slate-400'}`}>₹{totalRefundDue.toLocaleString()}</p>
                    </div>
                    <div className="card p-3.5">
                        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Net Revenue</div>
                        <p className="text-base font-bold text-slate-800">₹{netRevenue.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Bookings list */}
            {partLoading ? (
                    <div className="card p-8 text-center">
                        <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
                    </div>
                ) : bookingsWithParticipants.length === 0 ? (
                    <div className="card p-8 text-center">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No bookings with participants yet</p>
                        <p className="text-xs text-slate-400 mt-1">Use the "Add Participant" button to add participants manually</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bookingsWithParticipants.map((booking, idx) => {
                            let bookingDate = '';
                            try { bookingDate = format(parseISO(booking.createdAt), 'dd/MM/yyyy HH:mm'); } catch { }
                            const isPartial = booking.status === 'partial' || (booking.pendingAmount > 0);
                            const hasRefund = (booking.refundDue ?? 0) > 0;

                            return (
                                <div key={booking.bookingId} className="card overflow-hidden" style={{ animationDelay: `${idx * 60}ms` }}>
                                    {/* Booking header */}
                                    <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-1">
                                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary-50 text-primary-700 font-semibold">{booking.txnid}</span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {formatPhone(booking.phone)}</span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" /> {booking.peopleCount} people</span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Total: ₹{booking.amount?.toLocaleString()}</span>
                                        {isPartial ? (
                                            <>
                                                <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">Paid: ₹{(booking.paidAmount ?? 0).toLocaleString()}</span>
                                                <span className="text-xs text-amber-600 flex items-center gap-1 font-medium">Pending: ₹{(booking.pendingAmount ?? 0).toLocaleString()}</span>
                                            </>
                                        ) : null}
                                        <StatusBadge status={booking.status === 'paid' ? 'Paid' : booking.status === 'partial' ? 'Partial' : booking.status} />
                                        {hasRefund && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200">
                                                ↩ Refund Due: ₹{booking.refundDue.toLocaleString()}
                                            </span>
                                        )}
                                        {isPartial && (
                                            <button
                                                onClick={() => { setCollectModal({ bookingId: booking.bookingId, txnid: booking.txnid, pendingAmount: booking.pendingAmount }); setCollectAmount(String(booking.pendingAmount ?? '')); }}
                                                className="ml-auto flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
                                            >
                                                <CreditCard className="w-3.5 h-3.5" /> Collect ₹{(booking.pendingAmount ?? 0).toLocaleString()}
                                            </button>
                                        )}
                                        {!isPartial && !hasRefund && bookingDate && <span className="text-[11px] text-slate-400 ml-auto">{bookingDate}</span>}
                                        {isPartial && bookingDate && <span className="text-[11px] text-slate-400">{bookingDate}</span>}
                                        {hasRefund && !isPartial && (
                                            <button
                                                onClick={async () => { await markRefunded({ variables: { bookingId: booking.bookingId } }); refetchParticipants(); }}
                                                className="ml-auto flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors cursor-pointer"
                                            >
                                                ✓ Mark Refunded
                                            </button>
                                        )}
                                        {hasRefund && isPartial && bookingDate && <span className="text-[11px] text-slate-400">{bookingDate}</span>}
                                    </div>

                                    {/* Participants table */}
                                    {booking.participants.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                                                        <th className="px-5 py-2.5 w-10">#</th>
                                                        <th className="px-5 py-2.5">Name</th>
                                                        <th className="px-5 py-2.5">Phone</th>
                                                        <th className="px-5 py-2.5">Blood Group</th>
                                                        <th className="px-5 py-2.5">Weight</th>
                                                        <th className="px-5 py-2.5">Boarding Point</th>
                                                        <th className="px-5 py-2.5 w-12"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {booking.participants.map((p, pIdx) => (
                                                        <tr key={p._id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-5 py-2.5 text-slate-400 font-mono text-xs">{pIdx + 1}</td>
                                                            <td className="px-5 py-2.5 font-medium text-slate-800">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-xs font-bold text-primary-700 shrink-0">
                                                                        {p.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    {p.name}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-2.5 text-slate-600 font-mono text-xs">{formatPhone(p.phone)}</td>
                                                            <td className="px-5 py-2.5 text-slate-600 text-xs">
                                                                {p.bloodGroup ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] font-semibold border border-red-200">
                                                                        🩸 {p.bloodGroup}
                                                                    </span>
                                                                ) : <span className="text-slate-300">—</span>}
                                                            </td>
                                                            <td className="px-5 py-2.5 text-slate-600 text-xs">
                                                                {p.weight ? (
                                                                    <span className="text-slate-700 font-medium">{p.weight} kg</span>
                                                                ) : <span className="text-slate-300">—</span>}
                                                            </td>
                                                            <td className="px-5 py-2.5 text-slate-600 text-xs">
                                                                {p.boardingPointName ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[11px] font-medium">
                                                                        <Navigation className="w-3 h-3" />{p.boardingPointName}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-300">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-2.5">
                                                                <button onClick={() => handleDeleteParticipant(p._id, p.name)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Remove">
                                                                    <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="px-5 py-3 text-xs text-slate-400 italic">Participant details not yet collected</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ──────────────────── EDIT DEPARTURE MODAL ──────────────────── */}
            <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditErrors({}); }} title="Edit Departure" size="lg" confirmOnClose>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Trek *</label>
                        <select value={editFormData.trekId} onChange={(e) => {
                            const selected = treksList.find(t => (t.id || t._id) === e.target.value);
                            setEditFormData({ ...editFormData, trekId: e.target.value, trekName: selected?.name || '' });
                            if (editErrors.trekName) setEditErrors({ ...editErrors, trekName: null });
                        }} className={editFieldClass('trekName')}>
                            <option value="">Select Trek</option>
                            {treksList.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
                        </select>
                        {editErrMsg('trekName')}
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Cities &amp; Boarding Points</label>
                        <p className="text-[11px] text-slate-400 mb-3">Select one or more departure cities. For each city, check the boarding points that apply to this batch.</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {(citiesList || []).map(c => {
                                const cId = c.id || c._id;
                                const isSelected = (editFormData.cityPickups || []).some(cp => cp.cityId === cId);
                                return (
                                    <button
                                        key={cId}
                                        type="button"
                                        onClick={() => {
                                            const picks = editFormData.cityPickups || [];
                                            const already = picks.some(cp => cp.cityId === cId);
                                            const updated = already
                                                ? picks.filter(cp => cp.cityId !== cId)
                                                : [...picks, { cityId: cId, boardingPointIds: [] }];
                                            setEditFormData({ ...editFormData, cityPickups: updated, cityId: updated[0]?.cityId || '' });
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-primary-600 text-white border-primary-600'
                                                : 'bg-white text-slate-600 border-slate-300 hover:border-primary-400'
                                        }`}
                                    >
                                        {c.name}
                                        {isSelected && <span className="ml-1 text-primary-200">✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                        {(editFormData.cityPickups || []).length === 0 && (
                            <p className="text-[11px] text-amber-600 mb-2">Select at least one city above.</p>
                        )}
                        {(editFormData.cityPickups || []).map((cp, cpIdx) => {
                            const city = (citiesList || []).find(c => (c.id || c._id) === cp.cityId);
                            return (
                                <CityBoardingSection
                                    key={cp.cityId}
                                    cityName={city?.name || cp.cityId}
                                    cityId={cp.cityId}
                                    selectedBpIds={cp.boardingPointIds || []}
                                    onBpToggle={(bpId, checked) => {
                                        const picks = [...(editFormData.cityPickups || [])];
                                        const entry = picks[cpIdx];
                                        picks[cpIdx] = {
                                            ...entry,
                                            boardingPointIds: checked
                                                ? [...(entry.boardingPointIds || []), bpId]
                                                : (entry.boardingPointIds || []).filter(bid => bid !== bpId),
                                        };
                                        setEditFormData({ ...editFormData, cityPickups: picks });
                                    }}
                                />
                            );
                        })}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                        <DatePickerInput
                            selected={editFormData.startDate ? new Date(editFormData.startDate) : null}
                            onChange={(date) => {
                                const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
                                let updated = { ...editFormData, startDate: dateStr };
                                if (dateStr && updated.endDate) {
                                    const st = new Date(dateStr);
                                    const en = new Date(updated.endDate);
                                    if (st > en) {
                                        updated.endDate = dateStr;
                                        updated.nights = '0';
                                        updated.days = '1';
                                    } else {
                                        const n = differenceInDays(en, st);
                                        updated.nights = String(n);
                                        updated.days = String(n + 1);
                                    }
                                }
                                setEditFormData(updated);
                                if (editErrors.startDate) setEditErrors({ ...editErrors, startDate: null });
                            }}
                            className={editFieldClass('startDate')}
                        />
                        {editErrMsg('startDate')}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                        <DatePickerInput
                            selected={editFormData.endDate ? new Date(editFormData.endDate) : null}
                            minDate={editFormData.startDate ? new Date(editFormData.startDate) : null}
                            onChange={(date) => {
                                const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
                                let updated = { ...editFormData, endDate: dateStr };
                                if (dateStr && updated.startDate) {
                                    const st = new Date(updated.startDate);
                                    const en = new Date(dateStr);
                                    if (en >= st) {
                                        const n = differenceInDays(en, st);
                                        updated.nights = String(n);
                                        updated.days = String(n + 1);
                                    }
                                }
                                setEditFormData(updated);
                                if (editErrors.endDate) setEditErrors({ ...editErrors, endDate: null });
                            }}
                            className={editFieldClass('endDate')}
                        />
                        {editErrMsg('endDate')}
                    </div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Nights</label><input type="number" min="0" value={editFormData.nights} onChange={(e) => setEditFormData({ ...editFormData, nights: e.target.value })} className="input-field" placeholder="e.g. 2" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Days</label><input type="number" min="0" value={editFormData.days} onChange={(e) => setEditFormData({ ...editFormData, days: e.target.value })} className="input-field" placeholder="e.g. 3" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label><input type="number" value={editFormData.capacity} onChange={(e) => setEditFormData({ ...editFormData, capacity: e.target.value })} className="input-field" placeholder="e.g. 20" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label><input type="number" value={editFormData.price} onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })} className="input-field" placeholder="e.g. 8500" /></div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Guide</label>
                        <select value={editFormData.guideId} onChange={(e) => {
                            const selectedGuide = guides.find(g => (g.id || g._id) === e.target.value);
                            setEditFormData({
                                ...editFormData,
                                guideId: e.target.value,
                                guideName: selectedGuide ? selectedGuide.name : '',
                                contact: (selectedGuide && selectedGuide.phone) ? selectedGuide.phone : editFormData.contact,
                            });
                        }} className="select-field">
                            <option value="">Select Guide</option>
                            {guides.map(g => <option key={g.id || g._id} value={g.id || g._id}>{g.name} - {g.phone}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })} className="select-field">
                            <option value="Open">Open</option>
                            <option value="Almost Full">Almost Full</option>
                            <option value="Full">Full</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Meeting Point</label><input value={editFormData.meetingPoint} onChange={(e) => setEditFormData({ ...editFormData, meetingPoint: e.target.value })} className="input-field" placeholder="e.g. Pune Railway Station" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Transport</label><input value={editFormData.transport || ''} onChange={(e) => setEditFormData({ ...editFormData, transport: e.target.value })} className="input-field" placeholder="e.g. Bus from Pune" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label><input value={editFormData.contact} onChange={(e) => setEditFormData({ ...editFormData, contact: e.target.value.replace(/\D/g, '').slice(0, 10) })} maxLength={10} className="input-field" placeholder="e.g. 9876543210" /></div>
                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FileUpload
                            folder="departures"
                            accept="image"
                            label="Departure Image"
                            value={editFormData.imageUrl || ''}
                            onChange={(url) => setEditFormData({ ...editFormData, imageUrl: url })}
                        />
                        <FileUpload
                            folder="documents"
                            accept="pdf"
                            label="Departure Brochure"
                            value={editFormData.brochureUrl || ''}
                            onChange={(url) => setEditFormData({ ...editFormData, brochureUrl: url })}
                        />
                    </div>
                    <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Group Invite Link</label><input value={editFormData.whatsappGroupInviteLink || ''} onChange={(e) => setEditFormData({ ...editFormData, whatsappGroupInviteLink: e.target.value })} className="input-field" placeholder="https://chat.whatsapp.com/xxxxxxxxxxxx" /></div>
                    <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Group Name (optional)</label><input value={editFormData.whatsappGroupName || ''} onChange={(e) => setEditFormData({ ...editFormData, whatsappGroupName: e.target.value })} className="input-field" placeholder="e.g. Harishchandragad Batch 12 Apr" /></div>
                    <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Itinerary</label><textarea value={editFormData.itinerary} onChange={(e) => setEditFormData({ ...editFormData, itinerary: e.target.value })} className="input-field min-h-[100px] resize-none" placeholder="Day 1: ...\nDay 2: ..." /></div>
                    <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Things to Carry</label><textarea value={editFormData.thingsToCarry} onChange={(e) => setEditFormData({ ...editFormData, thingsToCarry: e.target.value })} className="input-field min-h-[60px] resize-none" placeholder="Torch, water, raincoat..." /></div>

                    {/* Packages */}
                    <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-slate-700">Pricing Packages</label>
                            <button
                                type="button"
                                onClick={() => setEditFormData({ ...editFormData, packages: [...(editFormData.packages || []), { name: '', price: '', inclusions: '' }] })}
                                className="text-xs px-2 py-1 rounded-md bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 font-medium"
                            >
                                + Add Package
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-2">Leave empty to use the single Price field above. Add packages for multi-tier pricing.</p>
                        {(editFormData.packages || []).length === 0 && (
                            <div className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg py-3 text-center">No packages added — using single price</div>
                        )}
                        {(editFormData.packages || []).map((pkg, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-lg p-3 mb-2 bg-slate-50 space-y-2">
                                <div className="flex gap-2 items-start">
                                    <div className="flex-1">
                                        <input
                                            placeholder="Package name (e.g. Standard, Premium)"
                                            value={pkg.name}
                                            onChange={(e) => {
                                                const pkgs = [...editFormData.packages];
                                                pkgs[idx] = { ...pkgs[idx], name: e.target.value };
                                                setEditFormData({ ...editFormData, packages: pkgs });
                                            }}
                                            className="input-field text-sm"
                                        />
                                    </div>
                                    <div className="w-28">
                                        <input
                                            type="number"
                                            placeholder="Price ₹"
                                            value={pkg.price}
                                            onChange={(e) => {
                                                const pkgs = [...editFormData.packages];
                                                pkgs[idx] = { ...pkgs[idx], price: e.target.value };
                                                setEditFormData({ ...editFormData, packages: pkgs });
                                            }}
                                            className="input-field text-sm"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const pkgs = editFormData.packages.filter((_, i) => i !== idx);
                                            setEditFormData({ ...editFormData, packages: pkgs });
                                        }}
                                        className="mt-1 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        title="Remove package"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <textarea
                                    placeholder={"Inclusions (one per line)\ne.g.\nTravel Pune to Pune\nBreakfast & Lunch\nCertified Guide"}
                                    value={pkg.inclusions}
                                    onChange={(e) => {
                                        const pkgs = [...editFormData.packages];
                                        pkgs[idx] = { ...pkgs[idx], inclusions: e.target.value };
                                        setEditFormData({ ...editFormData, packages: pkgs });
                                    }}
                                    className="input-field text-sm min-h-[72px] resize-none w-full"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Partial / Advance Payment */}
                    <div className="sm:col-span-2">
                        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!!editFormData.acceptPartialPayment}
                                    onChange={(e) => setEditFormData({ ...editFormData, acceptPartialPayment: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium text-slate-700">Accept partial (advance) payment</span>
                            </label>
                            <p className="text-[11px] text-slate-400 mt-1 ml-6">When enabled, customers can pay an advance instead of the full amount.</p>
                            {editFormData.acceptPartialPayment && (
                                <div className="mt-3 ml-6">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Advance amount per person (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editFormData.partialPaymentAmount}
                                        onChange={(e) => setEditFormData({ ...editFormData, partialPaymentAmount: e.target.value })}
                                        className="input-field max-w-[200px]"
                                        placeholder="e.g. 1000"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => { setShowEditModal(false); setEditErrors({}); }} className="btn-secondary">Cancel</button>
                    <button onClick={handleSaveEdit} className="btn-primary">Save Changes</button>
                </div>
            </Modal>

            {/* Delete Participant Confirmation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteModal(null)}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Remove Participant?</h3>
                                <p className="text-xs text-slate-500">This will also update occupancy &amp; revenue</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-5">
                            Are you sure you want to remove{' '}
                            <span className="font-semibold text-slate-800">{deleteModal.participantName}</span>?{' '}
                            The departure occupancy and booking amount will be reduced accordingly.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setDeleteModal(null)} className="btn-secondary text-sm px-4 py-1.5 cursor-pointer">Cancel</button>
                            <button
                                onClick={confirmDeleteParticipant}
                                className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Collect Pending Payment Modal */}
            {collectModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCollectModal(null)}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-amber-500" /> Collect Payment
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Booking: <span className="font-mono font-semibold text-slate-700">{collectModal.txnid}</span></p>
                        <div className="mb-4">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Amount to Collect (₹)</label>
                            <input
                                type="number"
                                placeholder={collectModal.pendingAmount?.toString()}
                                value={collectAmount}
                                onChange={e => setCollectAmount(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                                autoFocus
                            />
                            <p className="text-xs text-amber-600 mt-1">Pending: ₹{(collectModal.pendingAmount ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setCollectModal(null)} className="btn-secondary text-sm px-4 py-1.5 cursor-pointer">Cancel</button>
                            <button
                                onClick={handleCollectPayment}
                                disabled={!collectAmount || collecting}
                                className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {collecting ? 'Saving...' : 'Confirm Collection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
