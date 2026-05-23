import { useState, useEffect, useRef } from 'react';
import { useCities } from '../hooks/useCities';
import { useBoardingPoints } from '../hooks/useBoardingPoints';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import { Search, Plus, Edit, Trash2, MapPin, Building2, ChevronDown, ChevronUp, Navigation, ExternalLink, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const emptyCity = { name: '', state: '' };
const emptyBP = { name: '', googleMapLink: '', latitude: '', longitude: '' };

// ── SortableCityCard: wraps a city card with drag-and-drop ──────────────────
function SortableCityCard({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'shadow-2xl rounded-2xl' : ''}>
      {typeof children === 'function'
        ? children({ dragHandleProps: { ...attributes, ...listeners } })
        : children}
    </div>
  );
}

// ── SortableBPRow: wraps a boarding point row with drag-and-drop ────────────
function SortableBPRow({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {typeof children === 'function'
        ? children({ dragHandleProps: { ...attributes, ...listeners } })
        : children}
    </div>
  );
}

// ── BoardingPointsSection: expanded panel per city with its own DnD context ─
function BoardingPointsSection({ cityId, onAddBP, onEditBP, onDeleteBP, toast }) {
  const { data: boardingPoints, reorder: reorderBPs } = useBoardingPoints(cityId);

  // Local ordered copy for optimistic drag-and-drop UI.
  // We only reset from the server when the set of IDs changes (add/delete/initial
  // load), NOT on every render — because useBoardingPoints returns a new array
  // reference on every Apollo cache read, which would otherwise overwrite the
  // optimistic order immediately after a drag.
  const [orderedBPs, setOrderedBPs] = useState(boardingPoints);
  const prevBPIdsRef = useRef(null);
  useEffect(() => {
    const incoming = boardingPoints.map(bp => bp.id || bp._id).join(',');
    if (incoming !== prevBPIdsRef.current) {
      prevBPIdsRef.current = incoming;
      setOrderedBPs(boardingPoints);
    }
  }, [boardingPoints]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedBPs.findIndex(bp => (bp.id || bp._id) === active.id);
    const newIndex = orderedBPs.findIndex(bp => (bp.id || bp._id) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = orderedBPs;
    const reordered = arrayMove(orderedBPs, oldIndex, newIndex);
    setOrderedBPs(reordered);

    try {
      await reorderBPs(reordered.map(bp => bp.id || bp._id));
    } catch (err) {
      setOrderedBPs(previous);
      toast.error(err.message || 'Failed to save boarding point order');
    }
  };

  if (orderedBPs.length === 0) {
    return (
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-slate-400 italic py-2">No boarding points yet</p>
        <button onClick={() => onAddBP(cityId)} className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 cursor-pointer">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Navigation className="w-3 h-3" /> Boarding Points
        </h4>
        <button onClick={() => onAddBP(cityId)} className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 cursor-pointer">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedBPs.map(bp => bp.id || bp._id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orderedBPs.map(bp => (
              <SortableBPRow key={bp._id || bp.id} id={bp.id || bp._id}>
                {({ dragHandleProps }) => (
                  <div className="bg-white rounded-lg p-3 border border-slate-100 flex items-start justify-between group/bp">
                    <button
                      {...dragHandleProps}
                      onClick={(e) => e.stopPropagation()}
                      className="self-center text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none shrink-0 mr-2"
                      title="Drag to reorder"
                      aria-label="Drag to reorder boarding point"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">{bp.name}</p>
                      {bp.googleMapLink && (
                        <a href={bp.googleMapLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary-600 hover:underline flex items-center gap-1 mt-0.5">
                          <ExternalLink className="w-3 h-3" /> Maps Link
                        </a>
                      )}
                      {(bp.latitude || bp.longitude) && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{bp.latitude}, {bp.longitude}</p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover/bp:opacity-100 transition-opacity shrink-0 ml-2">
                      <button onClick={() => onEditBP(bp)} className="p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer">
                        <Edit className="w-3 h-3 text-slate-400" />
                      </button>
                      <button onClick={() => onDeleteBP(bp._id || bp.id)} className="p-1 hover:bg-red-50 rounded transition-colors cursor-pointer">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                )}
              </SortableBPRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}

export default function CitiesPage() {
  const { data: citiesList, loading, error, add: addCity, update: updateCity, remove: removeCity, reorder: reorderCities } = useCities();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [formData, setFormData] = useState(emptyCity);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [expandedCity, setExpandedCity] = useState(null);

  // Boarding point states
  const [showBPModal, setShowBPModal] = useState(false);
  const [editingBP, setEditingBP] = useState(null);
  const [bpForm, setBpForm] = useState(emptyBP);
  const [bpCityId, setBpCityId] = useState(null);
  const [deleteBPConfirm, setDeleteBPConfirm] = useState(null);

  // For deleting a BP we still need the boardingPoints hook at page level (delete-confirm modal)
  const { remove: removeBP, update: updateBP, add: addBP } = useBoardingPoints(bpCityId || expandedCity);

  // Local ordered copy of cities for optimistic drag-and-drop UI.
  // We only reset from the server when the set of IDs changes (add/delete/initial
  // load), NOT on every render — because useCities returns a new array reference
  // on every Apollo cache read, which would otherwise overwrite the optimistic
  // order immediately after a drag drops and triggers a re-render.
  const [orderedCities, setOrderedCities] = useState(citiesList);
  const prevCityIdsRef = useRef(null);
  useEffect(() => {
    const incoming = citiesList.map(c => c.id || c._id).join(',');
    if (incoming !== prevCityIdsRef.current) {
      prevCityIdsRef.current = incoming;
      setOrderedCities(citiesList);
    }
  }, [citiesList]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleCityDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedCities.findIndex(c => (c.id || c._id) === active.id);
    const newIndex = orderedCities.findIndex(c => (c.id || c._id) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = orderedCities;
    const reordered = arrayMove(orderedCities, oldIndex, newIndex);
    setOrderedCities(reordered);

    try {
      await reorderCities(reordered.map(c => c.id || c._id));
    } catch (err) {
      setOrderedCities(previous);
      toast.error(err.message || 'Failed to save city order');
    }
  };

  const filtered = orderedCities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.state || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => { setEditingCity(null); setFormData(emptyCity); setShowModal(true); };

  const handleEdit = (city) => {
    setEditingCity(city);
    setFormData({ name: city.name, state: city.state || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editingCity) {
      await updateCity(editingCity.id || editingCity._id, formData);
    } else {
      await addCity(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => { removeCity(id); setShowDeleteConfirm(null); };

  const toggleCity = (cityId) => {
    setExpandedCity(expandedCity === cityId ? null : cityId);
  };

  const handleAddBP = (cityId) => {
    setBpCityId(cityId);
    setEditingBP(null);
    setBpForm(emptyBP);
    setShowBPModal(true);
  };

  const handleEditBP = (bp) => {
    setBpCityId(bp.cityId);
    setEditingBP(bp);
    setBpForm({ name: bp.name, googleMapLink: bp.googleMapLink || '', latitude: bp.latitude != null ? String(bp.latitude) : '', longitude: bp.longitude != null ? String(bp.longitude) : '' });
    setShowBPModal(true);
  };

  const handleSaveBP = async () => {
    const input = {
      ...bpForm,
      cityId: bpCityId,
      latitude: bpForm.latitude ? parseFloat(bpForm.latitude) : undefined,
      longitude: bpForm.longitude ? parseFloat(bpForm.longitude) : undefined,
    };
    if (!input.googleMapLink) delete input.googleMapLink;
    if (editingBP) {
      const { cityId, ...updates } = input;
      await updateBP(editingBP._id || editingBP.id, updates);
    } else {
      await addBP(input);
    }
    setShowBPModal(false);
  };

  const handleDeleteBP = async (id) => { await removeBP(id); setDeleteBPConfirm(null); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Cities</h1>
          <p className="page-subtitle mt-1">{filtered.length} departure cities — drag to reorder</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add City
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Cities Grid with drag-and-drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCityDragEnd}>
        <SortableContext items={filtered.map(c => c.id || c._id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(city => {
              const cityId = city.id || city._id;
              const isExpanded = expandedCity === cityId;
              return (
                <SortableCityCard key={cityId} id={cityId}>
                  {({ dragHandleProps }) => (
                    <div className="card group hover:shadow-lg transition-all duration-300">
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {/* Drag handle */}
                            <button
                              {...dragHandleProps}
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
                              title="Drag to reorder city"
                              aria-label="Drag to reorder city"
                            >
                              <GripVertical className="w-4 h-4" />
                            </button>
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200/60 flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-primary-600" />
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(city)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                              <Edit className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                            <button onClick={() => setShowDeleteConfirm(cityId)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">{city.name}</h3>
                        {city.state && (
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5" /> {city.state}
                          </p>
                        )}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${city.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {city.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => toggleCity(cityId)}
                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
                          >
                            <Navigation className="w-3 h-3" />
                            Boarding Points
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Boarding Points Section — own DnD context per city */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-fade-in">
                          <BoardingPointsSection
                            cityId={cityId}
                            onAddBP={handleAddBP}
                            onEditBP={handleEditBP}
                            onDeleteBP={(bpId) => { setBpCityId(cityId); setDeleteBPConfirm(bpId); }}
                            toast={toast}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </SortableCityCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No cities found. Add your first departure city to get started.</p>
        </div>
      )}

      {/* Delete City Confirmation */}
      <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete City" size="sm">
        <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this city? Departures linked to it will lose their city reference.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">Cancel</button>
          <button onClick={() => handleDelete(showDeleteConfirm)} className="btn-danger">Delete</button>
        </div>
      </Modal>

      {/* Delete BP Confirmation */}
      <Modal isOpen={!!deleteBPConfirm} onClose={() => setDeleteBPConfirm(null)} title="Delete Boarding Point" size="sm">
        <p className="text-sm text-slate-600 mb-4">Remove this boarding point?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteBPConfirm(null)} className="btn-secondary">Cancel</button>
          <button onClick={() => handleDeleteBP(deleteBPConfirm)} className="btn-danger">Delete</button>
        </div>
      </Modal>

      {/* Add/Edit City Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCity ? 'Edit City' : 'Add New City'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City Name</label>
            <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="e.g. Pune" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
            <input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="input-field" placeholder="e.g. Maharashtra" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">{editingCity ? 'Save Changes' : 'Add City'}</button>
        </div>
      </Modal>

      {/* Add/Edit Boarding Point Modal */}
      <Modal isOpen={showBPModal} onClose={() => setShowBPModal(false)} title={editingBP ? 'Edit Boarding Point' : 'Add Boarding Point'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Boarding Point Name *</label>
            <input value={bpForm.name} onChange={(e) => setBpForm({ ...bpForm, name: e.target.value })} className="input-field" placeholder="e.g. Swargate Bus Stop" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Google Maps Link</label>
            <input value={bpForm.googleMapLink} onChange={(e) => setBpForm({ ...bpForm, googleMapLink: e.target.value })} className="input-field" placeholder="https://maps.google.com/..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
              <input type="number" step="any" value={bpForm.latitude} onChange={(e) => setBpForm({ ...bpForm, latitude: e.target.value })} className="input-field" placeholder="18.5204" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
              <input type="number" step="any" value={bpForm.longitude} onChange={(e) => setBpForm({ ...bpForm, longitude: e.target.value })} className="input-field" placeholder="73.8567" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowBPModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSaveBP} disabled={!bpForm.name.trim()} className="btn-primary">{editingBP ? 'Save Changes' : 'Add Boarding Point'}</button>
        </div>
      </Modal>
    </div>
  );
}
