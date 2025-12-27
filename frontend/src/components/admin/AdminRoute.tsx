import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
// AdminRoute handles its own authentication check

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Admin Route Component
 * 
 * Protects routes that require ADMIN or SUPER_ADMIN role
 * Redirects non-admin users to dashboard
 */
export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();

  // First check authentication (ProtectedRoute handles this)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin role
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

