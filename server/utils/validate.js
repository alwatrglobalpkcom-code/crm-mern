/**
 * Simple validation utilities - no external libraries.
 * Throws ValidationError with message on validation failure.
 */

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s+\-()]{7,20}$/;

function required(value, fieldName) {
  const v = typeof value === 'string' ? value.trim() : value;
  if (v === '' || v == null || v === undefined) {
    throw new ValidationError(`${fieldName} is required.`);
  }
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return;
  const trimmed = email.trim();
  if (trimmed === '') return;
  if (!EMAIL_REGEX.test(trimmed)) {
    throw new ValidationError('Please enter a valid email address.');
  }
}

function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return;
  const trimmed = phone.trim();
  if (trimmed === '') return;
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length < 7) {
    throw new ValidationError('Phone number must have at least 7 digits.');
  }
  if (!PHONE_REGEX.test(trimmed)) {
    throw new ValidationError('Please enter a valid phone number.');
  }
}

function minLength(value, min, fieldName) {
  if (!value) return;
  const str = String(value);
  if (str.length < min) {
    throw new ValidationError(`${fieldName} must be at least ${min} characters.`);
  }
}

function isObjectId(value, fieldName) {
  if (!value) return;
  const str = String(value);
  if (!/^[a-fA-F0-9]{24}$/.test(str)) {
    throw new ValidationError(`Invalid ${fieldName}.`);
  }
}

function isValidDate(value, fieldName) {
  if (!value) return;
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new ValidationError(`Invalid ${fieldName}.`);
  }
}

module.exports = {
  ValidationError,
  required,
  isValidEmail,
  isValidPhone,
  minLength,
  isObjectId,
  isValidDate
};
