// Theme color helpers — applies the company's primary/secondary colors site-wide
// by setting CSS custom properties on :root. Used by AppLayout on profile load
// and by SettingsPage for live preview while the user picks colors.

// shadeHex: darkens a hex color by `amount` percentage points (0–100).
function shadeHex(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) - Math.round(2.55 * amount)));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) - Math.round(2.55 * amount)));
  const b = Math.max(0, Math.min(255, (n & 0xff) - Math.round(2.55 * amount)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// tintHex: lightens a hex color by mixing with white by `factor` (0–1).
function tintHex(hex, factor) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.round(((n >> 16) & 0xff) + (255 - ((n >> 16) & 0xff)) * factor);
  const g = Math.round(((n >> 8) & 0xff) + (255 - ((n >> 8) & 0xff)) * factor);
  const b = Math.round((n & 0xff) + (255 - (n & 0xff)) * factor);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const HEX6 = /^#[0-9a-fA-F]{6}$/;

export function applyThemeColors(primaryHex, secondaryHex) {
  const root = document.documentElement;
  if (primaryHex && HEX6.test(primaryHex)) {
    root.style.setProperty('--color-primary-500', primaryHex);
    root.style.setProperty('--color-primary-600', shadeHex(primaryHex, 8));
    root.style.setProperty('--color-primary-700', shadeHex(primaryHex, 18));
    root.style.setProperty('--color-primary-400', tintHex(primaryHex, 0.15));
    root.style.setProperty('--color-primary-300', tintHex(primaryHex, 0.35));
    root.style.setProperty('--color-primary-200', tintHex(primaryHex, 0.55));
    root.style.setProperty('--color-primary-100', tintHex(primaryHex, 0.75));
    root.style.setProperty('--color-primary-50',  tintHex(primaryHex, 0.88));
  }
  const sec = (secondaryHex && HEX6.test(secondaryHex)) ? secondaryHex : '#1f2937';
  root.style.setProperty('--color-secondary-500', sec);
  root.style.setProperty('--color-secondary-600', shadeHex(sec, 8));
  root.style.setProperty('--color-secondary-700', shadeHex(sec, 18));
  root.style.setProperty('--color-secondary-400', tintHex(sec, 0.15));
  root.style.setProperty('--color-secondary-300', tintHex(sec, 0.35));
  root.style.setProperty('--color-secondary-200', tintHex(sec, 0.55));
  root.style.setProperty('--color-secondary-100', tintHex(sec, 0.75));
  root.style.setProperty('--color-secondary-50',  tintHex(sec, 0.88));
}
