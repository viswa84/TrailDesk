import { useState, useMemo } from 'react';
import { useDepartures } from '../hooks/useDepartures';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameDay, differenceInDays, addMonths, subMonths } from 'date-fns';
import { CalendarDays, List, Plus, Edit, Trash2, MapPin, User, ChevronLeft, ChevronRight, Clock, Users, MoreHorizontal, X, Eye, AlertTriangle } from 'lucide-react';

const emptyDeparture = { trekName: '', startDate: '', endDate: '', capacity: '', guideId: '', price: '', meetingPoint: '', status: 'Open' };

// Color palette for different treks in the calendar
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
  const { data: deps, guides, loading, error, add: addDep, update: updateDep, remove: removeDep } = useDepartures();
  const [view, setView] = useState('list');
  const [selectedDep, setSelectedDep] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDep, setEditingDep] = useState(null);
  const [formData, setFormData] = useState(emptyDeparture);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 1, 1));
  const [expandedDay, setExpandedDay] = useState(null); // for "See all" popover

  // Assign consistent colors to unique trek names
  const trekColorMap = useMemo(() => {
    const uniqueTreks = [...new Set(deps.map(d => d.trekName))];
    const map = {};
    uniqueTreks.forEach((name, i) => { map[name] = trekColors[i % trekColors.length]; });
    return map;
  }, [deps]);

  const handleAdd = () => { setEditingDep(null); setFormData(emptyDeparture); setShowForm(true); };

  const handleEdit = (dep, e) => {
    if (e) e.stopPropagation();
    setEditingDep(dep);
    setFormData({ ...dep, capacity: String(dep.capacity), price: String(dep.price), guideId: String(dep.guideId) });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingDep) {
      updateDep(editingDep.id, formData);
    } else {
      addDep(formData);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => { removeDep(id); setShowDeleteConfirm(null); };

  // Calendar helpers
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const paddingDays = Array(startDay).fill(null);

  // Get departures for a specific day
  const getDayDeps = (day) => deps.filter(d => {
    const start = parseISO(d.startDate);
    const end = parseISO(d.endDate);
    return day >= start && day <= end;
  });

  // occupancy helpers
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
            const startDate = parseISO(dep.startDate);
            const endDate = parseISO(dep.endDate);
            const duration = differenceInDays(endDate, startDate) + 1;
            const occ = getOccupancyColor(dep.booked, dep.capacity);
            const statusLabel = getStatusLabel(dep);
            const ratio = dep.booked / dep.capacity;
            const guideInitial = dep.guideName ? dep.guideName.split(' ').map(n => n[0]).join('') : '?';

            return (
              <div
                key={dep.id}
                className="card overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => setSelectedDep(dep)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5">
                  {/* Date Badge */}
                  <div className="flex items-center sm:block">
                    <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200/60 flex flex-col items-center justify-center shrink-0 group-hover:from-primary-100 group-hover:to-primary-200 transition-all duration-300">
                      <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider leading-none">{format(startDate, 'MMM')}</span>
                      <span className="text-2xl font-extrabold text-primary-700 leading-none mt-0.5">{format(startDate, 'dd')}</span>
                    </div>
                  </div>

                  {/* Trek Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-slate-900 truncate">{dep.trekName}</h3>
                      <StatusBadge status={statusLabel} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{duration} Days</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{dep.meetingPoint}</span>
                      <span className="font-mono text-slate-400">{dep.id}</span>
                    </div>
                  </div>

                  {/* Occupancy Meter */}
                  <div className="sm:w-40 shrink-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-500">Occupancy</span>
                      <span className={`text-xs font-bold ${occ.text}`}>{dep.booked}/{dep.capacity}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${occ.bar}`}
                        style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                      />
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
                    <button onClick={() => setSelectedDep(dep)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="View Details">
                      <Eye className="w-4 h-4 text-slate-400" />
                    </button>
                    <button onClick={(e) => handleEdit(dep, e)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
                      <Edit className="w-4 h-4 text-slate-400" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(dep.id); }} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
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
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <button onClick={() => setCalendarDate(subMonths(calendarDate, 1))} className="p-2 hover:bg-white rounded-xl transition-all duration-200 shadow-sm border border-slate-200/80 hover:shadow cursor-pointer">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">{format(calendarDate, 'MMMM yyyy')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{deps.filter(d => {const s = parseISO(d.startDate); return s.getMonth() === calendarDate.getMonth() && s.getFullYear() === calendarDate.getFullYear()}).length} departures starting this month</p>
            </div>
            <button onClick={() => setCalendarDate(addMonths(calendarDate, 1))} className="p-2 hover:bg-white rounded-xl transition-all duration-200 shadow-sm border border-slate-200/80 hover:shadow cursor-pointer">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-slate-50/80 border-b border-slate-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {/* Padding cells */}
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[110px] border-b border-r border-slate-100 bg-slate-50/30" />
            ))}

            {/* Day cells */}
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
                  {/* Day Number */}
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

                  {/* Trek Chips */}
                  <div className="space-y-[3px]">
                    {dayDeps.slice(0, MAX_VISIBLE).map(d => {
                      const colors = trekColorMap[d.trekName] || trekColors[0];
                      return (
                        <div
                          key={d.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedDep(d); }}
                          className={`text-[10px] leading-tight px-1.5 py-[3px] rounded-md truncate cursor-pointer transition-all duration-150 border
                            ${colors.bg} ${colors.text} ${colors.border}
                            hover:shadow-sm hover:scale-[1.02]
                          `}
                          title={`${d.trekName} — ${d.booked}/${d.capacity} booked`}
                        >
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                            <span className="truncate font-medium">{d.trekName.length > 18 ? d.trekName.substring(0, 16) + '…' : d.trekName}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* "+N more" button */}
                    {hasMore && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedDay(isExpanded ? null : day); }}
                        className="w-full text-[10px] font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md py-[3px] px-1.5 transition-colors text-left cursor-pointer"
                      >
                        +{dayDeps.length - MAX_VISIBLE} more
                      </button>
                    )}
                  </div>

                  {/* Expanded Popover — shows all treks for this day */}
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
                              key={d.id}
                              onClick={() => { setSelectedDep(d); setExpandedDay(null); }}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:shadow-sm transition-all border ${colors.bg} ${colors.border}`}
                            >
                              <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-[11px] font-semibold truncate ${colors.text}`}>{d.trekName}</p>
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

          {/* Calendar Legend */}
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
      <Modal isOpen={!!selectedDep} onClose={() => setSelectedDep(null)} title="Batch Details" size="md">
        {selectedDep && (() => {
          const startDate = parseISO(selectedDep.startDate);
          const endDate = parseISO(selectedDep.endDate);
          const duration = differenceInDays(endDate, startDate) + 1;
          const ratio = selectedDep.booked / selectedDep.capacity;
          const occ = getOccupancyColor(selectedDep.booked, selectedDep.capacity);

          return (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200/60 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider leading-none">{format(startDate, 'MMM')}</span>
                  <span className="text-2xl font-extrabold text-primary-700 leading-none mt-0.5">{format(startDate, 'dd')}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{selectedDep.trekName}</h3>
                    <StatusBadge status={getStatusLabel(selectedDep)} />
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{selectedDep.id}</p>
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Duration</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" />{duration} Days</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{format(startDate, 'MMM dd')} → {format(endDate, 'MMM dd, yyyy')}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Price</p>
                  <p className="font-semibold text-slate-800">₹{selectedDep.price.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">per person</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Guide</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" />{selectedDep.guideName}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Meeting Point</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{selectedDep.meetingPoint}</p>
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
            </div>
          );
        })()}
      </Modal>

      {/* ──────────────────── CRUD FORM MODAL ──────────────────── */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingDep ? 'Edit Departure' : 'New Departure'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Trek Name</label><input value={formData.trekName} onChange={(e) => setFormData({...formData, trekName: e.target.value})} className="input-field" placeholder="e.g. Kedarkantha Winter Trek" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label><input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">End Date</label><input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label><input type="number" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} className="input-field" placeholder="e.g. 20" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label><input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="input-field" placeholder="e.g. 8500" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Guide</label>
            <select value={formData.guideId} onChange={(e) => setFormData({...formData, guideId: e.target.value})} className="select-field">
              <option value="">Select Guide</option>
              {guides.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="select-field">
              <option value="Open">Open</option>
              <option value="Almost Full">Almost Full</option>
              <option value="Full">Full</option>
            </select>
          </div>
          <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Meeting Point</label><input value={formData.meetingPoint} onChange={(e) => setFormData({...formData, meetingPoint: e.target.value})} className="input-field" placeholder="e.g. Dehradun Railway Station" /></div>
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
    </div>
  );
}
