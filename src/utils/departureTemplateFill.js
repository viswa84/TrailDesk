/**
 * Departure → marketing-template auto-fill helper (pure, no React).
 *
 * On the Broadcast page the admin can pick a DEPARTURE and have a marketing
 * template's numbered placeholders ({{1}}, {{2}}, …) auto-filled from that
 * departure's data. Values are snapshotted into paramValues at build time —
 * there is no backend change; the admin can still edit any field afterwards.
 *
 * The per-template placeholder semantics mirror the seed templates in
 * WhatsApp_ChatBot_Trek/scripts/uploadTemplates.js.
 */

import { format, parseISO, differenceInDays } from 'date-fns';

// Format an ISO date string as 'dd MMM yyyy'. Falsy / unparseable → ''.
function fmt(d) {
  if (!d) return '';
  try {
    return format(parseISO(d), 'dd MMM yyyy');
  } catch {
    return '';
  }
}

/**
 * Resolve a departure document into the flat string values used to fill
 * template placeholders.
 *
 * @param {object} departure  A GET_DEPARTURES row
 * @returns {object}          Flat map of string values (all keys present)
 */
export function resolveDepartureValues(departure = {}) {
  return {
    trekName:       departure.trekName || '',
    cityName:       departure.cityName || departure.cityPickups?.[0]?.cityName || '',
    startDate:      fmt(departure.startDate),
    endDate:        fmt(departure.endDate),
    price:          departure.price != null ? String(departure.price) : '',
    capacity:       departure.capacity != null ? String(departure.capacity) : '',
    seatsAvailable: String(Math.max(0, (departure.capacity ?? 0) - (departure.booked ?? 0))),
    // Suffix appended to the template button's baked-in "https://api.trekops.in/book/"
    // prefix. The single-segment "/book/:uniqueId" route resolves straight to this
    // departure's booking page, so uniqueId (e.g. "DEP-0001") is the reliable value.
    // departureCode alone is NOT a valid standalone path (it needs a company/trek
    // prefix) and is often empty, so it's only a last-ditch fallback.
    bookUrlCode:    departure.uniqueId || departure.departureCode || '',
    meetingPoint:   departure.meetingPoint || '',
    guideName:      departure.guideName || '',
    pickupTime:     departure.pickupTime || '',
    daysToTrek:     daysUntil(departure.startDate),
    packingList:    fmtPackingList(departure.thingsToCarry),
  };
}

// Whole days from today until an ISO start date (never negative). Unparseable → ''.
function daysUntil(d) {
  if (!d) return '';
  try {
    const n = differenceInDays(parseISO(d), new Date());
    return String(Math.max(0, n));
  } catch {
    return '';
  }
}

// Format thingsToCarry as a bulleted packing list. thingsToCarry is stored as a
// comma-separated string (e.g. "Torch, 2L water, raincoat"); we also tolerate an
// array of strings defensively. Each non-empty item becomes a "• item" line.
function fmtPackingList(things) {
  if (Array.isArray(things)) {
    const items = things.map((t) => String(t || '').trim()).filter(Boolean);
    return items.map((t) => `• ${t}`).join('\n');
  }
  if (typeof things === 'string' && things.trim()) return things;
  return '';
}

/**
 * How each mapped template's placeholders are filled from a departure.
 * Keyed by template NAME. Shape:
 *   {
 *     body:   [ <entry>, <entry>, ... ],  // index = body placeholder index (0-based for {{1}})
 *     button: <entry> | null,             // fills the first URL button's first placeholder
 *   }
 * where <entry> is one of:
 *   { field: '<key from resolveDepartureValues>' }  — fill with that resolved value
 *   { token: '{{name}}' }                            — fill with a personalization token
 *   null / undefined                                 — leave the field manual
 *
 * Unmapped templates (e.g. referral_invite) are intentionally absent — they
 * stay fully manual.
 */
export const TEMPLATE_DEPARTURE_MAP = {
  fill_nudge_alert: {
    body: [{ field: 'seatsAvailable' }, { field: 'trekName' }, { field: 'startDate' }],
    button: { field: 'bookUrlCode' },
  },
  waitlist_seat_open: {
    body: [{ token: '{{name}}' }, { field: 'trekName' }, { field: 'startDate' }],
    button: { field: 'bookUrlCode' },
  },
  trek_day_of_message: {
    body: [{ token: '{{name}}' }, { field: 'trekName' }, { field: 'meetingPoint' }],
    button: null,
  },
  trek_review_request: {
    body: [{ token: '{{name}}' }, { field: 'trekName' }],
    button: null,
  },
  trek_completion_certificate: {
    body: [{ token: '{{name}}' }, { field: 'trekName' }],
    button: null,
  },
  trek_photos_ready: {
    body: [{ token: '{{name}}' }, { field: 'trekName' }],
    button: null,
  },
  trek_packing_list: {
    body: [
      { token: '{{name}}' },
      { field: 'trekName' },
      { field: 'daysToTrek' },
      { field: 'packingList' },
      { field: 'startDate' },
      { field: 'meetingPoint' },
    ],
    button: null,
  },
  trek_day_before_reminder: {
    body: [
      { token: '{{name}}' },
      { field: 'trekName' },
      { field: 'meetingPoint' },
      { field: 'guideName' },
      { field: 'pickupTime' },
    ],
    button: null,
  },
};

// Resolve a single map entry to its string value.
function entryValue(entry, values) {
  if (!entry) return '';
  return entry.field ? values[entry.field] : entry.token;
}

/**
 * Produce a NEW paramValues object with a departure's data applied per the
 * template's map. Does not mutate prevParamValues. Templates not in the map
 * return prevParamValues unchanged.
 *
 * @param {string} templateName    Selected template name
 * @param {object} spec            Output of parseTemplateSpec
 * @param {object} departure       A GET_DEPARTURES row
 * @param {object} prevParamValues Current { headerParams, bodyParams, buttonParams, headerMedia }
 * @returns {object}               New paramValues of the same shape
 */
export function applyDepartureToParams(templateName, spec, departure, prevParamValues) {
  const map = TEMPLATE_DEPARTURE_MAP[templateName];
  if (!map) return prevParamValues;

  const values = resolveDepartureValues(departure);

  // Deep-copy the bits we touch so callers' state stays untouched.
  const next = {
    headerParams: [...(prevParamValues.headerParams || [])],
    bodyParams: [...(prevParamValues.bodyParams || [])],
    buttonParams: Object.fromEntries(
      Object.entries(prevParamValues.buttonParams || {}).map(([k, v]) => [k, [...(v || [])]])
    ),
    headerMedia: { ...(prevParamValues.headerMedia || {}) },
  };

  const bodyCount = spec?.bodyParamCount || 0;
  (map.body || []).forEach((entry, i) => {
    if (i >= bodyCount) return;
    if (!entry) return; // leave manual
    next.bodyParams[i] = entryValue(entry, values);
  });

  if (map.button && spec?.buttonParams?.length > 0) {
    const btnIndex = spec.buttonParams[0].index;
    const existing = [...(next.buttonParams[btnIndex] || [])];
    existing[0] = entryValue(map.button, values);
    next.buttonParams[btnIndex] = existing;
  }

  return next;
}
