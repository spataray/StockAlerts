// PuChokDii API Configuration
window.PUCHOKDII_CONFIG = {
    // API Configuration - Points to shared StockAlerts backend
    API_BASE: window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://your-stockalerts-backend.vercel.app', // Replace with your actual Vercel URL

    // Platform identifier
    PLATFORM: 'puchokdii',

    // Frontend URL
    FRONTEND_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://spataray.github.io/PuChokDii',

    // Thai lottery specific settings
    LOTTERY: {
        DRAW_DAYS: [1, 16], // 1st and 16th of each month
        RESULT_DELAY_HOURS: 2, // Results available 2 hours after draw
        MAX_SAVED_NUMBERS: 10, // Maximum saved favorite numbers per user
        NOTIFICATION_TIMES: ['18:00', '20:00'] // SMS notification times
    },

    // Feature flags
    FEATURES: {
        QUICK_CHECK: true,
        SMART_GENERATOR: true,
        HISTORICAL_ANALYSIS: false, // Coming soon
        COMMUNITY_FEATURES: false, // Coming soon
        PREMIUM_ANALYTICS: false // Future feature
    }
};

// Helper function for API calls to shared backend
window.lotteryApiCall = async function(endpoint, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Platform': window.PUCHOKDII_CONFIG.PLATFORM
        }
    };

    // Add auth token if available
    const token = localStorage.getItem('puchokdii_token');
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { ...defaultOptions, ...options };

    try {
        const response = await fetch(window.PUCHOKDII_CONFIG.API_BASE + endpoint, config);
        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || 'API request failed');
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    } catch (error) {
        console.error(`PuChokDii API Error [${endpoint}]:`, error);
        throw error;
    }
};

// Thai lottery utility functions
window.ThaiLottery = {
    // Format number for display
    formatNumber: (number) => {
        return number.toString().padStart(6, '0');
    },

    // Check if number is valid lottery number
    isValidNumber: (number) => {
        const cleaned = number.toString().replace(/\D/g, '');
        return cleaned.length === 6 && /^\d{6}$/.test(cleaned);
    },

    // Get next draw dates
    getNextDrawDates: () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const dates = [];

        // Current month draws
        const firstDraw = new Date(year, month, 1);
        const sixteenthDraw = new Date(year, month, 16);

        if (firstDraw > now) dates.push(firstDraw);
        if (sixteenthDraw > now) dates.push(sixteenthDraw);

        // Next month draws if needed
        if (dates.length < 2) {
            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;

            if (dates.length === 0) {
                dates.push(new Date(nextYear, nextMonth, 1));
                dates.push(new Date(nextYear, nextMonth, 16));
            } else {
                dates.push(new Date(nextYear, nextMonth, 1));
            }
        }

        return dates;
    },

    // Format Thai date
    formatThaiDate: (date) => {
        const months = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];

        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear() + 543; // Buddhist calendar

        return `${day} ${month} ${year}`;
    },

    // Prize tiers and amounts
    PRIZES: {
        'first': { thai: 'รางวัลที่ 1', amount: 6000000, count: 1 },
        'near_first': { thai: 'รางวัลข้างเคียงรางวัลที่ 1', amount: 100000, count: 2 },
        'second': { thai: 'รางวัลที่ 2', amount: 200000, count: 5 },
        'third': { thai: 'รางวัลที่ 3', amount: 80000, count: 10 },
        'fourth': { thai: 'รางวัลที่ 4', amount: 40000, count: 50 },
        'fifth': { thai: 'รางวัลที่ 5', amount: 20000, count: 100 },
        'two_digit': { thai: 'รางวัลเลขท้าย 2 ตัว', amount: 2000, count: 1 },
        'three_front': { thai: 'รางวัลเลขหน้า 3 ตัว', amount: 4000, count: 2 },
        'three_back': { thai: 'รางวัลเลขท้าย 3 ตัว', amount: 4000, count: 2 }
    }
};

console.log('🍀 PuChokDii configuration loaded - ผู้โชคดีแห่งความรู้และโชคลาภ');