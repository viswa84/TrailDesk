import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDepartures } from '../hooks/useDepartures';
import { useCities } from '../hooks/useCities';
import { useBoardingPoints } from '../hooks/useBoardingPoints';
import { useGuides } from '../hooks/useGuides';
import { useToast } from '../context/ToastContext';
import { v, validateForm } from '../utils/validators';
import Modal from '../components/ui/Modal';
import DatePickerInput from '../components/ui/DatePickerInput';
import StatusBadge from '../components/ui/StatusBadge';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameDay, differenceInDays, addMonths, subMonths } from 'date-fns';
import { CalendarDays, List, Plus, Edit, Trash2, MapPin, User, ChevronLeft, ChevronRight, Clock, Users, X, Eye, AlertTriangle, IndianRupee, Building2, Phone, FileText } from 'lucide-react';

const emptyDeparture = { trekId: '', trekName: '', cityId: '', startDate: '', endDate: '', nights: '', days: '', capacity: '', guideId: '', price: '', meetingPoint: '', itinerary: '', thingsToCarry: '', contact: '', status: 'Open', boardingPointIds: [] };

const trekColors = [
  { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', border: 'border-blue-200' },
  { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500', border: 'border-purple-200' },
  { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500', border: 'border-amber-200' },
  { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-500', border: 'border-rose-200' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', dot: 'bg-cyan-500', border: 'border-cyan-200' },
  { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500', border: 'border-orange-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500', border: 'border-indigo-200' },
  { bg: 'bg-pink-100', text: 'text-pink-800', dot: 'bg-pink-500', border: 'border-pink-200' },
  { bg: 'bg-teal-100', text: 'text-teal-800', dot: 'bg-teal-500', border: 'border-teal-200' },
];

export default function DeparturesPage() {
  const { data: deps, treks: treksList, loading, error, add: addDep, update: updateDep, remove: removeDep, cancel: cancelDep } = useDepartures();
  const { data: citiesList } = useCities();
  const { guides } = useGuides();
  const toast = useToast();
  const navigate = useNavigate();
  const [view, setView] = useState('list');
  const [selectedDep, setSelectedDep] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDep, setEditingDep] = useState(null);
  const [formData, setFormData] = useState(emptyDeparture);
  const { data: bpOptions } = useBoardingPoints(formData.cityId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [expandedDay, setExpandedDay] = useState(null);
  const [errors, setErrors] = useState({});
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const trekColorMap = useMemo(() => {
    const uniqueTreks = [...new Set(deps.map(d => d.trekName))];
    const map = {};
    uniqueTreks.forEach((name, i) => { map[name] = trekColors[i % trekColors.length]; });
    return map;
  }, [deps]);

  const handleAdd = () => { setEditingDep(null); setFormData(emptyDeparture); setErrors({}); setShowForm(true); };

  const handleEdit = (dep, e) => {
    if (e) e.stopPropagation();
    setEditingDep(dep);
    setFormData({
      ...dep,
      trekId: dep.trekId || '',
      cityId: dep.cityId || '',
      capacity: String(dep.capacity),
      price: String(dep.price),
      guideId: dep.guideId ? String(dep.guideId) : '',
      itinerary: dep.itinerary || '',
      thingsToCarry: dep.thingsToCarry || '',
      contact: dep.contact || '',
      nights: dep.nights != null ? String(dep.nights) : '',
      days: dep.days != null ? String(dep.days) : '',
      boardingPointIds: dep.boardingPointIds || [],
    });
    setErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    let { valid, errors: errs } = validateForm({
      trekName: v.required(formData.trekName || formData.trekId, 'Trek'),
      startDate: v.dateRequired(formData.startDate, 'Start date'),
      endDate: v.dateRequired(formData.endDate, 'End date'),
    });
    if (valid && formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      errs.endDate = 'End date must be after or equal to start date';
      valid = false;
    }
    if (!valid) { setErrors(errs); toast.error('Please fix the form errors'); return; }

    // Set trekName and cityName from selections
    const trek = treksList.find(t => String(t.id || t._id) === String(formData.trekId));
    const city = citiesList?.find(c => String(c.id || c._id) === String(formData.cityId));
    const nightsNum = parseInt(formData.nights, 10) || 0;
    const daysNum = parseInt(formData.days, 10) || 0;
    const saveData = {
      ...formData,
      trekName: trek?.name || formData.trekName || '',
      cityName: city?.name || formData.cityName || '',
      nights: nightsNum,
      days: daysNum,
      duration: `${nightsNum} Night${nightsNum !== 1 ? 's' : ''} / ${daysNum} Day${daysNum !== 1 ? 's' : ''}`,
      capacity: parseInt(formData.capacity, 10),
      price: parseFloat(formData.price),
      boardingPointIds: formData.boardingPointIds || [],
    };
    try {
      if (editingDep) {
        await updateDep(editingDep.id || editingDep._id, saveData);
        toast.success('Batch updated successfully');
      } else {
        await addDep(saveData);
        toast.success('Batch created successfully');
      }
      setShowForm(false);
      setErrors({});
    } catch (err) {
      toast.error(err.message || 'Failed to save departure');
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeDep(id);
      setShowDeleteConfirm(null);
      toast.success('Batch deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleCancelBatch = async () => {
    if (!cancelTarget || !cancelReason.trim()) { toast.error('Please provide a cancellation reason'); return; }
    try {
      await cancelDep(cancelTarget.id || cancelTarget._id, cancelReason);
      toast.success('Batch canceled successfully');
      setCancelTarget(null);
      setCancelReason('');
    } catch (err) {
      toast.error(err.message || 'Failed to cancel batch');
    }
  };

  // Calendar helpers
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const paddingDays = Array(startDay).fill(null);

  const getDayDeps = (day) => deps.filter(d => {
    try {
      const start = parseISO(d.startDate);
      const end = parseISO(d.endDate);
      return day >= start && day <= end;
    } catch { return false; }
  });

  const getOccupancyColor = (booked, capacity) => {
    const ratio = booked / capacity;
    if (ratio >= 1) return { bar: 'bg-red-500', text: 'text-red-600' };
    if (ratio >= 0.85) return { bar: 'bg-amber-500', text: 'text-amber-600' };
    return { bar: 'bg-primary-500', text: 'text-primary-600' };
  };

  const getStatusLabel = (dep) => {
    const ratio = dep.booked / dep.capacity;
    if (ratio >= 1) return 'Full';
    if (ratio >= 0.85) return 'Closing Soon';
    return dep.status;
  };

  const fieldClass = (name) => `input-field ${errors[name] ? 'input-error' : ''}`;
  const errMsg = (name) => errors[name] ? <p className="text-xs text-red-500 mt-1">{errors[name]}</p> : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Departures & Batches</h1>
          <p className="page-subtitle mt-1">Manage inventory, guide assignments, and capacity.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setView('list')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${view === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              <List className="w-4 h-4" /> List View
            </button>
            <button onClick={() => setView('calendar')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${view === 'calendar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              <CalendarDays className="w-4 h-4" /> Calendar View
            </button>
          </div>
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add New Batch
          </button>
        </div>
      </div>

      {/* ──────────────────── LIST VIEW ──────────────────── */}
      {view === 'list' ? (
        <div className="space-y-3">
          {deps.map((dep, idx) => {
            let duration = dep.duration || '';
            if (dep.nights || dep.days) {
              duration = `${dep.nights || 0} Night${dep.nights !== 1 ? 's' : ''} / ${dep.days || 0} Day${dep.days !== 1 ? 's' : ''}`;
            }
            try {
              const startDate = parseISO(dep.startDate);
              const endDate = parseISO(dep.endDate);
              if (!duration) duration = `${differenceInDays(endDate, startDate) + 1} Days`;
            } catch { }
            const occ = getOccupancyColor(dep.booked, dep.capacity);
            const statusLabel = getStatusLabel(dep);
            const ratio = dep.booked / dep.capacity;
            const guideInitial = dep.guideName ? dep.guideName.split(' ').map(n => n[0]).join('') : '?';
            let startDateFormatted = '';
            try { startDateFormatted = format(parseISO(dep.startDate), 'MMM dd'); } catch { }

            return (
              <div
                key={dep.id || dep._id}
                className="card overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => navigate(`/departures/${dep.id || dep._id}`)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5">
                  {/* Date Badge */}
                  <div className="flex items-center sm:block">
                    <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200/60 flex flex-col items-center justify-center shrink-0 group-hover:from-primary-100 group-hover:to-primary-200 transition-all duration-300">
                      {startDateFormatted ? (
                        <>
                          <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider leading-none">{startDateFormatted.split(' ')[0]}</span>
                          <span className="text-2xl font-extrabold text-primary-700 leading-none mt-0.5">{startDateFormatted.split(' ')[1]}</span>
                        </>
                      ) : (
                        <CalendarDays className="w-6 h-6 text-primary-600" />
                      )}
                    </div>
                  </div>

                  {/* Trek Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {dep.uniqueId && <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{dep.uniqueId}</span>}
                      <h3 className="text-base font-semibold text-slate-900 truncate">{dep.trekName}</h3>
                      <StatusBadge status={statusLabel} />
                      {dep.status === 'Canceled' && dep.cancellationReason && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200" title={dep.cancellationReason}>Reason: {dep.cancellationReason}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{duration}</span>
                      {dep.cityName && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{dep.cityName}</span>}
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{dep.meetingPoint}</span>
                      <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />₹{dep.price?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Occupancy Meter */}
                  <div className="sm:w-40 shrink-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-500">Occupancy</span>
                      <span className={`text-xs font-bold ${occ.text}`}>{dep.booked}/{dep.capacity}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ease-out ${occ.bar}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
                    </div>
                  </div>

                  {/* Guide */}
                  <div className="sm:w-36 shrink-0">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Guide</p>
                    {dep.guideName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{guideInitial}</div>
                        <span className="text-sm font-medium text-slate-700 truncate">{dep.guideName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Assign Now</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/departures/${dep.id || dep._id}`)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="View Details">
                      <Eye className="w-4 h-4 text-slate-400" />
                    </button>
                    <button onClick={(e) => handleEdit(dep, e)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
                      <Edit className="w-4 h-4 text-slate-400" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(dep.id || dep._id); }} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                    {dep.status !== 'Canceled' && (
                      <button onClick={(e) => { e.stopPropagation(); setCancelTarget(dep); }} className="p-2 hover:bg-amber-50 rounded-lg transition-colors" title="Cancel Batch">
                        <X className="w-4 h-4 text-amber-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {deps.length === 0 && (
            <div className="card p-12 text-center">
              <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No departures scheduled yet</p>
              <button onClick={handleAdd} className="btn-primary mt-4 mx-auto">Create First Batch</button>
            </div>
          )}
        </div>

      ) : (
        /* ──────────────────── CALENDAR VIEW ──────────────────── */
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <button onClick={() => setCalendarDate(subMonths(calendarDate, 1))} className="p-2 hover:bg-white rounded-xl transition-all duration-200 shadow-sm border border-slate-200/80 hover:shadow cursor-pointer">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">{format(calendarDate, 'MMMM yyyy')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{deps.filter(d => { try { const s = parseISO(d.startDate); return s.getMonth() === calendarDate.getMonth() && s.getFullYear() === calendarDate.getFullYear(); } catch { return false; } }).length} departures starting this month</p>
            </div>
            <button onClick={() => setCalendarDate(addMonths(calendarDate, 1))} className="p-2 hover:bg-white rounded-xl transition-all duration-200 shadow-sm border border-slate-200/80 hover:shadow cursor-pointer">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 bg-slate-50/80 border-b border-slate-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[110px] border-b border-r border-slate-100 bg-slate-50/30" />
            ))}

            {days.map(day => {
              const dayDeps = getDayDeps(day);
              const today = isToday(day);
              const MAX_VISIBLE = 3;
              const hasMore = dayDeps.length > MAX_VISIBLE;
              const isExpanded = expandedDay && isSameDay(expandedDay, day);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[110px] border-b border-r border-slate-100 p-1.5 relative group transition-colors duration-150
                    ${today ? 'bg-primary-50/40' : 'bg-white hover:bg-slate-50/50'}
                    ${dayDeps.length > 0 ? 'cursor-pointer' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors
                      ${today ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 group-hover:bg-slate-100'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    {dayDeps.length > 0 && (
                      <span className="text-[10px] font-medium text-slate-400">{dayDeps.length} trek{dayDeps.length > 1 ? 's' : ''}</span>
                    )}
                  </div>

                  <div className="space-y-[3px]">
                    {dayDeps.slice(0, MAX_VISIBLE).map(d => {
                      const colors = trekColorMap[d.trekName] || trekColors[0];
                      return (
                        <div
                          key={d.id || d._id}
                          onClick={(e) => { e.stopPropagation(); setSelectedDep(d); }}
                          className={`text-[10px] leading-tight px-1.5 py-[3px] rounded-md truncate cursor-pointer transition-all duration-150 border
                            ${colors.bg} ${colors.text} ${colors.border} hover:shadow-sm hover:scale-[1.02]
                          `}
                          title={`${d.uniqueId ? d.uniqueId + ' — ' : ''}${d.trekName} (${d.cityName || ''}) — ${d.booked}/${d.capacity} booked`}
                        >
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                            <span className="truncate font-medium">{d.uniqueId ? `${d.uniqueId} ` : ''}{d.trekName.length > 14 ? d.trekName.substring(0, 12) + '…' : d.trekName}</span>
                          </div>
                        </div>
                      );
                    })}

                    {hasMore && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedDay(isExpanded ? null : day); }}
                        className="w-full text-[10px] font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md py-[3px] px-1.5 transition-colors text-left cursor-pointer"
                      >
                        +{dayDeps.length - MAX_VISIBLE} more
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="absolute top-0 left-0 z-30 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 animate-scale-in" style={{ minWidth: '220px' }}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-700">{format(day, 'EEEE, MMM d')}</h4>
                        <button onClick={() => setExpandedDay(null)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-3.5 h-3.5 text-slate-400" /></button>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {dayDeps.map(d => {
                          const colors = trekColorMap[d.trekName] || trekColors[0];
                          const ratio = d.booked / d.capacity;
                          return (
                            <div
                              key={d.id || d._id}
                              onClick={() => { navigate(`/departures/${d.id || d._id}`); setExpandedDay(null); }}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:shadow-sm transition-all border ${colors.bg} ${colors.border}`}
                            >
                              <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-[11px] font-semibold truncate ${colors.text}`}>{d.uniqueId ? `${d.uniqueId} — ` : ''}{d.trekName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <div className="flex-1 h-1 bg-white/60 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${ratio >= 1 ? 'bg-red-500' : ratio >= 0.85 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
                                  </div>
                                  <span className="text-[9px] font-medium text-slate-500">{d.booked}/{d.capacity}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Legend:</span>
              {Object.entries(trekColorMap).slice(0, 6).map(([name, colors]) => (
                <div key={name} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                  <span className="text-[11px] text-slate-600">{name.split(' ').slice(0, 2).join(' ')}</span>
                </div>
              ))}
              {Object.keys(trekColorMap).length > 6 && <span className="text-[11px] text-slate-400">+{Object.keys(trekColorMap).length - 6} more</span>}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────── BATCH DETAILS MODAL ──────────────────── */}
      <Modal isOpen={!!selectedDep} onClose={() => setSelectedDep(null)} title="Batch Details" size="lg">
        {selectedDep && (() => {
          let duration = selectedDep.duration || '';
          if (selectedDep.nights || selectedDep.days) {
            duration = `${selectedDep.nights || 0} Night${selectedDep.nights !== 1 ? 's' : ''} / ${selectedDep.days || 0} Day${selectedDep.days !== 1 ? 's' : ''}`;
          }
          let startDate, endDate;
          try {
            startDate = parseISO(selectedDep.startDate);
            endDate = parseISO(selectedDep.endDate);
            if (!duration) duration = `${differenceInDays(endDate, startDate) + 1} Days`;
          } catch { }
          const ratio = selectedDep.booked / selectedDep.capacity;
          const occ = getOccupancyColor(selectedDep.booked, selectedDep.capacity);

          return (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200/60 flex flex-col items-center justify-center shrink-0">
                  {startDate ? (
                    <>
                      <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider leading-none">{format(startDate, 'MMM')}</span>
                      <span className="text-2xl font-extrabold text-primary-700 leading-none mt-0.5">{format(startDate, 'dd')}</span>
                    </>
                  ) : (
                    <CalendarDays className="w-6 h-6 text-primary-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {selectedDep.uniqueId && <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">{selectedDep.uniqueId}</span>}
                    <h3 className="text-lg font-bold text-slate-900">{selectedDep.trekName}</h3>
                    <StatusBadge status={getStatusLabel(selectedDep)} />
                  </div>
                  {selectedDep.cityName && (
                    <p className="text-sm text-slate-500 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> From: {selectedDep.cityName}</p>
                  )}
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Duration</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" />{duration}</p>
                  {startDate && endDate && <p className="text-[11px] text-slate-400 mt-0.5">{format(startDate, 'dd/MM/yyyy')} → {format(endDate, 'dd/MM/yyyy')}</p>}
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Price</p>
                  <p className="font-semibold text-slate-800">₹{selectedDep.price?.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">per person</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Guide</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" />{selectedDep.guideName || 'Not assigned'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Meeting Point</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{selectedDep.meetingPoint || '—'}</p>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">Occupancy</span>
                  <span className={`text-sm font-bold ${occ.text}`}>{selectedDep.booked}/{selectedDep.capacity} booked</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${occ.bar}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
                </div>
                {ratio < 1 && <p className="text-[11px] text-slate-400 mt-1">{selectedDep.capacity - selectedDep.booked} seats remaining</p>}
              </div>

              {/* Itinerary */}
              {selectedDep.itinerary && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Itinerary</h4>
                  <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700 whitespace-pre-line">{selectedDep.itinerary}</div>
                </div>
              )}

              {/* Things to Carry */}
              {selectedDep.thingsToCarry && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Things to Carry</h4>
                  <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700">{selectedDep.thingsToCarry}</div>
                </div>
              )}

              {/* Contact */}
              {selectedDep.contact && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>Contact: {selectedDep.contact}</span>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* ──────────────────── CRUD FORM MODAL ──────────────────── */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingDep ? 'Edit Departure' : 'New Departure'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trek *</label>
            <select value={formData.trekId} onChange={(e) => {
              const selected = treksList.find(t => (t.id || t._id) === e.target.value);
              setFormData({ ...formData, trekId: e.target.value, trekName: selected?.name || '' });
              if (errors.trekName) setErrors({ ...errors, trekName: null });
            }} className={fieldClass('trekName')}>
              <option value="">Select Trek</option>
              {treksList.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
            </select>
            {errMsg('trekName')}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City (departure from)</label>
            <select value={formData.cityId} onChange={(e) => setFormData({ ...formData, cityId: e.target.value, boardingPointIds: [] })} className="select-field">
              <option value="">Select City</option>
              {(citiesList || []).map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
            </select>
          </div>
          {formData.cityId && bpOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Boarding Points</label>
              <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1 bg-white">
                {bpOptions.map(bp => {
                  const bpId = bp._id || bp.id;
                  const checked = (formData.boardingPointIds || []).includes(bpId);
                  return (
                    <label key={bpId} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const ids = formData.boardingPointIds || [];
                          setFormData({ ...formData, boardingPointIds: checked ? ids.filter(i => i !== bpId) : [...ids, bpId] });
                        }}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-slate-700">{bp.name}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{(formData.boardingPointIds || []).length} selected</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
            <DatePickerInput
              selected={formData.startDate ? new Date(formData.startDate) : null}
              onChange={(date) => {
                const dateStr = date ? date.toISOString().split('T')[0] : '';
                let newFormData = { ...formData, startDate: dateStr };
                if (dateStr && newFormData.endDate) {
                  const st = new Date(dateStr);
                  const en = new Date(newFormData.endDate);
                  if (st > en) {
                    newFormData.endDate = dateStr;
                    newFormData.nights = '0';
                    newFormData.days = '1';
                  } else {
                    const n = differenceInDays(en, st);
                    newFormData.nights = String(n);
                    newFormData.days = String(n + 1);
                  }
                }
                setFormData(newFormData);
                if (errors.startDate) setErrors({ ...errors, startDate: null });
              }}
              className={fieldClass('startDate')}
            />
            {errMsg('startDate')}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
            <DatePickerInput
              selected={formData.endDate ? new Date(formData.endDate) : null}
              minDate={formData.startDate ? new Date(formData.startDate) : null}
              onChange={(date) => {
                const dateStr = date ? date.toISOString().split('T')[0] : '';
                let newFormData = { ...formData, endDate: dateStr };
                if (dateStr && newFormData.startDate) {
                  const st = new Date(newFormData.startDate);
                  const en = new Date(dateStr);
                  if (en >= st) {
                    const n = differenceInDays(en, st);
                    newFormData.nights = String(n);
                    newFormData.days = String(n + 1);
                  }
                }
                setFormData(newFormData);
                if (errors.endDate) setErrors({ ...errors, endDate: null });
              }}
              className={fieldClass('endDate')}
            />
            {errMsg('endDate')}
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Nights</label><input type="number" min="0" value={formData.nights} onChange={(e) => setFormData({ ...formData, nights: e.target.value })} className="input-field" placeholder="e.g. 2" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Days</label><input type="number" min="0" value={formData.days} onChange={(e) => setFormData({ ...formData, days: e.target.value })} className="input-field" placeholder="e.g. 3" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label><input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="input-field" placeholder="e.g. 20" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label><input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input-field" placeholder="e.g. 8500" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Guide</label>
            <select value={formData.guideId} onChange={(e) => {
              const selectedGuide = guides.find(g => (g.id || g._id) === e.target.value);
              setFormData({
                ...formData,
                guideId: e.target.value,
                guideName: selectedGuide ? selectedGuide.name : '',
                contact: (selectedGuide && selectedGuide.phone) ? selectedGuide.phone : formData.contact
              });
            }} className="select-field">
              <option value="">Select Guide</option>
              {guides.map(g => <option key={g.id || g._id} value={g.id || g._id}>{g.name} - {g.phone}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="select-field">
              <option value="Open">Open</option>
              <option value="Almost Full">Almost Full</option>
              <option value="Full">Full</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Meeting Point</label><input value={formData.meetingPoint} onChange={(e) => setFormData({ ...formData, meetingPoint: e.target.value })} className="input-field" placeholder="e.g. Pune Railway Station" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label><input value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value.replace(/\D/g, '').slice(0, 10) })} maxLength={10} className="input-field" placeholder="e.g. 9876543210" /></div>
          <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Itinerary</label><textarea value={formData.itinerary} onChange={(e) => setFormData({ ...formData, itinerary: e.target.value })} className="input-field min-h-[100px] resize-none" placeholder="Day 1: ...\nDay 2: ..." /></div>
          <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Things to Carry</label><textarea value={formData.thingsToCarry} onChange={(e) => setFormData({ ...formData, thingsToCarry: e.target.value })} className="input-field min-h-[60px] resize-none" placeholder="Torch, water, raincoat..." /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">{editingDep ? 'Save Changes' : 'Create Batch'}</button>
        </div>
      </Modal>

      {/* ──────────────────── DELETE CONFIRM ──────────────────── */}
      <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Departure" size="sm">
        <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this departure batch? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">Cancel</button>
          <button onClick={() => handleDelete(showDeleteConfirm)} className="btn-danger">Delete</button>
        </div>
      </Modal>

      {/* ──────────────────── CANCEL BATCH MODAL ──────────────────── */}
      <Modal isOpen={!!cancelTarget} onClose={() => { setCancelTarget(null); setCancelReason(''); }} title={`Cancel Batch: ${cancelTarget?.trekName || ''}`} size="sm">
        <p className="text-sm text-slate-600 mb-3">Why are you canceling this batch? This will notify all relevant parties.</p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="input-field min-h-[80px]"
            placeholder="e.g. Heavy rain forecast, Guide unavailable, Low registrations"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={() => { setCancelTarget(null); setCancelReason(''); }} className="btn-secondary">Keep Active</button>
          <button onClick={handleCancelBatch} disabled={!cancelReason.trim()} className="btn-danger flex items-center gap-2">
            <X className="w-4 h-4" /> Cancel Batch
          </button>
        </div>
      </Modal>
    </div>
  );
}
