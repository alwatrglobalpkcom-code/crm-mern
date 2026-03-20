import { Link } from 'react-router-dom';

/**
 * Reusable empty state - clean, centered layout.
 * @param {string} message - Main message (e.g. "No clients yet")
 * @param {string} buttonText - CTA button text (e.g. "Add New")
 * @param {string} [to] - React Router path for Link (if provided, renders Link)
 * @param {function} [onClick] - Click handler (if provided, renders button)
 */
export default function EmptyState({ message, buttonText = 'Add New', to, onClick }) {
  const hasCta = (to || onClick) && buttonText;
  const Cta = hasCta
    ? to
      ? (
          <Link to={to} className="empty-state-btn">
            {buttonText}
          </Link>
        )
      : (
          <button type="button" onClick={onClick} className="empty-state-btn">
            {buttonText}
          </button>
        )
    : null;

  return (
    <div className="empty-state">
      <p>{message}</p>
      {Cta}
    </div>
  );
}
