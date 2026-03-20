import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/PageLoader';
import ApiErrorDisplay from '../components/ApiErrorDisplay';
import { showError } from '../utils/toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function Reports() {
  const { user } = useAuth();
  const [clientStats, setClientStats] = useState({});
  const [taskStats, setTaskStats] = useState({});
  const [userStats, setUserStats] = useState({});
  const [userPerformance, setUserPerformance] = useState([]);
  const [revenue, setRevenue] = useState({});
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
    const promises = [
      api.get('/reports/clients').then(r => r.data),
      api.get('/reports/tasks').then(r => r.data),
      api.get('/reports/revenue').then(r => r.data)
    ];
    if (user?.role === 'admin') promises.push(api.get('/reports/users').then(r => r.data));
    if (user?.role === 'admin' || user?.role === 'manager') promises.push(api.get('/reports/user-performance').then(r => r.data));

    Promise.all(promises).then((results) => {
      setClientStats(results[0] || {});
      setTaskStats(results[1] || {});
      setRevenue(results[2] || {});
      if (user?.role === 'admin') {
        setUserStats(results[3] || {});
        setUserPerformance(results[4] || []);
      } else if (user?.role === 'manager') {
        setUserPerformance(results[3] || []);
      }
    }).catch((err) => {
      setError(err?.userMessage || 'Failed to load reports');
      setLastError(err);
      showError(err);
    })
    .finally(() => setLoading(false));
  }, [user?.role, retryCount]);

  const taskStatusData = {
    labels: ['Pending', 'In Progress', 'Completed', 'Overdue'],
    datasets: [{
      label: 'Tasks',
      data: [
        taskStats.pending ?? 0,
        taskStats.inProgress ?? 0,
        taskStats.completed ?? 0,
        taskStats.overdue ?? 0
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
      data: taskTypeLabels.map(t => taskStats.byTaskType?.[t] ?? 0),
      backgroundColor: CHART_COLORS,
      borderWidth: 0,
      hoverOffset: 8,
    }]
  };

  const userRoleData = userStats.byRole ? {
    labels: Object.keys(userStats.byRole),
    datasets: [{
      data: Object.values(userStats.byRole),
      backgroundColor: ['#6366f1', '#8b5cf6', '#06b6d4'],
      borderWidth: 0,
      hoverOffset: 8,
    }]
  } : null;

  const completionRateData = {
    labels: ['Completed', 'Remaining'],
    datasets: [{
      data: [taskStats.completionRate ?? 0, 100 - (taskStats.completionRate ?? 0)],
      backgroundColor: ['#10b981', '#e2e8f0'],
      borderWidth: 0,
      hoverOffset: 8,
    }]
  };

  const userPerformanceData = userPerformance.length > 0 ? {
    labels: userPerformance.map(u => u.name),
    datasets: [
      { label: 'Completed', data: userPerformance.map(u => u.completed), backgroundColor: '#10b981', borderRadius: 6, stack: 'tasks' },
      { label: 'In Progress', data: userPerformance.map(u => u.inProgress), backgroundColor: '#6366f1', borderRadius: 6, stack: 'tasks' },
      { label: 'Pending', data: userPerformance.map(u => u.pending), backgroundColor: '#94a3b8', borderRadius: 6, stack: 'tasks' }
    ]
  } : null;

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

  if (loading) return <PageLoader message="Loading reports..." />;

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <ApiErrorDisplay error={lastError || error} onRetry={handleRetry} title="Failed to load reports" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Clients', value: clientStats.totalClients ?? 0 },
    { label: 'Total Tasks', value: taskStats.totalTasks ?? 0 },
    { label: 'Completion Rate', value: `${taskStats.completionRate ?? 0}%`, variant: 'rate' },
    { label: 'Pending', value: taskStats.pending ?? 0 },
    { label: 'In Progress', value: taskStats.inProgress ?? 0 },
    { label: 'Completed', value: taskStats.completed ?? 0 },
    { label: 'Overdue', value: taskStats.overdue ?? 0, variant: 'overdue' },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">System stats aur performance overview — all-in-one</p>
      </header>

      {user?.role === 'admin' && (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Users</h3>
          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{userStats.totalUsers ?? 0}</span>
            {userStats.byRole && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Admin {userStats.byRole.admin ?? 0} · Manager {userStats.byRole.manager ?? 0} · Agent {userStats.byRole.agent ?? 0}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.variant === 'overdue' ? 'text-red-500' : card.variant === 'rate' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Tasks by Status</h3>
          <div className="h-64">
            <Bar data={taskStatusData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Tasks by Type</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="w-40 h-40">
              <Doughnut data={taskTypeData} options={doughnutOptions} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Task Completion Rate</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="w-40 h-40">
              <Doughnut data={completionRateData} options={doughnutOptions} />
            </div>
          </div>
          <p className="text-center text-2xl font-bold text-emerald-500 mt-2">{taskStats.completionRate ?? 0}%</p>
        </div>
        {user?.role === 'admin' && userRoleData && (
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Users by Role</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="w-40 h-40">
                <Doughnut data={userRoleData} options={doughnutOptions} />
              </div>
            </div>
          </div>
        )}
      </div>

      {(user?.role === 'admin' || user?.role === 'manager') && userPerformanceData && (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">User Performance — Tasks by Agent</h3>
          <div className="h-72">
            <Bar
              data={userPerformanceData}
              options={{
                ...chartOptions,
                indexAxis: 'y',
                scales: {
                  x: { stacked: true, beginAtZero: true, grid: { color: 'rgba(148,163,184,0.15)' }, ticks: { font: { size: 11 } } },
                  y: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } }
                }
              }}
            />
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Revenue</h3>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
          {revenue.currency || 'AUD'} {(revenue.total ?? 0).toLocaleString()}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{revenue.label || 'Add amount to completed tasks to track revenue'}</p>
      </div>
    </div>
  );
}
