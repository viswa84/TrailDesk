import { useState } from 'react';
import { useCities } from '../hooks/useCities';
import { useBoardingPoints } from '../hooks/useBoardingPoints';
import Modal from '../components/ui/Modal';
import { Search, Plus, Edit, Trash2, MapPin, Building2, ChevronDown, ChevronUp, Navigation, ExternalLink } from 'lucide-react';

const emptyCity = { name: '', state: '' };
const emptyBP = { name: '', googleMapLink: '', latitude: '', longitude: '' };

export default function CitiesPage() {
    const { data: citiesList, loading, error, add: addCity, update: updateCity, remove: removeCity } = useCities();
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

    const { data: boardingPoints, add: addBP, update: updateBP, remove: removeBP } = useBoardingPoints(expandedCity);

    const filtered = citiesList.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.state || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = () => { setEditingCity(null); setFormData(emptyCity); setShowModal(true); };

    const handleEdit = (city) => {
        setEditingCity(city);
        setFormData({ name: city.name, state: city.state || '' });
        setShowModal(true);
    };

    const handleSave = () => {
        if (editingCity) {
            updateCity(editingCity.id || editingCity._id, formData);
        } else {
            addCity(formData);
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
                    <p className="page-subtitle mt-1">{filtered.length} departure cities</p>
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

            {/* Cities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(city => {
                    const cityId = city.id || city._id;
                    const isExpanded = expandedCity === cityId;
                    return (
                        <div key={cityId} className="card group hover:shadow-lg transition-all duration-300">
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200/60 flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-primary-600" />
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

                            {/* Boarding Points Section */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-fade-in">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                            <Navigation className="w-3 h-3" /> Boarding Points
                                        </h4>
                                        <button onClick={() => handleAddBP(cityId)} className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 cursor-pointer">
                                            <Plus className="w-3 h-3" /> Add
                                        </button>
                                    </div>
                                    {boardingPoints.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic py-2">No boarding points yet</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {boardingPoints.map(bp => (
                                                <div key={bp._id} className="bg-white rounded-lg p-3 border border-slate-100 flex items-start justify-between group/bp">
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
                                                        <button onClick={() => handleEditBP(bp)} className="p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer">
                                                            <Edit className="w-3 h-3 text-slate-400" />
                                                        </button>
                                                        <button onClick={() => setDeleteBPConfirm(bp._id)} className="p-1 hover:bg-red-50 rounded transition-colors cursor-pointer">
                                                            <Trash2 className="w-3 h-3 text-red-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

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
