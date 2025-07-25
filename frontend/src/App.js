import React from 'react';
import {BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom';
import {useAuth} from './context/AuthContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import WaiterDashboard from './components/WaiterDashboard';
import CustomerMenu from './components/CustomerMenu';
import QRScanner from './components/QRScanner';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './components/HomePage';
import TableMapDemo from './components/TableMapDemo';
import InteractiveTableMap from './components/InteractiveTableMap';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
    const {user, loading} = useAuth();

    if (loading) {
        return (
            <div
                className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-indigo-400 mx-auto mb-4"></div>
                    <p className="text-slate-400 mb-1">Loading application...</p>
                    <p className="text-slate-400">Učitavanje aplikacije...</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <Router>
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<HomePage/>}/>
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/qr" element={<QRScanner/>}/>
                        <Route path="/customer" element={<CustomerMenu/>}/>
                        <Route path="/customer/table/:tableId" element={<CustomerMenu/>}/>
                        <Route path="/tablemap-demo" element={<TableMapDemo/>}/>
                        <Route path="/interactive-map" element={<InteractiveTableMap/>}/>

                        {/* Protected Routes */}
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <AdminDashboard/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/waiter"
                            element={
                                <ProtectedRoute allowedRoles={['waiter']}>
                                    <WaiterDashboard/>
                                </ProtectedRoute>
                            }
                        />

                        {/* Fallback Route */}
                        <Route path="*" element={<Navigate to="/"/>}/>
                    </Routes>
                </div>
            </Router>
        </ErrorBoundary>
    );
}

export default App; 