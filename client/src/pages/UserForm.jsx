import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import LoadingButton from '../components/LoadingButton';
import PageLoader from '../components/PageLoader';
import FormValidationMessage from '../components/FormValidationMessage';
import { required, isValidEmail, minLength } from '../utils/validation';
import { showSuccess, showError, showWarning } from '../utils/toast';
import './Form.css';

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'agent', assignedManager: ''
  });
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(isEdit);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isEdit) return;
    api.get('/users').then(res => setManagers(res.data.filter(u => u.role === 'manager'))).catch(() => {});
  }, [isEdit]);

  useEffect(() => {
    if (isEdit && id) {
      setFormLoading(true);
      api.get(`/users/${id}`)
        .then(res => {
          const u = res.data;
          setForm({
            name: u.name || '',
            email: u.email || '',
            password: '',
            role: u.role || 'agent',
            assignedManager: String(u.assignedManager?._id || '')
          });
        })
        .catch(() => navigate('/users'))
        .finally(() => setFormLoading(false));
    } else {
      setFormLoading(false);
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    const err = required(form.name, 'Name') || isValidEmail(form.email) ||
      (isEdit ? (form.password ? minLength(form.password, 6, 'Password') : null) : required(form.password, 'Password') || minLength(form.password, 6, 'Password')) ||
      (form.role === 'agent' && !isEdit && !form.assignedManager ? 'Assigned Manager is required for agents (needed for Chat access)' : null);
    if (err) {
      setValidationError(err);
      showWarning(err);
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.assignedManager) payload.assignedManager = null;
      if (isEdit) {
        await api.put(`/users/${id}`, payload);
      } else {
        await api.post('/auth/register', payload);
      }
      navigate('/users');
      showSuccess(isEdit ? 'User updated.' : 'User created.');
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  if (formLoading) return <PageLoader message="Loading..." />;

  return (
    <div>
      <h1>{isEdit ? 'Edit User' : 'Add User'}</h1>
      <form onSubmit={handleSubmit} className="form-card">
        <FormValidationMessage error={validationError} onDismiss={() => setValidationError('')} />
        <label>Name *</label>
        <input name="name" value={form.name} onChange={handleChange} required />
        <label>Email *</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required disabled={isEdit} />
        {!isEdit && (
          <>
            <label>Password *</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required={!isEdit} minLength={6} />
          </>
        )}
        {isEdit && (
          <>
            <label>New Password (leave blank to keep)</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} minLength={6} />
          </>
        )}
        <label>Role *</label>
        <select name="role" value={form.role} onChange={handleChange} required>
          <option value="manager">Manager</option>
          <option value="agent">Agent</option>
        </select>
        {form.role === 'agent' && (
          <>
            <label>Assigned Manager * <span className="text-slate-500 font-normal">(required for Chat access)</span></label>
            <select name="assignedManager" value={String(form.assignedManager || '')} onChange={handleChange} required={!isEdit}>
              <option value="">Select a manager...</option>
              {managers.map(m => (
                <option key={m._id} value={String(m._id)}>{m.name}</option>
              ))}
            </select>
          </>
        )}
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/users')}>Cancel</button>
          <LoadingButton type="submit" loading={loading} loadingText="Saving...">
            Save
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
