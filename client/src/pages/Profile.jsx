import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingButton from '../components/LoadingButton';
import FormValidationMessage from '../components/FormValidationMessage';
import { required, isValidEmail, isValidPhone, minLength } from '../utils/validation';
import { showSuccess, showError, showWarning } from '../utils/toast';
import './Profile.css';

const ROLE_PERMISSIONS = {
  admin: [
    'Create / Edit / Delete Users (Manager, Agent)',
    'View all clients',
    'Edit or delete any client',
    'Assign managers and agents',
    'Manage documents',
    'Create and assign tasks',
    'Set system settings',
    'View reports',
    'Manage notifications',
    'Monitor all activities'
  ],
  manager: [
    'View clients under management',
    'Edit client information',
    'Upload client documents',
    'Assign tasks to agents',
    'Set task deadlines',
    'Monitor task progress',
    'Approve clients and tasks',
    'Receive deadline notifications',
    'View reports',
    'Manage team (Team Users)',
    'Chat with agents'
  ],
  agent: [
    'Add new clients',
    'View assigned clients',
    'Upload client documents',
    'Update client information',
    'Create tasks for clients',
    'Update task status (Pending / In Progress / Completed)',
    'Receive deadline notifications',
    'View upcoming deadlines',
    'Chat with manager'
  ]
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', password: '',
    phone: user?.phone || '', address: user?.address || '', designation: user?.designation || ''
  });
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (user && !editing) {
      setForm({ name: user.name || '', email: user.email || '', password: '', phone: user.phone || '', address: user.address || '', designation: user.designation || '' });
    }
  }, [user, editing]);

  const handleSave = async (e) => {
    e.preventDefault();
    setValidationError('');
    const err = required(form.name, 'Name') || isValidEmail(form.email) ||
      (form.phone ? isValidPhone(form.phone) : null) || (form.password ? minLength(form.password, 6, 'Password') : null);
    if (err) {
      setValidationError(err);
      showWarning(err);
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone, address: form.address, designation: form.designation };
      if (form.password) payload.password = form.password;
      const { data } = await api.put('/auth/me', payload);
      setUser(data);
      setEditing(false);
      setForm(f => ({ ...f, password: '' }));
      showSuccess('Profile updated.');
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div>
            <h2>{user?.name}</h2>
            <p className="email">{user?.email}</p>
            <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
          </div>
        </div>
        <div className="profile-details">
          {(user?.phone || user?.address || user?.designation) && (
            <>
              <h3>Contact & Details</h3>
              <p className="role-desc">
                {user?.phone && <><strong>Phone:</strong> {user.phone}<br /></>}
                {user?.address && <><strong>Address:</strong> {user.address}<br /></>}
                {user?.designation && <><strong>Designation:</strong> {user.designation}</>}
              </p>
            </>
          )}
          {user?.role === 'agent' && user?.assignedManager && (
            <>
              <h3>Assigned Manager</h3>
              <p className="role-desc">{user.assignedManager.name} ({user.assignedManager.email})</p>
            </>
          )}
          {user?.role === 'manager' && user?.assignedAgents?.length > 0 && (
            <>
              <h3>Assigned Agents</h3>
              <p className="role-desc">
                {user.assignedAgents.map(a => a.name).join(', ')}
              </p>
            </>
          )}
          <h3>Role Details</h3>
          <p className="role-desc">
            {user?.role === 'admin' && 'Full system control. Manage users, clients, tasks, and settings.'}
            {user?.role === 'manager' && 'Supervise agents and monitor client work. Approve clients and tasks.'}
            {user?.role === 'agent' && 'Perform accounting tasks. Add clients, create tasks, update status.'}
          </p>
          <h3>Permissions</h3>
          <ul className="permissions-list">
            {(ROLE_PERMISSIONS[(user?.role || '').toLowerCase()] || []).map((perm, i) => (
              <li key={i}>{perm}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="profile-edit-section">
        <h3>Update Profile</h3>
        {!editing ? (
          <button type="button" className="btn-primary" onClick={() => { setEditing(true); setForm({ name: user?.name || '', email: user?.email || '', password: '', phone: user?.phone || '', address: user?.address || '', designation: user?.designation || '' }); }}>Edit Profile</button>
        ) : (
          <form onSubmit={handleSave} className="profile-form">
            <FormValidationMessage error={validationError} onDismiss={() => setValidationError('')} />
            <label>Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <label>Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            <label>Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
            <label>Address</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Address" />
            <label>Designation</label>
            <input value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="e.g. Senior Accountant" />
            <label>New Password (leave blank to keep)</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={6} />
            <div className="form-actions">
              <button type="button" onClick={() => setEditing(false)}>Cancel</button>
              <LoadingButton type="submit" loading={saving} loadingText="Saving...">
                Save
              </LoadingButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
