import { useState, useEffect, useRef, useCallback } from 'react';
import api, { API_BASE } from '../services/api';
import PageLoader from '../components/PageLoader';
import LoadingButton from '../components/LoadingButton';
import EmptyState from '../components/EmptyState';
import { showSuccess, showError, showWarning } from '../utils/toast';
import './Documents.css';

const downloadFile = async (docId, fileName) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/documents/${docId}/download`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Download failed');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'document';
  a.click();
  window.URL.revokeObjectURL(url);
};

const FILE_TYPES = [
  { value: '', label: 'All types' },
  { value: 'pdf', label: 'PDF' },
  { value: 'jpg', label: 'JPG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'gif', label: 'GIF' },
  { value: 'webp', label: 'WEBP' }
];

export default function Documents() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data || [])).catch(() => setClients([])).finally(() => setLoading(false));
  }, []);

  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    const params = new URLSearchParams();
    if (selectedClient) params.set('clientId', selectedClient);
    if (searchDebounced.trim()) params.set('search', searchDebounced.trim());
    if (fileType) params.set('fileType', fileType);
    try {
      const { data } = await api.get(`/documents?${params.toString()}`);
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setDocuments([]);
      if (err.response?.status !== 403 && !err?._silent) showError(err);
    } finally {
      setDocumentsLoading(false);
    }
  }, [selectedClient, searchDebounced, fileType]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedClient || !file) {
      showWarning('Select a client and choose a file');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('clientId', selectedClient);
    try {
      await api.post('/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          if (ev.total) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      });
      setFile(null);
      setUploadProgress(100);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showSuccess('Document uploaded.');
      loadDocuments();
    } catch (err) {
      showError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const handleDelete = async (docId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments(d => d.filter(x => x._id !== docId));
      showSuccess('Document deleted.');
    } catch (e) {
      showError(e);
    }
  };

  const handleDownload = async (d) => {
    try {
      await downloadFile(d._id, d.fileName);
      showSuccess('Download started.');
    } catch (e) {
      showError(e);
    }
  };

  if (loading) return <PageLoader message="Loading documents..." />;

  if (clients.length === 0) {
    return (
      <div className="documents-page">
        <div className="docs-header">
          <div>
            <h1>Documents</h1>
            <p className="docs-subtitle">Upload and manage client documents</p>
          </div>
        </div>
        <EmptyState message="No clients yet. Add a client first to upload documents." buttonText="Add Client" to="/clients" />
      </div>
    );
  }

  return (
    <div className="documents-page">
      <div className="docs-header">
        <div>
          <h1>Documents</h1>
          <p className="docs-subtitle">Select client, search, filter — Upload / Download / Delete</p>
        </div>
      </div>

      <div className="docs-content">
        <div className="docs-filters">
          <div className="docs-select-card">
            <label>Client</label>
            <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
              <option value="">All clients</option>
              {clients.map(c => (
                <option key={c._id} value={c._id}>{c.clientName} — {c.companyName || c.email}</option>
              ))}
            </select>
          </div>
          <div className="docs-search-card">
            <label>Search</label>
            <input
              type="text"
              placeholder="File name or client name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="docs-search-input"
            />
          </div>
          <div className="docs-type-card">
            <label>File type</label>
            <select value={fileType} onChange={e => setFileType(e.target.value)}>
              {FILE_TYPES.map(ft => (
                <option key={ft.value || 'all'} value={ft.value}>{ft.label}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedClient && (
          <div className="docs-upload-card">
            <h3>Upload Document</h3>
            <p className="docs-upload-hint">PDF, JPG, PNG, GIF, WEBP — max 2MB</p>
            <form onSubmit={handleUpload} className="upload-form">
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={e => setFile(e.target.files?.[0])} />
              {uploading && uploadProgress > 0 && (
                <div className="docs-upload-progress">
                  <div className="docs-upload-progress-track">
                    <div className="docs-upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="docs-upload-progress-text">{uploadProgress}%</span>
                </div>
              )}
              <LoadingButton type="submit" disabled={!file} loading={uploading} loadingText="Uploading...">
                Upload
              </LoadingButton>
            </form>
          </div>
        )}

        <div className="docs-list-card">
          <h3>{selectedClient ? 'Documents' : 'All Documents'}</h3>
          {documentsLoading ? (
            <div className="docs-loading-state">
              <div className="docs-spinner" />
              <span>Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="docs-empty-state">
              <p className="docs-empty-msg">
                {selectedClient
                  ? (searchDebounced || fileType ? 'No documents match your filters.' : 'No documents yet. Select a client and upload above.')
                  : (searchDebounced || fileType ? 'No documents match your filters.' : 'No documents yet. Select a client to upload.')}
              </p>
              {selectedClient && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="docs-empty-btn">
                  Upload Document
                </button>
              )}
            </div>
          ) : (
            <div className="doc-cards">
              {documents.map(d => (
                <div key={d._id} className="doc-card">
                  <div className="doc-card-top">
                    <button type="button" className="doc-name" onClick={() => handleDownload(d)}>
                      {d.fileName}
                    </button>
                    <button type="button" onClick={() => handleDelete(d._id)} className="btn-sm btn-danger">Delete</button>
                  </div>
                  <span className="doc-meta">
                    {d.client?.clientName || d.client?.companyName || '—'} · {new Date(d.uploadedAt || d.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
