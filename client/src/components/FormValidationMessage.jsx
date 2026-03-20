/**
 * Inline validation error message - visible below form or above submit.
 */
export default function FormValidationMessage({ error, onDismiss }) {
  if (!error) return null;
  return (
    <div className="form-validation-error" role="alert">
      <span>{error}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="form-validation-dismiss" aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
