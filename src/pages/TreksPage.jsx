import { useState } from 'react';
import { useTreks } from '../hooks/useTreks';
import Modal from '../components/ui/Modal';
import { Search, Plus, Edit, Trash2, Mountain, MapPin } from 'lucide-react';

const difficultyColors = {
  Easy: 'badge-green',
  Moderate: 'badge-yellow',
  Difficult: 'badge-red',
};

const emptyTrek = { name: '', location: '', difficulty: 'Easy', altitude: '', bestSeason: '', description: '', image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&h=250&fit=crop' };

export default function TreksPage() {
  const { data: treksList, loading, error, add: addTrek, update: updateTrek, remove: removeTrek } = useTreks();
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingTrek, setEditingTrek] = useState(null);
  const [formData, setFormData] = useState(emptyTrek);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const difficulties = ['All', 'Easy', 'Moderate', 'Difficult'];

  const filtered = treksList.filter(t => {
    const matchesSearch = (t.name || '').toLowerCase().includes(search.toLowerCase()) || (t.location || '').toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || t.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const handleAdd = () => { setEditingTrek(null); setFormData(emptyTrek); setShowModal(true); };

  const handleEdit = (trek) => {
    setEditingTrek(trek);
    setFormData({ ...trek });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingTrek) {
      updateTrek(editingTrek.id || editingTrek._id, formData);
    } else {
      addTrek(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => { removeTrek(id); setShowDeleteConfirm(null); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Treks Catalog</h1>
          <p className="page-subtitle mt-1">{filtered.length} treks available</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Trek
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search treks..." className="input-field pl-10" />
          </div>
          <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="select-field sm:w-40">
            {difficulties.map(d => <option key={d} value={d}>{d === 'All' ? 'All Difficulty' : d}</option>)}
          </select>
        </div>
      </div>

      {/* Trek Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(trek => (
          <div key={trek.id || trek._id} className="card overflow-hidden group">
            <div className="relative h-44 overflow-hidden">
              <img
                src={trek.image}
                alt={trek.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&h=250&fit=crop'; }}
              />
              <div className="absolute top-3 left-3">
                <span className={difficultyColors[trek.difficulty]}>{trek.difficulty}</span>
              </div>
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(trek)} className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors shadow-sm">
                  <Edit className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <button onClick={() => setShowDeleteConfirm(trek.id || trek._id)} className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors shadow-sm">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-white text-xs font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {trek.location}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">{trek.name}</h3>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Mountain className="w-3 h-3" /> {trek.altitude}</span>
                {trek.bestSeason && <span>{trek.bestSeason}</span>}
              </div>
              {trek.description && (
                <p className="text-xs text-slate-400 line-clamp-2">{trek.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Mountain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No treks found matching your filters.</p>
        </div>
      )}

      {/* Delete Confirmation */}
      <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Trek" size="sm">
        <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this trek? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">Cancel</button>
          <button onClick={() => handleDelete(showDeleteConfirm)} className="btn-danger">Delete</button>
        </div>
      </Modal>

      {/* Add/Edit Modal — Simplified Trek */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTrek ? 'Edit Trek' : 'Add New Trek'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Trek Name</label>
            <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="e.g. Kedarkantha" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location / Place</label>
            <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-field" placeholder="e.g. Uttarakhand" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
            <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="select-field">
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Difficult">Difficult</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Altitude</label>
            <input value={formData.altitude} onChange={(e) => setFormData({ ...formData, altitude: e.target.value })} className="input-field" placeholder="e.g. 12,500 ft" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Best Season</label>
            <input value={formData.bestSeason} onChange={(e) => setFormData({ ...formData, bestSeason: e.target.value })} className="input-field" placeholder="e.g. Dec-Apr" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
            <input value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="input-field" placeholder="https://..." />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (About the place)</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field min-h-[80px] resize-none" placeholder="Describe the trek location..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">{editingTrek ? 'Save Changes' : 'Add Trek'}</button>
        </div>
      </Modal>
    </div>
  );
}
