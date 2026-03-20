import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './OverdueAlert.css';

export default function OverdueAlert({ notification, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 12000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="overdue-alert-overlay" onClick={onDismiss}>
      <div className="overdue-alert" onClick={e => e.stopPropagation()} role="alert">
        <div className="overdue-alert-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <h2>Date Late — Task Overdue</h2>
        <p className="overdue-message">{notification?.message}</p>
        <p className="overdue-hint">Email bhi bhej di gayi hai aapke registered email pe.</p>
        <div className="overdue-actions">
          <Link to="/tasks" className="overdue-btn primary" onClick={onDismiss}>View Tasks</Link>
          <button type="button" className="overdue-btn secondary" onClick={onDismiss}>Dismiss</button>
        </div>
        <button type="button" className="overdue-close" onClick={onDismiss} aria-label="Close">×</button>
      </div>
    </div>
  );
}
