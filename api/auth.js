const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const userDb = require('../database/users');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Email configuration
const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
};

let transporter = null;

function initializeEmailTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ Email credentials not configured - magic links will be logged to console');
        return null;
    }

    try {
        return nodemailer.createTransporter(emailConfig);
    } catch (error) {
        console.error('Failed to initialize email transporter:', error);
        return null;
    }
}

// Initialize email transporter
transporter = initializeEmailTransporter();

// Send magic link
router.post('/send-magic-link', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Generate magic link token
        const token = uuidv4();
        const magicLink = `${FRONTEND_URL}?token=${token}`;

        // Create or get user
        const user = await userDb.createOrGetUser(email);

        // Store magic link in database
        await userDb.createMagicLink(email, token);

        // Send email or log to console
        if (transporter) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your StockAlerts Login Link',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #2563eb, #8b5cf6); padding: 2rem; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: white; margin: 0; font-size: 1.8rem;">📈 StockAlerts</h1>
                        </div>

                        <div style="background: white; padding: 2rem; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <h2 style="color: #1e293b; margin-bottom: 1rem;">Welcome back!</h2>

                            <p style="color: #64748b; line-height: 1.6; margin-bottom: 2rem;">
                                Click the button below to securely log in to your StockAlerts account. This link will expire in 1 hour.
                            </p>

                            <div style="text-align: center; margin: 2rem 0;">
                                <a href="${magicLink}"
                                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                                    🚀 Log In to StockAlerts
                                </a>
                            </div>

                            <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 0;">
                                If you didn't request this login link, you can safely ignore this email.
                            </p>
                        </div>

                        <div style="text-align: center; margin-top: 1rem; color: #94a3b8; font-size: 0.75rem;">
                            © 2024 StockAlerts. Free stock monitoring for everyone.
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`📧 Magic link sent to ${email}`);
        } else {
            // Development mode - log the magic link
            console.log(`🔗 Magic link for ${email}: ${magicLink}`);
        }

        res.json({
            success: true,
            message: 'Magic link sent! Check your email to continue.'
        });

    } catch (error) {
        console.error('Send magic link error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send magic link. Please try again.'
        });
    }
});

// Verify magic link and create session
router.post('/verify-magic-link', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        // Get and validate magic link
        const magicLink = await userDb.getMagicLink(token);

        if (!magicLink) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired login link'
            });
        }

        // Mark magic link as used
        await userDb.useMagicLink(token);

        // Get or create user
        const user = await userDb.createOrGetUser(magicLink.email);

        // Create JWT token
        const authToken = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token: authToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error('Verify magic link error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify login link. Please try again.'
        });
    }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await userDb.getUserById(decoded.userId);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Create new token
            const newToken = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            res.json({
                success: true,
                token: newToken
            });

        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh token'
        });
    }
});

// Cleanup expired magic links (run periodically)
setInterval(async () => {
    try {
        const cleaned = await userDb.cleanupExpiredMagicLinks();
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired magic links`);
        }
    } catch (error) {
        console.error('Magic link cleanup error:', error);
    }
}, 60 * 60 * 1000); // Run every hour

module.exports = router;