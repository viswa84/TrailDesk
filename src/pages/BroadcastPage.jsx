import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_CITIES, GET_TREKS } from '../graphql/queries';
import { useToast } from '../context/ToastContext';
import { parseTemplateSpec, buildTemplateComponents, totalParamCount } from '../utils/whatsappTemplate';
import { Send, Users, AlertTriangle, Loader2, Megaphone, RefreshCcw, ChevronDown, ChevronRight, History, IndianRupee, Search } from 'lucide-react';

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

const BOOKING_STATUSES = ['pending', 'paid', 'partial', 'failed'];

const emptyFilters = {
  lastInboundFrom: '',
  lastInboundTo: '',
  trekId: '',
  cityId: '',
  bookingStatus: '',
  manualPhones: '',
};

export default function BroadcastPage() {
  const toast = useToast();
  const { data: citiesData } = useQuery(GET_CITIES, { variables: { isActive: true }, fetchPolicy: 'cache-first' });
  const { data: treksData }  = useQuery(GET_TREKS,  { variables: { isActive: true }, fetchPolicy: 'cache-first' });
  const cities = citiesData?.getCities || [];
  const treks  = treksData?.getTreks  || [];

  const [filters, setFilters] = useState(emptyFilters);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState('');

  // Per-recipient selection table — [{ phone, name, checked }]
  const [recipientList, setRecipientList] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState('');

  // Marketing settings (cost-per-message + daily limit) and today's usage
  const [marketingSettings, setMarketingSettings] = useState({ costPerMessage: 0.58, dailyLimit: 1000 });
  const [dailySentToday, setDailySentToday] = useState(0);

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const selectedTemplateObj = useMemo(
    () => templates.find((t) => `${t.name}::${t.language}` === selectedTemplate),
    [templates, selectedTemplate]
  );
  const templateSpec = useMemo(
    () => (selectedTemplateObj ? parseTemplateSpec(selectedTemplateObj.components) : null),
    [selectedTemplateObj]
  );

  // Param values: { headerParams: [], bodyParams: [], buttonParams: { [index]: [] }, headerMedia: { url, filename } }
  const [paramValues, setParamValues] = useState({ headerParams: [], bodyParams: [], buttonParams: {}, headerMedia: { url: '', filename: '' } });
  // Reset param values when the selected template changes
  useEffect(() => {
    setParamValues({ headerParams: [], bodyParams: [], buttonParams: {}, headerMedia: { url: '', filename: '' } });
  }, [selectedTemplate]);

  const isHttpsUrl = (u) => /^https:\/\/\S+$/i.test((u || '').trim());

  // Append the per-recipient {{name}} token to a header/body text variable.
  // The backend substitutes {{name}} with each recipient's name at send time.
  const insertNameToken = (group, i) => {
    setParamValues((prev) => {
      const next = [...(prev[group] || [])];
      next[i] = `${next[i] || ''}{{name}}`;
      return { ...prev, [group]: next };
    });
  };

  const allParamsFilled = useMemo(() => {
    if (!templateSpec) return true;
    const mediaCheck = !templateSpec.headerMediaFormat || isHttpsUrl(paramValues.headerMedia?.url);
    const hCheck = (templateSpec.headerParamCount === 0)
      || Array.from({ length: templateSpec.headerParamCount }, (_, i) => paramValues.headerParams[i]?.trim()).every(Boolean);
    const bCheck = (templateSpec.bodyParamCount === 0)
      || Array.from({ length: templateSpec.bodyParamCount }, (_, i) => paramValues.bodyParams[i]?.trim()).every(Boolean);
    const btnCheck = templateSpec.buttonParams.every((b) => {
      const filled = paramValues.buttonParams[b.index] || [];
      return Array.from({ length: b.placeholderCount }, (_, i) => filled[i]?.trim()).every(Boolean);
    });
    return mediaCheck && hCheck && bCheck && btnCheck;
  }, [templateSpec, paramValues]);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  // Optional schedule — empty means send immediately
  const [scheduledFor, setScheduledFor] = useState('');
  const [campaignName, setCampaignName] = useState('');

  // ── Send history ────────────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [detailById, setDetailById] = useState({}); // cache: id -> full detail doc

  const loadCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const { campaigns: c } = await api('/api/marketing/campaigns?page=1&limit=20');
      setCampaigns(c || []);
    } catch (e) {
      // Soft-fail: history is non-blocking
      console.error('[broadcast] history load failed', e);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!detailById[id]) {
      try {
        const detail = await api(`/api/marketing/campaigns/${id}`);
        setDetailById((prev) => ({ ...prev, [id]: detail }));
      } catch (e) {
        toast.error(`Failed to load campaign: ${e.message}`);
      }
    }
  };

  // ── Load templates on mount ────────────────────────────────────────────────
  const loadTemplates = async () => {
    setTemplatesLoading(true);
    setTemplatesError('');
    try {
      const { templates: t } = await api('/api/chat/templates');
      setTemplates(t || []);
    } catch (e) {
      setTemplatesError(e.message);
    } finally {
      setTemplatesLoading(false);
    }
  };
  useEffect(() => { loadTemplates(); }, []);

  // ── Load marketing settings on mount (cost-per-message, daily limit) ────────
  useEffect(() => {
    (async () => {
      try {
        const s = await api('/api/marketing/settings');
        setMarketingSettings({
          costPerMessage: typeof s.costPerMessage === 'number' ? s.costPerMessage : 0.58,
          dailyLimit: typeof s.dailyLimit === 'number' ? s.dailyLimit : 1000,
        });
      } catch (e) {
        // Soft-fail: fall back to defaults
        console.error('[broadcast] settings load failed', e);
      }
    })();
  }, []);

  // ── Live preview (debounced) ───────────────────────────────────────────────
  const debounceRef = useRef(null);
  const buildFilterPayload = () => {
    const f = {};
    if (filters.lastInboundFrom) f.lastInboundFrom = new Date(filters.lastInboundFrom).toISOString();
    if (filters.lastInboundTo)   f.lastInboundTo   = new Date(filters.lastInboundTo).toISOString();
    if (filters.trekId)        f.trekId        = filters.trekId;
    if (filters.cityId)        f.cityId        = filters.cityId;
    if (filters.bookingStatus) f.bookingStatus = filters.bookingStatus;
    const manual = filters.manualPhones
      .split(/[\s,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (manual.length) f.manualPhones = manual;
    return f;
  };

  const hasAnyFilter = useMemo(() => {
    return (
      !!filters.lastInboundFrom ||
      !!filters.lastInboundTo ||
      !!filters.trekId ||
      !!filters.cityId ||
      !!filters.bookingStatus ||
      !!filters.manualPhones.trim()
    );
  }, [filters]);

  useEffect(() => {
    if (!hasAnyFilter) {
      setPreview(null);
      setPreviewError('');
      setRecipientList([]);
      setDailySentToday(0);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewing(true);
      setPreviewError('');
      try {
        const r = await api('/api/marketing/preview', {
          method: 'POST',
          body: JSON.stringify({ filters: buildFilterPayload() }),
        });
        setPreview(r);
        // Seed the selection table — all recipients checked by default.
        setRecipientList((r.recipients || []).map((rec) => ({
          phone: rec.phone,
          name: rec.name || null,
          checked: true,
        })));
        if (typeof r.dailySentToday === 'number') setDailySentToday(r.dailySentToday);
        // Preview also returns live settings — keep local copy fresh.
        if (typeof r.costPerMessage === 'number' || typeof r.dailyLimit === 'number') {
          setMarketingSettings((prev) => ({
            costPerMessage: typeof r.costPerMessage === 'number' ? r.costPerMessage : prev.costPerMessage,
            dailyLimit: typeof r.dailyLimit === 'number' ? r.dailyLimit : prev.dailyLimit,
          }));
        }
      } catch (e) {
        setPreview(null);
        setRecipientList([]);
        setPreviewError(e.message);
      } finally {
        setPreviewing(false);
      }
    }, 400);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ── Recipient selection derived values ──────────────────────────────────────
  const checkedCount = useMemo(
    () => recipientList.filter((r) => r.checked).length,
    [recipientList]
  );

  const filteredRecipients = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase();
    if (!q) return recipientList;
    return recipientList.filter(
      (r) => r.phone.toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q)
    );
  }, [recipientList, recipientSearch]);

  const allChecked = recipientList.length > 0 && recipientList.every((r) => r.checked);

  const toggleAll = (checked) => {
    setRecipientList((prev) => prev.map((r) => ({ ...r, checked })));
  };
  const toggleOne = (phone) => {
    setRecipientList((prev) => prev.map((r) => (r.phone === phone ? { ...r, checked: !r.checked } : r)));
  };

  const maskPhone = (phone) => `91XXXXX${String(phone).slice(-5)}`;

  // ── Cost + daily-limit math ─────────────────────────────────────────────────
  const { costPerMessage, dailyLimit } = marketingSettings;
  const estimatedCost = useMemo(
    () => Math.round(checkedCount * costPerMessage * 100) / 100,
    [checkedCount, costPerMessage]
  );

  const projectedTotal = dailySentToday + checkedCount;
  const overLimit = projectedTotal > dailyLimit;
  const nearLimit = !overLimit && projectedTotal > dailyLimit * 0.8;
  const projectedPct = dailyLimit > 0 ? Math.round((projectedTotal / dailyLimit) * 100) : 0;

  // ── Send broadcast ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!selectedTemplateObj) {
      toast.error('Pick a template first.');
      return;
    }
    if (!preview || preview.totalCount === 0) {
      toast.error('No recipients match these filters.');
      return;
    }
    if (checkedCount === 0) {
      toast.error('Select at least one recipient.');
      return;
    }
    if (overLimit) {
      toast.error(`This send would exceed your daily limit of ${dailyLimit} messages.`);
      return;
    }
    if (!window.confirm(
      `Send the "${selectedTemplateObj.name}" template to ${checkedCount} recipient(s)?\n\n` +
      `Estimated cost: ₹${estimatedCost}\n` +
      `Opted-out: ${preview.breakdown.skippedOptedOut} excluded\n` +
      `Invalid: ${preview.breakdown.skippedInvalidManual} excluded\n\n` +
      `This action cannot be undone.`
    )) return;

    if (!allParamsFilled) {
      toast.error('Fill in all template parameters first.');
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const templateComponents = templateSpec
        ? buildTemplateComponents(templateSpec, paramValues)
        : [];

      // Phones the user explicitly unchecked in the recipient table.
      const excludePhones = recipientList.filter((r) => !r.checked).map((r) => r.phone);

      const body = {
        filters: buildFilterPayload(),
        templateName: selectedTemplateObj.name,
        templateLanguage: selectedTemplateObj.language,
        templateComponents,
        name: campaignName.trim() || null,
        excludePhones,
      };

      if (scheduledFor) {
        const r = await api('/api/marketing/schedule', {
          method: 'POST',
          body: JSON.stringify({ ...body, scheduledFor: new Date(scheduledFor).toISOString() }),
        });
        toast.success(`Scheduled for ${new Date(r.scheduledFor).toLocaleString()} (${r.estimatedRecipients} recipients)`);
      } else {
        const r = await api('/api/marketing/bulk-send', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setResult(r);
        toast.success(`Sent to ${r.totalSent}/${r.totalRequested} recipients`);
      }
      loadCampaigns();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const cancelCampaign = async (id) => {
    if (!window.confirm('Cancel this scheduled campaign?')) return;
    try {
      await api(`/api/marketing/campaigns/${id}/cancel`, { method: 'POST' });
      toast.success('Campaign cancelled');
      loadCampaigns();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const reset = () => {
    setFilters(emptyFilters);
    setSelectedTemplate('');
    setResult(null);
    setPreview(null);
    setPreviewError('');
    setScheduledFor('');
    setCampaignName('');
    setRecipientList([]);
    setRecipientSearch('');
    setDailySentToday(0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">WhatsApp Broadcast</h1>
          <p className="page-subtitle mt-1">
            Send an approved template message to a filtered set of customers
          </p>
        </div>
        <button onClick={reset} className="btn-secondary flex items-center gap-2">
          <RefreshCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ───── Filters ───── */}
        <div className="card p-5 lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Filters</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last messaged — from</label>
              <input
                type="date"
                value={filters.lastInboundFrom}
                onChange={(e) => setFilters({ ...filters, lastInboundFrom: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last messaged — to</label>
              <input
                type="date"
                value={filters.lastInboundTo}
                onChange={(e) => setFilters({ ...filters, lastInboundTo: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Enquired about trek</label>
              <select
                value={filters.trekId}
                onChange={(e) => setFilters({ ...filters, trekId: e.target.value })}
                className="select-field"
              >
                <option value="">Any trek</option>
                {treks.map((t) => (
                  <option key={t._id} value={t._id}>{t.shortName || t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">From city</label>
              <select
                value={filters.cityId}
                onChange={(e) => setFilters({ ...filters, cityId: e.target.value })}
                className="select-field"
              >
                <option value="">Any city</option>
                {cities.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Booking status</label>
              <select
                value={filters.bookingStatus}
                onChange={(e) => setFilters({ ...filters, bookingStatus: e.target.value })}
                className="select-field"
              >
                <option value="">Any (or no booking)</option>
                {BOOKING_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Additional phone numbers (one per line, country code, no +)
              </label>
              <textarea
                value={filters.manualPhones}
                onChange={(e) => setFilters({ ...filters, manualPhones: e.target.value })}
                rows={4}
                placeholder={'919182748724\n919876543210'}
                className="input-field font-mono text-sm resize-y"
              />
            </div>
          </div>
        </div>

        {/* ───── Recipient preview ───── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Recipients</h2>
            {previewing && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </div>

          {!hasAnyFilter && (
            <p className="text-sm text-slate-400">Add at least one filter or paste phone numbers to see recipients.</p>
          )}

          {previewError && (
            <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <span className="text-xs text-red-600">{previewError}</span>
            </div>
          )}

          {preview && (
            <>
              <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl">
                <Users className="w-8 h-8 text-primary-600" />
                <div>
                  <p className="text-3xl font-bold text-primary-700">{checkedCount}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    selected of {preview.totalCount} matched
                  </p>
                </div>
              </div>

              <ul className="text-xs text-slate-500 space-y-1">
                <li>From session filters: <span className="font-semibold text-slate-700">{preview.breakdown.fromSessionFilter}</span></li>
                <li>From booking filters: <span className="font-semibold text-slate-700">{preview.breakdown.fromBookingFilter}</span></li>
                <li>Manual phones added: <span className="font-semibold text-slate-700">{preview.breakdown.fromManual}</span> <span className="text-slate-400">(already-matched phones count once)</span></li>
                <li>Opted-out (excluded): <span className="font-semibold text-amber-600">{preview.breakdown.skippedOptedOut}</span></li>
                <li>Invalid phones (excluded): <span className="font-semibold text-amber-600">{preview.breakdown.skippedInvalidManual}</span></li>
              </ul>

              {/* ── Cost estimate card ── */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
                  <IndianRupee className="w-3.5 h-3.5" /> Estimated Cost
                </div>
                <p className="text-sm text-amber-800">
                  {checkedCount} messages × ₹{costPerMessage}/message ={' '}
                  <span className="font-bold">₹{estimatedCost}</span>
                </p>
                <p className="text-[11px] text-amber-600">
                  WhatsApp charges per marketing conversation opened.
                </p>
              </div>

              {/* ── Daily limit banners ── */}
              {overLimit && (
                <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-base leading-none">🚫</span>
                  <span className="text-xs text-red-700">
                    This send would exceed your daily limit of <span className="font-semibold">{dailyLimit}</span> messages.
                    Already sent: <span className="font-semibold">{dailySentToday}</span>. Reduce recipients or wait until tomorrow.
                  </span>
                </div>
              )}
              {nearLimit && (
                <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-base leading-none">⚠️</span>
                  <span className="text-xs text-amber-700">
                    You&apos;ve sent <span className="font-semibold">{dailySentToday}</span> messages today.
                    Your daily limit is <span className="font-semibold">{dailyLimit}</span>.
                    Sending <span className="font-semibold">{checkedCount}</span> more will use{' '}
                    <span className="font-semibold">{projectedPct}%</span> of your daily allowance.
                  </span>
                </div>
              )}

              {/* ── Recipient selection table ── */}
              {recipientList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleAll(!allChecked)}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      {allChecked ? 'Deselect all' : 'Select all'}
                    </button>
                    <span className="text-[11px] text-slate-500">
                      {checkedCount} of {recipientList.length} selected
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      placeholder="Filter by name or phone…"
                      className="input-field text-xs pl-8"
                    />
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-y-auto" style={{ maxHeight: 320 }}>
                    {filteredRecipients.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-slate-400">No matches.</p>
                    ) : (
                      filteredRecipients.map((r) => (
                        <label
                          key={r.phone}
                          className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-100 last:border-b-0 text-xs cursor-pointer hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={r.checked}
                            onChange={() => toggleOne(r.phone)}
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="font-mono">{maskPhone(r.phone)}</span>
                          <span className="text-slate-500 truncate">{r.name || '—'}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ───── Template + send ───── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Template</h2>
          <button onClick={loadTemplates} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
            <RefreshCcw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {templatesError && (
          <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <span className="text-xs text-red-600">{templatesError}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Choose an APPROVED template</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            disabled={templatesLoading}
            className="select-field"
          >
            <option value="">{templatesLoading ? 'Loading…' : `Select a template (${templates.length} available)`}</option>
            {templates.map((t) => (
              <option key={`${t.name}::${t.language}`} value={`${t.name}::${t.language}`}>
                {t.name} ({t.language}) — {t.category}
              </option>
            ))}
          </select>
        </div>

        {selectedTemplateObj && (
          <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-lg space-y-1">
            <p className="font-semibold mb-1">Template body preview:</p>
            {selectedTemplateObj.components.map((c, idx) => (
              <div key={idx}>
                <span className="uppercase text-[10px] text-slate-400">{c.type}{c.format ? `/${c.format}` : ''}: </span>
                <span className="font-mono">{c.text || (c.buttons && c.buttons.map((b) => b.text).join(' | ')) || JSON.stringify(c).slice(0, 100)}</span>
              </div>
            ))}
          </div>
        )}

        {/* ───── Template parameter inputs ───── */}
        {templateSpec && (totalParamCount(templateSpec) > 0 || templateSpec.headerMediaFormat) && (
          <div className="space-y-3 p-3 border border-slate-200 rounded-lg">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Template parameters ({totalParamCount(templateSpec)})
            </p>
            <p className="text-[11px] text-slate-500">
              Text variables use the same value for everyone. To personalise per recipient, insert the{' '}
              <code className="px-1 py-0.5 bg-slate-100 rounded font-mono">{'{{name}}'}</code> token —
              it is replaced with each recipient&apos;s name at send time.
            </p>

            {templateSpec.headerMediaFormat && (() => {
              const fmt = templateSpec.headerMediaFormat;
              const label = fmt === 'IMAGE' ? 'Header image URL' : fmt === 'VIDEO' ? 'Header video URL' : 'Header document URL';
              const url = paramValues.headerMedia?.url || '';
              const showError = url && !isHttpsUrl(url);
              return (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {label} <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={url}
                    onChange={(e) => setParamValues({
                      ...paramValues,
                      headerMedia: { ...paramValues.headerMedia, url: e.target.value },
                    })}
                    placeholder="https://…"
                    className={`input-field text-sm font-mono ${showError ? 'border-red-400' : ''}`}
                  />
                  {fmt === 'DOCUMENT' && (
                    <input
                      value={paramValues.headerMedia?.filename || ''}
                      onChange={(e) => setParamValues({
                        ...paramValues,
                        headerMedia: { ...paramValues.headerMedia, filename: e.target.value },
                      })}
                      placeholder="Filename shown to recipient (optional), e.g. itinerary.pdf"
                      className="input-field text-sm mt-2"
                    />
                  )}
                  {showError && <p className="text-red-500 text-[11px] mt-1">Enter a valid https:// URL</p>}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sent by link to every recipient. Must be a public https URL Meta can fetch.
                  </p>
                </div>
              );
            })()}

            {templateSpec.headerParamCount > 0 &&
              Array.from({ length: templateSpec.headerParamCount }, (_, i) => (
                <div key={`h-${i}`}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">Header {`{{${i + 1}}}`}</label>
                    <button
                      type="button"
                      onClick={() => insertNameToken('headerParams', i)}
                      className="text-[10px] text-primary-600 hover:underline"
                    >
                      + Insert {'{{name}}'}
                    </button>
                  </div>
                  <input
                    value={paramValues.headerParams[i] || ''}
                    onChange={(e) => {
                      const next = [...paramValues.headerParams];
                      next[i] = e.target.value;
                      setParamValues({ ...paramValues, headerParams: next });
                    }}
                    placeholder={`Value for {{${i + 1}}} (or {{name}})`}
                    className="input-field text-sm"
                  />
                </div>
              ))}

            {templateSpec.bodyParamCount > 0 &&
              Array.from({ length: templateSpec.bodyParamCount }, (_, i) => (
                <div key={`b-${i}`}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">Body {`{{${i + 1}}}`}</label>
                    <button
                      type="button"
                      onClick={() => insertNameToken('bodyParams', i)}
                      className="text-[10px] text-primary-600 hover:underline"
                    >
                      + Insert {'{{name}}'}
                    </button>
                  </div>
                  <input
                    value={paramValues.bodyParams[i] || ''}
                    onChange={(e) => {
                      const next = [...paramValues.bodyParams];
                      next[i] = e.target.value;
                      setParamValues({ ...paramValues, bodyParams: next });
                    }}
                    placeholder={`Value for body {{${i + 1}}} (or {{name}})`}
                    className="input-field text-sm"
                  />
                </div>
              ))}

            {templateSpec.buttonParams.map((b) =>
              Array.from({ length: b.placeholderCount }, (_, i) => (
                <div key={`btn-${b.index}-${i}`}>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Button #{b.index + 1} link value — departure ID / token / txnid {`{{${i + 1}}}`}
                  </label>
                  <input
                    value={paramValues.buttonParams[b.index]?.[i] || ''}
                    onChange={(e) => {
                      const existing = paramValues.buttonParams[b.index] || [];
                      const next = [...existing];
                      next[i] = e.target.value;
                      setParamValues({
                        ...paramValues,
                        buttonParams: { ...paramValues.buttonParams, [b.index]: next },
                      });
                    }}
                    placeholder={`e.g. abc123 — appended to the button's base URL`}
                    className="input-field text-sm font-mono"
                  />
                </div>
              ))
            )}

            {!allParamsFilled && (
              <p className="text-xs text-amber-600">Fill in all parameters before sending.</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Campaign label (optional)</label>
            <input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Hampta Pass — May offer"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Schedule for later (optional)</label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="input-field text-sm"
            />
            {scheduledFor && (
              <p className="text-[11px] text-slate-500 mt-1">
                Will fire at {new Date(scheduledFor).toLocaleString()} (within ~2 min)
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSend}
            disabled={sending || !selectedTemplateObj || !preview || checkedCount === 0 || overLimit}
            className="btn-primary flex items-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending
              ? `Submitting…`
              : scheduledFor
                ? `Schedule for ${checkedCount} recipient(s)`
                : `Send now to ${checkedCount} recipient(s)`}
          </button>
        </div>
      </div>

      {/* ───── Result panel ───── */}
      {result && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary-600" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Send Result</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Requested',  val: result.totalRequested,        color: 'text-slate-700' },
              { label: 'Sent',       val: result.totalSent,             color: 'text-emerald-600' },
              { label: 'Opted-out',  val: result.totalSkippedOptedOut,  color: 'text-amber-600' },
              { label: 'Invalid',    val: result.totalSkippedInvalid,   color: 'text-amber-600' },
              { label: 'Failed',     val: result.totalFailed,           color: 'text-red-600' },
            ].map((s) => (
              <div key={s.label} className="p-3 bg-slate-50 rounded-lg text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
          {result.failures.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Failures:</p>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                {result.failures.map((f, idx) => (
                  <div key={idx} className="px-3 py-1.5 border-b border-slate-100 last:border-b-0 text-xs">
                    <span className="font-mono">{f.phone}</span>
                    <span className="text-red-600 ml-2">— {f.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───── Send history ───── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Send History</h2>
          </div>
          <button onClick={loadCampaigns} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
            <RefreshCcw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {campaignsLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {!campaignsLoading && campaigns.length === 0 && (
          <p className="text-sm text-slate-400">No broadcasts sent yet.</p>
        )}

        {campaigns.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2">Template</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Sent / Requested</th>
                  <th className="px-3 py-2 text-right">Failed</th>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">By</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const isExpanded = expandedId === c._id;
                  const detail = detailById[c._id];
                  const when = c.completedAt || c.startedAt || c.scheduledFor || c.createdAt;
                  const statusColor = ({
                    scheduled: 'text-blue-600 bg-blue-50',
                    sending:   'text-amber-600 bg-amber-50',
                    completed: 'text-emerald-600 bg-emerald-50',
                    failed:    'text-red-600 bg-red-50',
                  })[c.status] || 'text-slate-600 bg-slate-100';
                  return (
                    <>
                      <tr
                        key={c._id}
                        onClick={() => toggleExpand(c._id)}
                        className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 text-slate-400">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {c.templateName} <span className="text-slate-400">({c.templateLanguage})</span>
                          {c.name && <div className="text-[10px] text-slate-500">{c.name}</div>}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusColor}`}>{c.status}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs">{c.totalSent}/{c.totalRequested}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs">{c.totalFailed}</td>
                        <td className="px-3 py-2 text-xs text-slate-500">
                          {when ? new Date(when).toLocaleString() : '—'}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500">{c.createdByName || '—'}</td>
                        <td className="px-3 py-2 text-right">
                          {c.status === 'scheduled' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); cancelCampaign(c._id); }}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${c._id}-detail`} className="bg-slate-50/50">
                          <td colSpan={8} className="px-6 py-3">
                            {!detail ? (
                              <p className="text-xs text-slate-400">Loading details…</p>
                            ) : (
                              <div className="space-y-2 text-xs">
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                  {[
                                    { label: 'Requested', val: detail.totalRequested },
                                    { label: 'Sent', val: detail.totalSent, color: 'text-emerald-600' },
                                    { label: 'Opted-out', val: detail.totalSkippedOptedOut, color: 'text-amber-600' },
                                    { label: 'Invalid', val: detail.totalSkippedInvalid, color: 'text-amber-600' },
                                    { label: 'Failed', val: detail.totalFailed, color: 'text-red-600' },
                                  ].map((s) => (
                                    <div key={s.label} className="p-2 bg-white rounded border border-slate-200 text-center">
                                      <p className={`text-lg font-bold ${s.color || 'text-slate-700'}`}>{s.val}</p>
                                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
                                    </div>
                                  ))}
                                </div>

                                {detail.filters && Object.keys(detail.filters).length > 0 && (
                                  <details>
                                    <summary className="cursor-pointer font-semibold text-slate-600">Filters</summary>
                                    <pre className="mt-1 p-2 bg-white rounded border border-slate-200 overflow-x-auto">{JSON.stringify(detail.filters, null, 2)}</pre>
                                  </details>
                                )}

                                {detail.failures && detail.failures.length > 0 && (
                                  <details open>
                                    <summary className="cursor-pointer font-semibold text-slate-600">Failures ({detail.failures.length})</summary>
                                    <div className="mt-1 max-h-40 overflow-y-auto bg-white rounded border border-slate-200">
                                      {detail.failures.map((f, idx) => (
                                        <div key={idx} className="px-2 py-1 border-b border-slate-100 last:border-b-0">
                                          <span className="font-mono">{f.phone}</span>
                                          <span className="text-red-600 ml-2">— {f.error}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
