import toast from 'react-hot-toast';
import { getApiErrorMessage } from './apiError';

/**
 * Toast notifications - minimal, modern design.
 * Success: green accent
 * Error: red accent
 * Warning: amber accent (validation, etc.)
 */
export const showSuccess = (message) => toast.success(message);
export const showError = (messageOrError) => {
  let msg;
  if (typeof messageOrError === 'string') msg = messageOrError;
  else if (messageOrError?.userMessage) msg = messageOrError.userMessage;
  else if (typeof messageOrError === 'object' && messageOrError !== null) msg = getApiErrorMessage(messageOrError);
  toast.error(msg || 'Something went wrong.');
};
export const showWarning = (message) =>
  toast(message, {
    icon: '⚠️',
    style: {
      background: 'var(--color-surface)',
      color: 'var(--color-text)',
      border: '1px solid var(--color-warning)',
      borderRadius: 'var(--radius-md)',
    },
  });
