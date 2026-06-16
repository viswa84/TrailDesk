/**
 * WhatsApp click-to-chat booking deep-link helper (pure, no React).
 *
 * Builds the wa.me link an admin shares in their WhatsApp groups. When a
 * customer taps it and sends the pre-filled message, the bot captures their
 * number/name and starts that departure's booking.
 *
 * The prefill text MUST stay byte-for-byte identical to what the backend bot
 * parser expects, so it can extract the departure code from the message:
 *
 *   `Hi! I'd like to book ${trekName} #${code}`
 *
 * where `code` is the departure's departureCode (falling back to uniqueId) and
 * the wa.me number is the company's businessWhatsappNumber with every non-digit
 * character stripped (e.g. "+91 63034 69572" -> "916303469572").
 */

/**
 * @param {Object}  args
 * @param {string} [args.businessWhatsappNumber] - company WhatsApp number (any format)
 * @param {string} [args.trekName]               - trek name shown in the prefill text
 * @param {string} [args.code]                   - departureCode || uniqueId
 * @returns {string} the canonical wa.me booking link, or '' if number/code missing
 */
export function buildWhatsAppBookingLink({ businessWhatsappNumber, trekName, code } = {}) {
  const digits = (businessWhatsappNumber || '').replace(/\D/g, '');
  if (!digits || !code) return '';
  const prefill = `Hi! I'd like to book ${trekName || ''} #${code}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(prefill)}`;
}
