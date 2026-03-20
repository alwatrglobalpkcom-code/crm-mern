import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PageLoader from '../components/PageLoader';
import TablePagination from '../components/TablePagination';
import { showSuccess, showError } from '../utils/toast';
import './Table.css';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data || [])).catch(() => setUsers([])).finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const term = search.trim().toLowerCase();
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term) ||
      (u.assignedManager?.name || '').toLowerCase().includes(term)
    );
  }, [users, search]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const handleDelete = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(u => u.filter(x => x._id !== id));
      showSuccess('User deleted.');
    } catch (e) {
      showError(e);
    }
  };

  if (loading) return <PageLoader message="Loading users..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        <Link to="/users/new" className="btn-primary">Add User</Link>
      </div>
      <div className="search-row">
        <input
          type="search"
          placeholder="Search by name, email, role..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="search-input"
          aria-label="Search users"
        />
      </div>
      <div className="table-wrap">
        <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Manager</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="!p-8 text-center text-slate-500 dark:text-slate-400">
                  {users.length === 0 ? 'No users yet' : `No users match "${search}"`}
                </td>
              </tr>
            ) : (
              paginatedUsers.map(u => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.assignedManager?.name || '-'}</td>
                <td>
                  <Link to={`/users/${u._id}/edit`} className="btn-sm">Edit</Link>
                  {u.role !== 'admin' && (
                    <button onClick={() => handleDelete(u._id)} className="btn-sm btn-danger">Delete</button>
                  )}
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
