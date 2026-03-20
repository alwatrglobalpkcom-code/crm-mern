import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import TablePagination from '../components/TablePagination';
import { showSuccess, showError } from '../utils/toast';
import './Tasks.css';

export default function Tasks() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const filterOverdue = searchParams.get('filter') === 'overdue';
  const [tasks, setTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards');
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [search, setSearch] = useState('');

  const loadTasks = () => {
    setLoading(true);
    const promises = [
      api.get('/tasks').then(res => setTasks(res.data || [])).catch(() => setTasks([])),
    ];
    if (user?.role === 'manager' || user?.role === 'admin') {
      promises.push(api.get('/tasks/pending-approval').then(res => setPendingTasks(res.data || [])).catch(() => setPendingTasks([])));
    }
    Promise.all(promises).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/tasks/${id}`, { status });
      setTasks(t => t.map(x => x._id === id ? data : x));
      showSuccess('Task status updated.');
    } catch (e) {
      showError(e.response?.data?.message || 'Failed');
    }
  };

  const handleApproveTask = async (id) => {
    try {
      const { data } = await api.post(`/tasks/${id}/approve`);
      setPendingTasks(p => p.filter(x => x._id !== id));
      setTasks(t => [data, ...t]);
      showSuccess('Task approved.');
    } catch (e) {
      showError(e.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(t => t.filter(x => x._id !== id));
      setPendingTasks(p => p.filter(x => x._id !== id));
      showSuccess('Task deleted.');
    } catch (e) {
      showError(e);
    }
  };

  const toId = (v) => (v?._id ?? v)?.toString?.() || '';
  const idsMatch = (a, b) => toId(a) && toId(b) && toId(a) === toId(b);
  const canDelete = (t) => {
    if (user?.role === 'admin') return true;
    if (idsMatch(t.createdBy, user?._id)) return true;
    if (user?.role === 'manager') {
      const agentId = toId(t.assignedAgent);
      return (user?.assignedAgents || []).some(a => idsMatch(a, agentId));
    }
    return false;
  };
  const canEditTask = (t) => {
    if (!user) return false;
    const uid = toId(user._id);
    return user.role === 'admin' ||
      user.role === 'manager' ||
      idsMatch(t.assignedAgent, uid) ||
      idsMatch(t.createdBy, uid);
  };

  const isOverdue = (t) => t.status !== 'Completed' && new Date(t.dueDate) < new Date();

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (statusFilter) list = list.filter(t => t.status === statusFilter);
    if (filterOverdue) list = list.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < new Date());
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(t =>
        (t.taskType || '').toLowerCase().includes(term) ||
        (t.description || '').toLowerCase().includes(term) ||
        (t.status || '').toLowerCase().includes(term) ||
        (t.client?.clientName || '').toLowerCase().includes(term) ||
        (t.client?.companyName || '').toLowerCase().includes(term) ||
        (t.assignedAgent?.name || '').toLowerCase().includes(term)
      );
    }
    return list;
  }, [tasks, statusFilter, filterOverdue, search]);

  const paginatedTasks = useMemo(() => {
    if (viewMode !== 'table') return filteredTasks;
    const start = (tablePage - 1) * tablePageSize;
    return filteredTasks.slice(start, start + tablePageSize);
  }, [filteredTasks, viewMode, tablePage, tablePageSize]);

  if (loading) {
    return (
      <div className="tasks-page">
        <div className="tasks-header">
          <div>
            <div className="h-8 w-40 bg-slate-200 dark:bg-slate-600 rounded animate-pulse mb-2" />
            <div className="h-4 w-56 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
          </div>
        </div>
        <SkeletonLoader variant="card" count={6} />
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <div>
          <h1>Tasks</h1>
          <p className="tasks-subtitle">Create, Edit, Delete — status update yahan se</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button type="button" className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')}>Cards</button>
            <button type="button" className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>Table</button>
          </div>
          <Link to="/tasks/new" className="btn-primary">+ Create Task</Link>
        </div>
      </div>

      <div className="tasks-search-row">
        <input
          type="search"
          placeholder="Search by task type, client, status, description..."
          value={search}
          onChange={e => { setSearch(e.target.value); setTablePage(1); }}
          className="tasks-search-input"
          aria-label="Search tasks"
        />
      </div>

      {(user?.role === 'manager' || user?.role === 'admin') && pendingTasks.length > 0 && (
        <div className="pending-section">
          <h2>Pending Approval ({pendingTasks.length})</h2>
          <div className="pending-cards">
            {pendingTasks.map(t => (
              <div key={t._id} className="task-card pending">
                <div className="task-client">{t.client?.clientName || t.client?.companyName}</div>
                <div className="task-type">{t.taskType}</div>
                <div className="task-meta">{t.assignedAgent?.name} • {new Date(t.dueDate).toLocaleDateString()}</div>
                <button type="button" onClick={() => handleApproveTask(t._id)} className="btn-sm btn-success">Approve</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="section-title">
        {(statusFilter || filterOverdue) ? 'Filtered Tasks' : 'All Tasks'}
        {statusFilter && <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 ml-2">status: {statusFilter}</span>}
        {filterOverdue && <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 ml-2">overdue</span>}
      </h2>

      {filteredTasks.length === 0 ? (
        <EmptyState message={tasks.length === 0 ? 'No tasks yet.' : 'No tasks match the filter.'} buttonText="Add New" to="/tasks/new" />
      ) : viewMode === 'cards' ? (
        <div className="task-cards">
          {filteredTasks.map(t => (
            <div key={t._id} className={`task-card ${isOverdue(t) ? 'overdue' : ''}`}>
              <div className="task-type">{t.taskType}</div>
              <h3>{t.client?.clientName || t.client?.companyName}</h3>
              <div className="task-meta">
                {t.assignedAgent?.name} • {new Date(t.dueDate).toLocaleDateString()}
              </div>
              <div className="task-status">
                <select value={t.status} onChange={e => updateStatus(t._id, e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="task-actions">
                {canEditTask(t) && <Link to={`/tasks/${t._id}/edit`} className="btn-sm">Edit</Link>}
                {canDelete(t) && <button type="button" onClick={() => handleDelete(t._id)} className="btn-sm btn-danger">Delete</button>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="task-table-wrap">
          <div className="task-table-scroll">
          <table className="task-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Due Date</th>
                <th>Agent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTasks.map(t => (
                <tr key={t._id} className={isOverdue(t) ? 'overdue' : ''}>
                  <td>{t.client?.clientName || t.client?.companyName}</td>
                  <td>{t.taskType}</td>
                  <td>{new Date(t.dueDate).toLocaleDateString()}</td>
                  <td>{t.assignedAgent?.name}</td>
                  <td>
                    <select value={t.status} onChange={e => updateStatus(t._id, e.target.value)}>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td>
                    {canEditTask(t) && <Link to={`/tasks/${t._id}/edit`} className="btn-sm">Edit</Link>}
                    {canDelete(t) && <button type="button" onClick={() => handleDelete(t._id)} className="btn-sm btn-danger">Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {filteredTasks.length > 0 && (
            <TablePagination
              total={filteredTasks.length}
              page={tablePage}
              pageSize={tablePageSize}
              onPageChange={setTablePage}
              onPageSizeChange={(s) => { setTablePageSize(s); setTablePage(1); }}
            />
          )}
        </div>
      )}
    </div>
  );
}
