// StockAlerts Configuration
window.APP_CONFIG = {
    // API Base URL - switches between local development and production
    API_BASE: window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://stockalerts-backend-jp7f8rdtj-spataray-5609s-projects.vercel.app',

    // App metadata
    APP_NAME: 'StockAlerts',
    VERSION: '1.0.0',

    // Feature flags
    FEATURES: {
        EMAIL_TO_SMS: true,
        MAGIC_LINK_AUTH: true,
        STOCK_MONITORING: true
    }
};

// Utility function for API calls
window.apiCall = async function(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    // Add auth token if available
    const token = localStorage.getItem('stockalerts_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(window.APP_CONFIG.API_BASE + endpoint, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};