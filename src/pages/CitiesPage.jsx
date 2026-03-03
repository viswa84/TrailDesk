import { useState } from 'react';
import { useCities } from '../hooks/useCities';
import Modal from '../components/ui/Modal';
import { Search, Plus, Edit, Trash2, MapPin, Building2 } from 'lucide-react';

const emptyCity = { name: '', state: '' };

export default function CitiesPage() {
    const { data: citiesList, loading, error, add: addCity, update: updateCity, remove: removeCity } = useCities();
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCity, setEditingCity] = useState(null);
    const [formData, setFormData] = useState(emptyCity);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

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
                {filtered.map(city => (
                    <div key={city.id || city._id} className="card p-5 group hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200/60 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-primary-600" />
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(city)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                    <Edit className="w-3.5 h-3.5 text-slate-500" />
                                </button>
                                <button onClick={() => setShowDeleteConfirm(city.id || city._id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
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
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${city.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {city.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="card p-12 text-center">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No cities found. Add your first departure city to get started.</p>
                </div>
            )}

            {/* Delete Confirmation */}
            <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete City" size="sm">
                <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this city? Departures linked to it will lose their city reference.</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">Cancel</button>
                    <button onClick={() => handleDelete(showDeleteConfirm)} className="btn-danger">Delete</button>
                </div>
            </Modal>

            {/* Add/Edit Modal */}
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
        </div>
    );
}
