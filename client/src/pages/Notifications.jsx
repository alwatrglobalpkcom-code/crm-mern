import { useState, useEffect } from 'react';
import api from '../services/api';
import PageLoader from '../components/PageLoader';
import { useNotifications } from '../context/NotificationContext';

export default function Notifications() {
  const { notifications, unreadCount, refresh } = useNotifications();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    };
    load();
  }, [refresh]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      await refresh();
    } catch (err) {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all', {});
      await refresh();
    } catch (err) {
      // ignore
    }
  };

  if (loading) return <PageLoader message="Loading notifications..." />;

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm font-semibold px-2.5 py-1 rounded-full bg-primary-500 text-white">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Deadline, overdue, task assigned — sab yahan</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button
            type="button"
            onClick={markAllRead}
            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors shrink-0"
          >
            Mark all read
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-16 text-center">
          <p className="text-slate-500 dark:text-slate-400">No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <div
              key={n._id}
              className={`flex items-center justify-between gap-4 p-5 rounded-2xl border transition-all duration-200 hover:shadow-md animate-slide-up ${
                n.read
                  ? 'bg-white dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                  : 'bg-primary-50/50 dark:bg-primary-500/5 border-l-4 border-l-primary-500 border-slate-200/60 dark:border-slate-700/60'
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{n.type}</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium">{n.message}</p>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              {!n.read && (
                <button
                  type="button"
                  onClick={() => markRead(n._id)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
