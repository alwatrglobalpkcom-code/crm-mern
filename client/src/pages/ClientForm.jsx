import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { API_BASE } from '../services/api';
import LoadingButton from '../components/LoadingButton';
import FormValidationMessage from '../components/FormValidationMessage';
import { required, isValidEmail, isValidPhone } from '../utils/validation';
import { showSuccess, showError, showWarning } from '../utils/toast';
import './Form.css';
import './ClientForm.css';

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

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isEdit) {
      api.get(`/clients/${id}`).then(res => {
        const c = res.data;
        setForm({
          clientName: c.clientName || '', companyName: c.companyName || '', country: c.country || '',
          ABN: c.ABN || '', TFN: c.TFN || '', email: c.email || '', phone: c.phone || '',
          address: c.address || '', businessType: c.businessType || '', notes: c.notes || ''
        });
      }).catch(() => navigate('/clients'));
      api.get(`/documents?clientId=${id}`).then(res => setDocuments(res.data || [])).catch(() => []);
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = required(form.clientName, 'Client name') || isValidEmail(form.email) || isValidPhone(form.phone);
    if (err) {
      showWarning(err);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        clientName: form.clientName, companyName: form.companyName, country: form.country || undefined,
        ABN: form.ABN, TFN: form.TFN, email: form.email, phone: form.phone,
        address: form.address, businessType: form.businessType, notes: form.notes
      };
      let clientId = id;
      if (isEdit) {
        await api.put(`/clients/${id}`, payload);
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
        if (isEdit) {
          const { data } = await api.get(`/documents?clientId=${id}`);
          setDocuments(data || []);
        } else {
          const { data } = await api.get(`/documents?clientId=${clientId}`);
          setDocuments(data || []);
        }
        setUploading(false);
      }
      navigate('/clients');
      showSuccess(isEdit ? 'Client updated.' : 'Client added.');
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadMore = async (e) => {
    e.preventDefault();
    if (!id || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('clientId', id);
        await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setFiles([]);
      const { data } = await api.get(`/documents?clientId=${id}`);
      setDocuments(data || []);
    } catch (err) {
      showError(err.response?.data?.message || 'Upload failed');
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
      showSuccess('Document deleted.');
    } catch (e) {
      showError(e);
    }
  };

  return (
    <div className="client-form-page">
      <h1>{isEdit ? 'Edit Client' : 'Add Client'}</h1>
      <p className="form-hint">Client Name, Company, ABN, TFN, Email, Phone, Address, Business Type, Notes — sab ek jagah. Documents bhi yahan upload karo.</p>

      <form onSubmit={handleSubmit} className="form-card">
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
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
        </div>

        <div className="form-section documents-section">
          <h3>Upload Documents</h3>
          <p className="section-desc">Client ke documents yahan upload karo — tax docs, invoices, etc.</p>
          <div className="upload-area">
            <label>Select files to upload</label>
            <input
              type="file"
              multiple
              onChange={e => setFiles(Array.from(e.target.files || []))}
            />
            {files.length > 0 && (
              <p className="files-preview">{files.length} file(s) selected</p>
            )}
          </div>
          {isEdit && documents.length > 0 && (
            <div className="existing-docs">
              <h4>Uploaded Documents</h4>
              <ul>
                {documents.map(d => (
                  <li key={d._id}>
                    <button type="button" className="doc-link" onClick={() => downloadFile(d._id, d.fileName)}>{d.fileName}</button>
                    <span className="doc-meta">{new Date(d.uploadedAt).toLocaleDateString()}</span>
                    <button type="button" onClick={() => handleDeleteDoc(d._id)} className="btn-sm btn-danger">Delete</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {isEdit && files.length > 0 && (
            <button type="button" onClick={handleUploadMore} disabled={uploading} className="btn-upload-more">
              {uploading ? 'Uploading...' : 'Upload More'}
            </button>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/clients')}>Cancel</button>
          <LoadingButton type="submit" loading={loading || uploading} loadingText={loading ? 'Saving...' : uploading ? 'Uploading...' : 'Saving...'}>
            {isEdit ? 'Update Client' : 'Save Client & Documents'}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
