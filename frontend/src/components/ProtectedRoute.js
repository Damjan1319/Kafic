import React from 'react';
import {Navigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';

const ProtectedRoute = ({children, allowedRoles}) => {
    const {user, loading} = useAuth();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div
                className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-indigo-400 mx-auto mb-4"></div>
                    <p className="text-slate-400 mb-1">Checking authentication...</p>
                    <p className="text-slate-400">Proveravanje autentifikacije...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!user) {
        return <Navigate to="/login"/>;
    }

    // If roles are specified and user doesn't have required role, redirect to login
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/login"/>;
    }

    return children;
};

export default ProtectedRoute; 