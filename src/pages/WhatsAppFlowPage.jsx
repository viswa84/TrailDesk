import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  MessageCircle, Save, Loader2, RotateCcw, Info, Plus, Trash2,
  ChevronDown, ChevronUp, Smartphone, Percent, Tag, AlertCircle,
} from 'lucide-react';
import { GET_FLOW_CONFIG } from '../graphql/queries';
import { SAVE_FLOW_CONFIG, RESET_FLOW_CONFIG } from '../graphql/mutations';
import { useToast } from '../context/ToastContext';

// ── Helpers ─────────────────────────────────────────────────────────────────

const FLOW_CONFIG_FIELDS = [
  'greetingKeywords',
  'cityStepMessage', 'cityStepButtonLabel', 'cityStepSectionTitle',
  'browseTypeMessage', 'browseTreksLabel', 'browseDatesLabel',
  'trekListMessage', 'trekListButtonLabel', 'trekListSectionTitle',
  'dateListMessage', 'dateListButtonLabel', 'dateListSectionTitle',
  'departureDateListMessage', 'departureDateListButtonLabel', 'departureDateListSectionTitle',
  'trekOnDateListMessage', 'trekOnDateListButtonLabel', 'trekOnDateListSectionTitle',
  'groupSizeMessage', 'discountTiers', 'exactCountPrompt',
  'supportMessage', 'noCitiesMessage', 'noTreksMessage',
  'noDatesMessage', 'noTreksOnDateMessage', 'fallbackMessage',
];

const DEFAULT_EMPTY = {
  greetingKeywords: ['hi', 'hello', 'hey', 'start', 'help'],
  cityStepMessage: '🏙️ Where are you joining from?',
  cityStepButtonLabel: 'Select City',
  cityStepSectionTitle: 'Available Cities',
  browseTypeMessage: "Awesome! You've selected *{cityName}*.\n\nHow would you like to find your next adventure?",
  browseTreksLabel: '🌄 Browse by Treks',
  browseDatesLabel: '📅 Browse by Dates',
  trekListMessage: '🌄 Treks departing from *{cityName}*\nSelect a trek to see available dates:',
  trekListButtonLabel: 'View Treks',
  trekListSectionTitle: 'Available Treks',
  dateListMessage: '📅 Expected departure dates from *{cityName}*:',
  dateListButtonLabel: 'View Dates',
  dateListSectionTitle: 'Dates',
  departureDateListMessage: '📅 *Dates for {trekName}*\n\nChoose a date to see the itinerary and details:',
  departureDateListButtonLabel: 'View Dates',
  departureDateListSectionTitle: 'Upcoming Dates',
  trekOnDateListMessage: '🌄 *Treks departing on {formattedDate}*\n\nChoose a trek to see the itinerary:',
  trekOnDateListButtonLabel: 'View Treks',
  trekOnDateListSectionTitle: 'Available Treks',
  groupSizeMessage: '👥 How many people are joining?\n\n🎉 Group discounts available:\n• 1-2 people — No discount\n• 3-5 people — 10% OFF\n• 6+ people — 15% OFF\n\nSelect your group size:',
  discountTiers: [
    { id: 'TIER_1_2', label: '1-2 (No Discount)', min: 1, max: 2, discount: 0 },
    { id: 'TIER_3_5', label: '3-5 (10% Off)', min: 3, max: 5, discount: 10 },
    { id: 'TIER_6_PLUS', label: '6+ (15% Off)', min: 6, max: 999, discount: 15 },
  ],
  exactCountPrompt: 'Great! You selected *{rangeHint} people*.{discountText}\n\nPlease type the *exact number* of people joining:',
  supportMessage: '📞 Our support team is available to help!\n\nCall/WhatsApp: +91 6303469572\nOr simply type your question right here and an agent will reply.',
  noCitiesMessage: 'No cities available right now. Please try again later.',
  noTreksMessage: 'No treks departing from {cityName} right now. Reply "hi" to try another city.',
  noDatesMessage: 'No dates available from {cityName} right now. Reply "hi" to try another city.',
  noTreksOnDateMessage: 'No treks found for that date. Reply "hi" to start over.',
  fallbackMessage: 'Please reply with a valid number of people (e.g., 1, 3, 6).',
};

function stripTypename(obj) {
  if (Array.isArray(obj)) return obj.map(stripTypename);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k !== '__typename') out[k] = stripTypename(v);
    }
    return out;
  }
  return obj;
}

// Builds a clean input object from state, keeping only FLOW_CONFIG_FIELDS
function buildInput(cfg) {
  const input = {};
  for (const key of FLOW_CONFIG_FIELDS) {
    if (key === 'discountTiers') {
      input.discountTiers = (cfg.discountTiers || []).map(({ id, label, min, max, discount }) => ({
        id, label,
        min: Number(min),
        max: Number(max),
        discount: Number(discount),
      }));
    } else if (key === 'greetingKeywords') {
      input.greetingKeywords = cfg.greetingKeywords;
    } else {
      input[key] = cfg[key] ?? '';
    }
  }
  return input;
}

// ── Section definitions ──────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'greeting',   label: 'Greeting & Start',      icon: '👋' },
  { id: 'city',       label: 'City Selection',         icon: '🏙️' },
  { id: 'browse',     label: 'Browse Type',            icon: '🔍' },
  { id: 'treks',      label: 'Trek List',              icon: '🌄' },
  { id: 'dates',      label: 'Date List',              icon: '📅' },
  { id: 'departure',  label: 'Departure Dates',        icon: '🗓️' },
  { id: 'trekOnDate', label: 'Treks on a Date',        icon: '🏔️' },
  { id: 'group',      label: 'Group Size & Discounts', icon: '👥' },
  { id: 'fallbacks',  label: 'Fallback Messages',      icon: '⚠️' },
  { id: 'support',    label: 'Support Message',        icon: '📞' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function TextField({ label, value, onChange, rows = 1, hint }) {
  const isMulti = rows > 1;
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {hint && (
          <span className="ml-2 text-xs text-slate-400 font-normal normal-case">{hint}</span>
        )}
      </label>
      {isMulti ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          className="input-field resize-none font-mono text-xs leading-relaxed"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="input-field"
        />
      )}
    </div>
  );
}

function KeywordsEditor({ keywords, onChange }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const kw = draft.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) onChange([...keywords, kw]);
    setDraft('');
  };

  const remove = (idx) => onChange(keywords.filter((_, i) => i !== idx));

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Trigger Keywords
        <span className="ml-2 text-xs text-slate-400 font-normal">
          — messages that start the bot flow (case-insensitive)
        </span>
      </label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Type keyword and press Enter"
          className="input-field flex-1"
        />
        <button type="button" onClick={add} className="btn-secondary flex items-center gap-1.5 px-3 shrink-0">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 ring-1 ring-primary-600/20 rounded-full text-xs font-medium"
          >
            {kw}
            <button
              type="button"
              onClick={() => remove(i)}
              className="hover:text-red-500 transition-colors leading-none"
              aria-label={`Remove ${kw}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function DiscountTiersEditor({ tiers, onChange }) {
  const update = (idx, field, val) => {
    const next = tiers.map((t, i) => i === idx ? { ...t, [field]: val } : t);
    onChange(next);
  };

  const addTier = () => {
    const newId = `TIER_CUSTOM_${Date.now()}`;
    onChange([...tiers, { id: newId, label: 'New Tier', min: 1, max: 99, discount: 5 }]);
  };

  const removeTier = (idx) => onChange(tiers.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-slate-700">Discount Tiers</label>
        <button type="button" onClick={addTier} className="btn-secondary flex items-center gap-1 text-xs px-2.5 py-1.5">
          <Plus className="w-3 h-3" /> Add Tier
        </button>
      </div>

      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs mb-3">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        WhatsApp buttons support max 3 tiers. Extra tiers will be ignored.
      </div>

      <div className="space-y-3">
        {tiers.map((tier, idx) => (
          <div key={tier.id || idx} className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            {/* Button label */}
            <div className="col-span-12 sm:col-span-4">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Button Label <span className="text-slate-400">(max 20 chars)</span></label>
              <input
                type="text"
                maxLength={20}
                value={tier.label}
                onChange={e => update(idx, 'label', e.target.value)}
                className="input-field text-xs"
              />
            </div>
            {/* Min */}
            <div className="col-span-4 sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Min</label>
              <input
                type="number"
                min={1}
                value={tier.min}
                onChange={e => update(idx, 'min', e.target.value)}
                className="input-field text-xs"
              />
            </div>
            {/* Max */}
            <div className="col-span-4 sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Max <span className="text-slate-400">(999=∞)</span></label>
              <input
                type="number"
                min={1}
                value={tier.max}
                onChange={e => update(idx, 'max', e.target.value)}
                className="input-field text-xs"
              />
            </div>
            {/* Discount */}
            <div className="col-span-3 sm:col-span-3">
              <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1"><Percent className="w-2.5 h-2.5" /> Discount %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={tier.discount}
                onChange={e => update(idx, 'discount', e.target.value)}
                className="input-field text-xs"
              />
            </div>
            {/* Remove */}
            <div className="col-span-1 flex items-end justify-end pb-0.5">
              <button
                type="button"
                onClick={() => removeTier(idx)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Remove tier"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {tiers.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">No tiers. Click "Add Tier" to create one.</p>
        )}
      </div>
    </div>
  );
}

// Collapsible section wrapper
function Section({ id, label, icon, activeSection, onToggle, children }) {
  const isOpen = activeSection === id;
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none">{icon}</span>
          <span className="font-semibold text-slate-800 text-sm">{label}</span>
        </div>
        {isOpen
          ? <ChevronUp className="w-4 h-4 text-slate-400" />
          : <ChevronDown className="w-4 h-4 text-slate-400" />
        }
      </button>
      {isOpen && (
        <div className="px-5 pb-6 pt-0 border-t border-slate-100 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Phone preview bubble
function PreviewBubble({ text, type = 'bot' }) {
  if (!text) return null;
  return (
    <div className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words shadow-sm
        ${type === 'bot'
          ? 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'
          : 'bg-primary-600 text-white rounded-tr-sm'
        }`}>
        {text}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WhatsAppFlowPage() {
  const toast = useToast();
  const [cfg, setCfg] = useState(DEFAULT_EMPTY);
  const [activeSection, setActiveSection] = useState('greeting');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const { data, loading } = useQuery(GET_FLOW_CONFIG, { fetchPolicy: 'cache-and-network' });

  const [saveFlowConfig] = useMutation(SAVE_FLOW_CONFIG, {
    refetchQueries: [{ query: GET_FLOW_CONFIG }],
  });
  const [resetFlowConfig] = useMutation(RESET_FLOW_CONFIG, {
    refetchQueries: [{ query: GET_FLOW_CONFIG }],
  });

  // Populate from server
  useEffect(() => {
    const fc = data?.getFlowConfig;
    if (!fc) return;
    const cleaned = stripTypename(fc);
    setCfg(prev => ({ ...prev, ...cleaned }));
    setDirty(false);
  }, [data]);

  const set = (field) => (value) => {
    setCfg(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const toggleSection = (id) => setActiveSection(prev => prev === id ? null : id);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveFlowConfig({ variables: { input: buildInput(cfg) } });
      toast.success('WhatsApp flow saved — changes are live immediately!');
      setDirty(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save flow config');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all WhatsApp flow messages to defaults? This cannot be undone.')) return;
    setResetting(true);
    try {
      const { data: rd } = await resetFlowConfig();
      if (rd?.resetFlowConfig) {
        const cleaned = stripTypename(rd.resetFlowConfig);
        setCfg(prev => ({ ...prev, ...cleaned }));
      }
      toast.success('Flow config reset to defaults');
      setDirty(false);
    } catch (err) {
      toast.error(err.message || 'Failed to reset');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            WhatsApp Bot Flow
          </h1>
          <p className="page-subtitle mt-1">
            Customise every message, button label, and discount tier your bot sends — live instantly.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPreview(p => !p)}
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            <Smartphone className="w-4 h-4" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting || saving}
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || resetting}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </div>

      {/* ── Info banner ────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Use <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">{'{cityName}'}</code>,{' '}
          <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">{'{trekName}'}</code>,{' '}
          <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">{'{formattedDate}'}</code>,{' '}
          <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">{'{rangeHint}'}</code>,{' '}
          <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">{'{discountText}'}</code>{' '}
          as dynamic placeholders in message text. Use <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">*bold*</code> for WhatsApp bold formatting.
        </span>
      </div>

      {loading && (
        <div className="card p-8 flex items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
          Loading flow config…
        </div>
      )}

      {!loading && (
        <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-[1fr_320px]' : 'grid-cols-1'}`}>

          {/* ── Left: editor ─────────────────────────────────────────────── */}
          <div className="space-y-3">

            {/* Greeting & Start */}
            <Section id="greeting" label="Greeting & Start" icon="👋" activeSection={activeSection} onToggle={toggleSection}>
              <KeywordsEditor keywords={cfg.greetingKeywords} onChange={set('greetingKeywords')} />
            </Section>

            {/* City Selection */}
            <Section id="city" label="City Selection" icon="🏙️" activeSection={activeSection} onToggle={toggleSection}>
              <TextField
                label="City picker message"
                value={cfg.cityStepMessage}
                onChange={set('cityStepMessage')}
                rows={2}
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="Button label"
                  value={cfg.cityStepButtonLabel}
                  onChange={set('cityStepButtonLabel')}
                  hint="max 20 chars"
                />
                <TextField
                  label="Section title"
                  value={cfg.cityStepSectionTitle}
                  onChange={set('cityStepSectionTitle')}
                />
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                <strong>Fallback (no cities):</strong>
                <textarea
                  rows={2}
                  className="input-field mt-1.5 text-xs resize-none"
                  value={cfg.noCitiesMessage}
                  onChange={e => { setCfg(p => ({ ...p, noCitiesMessage: e.target.value })); setDirty(true); }}
                />
              </div>
            </Section>

            {/* Browse Type */}
            <Section id="browse" label="Browse Type" icon="🔍" activeSection={activeSection} onToggle={toggleSection}>
              <TextField
                label="Browse prompt"
                value={cfg.browseTypeMessage}
                onChange={set('browseTypeMessage')}
                rows={3}
                hint="supports {cityName}"
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField label="'Browse by Treks' button" value={cfg.browseTreksLabel} onChange={set('browseTreksLabel')} hint="max 20 chars" />
                <TextField label="'Browse by Dates' button" value={cfg.browseDatesLabel} onChange={set('browseDatesLabel')} hint="max 20 chars" />
              </div>
            </Section>

            {/* Trek List */}
            <Section id="treks" label="Trek List" icon="🌄" activeSection={activeSection} onToggle={toggleSection}>
              <TextField
                label="Trek list header"
                value={cfg.trekListMessage}
                onChange={set('trekListMessage')}
                rows={2}
                hint="supports {cityName}"
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Button label" value={cfg.trekListButtonLabel} onChange={set('trekListButtonLabel')} hint="max 20 chars" />
                <TextField label="Section title" value={cfg.trekListSectionTitle} onChange={set('trekListSectionTitle')} />
              </div>
              <TextField
                label="No treks available message"
                value={cfg.noTreksMessage}
                onChange={set('noTreksMessage')}
                rows={2}
                hint="supports {cityName}"
              />
            </Section>

            {/* Date List */}
            <Section id="dates" label="Date List" icon="📅" activeSection={activeSection} onToggle={toggleSection}>
              <TextField
                label="Date list header"
                value={cfg.dateListMessage}
                onChange={set('dateListMessage')}
                rows={2}
                hint="supports {cityName}"
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Button label" value={cfg.dateListButtonLabel} onChange={set('dateListButtonLabel')} hint="max 20 chars" />
                <TextField label="Section title" value={cfg.dateListSectionTitle} onChange={set('dateListSectionTitle')} />
              </div>
              <TextField
                label="No dates available message"
                value={cfg.noDatesMessage}
                onChange={set('noDatesMessage')}
                rows={2}
                hint="supports {cityName}"
              />
            </Section>

            {/* Departure Dates */}
            <Section id="departure" label="Departure Dates" icon="🗓️" activeSection={activeSection} onToggle={toggleSection}>
              <TextField
                label="Departure date list header"
                value={cfg.departureDateListMessage}
                onChange={set('departureDateListMessage')}
                rows={2}
                hint="supports {trekName}"
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Button label" value={cfg.departureDateListButtonLabel} onChange={set('departureDateListButtonLabel')} hint="max 20 chars" />
                <TextField label="Section title" value={cfg.departureDateListSectionTitle} onChange={set('departureDateListSectionTitle')} />
              </div>
            </Section>

            {/* Treks on a Date */}
            <Section id="trekOnDate" label="Treks on a Date" icon="🏔️" activeSection={activeSection} onToggle={toggleSection}>
              <TextField
                label="Trek-on-date list header"
                value={cfg.trekOnDateListMessage}
                onChange={set('trekOnDateListMessage')}
                rows={2}
                hint="supports {formattedDate}"
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Button label" value={cfg.trekOnDateListButtonLabel} onChange={set('trekOnDateListButtonLabel')} hint="max 20 chars" />
                <TextField label="Section title" value={cfg.trekOnDateListSectionTitle} onChange={set('trekOnDateListSectionTitle')} />
              </div>
              <TextField
                label="No treks on date message"
                value={cfg.noTreksOnDateMessage}
                onChange={set('noTreksOnDateMessage')}
                rows={2}
              />
            </Section>

            {/* Group Size & Discounts */}
            <Section id="group" label="Group Size & Discounts" icon="👥" activeSection={activeSection} onToggle={toggleSection}>
              <TextField
                label="Group size prompt"
                value={cfg.groupSizeMessage}
                onChange={set('groupSizeMessage')}
                rows={5}
              />
              <DiscountTiersEditor tiers={cfg.discountTiers} onChange={set('discountTiers')} />
              <TextField
                label="Exact count prompt"
                value={cfg.exactCountPrompt}
                onChange={set('exactCountPrompt')}
                rows={3}
                hint="supports {rangeHint}, {discountText}"
              />
              <TextField
                label="Invalid count fallback"
                value={cfg.fallbackMessage}
                onChange={set('fallbackMessage')}
                rows={2}
              />
            </Section>

            {/* Support Message */}
            <Section id="support" label="Support Message" icon="📞" activeSection={activeSection} onToggle={toggleSection}>
              <TextField
                label="Support message"
                value={cfg.supportMessage}
                onChange={set('supportMessage')}
                rows={4}
              />
            </Section>

          </div>

          {/* ── Right: phone preview ─────────────────────────────────────── */}
          {showPreview && (
            <div className="lg:sticky lg:top-6 self-start space-y-3">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Live Preview</span>
                  <span className="badge-slate text-[10px]">approximate</span>
                </div>

                {/* Phone shell */}
                <div className="bg-[#e5ddd5] rounded-2xl p-3 space-y-2 min-h-[400px] overflow-y-auto max-h-[600px]"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\'%3E%3Crect fill=\'%23d4c9b5\' width=\'1\' height=\'1\'/%3E%3C/svg%3E")' }}
                >
                  {/* User greeting */}
                  <PreviewBubble text="hi" type="user" />

                  {/* City step */}
                  <PreviewBubble text={cfg.cityStepMessage} type="bot" />

                  {/* Browse type */}
                  {cfg.browseTypeMessage && (
                    <PreviewBubble
                      text={cfg.browseTypeMessage.replace('{cityName}', 'Pune')}
                      type="bot"
                    />
                  )}

                  {/* Trek list */}
                  {cfg.trekListMessage && (
                    <PreviewBubble
                      text={cfg.trekListMessage.replace('{cityName}', 'Pune')}
                      type="bot"
                    />
                  )}

                  {/* Group size */}
                  <PreviewBubble text={cfg.groupSizeMessage} type="bot" />

                  {/* Discount tiers (buttons) */}
                  {cfg.discountTiers?.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-1">
                      {cfg.discountTiers.slice(0, 3).map((t, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-center text-primary-700 font-medium shadow-sm truncate">
                          {t.label || 'Tier'}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Support */}
                  <PreviewBubble text={cfg.supportMessage} type="bot" />
                </div>
              </div>

              {/* Quick summary */}
              <div className="card p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Stats</p>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Greeting keywords</span>
                    <span className="font-semibold text-slate-800">{cfg.greetingKeywords?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount tiers</span>
                    <span className="font-semibold text-slate-800">{cfg.discountTiers?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max discount</span>
                    <span className="font-semibold text-emerald-600">
                      {cfg.discountTiers?.length
                        ? `${Math.max(...cfg.discountTiers.map(t => Number(t.discount)))}%`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
