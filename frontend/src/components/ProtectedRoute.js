import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  console.log('ProtectedRoute - loading:', loading, 'user:', user, 'user type:', typeof user);

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('ProtectedRoute - showing loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-indigo-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Proveravanje autentifikacije...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    console.log('ProtectedRoute - no user, redirecting to login');
    return <Navigate to="/login" />;
  }

  // If roles are specified and user doesn't have required role, redirect to login
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('ProtectedRoute - user role not allowed, redirecting to login');
    return <Navigate to="/login" />;
  }

  console.log('ProtectedRoute - rendering children');
  return children;
};

export default ProtectedRoute; 