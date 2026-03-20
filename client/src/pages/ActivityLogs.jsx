import { useState, useEffect } from 'react';
import api from '../services/api';
import PageLoader from '../components/PageLoader';
import TablePagination from '../components/TablePagination';
import './Table.css';

const ACTION_LABELS = { create: 'Created', update: 'Updated', delete: 'Deleted' };
const ENTITY_LABELS = { user: 'User', client: 'Client', task: 'Task', document: 'Document' };

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadLogs = (page, limit) => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (entity) params.set('entity', entity);
    if (action) params.set('action', action);
    if (searchDebounced.trim()) params.set('search', searchDebounced.trim());
    api.get(`/activity-logs?${params}`)
      .then(res => {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs(pagination.page, pagination.limit);
  }, [entity, action, searchDebounced, pagination.page, pagination.limit]);

  const handlePageChange = (p) => setPagination(prev => ({ ...prev, page: p }));
  const handlePageSizeChange = (limit) => setPagination(prev => ({ ...prev, limit, page: 1 }));

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && logs.length === 0) return <PageLoader message="Loading activity logs..." />;

  return (
    <div>
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
        <h1>Activity Logs</h1>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
          Track user actions across the system
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="search"
            placeholder="Search by user or details..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 min-w-[200px]"
            aria-label="Search activity logs"
          />
          <select
            value={entity}
            onChange={e => { setEntity(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">All entities</option>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={action}
            onChange={e => { setAction(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="!p-8 text-center text-slate-500 dark:text-slate-400">No activity logs yet</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log._id}>
                    <td className="text-slate-600 dark:text-slate-400 text-sm whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td>{log.userName}</td>
                    <td>
                      <span className={`badge ${log.action === 'create' ? 'badge-success' : log.action === 'delete' ? 'badge-warning' : 'badge-info'}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td>{ENTITY_LABELS[log.entity] || log.entity}</td>
                    <td className="text-slate-600 dark:text-slate-400">{log.entityLabel || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination.total > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <TablePagination
              total={pagination.total}
              page={pagination.page}
              pageSize={pagination.limit}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
