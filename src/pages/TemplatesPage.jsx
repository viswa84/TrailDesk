import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { bodyTextOf, variableIndices } from '../utils/whatsappTemplate';
import {
  Plus, Trash2, FileText, RefreshCcw, AlertTriangle, Loader2, X,
  Image as ImageIcon, Video as VideoIcon, File as FileIcon, CheckCircle2, UploadCloud,
} from 'lucide-react';
import Modal from '../components/ui/Modal';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/').replace(/\/$/, '');
const getToken = () => localStorage.getItem('trekops_token') || '';

async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// Upload a sample media file and return its handle.
// NOTE: FormData — do NOT set Content-Type manually (browser sets the multipart boundary).
async function uploadSampleMedia(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_URL}/api/templates/sample-media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data; // { handle }
}

// Media header type config: client-side accept + max-size guardrails.
const HEADER_MEDIA = {
  IMAGE:    { label: 'Image',    accept: 'image/*',          maxBytes: 5 * 1024 * 1024,   maxLabel: '5MB',   Icon: ImageIcon },
  VIDEO:    { label: 'Video',    accept: 'video/*',          maxBytes: 16 * 1024 * 1024,  maxLabel: '16MB',  Icon: VideoIcon },
  DOCUMENT: { label: 'Document', accept: 'application/pdf',  maxBytes: 100 * 1024 * 1024, maxLabel: '100MB', Icon: FileIcon },
};
const isMediaHeader = (t) => t === 'IMAGE' || t === 'VIDEO' || t === 'DOCUMENT';

// ── Status badge mapping ──────────────────────────────────────────────────────
function statusBadge(status) {
  const s = (status || '').toUpperCase();
  if (s === 'APPROVED') return { label: 'Active', cls: 'bg-emerald-50 text-emerald-700' };
  if (s === 'PENDING') return { label: 'Pending', cls: 'bg-amber-50 text-amber-700' };
  if (s === 'REJECTED') return { label: 'Rejected', cls: 'bg-red-50 text-red-700' };
  return { label: 'Inactive', cls: 'bg-slate-100 text-slate-500' };
}

// Derive a media-header tag from a template's components, or null for text/none.
function mediaHeaderTag(components = []) {
  const header = (components || []).find((c) => (c.type || '').toUpperCase() === 'HEADER');
  if (!header) return null;
  const fmt = (header.format || 'TEXT').toUpperCase();
  if (fmt === 'IMAGE') return 'Image header';
  if (fmt === 'VIDEO') return 'Video header';
  if (fmt === 'DOCUMENT') return 'Doc header';
  return null;
}

const NAME_RE = /^[a-z0-9_]+$/;
// Emoji / pictographs — disallowed in a TEXT header.
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️‍]/u;

const BUTTON_TYPES = [
  { value: 'QUICK_REPLY', label: 'Quick reply' },
  { value: 'URL_STATIC', label: 'URL (static)' },
  { value: 'URL_DYNAMIC', label: 'URL (dynamic, base + {{1}})' },
  { value: 'PHONE_NUMBER', label: 'Phone' },
];

const emptyForm = () => ({
  name: '',
  category: 'MARKETING',
  language: 'en',
  // headerType: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  headerType: 'NONE',
  headerText: '',
  headerExample: '',
  headerHandle: '',       // handle returned from /api/templates/sample-media
  headerFileName: '',     // for preview/indicator
  headerPreviewUrl: '',   // object URL for image preview
  headerUploadError: '',
  body: '',
  bodyExamples: [],
  footer: '',
  buttons: [],
});

const emptyButton = (type = 'QUICK_REPLY') => ({
  type,
  text: '',
  url: '',          // base URL (static or dynamic without the {{1}})
  urlExample: '',   // full sample URL for dynamic
  phone: '',
});

export default function TemplatesPage() {
  const toast = useToast();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [uploadingMedia, setUploadingMedia] = useState(false);

  // ── Standard catalog ────────────────────────────────────────────────────────
  // The set of messages every company is expected to have. The backend compares
  // it against this company's live WhatsApp account and reports what's missing
  // or drifted, so gaps surface here rather than when an agent tries to reply to
  // a customer outside the 24h window.
  const [catalog, setCatalog] = useState(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  // ── Load list ───────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { templates: t } = await api('/api/templates');
      setTemplates(t || []);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalog = async () => {
    try {
      setCatalog(await api('/api/templates/catalog'));
    } catch (e) {
      // Non-fatal: the main template list is still usable without the catalog.
      console.warn('Standard template catalog unavailable:', e.message);
    }
  };

  useEffect(() => { load(); loadCatalog(); }, []);

  // Create every standard template this company is missing. Meta reviews them
  // asynchronously, so they land as PENDING and become sendable on approval.
  const provisionStandard = async () => {
    setProvisioning(true);
    try {
      const res = await api('/api/templates/provision', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const created = res.created?.length || 0;
      const failed = res.failed?.length || 0;

      if (created) {
        toast.success(
          `Submitted ${created} template${created === 1 ? '' : 's'} to Meta for approval.` +
          (failed ? ` ${failed} failed.` : '')
        );
      } else if (failed) {
        toast.error(`Could not create ${failed} template${failed === 1 ? '' : 's'}: ${res.failed[0].error}`);
      } else {
        toast.success('All standard templates are already set up.');
      }

      await Promise.all([load(), loadCatalog()]);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProvisioning(false);
    }
  };

  // ── Body variables -> keep bodyExamples array length in sync ───────────────────
  const bodyVars = useMemo(() => variableIndices(form.body), [form.body]);
  const headerHasVar = useMemo(() => variableIndices(form.headerText).length > 0, [form.headerText]);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Switch the header type — clear fields that don't apply to the new type.
  const setHeaderType = (type) => {
    setForm((p) => ({
      ...p,
      headerType: type,
      headerText: '',
      headerExample: '',
      headerHandle: '',
      headerFileName: '',
      headerPreviewUrl: '',
      headerUploadError: '',
    }));
    setErrors((p) => ({ ...p, headerText: undefined, headerExample: undefined, headerMedia: undefined }));
  };

  // On file pick: validate size, then immediately upload to get a handle.
  const handleMediaPick = async (file) => {
    if (!file) return;
    const cfg = HEADER_MEDIA[form.headerType];
    if (!cfg) return;
    if (file.size > cfg.maxBytes) {
      setForm((p) => ({ ...p, headerHandle: '', headerUploadError: `File exceeds the ${cfg.maxLabel} limit for ${cfg.label.toLowerCase()} headers` }));
      return;
    }
    setForm((p) => ({ ...p, headerUploadError: '', headerFileName: file.name }));
    setErrors((p) => ({ ...p, headerMedia: undefined }));
    setUploadingMedia(true);
    try {
      const { handle } = await uploadSampleMedia(file);
      const previewUrl = form.headerType === 'IMAGE' ? URL.createObjectURL(file) : '';
      setForm((p) => ({ ...p, headerHandle: handle || '', headerPreviewUrl: previewUrl }));
    } catch (e) {
      setForm((p) => ({ ...p, headerHandle: '', headerUploadError: e.message }));
    } finally {
      setUploadingMedia(false);
    }
  };

  // ── Validation (mirrors Meta rules) ───────────────────────────────────────────
  const validate = () => {
    const errs = {};

    if (!form.name.trim()) errs.name = 'Name is required';
    else if (!NAME_RE.test(form.name)) errs.name = 'Only lowercase letters, digits, and underscores';

    if (!form.body.trim()) errs.body = 'Body is required';
    else {
      const trimmed = form.body.trim();
      if (/^\{\{\d+\}\}/.test(trimmed)) errs.body = 'Body cannot start with a variable';
      else if (/\{\{\d+\}\}$/.test(trimmed)) errs.body = 'Body cannot end with a variable';
      const missing = bodyVars.some((_, i) => !(form.bodyExamples[i] || '').trim());
      if (!errs.body && missing) errs.body = 'Provide an example value for every body variable';
    }

    if (form.headerType === 'TEXT') {
      const ht = form.headerText;
      if (!ht.trim()) errs.headerText = 'Header text is required (or set header type to None)';
      else if (EMOJI_RE.test(ht)) errs.headerText = 'Header cannot contain emoji';
      else if (ht.includes('*')) errs.headerText = 'Header cannot contain asterisks';
      else if (/[\r\n]/.test(ht)) errs.headerText = 'Header cannot contain newlines';
      else {
        const hv = variableIndices(ht);
        if (hv.length > 1) errs.headerText = 'Header may contain at most one variable {{1}}';
        else if (hv.length === 1 && !form.headerExample.trim()) errs.headerExample = 'Header example value is required';
      }
    } else if (isMediaHeader(form.headerType)) {
      if (!form.headerHandle) {
        errs.headerMedia = `Upload a sample ${HEADER_MEDIA[form.headerType].label.toLowerCase()} first`;
      }
    }

    if (form.footer) {
      if (variableIndices(form.footer).length > 0) errs.footer = 'Footer cannot contain variables';
      else if (form.footer.length > 60) errs.footer = 'Footer must be 60 characters or fewer';
    }

    if (form.buttons.length > 3) errs.buttons = 'At most 3 buttons';
    form.buttons.forEach((b, i) => {
      if (!b.text.trim()) errs[`btn_${i}_text`] = 'Button text is required';
      if (b.type === 'URL_STATIC') {
        if (!b.url.trim()) errs[`btn_${i}_url`] = 'URL is required';
      } else if (b.type === 'URL_DYNAMIC') {
        if (!b.url.trim()) errs[`btn_${i}_url`] = 'Base URL is required';
        else if (!b.url.includes('{{1}}')) errs[`btn_${i}_url`] = 'Dynamic URL must end with {{1}}';
        if (!b.urlExample.trim()) errs[`btn_${i}_urlExample`] = 'A full sample URL is required';
      } else if (b.type === 'PHONE_NUMBER') {
        if (!b.phone.trim()) errs[`btn_${i}_phone`] = 'Phone number is required';
      }
    });

    return errs;
  };

  // ── Build the guided spec the backend expects ─────────────────────────────────
  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      category: form.category,
      language: form.language || 'en',
      header: null,
      body: {
        text: form.body.trim(),
        examples: bodyVars.map((_, i) => (form.bodyExamples[i] || '').trim()),
      },
      footer: form.footer.trim() || null,
      buttons: [],
    };

    if (form.headerType === 'TEXT' && form.headerText.trim()) {
      const header = { format: 'TEXT', text: form.headerText.trim() };
      if (variableIndices(form.headerText).length === 1) header.example = [form.headerExample.trim()];
      payload.header = header;
    } else if (isMediaHeader(form.headerType) && form.headerHandle) {
      payload.header = { format: form.headerType, handle: form.headerHandle };
    }

    payload.buttons = form.buttons.map((b) => {
      if (b.type === 'QUICK_REPLY') return { type: 'QUICK_REPLY', text: b.text.trim() };
      if (b.type === 'PHONE_NUMBER') return { type: 'PHONE_NUMBER', text: b.text.trim(), phone: b.phone.trim() };
      if (b.type === 'URL_STATIC') return { type: 'URL', text: b.text.trim(), url: b.url.trim() };
      // URL_DYNAMIC
      return {
        type: 'URL',
        text: b.text.trim(),
        url: b.url.trim(),
        urlExample: [b.urlExample.trim()],
      };
    });

    return payload;
  };

  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api('/api/templates', {
        method: 'POST',
        body: JSON.stringify(buildPayload()),
      });
      toast.success(`Template submitted (${res.status || 'PENDING'})`);
      setShowForm(false);
      load();
    } catch (e) {
      // Surface Meta's reason verbatim.
      toast.error(e.message);
      setErrors((p) => ({ ...p, submit: e.message }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/templates/${encodeURIComponent(deleteTarget.name)}`, { method: 'DELETE' });
      toast.success('Template deleted');
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  // ── Button helpers ────────────────────────────────────────────────────────────
  const addButton = () => {
    if (form.buttons.length >= 3) return;
    setForm((p) => ({ ...p, buttons: [...p.buttons, emptyButton()] }));
  };
  const removeButton = (idx) => {
    setForm((p) => ({ ...p, buttons: p.buttons.filter((_, i) => i !== idx) }));
  };
  const setButton = (idx, k, v) => {
    setForm((p) => ({
      ...p,
      buttons: p.buttons.map((b, i) => (i === idx ? { ...b, [k]: v } : b)),
    }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">WhatsApp Templates</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create and manage WhatsApp message templates submitted to Meta for approval
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-secondary flex items-center gap-2" title="Refresh">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Template
          </button>
        </div>
      </div>

      {loadError && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <span className="text-xs text-red-600">{loadError}</span>
        </div>
      )}

      {/* ── Standard message set ────────────────────────────────────────── */}
      {catalog && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">Standard message set</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {catalog.entries.length} messages every trek company needs — booking, payment,
                pre-trek and post-trek. Agents send these in one click when a chat is past
                the 24-hour reply window.
              </p>

              <div className="flex items-center gap-3 mt-3 flex-wrap text-xs">
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <b>{catalog.summary.ready}</b> ready to send
                </span>
                {catalog.summary.pending > 0 && (
                  <span className="text-sky-700"><b>{catalog.summary.pending}</b> awaiting Meta review</span>
                )}
                {catalog.summary.mismatch > 0 && (
                  <span className="text-amber-700"><b>{catalog.summary.mismatch}</b> need manual fields</span>
                )}
                {catalog.summary.rejected > 0 && (
                  <span className="text-red-600"><b>{catalog.summary.rejected}</b> rejected</span>
                )}
                {catalog.summary.missing > 0 && (
                  <span className="text-slate-500"><b>{catalog.summary.missing}</b> not set up</span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              {catalog.summary.missing > 0 && (
                <button
                  onClick={provisionStandard}
                  disabled={provisioning}
                  className="btn-primary text-sm flex items-center gap-2 whitespace-nowrap"
                >
                  {provisioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add {catalog.summary.missing} missing
                </button>
              )}
              <button
                onClick={() => setCatalogOpen((v) => !v)}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {catalogOpen ? 'Hide details' : 'Show details'}
              </button>
            </div>
          </div>

          {catalogOpen && (
            <div className="border-t border-slate-100 divide-y divide-slate-50">
              {catalog.groups.map((g) => {
                const rows = catalog.entries.filter((e) => e.group === g.key);
                if (!rows.length) return null;
                return (
                  <div key={g.key} className="px-5 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {g.title} — <span className="normal-case font-normal">{g.blurb}</span>
                    </p>
                    <div className="space-y-1.5">
                      {rows.map((e) => (
                        <div key={e.name} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-800">{e.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono ml-2">{e.name}</span>
                            {e.state !== 'ready' && e.reason && (
                              <p className="text-[10px] text-slate-500">{e.reason}</p>
                            )}
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-semibold uppercase ${
                            e.state === 'ready' ? 'bg-emerald-50 text-emerald-700'
                              : e.state === 'pending' ? 'bg-sky-50 text-sky-700'
                              : e.state === 'mismatch' ? 'bg-amber-50 text-amber-700'
                              : e.state === 'rejected' ? 'bg-red-50 text-red-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {e.state === 'missing' ? 'not set up' : e.state}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading templates…</div>
        ) : templates.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No templates yet</p>
            <p className="text-slate-400 text-sm mt-1">Create your first WhatsApp template to start broadcasting</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Lang</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Preview</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {templates.map((t) => {
                  const badge = statusBadge(t.status);
                  const preview = bodyTextOf(t.components);
                  const mediaTag = mediaHeaderTag(t.components);
                  return (
                    <tr key={`${t.name}::${t.language}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5 text-primary-600" />
                          </div>
                          <span className="font-mono font-semibold text-slate-800">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{t.category}</td>
                      <td className="px-4 py-3 text-slate-500 uppercase text-xs">{t.language}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs">
                        {mediaTag && (
                          <span className="inline-flex items-center px-2 py-0.5 mb-1 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700">
                            {mediaTag}
                          </span>
                        )}
                        <span className="line-clamp-2 block">{preview || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-semibold text-xs ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteTarget(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New WhatsApp Template" size="lg">
        <div className="space-y-4">
          {/* Name + Category + Language */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`input-field font-mono ${errors.name ? 'border-red-400' : ''}`}
                placeholder="summer_offer_2026"
                value={form.name}
                onChange={(e) => setField('name', e.target.value.toLowerCase())}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              <p className="text-[11px] text-slate-400 mt-1">lowercase, digits, underscore</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                className="select-field"
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
              >
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utility</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
              <input
                type="text"
                className="input-field"
                value={form.language}
                onChange={(e) => setField('language', e.target.value)}
                placeholder="en"
              />
            </div>
          </div>

          {/* Header */}
          <div className="border border-slate-200 rounded-lg p-3">
            <label className="block text-sm font-medium text-slate-700 mb-2">Header (optional)</label>
            <div className="flex flex-wrap gap-2 mb-1">
              {[
                { value: 'NONE', label: 'None' },
                { value: 'TEXT', label: 'Text' },
                { value: 'IMAGE', label: 'Image' },
                { value: 'VIDEO', label: 'Video' },
                { value: 'DOCUMENT', label: 'Document' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setHeaderType(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.headerType === opt.value
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {form.headerType === 'TEXT' && (
              <div className="space-y-3 pl-1 mt-2">
                <div>
                  <input
                    type="text"
                    className={`input-field text-sm ${errors.headerText ? 'border-red-400' : ''}`}
                    placeholder="e.g. Special offer for {{1}}"
                    value={form.headerText}
                    onChange={(e) => setField('headerText', e.target.value)}
                  />
                  {errors.headerText && <p className="text-red-500 text-xs mt-1">{errors.headerText}</p>}
                  <p className="text-[11px] text-slate-400 mt-1">No emoji, asterisks or newlines; at most one variable {'{{1}}'}.</p>
                </div>
                {headerHasVar && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Example value for header {'{{1}}'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`input-field text-sm ${errors.headerExample ? 'border-red-400' : ''}`}
                      placeholder="e.g. Hampta Pass"
                      value={form.headerExample}
                      onChange={(e) => setField('headerExample', e.target.value)}
                    />
                    {errors.headerExample && <p className="text-red-500 text-xs mt-1">{errors.headerExample}</p>}
                  </div>
                )}
              </div>
            )}

            {isMediaHeader(form.headerType) && (
              <div className="space-y-2 pl-1 mt-2">
                <label
                  className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-lg px-3 py-5 cursor-pointer transition-colors ${
                    errors.headerMedia ? 'border-red-300 bg-red-50/40' : 'border-slate-300 hover:border-primary-300 hover:bg-slate-50'
                  } ${uploadingMedia ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <input
                    type="file"
                    className="hidden"
                    accept={HEADER_MEDIA[form.headerType].accept}
                    onChange={(e) => handleMediaPick(e.target.files?.[0])}
                  />
                  {uploadingMedia ? (
                    <>
                      <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                      <span className="text-xs text-slate-500">Uploading sample…</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 text-slate-400" />
                      <span className="text-xs text-slate-600 font-medium">
                        Choose a sample {HEADER_MEDIA[form.headerType].label.toLowerCase()}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {HEADER_MEDIA[form.headerType].accept} · max {HEADER_MEDIA[form.headerType].maxLabel}
                      </span>
                    </>
                  )}
                </label>

                {form.headerPreviewUrl && form.headerType === 'IMAGE' && (
                  <img src={form.headerPreviewUrl} alt="Sample header" className="max-h-32 rounded-lg border border-slate-200" />
                )}

                {form.headerHandle && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sample uploaded ✓{form.headerFileName ? ` — ${form.headerFileName}` : ''}</span>
                  </div>
                )}

                {form.headerUploadError && <p className="text-red-500 text-xs">{form.headerUploadError}</p>}
                {errors.headerMedia && <p className="text-red-500 text-xs">{errors.headerMedia}</p>}
                <p className="text-[11px] text-slate-400">
                  A sample {HEADER_MEDIA[form.headerType].label.toLowerCase()} is required by Meta to approve a media header.
                </p>
              </div>
            )}
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Body <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              className={`input-field text-sm resize-y ${errors.body ? 'border-red-400' : ''}`}
              placeholder={'Hi {{1}}, your trek to {{2}} is confirmed!'}
              value={form.body}
              onChange={(e) => setField('body', e.target.value)}
            />
            {errors.body && <p className="text-red-500 text-xs mt-1">{errors.body}</p>}
            <p className="text-[11px] text-slate-400 mt-1">
              Use {'{{1}}, {{2}}'}… for variables. Body must not start or end with a variable.
            </p>

            {bodyVars.length > 0 && (
              <div className="mt-3 space-y-2 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-600">Example values ({bodyVars.length})</p>
                {bodyVars.map((n, i) => (
                  <div key={n}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Example for {`{{${n}}}`}</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      placeholder={`Sample value for {{${n}}}`}
                      value={form.bodyExamples[i] || ''}
                      onChange={(e) => {
                        const next = [...form.bodyExamples];
                        next[i] = e.target.value;
                        setField('bodyExamples', next);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Footer (optional)</label>
            <input
              type="text"
              maxLength={60}
              className={`input-field text-sm ${errors.footer ? 'border-red-400' : ''}`}
              placeholder="e.g. Reply STOP to opt out"
              value={form.footer}
              onChange={(e) => setField('footer', e.target.value)}
            />
            {errors.footer && <p className="text-red-500 text-xs mt-1">{errors.footer}</p>}
            <p className="text-[11px] text-slate-400 mt-1">No variables, max 60 characters. {form.footer.length}/60</p>
          </div>

          {/* Buttons */}
          <div className="border border-slate-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Buttons (up to 3, optional)</span>
              <button
                type="button"
                onClick={addButton}
                disabled={form.buttons.length >= 3}
                className="text-xs text-primary-600 hover:underline flex items-center gap-1 disabled:opacity-40 disabled:no-underline"
              >
                <Plus className="w-3 h-3" /> Add button
              </button>
            </div>
            {errors.buttons && <p className="text-red-500 text-xs mb-2">{errors.buttons}</p>}

            {form.buttons.length === 0 && (
              <p className="text-xs text-slate-400">No buttons added.</p>
            )}

            <div className="space-y-3">
              {form.buttons.map((b, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Button #{i + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeButton(i)}
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50"
                      title="Remove button"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Type</label>
                      <select
                        className="select-field text-sm"
                        value={b.type}
                        onChange={(e) => setButton(i, 'type', e.target.value)}
                      >
                        {BUTTON_TYPES.map((bt) => (
                          <option key={bt.value} value={bt.value}>{bt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Button text</label>
                      <input
                        type="text"
                        className={`input-field text-sm ${errors[`btn_${i}_text`] ? 'border-red-400' : ''}`}
                        placeholder="e.g. Book now"
                        value={b.text}
                        onChange={(e) => setButton(i, 'text', e.target.value)}
                      />
                      {errors[`btn_${i}_text`] && <p className="text-red-500 text-[11px] mt-1">{errors[`btn_${i}_text`]}</p>}
                    </div>
                  </div>

                  {(b.type === 'URL_STATIC' || b.type === 'URL_DYNAMIC') && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        {b.type === 'URL_DYNAMIC' ? 'Base URL (must end with {{1}})' : 'URL'}
                      </label>
                      <input
                        type="text"
                        className={`input-field text-sm font-mono ${errors[`btn_${i}_url`] ? 'border-red-400' : ''}`}
                        placeholder={b.type === 'URL_DYNAMIC' ? 'https://api.trekops.in/book/{{1}}' : 'https://api.trekops.in/offer'}
                        value={b.url}
                        onChange={(e) => setButton(i, 'url', e.target.value)}
                      />
                      {errors[`btn_${i}_url`] && <p className="text-red-500 text-[11px] mt-1">{errors[`btn_${i}_url`]}</p>}
                    </div>
                  )}

                  {b.type === 'URL_DYNAMIC' && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Full sample URL</label>
                      <input
                        type="text"
                        className={`input-field text-sm font-mono ${errors[`btn_${i}_urlExample`] ? 'border-red-400' : ''}`}
                        placeholder="https://api.trekops.in/book/abc123"
                        value={b.urlExample}
                        onChange={(e) => setButton(i, 'urlExample', e.target.value)}
                      />
                      {errors[`btn_${i}_urlExample`] && <p className="text-red-500 text-[11px] mt-1">{errors[`btn_${i}_urlExample`]}</p>}
                    </div>
                  )}

                  {b.type === 'PHONE_NUMBER' && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Phone number</label>
                      <input
                        type="text"
                        className={`input-field text-sm font-mono ${errors[`btn_${i}_phone`] ? 'border-red-400' : ''}`}
                        placeholder="+919876543210"
                        value={b.phone}
                        onChange={(e) => setButton(i, 'phone', e.target.value)}
                      />
                      {errors[`btn_${i}_phone`] && <p className="text-red-500 text-[11px] mt-1">{errors[`btn_${i}_phone`]}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {errors.submit && (
            <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <span className="text-xs text-red-600">{errors.submit}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowForm(false)} className="btn-secondary" disabled={submitting}>Cancel</button>
          <button onClick={handleSubmit} className="btn-primary flex items-center gap-2" disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Submitting…' : 'Submit for approval'}
          </button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Template" size="sm">
        <p className="text-sm text-slate-600 mb-5">
          Are you sure you want to delete template{' '}
          <span className="font-mono font-bold text-slate-800">{deleteTarget?.name}</span>?
          {' '}This removes it from Meta and cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary" disabled={deleting}>Cancel</button>
          <button onClick={handleDelete} className="btn-danger flex items-center gap-2" disabled={deleting}>
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
