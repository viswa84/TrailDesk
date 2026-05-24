import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_FOLLOW_UP_RULES } from '../graphql/queries';
import {
  SAVE_FOLLOW_UP_RULE,
  DELETE_FOLLOW_UP_RULE,
  SET_FOLLOW_UP_RULE_ENABLED,
} from '../graphql/mutations';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import { Plus, Pencil, Trash2, Loader2, MessageSquare } from 'lucide-react';

const CONDITION_LABELS = {
  no_booking: 'Inactive — no booking yet',
  pending_booking: 'Inactive — booking pending payment',
  any_inactive: 'Inactive — any user',
};

const RULE_EMPTY = {
  name: '',
  condition: 'no_booking',
  delayHours: 23,
  message: '',
  enabled: true,
};

function RuleModal({ rule, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(rule?._id);
  const [form, setForm] = useState({
    name: rule?.name || '',
    condition: rule?.condition || 'no_booking',
    delayHours: rule?.delayHours ?? 23,
    message: rule?.message || '',
    enabled: rule?.enabled !== undefined ? rule.enabled : true,
  });
  const [saving, setSaving] = useState(false);

  const [saveRule] = useMutation(SAVE_FOLLOW_UP_RULE, {
    refetchQueries: [{ query: GET_FOLLOW_UP_RULES }],
  });

  const setF = (field) => (e) =>
    setForm((prev) => ({
      ...prev,
      [field]: field === 'delayHours' ? Number(e.target.value) : e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Rule name is required.'); return; }
    if (!form.message.trim()) { toast.error('Message text is required.'); return; }
    const hours = Number(form.delayHours);
    if (!Number.isInteger(hours) || hours < 1 || hours > 23) {
      toast.error('Delay must be between 1 and 23 hours.');
      return;
    }
    setSaving(true);
    try {
      await saveRule({
        variables: {
          id: isEdit ? rule._id : undefined,
          input: { ...form, delayHours: hours, enabled: form.enabled !== false },
        },
      });
      toast.success(isEdit ? 'Rule updated.' : 'Rule created.');
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Failed to save rule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit Follow-up Rule' : 'New Follow-up Rule'}
      size="md"
      confirmOnClose
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rule Name</label>
            <input
              type="text"
              value={form.name}
              onChange={setF('name')}
              placeholder='e.g. "23h reminder — no booking"'
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
            <select value={form.condition} onChange={setF('condition')} className="input-field">
              <option value="no_booking">Inactive — no booking yet</option>
              <option value="pending_booking">Inactive — booking pending payment</option>
              <option value="any_inactive">Inactive — any user</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              When should this message be sent? Choose based on the customer's booking status.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Delay Hours <span className="font-normal text-slate-500">(1 – 23)</span>
            </label>
            <input
              type="number"
              value={form.delayHours}
              onChange={setF('delayHours')}
              min={1}
              max={23}
              className="input-field"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Hours after the customer's last message before this rule fires. Must be under 24 to stay inside the free service window.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea
              value={form.message}
              onChange={setF('message')}
              rows={4}
              className="input-field resize-none"
              placeholder="Hi {name}! We noticed you were exploring our treks..."
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Use <code className="bg-slate-100 px-1 rounded">{'{name}'}</code> to insert the customer's name (falls back to "there" if unknown).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="ruleEnabled"
              type="checkbox"
              checked={form.enabled !== false}
              onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="rounded border-slate-300"
            />
            <label htmlFor="ruleEnabled" className="text-sm text-slate-700">Enabled</label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {isEdit ? 'Save Changes' : 'Create Rule'}
            </button>
          </div>
      </form>
    </Modal>
  );
}

export default function FollowUpRulesSection() {
  const toast = useToast();
  const { data, loading } = useQuery(GET_FOLLOW_UP_RULES, { fetchPolicy: 'cache-and-network' });
  const [modalRule, setModalRule] = useState(null); // null = closed, RULE_EMPTY = new, rule doc = edit
  const [deleting, setDeleting] = useState(null);

  const refetchOpts = { refetchQueries: [{ query: GET_FOLLOW_UP_RULES }] };
  const [deleteRule] = useMutation(DELETE_FOLLOW_UP_RULE, refetchOpts);
  const [setEnabled] = useMutation(SET_FOLLOW_UP_RULE_ENABLED, refetchOpts);

  const rules = data?.getFollowUpRules || [];

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this follow-up rule?')) return;
    setDeleting(id);
    try {
      await deleteRule({ variables: { id } });
      toast.success('Rule deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete rule.');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (rule) => {
    try {
      await setEnabled({ variables: { id: rule._id, enabled: !rule.enabled } });
    } catch (err) {
      toast.error(err.message || 'Failed to toggle rule.');
    }
  };

  return (
    <>
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-900 text-sm">Follow-up Messages</h3>
          </div>
          <button
            onClick={() => setModalRule(RULE_EMPTY)}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Rule
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-slate-500 mb-4">
            Automatically send a re-engagement WhatsApp message before the 24-hour free service window closes.
            Rules are evaluated every 10 minutes.
          </p>

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading rules...
            </div>
          )}

          {!loading && rules.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">
              No follow-up rules yet. Click <strong>+ Add Rule</strong> to create one.
            </p>
          )}

          {rules.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                    <th className="pb-2 font-medium pr-4">Name</th>
                    <th className="pb-2 font-medium pr-4">Condition</th>
                    <th className="pb-2 font-medium pr-4">Delay</th>
                    <th className="pb-2 font-medium pr-4">Enabled</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rules.map((rule) => (
                    <tr key={rule._id} className="group">
                      <td className="py-2.5 pr-4 font-medium text-slate-800">{rule.name}</td>
                      <td className="py-2.5 pr-4 text-slate-600">
                        {CONDITION_LABELS[rule.condition] || rule.condition}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">{rule.delayHours}h</td>
                      <td className="py-2.5 pr-4">
                        <button
                          onClick={() => handleToggle(rule)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                            rule.enabled ? 'bg-green-500' : 'bg-slate-200'
                          }`}
                          role="switch"
                          aria-checked={rule.enabled}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              rule.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setModalRule(rule)}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                            title="Edit rule"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule._id)}
                            disabled={deleting === rule._id}
                            className="text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Delete rule"
                          >
                            {deleting === rule._id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
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
      </div>

      {modalRule !== null && (
        <RuleModal
          rule={modalRule._id ? modalRule : null}
          onClose={() => setModalRule(null)}
          onSaved={() => setModalRule(null)}
        />
      )}
    </>
  );
}
