const express = require('express');
const userDb = require('../database/users');
const { sendTestAlert } = require('../stock-alert-system/src/alertSender');

const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const user = await userDb.getUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
});

// Update user profile
router.put('/profile', async (req, res) => {
    try {
        const { name } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;

        const updatedUser = await userDb.updateUser(req.user.id, updates);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

// Update phone settings
router.put('/phone', async (req, res) => {
    try {
        const { phoneNumber, carrier } = req.body;

        if (!phoneNumber || !carrier) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and carrier are required'
            });
        }

        // Validate phone number format (10 digits)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be 10 digits'
            });
        }

        const validCarriers = ['verizon', 'att', 'tmobile', 'sprint', 'boost', 'cricket', 'metropcs', 'virgin', 'uscellular', 'straighttalk'];
        if (!validCarriers.includes(carrier)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid carrier'
            });
        }

        const updates = {
            phone_number: phoneNumber,
            carrier: carrier
        };

        const updatedUser = await userDb.updateUser(req.user.id, updates);

        res.json({
            success: true,
            message: 'Phone settings updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update phone error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update phone settings'
        });
    }
});

// Update email preferences
router.put('/email-preferences', async (req, res) => {
    try {
        const { emailReminders, emailSummary } = req.body;

        const updates = {};
        if (emailReminders !== undefined) updates.email_reminders = emailReminders;
        if (emailSummary !== undefined) updates.email_summary = emailSummary;

        const updatedUser = await userDb.updateUser(req.user.id, updates);

        res.json({
            success: true,
            message: 'Email preferences updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update email preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update email preferences'
        });
    }
});

// Get user stocks
router.get('/stocks', async (req, res) => {
    try {
        const stocks = await userDb.getUserStocks(req.user.id);

        res.json({
            success: true,
            stocks
        });

    } catch (error) {
        console.error('Get stocks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stocks'
        });
    }
});

// Add stock to watchlist
router.post('/stocks', async (req, res) => {
    try {
        const { symbol, name, threshold, alertType } = req.body;

        if (!symbol || !threshold || !alertType) {
            return res.status(400).json({
                success: false,
                message: 'Symbol, threshold, and alert type are required'
            });
        }

        if (!['above', 'below'].includes(alertType)) {
            return res.status(400).json({
                success: false,
                message: 'Alert type must be "above" or "below"'
            });
        }

        if (threshold <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Threshold must be greater than 0'
            });
        }

        const stockData = {
            symbol: symbol.toUpperCase(),
            name: name || '',
            threshold: parseFloat(threshold),
            alertType
        };

        const stock = await userDb.addUserStock(req.user.id, stockData);

        res.json({
            success: true,
            message: 'Stock added to watchlist',
            stock
        });

    } catch (error) {
        console.error('Add stock error:', error);

        if (error.message.includes('already monitoring')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to add stock'
        });
    }
});

// Update stock settings
router.put('/stocks/:stockId', async (req, res) => {
    try {
        const { stockId } = req.params;
        const { name, threshold, alertType } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (threshold !== undefined) {
            if (threshold <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Threshold must be greater than 0'
                });
            }
            updates.threshold = parseFloat(threshold);
        }
        if (alertType !== undefined) {
            if (!['above', 'below'].includes(alertType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Alert type must be "above" or "below"'
                });
            }
            updates.alert_type = alertType;
        }

        await userDb.updateUserStock(req.user.id, stockId, updates);

        res.json({
            success: true,
            message: 'Stock updated successfully'
        });

    } catch (error) {
        console.error('Update stock error:', error);

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Stock not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update stock'
        });
    }
});

// Remove stock from watchlist
router.delete('/stocks/:stockId', async (req, res) => {
    try {
        const { stockId } = req.params;

        const removed = await userDb.removeUserStock(req.user.id, stockId);

        if (!removed) {
            return res.status(404).json({
                success: false,
                message: 'Stock not found'
            });
        }

        res.json({
            success: true,
            message: 'Stock removed from watchlist'
        });

    } catch (error) {
        console.error('Remove stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove stock'
        });
    }
});

// Get alert history
router.get('/alerts', async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const alerts = await userDb.getUserAlerts(req.user.id, parseInt(limit));

        res.json({
            success: true,
            alerts
        });

    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get alerts'
        });
    }
});

// Send test alert
router.post('/test-alert', async (req, res) => {
    try {
        const user = await userDb.getUserById(req.user.id);

        if (!user.phoneNumber || !user.carrier) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and carrier must be configured first'
            });
        }

        // Set environment variables for the alert system
        process.env.ALERT_PHONE_NUMBER = user.phoneNumber;
        process.env.CARRIER_OVERRIDE = user.carrier;

        // Send test alert
        const result = await sendTestAlert();

        if (result) {
            res.json({
                success: true,
                message: 'Test alert sent successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send test alert'
            });
        }

    } catch (error) {
        console.error('Send test alert error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test alert'
        });
    }
});

// Delete user account
router.delete('/account', async (req, res) => {
    try {
        const deleted = await userDb.deleteUser(req.user.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
});

module.exports = router;