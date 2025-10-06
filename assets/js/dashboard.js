// Dashboard JavaScript functionality

class StockAlertsDashboard {
    constructor() {
        this.authToken = localStorage.getItem('authToken');
        this.user = null;
        this.stocks = [];
        this.alerts = [];

        // Check authentication
        if (!this.authToken) {
            this.redirectToLogin();
            return;
        }

        this.init();
    }

    async init() {
        try {
            // Load user data
            await this.loadUserData();

            // Initialize UI
            this.initEventListeners();
            this.initNavigation();
            this.updateUI();

            // Load dashboard data
            await this.loadDashboardData();

        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showNotification('Failed to load dashboard. Please try again.', 'error');
        }
    }

    async loadUserData() {
        try {
            const response = await this.apiCall('/api/user/profile');
            this.user = response.user;

            // Update UI with user data
            document.getElementById('userEmail').textContent = this.user.email;
            document.getElementById('profileEmail').value = this.user.email;

            if (this.user.name) {
                document.getElementById('profileName').value = this.user.name;
            }

            if (this.user.phoneNumber) {
                document.getElementById('phoneNumber').value = this.user.phoneNumber;
                document.getElementById('phoneStatus').textContent = 'Configured';
            }

            if (this.user.carrier) {
                document.getElementById('carrier').value = this.user.carrier;
            }

            // Update checkboxes
            document.getElementById('emailReminders').checked = this.user.emailReminders !== false;
            document.getElementById('emailSummary').checked = this.user.emailSummary !== false;

        } catch (error) {
            if (error.status === 401) {
                this.redirectToLogin();
                return;
            }
            throw error;
        }
    }

    async loadDashboardData() {
        try {
            // Load stocks and alerts in parallel
            const [stocksResponse, alertsResponse] = await Promise.all([
                this.apiCall('/api/user/stocks'),
                this.apiCall('/api/user/alerts')
            ]);

            this.stocks = stocksResponse.stocks || [];
            this.alerts = alertsResponse.alerts || [];

            this.updateStocksList();
            this.updateAlertsList();
            this.updateStats();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Failed to load some data. Please refresh the page.', 'error');
        }
    }

    initEventListeners() {
        // User menu toggle
        const userMenuToggle = document.getElementById('userMenuToggle');
        const userDropdown = document.getElementById('userDropdown');

        if (userMenuToggle && userDropdown) {
            userMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                userDropdown.classList.remove('active');
            });
        }

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Profile and settings buttons
        document.getElementById('profileBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('profile');
        });

        document.getElementById('settingsBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('profile');
        });

        // Quick action buttons
        document.getElementById('addStockBtn')?.addEventListener('click', () => this.showAddStockModal());
        document.getElementById('addStockBtnTop')?.addEventListener('click', () => this.showAddStockModal());
        document.getElementById('addFirstStock')?.addEventListener('click', () => this.showAddStockModal());

        document.getElementById('testAlertBtn')?.addEventListener('click', () => this.sendTestAlert());
        document.getElementById('setupPhoneBtn')?.addEventListener('click', () => this.showSection('profile'));

        // Add stock modal
        this.initAddStockModal();

        // Forms
        this.initForms();
    }

    initNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');

        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.showSection(section);
            });
        });
    }

    showSection(sectionName) {
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');

        // Show section
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });

        document.getElementById(sectionName)?.classList.add('active');
    }

    initAddStockModal() {
        const modal = document.getElementById('addStockModal');
        const form = document.getElementById('addStockForm');
        const closeBtn = document.getElementById('addStockModalClose');
        const cancelBtn = document.getElementById('cancelAddStock');

        // Close modal events
        [closeBtn, cancelBtn].forEach(btn => {
            btn?.addEventListener('click', () => this.hideAddStockModal());
        });

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideAddStockModal();
            }
        });

        // Form submission
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStock();
        });

        // Auto-uppercase stock symbol
        document.getElementById('stockSymbol')?.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    initForms() {
        // Account form
        document.getElementById('accountForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });

        // Phone form
        document.getElementById('phoneForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updatePhoneSettings();
        });

        // Email preferences form
        document.getElementById('emailPrefsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateEmailPreferences();
        });

        // Test phone button
        document.getElementById('testPhoneBtn')?.addEventListener('click', () => {
            this.sendTestAlert();
        });

        // Delete account button
        document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
            this.deleteAccount();
        });
    }

    showAddStockModal() {
        const modal = document.getElementById('addStockModal');
        modal?.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus on stock symbol input
        setTimeout(() => {
            document.getElementById('stockSymbol')?.focus();
        }, 100);
    }

    hideAddStockModal() {
        const modal = document.getElementById('addStockModal');
        modal?.classList.remove('active');
        document.body.style.overflow = '';

        // Reset form
        document.getElementById('addStockForm')?.reset();
    }

    async addStock() {
        const form = document.getElementById('addStockForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            const formData = new FormData(form);
            const stockData = {
                symbol: document.getElementById('stockSymbol').value.toUpperCase(),
                name: document.getElementById('stockName').value || '',
                threshold: parseFloat(document.getElementById('threshold').value),
                alertType: document.getElementById('alertType').value
            };

            // Validate required fields
            if (!stockData.symbol || !stockData.threshold || !stockData.alertType) {
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }

            // Update button state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
            submitBtn.disabled = true;

            const response = await this.apiCall('/api/user/stocks', {
                method: 'POST',
                body: JSON.stringify(stockData)
            });

            this.showNotification(`${stockData.symbol} added to your watchlist!`, 'success');
            this.hideAddStockModal();

            // Reload stocks data
            await this.loadDashboardData();

        } catch (error) {
            console.error('Error adding stock:', error);
            this.showNotification(error.message || 'Failed to add stock. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async removeStock(stockId) {
        if (!confirm('Are you sure you want to remove this stock from your watchlist?')) {
            return;
        }

        try {
            await this.apiCall(`/api/user/stocks/${stockId}`, {
                method: 'DELETE'
            });

            this.showNotification('Stock removed from your watchlist', 'success');
            await this.loadDashboardData();

        } catch (error) {
            console.error('Error removing stock:', error);
            this.showNotification('Failed to remove stock. Please try again.', 'error');
        }
    }

    async updateProfile() {
        const form = document.getElementById('accountForm');
        const submitBtn = form.querySelector('button[type="submit"]') ||
                         document.querySelector('button[form="accountForm"]');

        if (!submitBtn) return;

        const originalText = submitBtn.innerHTML;

        try {
            const name = document.getElementById('profileName').value.trim();

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;

            await this.apiCall('/api/user/profile', {
                method: 'PUT',
                body: JSON.stringify({ name })
            });

            this.user.name = name;
            this.showNotification('Profile updated successfully!', 'success');

        } catch (error) {
            console.error('Error updating profile:', error);
            this.showNotification('Failed to update profile. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async updatePhoneSettings() {
        const form = document.getElementById('phoneForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            const phoneNumber = document.getElementById('phoneNumber').value.trim();
            const carrier = document.getElementById('carrier').value;

            // Validate phone number format
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(phoneNumber)) {
                this.showNotification('Please enter a valid 10-digit phone number', 'error');
                return;
            }

            if (!carrier) {
                this.showNotification('Please select your carrier', 'error');
                return;
            }

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;

            await this.apiCall('/api/user/phone', {
                method: 'PUT',
                body: JSON.stringify({ phoneNumber, carrier })
            });

            this.user.phoneNumber = phoneNumber;
            this.user.carrier = carrier;

            document.getElementById('phoneStatus').textContent = 'Configured';
            this.showNotification('Phone settings updated successfully!', 'success');

        } catch (error) {
            console.error('Error updating phone settings:', error);
            this.showNotification('Failed to update phone settings. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async updateEmailPreferences() {
        const form = document.getElementById('emailPrefsForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            const emailReminders = document.getElementById('emailReminders').checked;
            const emailSummary = document.getElementById('emailSummary').checked;

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;

            await this.apiCall('/api/user/email-preferences', {
                method: 'PUT',
                body: JSON.stringify({ emailReminders, emailSummary })
            });

            this.user.emailReminders = emailReminders;
            this.user.emailSummary = emailSummary;

            this.showNotification('Email preferences updated successfully!', 'success');

        } catch (error) {
            console.error('Error updating email preferences:', error);
            this.showNotification('Failed to update email preferences. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async sendTestAlert() {
        if (!this.user.phoneNumber || !this.user.carrier) {
            this.showNotification('Please configure your phone number and carrier first', 'error');
            this.showSection('profile');
            return;
        }

        try {
            const response = await this.apiCall('/api/user/test-alert', {
                method: 'POST'
            });

            this.showNotification('Test alert sent! Check your phone.', 'success');

        } catch (error) {
            console.error('Error sending test alert:', error);
            this.showNotification('Failed to send test alert. Please check your phone settings.', 'error');
        }
    }

    async deleteAccount() {
        const confirmed = confirm(
            'Are you sure you want to delete your account? This action cannot be undone. All your stocks and alert history will be permanently deleted.'
        );

        if (!confirmed) return;

        const doubleConfirm = confirm(
            'This is your last chance! Are you absolutely sure you want to delete your account?'
        );

        if (!doubleConfirm) return;

        try {
            await this.apiCall('/api/user/account', {
                method: 'DELETE'
            });

            this.showNotification('Your account has been deleted.', 'success');

            // Clear local storage and redirect
            localStorage.removeItem('authToken');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);

        } catch (error) {
            console.error('Error deleting account:', error);
            this.showNotification('Failed to delete account. Please try again.', 'error');
        }
    }

    updateStocksList() {
        const emptyState = document.getElementById('emptyStocks');
        const stocksList = document.getElementById('stocksList');

        if (this.stocks.length === 0) {
            emptyState.style.display = 'block';
            stocksList.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        stocksList.style.display = 'block';

        stocksList.innerHTML = this.stocks.map(stock => `
            <div class="stock-item">
                <div class="stock-info">
                    <div>
                        <div class="stock-symbol">${stock.symbol}</div>
                        <div class="stock-name">${stock.name || 'Loading...'}</div>
                    </div>
                </div>
                <div class="stock-details">
                    <div class="stock-price">
                        <div class="current-price">$${stock.currentPrice?.toFixed(2) || '---'}</div>
                        <div class="price-change ${stock.changePercent >= 0 ? 'positive' : 'negative'}">
                            ${stock.changePercent ? (stock.changePercent >= 0 ? '+' : '') + stock.changePercent.toFixed(2) + '%' : '---'}
                        </div>
                    </div>
                    <div class="stock-threshold">
                        <div class="threshold-value">$${stock.threshold.toFixed(2)}</div>
                        <div class="threshold-type">${stock.alertType}</div>
                    </div>
                    <div class="stock-actions">
                        <button class="btn btn-outline btn-sm" onclick="dashboard.editStock('${stock.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="dashboard.removeStock('${stock.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateAlertsList() {
        const emptyState = document.getElementById('emptyAlerts');
        const alertsList = document.getElementById('alertsList');

        if (this.alerts.length === 0) {
            emptyState.style.display = 'block';
            alertsList.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        alertsList.style.display = 'block';

        alertsList.innerHTML = this.alerts.map(alert => `
            <div class="alert-item">
                <div class="alert-info">
                    <div class="alert-symbol">${alert.symbol}</div>
                    <div class="alert-message">${alert.message}</div>
                </div>
                <div class="alert-time">
                    ${new Date(alert.sentAt).toLocaleDateString()}<br>
                    ${new Date(alert.sentAt).toLocaleTimeString()}
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        document.getElementById('totalStocks').textContent = this.stocks.length;

        // Count alerts sent today
        const today = new Date().toDateString();
        const todayAlerts = this.alerts.filter(alert =>
            new Date(alert.sentAt).toDateString() === today
        ).length;
        document.getElementById('totalAlerts').textContent = todayAlerts;

        // Last check time
        const lastCheck = this.alerts.length > 0
            ? new Date(Math.max(...this.alerts.map(a => new Date(a.sentAt)))).toLocaleTimeString()
            : 'Never';
        document.getElementById('lastCheck').textContent = lastCheck;
    }

    updateUI() {
        // Update phone status
        const phoneConfigured = this.user.phoneNumber && this.user.carrier;
        document.getElementById('phoneStatus').textContent = phoneConfigured ? 'Configured' : 'Not Set';

        // Update activity
        this.updateActivity();
    }

    updateActivity() {
        const activityList = document.getElementById('activityList');
        const activities = [];

        // Add recent activities based on user data
        if (this.user.phoneNumber) {
            activities.push({
                icon: 'fas fa-mobile-alt',
                message: `Phone number configured: ***-***-${this.user.phoneNumber.slice(-4)}`,
                time: 'Recently'
            });
        }

        if (this.stocks.length > 0) {
            activities.push({
                icon: 'fas fa-chart-line',
                message: `Monitoring ${this.stocks.length} stock${this.stocks.length !== 1 ? 's' : ''}`,
                time: 'Active'
            });
        }

        if (activities.length === 0) {
            activities.push({
                icon: 'fas fa-info-circle',
                message: 'Welcome to StockAlerts! Add your first stock to get started.',
                time: 'Just now'
            });
        }

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.message}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    async apiCall(endpoint, options = {}) {
        // Use Railway backend URL in production, localhost in development
        const API_BASE = window.location.hostname === 'localhost'
            ? 'http://localhost:3000'
            : 'https://your-app.railway.app'; // Replace with your actual Railway URL

        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            }
        };

        const config = { ...defaultOptions, ...options };

        const response = await fetch(API_BASE + endpoint, config);
        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || 'API request failed');
            error.status = response.status;
            throw error;
        }

        return data;
    }

    logout() {
        localStorage.removeItem('authToken');
        window.location.href = '/';
    }

    redirectToLogin() {
        window.location.href = '/?error=unauthorized';
    }

    showNotification(message, type = 'info') {
        // Use the notification system from main.js
        if (window.StockAlerts && window.StockAlerts.showNotification) {
            window.StockAlerts.showNotification(message, type);
        } else {
            alert(message); // Fallback
        }
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;

function initDashboard() {
    dashboard = new StockAlertsDashboard();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

// Export for global access
window.dashboard = dashboard;