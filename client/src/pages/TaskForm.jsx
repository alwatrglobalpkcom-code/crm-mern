import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingButton from '../components/LoadingButton';
import PageLoader from '../components/PageLoader';
import FormValidationMessage from '../components/FormValidationMessage';
import { required } from '../utils/validation';
import { showSuccess, showError, showWarning } from '../utils/toast';
import './Form.css';
import './TaskForm.css';

const TASK_TYPES = ['BAS', 'GST', 'Tax Return', 'Payroll'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function TaskForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;
  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);
  const [taskClient, setTaskClient] = useState(null); // for edit: ensure task's client is in list
  const [taskAgent, setTaskAgent] = useState(null); // for edit: ensure task's agent is in list
  const [form, setForm] = useState({
    client: '', taskType: 'BAS', description: '', dueDate: '', assignedAgent: '', priority: 'medium', amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/clients').then(res => {
        const list = res.data || [];
        setClients(list.filter(c => c.status === 'active'));
      }).catch(() => setClients([])),
      api.get('/users/agents').then(res => setAgents(res.data || [])).catch(() => setAgents([]))
    ]).finally(() => {
      if (!isEdit) setFormLoading(false);
    });
  }, [isEdit]);

  useEffect(() => {
    if (isEdit && id) {
      setFormLoading(true);
      api.get(`/tasks/${id}`)
        .then(res => {
          const t = res.data;
          const clientId = t.client?._id || t.client;
          const agentId = t.assignedAgent?._id || t.assignedAgent;
          setTaskClient(t.client ? { _id: clientId, clientName: t.client.clientName, companyName: t.client.companyName } : null);
          setTaskAgent(t.assignedAgent ? { _id: agentId, name: t.assignedAgent.name || t.assignedAgent.email } : null);
          setForm({
            client: clientId?.toString?.() || clientId,
            taskType: t.taskType || 'BAS',
            description: t.description || '',
            dueDate: t.dueDate ? (typeof t.dueDate === 'string' ? t.dueDate.slice(0, 10) : new Date(t.dueDate).toISOString().slice(0, 10)) : '',
            assignedAgent: agentId?.toString?.() || agentId,
            priority: t.priority || 'medium',
            amount: t.amount != null ? String(t.amount) : ''
          });
        })
        .catch(() => navigate('/tasks'))
        .finally(() => setFormLoading(false));
    } else {
      setTaskClient(null);
      setTaskAgent(null);
      if (!isEdit && user?.role === 'agent') {
        setForm(f => ({ ...f, assignedAgent: user._id }));
      }
      if (!isEdit) setFormLoading(false);
    }
  }, [id, isEdit, navigate, user?._id, user?.role]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    const err = required(form.client, 'Client') || required(form.dueDate, 'Due date') || required(form.assignedAgent, 'Assigned agent');
    if (err) {
      setValidationError(err);
      showWarning(err);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        client: form.client,
        taskType: form.taskType,
        description: form.description,
        dueDate: form.dueDate,
        assignedAgent: form.assignedAgent,
        priority: form.priority,
        amount: form.amount ? parseFloat(form.amount) : 0
      };
      if (isEdit && id) {
        await api.put(`/tasks/${id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      navigate('/tasks');
      showSuccess(isEdit ? 'Task updated.' : 'Task created.');
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const clientAgents = form.client && user?.role === 'manager'
    ? agents.filter(a => {
        const c = clients.find(x => x._id === form.client);
        return !c || c.assignedAgent?._id === a._id || c.assignedManager?._id === user?._id;
      })
    : agents;

  if (formLoading) return <PageLoader message="Loading form..." />;

  return (
    <div className="task-form-page">
      <h1>{isEdit ? 'Edit Task' : 'Create Task'}</h1>
      <p className="form-hint">Client, Type, Due Date, Assigned Agent — sab yahan</p>
      <form onSubmit={handleSubmit} className="form-card task-form-card">
        <FormValidationMessage error={validationError} onDismiss={() => setValidationError('')} />
        <label>Client *</label>
        <select name="client" value={String(form.client || '')} onChange={handleChange} required disabled={isEdit}>
          <option value="">Select client</option>
          {taskClient && !clients.some(c => String(c._id) === String(taskClient._id)) && (
            <option value={String(taskClient._id)}>{taskClient.clientName} - {taskClient.companyName}</option>
          )}
          {clients.map(c => (
            <option key={c._id} value={String(c._id)}>{c.clientName} - {c.companyName}</option>
          ))}
        </select>
        {!isEdit && user?.role === 'agent' && clients.length === 0 && (
          <p className="form-hint" style={{ marginTop: 8, color: '#b45309' }}>
            No approved clients yet. Add a client from Clients page and wait for manager approval.
          </p>
        )}
        <label>Task Type *</label>
        <select name="taskType" value={form.taskType} onChange={handleChange} required>
          {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <label>Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
        <label>Due Date *</label>
        <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} required />
        <label>Assigned Agent *</label>
        <select name="assignedAgent" value={String(form.assignedAgent || '')} onChange={handleChange} required>
          <option value="">Select agent</option>
          {taskAgent && !(clientAgents.length ? clientAgents : agents).some(a => String(a._id) === String(taskAgent._id)) && (
            <option value={String(taskAgent._id)}>{taskAgent.name}</option>
          )}
          {(clientAgents.length ? clientAgents : agents).map(a => (
            <option key={a._id} value={String(a._id)}>{a.name}</option>
          ))}
          {user?.role === 'agent' && !agents.find(a => String(a._id) === String(user._id)) && (
            <option value={String(user._id)}>{user.name}</option>
          )}
        </select>
        <label>Priority</label>
        <select name="priority" value={form.priority} onChange={handleChange}>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <label>Amount (AUD)</label>
        <input type="number" name="amount" min="0" step="0.01" value={form.amount} onChange={handleChange} placeholder="Revenue amount for completed tasks" />
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/tasks')}>Cancel</button>
          <LoadingButton type="submit" loading={loading} loadingText="Saving...">
            Save
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
