import React, {useState} from 'react';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';
import {useNavigate} from 'react-router-dom';
import {validateLoginData} from '../utils/validation';
import logger from '../utils/logger';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const {login} = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const validationErrors = validateLoginData(username, password);
        if (validationErrors.length > 0) {
            logger.warn('Login validation failed', {username, errors: validationErrors});
            setError(validationErrors.join(', '));
            setLoading(false);
            return;
        }

        try {
            const startTime = Date.now();
            const response = await axios.post('/api/login', {username, password}, {withCredentials: true} // Include cookies
            );

            const duration = Date.now() - startTime;
            logger.logApiCall('/api/login', 'POST', response.status, duration);

            logger.info('Login successful', {username: response.data.user.username, role: response.data.user.role});
            await login(response.data.user);

            // Redirect based on role
            navigate(response.data.user.role === 'admin' ? '/admin' : '/waiter');
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Greška pri prijavi. Pokušajte ponovo.';
            logger.error('Login error', {username, error: errorMessage});
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (<div
        className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
            {/* Logo and Title */}
            <div className="text-center mb-8">
                <div className="text-6xl mb-4">☕</div>
                <h1 className="text-3xl font-bold text-slate-100 mb-2">Sistem za Poručivanje</h1>
                <p className="text-slate-400 mb-1">Cafe Ordering System</p>
                <p className="text-slate-400">Prijavite se u sistem</p>
                <p className="text-sm text-slate-500">Login to the system</p>
            </div>

            {/* Login Form */}
            <div
                className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username Field */}
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                            Korisničko ime <span className="text-xs opacity-75">Username</span>
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
                            placeholder="Unesite korisničko ime (Enter username)"
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                            Lozinka <span className="text-xs opacity-75">Password</span>
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
                            placeholder="Unesite lozinku (Enter password)"
                            required
                        />
                    </div>

                    {/* Error Message */}
                    {error && (<div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>)}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg font-semibold"
                    >
                        {loading ? (<div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Prijavljivanje...</span>
                            <span className="text-xs opacity-75">Logging in...</span>
                        </div>) : (<>
                            Prijavi se
                            <span className="block text-xs opacity-75">Login</span>
                        </>)}
                    </button>
                </form>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Demo pristup:</h3>
                    <p className="text-slate-400 text-xs mb-1">Demo Access:</p>
                    <div className="space-y-1 text-xs text-slate-400">
                        <div><strong>Admin:</strong> admin / admin123</div>
                        <div><strong>Konobar:</strong> waiter / waiter123</div>
                        <div><strong>Konobar 2:</strong> waiter2 / waiter123</div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6">
                <p className="text-xs text-slate-500">© 2025 Cafe Ordering System</p>
                <p className="text-xs text-slate-500">© 2025 Sistem za Poručivanje u Kafiću</p>
            </div>
        </div>
    </div>);
};

export default Login;