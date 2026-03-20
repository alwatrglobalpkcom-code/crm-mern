/**
 * Simple form validation utilities - no external libraries.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s+\-()]{7,20}$/;

export function required(value, fieldName = 'This field') {
  const trimmed = typeof value === 'string' ? value.trim() : value;
  if (trimmed === '' || trimmed == null || trimmed === undefined) {
    return `${fieldName} is required.`;
  }
  return null;
}

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return true; // optional field
  const trimmed = email.trim();
  if (trimmed === '') return true;
  return EMAIL_REGEX.test(trimmed) ? null : 'Please enter a valid email address.';
}

export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return true; // optional field
  const trimmed = phone.trim();
  if (trimmed === '') return true;
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length < 7) return 'Phone number must have at least 7 digits.';
  if (!PHONE_REGEX.test(trimmed)) return 'Please enter a valid phone number.';
  return null;
}

export function minLength(value, min, fieldName = 'This field') {
  if (!value) return null;
  const str = String(value);
  if (str.length < min) {
    return `${fieldName} must be at least ${min} characters.`;
  }
  return null;
}

/**
 * Validate form and return first error message or null.
 * @param {Object} rules - { fieldName: () => string|null }
 */
export function validateForm(rules) {
  for (const validate of Object.values(rules)) {
    const error = validate();
    if (error) return error;
  }
  return null;
}
