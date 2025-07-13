import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  console.log('=== AuthProvider loaded ===');
  
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('Validating token:', { token: !!token, userData: !!userData });
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('Parsed user:', parsedUser);
          
          // Validate token with backend
          const response = await axios.get('/api/validate-token', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.data.valid) {
            console.log('Token is valid, setting user');
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            console.log('Token is invalid, clearing localStorage');
            // Token is invalid, clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          // Token is invalid or expired, clear localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        console.log('No token or userData found');
      }
      
      setLoading(false);
    };

    validateToken();
  }, []);

  const login = (userData, token) => {
    console.log('Login called with:', { userData, token });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext }; 