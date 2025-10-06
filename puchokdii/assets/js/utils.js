// PuChokDii Shared Utilities
// Extracted from main.js for PuChokDii-specific needs

// Notification system for PuChokDii
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

    // Add Thai-specific styles
    const styles = `
        .notification {
            position: fixed;
            top: 90px;
            right: 20px;
            background: var(--thai-white);
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            z-index: 3000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
            min-width: 300px;
            border: 2px solid var(--gold-light);
            font-family: 'Sarabun', sans-serif;
        }

        .notification-success {
            border-left: 4px solid var(--gold);
        }

        .notification-error {
            border-left: 4px solid var(--crimson);
        }

        .notification-info {
            border-left: 4px solid var(--indigo);
        }

        .notification-content {
            padding: 16px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
        }

        .notification-message {
            color: var(--thai-black);
            line-height: 1.5;
            flex: 1;
        }

        .notification-close {
            background: none;
            border: none;
            font-size: 18px;
            color: var(--thai-gray);
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .notification-close:hover {
            color: var(--thai-black);
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
    if (!document.querySelector('#puchokdii-notification-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'puchokdii-notification-styles';
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

// Export for global access
window.PuChokDiiUtils = {
    showNotification
};