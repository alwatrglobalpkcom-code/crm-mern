import Spinner from './Spinner';

/**
 * Button with loading state - shows spinner and disables while loading.
 * Preserves all native button props.
 */
export default function LoadingButton({
  loading = false,
  loadingText = 'Loading...',
  children,
  disabled,
  className = '',
  ...props
}) {
  return (
    <button
      type={props.type || 'button'}
      disabled={disabled || loading}
      className={className}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Spinner size="sm" className="shrink-0" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
