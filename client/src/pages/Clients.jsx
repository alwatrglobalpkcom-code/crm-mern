import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API_BASE } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingButton from '../components/LoadingButton';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import TablePagination from '../components/TablePagination';
import FormValidationMessage from '../components/FormValidationMessage';
import { required, isValidEmail, isValidPhone } from '../utils/validation';
import { showSuccess, showError, showWarning } from '../utils/toast';
import './Clients.css';

const initial = {
  clientName: '', companyName: '', country: '', ABN: '', TFN: '',
  email: '', phone: '', address: '', businessType: '', notes: ''
};

const downloadFile = async (docId, fileName) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/documents/${docId}/download`, { headers: { Authorization: `Bearer ${token}` } });
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

export default function Clients() {
  const { user } = useAuth();
  const { id: urlId } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initial);
  const [documents, setDocuments] = useState([]);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // cards | table
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [validationError, setValidationError] = useState('');

  const loadClients = () => {
    setLoading(true);
    api.get('/clients')
      .then(res => setClients(res.data || []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (urlId) {
      setEditingId(urlId);
      setShowForm(true);
      setTimeout(() => document.getElementById('client-edit-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      setEditingId(null);
      setShowForm(false);
    }
  }, [urlId]);

  useEffect(() => {
    if (editingId) {
      api.get(`/clients/${editingId}`).then(res => {
        const c = res.data;
        setForm({
          clientName: c.clientName || '', companyName: c.companyName || '', country: c.country || '',
          ABN: c.ABN || '', TFN: c.TFN || '', email: c.email || '', phone: c.phone || '',
          address: c.address || '', businessType: c.businessType || '', notes: c.notes || ''
        });
      }).catch(() => closeForm());
      api.get(`/documents?clientId=${editingId}`).then(res => setDocuments(res.data || [])).catch(() => []);
    } else if (showForm) {
      setForm(initial);
      setDocuments([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, showForm]);

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFiles([]);
    setValidationError('');
    if (urlId) navigate('/clients');
  };

  const handleAdd = () => {
    setForm(initial);
    setDocuments([]);
    setFiles([]);
    setEditingId(null);
    setValidationError('');
    setShowForm(true);
  };

  const handleEdit = (c) => {
    const id = typeof c._id === 'string' ? c._id : c._id?.toString?.() || '';
    if (id) navigate(`/clients/${id}/edit`);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    const err = required(form.clientName, 'Client name') || isValidEmail(form.email) || isValidPhone(form.phone);
    if (err) {
      setValidationError(err);
      showWarning(err);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        clientName: form.clientName, companyName: form.companyName, country: form.country || undefined,
        ABN: form.ABN, TFN: form.TFN, email: form.email, phone: form.phone,
        address: form.address, businessType: form.businessType, notes: form.notes
      };
      let clientId = editingId;
      if (editingId) {
        await api.put(`/clients/${editingId}`, payload);
      } else {
        const { data } = await api.post('/clients', payload);
        clientId = data._id;
      }
      if (files.length > 0) {
        setUploading(true);
        for (const file of files) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('clientId', clientId);
          await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
        setFiles([]);
        setUploading(false);
      }
      closeForm();
      loadClients();
      showSuccess(editingId ? 'Client updated successfully.' : 'Client added successfully.');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadMore = async (e) => {
    e.preventDefault();
    if (!editingId || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('clientId', editingId);
        await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setFiles([]);
      const { data } = await api.get(`/documents?clientId=${editingId}`);
      setDocuments(data || []);
    } catch (err) {
      showError(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments(d => d.filter(x => x._id !== docId));
    } catch (e) {
      showError(e);
    }
  };

  const handleDelete = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Delete this client? All related tasks and documents will be affected.')) return;
    try {
      await api.delete(`/clients/${id}`);
      setClients(c => c.filter(x => x._id !== id));
      if (editingId === id) closeForm();
      showSuccess('Client deleted.');
    } catch (e) {
      showError(e);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/clients/${id}/approve`);
      setClients(c => c.map(x => x._id === id ? { ...x, status: 'active' } : x));
      if (editingId === id) setForm(f => ({ ...f }));
      showSuccess('Client approved.');
    } catch (e) {
      showError(e);
    }
  };

  const toId = (v) => (v?._id ?? v)?.toString?.() || '';
  const idsMatch = (a, b) => toId(a) && toId(b) && toId(a) === toId(b);
  const canEdit = (c) => {
    if (!user) return false;
    const uid = toId(user._id);
    return user.role === 'admin' ||
      idsMatch(c.assignedManager, uid) ||
      idsMatch(c.assignedAgent, uid) ||
      idsMatch(c.createdBy, uid);
  };
  const canDelete = (c) => user?.role === 'admin' || idsMatch(c.assignedManager, user?._id);
  const canApprove = (c) => (user?.role === 'admin' || idsMatch(c.assignedManager, user?._id)) && c.status === 'pending_approval';

  const displayId = (c) => c.clientCode || String(c._id).slice(-8);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const term = search.trim().toLowerCase();
    return clients.filter(c =>
      (c.clientName || '').toLowerCase().includes(term) ||
      (c.companyName || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.status || '').toLowerCase().includes(term) ||
      (c.assignedAgent?.name || '').toLowerCase().includes(term)
    );
  }, [clients, search]);

  const paginatedClients = useMemo(() => {
    if (viewMode !== 'table') return filteredClients;
    const start = (tablePage - 1) * tablePageSize;
    return filteredClients.slice(start, start + tablePageSize);
  }, [filteredClients, viewMode, tablePage, tablePageSize]);

  if (loading) {
    return (
      <div className="clients-page">
        <div className="clients-header">
          <div>
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-600 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
          </div>
        </div>
        <SkeletonLoader variant="card" count={6} />
      </div>
    );
  }

  return (
    <div className="clients-page">
      <div className="clients-header">
        <div>
          <h1>Clients</h1>
          <p className="clients-subtitle">All clients — Add, Edit, Delete, Documents sab ek jagah</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button type="button" className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')}>Cards</button>
            <button type="button" className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>Table</button>
          </div>
          <button type="button" className="btn-primary" onClick={handleAdd}>+ Add Client</button>
        </div>
      </div>

      <div className="clients-search-row">
        <input
          type="search"
          placeholder="Search by name, company, email, status..."
          value={search}
          onChange={e => { setSearch(e.target.value); setTablePage(1); }}
          className="clients-search-input"
          aria-label="Search clients"
        />
      </div>

      <div className="flow-info">
        <strong>Flow:</strong> Add Client → Upload Documents → Manager Approve (if Agent added). Edit/Delete yahan se.
      </div>

      {showForm && (
        <div className="client-form-panel" id="client-edit-form">
          <h2>{editingId ? 'Edit Client' : 'Add Client'}</h2>
          <form onSubmit={handleSubmit} className="client-form">
            <FormValidationMessage error={validationError} onDismiss={() => setValidationError('')} />
            <div className="form-section">
              <h3>Client Information</h3>
              <div className="form-grid">
                <label>Client Name *</label>
                <input name="clientName" value={form.clientName} onChange={handleChange} required />
                <label>Company Name</label>
                <input name="companyName" value={form.companyName} onChange={handleChange} />
                <label>Country</label>
                <input name="country" value={form.country} onChange={handleChange} placeholder="e.g. Australia" />
                <label>ABN</label>
                <input name="ABN" value={form.ABN} onChange={handleChange} />
                <label>TFN</label>
                <input name="TFN" value={form.TFN} onChange={handleChange} />
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} />
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} />
                <label>Address</label>
                <input name="address" value={form.address} onChange={handleChange} />
                <label>Business Type</label>
                <input name="businessType" value={form.businessType} onChange={handleChange} />
              </div>
              <label>Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} />
            </div>
            <div className="form-section">
              <h3>Documents</h3>
              <input type="file" multiple onChange={e => setFiles(Array.from(e.target.files || []))} />
              {files.length > 0 && <span className="files-preview">{files.length} file(s) selected</span>}
              {editingId && documents.length > 0 && (
                <div className="existing-docs">
                  {documents.map(d => (
                    <div key={d._id} className="doc-item">
                      <button type="button" className="doc-link" onClick={() => downloadFile(d._id, d.fileName)}>{d.fileName}</button>
                      <span className="doc-meta">{new Date(d.uploadedAt || d.createdAt).toLocaleDateString()}</span>
                      <button type="button" onClick={() => handleDeleteDoc(d._id)} className="btn-sm btn-danger">Delete</button>
                    </div>
                  ))}
                </div>
              )}
              {editingId && files.length > 0 && (
                <LoadingButton type="button" onClick={handleUploadMore} loading={uploading} loadingText="Uploading..." className="btn-upload-more" />
              )}
            </div>
            <div className="form-actions">
              {editingId && canDelete(clients.find(c => c._id === editingId) || {}) && (
                <button type="button" onClick={() => handleDelete(editingId)} className="btn-delete">Delete Client</button>
              )}
              <div className="form-actions-right">
                <button type="button" onClick={closeForm}>Cancel</button>
              <LoadingButton
                type="submit"
                loading={saving || uploading}
                loadingText={saving ? 'Saving...' : uploading ? 'Uploading...' : 'Saving...'}
              >
                {editingId ? 'Update' : 'Save Client'}
              </LoadingButton>
              </div>
            </div>
          </form>
        </div>
      )}

      {clients.length === 0 && !showForm ? (
        <EmptyState message="No clients yet." buttonText="Add New" onClick={handleAdd} />
      ) : filteredClients.length === 0 ? (
        <div className="clients-empty-search">
          <p>No clients match &quot;{search}&quot;</p>
          <button type="button" onClick={() => setSearch('')} className="btn-sm">Clear search</button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="client-cards">
          {filteredClients.map(c => (
            <div key={c._id} className="client-card">
              <div className="card-id">{displayId(c)}</div>
              <h3>{c.clientName}</h3>
              <p className="card-company">{c.companyName || c.email || '-'}</p>
              <div className="card-meta">
                <span className={`badge ${c.status === 'pending_approval' ? 'badge-warning' : 'badge-success'}`}>
                  {c.status === 'pending_approval' ? 'Pending' : 'Active'}
                </span>
                <span className="card-agent">{c.assignedAgent?.name || '-'}</span>
              </div>
              <div className="card-actions">
                {canEdit(c) && <button type="button" onClick={() => handleEdit(c)} className="btn-sm">Edit</button>}
                {canApprove(c) && <button type="button" onClick={() => handleApprove(c._id)} className="btn-sm btn-success">Approve</button>}
                {canDelete(c) && <button type="button" onClick={() => handleDelete(c._id)} className="btn-sm btn-danger">Delete</button>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="client-table-wrap">
          <div className="client-table-scroll">
          <table className="client-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Company</th>
                <th>Email</th>
                <th>Agent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.map(c => (
                <tr key={c._id}>
                  <td><code className="client-id">{displayId(c)}</code></td>
                  <td>{c.clientName}</td>
                  <td>{c.companyName}</td>
                  <td>{c.email}</td>
                  <td>{c.assignedAgent?.name || '-'}</td>
                  <td>
                    <span className={`badge ${c.status === 'pending_approval' ? 'badge-warning' : 'badge-success'}`}>
                      {c.status === 'pending_approval' ? 'Pending' : 'Active'}
                    </span>
                  </td>
                  <td>
                    {canEdit(c) && <button type="button" onClick={() => handleEdit(c)} className="btn-sm">Edit</button>}
                    {canApprove(c) && <button type="button" onClick={() => handleApprove(c._id)} className="btn-sm btn-success">Approve</button>}
                    {canDelete(c) && <button type="button" onClick={() => handleDelete(c._id)} className="btn-sm btn-danger">Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {filteredClients.length > 0 && (
            <TablePagination
              total={filteredClients.length}
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
