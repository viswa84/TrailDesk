import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_TREKS } from '../graphql/queries';
import { CREATE_TREK, UPDATE_TREK, DELETE_TREK, PUBLISH_TREK, UNPUBLISH_TREK } from '../graphql/mutations';
import { useToast } from '../context/ToastContext';
import { v, validateForm, onlyDigits } from '../utils/validators';
import Modal from '../components/ui/Modal';
import {
  Search, Plus, Clock, IndianRupee, MapPin, Mountain, Users, Calendar,
  Phone, Backpack, Edit, Trash2, Eye, RefreshCw, Rocket, X, EyeOff, Layers
} from 'lucide-react';

// Fallback images mapped by trek name keywords
const trekImages = {
  'pangong': 'https://images.unsplash.com/photo-1583497606541-043ab1a7f2f3?w=400&h=250&fit=crop',
  'kalsubai': 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=400&h=250&fit=crop',
  'har ki dun': 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&h=250&fit=crop',
  'rajmachi': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
  'harishchandragad': 'https://images.unsplash.com/photo-1445363692815-ebcd599af580?w=400&h=250&fit=crop',
  'lohagad': 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&h=250&fit=crop',
  'andharban': 'https://images.unsplash.com/photo-1490682143684-14369e18dce8?w=400&h=250&fit=crop',
  'kedarkantha': 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&h=250&fit=crop',
  'hampta': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=250&fit=crop',
  'valley of flowers': 'https://images.unsplash.com/photo-1490682143684-14369e18dce8?w=400&h=250&fit=crop',
  'roopkund': 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&h=250&fit=crop',
  'sandakphu': 'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=400&h=250&fit=crop',
  'chadar': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=250&fit=crop',
  'goechala': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=250&fit=crop',
  'brahmatal': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=250&fit=crop',
};
const defaultImage = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=250&fit=crop';

function getTrekImage(trek) {
  if (trek.image) return trek.image;
  const lower = (trek.name || '').toLowerCase();
  for (const [key, url] of Object.entries(trekImages)) {
    if (lower.includes(key)) return url;
  }
  return defaultImage;
}

const difficultyColors = {
  'Easy': 'badge-green',
  'Easy-Moderate': 'badge-blue',
  'Moderate': 'badge-yellow',
  'Hard': 'badge-red',
  'Difficult': 'badge-red',
};

function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
}

const emptyForm = {
  name: '',
  description: '',
  difficulty: 'Easy',
  duration: '',
  price: '',
  startFrom: '',
  itinerary: '',
  thingsToCarry: '',
  contact: '',
  image: '',
  location: '',
  altitude: '',
  bestSeason: '',
};

const emptyPublish = {
  seatsAvailable: '',
  seatsTotal: '',
  goLiveDate: '',
};

export default function TreksPage() {
  // ─── GraphQL ───
  const { data, loading, error, refetch } = useQuery(GET_TREKS);
  const treks = data?.getTreks || [];

  const [createTrekMut] = useMutation(CREATE_TREK, { refetchQueries: [{ query: GET_TREKS }] });
  const [updateTrekMut] = useMutation(UPDATE_TREK, { refetchQueries: [{ query: GET_TREKS }] });
  const [deleteTrekMut] = useMutation(DELETE_TREK, { refetchQueries: [{ query: GET_TREKS }] });
  const [publishTrekMut] = useMutation(PUBLISH_TREK, { refetchQueries: [{ query: GET_TREKS }] });
  const [unpublishTrekMut] = useMutation(UNPUBLISH_TREK, { refetchQueries: [{ query: GET_TREKS }] });

  const toast = useToast();

  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingTrek, setEditingTrek] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedTrek, setSelectedTrek] = useState(null);

  const [publishTrek, setPublishTrek] = useState(null);
  const [publishData, setPublishData] = useState(emptyPublish);
  const [publishing, setPublishing] = useState(false);
  const [errors, setErrors] = useState({});

  // ─── Filters ───
  const difficulties = useMemo(() => {
    const set = new Set(treks.map(t => t.difficulty).filter(Boolean));
    return ['All', ...set];
  }, [treks]);

  const filtered = useMemo(() => {
    return treks.filter(t => {
      const q = search.toLowerCase();
      const matchesSearch =
        t.name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q) ||
        t.startFrom?.some(s => s.toLowerCase().includes(q));
      const matchesDifficulty = difficultyFilter === 'All' || t.difficulty === difficultyFilter;
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Live' ? t.isActive : !t.isActive);
      return matchesSearch && matchesDifficulty && matchesStatus;
    });
  }, [treks, search, difficultyFilter, statusFilter]);

  // ─── Add / Edit ───
  const handleOpenAdd = () => {
    setEditingTrek(null);
    setFormData(emptyForm);
    setErrors({});
    setShowForm(true);
  };

  const handleOpenEdit = (trek, e) => {
    e?.stopPropagation();
    setEditingTrek(trek);
    setFormData({
      name: trek.name || '',
      description: trek.description || '',
      difficulty: trek.difficulty || 'Easy',
      duration: trek.duration || '',
      price: trek.price ? String(trek.price) : '',
      startFrom: Array.isArray(trek.startFrom) ? trek.startFrom.join(', ') : (trek.startFrom || ''),
      itinerary: trek.itinerary || '',
      thingsToCarry: trek.thingsToCarry || '',
      contact: trek.contact || '',
      image: trek.image || '',
      location: trek.location || '',
      altitude: trek.altitude || '',
      bestSeason: trek.bestSeason || '',
    });
    setErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    const { valid, errors: errs } = validateForm({
      name: v.required(formData.name, 'Trek name'),
      price: formData.price ? v.number(formData.price, 'Price') : null,
      contact: formData.contact ? v.phone(formData.contact) : null,
    });
    if (!valid) { setErrors(errs); toast.error('Please fix the form errors'); return; }
    setSaving(true);
    try {
      const input = {
        ...formData,
        price: Number(formData.price) || 0,
        startFrom: formData.startFrom.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
      };

      if (editingTrek) {
        await updateTrekMut({ variables: { id: editingTrek._id, input } });
        toast.success('Trek updated successfully');
      } else {
        await createTrekMut({ variables: { input } });
        toast.success('Trek created successfully');
      }
      setShowForm(false);
      setErrors({});
    } catch (err) {
      console.error('Error saving trek:', err);
      toast.error(err.message || 'Failed to save trek');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ───
  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    setDeleting(true);
    try {
      await deleteTrekMut({ variables: { id: showDeleteConfirm } });
      setShowDeleteConfirm(null);
      toast.success('Trek deleted');
    } catch (err) {
      console.error('Error deleting trek:', err);
      toast.error(err.message || 'Failed to delete trek');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Publish ───
  const handleOpenPublish = (trek, e) => {
    e?.stopPropagation();
    setPublishTrek(trek);
    setPublishData(emptyPublish);
  };

  const handlePublish = async () => {
    if (!publishTrek) return;
    setPublishing(true);
    try {
      await publishTrekMut({
        variables: {
          id: publishTrek._id,
          input: {
            seatsAvailable: Number(publishData.seatsAvailable),
            seatsTotal: Number(publishData.seatsTotal) || Number(publishData.seatsAvailable),
            goLiveDate: publishData.goLiveDate,
          },
        },
      });
      setPublishTrek(null);
      toast.success('Trek published! It is now live.');
    } catch (err) {
      console.error('Error publishing trek:', err);
      toast.error(err.message || 'Failed to publish trek');
    } finally {
      setPublishing(false);
    }
  };

  // ─── Take Offline ───
  const handleUnpublish = async (trek, e) => {
    e?.stopPropagation();
    try {
      await unpublishTrekMut({ variables: { id: trek._id } });
      toast.success(`${trek.name} is now offline`);
    } catch (err) {
      toast.error(err.message || 'Failed to take offline');
    }
  };

  // ─── Field helper ───
  const fieldClass = (key) => `input-field ${errors[key] ? 'input-error' : ''}`;
  const errMsg = (key) => errors[key] ? <p className="text-xs text-red-500 mt-1">{errors[key]}</p> : null;

  const f = (label, key, type = 'text', placeholder = '', extra = {}) => (
    <div className={extra.full ? 'sm:col-span-2' : ''}>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}{extra.required !== false && (key === 'name') ? ' *' : ''}</label>
      {type === 'textarea' ? (
        <textarea
          value={formData[key]}
          onChange={e => { setFormData({ ...formData, [key]: e.target.value }); if (errors[key]) setErrors({ ...errors, [key]: null }); }}
          className={`${fieldClass(key)} min-h-[80px] resize-none`}
          placeholder={placeholder}
        />
      ) : type === 'select' ? (
        <select
          value={formData[key]}
          onChange={e => setFormData({ ...formData, [key]: e.target.value })}
          className="select-field"
        >
          {extra.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : key === 'contact' ? (
        <>
          <input
            type="tel"
            value={formData[key]}
            onChange={e => { const d = onlyDigits(e.target.value, 10); setFormData({ ...formData, [key]: d }); if (errors[key]) setErrors({ ...errors, [key]: null }); }}
            className={fieldClass(key)}
            placeholder="10-digit mobile number"
            maxLength={10}
          />
          {errMsg(key)}
        </>
      ) : (
        <>
          <input
            type={type}
            value={formData[key]}
            onChange={e => { setFormData({ ...formData, [key]: e.target.value }); if (errors[key]) setErrors({ ...errors, [key]: null }); }}
            className={fieldClass(key)}
            placeholder={placeholder}
          />
          {errMsg(key)}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Treks Catalog</h1>
          <p className="page-subtitle mt-1">{filtered.length} treks available</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-secondary flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Trek
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search treks..." className="input-field pl-10" />
          </div>
          <select value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)} className="select-field sm:w-40">
            {difficulties.map(d => <option key={d} value={d}>{d === 'All' ? 'All Difficulty' : d}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field sm:w-36">
            <option value="All">All Status</option>
            <option value="Live">Live</option>
            <option value="Draft">Draft / Offline</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card p-12 text-center">
          <div className="inline-flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-primary-500 animate-spin" />
            <span className="text-slate-500 text-sm">Loading treks...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card p-8 text-center border-red-200 bg-red-50/50">
          <Mountain className="w-10 h-10 text-red-300 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error.message}</p>
          <button onClick={() => refetch()} className="btn-primary mt-4">Retry</button>
        </div>
      )}

      {/* Trek Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(trek => (
            <div key={trek._id} className="card overflow-hidden group cursor-pointer" onClick={() => setSelectedTrek(trek)}>
              <div className="relative h-44 overflow-hidden">
                <img
                  src={getTrekImage(trek)}
                  alt={trek.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => { e.target.src = defaultImage; }}
                />
                <div className="absolute top-3 left-3">
                  <span className={difficultyColors[trek.difficulty] || 'badge-slate'}>{trek.difficulty}</span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  {trek.isActive && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/90 text-white backdrop-blur-sm shadow-sm">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                    </span>
                  )}
                </div>
                {/* Action buttons on hover */}
                <div className="absolute top-10 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => handleOpenEdit(trek, e)} className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors shadow-sm" title="Edit">
                    <Edit className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  {!trek.isActive && (
                    <button onClick={e => handleOpenPublish(trek, e)} className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors shadow-sm" title="Publish">
                      <Rocket className="w-3.5 h-3.5 text-primary-600" />
                    </button>
                  )}
                  {trek.isActive && (
                    <button onClick={e => handleUnpublish(trek, e)} className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors shadow-sm" title="Take Offline">
                      <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); setShowDeleteConfirm(trek._id); }} className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors shadow-sm" title="Delete">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-white text-xs font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {trek.startFrom?.join(', ') || trek.location || '—'}
                  </span>
                  {trek.seatsTotal > 0 && (
                    <span className="text-white/80 text-[10px] font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" /> {trek.seatsAvailable ?? '—'}/{trek.seatsTotal}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">{trek.name}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {trek.duration}</span>
                  {trek.altitude && <span className="flex items-center gap-1"><Mountain className="w-3 h-3" /> {trek.altitude}</span>}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-lg font-bold text-primary-700">₹{trek.price?.toLocaleString('en-IN')}</span>
                  <div className="flex items-center gap-2">
                    {trek.departureCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        <Layers className="w-3 h-3" /> {trek.departureCount} batch{trek.departureCount !== 1 ? 'es' : ''}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {trek.isActive ? formatDate(trek.goLiveDate) : (trek.bestSeason || 'Draft')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Mountain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No treks found matching your filters.</p>
        </div>
      )}

      {/* ──────── Detail Modal ──────── */}
      <Modal isOpen={!!selectedTrek} onClose={() => setSelectedTrek(null)} title={selectedTrek?.name || 'Trek Details'} size="lg">
        {selectedTrek && (
          <div className="space-y-5">
            <div className="relative h-48 rounded-xl overflow-hidden">
              <img src={getTrekImage(selectedTrek)} alt={selectedTrek.name} className="w-full h-full object-cover" onError={e => { e.target.src = defaultImage; }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-4 flex flex-wrap gap-1.5">
                {selectedTrek.isActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/90 text-white">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                  </span>
                )}
                <span className={difficultyColors[selectedTrek.difficulty] || 'badge-slate'}>{selectedTrek.difficulty}</span>
                <span className="badge-slate">{selectedTrek.duration}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{selectedTrek.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <IndianRupee className="w-4 h-4 text-primary-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-slate-900">₹{selectedTrek.price?.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-slate-400">Price/person</div>
              </div>
              {selectedTrek.seatsTotal > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Users className="w-4 h-4 text-primary-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-slate-900">{selectedTrek.seatsAvailable}/{selectedTrek.seatsTotal}</div>
                  <div className="text-[11px] text-slate-400">Seats available</div>
                </div>
              )}
              {selectedTrek.goLiveDate && (
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Calendar className="w-4 h-4 text-primary-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-slate-900">{formatDate(selectedTrek.goLiveDate)}</div>
                  <div className="text-[11px] text-slate-400">Go-live date</div>
                </div>
              )}
            </div>
            {selectedTrek.startFrom?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Starting From</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTrek.startFrom.map(city => (
                    <span key={city} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium">
                      <MapPin className="w-3 h-3" /> {city}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedTrek.itinerary && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Itinerary</h4>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-sm text-slate-700 leading-relaxed space-y-1.5">
                    {selectedTrek.itinerary.split(';').map((line, i) => <p key={i}>{line.trim()}</p>)}
                  </div>
                </div>
              </div>
            )}
            {selectedTrek.thingsToCarry && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Backpack className="w-3.5 h-3.5" /> Things to Carry
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTrek.thingsToCarry.split(',').map((item, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs border border-slate-200/60">{item.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            {selectedTrek.contact && (
              <div className="flex items-center gap-2 p-3 bg-primary-50/50 rounded-xl border border-primary-100">
                <Phone className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">{selectedTrek.contact}</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ──────── Add / Edit Modal ──────── */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingTrek ? 'Edit Trek' : 'Add New Trek'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {f('Trek Name', 'name', 'text', 'e.g. Kedarkantha Winter Trek', { full: true })}
          {f('Difficulty', 'difficulty', 'select', '', { options: ['Easy', 'Easy-Moderate', 'Moderate', 'Hard', 'Difficult'] })}
          {f('Duration', 'duration', 'text', 'e.g. 5D/4N')}
          {f('Price (₹)', 'price', 'number', 'e.g. 8500')}
          {f('Altitude', 'altitude', 'text', 'e.g. 12,500 ft')}
          {f('Location', 'location', 'text', 'e.g. Uttarakhand')}
          {f('Best Season', 'bestSeason', 'text', 'e.g. Winter')}
          {f('Starting From', 'startFrom', 'text', 'e.g. DELHI, MUMBAI (comma-separated)')}
          {f('Contact *', 'contact', 'text', '10-digit mobile number')}
          {f('Image URL', 'image', 'text', 'https://... (optional)')}
          {f('Itinerary', 'itinerary', 'textarea', 'Day 1: ...; Day 2: ...', { full: true })}
          {f('Things to Carry', 'thingsToCarry', 'textarea', 'Trekking shoes, water bottle, ...', { full: true })}
          {f('Description', 'description', 'textarea', 'Describe the trek...', { full: true })}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving || !formData.name.trim()} className="btn-primary flex items-center gap-2">
            {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {editingTrek ? 'Save Changes' : 'Add Trek'}
          </button>
        </div>
      </Modal>

      {/* ──────── Publish Modal ──────── */}
      <Modal isOpen={!!publishTrek} onClose={() => setPublishTrek(null)} title={`Publish: ${publishTrek?.name || ''}`} size="sm">
        <p className="text-sm text-slate-600 mb-4">Make this trek live by setting seats and go-live date.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Total Seats</label>
            <input type="number" value={publishData.seatsTotal} onChange={e => setPublishData({ ...publishData, seatsTotal: e.target.value })} className="input-field" placeholder="e.g. 40" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Available Seats</label>
            <input type="number" value={publishData.seatsAvailable} onChange={e => setPublishData({ ...publishData, seatsAvailable: e.target.value })} className="input-field" placeholder="e.g. 40" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Go-Live Date</label>
            <input type="date" value={publishData.goLiveDate} onChange={e => setPublishData({ ...publishData, goLiveDate: e.target.value })} className="input-field" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setPublishTrek(null)} className="btn-secondary">Cancel</button>
          <button
            onClick={handlePublish}
            disabled={publishing || !publishData.seatsAvailable || !publishData.goLiveDate}
            className="btn-primary flex items-center gap-2"
          >
            {publishing && <RefreshCw className="w-4 h-4 animate-spin" />}
            <Rocket className="w-4 h-4" /> Publish
          </button>
        </div>
      </Modal>

      {/* ──────── Delete Confirm ──────── */}
      <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Trek" size="sm">
        <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this trek? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger flex items-center gap-2">
            {deleting && <RefreshCw className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
