// models/Auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Waiter = require('./Waiter'); // Adjust path if needed (assuming models are in the same directory)

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

class Auth {
    // Authentication middleware
    static authenticate() {
        return async (req, res, next) => {
            const token = req.cookies.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
            if (!token) {
                return res.status(401).json({error: 'Access token required'});
            }

            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const waiter = await Waiter.getWaiterById(decoded.id);
                if (!waiter) {
                    throw new Error('User not found');
                }
                req.user = waiter;
                next();
            } catch (err) {
                res.clearCookie('token');
                return res.status(403).json({error: 'Invalid token'});
            }
        };
    }

    // Validate token handler
    static validate(req, res) {
        res.json({
            valid: true,
            user: {
                id: req.user.id,
                username: req.user.username,
                name: req.user.name,
                role: req.user.role,
            },
        });
    }

    // Get current user handler
    static me(req, res) {
        res.json({
            user: {
                id: req.user.id,
                username: req.user.username,
                name: req.user.name,
                role: req.user.role,
            },
        });
    }

    // Login handler
    static async login(req, res) {
        const {username, password} = req.body;

        try {
            const waiter = await Waiter.getWaiterByUsername(username);
            if (!waiter || !bcrypt.compareSync(password, waiter.password)) {
                return res.status(401).json({error: 'Invalid credentials'});
            }

            const token = jwt.sign(
                {id: waiter.id, username: waiter.username, role: waiter.role},
                JWT_SECRET,
                {expiresIn: '24h'}
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                path: '/',
            });

            res.json({
                user: {
                    id: waiter.id,
                    username: waiter.username,
                    name: waiter.name,
                    role: waiter.role,
                },
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({error: 'Server error'});
        }
    }

    // Logout handler
    static logout(req, res) {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });
        res.json({message: 'Logged out successfully'});
    }
}

module.exports = Auth;