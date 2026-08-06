import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';
import { GET_CHATS, GET_MESSAGES, GET_CONVERSATION_LOGS, GET_STAFF_USERS, ASSIGN_GUIDE, UNASSIGN_GUIDE, TOGGLE_AI, GET_CITIES, GET_TREKS, GET_DEPARTURES } from '../graphql/queries';
import { SEND_MESSAGE } from '../graphql/mutations';
import { io } from 'socket.io-client';
import { Search, Send, Paperclip, MoreVertical, Phone as PhoneIcon, PhoneOff, PhoneIncoming, Mic, MicOff, Check, CheckCheck, ArrowLeft, MessageCircle, FileText, CreditCard, SmilePlus, Loader2, RefreshCw, List, ChevronRight, PenSquare, X, Image, Film, Music, File, AlertCircle, Bot, BotOff, UserPlus, UserMinus, UserCheck, Info, Clock, Lock } from 'lucide-react';
import { useWhatsAppCall } from '../hooks/useWhatsAppCall';
import { parseTemplateSpec, buildTemplateComponents, totalParamCount, bodyTextOf, renderTemplateText } from '../utils/whatsappTemplate';
import { resolveDepartureValues, TEMPLATE_DEPARTURE_MAP, applyDepartureToParams } from '../utils/departureTemplateFill';

// Personalization tokens shared with the marketing broadcast page. The backend
// resolves these per-recipient at send time; sample values drive the live preview.
const PERSONALIZATION_TOKENS = [
  { token: '{{name}}', label: 'Name', sample: 'Rahul' },
  { token: '{{firstName}}', label: 'First name', sample: 'Rahul' },
  { token: '{{trek}}', label: 'Trek', sample: 'Jivdhan Valley Trek' },
  { token: '{{city}}', label: 'City', sample: 'Pune' },
  { token: '{{date}}', label: 'Date', sample: '15 Jun 2026' },
];

// Replace personalization tokens with sample values for a realistic preview.
function applySampleTokens(text) {
  let out = text || '';
  for (const t of PERSONALIZATION_TOKENS) {
    out = out.replace(new RegExp(t.token.replace(/[{}]/g, '\\$&'), 'gi'), t.sample);
  }
  return out;
}

function DeliveryTick({ status, failureReason }) {
  if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-300" title="Read" />;
  if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5" title="Delivered" />;
  if (status === 'sent') return <Check className="w-3.5 h-3.5 opacity-70" title="Sent" />;
  if (status === 'failed') return <AlertCircle className="w-3.5 h-3.5 text-red-400" title={failureReason || 'Failed to deliver'} />;
  return <Check className="w-3.5 h-3.5 opacity-40" title="Sending…" />;
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/').replace(/\/$/, '');

function fileIcon(file) {
  if (!file) return File;
  const t = file.type || '';
  if (t.startsWith('image/')) return Image;
  if (t.startsWith('video/')) return Film;
  if (t.startsWith('audio/')) return Music;
  return FileText;
}

function MediaMessage({ raw, message, messageType, mediaUrl, mediaType, fileName, isOutbound }) {
  // Determine type from raw payload first, then messageType DB field, then fall back to mediaType MIME
  const rawType = raw?.type;
  const mimeType = mediaType || '';
  let type = rawType || messageType;
  if (!type) {
    if (mimeType.startsWith('image/')) type = 'image';
    else if (mimeType.startsWith('video/')) type = 'video';
    else if (mimeType.startsWith('audio/')) type = 'audio';
    else if (mimeType) type = 'document';
  }

  if (type === 'image') {
    const caption = raw?.image?.caption || message || '';
    // Use R2 public URL if available for inline preview
    const imgSrc = mediaUrl || raw?.image?.link || null;
    return (
      <div>
        {imgSrc ? (
          <a href={imgSrc} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={imgSrc}
              alt={caption || 'Image'}
              className="rounded-xl max-w-[220px] max-h-[180px] object-cover border border-white/20"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </a>
        ) : (
          <div className={`flex items-center gap-2 px-1 py-2 rounded-lg ${isOutbound ? 'bg-white/10' : 'bg-slate-50'}`}>
            <Image className="w-8 h-8 shrink-0 text-current opacity-70" />
            <span className="text-xs opacity-80">Photo</span>
          </div>
        )}
        {caption && <p className="text-xs mt-1 opacity-90">{caption}</p>}
      </div>
    );
  }
  if (type === 'document') {
    const name = fileName || raw?.document?.filename || raw?.document?.caption || message || 'Document';
    const docUrl = mediaUrl || raw?.document?.link || null;
    return (
      <div className={`flex items-center gap-2 px-2 py-2 rounded-lg ${isOutbound ? 'bg-white/10' : 'bg-slate-50'}`}>
        <FileText className="w-7 h-7 shrink-0 opacity-70" />
        {docUrl ? (
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium truncate max-w-[160px] underline underline-offset-2"
            onClick={e => e.stopPropagation()}
          >
            {name}
          </a>
        ) : (
          <span className="text-xs font-medium truncate max-w-[160px]">{name}</span>
        )}
      </div>
    );
  }
  if (type === 'video') {
    const vidUrl = mediaUrl || raw?.video?.link || null;
    return (
      <div className={`flex items-center gap-2 px-2 py-2 rounded-lg ${isOutbound ? 'bg-white/10' : 'bg-slate-50'}`}>
        <Film className="w-7 h-7 shrink-0 opacity-70" />
        {vidUrl ? (
          <a href={vidUrl} target="_blank" rel="noopener noreferrer" className="text-xs opacity-80 underline underline-offset-2" onClick={e => e.stopPropagation()}>
            Video
          </a>
        ) : (
          <span className="text-xs opacity-80">Video</span>
        )}
      </div>
    );
  }
  if (type === 'audio') {
    return (
      <div className={`flex items-center gap-2 px-2 py-2 rounded-lg ${isOutbound ? 'bg-white/10' : 'bg-slate-50'}`}>
        <Music className="w-7 h-7 shrink-0 opacity-70" />
        <span className="text-xs opacity-80">Audio</span>
      </div>
    );
  }
  return null;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_GRAPHQL_URL?.replace('/graphql', '') || 'http://localhost:8080';

const quickReplies = [
  { label: 'Packing List PDF', icon: FileText },
  { label: 'Payment Link', icon: CreditCard },
  { label: 'Trek Itinerary', icon: FileText },
];

// ─── Lead triage (human-reply based) ─────────────────────────────────────────
// Visual config per leadStatus. Colors: needs_reply→red, contacted→green,
// follow_up→amber, done→slate.
const LEAD_CONFIG = {
  needs_reply: { label: 'Needs Reply', dot: 'bg-red-500',    text: 'text-red-600',   bg: 'bg-red-50',   emoji: '🔴' },
  contacted:   { label: 'Replied',     dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', emoji: '🟢' },
  follow_up:   { label: 'Follow-up',   dot: 'bg-amber-500',  text: 'text-amber-600', bg: 'bg-amber-50', emoji: '🟡' },
  done:        { label: 'Done',        dot: 'bg-slate-400',  text: 'text-slate-500', bg: 'bg-slate-100', emoji: '⚪' },
};

// Tabs shown above the contact list (in display order). "all" has no status filter.
// "window" is a special, computed tab (not a stored leadStatus): chats whose 24h
// WhatsApp free-messaging window is still open, sorted by least time remaining.
const LEAD_TABS = [
  { key: 'all',         label: 'All',         emoji: null },
  { key: 'needs_reply', label: 'Needs Reply', emoji: '🔴' },
  { key: 'window',      label: '24h Window',  emoji: '⏳' },
  { key: 'contacted',   label: 'Replied',     emoji: '🟢' },
  { key: 'follow_up',   label: 'Follow-up',   emoji: '🟡' },
  { key: 'done',        label: 'Done',        emoji: '⚪' },
];

// Resolve a contact's effective lead status (default needs_reply for chat contacts).
function leadStatusOf(contact) {
  return contact?.leadStatus || (contact?.source === 'chat' ? 'needs_reply' : null);
}

// ─── 24h service-window helpers (contact-list level) ─────────────────────────
const WINDOW_MS = 24 * 60 * 60 * 1000;

// Milliseconds left in the free-messaging window for a contact, given `now` (ms).
// Returns 0 when there's no inbound on record or the window has closed.
function windowMsRemaining(contact, now) {
  if (!contact?.lastInboundAt) return 0;
  const inbound = new Date(Number(contact.lastInboundAt) || contact.lastInboundAt).getTime();
  if (Number.isNaN(inbound)) return 0;
  return Math.max(0, inbound + WINDOW_MS - now);
}

// Whether a contact still has an open (free-messaging) window.
function windowIsOpen(contact, now) {
  return windowMsRemaining(contact, now) > 0;
}

// Decision: a chat is "replied" only if the business's last reply came AFTER the
// customer's most recent inbound. Otherwise the latest customer message is still
// unanswered → needs a reply. This is the unambiguous signal the admin acts on
// inside the window so they free-message the right people before it closes.
function windowReplied(contact) {
  if (!contact?.lastInboundAt) return true;
  if (!contact?.lastRepliedAt) return false;
  const inbound = new Date(Number(contact.lastInboundAt) || contact.lastInboundAt).getTime();
  const replied = new Date(Number(contact.lastRepliedAt) || contact.lastRepliedAt).getTime();
  if (Number.isNaN(inbound) || Number.isNaN(replied)) return false;
  return replied >= inbound;
}

// Format remaining window time compactly, e.g. "3h 12m" / "47m" / "Closing".
function fmtWindowLeft(ms) {
  if (ms <= 0) return 'Closed';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 1) return `${h}h ${m}m`;
  if (m >= 1) return `${m}m`;
  return 'Closing';
}

// Urgency colour for the time-left badge: <1h red, <3h amber, else green.
function windowUrgencyClass(ms) {
  if (ms <= 60 * 60 * 1000) return 'text-red-600 bg-red-50';
  if (ms <= 3 * 60 * 60 * 1000) return 'text-amber-600 bg-amber-50';
  return 'text-emerald-600 bg-emerald-50';
}

function fmtFollowUpDate(value) {
  if (!value) return '';
  try {
    const d = new Date(Number(value) || value);
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

// Parse WhatsApp-style bold (*text*) and URLs, render as <strong> / <a>
function parseWhatsAppText(text) {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*|https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={i}>{part.slice(1, -1)}</strong>;
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          className="underline break-all"
          onClick={e => e.stopPropagation()}
        >{part}</a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// Render interactive buttons from raw payload
function InteractiveButtons({ raw, isOutbound }) {
  if (!raw?.interactive) return null;
  const { type, action } = raw.interactive;

  if (type === 'button' && action?.buttons) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {action.buttons.map((btn) => (
          <span
            key={btn.reply.id}
            className={`inline-block px-3 py-1.5 rounded-lg text-xs font-medium border
              ${isOutbound
                ? 'border-white/30 text-white/90'
                : 'border-slate-200 text-primary-600 bg-white'
              }`}
          >
            {btn.reply.title}
          </span>
        ))}
      </div>
    );
  }

  if (type === 'list' && action?.sections) {
    return (
      <div className="mt-2 space-y-1">
        <div className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${isOutbound ? 'text-white/70' : 'text-slate-400'}`}>
          <List className="w-3 h-3" />
          {action.button || 'View Options'}
        </div>
        {action.sections.map((section, si) => (
          <div key={si}>
            {section.rows?.map((row) => (
              <div
                key={row.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs mb-0.5
                  ${isOutbound ? 'bg-white/10' : 'bg-slate-50 border border-slate-100'}`}
              >
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className={`font-medium truncate ${isOutbound ? 'text-white' : 'text-slate-700'}`}>{row.title}</div>
                  {row.description && (
                    <div className={`text-[10px] mt-0.5 truncate ${isOutbound ? 'text-white/60' : 'text-slate-400'}`}>{row.description}</div>
                  )}
                </div>
                <ChevronRight className={`w-3 h-3 shrink-0 ml-1 ${isOutbound ? 'text-white/40' : 'text-slate-300'}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return null;
}

const PAGE_SIZE = 30;

// Bot action definitions for the "Send Bot Message" panel.
const BOT_ACTIONS = [
  { value: 'city_list', label: 'Show City List' },
  { value: 'trek_list', label: 'Show Treks for City' },
  { value: 'trek_dates', label: 'Show Dates for Trek' },
  { value: 'booking_link', label: 'Send Booking Link' },
];

// Manually trigger a bot interactive message (city list, trek list, dates, booking link)
// from the chat UI. Reuses the same backend handlers the WhatsApp bot uses, so sending
// these also advances the customer's session step.
function BotActionPanel({ phone, windowOpen, onSent, onClose, toast }) {
  const [action, setAction] = useState('city_list');
  const [cityId, setCityId] = useState('');
  const [trekId, setTrekId] = useState('');
  const [departureId, setDepartureId] = useState('');
  const [sending, setSending] = useState(false);

  const { data: citiesData } = useQuery(GET_CITIES, {
    variables: { isActive: true },
    fetchPolicy: 'cache-first',
  });
  const { data: treksData } = useQuery(GET_TREKS, {
    variables: { isActive: true },
    fetchPolicy: 'cache-first',
  });
  // Departures only needed for the booking_link action, once a trek is chosen.
  const { data: departuresData, loading: departuresLoading } = useQuery(GET_DEPARTURES, {
    variables: { trekId: trekId || null },
    skip: action !== 'booking_link' || !trekId,
    fetchPolicy: 'cache-first',
  });

  const cities = citiesData?.getCities || [];
  const treks = treksData?.getTreks || [];
  const departures = departuresData?.getDepartures || [];

  const needsCity = action === 'trek_list' || action === 'trek_dates';
  const needsTrek = action === 'trek_dates' || action === 'booking_link';
  const needsDeparture = action === 'booking_link';

  const canSend =
    windowOpen &&
    !sending &&
    (!needsCity || cityId) &&
    (!needsTrek || trekId) &&
    (!needsDeparture || departureId);

  const fmtDate = (d) => {
    if (!d) return '';
    try { return new Date(Number(d) || d).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return ''; }
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const body = { action };
      if (cityId) body.cityId = cityId;
      if (trekId) body.trekId = trekId;
      if (departureId) body.departureId = departureId;
      const token = localStorage.getItem('trekops_token');
      const res = await fetch(`${API_URL}/api/chat/${phone}/bot-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      toast.success('Bot message sent');
      onSent();
    } catch (e) {
      toast.error(e.message || 'Failed to send bot message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-3 sm:px-5 pt-3 pb-2 bg-white border-t border-slate-100">
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Bot className="w-4 h-4 text-primary-600" /> Send Bot Message
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        <div className="px-3.5 py-3 space-y-3">
          {!windowOpen && (
            <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span className="text-xs text-amber-700">24h window is closed — bot messages require an active conversation.</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setDepartureId(''); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              {BOT_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {needsCity && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">City</label>
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="">Select a city…</option>
                {cities.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}{c.state ? `, ${c.state}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {needsTrek && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trek</label>
              <select
                value={trekId}
                onChange={(e) => { setTrekId(e.target.value); setDepartureId(''); }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="">Select a trek…</option>
                {treks.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}{t.location ? ` — ${t.location}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {needsDeparture && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Departure</label>
              {!trekId ? (
                <p className="text-xs text-slate-400">Select a trek first to load its departures.</p>
              ) : (
                <select
                  value={departureId}
                  onChange={(e) => setDepartureId(e.target.value)}
                  disabled={departuresLoading}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-60"
                >
                  <option value="">{departuresLoading ? 'Loading…' : `Select a departure (${departures.length})`}</option>
                  {departures.map((d) => (
                    <option key={d._id} value={d._id}>
                      {fmtDate(d.startDate)}{d.endDate ? ` → ${fmtDate(d.endDate)}` : ''}{d.status ? ` · ${d.status}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={!canSend}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            Send Bot Message
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lead-status control rendered in the conversation header ──────────────────
// Self-contained: manages its own dropdown / follow-up-date / note draft state.
// Calls onUpdate({ status?, followUpAt?, note? }) which hits POST /:phone/lead.
function LeadStatusControl({ status, followUpAt, note, onUpdate, busy }) {
  const [open, setOpen] = useState(false);
  const [dateDraft, setDateDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState(note || '');
  const cur = LEAD_CONFIG[status] || LEAD_CONFIG.needs_reply;

  const apply = async (body) => {
    await onUpdate(body);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setNoteDraft(note || ''); setDateDraft(''); setOpen(o => !o); }}
        disabled={busy}
        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer ${cur.bg} ${cur.text}`}
        title="Lead status"
      >
        <span className={`w-2 h-2 rounded-full ${cur.dot}`} />
        {cur.label}
        {followUpAt && status === 'follow_up' && (
          <span className="opacity-70">· {new Date(followUpAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1.5 pb-0.5">Set status</p>
            {[
              { key: 'needs_reply', label: 'Needs Reply' },
              { key: 'contacted',   label: 'Replied' },
              { key: 'done',        label: 'Done' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => apply({ status: opt.key })}
                disabled={busy}
                className={`w-full flex items-center gap-2 text-left text-sm px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer ${status === opt.key ? 'bg-slate-50 font-medium' : ''}`}
              >
                <span className={`w-2 h-2 rounded-full ${LEAD_CONFIG[opt.key].dot}`} />
                {opt.label}
                {status === opt.key && <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
              </button>
            ))}

            <div className="border-t border-slate-100 pt-1.5 mt-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1.5 pb-1">Follow up later</p>
              <div className="flex items-center gap-1.5 px-1.5">
                <input
                  type="datetime-local"
                  value={dateDraft}
                  onChange={(e) => setDateDraft(e.target.value)}
                  className="flex-1 min-w-0 text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => apply({ status: 'follow_up', followUpAt: dateDraft ? new Date(dateDraft).toISOString() : null })}
                  disabled={busy}
                  className="text-xs font-medium px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer whitespace-nowrap"
                  title="Park this lead; leave date blank to park indefinitely"
                >
                  <Clock className="w-3.5 h-3.5 inline mr-0.5" /> Park
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-1.5 mt-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1.5 pb-1">Note</p>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={2}
                placeholder="e.g. wants July dates, budget 3k"
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-primary-400 resize-none"
              />
              <button
                onClick={() => apply({ note: noteDraft.trim() })}
                disabled={busy}
                className="w-full mt-1 text-xs font-medium px-2 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Save note
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SupportChatPage() {
  const [activePhone, setActivePhone] = useState(null);
  // Mirror of activePhone for use inside socket handlers (which capture state at
  // mount time, so they need a ref to read the current value).
  const activePhoneRef = useRef(null);
  useEffect(() => { activePhoneRef.current = activePhone; }, [activePhone]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Lead-triage filter tab. Default to the work queue: Needs Reply.
  const [leadTab, setLeadTab] = useState('needs_reply');
  // Ticking clock (ms) so the 24h-window countdowns + sort refresh on their own.
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [showMobileChat, setShowMobileChat] = useState(false);

  // ─── Deep link: /support-chat?phone=91XXXXXXXXXX ───────────────────────────
  // Opens that conversation immediately. Used by the "Open chat" action on the
  // Contacts page, which targets a new tab. GET_MESSAGES is keyed on activePhone
  // alone, so the contact does not need to already exist in the chat list — a
  // never-messaged number opens to an empty thread ready to send.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const raw = searchParams.get('phone');
    if (!raw) return;
    const phone = raw.replace(/\D/g, '');
    if (phone) {
      setActivePhone(phone);
      setShowMobileChat(true);
    }
    // Strip the param so picking another conversation isn't undone on re-render.
    const next = new URLSearchParams(searchParams);
    next.delete('phone');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
  // Lead-action menu / inline editors in the conversation header.
  const [showLeadMenu, setShowLeadMenu] = useState(false);
  const [leadUpdating, setLeadUpdating] = useState(false);
  const [showFollowUpInput, setShowFollowUpInput] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [liveMessages, setLiveMessages] = useState([]);
  const [statusUpdates, setStatusUpdates] = useState({}); // waMessageId → deliveryStatus
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null); // scroll container for messages area
  const socketRef = useRef(null);
  // socketInstance is kept in state so hook re-renders when the socket connects
  const [socketInstance, setSocketInstance] = useState(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [sendingFiles, setSendingFiles] = useState(false);
  const [filesSendError, setFilesSendError] = useState('');

  // ─── Pagination state ──────────────────────────────
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  // Saved scroll offset used to restore position after prepending older messages
  const savedScrollOffset = useRef(null);
  // Whether user is near bottom — controls auto-scroll vs "new messages" pill
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showNewMsgPill, setShowNewMsgPill] = useState(false);
  const apolloClient = useApolloClient();

  // ─── WhatsApp Call ─────────────────────────────────
  const {
    callState,
    incomingCall,
    permissionPhone,
    muted,
    error: callError,
    audioRef,
    startCall,
    answerCall,
    rejectCall,
    terminateCall,
    toggleMute,
    requestCallPermission,
  } = useWhatsAppCall({ socket: socketInstance });

  // ─── Active call: elapsed seconds timer ───────────
  const [callSeconds, setCallSeconds] = useState(0);
  useEffect(() => {
    if (callState !== 'in-call') { setCallSeconds(0); return; }
    const id = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [callState]);

  const handleCallClick = useCallback(() => {
    if (!activePhone) return;
    if (callState === 'idle') {
      startCall(activePhone);
    } else if (callState === 'needs-permission') {
      requestCallPermission(activePhone);
    } else if (callState !== 'ringing-in' && callState !== 'needs-permission' && callState !== 'permission-requested') {
      terminateCall();
    }
  }, [activePhone, callState, startCall, terminateCall, requestCallPermission]);

  const formatCallDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── Guide Oversight State ─────────────────────────
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState('');

  // ─── Manual Bot Actions panel ──────────────────────
  const [showBotActions, setShowBotActions] = useState(false);
  // Lightweight transient toast (no toast lib in this project) — { type, text }
  const [toastMsg, setToastMsg] = useState(null);
  const toast = useMemo(() => ({
    success: (text) => setToastMsg({ type: 'success', text }),
    error: (text) => setToastMsg({ type: 'error', text }),
  }), []);
  useEffect(() => {
    if (!toastMsg) return;
    const id = setTimeout(() => setToastMsg(null), 3500);
    return () => clearTimeout(id);
  }, [toastMsg]);

  // Re-tick once a minute so the 24h-window time-left badges + ordering stay live.
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // ─── GraphQL: Contacts (initial load only) ─────────
  // Declared early so the callbacks below can reference refetchChats without a
  // temporal-dead-zone ReferenceError.
  const { data: chatsData, loading: chatsLoading, refetch: refetchChats } = useQuery(GET_CHATS);

  // ─── New Message Modal ─────────────────────────────
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [newPhone, setNewPhone] = useState('91');
  const [newText, setNewText] = useState('');
  const [newMsgError, setNewMsgError] = useState('');

  // ─── 24h service window state ──────────────────────
  // null = unknown / not loaded for active conversation
  const [windowState, setWindowState] = useState(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState('');
  const [pickedTemplate, setPickedTemplate] = useState('');
  const [paramValues, setParamValues] = useState({ headerParams: [], bodyParams: [], buttonParams: {} });
  const [sendingTemplate, setSendingTemplate] = useState(false);

  // Departure auto-fill for the template modal (mirrors the Broadcast page). All
  // departures load here — there is no trek/city filter context in single-chat.
  const { data: chatDepData } = useQuery(GET_DEPARTURES, { fetchPolicy: 'cache-first' });
  const chatDepartures = chatDepData?.getDepartures || [];
  const [tmplDepartureId, setTmplDepartureId] = useState('');

  const pickedTemplateObj = useMemo(
    () => templates.find((t) => `${t.name}::${t.language}` === pickedTemplate),
    [templates, pickedTemplate]
  );
  const pickedName = pickedTemplateObj?.name;
  const templateSpec = useMemo(
    () => (pickedTemplateObj ? parseTemplateSpec(pickedTemplateObj.components) : null),
    [pickedTemplateObj]
  );
  const tmplDepartureObj = useMemo(
    () => chatDepartures.find((d) => d._id === tmplDepartureId),
    [chatDepartures, tmplDepartureId]
  );

  useEffect(() => {
    setParamValues({ headerParams: [], bodyParams: [], buttonParams: {} });
    setTmplDepartureId('');
  }, [pickedTemplate]);

  const loadWindow = useCallback(async (phone) => {
    if (!phone) { setWindowState(null); return; }
    try {
      const token = localStorage.getItem('trekops_token');
      const res = await fetch(`${API_URL}/api/chat/${phone}/window`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setWindowState(null); return; }
      const data = await res.json();
      setWindowState(data);
    } catch {
      setWindowState(null);
    }
  }, []);

  const loadChatTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    setTemplatesError('');
    try {
      const token = localStorage.getItem('trekops_token');
      const res = await fetch(`${API_URL}/api/chat/templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setTemplates(data.templates || []);
    } catch (e) {
      setTemplatesError(e.message);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  // Refresh window state when active conversation changes or a new inbound arrives.
  useEffect(() => { loadWindow(activePhone); }, [activePhone, loadWindow]);

  // Insert a personalization token into a header/body param input (appends to value).
  const insertTokenChat = useCallback((group, i, token) => {
    setParamValues((prev) => {
      const next = [...(prev[group] || [])];
      next[i] = `${next[i] || ''}${token}`;
      return { ...prev, [group]: next };
    });
  }, []);

  // Overwrite a header/body text variable with a departure value (replaces, not appends).
  const setParamValueChat = useCallback((group, i, value) => {
    setParamValues((prev) => {
      const next = [...(prev[group] || [])];
      next[i] = String(value ?? '');
      return { ...prev, [group]: next };
    });
  }, []);

  // Overwrite a button-suffix value with a departure value. Mirrors the button onChange shape.
  const setButtonParamChat = useCallback((index, i, value) => {
    setParamValues((prev) => {
      const existing = prev.buttonParams[index] || [];
      const next = [...existing];
      next[i] = String(value ?? '');
      return { ...prev, buttonParams: { ...prev.buttonParams, [index]: next } };
    });
  }, []);

  const sendTemplate = useCallback(async () => {
    if (!activePhone || !pickedTemplateObj) return;
    setSendingTemplate(true);
    try {
      const components = templateSpec ? buildTemplateComponents(templateSpec, paramValues) : [];
      const displayText = renderTemplateText(bodyTextOf(pickedTemplateObj.components), paramValues.bodyParams);
      const token = localStorage.getItem('trekops_token');
      const res = await fetch(`${API_URL}/api/chat/${activePhone}/template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: pickedTemplateObj.name,
          language: pickedTemplateObj.language,
          components,
          displayText,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setShowTemplatePicker(false);
      setPickedTemplate('');
      setTmplDepartureId('');
      // Backend marked the lead "contacted" — refetch so it flips to Replied.
      refetchChats();
      // Optimistic: socket will push the saved ChatMessage shortly.
    } catch (e) {
      alert(`Failed to send template: ${e.message}`);
    } finally {
      setSendingTemplate(false);
    }
  }, [activePhone, pickedTemplateObj, templateSpec, paramValues, refetchChats]);

  // ─── GraphQL: Messages for active phone (initial load, paginated) ─
  const { data: messagesData, loading: messagesLoading, refetch: refetchMessages, fetchMore } = useQuery(GET_MESSAGES, {
    variables: { phone: activePhone, limit: PAGE_SIZE },
    skip: !activePhone,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      setHasMore(data?.getMessages?.hasMore ?? false);
    },
  });

  // ─── GraphQL: Conversation logs for active phone ───
  const { data: logsData, refetch: refetchLogs } = useQuery(GET_CONVERSATION_LOGS, {
    variables: { phone: activePhone },
    skip: !activePhone,
    fetchPolicy: 'cache-and-network',
  });

  // ─── GraphQL: Staff users for guide assignment ─────
  const { data: staffData } = useQuery(GET_STAFF_USERS, { fetchPolicy: 'cache-first' });

  // ─── GraphQL: Send message ─────────────────────────
  const [sendMessageMutation, { loading: sending }] = useMutation(SEND_MESSAGE);

  // ─── GraphQL: Guide oversight mutations ───────────
  const [assignGuide, { loading: assigning }] = useMutation(ASSIGN_GUIDE);
  const [unassignGuide, { loading: unassigning }] = useMutation(UNASSIGN_GUIDE);
  const [toggleAIMutation, { loading: toggling }] = useMutation(TOGGLE_AI);

  // ─── Socket.IO for real-time updates ───────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token: localStorage.getItem('trekops_token') },
    });
    socketRef.current = socket;
    // Expose to state so useWhatsAppCall can subscribe once connected
    setSocketInstance(socket);

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    // Backend now requires a valid JWT on the socket; re-send a refreshed token.
    socket.on('connect_error', (err) => {
      console.warn('Socket connect_error:', err.message);
      socket.auth = { token: localStorage.getItem('trekops_token') };
    });

    socket.on('newMessage', (msg) => {
      // Append to live messages
      setLiveMessages(prev => {
        // Deduplicate by _id
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Refresh contact list to update last message / counts
      refetchChats();
      // A new inbound for the active conversation resets the 24h service window —
      // refetch so the badge + input state update immediately.
      if (msg.direction === 'inbound' && msg.phone && activePhoneRef.current === msg.phone) {
        loadWindow(msg.phone);
      }
      // The scroll auto-scroll / pill logic runs in the messages useEffect
    });

    socket.on('messageStatusUpdate', ({ waMessageId, deliveryStatus, deliveryFailureReason }) => {
      if (!waMessageId) return;
      setStatusUpdates(prev => ({ ...prev, [waMessageId]: { deliveryStatus, deliveryFailureReason } }));
      // Also patch liveMessages if the message is there
      setLiveMessages(prev => prev.map(m =>
        m.waMessageId === waMessageId ? { ...m, deliveryStatus, deliveryFailureReason } : m
      ));
    });

    socket.on('conversationAssigned', () => { refetchChats(); });
    socket.on('aiToggled', () => { refetchChats(); });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
    };
  }, [refetchChats]);

  // ─── Polling fallback for live updates ─────────────────────────────────────
  // The Socket.IO push is the primary realtime path, but it only delivers events
  // from the server the dashboard is connected to. When that differs from the
  // server processing WhatsApp webhooks (e.g. a dev dashboard pointed at localhost
  // while Meta delivers to production), or when a reverse proxy drops the WS
  // upgrade, socket events never arrive. Since all servers share the same Mongo,
  // a short REST re-poll surfaces new inbound messages within a few seconds
  // regardless. Skipped while the tab is hidden to avoid wasted requests.
  useEffect(() => {
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (activePhoneRef.current) refetchMessages();
      refetchChats();
    }, 8000);
    return () => clearInterval(id);
  }, [refetchMessages, refetchChats]);

  // Reset live messages, attachments, pagination state, and panel state when switching chats
  useEffect(() => {
    setLiveMessages([]);
    setAttachedFiles([]);
    setMessage('');
    setFilesSendError('');
    setShowInfoPanel(false);
    setShowBotActions(false);
    setShowLeadMenu(false);
    setShowFollowUpInput(false);
    setShowNoteInput(false);
    setFollowUpDate('');
    setSelectedGuideId('');
    setHasMore(false);
    setLoadingOlder(false);
    setIsNearBottom(true);
    setShowNewMsgPill(false);
    savedScrollOffset.current = null;
    // Evict cached messages for the previous phone so the next chat starts fresh
    // (the keyArgs policy means each phone has its own cache entry)
    if (activePhone) {
      apolloClient.cache.evict({
        fieldName: 'getMessages',
        args: { phone: activePhone },
      });
      apolloClient.cache.gc();
    }
  }, [activePhone]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-resize textarea after every message state change (runs after React's DOM update)
  useEffect(() => {
    const ta = messageInputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [message]);

  const contacts = useMemo(() => {
    return chatsData?.getChats || [];
  }, [chatsData]);

  // Merge paginated DB messages with live socket messages for the active phone
  const messages = useMemo(() => {
    const dbMessages = messagesData?.getMessages?.messages || [];
    const phoneMessages = liveMessages.filter(m => m.phone === activePhone);
    // Merge and deduplicate
    const allMap = new Map();
    dbMessages.forEach(m => allMap.set(m._id, m));
    phoneMessages.forEach(m => allMap.set(m._id, m));
    return Array.from(allMap.values()).sort(
      (a, b) => new Date(Number(a.createdAt) || a.createdAt) - new Date(Number(b.createdAt) || b.createdAt)
    );
  }, [messagesData, liveMessages, activePhone]);

  const activeContact = useMemo(() => {
    return contacts.find(c => c.phone === activePhone) || null;
  }, [contacts, activePhone]);

  // Caller name for incoming call modal
  const incomingCallerName = useMemo(() => {
    if (!incomingCall?.phone) return null;
    const contact = contacts.find(c => c.phone === incomingCall.phone);
    return contact?.name || null;
  }, [incomingCall, contacts]);

  // Live counts per lead-status tab, computed from the loaded contact list.
  const leadCounts = useMemo(() => {
    const counts = { all: contacts.length, needs_reply: 0, window: 0, contacted: 0, follow_up: 0, done: 0 };
    contacts.forEach((c) => {
      const s = leadStatusOf(c);
      if (s && counts[s] !== undefined) counts[s] += 1;
      // "window" is computed (open 24h window), independent of stored lead status.
      if (windowIsOpen(c, nowTick)) counts.window += 1;
    });
    return counts;
  }, [contacts, nowTick]);

  const filteredContacts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const list = contacts.filter((c) => {
      if (!(c.phone || '').toLowerCase().includes(term) &&
          !(c.name || '').toLowerCase().includes(term)) return false;
      if (leadTab === 'all') return true;
      if (leadTab === 'window') return windowIsOpen(c, nowTick);
      return leadStatusOf(c) === leadTab;
    });
    // 24h Window tab: least time remaining first — the chat about to close sits on top.
    if (leadTab === 'window') {
      return [...list].sort(
        (a, b) => windowMsRemaining(a, nowTick) - windowMsRemaining(b, nowTick)
      );
    }
    // Needs Reply tab: oldest unanswered first so the longest-waiting lead is on top.
    if (leadTab === 'needs_reply') {
      return [...list].sort(
        (a, b) => new Date(Number(a.lastMessageTime) || a.lastMessageTime) - new Date(Number(b.lastMessageTime) || b.lastMessageTime)
      );
    }
    // Other tabs keep the backend newest-first ordering.
    return list;
  }, [contacts, searchTerm, leadTab, nowTick]);

  // ─── Derive guide oversight values from active contact ─
  const logs = logsData?.getConversationLogs || [];
  const staffUsers = staffData?.getStaffUsers || [];
  const aiEnabled = activeContact?.aiEnabled !== false; // default true if not set
  const assignedGuideId = activeContact?.assignedGuideId || null;
  const assignedGuideName = activeContact?.assignedGuideName || null;

  // After older messages are prepended: restore scroll position so the user stays on the
  // same message they were reading (no visible jump). Must be synchronous (useLayoutEffect).
  useLayoutEffect(() => {
    if (savedScrollOffset.current !== null && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight - savedScrollOffset.current;
      savedScrollOffset.current = null;
    }
  }, [messages]);

  // Scroll to bottom when the chat first loads (initial render with messages)
  const prevActivePhoneRef = useRef(null);
  useEffect(() => {
    if (activePhone !== prevActivePhoneRef.current) {
      prevActivePhoneRef.current = activePhone;
      // Chat switched — scroll to bottom after first paint
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
      return;
    }
    // Existing chat: only auto-scroll if user is near the bottom
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowNewMsgPill(false);
    } else {
      // User is reading old messages — show the pill for new arrivals
      setShowNewMsgPill(true);
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Helper: format relative time for activity log ─
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // ─── Guide oversight handlers ──────────────────────
  const handleToggleAI = useCallback(async () => {
    const newEnabled = !aiEnabled;
    if (!newEnabled) {
      const ok = window.confirm('Turn off AI? The bot will stop responding. You must reply manually.');
      if (!ok) return;
    }
    try {
      await toggleAIMutation({ variables: { phone: activePhone, enabled: newEnabled } });
      await refetchChats();
      refetchLogs();
    } catch (e) { console.error(e); }
  }, [aiEnabled, activePhone, toggleAIMutation, refetchChats, refetchLogs]);

  const handleAssignGuide = useCallback(async () => {
    if (!selectedGuideId || !activePhone) return;
    try {
      await assignGuide({ variables: { phone: activePhone, guideId: selectedGuideId } });
      setSelectedGuideId('');
      await refetchChats();
      refetchLogs();
    } catch (e) { console.error(e); }
  }, [selectedGuideId, activePhone, assignGuide, refetchChats, refetchLogs]);

  const handleUnassignGuide = useCallback(async () => {
    if (!activePhone) return;
    try {
      await unassignGuide({ variables: { phone: activePhone } });
      await refetchChats();
      refetchLogs();
    } catch (e) { console.error(e); }
  }, [activePhone, unassignGuide, refetchChats, refetchLogs]);

  // ─── Lead triage: update status / follow-up / note via REST, then refetch ──
  const updateLead = useCallback(async (body) => {
    if (!activePhone) return;
    setLeadUpdating(true);
    try {
      const token = localStorage.getItem('trekops_token');
      const res = await fetch(`${API_URL}/api/chat/${activePhone}/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      // Refetch the contact list so tabs / counts / row indicators update.
      await refetchChats();
      toast.success('Lead updated');
      return data;
    } catch (e) {
      toast.error(e.message || 'Failed to update lead');
    } finally {
      setLeadUpdating(false);
    }
  }, [activePhone, refetchChats, toast]);

  const handleSend = useCallback(async () => {
    if (!message.trim() || !activePhone) return;
    const text = message.trim();
    setMessage('');
    try {
      await sendMessageMutation({ variables: { phone: activePhone, text } });
      // Backend marks the lead "contacted" on send — refetch so it moves
      // Needs Reply → Replied and the tab counts update.
      refetchChats();
      // Socket will handle the message update via the newMessage event.
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessage(text);
    }
  }, [message, activePhone, sendMessageMutation, refetchChats]);

  const handleRetry = useCallback(async (msg) => {
    const text = msg.message;
    if (!text || !activePhone) return;
    try {
      await sendMessageMutation({ variables: { phone: activePhone, text } });
    } catch (err) {
      console.error('Retry failed:', err);
    }
  }, [activePhone, sendMessageMutation]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 10);
    setAttachedFiles(prev => [...prev, ...files].slice(0, 10));
    e.target.value = '';
  };

  const removeAttachment = (idx) => setAttachedFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSendFiles = useCallback(async () => {
    if (!activePhone || (attachedFiles.length === 0 && !message.trim())) return;
    setSendingFiles(true);
    setFilesSendError('');
    try {
      const form = new FormData();
      attachedFiles.forEach(f => form.append('files', f));
      if (message.trim()) form.append('text', message.trim());
      const token = localStorage.getItem('trekops_token');
      if (!token) {
        // No token in storage — don't fire an unauthenticated request that the
        // server can only reject with 401. Surface a clear, actionable error.
        setFilesSendError('Your session has expired. Please log out and log in again to send files.');
        return;
      }
      const res = await fetch(`${API_URL}/api/chat/${activePhone}/send-files`, {
        method: 'POST',
        body: form,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 401 here means the token was rejected by the server — almost always
        // an expired JWT. Tell the user exactly that instead of a generic error.
        const errMsg = res.status === 401 || res.status === 403
          ? 'Your session has expired. Please log out and log in again to send files.'
          : (data?.error || `Send failed (HTTP ${res.status})`);
        setFilesSendError(errMsg);
        // Clear attachments on any failure — including 401/403 — so the admin
        // can't keep retrying with a dead token; the error message tells them
        // to log in again. Failed messages (partial success) are in the chat.
        setAttachedFiles([]);
        setMessage('');
        return;
      }
      // Partial failure: some files were sent, some failed.
      // Backend already persisted failed ChatMessages with deliveryStatus:"failed".
      // Socket will push them to the UI. Just clear the input.
      setAttachedFiles([]);
      setMessage('');
      // Backend marked the lead "contacted" — refetch so it flips to Replied.
      refetchChats();
      if (data.results?.some(r => r.status === 'failed')) {
        const failCount = data.results.filter(r => r.status === 'failed').length;
        setFilesSendError(`${failCount} file(s) failed to send — see the failed message(s) in the chat.`);
      }
    } catch (err) {
      console.error('Failed to send files:', err);
      setFilesSendError('Network error — could not reach server.');
    } finally {
      setSendingFiles(false);
    }
  }, [activePhone, attachedFiles, message, refetchChats]);

  // ─── Load older messages (scroll-up pagination) ────
  const loadOlderMessages = useCallback(async () => {
    if (!hasMore || loadingOlder || !activePhone || messages.length === 0) return;
    const oldest = messages[0];
    if (!oldest?.createdAt) return;

    // Save scroll offset BEFORE the fetch so useLayoutEffect can restore it
    if (messagesContainerRef.current) {
      savedScrollOffset.current =
        messagesContainerRef.current.scrollHeight - messagesContainerRef.current.scrollTop;
    }

    setLoadingOlder(true);
    try {
      const result = await fetchMore({
        variables: {
          phone: activePhone,
          limit: PAGE_SIZE,
          before: String(oldest.createdAt),
        },
      });
      setHasMore(result?.data?.getMessages?.hasMore ?? false);
    } catch (err) {
      console.error('Failed to load older messages:', err);
      savedScrollOffset.current = null; // clear on error so layout effect is a no-op
    } finally {
      setLoadingOlder(false);
    }
  }, [hasMore, loadingOlder, activePhone, messages, fetchMore]);

  // ─── Scroll event handler ───────────────────────────
  const handleMessagesScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < 100;
    setIsNearBottom(nearBottom);
    if (nearBottom) setShowNewMsgPill(false);

    // Trigger older message load when scrolled near the top
    if (container.scrollTop < 100 && hasMore && !loadingOlder) {
      loadOlderMessages();
    }
  }, [hasMore, loadingOlder, loadOlderMessages]);

  const handleSelectChat = (contact) => {
    setActivePhone(contact.phone);
    setShowMobileChat(true);
  };

  const handleSendNew = useCallback(async () => {
    const phone = newPhone.replace(/\D/g, '');
    const text = newText.trim();
    if (!phone || phone.length < 7) { setNewMsgError('Enter a valid phone number with country code'); return; }
    if (!text) { setNewMsgError('Message cannot be empty'); return; }
    setNewMsgError('');
    try {
      await sendMessageMutation({ variables: { phone, text } });
      await refetchChats();
      setShowNewMsg(false);
      setNewPhone('91');
      setNewText('');
      setActivePhone(phone);
      setShowMobileChat(true);
    } catch (err) {
      setNewMsgError(err.message || 'Failed to send message');
    }
  }, [newPhone, newText, sendMessageMutation, refetchChats]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(Number(dateStr) || dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(Number(dateStr) || dateStr);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) return 'Today';
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  const getAvatar = (phone, name) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (!phone) return '?';
    const digits = phone.replace(/\D/g, '');
    return digits.slice(-2);
  };

  return (
    <div className="animate-fade-in -m-4 lg:-m-6 h-[calc(100vh-64px)] overflow-x-hidden">
      <div className="flex h-full bg-white rounded-none sm:rounded-xl border-0 sm:border border-slate-200/80 shadow-sm overflow-hidden mx-0 sm:mx-4 sm:mt-4 lg:mx-6 lg:mt-6">

        {/* ──────── LEFT: Contact List ──────── */}
        <div className={`w-full sm:w-[340px] lg:w-[360px] border-r border-slate-100 flex flex-col shrink-0 bg-white ${showMobileChat ? 'hidden sm:flex' : 'flex'}`}>
          <div className="px-4 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-lg font-bold text-slate-900">WhatsApp Chat</h1>
                <p className="text-xs text-slate-500">{contacts.length} conversation{contacts.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => refetchChats()} className="w-9 h-9 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-colors cursor-pointer" title="Refresh">
                  <RefreshCw className={`w-4 h-4 text-slate-500 ${chatsLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => { setShowNewMsg(true); setNewMsgError(''); }}
                  className="w-9 h-9 bg-primary-600 hover:bg-primary-700 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                  title="New Message"
                >
                  <PenSquare className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name or phone..." className="input-field pl-9 !py-2 text-sm" />
            </div>
          </div>

          {/* ─── Lead-triage filter tabs ─── */}
          <div className="flex items-center gap-1 px-2 py-2 border-b border-slate-100 overflow-x-auto scrollbar-hide">
            {LEAD_TABS.map((tab) => {
              const active = leadTab === tab.key;
              const count = leadCounts[tab.key] ?? 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => setLeadTab(tab.key)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0
                    ${active ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  title={tab.label}
                >
                  {tab.emoji && <span className="text-[11px] leading-none">{tab.emoji}</span>}
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-bold px-1 rounded ${active ? 'bg-white/25' : 'bg-white text-slate-500'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto">
            {chatsLoading && contacts.length === 0 ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-slate-300 animate-spin" /></div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No conversations yet</p>
              </div>
            ) : (
              filteredContacts.map(contact => (
                <div
                  key={contact.phone}
                  onClick={() => handleSelectChat(contact)}
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 border-l-[3px]
                    ${activePhone === contact.phone ? 'bg-primary-50/60 border-l-primary-600' : 'border-l-transparent hover:bg-slate-50'}
                  `}
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">{getAvatar(contact.phone, contact.name)}</div>
                    {contact.source === 'chat' && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{contact.name || contact.phone}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">{formatTime(contact.lastMessageTime)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-slate-500 truncate">{contact.lastMessage || (contact.source === 'session' ? `Bot step: ${contact.step}` : 'No messages')}</p>
                      {contact.unreadCount > 0 && (
                        <span className="ml-2 shrink-0 min-w-[18px] h-[18px] px-1.5 inline-flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-semibold">
                          {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                        </span>
                      )}
                    </div>
                    {/* Lead status chip + AI status badge + assigned guide chip */}
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {/* 24h Window tab: time-left + replied/needs-reply so the admin
                          can free-message the right people before the window closes. */}
                      {leadTab === 'window' && (() => {
                        const ms = windowMsRemaining(contact, nowTick);
                        const replied = windowReplied(contact);
                        return (
                          <>
                            <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${windowUrgencyClass(ms)}`} title="Free-messaging window time left">
                              <Clock className="w-2.5 h-2.5" />
                              {fmtWindowLeft(ms)} left
                            </span>
                            <span
                              className={`flex items-center gap-0.5 text-[10px] font-medium ${replied ? 'text-emerald-600' : 'text-red-600'}`}
                              title={replied ? 'You have replied to their latest message' : 'Customer is waiting — free reply allowed now'}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full inline-block ${replied ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              {replied ? 'Replied' : 'Needs reply'}
                            </span>
                          </>
                        );
                      })()}
                      {(() => {
                        const ls = leadStatusOf(contact);
                        if (leadTab === 'window') return null;
                        if (!ls) return null;
                        const lc = LEAD_CONFIG[ls];
                        return (
                          <span className={`flex items-center gap-0.5 text-[10px] font-medium ${lc.text}`} title={lc.label}>
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${lc.dot}`} />
                            {lc.label}
                            {ls === 'follow_up' && contact.followUpAt && (
                              <span className="opacity-70">· {new Date(contact.followUpAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                            )}
                          </span>
                        );
                      })()}
                      {contact.aiEnabled === false ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                          Manual
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                          AI
                        </span>
                      )}
                      {contact.assignedGuideName && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full truncate max-w-[90px]">
                          {contact.assignedGuideName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ──────── RIGHT: Chat Area + Info Panel ──────── */}
        <div className={`flex-1 flex min-w-0 ${showMobileChat ? 'flex' : 'hidden sm:flex'}`}>

          {/* Chat column */}
          <div className="flex-1 flex flex-col min-w-0">
            {activePhone ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white shrink-0">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowMobileChat(false)} className="sm:hidden p-1.5 hover:bg-slate-100 rounded-lg mr-1 cursor-pointer">
                      <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">{getAvatar(activePhone, activeContact?.name)}</div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{activeContact?.name || activePhone}</h3>
                      <p className="text-[11px] text-slate-500">
                        {activeContact?.name ? activePhone : (activeContact?.source === 'chat' ? `${activeContact.messageCount} messages` : activeContact?.step ? `Bot step: ${activeContact.step}` : 'WhatsApp')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* 24h service-window badge */}
                    {windowState && (windowState.open ? (
                      <span
                        title={`Free-form messages allowed until ${new Date(windowState.expiresAt).toLocaleString()}`}
                        className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Window {Math.floor(windowState.hoursRemaining)}h {Math.floor((windowState.hoursRemaining % 1) * 60)}m
                      </span>
                    ) : (
                      <span
                        title="24h customer service window closed — template messages only"
                        className="hidden sm:flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full font-medium"
                      >
                        <Lock className="w-3.5 h-3.5" /> Template only
                      </span>
                    ))}
                    {/* AI status badge */}
                    {aiEnabled ? (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                        <Bot className="w-3.5 h-3.5" /> AI Active
                      </span>
                    ) : (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium">
                        <UserCheck className="w-3.5 h-3.5" /> Manual
                      </span>
                    )}
                    {/* Lead-status control (Needs Reply / Replied / Follow-up / Done + note) */}
                    <LeadStatusControl
                      status={activeContact?.leadStatus || 'needs_reply'}
                      followUpAt={activeContact?.followUpAt || null}
                      note={activeContact?.leadNote || ''}
                      onUpdate={updateLead}
                      busy={leadUpdating}
                    />
                    {/* Manual bot actions toggle */}
                    <button
                      onClick={() => setShowBotActions(p => !p)}
                      className={`p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors ${showBotActions ? 'bg-slate-100 text-primary-600' : 'text-slate-400'}`}
                      title="Send bot message (city list, treks, dates, booking link)"
                    >
                      <Bot className="w-4 h-4" />
                    </button>
                    {/* Info panel toggle */}
                    <button
                      onClick={() => setShowInfoPanel(p => !p)}
                      className={`p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors ${showInfoPanel ? 'bg-slate-100 text-primary-600' : 'text-slate-400'}`}
                      title="Conversation info"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button onClick={() => refetchMessages()} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer" title="Refresh">
                      <RefreshCw className={`w-4 h-4 text-slate-400 ${messagesLoading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Call button area — adapts to permission state */}
                    {(callState === 'idle' || callState === 'ringing-in') && (
                      <button
                        onClick={handleCallClick}
                        disabled={callState === 'ringing-in'}
                        className={`p-2 rounded-lg cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600`}
                        title={`Call ${activePhone}`}
                      >
                        <PhoneIcon className="w-4 h-4" />
                      </button>
                    )}
                    {callState === 'needs-permission' && (
                      <button
                        onClick={() => requestCallPermission(activePhone)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium border border-amber-200"
                        title="User has not granted call permission — click to send a permission request via WhatsApp"
                      >
                        <PhoneIcon className="w-3.5 h-3.5" />
                        Request Call Permission
                      </button>
                    )}
                    {callState === 'permission-requested' && (
                      <span
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-amber-600 text-xs font-medium bg-amber-50 border border-amber-200 cursor-default"
                        title="Waiting for customer to tap Allow in WhatsApp"
                      >
                        <PhoneIcon className="w-3.5 h-3.5" />
                        Permission Sent…
                      </span>
                    )}

                    <button className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"><MoreVertical className="w-4 h-4 text-slate-400" /></button>
                  </div>
                </div>

                {/* Active Call Bar — shown when a call is in progress */}
                {(callState === 'in-call' || callState === 'dialing') && (
                  <div className="shrink-0 flex items-center justify-between px-5 py-2.5 bg-emerald-600 text-white text-sm">
                    <div className="flex items-center gap-2.5">
                      <PhoneIcon className="w-4 h-4 animate-pulse" />
                      <span className="font-medium">
                        {callState === 'dialing' ? 'Connecting…' : `In call · ${formatCallDuration(callSeconds)}`}
                      </span>
                      <span className="text-emerald-200 text-xs">{activePhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMute}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${muted ? 'bg-white/20 text-white' : 'hover:bg-emerald-700 text-emerald-100'}`}
                        title={muted ? 'Unmute' : 'Mute'}
                      >
                        {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={terminateCall}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="End call"
                      >
                        <PhoneOff className="w-3.5 h-3.5" /> End Call
                      </button>
                    </div>
                  </div>
                )}

                {/* Permission-requested info banner */}
                {callState === 'permission-requested' && (
                  <div className="shrink-0 flex items-center gap-2.5 px-5 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
                    <PhoneIcon className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span>
                      Waiting for <strong>{activePhone}</strong> to approve the call permission in WhatsApp. Once they tap <em>Allow</em>, try calling again.
                    </span>
                  </div>
                )}

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 bg-linear-to-b from-slate-50 to-white relative"
                >
                  {/* Older-messages loading spinner — shown at top while fetching */}
                  {loadingOlder && (
                    <div className="flex justify-center py-3">
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    </div>
                  )}

                  {/* "No more history" indicator */}
                  {!hasMore && !messagesLoading && messages.length > 0 && (
                    <div className="flex justify-center py-2">
                      <span className="text-[10px] text-slate-300 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">Beginning of conversation</span>
                    </div>
                  )}

                  <div className="max-w-2xl mx-auto space-y-1">
                    {messagesLoading && messages.length === 0 ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-slate-300 animate-spin" /></div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12"><p className="text-sm text-slate-400">No messages yet. Send a message to start the conversation.</p></div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isOutbound = msg.direction === 'outbound';
                        const msgDate = formatDate(msg.createdAt);
                        const prevDate = idx > 0 ? formatDate(messages[idx - 1].createdAt) : null;
                        const showDate = msgDate && msgDate !== prevDate;

                        // Detect interactive type from raw payload
                        const interactiveType = msg.raw?.interactive?.type;
                        const isButtonReply = interactiveType === 'button_reply';
                        const isListReply = interactiveType === 'list_reply';

                        const live = msg.waMessageId ? statusUpdates[msg.waMessageId] : null;
                        const resolvedStatus = live?.deliveryStatus || msg.deliveryStatus;
                        const resolvedReason = live?.deliveryFailureReason || msg.deliveryFailureReason;
                        const isFailed = isOutbound && resolvedStatus === 'failed';

                        return (
                          <div key={msg._id || idx}>
                            {showDate && (
                              <div className="flex items-center justify-center my-4">
                                <span className="px-3 py-1 bg-white rounded-full text-[11px] font-medium text-slate-500 shadow-sm border border-slate-100">{msgDate}</span>
                              </div>
                            )}
                            <div className={`flex mb-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] overflow-hidden rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm
                                ${isOutbound
                                  ? 'bg-primary-600 text-white rounded-br-md'
                                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-md'
                                }`}
                              >
                                {/* Media messages — detect by messageType (DB field), raw.type, or mediaType MIME */}
                                {(() => {
                                  const mt = msg.messageType || msg.raw?.type || null;
                                  // Rich media: delegate to MediaMessage component
                                  if (['image','document','video','audio'].includes(mt) || msg.mediaType) {
                                    return (
                                      <MediaMessage
                                        raw={msg.raw}
                                        message={msg.message}
                                        messageType={msg.messageType}
                                        mediaUrl={msg.mediaUrl}
                                        mediaType={msg.mediaType}
                                        fileName={msg.fileName}
                                        isOutbound={isOutbound}
                                      />
                                    );
                                  }
                                  // Sticker
                                  if (mt === 'sticker') {
                                    return (
                                      <div className="flex items-center gap-2 text-xs opacity-70">
                                        <SmilePlus className="w-5 h-5 shrink-0" />
                                        <span>Sticker</span>
                                      </div>
                                    );
                                  }
                                  // Location
                                  if (mt === 'location') {
                                    let loc = {};
                                    try { loc = JSON.parse(msg.message || '{}'); } catch {}
                                    const mapUrl = `https://maps.google.com/?q=${loc.latitude},${loc.longitude}`;
                                    return (
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="shrink-0 text-base">📍</span>
                                        <div>
                                          {loc.name && <div className="font-medium">{loc.name}</div>}
                                          {loc.address && <div className="opacity-70">{loc.address}</div>}
                                          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                                            View on map
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  }
                                  // Contacts shared
                                  if (mt === 'contacts') {
                                    let contacts = [];
                                    try { contacts = JSON.parse(msg.message || '[]'); } catch {}
                                    return (
                                      <div className="flex items-center gap-2 text-xs opacity-80">
                                        <span className="shrink-0 text-base">👤</span>
                                        <span>{contacts.length > 0
                                          ? contacts.map(c => c?.name?.formatted_name || c?.name?.first_name || 'Contact').join(', ')
                                          : 'Shared contact'
                                        }</span>
                                      </div>
                                    );
                                  }
                                  // Reaction
                                  if (mt === 'reaction') {
                                    let r = {};
                                    try { r = JSON.parse(msg.message || '{}'); } catch {}
                                    return (
                                      <div className="flex items-center gap-1.5 text-xs opacity-70">
                                        <span className="text-base">{r.emoji || '👍'}</span>
                                        <span>Reacted to a message</span>
                                      </div>
                                    );
                                  }
                                  // System event (user changed number, etc.)
                                  if (mt === 'system') {
                                    let sys = {};
                                    try { sys = JSON.parse(msg.message || '{}'); } catch {}
                                    return (
                                      <div className="flex items-center gap-1.5 text-xs italic opacity-60">
                                        <Info className="w-3.5 h-3.5 shrink-0" />
                                        <span>{sys.body || 'System event'}</span>
                                      </div>
                                    );
                                  }
                                  // Unsupported / unknown
                                  if (mt === 'unsupported') {
                                    return (
                                      <div className="flex items-center gap-1.5 text-xs italic opacity-50">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span>Unsupported message type</span>
                                      </div>
                                    );
                                  }
                                  // Default: text / interactive
                                  return (
                                    <div style={{ whiteSpace: 'pre-line' }}>
                                      {parseWhatsAppText(msg.message)}
                                    </div>
                                  );
                                })()}

                                {/* If inbound is a button/list reply, show what they selected */}
                                {isButtonReply && msg.raw.interactive.button_reply && (
                                  <div className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium
                                    ${isOutbound ? 'bg-white/15 text-white/80' : 'bg-primary-50 text-primary-600'}`}>
                                    ↩ {msg.raw.interactive.button_reply.title}
                                  </div>
                                )}
                                {isListReply && msg.raw.interactive.list_reply && (
                                  <div className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium
                                    ${isOutbound ? 'bg-white/15 text-white/80' : 'bg-primary-50 text-primary-600'}`}>
                                    ☰ {msg.raw.interactive.list_reply.title}
                                    {msg.raw.interactive.list_reply.description && (
                                      <span className="opacity-60 ml-1">· {msg.raw.interactive.list_reply.description}</span>
                                    )}
                                  </div>
                                )}

                                {/* For outbound interactive messages: show buttons or list */}
                                {isOutbound && <InteractiveButtons raw={msg.raw} isOutbound={isOutbound} />}

                                {/* Timestamp + delivery status tick */}
                                <div className={`flex items-center justify-end gap-1 mt-1.5 ${isOutbound ? 'text-primary-200' : 'text-slate-400'}`}>
                                  <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                                  {isOutbound && <DeliveryTick status={resolvedStatus} failureReason={resolvedReason} />}
                                </div>
                              </div>
                            </div>

                            {/* Retry row — shown below failed outbound messages */}
                            {isFailed && (
                              <div className="flex justify-end mb-2 pr-1">
                                <div className="flex items-center gap-2">
                                  {resolvedReason && (
                                    <span className="text-[10px] text-red-400 max-w-[200px] truncate" title={resolvedReason}>{resolvedReason}</span>
                                  )}
                                  <button
                                    onClick={() => handleRetry(msg)}
                                    className="flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full transition-colors"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    Retry
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* "New messages" pill — shown when the user has scrolled up and new messages arrive */}
                  {showNewMsgPill && (
                    <div className="sticky bottom-4 flex justify-center pointer-events-none">
                      <button
                        className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-full shadow-lg transition-colors cursor-pointer"
                        onClick={() => {
                          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                          setShowNewMsgPill(false);
                          setIsNearBottom(true);
                        }}
                      >
                        New messages {'↓'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Replies */}
                <div className="px-3 sm:px-5 py-2 border-t border-slate-100 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:block text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Quick:</span>
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                      {quickReplies.map(qr => (
                        <button key={qr.label} onClick={() => setMessage(qr.label)} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer">
                          <qr.icon className="w-3 h-3" /> {qr.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* File Attachments Preview */}
                {attachedFiles.length > 0 && (
                  <div className="px-3 sm:px-5 pt-2.5 pb-1 bg-white border-t border-slate-100">
                    <div className="flex flex-wrap gap-2">
                      {attachedFiles.map((f, i) => {
                        const Icon = fileIcon(f);
                        const isImg = f.type?.startsWith('image/');
                        return (
                          <div key={i} className="relative group flex items-center gap-1.5 bg-slate-100 rounded-xl px-2.5 py-1.5 pr-7 max-w-[160px]">
                            {isImg ? (
                              <img src={URL.createObjectURL(f)} alt={f.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                            ) : (
                              <Icon className="w-5 h-5 text-slate-500 shrink-0" />
                            )}
                            <span className="text-xs text-slate-700 truncate">{f.name}</span>
                            <button
                              onClick={() => removeAttachment(i)}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full bg-slate-300 hover:bg-red-400 hover:text-white transition-colors cursor-pointer"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* File send error banner */}
                {filesSendError && (
                  <div className="px-3 sm:px-5 py-2 bg-red-50 border-t border-red-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-xs text-red-600 truncate">{filesSendError}</span>
                    </div>
                    <button
                      onClick={() => setFilesSendError('')}
                      className="shrink-0 p-1 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                )}

                {/* Manual Bot Actions Panel */}
                {showBotActions && (
                  <BotActionPanel
                    phone={activePhone}
                    windowOpen={!windowState || windowState.open}
                    toast={toast}
                    onClose={() => setShowBotActions(false)}
                    onSent={() => { setShowBotActions(false); refetchMessages(); refetchChats(); }}
                  />
                )}

                {/* Message Input */}
                <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-slate-100 bg-white shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {windowState && !windowState.open ? (
                    <div className="flex items-center justify-between gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center gap-2 text-sm text-red-700">
                        <Lock className="w-4 h-4 shrink-0" />
                        <span>
                          24h window closed
                          {windowState.lastInboundAt && (
                            <span className="text-red-500"> (last reply {new Date(windowState.lastInboundAt).toLocaleDateString()})</span>
                          )}
                          . Send an approved template instead.
                        </span>
                      </div>
                      <button
                        onClick={() => { setShowTemplatePicker(true); loadChatTemplates(); }}
                        className="btn-primary text-sm flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="w-4 h-4" /> Send template
                      </button>
                    </div>
                  ) : (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0 ${attachedFiles.length > 0 ? 'text-primary-600' : 'text-slate-400'}`}
                      title="Attach files"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <textarea
                      ref={messageInputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          attachedFiles.length > 0 ? handleSendFiles() : handleSend();
                        }
                      }}
                      placeholder={attachedFiles.length > 0 ? 'Add a caption (optional)…' : 'Type a message… (Shift+Enter for new line)'}
                      rows={1}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none max-h-32 overflow-y-auto leading-5"
                      disabled={sending || sendingFiles}
                    />
                    <button
                      onClick={attachedFiles.length > 0 ? handleSendFiles : handleSend}
                      disabled={(!message.trim() && attachedFiles.length === 0) || sending || sendingFiles}
                      className={`p-2.5 rounded-xl transition-all duration-200 shrink-0 cursor-pointer ${(message.trim() || attachedFiles.length > 0) && !sending && !sendingFiles ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md' : 'bg-slate-100 text-slate-300'}`}
                    >
                      {(sending || sendingFiles) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-400">Select a conversation</h3>
                  <p className="text-sm text-slate-400 mt-1">Choose a contact to start chatting</p>
                </div>
              </div>
            )}
          </div>

          {/* ──────── Info Panel (collapsible, desktop only) ──────── */}
          {activePhone && showInfoPanel && (
            <div className="w-64 shrink-0 border-l border-slate-100 bg-white flex-col overflow-y-auto hidden sm:flex">

              {/* Assigned Guide section */}
              <div className="p-4 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Assigned Guide</p>
                {assignedGuideId ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                        {assignedGuideName?.[0] || '?'}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{assignedGuideName}</span>
                    </div>
                    <button
                      onClick={handleUnassignGuide}
                      disabled={unassigning}
                      className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50 font-medium transition-colors"
                    >
                      {unassigning ? 'Removing…' : 'Remove Assignment'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">No guide assigned</p>
                    <select
                      value={selectedGuideId}
                      onChange={e => setSelectedGuideId(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      <option value="">Select guide...</option>
                      {staffUsers.map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignGuide}
                      disabled={!selectedGuideId || assigning}
                      className="w-full text-xs bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-1.5 font-semibold transition-colors"
                    >
                      {assigning ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                )}
              </div>

              {/* AI Control section */}
              <div className="p-4 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">AI Agent</p>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Bot Responses</p>
                    <p className={`text-xs font-medium ${aiEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {aiEnabled ? 'Active' : 'Disabled'}
                    </p>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={handleToggleAI}
                    disabled={toggling}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 cursor-pointer ${aiEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${aiEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {!aiEnabled && (
                  <p className="text-[11px] text-amber-600">Bot is silent. Reply manually using the chat input below.</p>
                )}
              </div>

              {/* Activity Log section */}
              <div className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Activity</p>
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-400">No activity yet</p>
                ) : (
                  <div className="space-y-2.5">
                    {logs.slice(0, 6).map(log => (
                      <div key={log.id} className="flex items-start gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          log.action === 'assigned' ? 'bg-blue-100' :
                          log.action === 'unassigned' ? 'bg-red-100' :
                          log.action === 'ai_enabled' ? 'bg-emerald-100' :
                          log.action === 'ai_disabled' ? 'bg-amber-100' : 'bg-slate-100'
                        }`}>
                          {log.action === 'assigned' && <UserPlus className="w-2.5 h-2.5 text-blue-600" />}
                          {log.action === 'unassigned' && <UserMinus className="w-2.5 h-2.5 text-red-500" />}
                          {log.action === 'ai_enabled' && <Bot className="w-2.5 h-2.5 text-emerald-600" />}
                          {log.action === 'ai_disabled' && <BotOff className="w-2.5 h-2.5 text-amber-600" />}
                          {log.action === 'guide_message' && <UserCheck className="w-2.5 h-2.5 text-slate-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-slate-700 leading-tight">
                            {log.action === 'assigned' && `Guide assigned${log.guideName ? `: ${log.guideName}` : ''}`}
                            {log.action === 'unassigned' && 'Guide removed'}
                            {log.action === 'ai_enabled' && 'AI turned on'}
                            {log.action === 'ai_disabled' && 'AI turned off'}
                            {log.action === 'guide_message' && 'Guide sent message'}
                          </p>
                          {log.performedByName && (
                            <p className="text-[10px] text-slate-400">by {log.performedByName}</p>
                          )}
                          <p className="text-[10px] text-slate-300">{formatTimeAgo(log.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ──────── New Message Modal ──────── */}
      {showNewMsg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewMsg(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                  <PenSquare className="w-4 h-4 text-primary-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">New Message</h2>
              </div>
              <button
                onClick={() => setShowNewMsg(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => { setNewPhone(e.target.value); setNewMsgError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && document.getElementById('new-msg-text')?.focus()}
                  placeholder="e.g. 919182748724"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">Include country code, no + or spaces (e.g. 91 for India)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Message
                </label>
                <textarea
                  id="new-msg-text"
                  value={newText}
                  onChange={(e) => { setNewText(e.target.value); setNewMsgError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendNew(); }}
                  placeholder="Type your message…"
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Press Ctrl+Enter to send</p>
              </div>

              {newMsgError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                  <span className="text-red-500 text-xs font-medium">{newMsgError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => { setShowNewMsg(false); setNewPhone('91'); setNewText(''); setNewMsgError(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNew}
                disabled={sending || !newPhone.trim() || !newText.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────── Template Picker Modal ──────── */}
      {showTemplatePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowTemplatePicker(false); setTmplDepartureId(''); } }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4 text-primary-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Send Template Message</h2>
              </div>
              <button
                onClick={() => { setShowTemplatePicker(false); setTmplDepartureId(''); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              <p className="text-xs text-slate-500">
                Sending to <span className="font-mono font-semibold text-slate-700">{activePhone}</span>.
                Templates work inside AND outside the 24h window.
              </p>

              {templatesError && (
                <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-red-600">{templatesError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Choose an APPROVED template
                </label>
                <select
                  value={pickedTemplate}
                  onChange={(e) => setPickedTemplate(e.target.value)}
                  disabled={templatesLoading}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="">{templatesLoading ? 'Loading…' : `Select a template (${templates.length} available)`}</option>
                  {templates.map((t) => (
                    <option key={`${t.name}::${t.language}`} value={`${t.name}::${t.language}`}>
                      {t.name} ({t.language}) — {t.category}
                    </option>
                  ))}
                </select>
              </div>

              {pickedTemplateObj && (
                <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-lg space-y-1">
                  <p className="font-semibold mb-1">Body preview:</p>
                  {pickedTemplateObj.components.map((c, idx) => (
                    <div key={idx}>
                      <span className="uppercase text-[10px] text-slate-400">{c.type}{c.format ? `/${c.format}` : ''}: </span>
                      <span className="font-mono">{c.text || (c.buttons && c.buttons.map((b) => b.text).join(' | ')) || JSON.stringify(c).slice(0, 100)}</span>
                    </div>
                  ))}
                </div>
              )}

              {pickedTemplateObj && chatDepartures.length > 0 && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
                  <label className="block text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    Auto-fill from departure (optional)
                  </label>
                  <select
                    value={tmplDepartureId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setTmplDepartureId(id);
                      const dep = chatDepartures.find((d) => d._id === id);
                      if (dep && TEMPLATE_DEPARTURE_MAP[pickedName]) {
                        setParamValues(applyDepartureToParams(pickedName, templateSpec, dep, paramValues));
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">— Select a departure to auto-fill —</option>
                    {chatDepartures.map((d) => {
                      const v = resolveDepartureValues(d);
                      const seats = Math.max(0, (d.capacity ?? 0) - (d.booked ?? 0));
                      return (
                        <option key={d._id} value={d._id}>
                          {`${d.trekName} — ${d.cityName || ''} — ${v.startDate} (${seats} seats left)`}
                        </option>
                      );
                    })}
                  </select>
                  {tmplDepartureObj && (
                    TEMPLATE_DEPARTURE_MAP[pickedName] ? (
                      <p className="text-[11px] text-emerald-700">
                        Auto-filled from this departure — edit any field below.
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        This template has no auto-map — use the + buttons on each field to insert this departure&apos;s values.
                      </p>
                    )
                  )}
                </div>
              )}

              {templateSpec && totalParamCount(templateSpec) > 0 && (
                <div className="space-y-3 p-3 border border-slate-200 rounded-lg">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Parameters ({totalParamCount(templateSpec)})
                  </p>
                  {templateSpec.headerParamCount > 0 &&
                    Array.from({ length: templateSpec.headerParamCount }, (_, i) => (
                      <div key={`h-${i}`}>
                        <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                          <label className="text-xs font-medium text-slate-700">Header {`{{${i + 1}}}`}</label>
                          <div className="flex flex-wrap gap-1">
                            {PERSONALIZATION_TOKENS.map((t) => (
                              <button
                                key={t.token}
                                type="button"
                                onClick={() => insertTokenChat('headerParams', i, t.token)}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-600 hover:bg-primary-100"
                              >
                                + {t.label}
                              </button>
                            ))}
                            {tmplDepartureObj && (() => {
                              const dv = resolveDepartureValues(tmplDepartureObj);
                              return (
                                <>
                                  <button type="button" onClick={() => setParamValueChat('headerParams', i, dv.trekName)} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">+ Trek</button>
                                  <button type="button" onClick={() => setParamValueChat('headerParams', i, dv.seatsAvailable)} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">+ Seats</button>
                                  <button type="button" onClick={() => setParamValueChat('headerParams', i, dv.startDate)} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">+ Date</button>
                                  <button type="button" onClick={() => setParamValueChat('headerParams', i, dv.price)} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">+ Price</button>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <input
                          value={paramValues.headerParams[i] || ''}
                          onChange={(e) => {
                            const next = [...paramValues.headerParams];
                            next[i] = e.target.value;
                            setParamValues({ ...paramValues, headerParams: next });
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                    ))}
                  {templateSpec.bodyParamCount > 0 &&
                    Array.from({ length: templateSpec.bodyParamCount }, (_, i) => (
                      <div key={`b-${i}`}>
                        <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                          <label className="text-xs font-medium text-slate-700">Body {`{{${i + 1}}}`}</label>
                          <div className="flex flex-wrap gap-1">
                            {PERSONALIZATION_TOKENS.map((t) => (
                              <button
                                key={t.token}
                                type="button"
                                onClick={() => insertTokenChat('bodyParams', i, t.token)}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-600 hover:bg-primary-100"
                              >
                                + {t.label}
                              </button>
                            ))}
                            {tmplDepartureObj && (() => {
                              const dv = resolveDepartureValues(tmplDepartureObj);
                              return (
                                <>
                                  <button type="button" onClick={() => setParamValueChat('bodyParams', i, dv.trekName)} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">+ Trek</button>
                                  <button type="button" onClick={() => setParamValueChat('bodyParams', i, dv.seatsAvailable)} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">+ Seats</button>
                                  <button type="button" onClick={() => setParamValueChat('bodyParams', i, dv.startDate)} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">+ Date</button>
                                  <button type="button" onClick={() => setParamValueChat('bodyParams', i, dv.price)} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">+ Price</button>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <input
                          value={paramValues.bodyParams[i] || ''}
                          onChange={(e) => {
                            const next = [...paramValues.bodyParams];
                            next[i] = e.target.value;
                            setParamValues({ ...paramValues, bodyParams: next });
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                    ))}
                  {templateSpec.buttonParams.map((b) =>
                    Array.from({ length: b.placeholderCount }, (_, i) => (
                      <div key={`btn-${b.index}-${i}`}>
                        <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                          <label className="text-xs font-medium text-slate-700">
                            Button #{b.index + 1} URL {`{{${i + 1}}}`}
                          </label>
                          {tmplDepartureObj && (
                            <button
                              type="button"
                              onClick={() => setButtonParamChat(b.index, i, resolveDepartureValues(tmplDepartureObj).bookUrlCode)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            >
                              + Book link
                            </button>
                          )}
                        </div>
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
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                        />
                      </div>
                    ))
                  )}
                  <p className="text-[11px] text-slate-400">
                    Insert a token to personalize per recipient: {PERSONALIZATION_TOKENS.map((t) => t.token).join(', ')}.
                  </p>
                </div>
              )}

              {pickedTemplateObj && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    {tmplDepartureObj
                      ? `Preview (using ${resolveDepartureValues(tmplDepartureObj).trekName} — actual name personalized per recipient)`
                      : 'Preview (sample data — actual values personalized per recipient)'}
                  </p>
                  <p className="text-sm text-slate-800 whitespace-pre-line">
                    {applySampleTokens(renderTemplateText(bodyTextOf(pickedTemplateObj.components), paramValues.bodyParams))}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => { setShowTemplatePicker(false); setTmplDepartureId(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={sendTemplate}
                disabled={sendingTemplate || !pickedTemplateObj}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {sendingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio sink for remote call audio */}
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {/* ──────── Incoming Call Modal ──────── */}
      {callState === 'ringing-in' && incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {/* Animated ring header */}
            <div className="bg-emerald-600 px-6 py-6 flex flex-col items-center text-white">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                  <PhoneIncoming className="w-9 h-9" />
                </div>
              </div>
              <p className="text-sm font-medium text-emerald-100 mb-1">Incoming WhatsApp Call</p>
              <h2 className="text-xl font-bold">
                {incomingCallerName || incomingCall.phone}
              </h2>
              {incomingCallerName && (
                <p className="text-sm text-emerald-200 mt-0.5">{incomingCall.phone}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex divide-x divide-slate-100">
              <button
                onClick={rejectCall}
                className="flex-1 flex flex-col items-center gap-2 py-5 hover:bg-red-50 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 bg-red-100 group-hover:bg-red-200 rounded-full flex items-center justify-center transition-colors">
                  <PhoneOff className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-sm font-semibold text-red-600">Decline</span>
              </button>
              <button
                onClick={answerCall}
                className="flex-1 flex flex-col items-center gap-2 py-5 hover:bg-emerald-50 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 bg-emerald-100 group-hover:bg-emerald-200 rounded-full flex items-center justify-center transition-colors">
                  <PhoneIncoming className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-emerald-700">Answer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Non-blocking call error toast */}
      {callError && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-red-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          <PhoneOff className="w-4 h-4 shrink-0" />
          <span>Call failed: {callError}</span>
        </div>
      )}

      {/* Transient toast (bot actions + general feedback) */}
      {toastMsg && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 text-white text-sm px-4 py-3 rounded-xl shadow-lg ${toastMsg.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toastMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}
    </div>
  );
}
