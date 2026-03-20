import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import LoadingButton from '../components/LoadingButton';
import PageLoader from '../components/PageLoader';
import FormValidationMessage from '../components/FormValidationMessage';
import { required, isValidEmail, minLength } from '../utils/validation';
import { showSuccess, showError, showWarning } from '../utils/toast';
import './Form.css';

export default function TeamUserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!id) {
      setFormLoading(false);
      navigate('/team-users');
      return;
    }
    setFormLoading(true);
    api.get(`/users/${id}`)
      .then(res => {
        const u = res.data;
        setForm({ name: u.name, email: u.email, password: '' });
      })
      .catch(() => navigate('/team-users'))
      .finally(() => setFormLoading(false));
  }, [id, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    const err = required(form.name, 'Name') || isValidEmail(form.email) ||
      (form.password ? minLength(form.password, 6, 'Password') : null);
    if (err) {
      setValidationError(err);
      showWarning(err);
      return;
    }
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email };
      if (form.password) payload.password = form.password;
      await api.put(`/users/${id}`, payload);
      navigate('/team-users');
      showSuccess('Team member updated.');
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  if (formLoading) return <PageLoader message="Loading..." />;

  return (
    <div>
      <h1>Edit Team Member</h1>
      <form onSubmit={handleSubmit} className="form-card">
        <FormValidationMessage error={validationError} onDismiss={() => setValidationError('')} />
        <label>Name *</label>
        <input name="name" value={form.name} onChange={handleChange} required />
        <label>Email *</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required />
        <label>New Password (leave blank to keep)</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} minLength={6} />
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/team-users')}>Cancel</button>
          <LoadingButton type="submit" loading={loading} loadingText="Saving...">
            Save
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
