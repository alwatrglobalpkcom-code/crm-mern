import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api, { API_BASE } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/PageLoader';
import LoadingButton from '../components/LoadingButton';
import FormValidationMessage from '../components/FormValidationMessage';
import { required, isValidEmail, isValidPhone } from '../utils/validation';
import { showSuccess, showError, showWarning } from '../utils/toast';
import './AgentWork.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const TASK_TYPES = ['BAS', 'GST', 'Tax Return', 'Payroll'];
const CLIENT_INIT = { clientName: '', companyName: '', country: '', ABN: '', TFN: '', email: '', phone: '', address: '', businessType: '', notes: '' };

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

export default function AgentWork() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const addClientRef = useRef(null);
  const [clients, setClients] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [showAddClient, setShowAddClient] = useState(true);
  const [clientForm, setClientForm] = useState(CLIENT_INIT);
  const [clientFiles, setClientFiles] = useState([]);
  const [clientSaving, setClientSaving] = useState(false);
  const [clientSuccess, setClientSuccess] = useState(null);
  const [clientValidationError, setClientValidationError] = useState('');
  const [taskValidationError, setTaskValidationError] = useState('');
  const [tasks, setTasks] = useState({});
  const [docs, setDocs] = useState({});
  const [taskForm, setTaskForm] = useState({ client: '', taskType: 'BAS', description: '', dueDate: '', priority: 'medium' });
  const [taskSaving, setTaskSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ clients: {}, tasks: {}, chatConversations: 0 });
  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data || [])).catch(() => []).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [cRes, tRes] = await Promise.all([
          api.get('/reports/clients'),
          api.get('/reports/tasks')
        ]);
        let chatConversations = 0;
        try {
          const chatRes = await api.get('/chat/conversations');
          chatConversations = chatRes.data?.length || 0;
        } catch (_) {}
        setStats({
          clients: cRes.data || {},
          tasks: tRes.data || {},
          chatConversations
        });
      } catch (_) {}
    };
    loadStats();
  }, []);

  useEffect(() => {
    if (expandedId) {
      const cid = String(expandedId);
      setTaskForm(f => ({ ...f, client: cid }));
      api.get(`/tasks?clientId=${cid}`).then(res => setTasks(t => ({ ...t, [cid]: res.data || [] }))).catch(() => {});
      api.get(`/documents?clientId=${cid}`).then(res => setDocs(d => ({ ...d, [cid]: res.data || [] }))).catch(() => {});
    }
  }, [expandedId]);

  useEffect(() => {
    if (location.state?.scrollToAddClient && addClientRef.current) {
      setShowAddClient(true);
      addClientRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.state]);

  const handleAddClient = async (e) => {
    e.preventDefault();
    setClientValidationError('');
    const err = required(clientForm.clientName, 'Client name') || isValidEmail(clientForm.email) || isValidPhone(clientForm.phone);
    if (err) {
      setClientValidationError(err);
      showWarning(err);
      return;
    }
    setClientSaving(true);
    try {
      const { data } = await api.post('/clients', clientForm);
      if (clientFiles.length > 0) {
        for (const file of clientFiles) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('clientId', data._id);
          await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
        setClientFiles([]);
      }
      setClients(c => [data, ...c]);
      setClientForm(CLIENT_INIT);
      setClientSuccess(`Client "${data.clientName}" added successfully. Pending manager approval.`);
      setTimeout(() => setClientSuccess(null), 4000);
      showSuccess('Client added. Pending manager approval.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add client';
      showError(msg);
    } finally {
      setClientSaving(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setTaskValidationError('');
    const err = required(taskForm.client, 'Client') || required(taskForm.dueDate, 'Due date');
    if (err) {
      setTaskValidationError(err);
      showWarning(err);
      return;
    }
    setTaskSaving(true);
    try {
      const payload = { ...taskForm, assignedAgent: user._id };
      const { data } = await api.post('/tasks', payload);
      setTasks(t => ({ ...t, [taskForm.client]: [...(t[taskForm.client] || []), data] }));
      setTaskForm({ client: taskForm.client, taskType: 'BAS', description: '', dueDate: '', priority: 'medium' });
      showSuccess('Task added.');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed');
    } finally {
      setTaskSaving(false);
    }
  };

  const updateTaskStatus = async (taskId, clientId, status) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status });
      const cid = String(clientId);
      setTasks(t => ({ ...t, [cid]: (t[cid] || []).map(x => String(x._id) === String(taskId) ? data : x) }));
      showSuccess('Task status updated.');
    } catch (e) {
      showError(e);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!expandedId || !file) {
      showWarning('Select a file');
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('clientId', expandedId);
    try {
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { data } = await api.get(`/documents?clientId=${expandedId}`);
      setDocs(d => ({ ...d, [expandedId]: data }));
      setFile(null);
      showSuccess('Document uploaded.');
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
      const cid = String(expandedId);
      setDocs(d => ({ ...d, [cid]: (d[cid] || []).filter(x => String(x._id) !== String(docId)) }));
    } catch (e) {
      showError(e);
    }
  };

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const term = clientSearch.trim().toLowerCase();
    return clients.filter(c =>
      (c.clientName || '').toLowerCase().includes(term) ||
      (c.companyName || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term)
    );
  }, [clients, clientSearch]);

  if (loading) return <PageLoader message="Loading..." />;

  const taskStatusData = {
    labels: ['Pending', 'In Progress', 'Completed', 'Overdue'],
    datasets: [{
      label: 'Tasks',
      data: [
        stats.tasks?.pending ?? 0,
        stats.tasks?.inProgress ?? 0,
        stats.tasks?.completed ?? 0,
        stats.tasks?.overdue ?? 0
      ],
      backgroundColor: ['#94a3b8', '#6366f1', '#10b981', '#ef4444'],
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 12, cornerRadius: 8 }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.15)' }, ticks: { font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } }
    }
  };

  return (
    <div className="agent-work">
      <div className="agent-header">
        <h1>Dashboard</h1>
        <p className="agent-subtitle">Add Client, Tasks, Documents — sab ek jagah. Sirf aapke clients aur tasks.</p>
      </div>

      <div className="agent-stats-grid">
        <Link to="/clients" className="agent-stat-card">
          <div className="agent-stat-icon bg-primary-500/10 text-primary-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <span className="agent-stat-label">Total Clients</span>
          <span className="agent-stat-value">{stats.clients?.totalClients ?? 0}</span>
        </Link>
        <Link to="/tasks" className="agent-stat-card">
          <div className="agent-stat-icon bg-primary-500/10 text-primary-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <span className="agent-stat-label">Total Tasks</span>
          <span className="agent-stat-value">{stats.tasks?.totalTasks ?? 0}</span>
        </Link>
        <Link to="/chat" className="agent-stat-card">
          <div className="agent-stat-icon bg-primary-500/10 text-primary-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <span className="agent-stat-label">Chat</span>
          <span className="agent-stat-value">{stats.chatConversations ?? 0}</span>
          <span className="agent-stat-sub">{stats.chatConversations === 0 ? 'No conversations' : stats.chatConversations === 1 ? '1 conversation' : `${stats.chatConversations} conversations`}</span>
        </Link>
        <Link to="/tasks?status=Pending" className="agent-stat-card">
          <div className="agent-stat-icon bg-amber-500/10 text-amber-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <span className="agent-stat-label">Pending</span>
          <span className="agent-stat-value">{stats.tasks?.pending ?? 0}</span>
        </Link>
        <Link to="/tasks?filter=overdue" className="agent-stat-card">
          <div className="agent-stat-icon bg-red-500/10 text-red-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <span className="agent-stat-label">Overdue</span>
          <span className="agent-stat-value">{stats.tasks?.overdue ?? 0}</span>
        </Link>
      </div>

      <div className="agent-chart-section">
        <h3 className="agent-chart-title">Tasks by Status</h3>
        <div className="agent-chart-wrap">
          <Bar data={taskStatusData} options={chartOptions} />
        </div>
      </div>

      <div className="flow-hint">
        <strong>Agent ka kaam:</strong> Client add karo → Card pe click karke expand karo → <strong>Edit Client</strong> se client edit karo → Task add karo / Status change karo / <strong>Edit</strong> se task edit karo. Sab working.
      </div>

      {clients.length > 0 && (
        <div className="agent-search-row">
          <input
            type="search"
            placeholder="Search clients by name, company, email..."
            value={clientSearch}
            onChange={e => setClientSearch(e.target.value)}
            className="agent-search-input"
            aria-label="Search clients"
          />
        </div>
      )}

      <section ref={addClientRef} id="add-client-section" className="add-client-section add-client-prominent">
        {clientSuccess && <p className="client-success-msg">{clientSuccess}</p>}
        <h2 className="add-client-heading">Add New Client</h2>
        <p className="add-client-desc">Client Name, Company, ABN, TFN, Email, Phone, Address, Business Type, Notes — sab yahan</p>
        <button type="button" className="toggle-add" onClick={() => setShowAddClient(!showAddClient)}>
          {showAddClient ? '−' : '+'} {showAddClient ? 'Hide Form' : 'Show Add Client Form'}
        </button>
        {showAddClient && (
          <form onSubmit={handleAddClient} className="agent-form client-form">
            <FormValidationMessage error={clientValidationError} onDismiss={() => setClientValidationError('')} />
            <div className="form-row">
              <label>Client Name *</label>
              <input name="clientName" value={clientForm.clientName} onChange={e => setClientForm({ ...clientForm, clientName: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Company Name</label>
              <input name="companyName" value={clientForm.companyName} onChange={e => setClientForm({ ...clientForm, companyName: e.target.value })} placeholder="Company Name" />
            </div>
            <div className="form-row">
              <label>Country</label>
              <input name="country" value={clientForm.country} onChange={e => setClientForm({ ...clientForm, country: e.target.value })} placeholder="e.g. Australia" />
            </div>
            <div className="form-row two-cols">
              <div>
                <label>Email</label>
                <input type="email" name="email" value={clientForm.email} onChange={e => setClientForm({ ...clientForm, email: e.target.value })} />
              </div>
              <div>
                <label>Phone</label>
                <input name="phone" value={clientForm.phone} onChange={e => setClientForm({ ...clientForm, phone: e.target.value })} />
              </div>
            </div>
            <div className="form-row two-cols">
              <div>
                <label>ABN</label>
                <input name="ABN" value={clientForm.ABN} onChange={e => setClientForm({ ...clientForm, ABN: e.target.value })} />
              </div>
              <div>
                <label>TFN</label>
                <input name="TFN" value={clientForm.TFN} onChange={e => setClientForm({ ...clientForm, TFN: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <label>Address</label>
              <input name="address" value={clientForm.address} onChange={e => setClientForm({ ...clientForm, address: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Business Type</label>
              <input name="businessType" value={clientForm.businessType} onChange={e => setClientForm({ ...clientForm, businessType: e.target.value })} placeholder="e.g. Sole Trader, Pty Ltd" />
            </div>
            <div className="form-row">
              <label>Notes</label>
              <textarea name="notes" value={clientForm.notes} onChange={e => setClientForm({ ...clientForm, notes: e.target.value })} rows={2} />
            </div>
            <div className="form-row">
              <label>Upload Documents</label>
              <input type="file" multiple onChange={e => setClientFiles(Array.from(e.target.files || []))} />
              {clientFiles.length > 0 && <span className="files-preview">{clientFiles.length} file(s)</span>}
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowAddClient(false)}>Cancel</button>
              <button type="submit" disabled={clientSaving}>{clientSaving ? 'Saving...' : 'Save Client'}</button>
            </div>
          </form>
        )}
      </section>

      <div className="client-cards">
        {clients.length > 0 && (
          <p className="cards-hint">👇 <strong>▶ Expand</strong> button pe click karo — Edit Client, Add/Edit Tasks, Upload Documents</p>
        )}
        {clients.length === 0 ? (
          <p className="empty-msg">No clients yet. Add a client above.</p>
        ) : filteredClients.length === 0 ? (
          <p className="empty-msg">No clients match &quot;{clientSearch}&quot;. <button type="button" onClick={() => setClientSearch('')} className="btn-sm" style={{ marginLeft: 8 }}>Clear search</button></p>
        ) : (
          filteredClients.map(c => {
            const cid = String(c._id);
            const isExpanded = String(expandedId) === cid;
            return (
            <div key={cid} className={`client-card ${isExpanded ? 'expanded' : ''}`}>
              <div className="card-header">
                <div className="card-header-content">
                  <div>
                    <h3>{c.clientName}</h3>
                    <span className="company">{c.companyName || c.email}</span>
                    {c.clientCode && <span className="client-code">{c.clientCode}</span>}
                  </div>
                  <span className={`badge ${c.status === 'pending_approval' ? 'badge-warning' : 'badge-success'}`}>
                    {c.status === 'pending_approval' ? 'Pending' : 'Active'}
                  </span>
                  <button
                    type="button"
                    className="expand-btn"
                    onClick={() => setExpandedId(isExpanded ? null : cid)}
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? '▼ Collapse' : '▶ Expand'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="card-body" onClick={(e) => e.stopPropagation()}>
                  <div className="panel-section">
                    <h4>Client Info <span className="edit-hint">— Edit Client yahan</span></h4>
                    <div className="client-info-display">
                      <p><strong>Company:</strong> {c.companyName || '—'}</p>
                      <p><strong>Email:</strong> {c.email || '—'}</p>
                      <p><strong>Phone:</strong> {c.phone || '—'}</p>
                      <p><strong>ABN:</strong> {c.ABN || '—'}</p>
                      <p><strong>Business Type:</strong> {c.businessType || '—'}</p>
                      <p><strong>Address:</strong> {c.address || '—'}</p>
                      <button type="button" className="btn-edit btn-edit-prominent" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/clients/${cid}/edit`); }}>✏️ Edit Client</button>
                    </div>
                  </div>
                  <div className="panel-section">
                    <h4>Tasks <span className="edit-hint">— Status change / Edit link</span></h4>
                    {c.status === 'pending_approval' && (
                      <p className="muted" style={{ marginBottom: 12 }}>Client pending approval — tasks add kar sakte ho jab Manager approve kare.</p>
                    )}
                    <form onSubmit={handleAddTask} className="inline-form">
                      {taskValidationError && <FormValidationMessage error={taskValidationError} onDismiss={() => setTaskValidationError('')} />}
                      <select name="taskType" value={taskForm.taskType} onChange={e => setTaskForm(f => ({ ...f, taskType: e.target.value }))}>
                        {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input type="date" name="dueDate" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} required />
                      <input type="text" name="description" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
                      <LoadingButton type="submit" disabled={c.status === 'pending_approval'} loading={taskSaving} loadingText="Adding...">
                        Add Task
                      </LoadingButton>
                    </form>
                    <div className="task-list">
                      {(tasks[cid] || []).length === 0 ? (
                        <p className="muted">No tasks yet</p>
                      ) : (
                        (tasks[cid] || []).map(t => (
                          <div key={t._id} className="task-row">
                            <span className="task-type">{t.taskType}</span>
                            <span className="task-due">{new Date(t.dueDate).toLocaleDateString()}</span>
                            <select value={t.status} onChange={e => updateTaskStatus(t._id, cid, e.target.value)}>
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                            {t._id && (
                              <button type="button" className="btn-sm btn-edit-task" style={{ marginLeft: 8 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/tasks/${String(t._id)}/edit`); }}>
                                ✏️ Edit Task
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="panel-section">
                    <h4>Documents</h4>
                    <form onSubmit={handleUpload} className="upload-inline">
                      <input type="file" onChange={e => setFile(e.target.files[0])} />
                      <LoadingButton type="submit" disabled={!file} loading={uploading} loadingText="Uploading...">
                        Upload
                      </LoadingButton>
                    </form>
                    <div className="doc-list">
                      {(docs[cid] || []).length === 0 ? (
                        <p className="muted">No documents yet</p>
                      ) : (
                        (docs[cid] || []).map(d => (
                          <div key={d._id} className="doc-row">
                            <button type="button" className="link-btn" onClick={() => downloadFile(d._id, d.fileName)}>{d.fileName}</button>
                            <span className="meta">{new Date(d.uploadedAt).toLocaleDateString()}</span>
                            <button type="button" onClick={() => handleDeleteDoc(d._id)} className="btn-sm btn-danger">Delete</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
          })
        )}
      </div>
    </div>
  );
}
