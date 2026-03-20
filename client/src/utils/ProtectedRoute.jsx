import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && roles.length > 0) {
    const role = (user.role || '').toLowerCase();
    if (!roles.map(r => r.toLowerCase()).includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
};
