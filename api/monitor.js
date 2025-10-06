const express = require('express');
const MultiUserStockMonitor = require('../multiUserMonitor');

const router = express.Router();

// Endpoint for scheduled stock monitoring
router.post('/', async (req, res) => {
    try {
        console.log('📊 Scheduled stock monitor triggered');

        const monitor = new MultiUserStockMonitor();
        await monitor.initialize();
        await monitor.checkAllUserStocks();

        res.json({
            success: true,
            message: 'Stock monitoring completed successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Monitor endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Stock monitoring failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET endpoint for health check
router.get('/', async (req, res) => {
    try {
        const monitor = new MultiUserStockMonitor();
        await monitor.initialize();

        // Get some basic stats
        const database = require('../database');
        const userCount = await database.get('SELECT COUNT(*) as count FROM users');
        const stockCount = await database.get('SELECT COUNT(*) as count FROM user_stocks WHERE is_active = 1');

        res.json({
            success: true,
            message: 'Stock monitor is healthy',
            stats: {
                totalUsers: userCount.count,
                activeStocks: stockCount.count,
                lastCheck: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Monitor health check error:', error);
        res.status(500).json({
            success: false,
            message: 'Monitor health check failed',
            error: error.message
        });
    }
});

module.exports = router;