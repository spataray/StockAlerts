// Main JavaScript for StockAlerts Frontend

// Initialize Translation System
document.addEventListener('DOMContentLoaded', function() {
    // Initialize translations for StockAlerts
    if (window.translator && window.STOCKALERTS_TRANSLATIONS) {
        window.translator.init('stockalerts', window.STOCKALERTS_TRANSLATIONS);

        // Create language toggle in navigation
        const languageToggleContainer = document.getElementById('languageToggle');
        if (languageToggleContainer) {
            window.translator.createLanguageToggle(languageToggleContainer, {
                showFlags: true,
                showText: true,
                buttonClass: 'language-toggle',
                activeClass: 'active'
            });
        }
    }
});

// DOM Elements
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const getStartedBtn = document.getElementById('getStartedBtn');
const startFreeBtn = document.getElementById('startFreeBtn');
const modalClose = document.getElementById('modalClose');
const loginForm = document.getElementById('loginForm');

// Navigation toggle for mobile
if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Modal functionality
function openModal() {
    if (loginModal) {
        loginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    if (loginModal) {
        loginModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Event listeners for modal triggers
[loginBtn, getStartedBtn, startFreeBtn].forEach(btn => {
    if (btn) {
        btn.addEventListener('click', openModal);
    }
});

// Close modal events
if (modalClose) {
    modalClose.addEventListener('click', closeModal);
}

if (loginModal) {
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            closeModal();
        }
    });
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        if (!email) {
            showNotification('Please enter your email address', 'error');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        try {
            // Update button state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            // Send magic link request
            const response = await fetch('/api/auth/send-magic-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Magic link sent! Check your email to continue.', 'success');
                closeModal();
                loginForm.reset();
            } else {
                throw new Error(data.message || 'Failed to send magic link');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification(error.message || 'Something went wrong. Please try again.', 'error');
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Add styles
    const styles = `
        .notification {
            position: fixed;
            top: 90px;
            right: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            z-index: 3000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
            min-width: 300px;
        }

        .notification-success {
            border-left: 4px solid #10b981;
        }

        .notification-error {
            border-left: 4px solid #ef4444;
        }

        .notification-info {
            border-left: 4px solid #2563eb;
        }

        .notification-content {
            padding: 16px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
        }

        .notification-message {
            color: #1e293b;
            line-height: 1.5;
            flex: 1;
        }

        .notification-close {
            background: none;
            border: none;
            font-size: 18px;
            color: #64748b;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .notification-close:hover {
            color: #1e293b;
        }

        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }

        @media (max-width: 480px) {
            .notification {
                right: 10px;
                left: 10px;
                max-width: none;
                min-width: auto;
            }
        }
    `;

    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'notification-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Add to DOM
    document.body.appendChild(notification);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Navbar scroll effect
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down
        navbar.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up
        navbar.style.transform = 'translateY(0)';
    }

    lastScrollTop = scrollTop;
});

// Phone mockup animation
function animatePhoneMockup() {
    const phoneMockup = document.querySelector('.phone-mockup');
    if (!phoneMockup) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                phoneMockup.style.animation = 'phoneFloat 3s ease-in-out infinite';
            }
        });
    });

    observer.observe(phoneMockup);

    // Add phone float animation
    const phoneStyles = `
        @keyframes phoneFloat {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-10px);
            }
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = phoneStyles;
    document.head.appendChild(styleSheet);
}

// Feature cards hover effect
function initFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');

    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Check for magic link token in URL
function checkMagicLinkToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        // Show loading state
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: Inter, sans-serif;">
                <div style="text-align: center;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #2563eb; margin-bottom: 1rem;"></i>
                    <h2 style="color: #1e293b; margin-bottom: 0.5rem;">Verifying your login...</h2>
                    <p style="color: #64748b;">Please wait while we log you in.</p>
                </div>
            </div>
        `;

        // Verify token and redirect to dashboard
        fetch('/api/auth/verify-magic-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Store auth token
                localStorage.setItem('authToken', data.token);
                // Redirect to dashboard
                window.location.href = '/dashboard.html';
            } else {
                throw new Error(data.message || 'Invalid token');
            }
        })
        .catch(error => {
            console.error('Token verification error:', error);
            // Redirect to home with error
            window.location.href = '/?error=invalid_token';
        });

        return true; // Don't run other initialization
    }

    return false;
}

// Check for error messages in URL
function checkErrorMessages() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error) {
        let message = 'An error occurred';

        switch (error) {
            case 'invalid_token':
                message = 'Invalid or expired login link. Please try again.';
                break;
            case 'email_required':
                message = 'Email address is required to continue.';
                break;
            default:
                message = 'An error occurred. Please try again.';
        }

        setTimeout(() => {
            showNotification(message, 'error');
        }, 500);

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Initialize the application
function init() {
    // Check for magic link token first
    if (checkMagicLinkToken()) {
        return; // Don't initialize other features if processing magic link
    }

    // Check for error messages
    checkErrorMessages();

    // Initialize features
    animatePhoneMockup();
    initFeatureCards();

    console.log('StockAlerts frontend initialized');
}

// Run initialization when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export functions for testing
window.StockAlerts = {
    showNotification,
    openModal,
    closeModal
};