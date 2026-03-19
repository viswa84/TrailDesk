import { useState } from 'react';
import { useGuides } from '../hooks/useGuides';
import Modal from '../components/ui/Modal';
import { Search, Plus, Edit, Trash2, Award, Navigation, Star, FileText, Phone } from 'lucide-react';

const emptyGuide = {
    name: '',
    phone: '',
    experience: '',
    certifications: '',
    rating: 0,
    treksLed: 0,
    avatar: ''
};

export default function GuidesPage() {
    const { guides, loading, error, addGuide, updateGuide, deleteGuide } = useGuides();
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingGuide, setEditingGuide] = useState(null);
    const [formData, setFormData] = useState(emptyGuide);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const filtered = guides.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.phone || '').includes(search)
    );

    const handleAdd = () => {
        setEditingGuide(null);
        setFormData(emptyGuide);
        setShowModal(true);
    };

    const handleEdit = (guide) => {
        setEditingGuide(guide);
        setFormData({
            name: guide.name,
            phone: guide.phone || '',
            experience: guide.experience || '',
            certifications: guide.certifications ? guide.certifications.join(', ') : '',
            rating: guide.rating || 0,
            treksLed: guide.treksLed || 0,
            avatar: guide.avatar || ''
        });
        setShowModal(true);
    };

    const handleSave = () => {
        // Process input
        const input = {
            ...formData,
            rating: parseFloat(formData.rating) || 0,
            treksLed: parseInt(formData.treksLed, 10) || 0,
            certifications: formData.certifications.split(',').map(c => c.trim()).filter(Boolean)
        };

        if (editingGuide) {
            updateGuide(editingGuide.id || editingGuide._id, input);
        } else {
            addGuide(input);
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        deleteGuide(id);
        setShowDeleteConfirm(null);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Guides</h1>
                    <p className="page-subtitle mt-1">{filtered.length} active guides</p>
                </div>
                <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Guide
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading guides...</div>
                ) : error ? (
                    <div className="p-12 text-center text-red-500">Error loading guides</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">No guides found. Add your first guide!</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 tracking-wider">
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Phone</th>
                                    <th className="px-6 py-4">Experience</th>
                                    <th className="px-6 py-4">Treks Led</th>
                                    <th className="px-6 py-4">Rating</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((guide) => {
                                    const id = guide.id || guide._id;
                                    return (
                                        <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900">{guide.name}</div>
                                                {guide.certifications && guide.certifications.length > 0 && (
                                                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                                        {guide.certifications.join(', ')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    {guide.phone ? (
                                                        <>
                                                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                            {guide.phone}
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-400 italic">No phone</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                                    <FileText className="w-4 h-4 text-slate-400" />
                                                    <span className="max-w-[150px] truncate" title={guide.experience}>{guide.experience || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                                    <Navigation className="w-4 h-4 text-slate-400" />
                                                    {guide.treksLed || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                    {guide.rating ? guide.rating.toFixed(1) : '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(guide)}
                                                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                                                        title="Edit guide"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Delete guide"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CREATE/EDIT MODAL */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingGuide ? "Edit Guide" : "New Guide"} size="md">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            placeholder="e.g. Ramesh Singh"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input
                            type="text"
                            maxLength={10}
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            placeholder="e.g. 9876543210"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Experience Info</label>
                        <textarea
                            value={formData.experience}
                            onChange={e => setFormData({ ...formData, experience: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-h-[60px] resize-none"
                            placeholder="e.g. 5 years trekking in Himalayas"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Certifications (comma-separated)</label>
                        <input
                            type="text"
                            value={formData.certifications}
                            onChange={e => setFormData({ ...formData, certifications: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            placeholder="e.g. First Aid, Advanced Mountaineering"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Treks Led</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.treksLed}
                                onChange={e => setFormData({ ...formData, treksLed: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Rating (0-5)</label>
                            <input
                                type="number"
                                min="0"
                                max="5"
                                step="0.1"
                                value={formData.rating}
                                onChange={e => setFormData({ ...formData, rating: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                placeholder="4.5"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={!formData.name} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {editingGuide ? 'Save Changes' : 'Add Guide'}
                    </button>
                </div>
            </Modal>

            {/* DELETE CONFIRM MODAL */}
            <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Guide" size="sm">
                <p className="text-sm text-slate-600 mb-4">Are you sure you want to remove this guide? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                        Delete
                    </button>
                </div>
            </Modal>

        </div>
    );
}
