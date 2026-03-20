import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import PageLoader from '../components/PageLoader';
import ApiErrorDisplay from '../components/ApiErrorDisplay';
import { showError } from '../utils/toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const StatIcons = {
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  building: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  tasks: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  alert: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  clipboard: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  chat: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
};

const StatCard = ({ to, iconKey, label, value, variant = 'default', sub }) => (
  <Link
    to={to || '#'}
    className={`
      group relative overflow-hidden rounded-2xl p-6
      transition-all duration-300 ease-out
      bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60
      hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1 hover:border-primary-500/30
      ${!to ? 'pointer-events-none' : 'cursor-pointer'}
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 ${
      variant === 'overdue' ? 'bg-red-500/10 text-red-500' :
      variant === 'pending' ? 'bg-amber-500/10 text-amber-500' :
      'bg-primary-500/10 text-primary-500'
    }`}>
      {StatIcons[iconKey] || StatIcons.tasks}
    </div>
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">{label}</p>
    <p className={`text-2xl font-bold tracking-tight ${
      variant === 'overdue' ? 'text-red-500' : variant === 'pending' ? 'text-amber-500' : 'text-slate-900 dark:text-white'
    }`}>
      {value}
    </p>
    {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{sub}</p>}
  </Link>
);

export default function Dashboard() {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [stats, setStats] = useState({ clients: {}, tasks: {}, users: {}, chatConversations: 0 });
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setError(null);
    setLastError(null);
    setRetryCount(c => c + 1);
  };

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const promises = [
          api.get('/reports/clients'),
          api.get('/reports/tasks'),
          api.get('/tasks/upcoming-deadlines?days=7')
        ];
        if (user?.role === 'admin') promises.push(api.get('/reports/users'));
        const results = await Promise.all(promises);
        const c = results[0];
        const t = results[1];
        const u = results[2];
        let userStats = {};
        if (user?.role === 'admin' && results[3]) userStats = results[3].data || {};
        let pendingClients = 0;
        let pendingTasks = 0;
        let chatConversations = 0;
        if (user?.role === 'manager' || user?.role === 'admin') {
          const [pc, pt] = await Promise.all([
            api.get('/clients/pending-approval'),
            api.get('/tasks/pending-approval')
          ]);
          pendingClients = pc.data?.length || 0;
          pendingTasks = pt.data?.length || 0;
        }
        if (user?.role === 'manager' || user?.role === 'agent') {
          try {
            const chatRes = await api.get('/chat/conversations');
            chatConversations = chatRes.data?.length || 0;
          } catch (_) {}
        }
        setStats({
          clients: c.data,
          tasks: t.data,
          users: userStats,
          pendingClients,
          pendingTasks,
          chatConversations
        });
        setUpcoming(u?.data || []);
      } catch (err) {
        if (!err?._silent) {
          const msg = err?.userMessage || err?.response?.data?.message || 'Failed to load dashboard';
          setError(msg);
          setLastError(err);
          showError(err);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.role, retryCount]);

  const viewClientsTo = '/clients';
  const viewTasksTo = '/tasks';

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

  const taskTypeLabels = ['BAS', 'GST', 'Tax Return', 'Payroll'];
  const taskTypeData = {
    labels: taskTypeLabels,
    datasets: [{
      data: taskTypeLabels.map(t => stats.tasks?.byTaskType?.[t] ?? 0),
      backgroundColor: CHART_COLORS,
      borderWidth: 0,
      hoverOffset: 8,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 12, cornerRadius: 8 }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148,163,184,0.15)' },
        ticks: { font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 12, cornerRadius: 8 }
    }
  };

  if (loading) return <PageLoader message="Loading dashboard..." />;

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <ApiErrorDisplay error={lastError || error} onRetry={handleRetry} title="Failed to load dashboard" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-slide-up">
      <header className="pb-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5">Welcome back, {user?.name} · {user?.role}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {user?.role === 'admin' && (
          <StatCard to="/users" iconKey="users" label="Total Users" value={stats.users?.totalUsers ?? 0} />
        )}
        <StatCard to={viewClientsTo} iconKey="building" label="Total Clients" value={stats.clients?.totalClients ?? 0} />
        <StatCard to={viewTasksTo} iconKey="tasks" label="Total Tasks" value={stats.tasks?.totalTasks ?? 0} />
        {(user?.role === 'manager' || user?.role === 'agent') && (
          <StatCard
            to="/chat"
            iconKey="chat"
            label="Chat"
            value={stats.chatConversations ?? 0}
            sub={stats.chatConversations === 0 ? 'No conversations' : stats.chatConversations === 1 ? '1 conversation' : `${stats.chatConversations} conversations`}
          />
        )}
        <StatCard to="/tasks?status=Pending" iconKey="clock" label="Pending" value={stats.tasks?.pending ?? 0} variant="pending" />
        <StatCard to="/tasks?filter=overdue" iconKey="alert" label="Overdue" value={stats.tasks?.overdue ?? 0} variant="overdue" />
        {(user?.role === 'manager' || user?.role === 'admin') && (stats.pendingClients > 0 || stats.pendingTasks > 0) && (
          <StatCard
            to="/tasks"
            iconKey="clipboard"
            label="Pending Approval"
            value={stats.pendingClients + stats.pendingTasks}
            variant="pending"
            sub={`${stats.pendingClients} Clients · ${stats.pendingTasks} Tasks`}
          />
        )}
      </div>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Analytics</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="group bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 lg:p-8 shadow-sm hover:shadow-xl hover:border-primary-500/20 transition-all duration-300 ease-out">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Tasks by Status</h3>
            </div>
            <div className="h-64">
              <Bar data={taskStatusData} options={chartOptions} />
            </div>
          </div>
          <div className="group bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 lg:p-8 shadow-sm hover:shadow-xl hover:border-primary-500/20 transition-all duration-300 ease-out">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Tasks by Type</h3>
            </div>
            <div className="h-64 flex items-center justify-center">
              <div className="w-48 h-48">
                <Doughnut data={taskTypeData} options={doughnutOptions} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-8 pt-2">
        <section>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-5 flex items-center gap-2">
            Upcoming Deadlines
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">7 days</span>
          </h2>
          {upcoming.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-10 text-center">
              <p className="text-slate-500 dark:text-slate-400">No upcoming deadlines</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((t, i) => (
                <li key={t._id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <Link
                    to={`/tasks/${t._id}/edit`}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 hover:border-primary-500/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-out"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-white block truncate">{t.taskType}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 truncate block">{t.client?.clientName || t.client?.companyName}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 shrink-0">
                      {new Date(t.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-5 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-500 text-white">{unreadCount}</span>
            )}
          </h2>
          {notifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-10 text-center">
              <p className="text-slate-500 dark:text-slate-400">No notifications</p>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {notifications.slice(0, 8).map((n, i) => (
                  <li key={n._id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <Link
                      to="/notifications"
                      className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5 ${
                        n.read
                          ? 'bg-white dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                          : 'bg-primary-50/50 dark:bg-primary-500/5 border-l-4 border-l-primary-500 border-slate-200/60 dark:border-slate-700/60 hover:border-primary-500/30'
                      }`}
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 line-clamp-2">{n.message}</span>
                      <span className="text-xs text-slate-500 shrink-0">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/notifications"
                className="inline-block mt-4 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
              >
                View all notifications →
              </Link>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
