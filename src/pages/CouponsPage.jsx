import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_COUPONS } from '../graphql/queries';
import { CREATE_COUPON, UPDATE_COUPON, DELETE_COUPON, TOGGLE_COUPON } from '../graphql/mutations';
import { format, parseISO } from 'date-fns';
import { Plus, Edit, Trash2, Tag, ToggleLeft, ToggleRight, Percent, Hash, IndianRupee } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

const DISCOUNT_TYPE_LABELS = {
  percentage: 'Percentage (%)',
  fixed_per_ticket: 'Fixed per Ticket (₹)',
  fixed_overall: 'Fixed Overall (₹)',
};

const emptyForm = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minPeople: '1',
  maxUses: '',
  validFrom: '',
  validTo: '',
  isActive: true,
};

function fmtDate(iso) {
  if (!iso) return '—';
  try { return format(parseISO(iso), 'dd MMM yyyy'); } catch { return '—'; }
}

function discountLabel(coupon) {
  if (coupon.discountType === 'percentage') return `${coupon.discountValue}%`;
  if (coupon.discountType === 'fixed_per_ticket') return `₹${coupon.discountValue}/ticket`;
  if (coupon.discountType === 'fixed_overall') return `₹${coupon.discountValue} off`;
  return coupon.discountValue;
}

export default function CouponsPage() {
  const toast = useToast();
  const { data, loading, refetch } = useQuery(GET_COUPONS);
  const coupons = data?.getCoupons || [];

  const [createCoupon] = useMutation(CREATE_COUPON, { refetchQueries: [{ query: GET_COUPONS }] });
  const [updateCoupon] = useMutation(UPDATE_COUPON, { refetchQueries: [{ query: GET_COUPONS }] });
  const [deleteCoupon] = useMutation(DELETE_COUPON, { refetchQueries: [{ query: GET_COUPONS }] });
  const [toggleCoupon] = useMutation(TOGGLE_COUPON, { refetchQueries: [{ query: GET_COUPONS }] });

  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openCreate = () => {
    setEditingCoupon(null);
    setFormData(emptyForm);
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue != null ? String(coupon.discountValue) : '',
      minPeople: coupon.minPeople != null ? String(coupon.minPeople) : '1',
      maxUses: coupon.maxUses != null ? String(coupon.maxUses) : '',
      validFrom: coupon.validFrom ? coupon.validFrom.slice(0, 10) : '',
      validTo: coupon.validTo ? coupon.validTo.slice(0, 10) : '',
      isActive: coupon.isActive !== false,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.code.trim()) errs.code = 'Code is required';
    if (!formData.discountValue || isNaN(Number(formData.discountValue)) || Number(formData.discountValue) <= 0)
      errs.discountValue = 'Enter a valid discount value';
    if (formData.discountType === 'percentage' && Number(formData.discountValue) > 100)
      errs.discountValue = 'Percentage cannot exceed 100';
    return errs;
  };

  const handleSave = async () => {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    const input = {
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim(),
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      minPeople: parseInt(formData.minPeople, 10) || 1,
      maxUses: formData.maxUses !== '' ? parseInt(formData.maxUses, 10) : null,
      validFrom: formData.validFrom || null,
      validTo: formData.validTo || null,
      isActive: formData.isActive,
    };

    try {
      if (editingCoupon) {
        await updateCoupon({ variables: { id: editingCoupon._id, input } });
        toast.success('Coupon updated');
      } else {
        await createCoupon({ variables: { input } });
        toast.success('Coupon created');
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCoupon({ variables: { id: deleteTarget._id } });
      toast.success('Coupon deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete coupon');
    }
  };

  const handleToggle = async (coupon) => {
    try {
      await toggleCoupon({ variables: { id: coupon._id } });
      toast.success(coupon.isActive ? 'Coupon deactivated' : 'Coupon activated');
    } catch (err) {
      toast.error(err.message || 'Failed to toggle coupon');
    }
  };

  const setField = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Coupon Codes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage promo codes for departures that accept them</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading coupons…</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No coupon codes yet</p>
            <p className="text-slate-400 text-sm mt-1">Create your first promo code to offer discounts on departures</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Discount</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Min People</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Uses</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Valid Period</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {coupons.map(coupon => (
                  <tr key={coupon._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                          <Tag className="w-3.5 h-3.5 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-slate-800 tracking-wide">{coupon.code}</div>
                          {coupon.description && <div className="text-xs text-slate-400 mt-0.5">{coupon.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-xs">
                        {coupon.discountType === 'percentage' ? <Percent className="w-3 h-3" /> : <IndianRupee className="w-3 h-3" />}
                        {discountLabel(coupon)}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{DISCOUNT_TYPE_LABELS[coupon.discountType]}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{coupon.minPeople || 1}</td>
                    <td className="px-4 py-3">
                      <span className="text-slate-700 font-medium">{coupon.usedCount || 0}</span>
                      {coupon.maxUses != null && (
                        <span className="text-slate-400"> / {coupon.maxUses}</span>
                      )}
                      {coupon.maxUses == null && <span className="text-slate-400"> / ∞</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {coupon.validFrom || coupon.validTo ? (
                        <>
                          {coupon.validFrom ? fmtDate(coupon.validFrom) : '—'}
                          {' → '}
                          {coupon.validTo ? fmtDate(coupon.validTo) : '—'}
                        </>
                      ) : (
                        <span className="text-slate-400">Always valid</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(coupon)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                          coupon.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {coupon.isActive
                          ? <ToggleRight className="w-3.5 h-3.5" />
                          : <ToggleLeft className="w-3.5 h-3.5" />
                        }
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(coupon)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Edit coupon"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(coupon)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingCoupon ? 'Edit Coupon' : 'New Coupon Code'}
        size="md"
      >
        <div className="space-y-4">
          {/* Code + Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`input-field font-mono uppercase tracking-widest ${formErrors.code ? 'border-red-400' : ''}`}
                placeholder="e.g. SUMMER20"
                value={formData.code}
                onChange={e => setField('code', e.target.value.toUpperCase())}
              />
              {formErrors.code && <p className="text-red-500 text-xs mt-1">{formErrors.code}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <input
                type="text"
                className="input-field"
                placeholder="Optional note"
                value={formData.description}
                onChange={e => setField('description', e.target.value)}
              />
            </div>
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Discount Type <span className="text-red-500">*</span>
            </label>
            <select
              className="input-field"
              value={formData.discountType}
              onChange={e => setField('discountType', e.target.value)}
            >
              <option value="percentage">Percentage (%) off total</option>
              <option value="fixed_per_ticket">Fixed amount (₹) per ticket</option>
              <option value="fixed_overall">Fixed amount (₹) overall</option>
            </select>
          </div>

          {/* Discount Value + Min People */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                  {formData.discountType === 'percentage' ? '%' : '₹'}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={`input-field pl-7 ${formErrors.discountValue ? 'border-red-400' : ''}`}
                  placeholder={formData.discountType === 'percentage' ? '20' : '500'}
                  value={formData.discountValue}
                  onChange={e => setField('discountValue', e.target.value)}
                />
              </div>
              {formErrors.discountValue && <p className="text-red-500 text-xs mt-1">{formErrors.discountValue}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Group Size</label>
              <input
                type="number"
                min="1"
                className="input-field"
                placeholder="1"
                value={formData.minPeople}
                onChange={e => setField('minPeople', e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">Minimum number of people required</p>
            </div>
          </div>

          {/* Max Uses */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max Uses</label>
            <input
              type="number"
              min="1"
              className="input-field"
              placeholder="Leave empty for unlimited"
              value={formData.maxUses}
              onChange={e => setField('maxUses', e.target.value)}
            />
          </div>

          {/* Valid From / To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valid From</label>
              <input
                type="date"
                className="input-field"
                value={formData.validFrom}
                onChange={e => setField('validFrom', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valid To</label>
              <input
                type="date"
                className="input-field"
                value={formData.validTo}
                onChange={e => setField('validTo', e.target.value)}
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={e => setField('isActive', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-slate-700">Coupon is active</span>
            </label>
            <p className="text-[11px] text-slate-400 mt-1 ml-6">Inactive coupons cannot be applied at checkout</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">
            {editingCoupon ? 'Save Changes' : 'Create Coupon'}
          </button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Coupon"
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-5">
          Are you sure you want to delete coupon{' '}
          <span className="font-mono font-bold text-slate-800">{deleteTarget?.code}</span>?
          {' '}This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} className="btn-danger">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
