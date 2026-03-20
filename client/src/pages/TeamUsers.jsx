import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PageLoader from '../components/PageLoader';
import TablePagination from '../components/TablePagination';
import LoadingButton from '../components/LoadingButton';
import { showSuccess, showError } from '../utils/toast';
import './Table.css';

export default function TeamUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [unassignedAgents, setUnassignedAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');

  const loadTeam = () => api.get('/users/team').then(res => setUsers(res.data || [])).catch(() => setUsers([]));

  useEffect(() => {
    loadTeam().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (showAddModal) {
      api.get('/users/unassigned-agents').then(res => setUnassignedAgents(res.data || [])).catch(() => setUnassignedAgents([]));
      setSelectedAgentId('');
    }
  }, [showAddModal]);

  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!selectedAgentId) return;
    setAdding(true);
    try {
      await api.post('/users/team', { agentId: selectedAgentId });
      await loadTeam();
      setShowAddModal(false);
      showSuccess('Agent added to your team. They now have Chat access.');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to add agent');
    } finally {
      setAdding(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const term = search.trim().toLowerCase();
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term)
    );
  }, [users, search]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const handleRemove = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Remove this agent from your team?')) return;
    try {
      await api.delete(`/users/team/${id}`);
      setUsers(u => u.filter(x => x._id !== id));
      showSuccess('Agent removed from team.');
    } catch (e) {
      showError(e);
    }
  };

  if (loading) return <PageLoader message="Loading team..." />;

  return (
    <div>
      <div className="page-header" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1>Team Users</h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>Agents under your management — assign agents for Chat access</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Agent to Team
        </button>
      </div>
      <div className="search-row">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="search-input"
          aria-label="Search team agents"
        />
      </div>
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add Agent to Team</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Select an unassigned agent. They will get Chat access with you.</p>
            {unassignedAgents.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">No unassigned agents. Create agents in Users (Admin) and assign a manager, or agents will appear here if created without one.</p>
            ) : (
              <form onSubmit={handleAddAgent}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Agent</label>
                <select
                  value={selectedAgentId}
                  onChange={e => setSelectedAgentId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 mb-4"
                  required
                >
                  <option value="">Select agent...</option>
                  {unassignedAgents.map(a => (
                    <option key={a._id} value={a._id}>{a.name} ({a.email})</option>
                  ))}
                </select>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <LoadingButton type="submit" disabled={!selectedAgentId} loading={adding} loadingText="Adding...">
                    Add to Team
                  </LoadingButton>
                </div>
              </form>
            )}
            <button type="button" className="modal-close" onClick={() => setShowAddModal(false)} aria-label="Close">×</button>
          </div>
        </div>
      )}
      <div className="table-wrap">
        <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={3} className="!p-8 text-center text-slate-500 dark:text-slate-400">
                  {users.length === 0 ? 'No agents in your team' : `No agents match "${search}"`}
                </td>
              </tr>
            ) : (
              paginatedUsers.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <Link to={`/team-users/${u._id}`} className="btn-sm">Edit</Link>
                    <button onClick={() => handleRemove(u._id)} className="btn-sm btn-danger">Remove from Team</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        {filteredUsers.length > 0 && (
          <TablePagination
            total={filteredUsers.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        )}
      </div>
    </div>
  );
}
