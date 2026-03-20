/**
 * Centralized API error handling.
 * Extracts user-friendly messages and identifies error types.
 */

const NETWORK_MSG = 'Server unreachable. Ensure the backend is running.';
const UNAUTHORIZED_MSG = 'Session expired. Please log in again.';
const FORBIDDEN_MSG = 'You don\'t have permission for this action.';
const NOT_FOUND_MSG = 'The requested resource was not found.';
const SERVER_MSG = 'Server error. Please try again later.';
const DEFAULT_MSG = 'Something went wrong. Please try again.';

/**
 * Get a user-friendly error message from an API error.
 * @param {Error} err - Axios error or generic error
 * @param {Object} options - { defaultMsg, networkMsg }
 * @returns {string}
 */
export function getApiErrorMessage(err, options = {}) {
  const { defaultMsg = DEFAULT_MSG, networkMsg = NETWORK_MSG } = options;
  if (!err) return defaultMsg;

  if (err.response) {
    const status = err.response.status;
    const serverMsg = err.response?.data?.message;
    if (status === 401) return UNAUTHORIZED_MSG;
    if (status === 403) return serverMsg || FORBIDDEN_MSG;
    if (status === 404) return serverMsg || NOT_FOUND_MSG;
    if (status >= 500) return serverMsg || SERVER_MSG;
    if (status >= 400) return serverMsg || defaultMsg;
  }

  if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
    return networkMsg;
  }

  if (err.message && typeof err.message === 'string') {
    return err.message;
  }

  return defaultMsg;
}

/**
 * Check if error is a network/connection failure.
 */
export function isNetworkError(err) {
  return !err?.response && (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network'));
}

/**
 * Check if error is 401 (unauthorized).
 */
export function isUnauthorized(err) {
  return err?.response?.status === 401;
}

/**
 * Check if error is 404.
 */
export function isNotFound(err) {
  return err?.response?.status === 404;
}

/**
 * Check if error is 5xx server error.
 */
export function isServerError(err) {
  const status = err?.response?.status;
  return status >= 500 && status < 600;
}

/**
 * Check if error should be treated as "silent" (e.g. background polling).
 * Callers can pass config.silent = true to avoid toasts.
 */
export function shouldSuppressError(err, config) {
  return config?.silent === true;
}
