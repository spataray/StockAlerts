const express = require('express');
const axios = require('axios');
const database = require('../database');

const router = express.Router();

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// Cache stock prices to avoid excessive API calls
const priceCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get current stock price
router.get('/price/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: 'Stock symbol is required'
            });
        }

        const upperSymbol = symbol.toUpperCase();

        // Check cache first
        const cached = priceCache.get(upperSymbol);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return res.json({
                success: true,
                data: cached.data
            });
        }

        // Check database cache
        const dbPrice = await database.get(
            'SELECT * FROM stock_prices WHERE symbol = ? AND datetime(last_updated) > datetime("now", "-5 minutes")',
            [upperSymbol]
        );

        if (dbPrice) {
            const data = {
                symbol: dbPrice.symbol,
                currentPrice: dbPrice.current_price,
                changePercent: dbPrice.change_percent,
                lastUpdated: dbPrice.last_updated
            };

            // Update memory cache
            priceCache.set(upperSymbol, {
                data,
                timestamp: Date.now()
            });

            return res.json({
                success: true,
                data
            });
        }

        // Fetch from Alpha Vantage
        if (!ALPHA_VANTAGE_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Stock API not configured'
            });
        }

        const response = await axios.get(`https://www.alphavantage.co/query`, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: upperSymbol,
                apikey: ALPHA_VANTAGE_KEY
            },
            timeout: 10000
        });

        const quote = response.data['Global Quote'];

        if (!quote || !quote['05. price']) {
            return res.status(404).json({
                success: false,
                message: 'Stock not found or API limit exceeded'
            });
        }

        const currentPrice = parseFloat(quote['05. price']);
        const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

        const data = {
            symbol: upperSymbol,
            currentPrice,
            changePercent,
            lastUpdated: new Date().toISOString()
        };

        // Update database cache
        await database.run(
            `INSERT OR REPLACE INTO stock_prices (symbol, current_price, change_percent, last_updated)
             VALUES (?, ?, ?, ?)`,
            [upperSymbol, currentPrice, changePercent, data.lastUpdated]
        );

        // Update memory cache
        priceCache.set(upperSymbol, {
            data,
            timestamp: Date.now()
        });

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Get stock price error:', error);

        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                success: false,
                message: 'Request timeout - stock API is slow'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to get stock price'
        });
    }
});

// Search for stocks
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;

        if (!query || query.length < 1) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        if (!ALPHA_VANTAGE_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Stock API not configured'
            });
        }

        const response = await axios.get(`https://www.alphavantage.co/query`, {
            params: {
                function: 'SYMBOL_SEARCH',
                keywords: query,
                apikey: ALPHA_VANTAGE_KEY
            },
            timeout: 10000
        });

        const matches = response.data.bestMatches || [];

        const results = matches.slice(0, 10).map(match => ({
            symbol: match['1. symbol'],
            name: match['2. name'],
            type: match['3. type'],
            region: match['4. region'],
            currency: match['8. currency']
        }));

        res.json({
            success: true,
            results
        });

    } catch (error) {
        console.error('Stock search error:', error);

        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                success: false,
                message: 'Request timeout - stock API is slow'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to search stocks'
        });
    }
});

// Get stock company info
router.get('/info/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: 'Stock symbol is required'
            });
        }

        if (!ALPHA_VANTAGE_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Stock API not configured'
            });
        }

        const upperSymbol = symbol.toUpperCase();

        const response = await axios.get(`https://www.alphavantage.co/query`, {
            params: {
                function: 'OVERVIEW',
                symbol: upperSymbol,
                apikey: ALPHA_VANTAGE_KEY
            },
            timeout: 15000
        });

        const overview = response.data;

        if (!overview.Symbol) {
            return res.status(404).json({
                success: false,
                message: 'Stock information not found'
            });
        }

        const info = {
            symbol: overview.Symbol,
            name: overview.Name,
            description: overview.Description,
            exchange: overview.Exchange,
            currency: overview.Currency,
            country: overview.Country,
            sector: overview.Sector,
            industry: overview.Industry,
            marketCap: overview.MarketCapitalization,
            peRatio: overview.PERatio,
            dividendYield: overview.DividendYield
        };

        res.json({
            success: true,
            info
        });

    } catch (error) {
        console.error('Get stock info error:', error);

        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                success: false,
                message: 'Request timeout - stock API is slow'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to get stock information'
        });
    }
});

// Get popular stocks
router.get('/popular', async (req, res) => {
    try {
        // Return a curated list of popular stocks
        const popularStocks = [
            { symbol: 'AAPL', name: 'Apple Inc.' },
            { symbol: 'MSFT', name: 'Microsoft Corporation' },
            { symbol: 'GOOGL', name: 'Alphabet Inc.' },
            { symbol: 'AMZN', name: 'Amazon.com Inc.' },
            { symbol: 'TSLA', name: 'Tesla Inc.' },
            { symbol: 'META', name: 'Meta Platforms Inc.' },
            { symbol: 'NVDA', name: 'NVIDIA Corporation' },
            { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
            { symbol: 'JNJ', name: 'Johnson & Johnson' },
            { symbol: 'V', name: 'Visa Inc.' }
        ];

        res.json({
            success: true,
            stocks: popularStocks
        });

    } catch (error) {
        console.error('Get popular stocks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get popular stocks'
        });
    }
});

// Clean up old cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [symbol, cached] of priceCache.entries()) {
        if (now - cached.timestamp > CACHE_DURATION) {
            priceCache.delete(symbol);
        }
    }
}, CACHE_DURATION);

module.exports = router;