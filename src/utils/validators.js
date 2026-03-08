/**
 * Form validation utilities for TrailDesk.
 * All validators return an error string or null if valid.
 */

export const v = {
  required: (val, label = 'This field') => {
    if (val === undefined || val === null || String(val).trim() === '') {
      return `${label} is required`;
    }
    return null;
  },

  phone: (val, label = 'Phone') => {
    const digits = String(val).replace(/\D/g, '');
    if (!digits) return `${label} is required`;
    if (digits.length !== 10) return `${label} must be exactly 10 digits`;
    return null;
  },

  email: (val, label = 'Email') => {
    if (!val || !String(val).trim()) return `${label} is required`;
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(String(val).trim())) return `Please enter a valid email address`;
    return null;
  },

  emailOptional: (val) => {
    if (!val || !String(val).trim()) return null; // optional, skip if empty
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(String(val).trim())) return `Please enter a valid email address`;
    return null;
  },

  number: (val, label = 'This field') => {
    if (val === undefined || val === null || String(val).trim() === '') {
      return `${label} is required`;
    }
    const num = Number(val);
    if (isNaN(num)) return `${label} must be a valid number`;
    if (num < 0) return `${label} must be a positive number`;
    return null;
  },

  positiveNumber: (val, label = 'This field') => {
    if (val === undefined || val === null || String(val).trim() === '') {
      return `${label} is required`;
    }
    const num = Number(val);
    if (isNaN(num)) return `${label} must be a valid number`;
    if (num <= 0) return `${label} must be greater than 0`;
    return null;
  },

  minLength: (val, min, label = 'This field') => {
    if (!val || String(val).length < min) {
      return `${label} must be at least ${min} characters`;
    }
    return null;
  },

  dateRequired: (val, label = 'Date') => {
    if (!val) return `${label} is required`;
    return null;
  },

  dateRange: (start, end) => {
    if (!start || !end) return null;
    if (new Date(end) < new Date(start)) {
      return 'End date must be on or after start date';
    }
    return null;
  },

  slug: (val, label = 'Slug') => {
    if (!val || !String(val).trim()) return `${label} is required`;
    if (!/^[a-z0-9-]+$/.test(val)) return `${label} may only contain lowercase letters, numbers, and hyphens`;
    return null;
  },
};

/**
 * Run multiple validation rules and collect errors.
 * @param {Object} rules — { fieldName: errorStringOrNull, ... }
 * @returns {{ valid: boolean, errors: Object }}
 *
 * Usage:
 *   const { valid, errors } = validateForm({
 *     name: v.required(form.name, 'Name'),
 *     phone: v.phone(form.phone),
 *     amount: v.positiveNumber(form.amount, 'Amount'),
 *   });
 *   if (!valid) { setErrors(errors); return; }
 */
export function validateForm(rules) {
  const errors = {};
  let valid = true;
  for (const [field, error] of Object.entries(rules)) {
    if (error) {
      errors[field] = error;
      valid = false;
    }
  }
  return { valid, errors };
}

/**
 * Restrict input to digits only, max length.
 * Use as: onChange={(e) => setForm({...form, phone: onlyDigits(e.target.value, 10) })}
 */
export function onlyDigits(val, maxLen = Infinity) {
  return String(val).replace(/\D/g, '').slice(0, maxLen);
}

/**
 * Restrict input to numeric (allows decimal).
 */
export function onlyNumeric(val) {
  return String(val).replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
}
