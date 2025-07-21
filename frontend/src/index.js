import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {AuthProvider} from './context/AuthContext';
import {SocketProvider} from './context/SocketContext';
import axios from 'axios';

// Set axios base URL - use environment variable or fallback to localhost
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003';
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add axios interceptor to automatically add authorization headers
axios.interceptors.request.use(
    (config) => {
        // Cookies are automatically sent with requests when credentials: 'include' is set
        // No need to manually add Authorization header
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle unauthorized responses
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token is invalid, samo loguj, nemoj raditi redirect
            console.warn('401 Unauthorized - korisnik nije prijavljen ili je token istekao. Prikazati login formu, ali ne raditi automatski redirect ovde.');
        }
        return Promise.reject(error);
    }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <AuthProvider>
            <SocketProvider>
                <App/>
            </SocketProvider>
        </AuthProvider>
    </React.StrictMode>
); 