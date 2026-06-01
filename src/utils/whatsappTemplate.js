/**
 * WhatsApp template helper — parses the `components` array returned by Meta
 * (via GET /api/chat/templates) into a placeholder spec the UI can render, and
 * builds the Meta-format `templateComponents` payload from filled values.
 *
 * Meta component shapes we recognise:
 *   { type: "HEADER", format: "TEXT", text: "Hi {{1}}" }
 *   { type: "BODY",   text: "Hi {{1}}, your trek is {{2}}" }
 *   { type: "FOOTER", text: "..." }                              (no params)
 *   { type: "BUTTONS", buttons: [{ type: "URL", url: ".../{{1}}" }, ...] }
 *
 * Returned spec:
 *   {
 *     headerParamCount: 0 | 1,
 *     bodyParamCount:   N,
 *     buttonParams: [{ index: 0, type: "URL", placeholderCount: 1 }, ...],
 *   }
 *
 * MVP scope: TEXT placeholders only. Media headers (IMAGE/VIDEO/DOCUMENT) and
 * copy-code buttons return placeholderCount=0 — they need a more elaborate UI
 * (URL upload, code generator) that we'll add later.
 */

const PLACEHOLDER_RE = /\{\{\d+\}\}/g;

function countPlaceholders(text) {
  if (!text) return 0;
  const matches = text.match(PLACEHOLDER_RE);
  return matches ? matches.length : 0;
}

export function parseTemplateSpec(components = []) {
  const spec = {
    headerParamCount: 0,
    bodyParamCount: 0,
    buttonParams: [],
    // Media header format when the HEADER is IMAGE/VIDEO/DOCUMENT, else null.
    // For these, a per-send media URL (sent by LINK) is required instead of text params.
    headerMediaFormat: null,
  };

  components.forEach((c) => {
    const type = (c.type || '').toUpperCase();

    if (type === 'HEADER') {
      const fmt = (c.format || 'TEXT').toUpperCase();
      if (fmt === 'TEXT') {
        spec.headerParamCount = countPlaceholders(c.text);
      } else if (fmt === 'IMAGE' || fmt === 'VIDEO' || fmt === 'DOCUMENT') {
        spec.headerMediaFormat = fmt;
      }
    } else if (type === 'BODY') {
      spec.bodyParamCount = countPlaceholders(c.text);
    } else if (type === 'BUTTONS') {
      const buttons = Array.isArray(c.buttons) ? c.buttons : [];
      buttons.forEach((b, idx) => {
        const btnType = (b.type || '').toUpperCase();
        if (btnType === 'URL') {
          const placeholderCount = countPlaceholders(b.url);
          if (placeholderCount > 0) {
            spec.buttonParams.push({ index: idx, type: 'URL', placeholderCount });
          }
        }
        // QUICK_REPLY, PHONE_NUMBER, COPY_CODE: no per-send parameters
      });
    }
  });

  return spec;
}

/**
 * Build the Meta-format `templateComponents` array from filled-in values.
 *
 * @param {object} spec    Output of parseTemplateSpec
 * @param {object} values  { headerParams: string[], bodyParams: string[], buttonParams: { [index]: string[] } }
 * @returns {Array}        Meta `template.components` array
 */
export function buildTemplateComponents(spec, values = {}) {
  const out = [];

  // Media header (IMAGE/VIDEO/DOCUMENT) — sent per-message by LINK.
  if (spec.headerMediaFormat) {
    const param = buildHeaderMediaParam(spec.headerMediaFormat, values.headerMedia);
    if (param) {
      out.push({ type: 'header', parameters: [param] });
    }
  } else if (spec.headerParamCount > 0) {
    out.push({
      type: 'header',
      parameters: Array.from({ length: spec.headerParamCount }, (_, i) => ({
        type: 'text',
        text: (values.headerParams?.[i] || '').toString(),
      })),
    });
  }

  if (spec.bodyParamCount > 0) {
    out.push({
      type: 'body',
      parameters: Array.from({ length: spec.bodyParamCount }, (_, i) => ({
        type: 'text',
        text: (values.bodyParams?.[i] || '').toString(),
      })),
    });
  }

  spec.buttonParams.forEach((b) => {
    const params = Array.from({ length: b.placeholderCount }, (_, i) => ({
      type: 'text',
      text: (values.buttonParams?.[b.index]?.[i] || '').toString(),
    }));
    out.push({
      type: 'button',
      sub_type: b.type.toLowerCase(),  // "url"
      index: String(b.index),
      parameters: params,
    });
  });

  return out;
}

/**
 * Build the WhatsApp send-shape header parameter for a media header.
 *
 * @param {'IMAGE'|'VIDEO'|'DOCUMENT'} format
 * @param {{ url?: string, filename?: string }} media
 * @returns {object|null}  e.g. { type:'image', image:{ link:<url> } }
 */
export function buildHeaderMediaParam(format, media = {}) {
  const link = (media?.url || '').toString().trim();
  if (!link) return null;
  const fmt = (format || '').toUpperCase();
  if (fmt === 'IMAGE') return { type: 'image', image: { link } };
  if (fmt === 'VIDEO') return { type: 'video', video: { link } };
  if (fmt === 'DOCUMENT') {
    const doc = { link };
    const filename = (media?.filename || '').toString().trim();
    if (filename) doc.filename = filename;
    return { type: 'document', document: doc };
  }
  return null;
}

/**
 * Convenience: total number of TEXT inputs the UI must render.
 * (Media header is counted separately via spec.headerMediaFormat.)
 */
export function totalParamCount(spec) {
  return spec.headerParamCount + spec.bodyParamCount +
    spec.buttonParams.reduce((sum, b) => sum + b.placeholderCount, 0);
}

/**
 * Pull the BODY text out of a Meta `components` array (for list previews).
 */
export function bodyTextOf(components = []) {
  const body = components.find((c) => (c.type || '').toUpperCase() === 'BODY');
  return body?.text || '';
}

/**
 * Distinct, sorted variable indices in a string, e.g. "Hi {{1}} {{2}} {{1}}" -> [1, 2].
 */
export function variableIndices(text) {
  if (!text) return [];
  const set = new Set();
  let m;
  const re = /\{\{(\d+)\}\}/g;
  while ((m = re.exec(text)) !== null) set.add(Number(m[1]));
  return Array.from(set).sort((a, b) => a - b);
}
