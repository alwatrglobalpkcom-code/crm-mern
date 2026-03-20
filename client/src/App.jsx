import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './utils/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import PageLoader from './components/PageLoader';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AgentWork from './pages/AgentWork';
import Clients from './pages/Clients';
import Tasks from './pages/Tasks';
import TaskForm from './pages/TaskForm';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

const Documents = lazy(() => import('./pages/Documents'));
const Users = lazy(() => import('./pages/Users'));
const UserForm = lazy(() => import('./pages/UserForm'));
const TeamUsers = lazy(() => import('./pages/TeamUsers'));
const TeamUserForm = lazy(() => import('./pages/TeamUserForm'));
const Reports = lazy(() => import('./pages/Reports'));
const Chat = lazy(() => import('./pages/Chat'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));

function DashboardOrAgentWork() {
  const { user } = useAuth();
  if (user?.role === 'agent') return <AgentWork />;
  return <Dashboard />;
}

function IndexRedirect() {
  const { user } = useAuth();
  return <Navigate to="/dashboard" replace />;
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <PageLoader message="Loading..." />
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
          },
          success: { iconTheme: { primary: 'var(--color-success)' } },
          error: { iconTheme: { primary: 'var(--color-danger)' } },
        }}
      />
      <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<IndexRedirect />} />
        <Route path="dashboard" element={<DashboardOrAgentWork />} />
        <Route path="clients/:id/edit" element={<ProtectedRoute roles={['admin', 'manager', 'agent']}><Clients /></ProtectedRoute>} />
        <Route path="clients" element={<ProtectedRoute roles={['admin', 'manager', 'agent']}><Clients /></ProtectedRoute>} />
        <Route path="tasks" element={<ProtectedRoute roles={['admin', 'manager', 'agent']}><Tasks /></ProtectedRoute>} />
        <Route path="tasks/new" element={<ProtectedRoute roles={['admin', 'manager', 'agent']}><TaskForm /></ProtectedRoute>} />
        <Route path="tasks/:id/edit" element={<ProtectedRoute roles={['admin', 'manager', 'agent']}><TaskForm /></ProtectedRoute>} />
        <Route path="documents" element={<ProtectedRoute roles={['admin', 'manager', 'agent']}><Suspense fallback={<PageLoader />}><Documents /></Suspense></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['admin']}><Suspense fallback={<PageLoader />}><Users /></Suspense></ProtectedRoute>} />
        <Route path="users/new" element={<ProtectedRoute roles={['admin']}><Suspense fallback={<PageLoader />}><UserForm /></Suspense></ProtectedRoute>} />
        <Route path="users/:id/edit" element={<ProtectedRoute roles={['admin']}><Suspense fallback={<PageLoader />}><UserForm /></Suspense></ProtectedRoute>} />
        <Route path="team-users" element={<ProtectedRoute roles={['manager']}><Suspense fallback={<PageLoader />}><TeamUsers /></Suspense></ProtectedRoute>} />
        <Route path="team-users/:id" element={<ProtectedRoute roles={['manager']}><Suspense fallback={<PageLoader />}><TeamUserForm /></Suspense></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['admin', 'manager', 'agent']}><Suspense fallback={<PageLoader />}><Reports /></Suspense></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute roles={['admin', 'manager', 'agent']}><Settings /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute roles={['admin', 'manager', 'agent']}><Notifications /></ProtectedRoute>} />
        <Route path="chat" element={<ProtectedRoute roles={['manager', 'agent']}><SocketProvider><Suspense fallback={<PageLoader />}><Chat /></Suspense></SocketProvider></ProtectedRoute>} />
        <Route path="activity-logs" element={<ProtectedRoute roles={['admin']}><Suspense fallback={<PageLoader />}><ActivityLogs /></Suspense></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute roles={['admin', 'manager', 'agent']}><Profile /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
