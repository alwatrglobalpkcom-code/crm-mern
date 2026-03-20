/**
 * Reusable API error display - 401, 404, 500, network.
 * Shows user-friendly message and optional retry.
 */
import { getApiErrorMessage, isNetworkError, isNotFound, isServerError } from '../utils/apiError';

export default function ApiErrorDisplay({ error, onRetry, title = 'Something went wrong' }) {
  if (!error) return null;

  const msg = typeof error === 'string' ? error : getApiErrorMessage(error);
  const isNetwork = typeof error !== 'string' && isNetworkError(error);
  const is404 = typeof error !== 'string' && isNotFound(error);
  const is500 = typeof error !== 'string' && isServerError(error);

  const subMsg = isNetwork
    ? 'Check that the server is running and try again.'
    : is404
      ? 'The requested resource was not found.'
      : is500
        ? 'The server encountered an error. Please try again later.'
        : null;

  return (
    <div className="api-error-display bg-red-50/50 dark:bg-red-900/10 border border-red-200/60 dark:border-red-800/60 rounded-2xl p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 mb-2">{msg}</p>
      {subMsg && <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">{subMsg}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium text-sm transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
