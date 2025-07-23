import React, {createContext, useContext, useEffect, useState} from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Loading component for authentication
const AuthLoading = () => (
    <div
        className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
            <div
                className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400 mb-1">Proveravanje autentifikacije...</p>
            <p className="text-gray-400">Checking authentication...</p>
        </div>
    </div>
);

export const AuthProvider = ({children}) => {

    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check if user is logged in using /api/me endpoint
                const response = await axios.get('/api/me', {
                    withCredentials: true
                });

                if (response.data.user) {
                    setUser(response.data.user);
                    setIsAuthenticated(true);
                } else {
                    console.log('No user data, clearing user state');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Auth check error:', error);

                // Only clear user state on specific auth errors
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    console.log('Auth error, clearing user state');
                    setUser(null);
                    setIsAuthenticated(false);
                } else {
                    // For network errors or other issues, keep the user logged in
                    console.log('Network error, keeping user logged in');
                }
            }

            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (userData) => {
        console.log('Login called with:', {userData});
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            // Call logout endpoint to clear cookie
            await axios.post('/api/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }

        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <AuthLoading/> : children}
        </AuthContext.Provider>
    );
};

// Export AuthContext for components that need direct access
export {AuthContext};