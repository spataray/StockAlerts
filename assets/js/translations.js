// Translation System for StockAlerts and PuChokDii
class TranslationSystem {
    constructor() {
        this.currentLanguage = this.getStoredLanguage() || this.detectBrowserLanguage();
        this.translations = {};
        this.fallbackLanguage = 'en';
    }

    // Get stored language preference
    getStoredLanguage() {
        return localStorage.getItem('preferred_language');
    }

    // Detect browser language
    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        return browserLang.startsWith('th') ? 'th' : 'en';
    }

    // Store language preference
    setLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('preferred_language', lang);
        this.updatePageLanguage();

        // Trigger custom event for components to update
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang }
        }));
    }

    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // Load translations for a platform
    loadTranslations(platform, translationData) {
        this.translations[platform] = translationData;
    }

    // Get translated text
    t(key, platform = 'common', variables = {}) {
        let text = this.getTranslation(key, platform);

        // Replace variables in the text
        Object.keys(variables).forEach(variable => {
            text = text.replace(`{{${variable}}}`, variables[variable]);
        });

        return text;
    }

    // Get translation with fallback
    getTranslation(key, platform) {
        const platformTranslations = this.translations[platform];

        if (!platformTranslations) {
            console.warn(`Platform "${platform}" translations not loaded`);
            return key;
        }

        const currentLangTranslations = platformTranslations[this.currentLanguage];
        const fallbackTranslations = platformTranslations[this.fallbackLanguage];

        // Try current language first
        if (currentLangTranslations && currentLangTranslations[key]) {
            return currentLangTranslations[key];
        }

        // Fallback to English
        if (fallbackTranslations && fallbackTranslations[key]) {
            return fallbackTranslations[key];
        }

        // Return key if no translation found
        console.warn(`Translation not found for key: ${key}`);
        return key;
    }

    // Update page HTML lang attribute
    updatePageLanguage() {
        document.documentElement.lang = this.currentLanguage;
    }

    // Create language toggle button
    createLanguageToggle(container, options = {}) {
        const {
            showFlags = true,
            showText = true,
            buttonClass = 'language-toggle',
            activeClass = 'active'
        } = options;

        const toggleContainer = document.createElement('div');
        toggleContainer.className = `${buttonClass}-container`;
        toggleContainer.innerHTML = `
            <div class="${buttonClass}">
                <button class="lang-btn ${this.currentLanguage === 'en' ? activeClass : ''}" data-lang="en">
                    ${showFlags ? '🇺🇸' : ''} ${showText ? 'EN' : ''}
                </button>
                <button class="lang-btn ${this.currentLanguage === 'th' ? activeClass : ''}" data-lang="th">
                    ${showFlags ? '🇹🇭' : ''} ${showText ? 'ไทย' : ''}
                </button>
            </div>
        `;

        // Add event listeners
        toggleContainer.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                this.setLanguage(lang);

                // Update button states
                toggleContainer.querySelectorAll('.lang-btn').forEach(b => b.classList.remove(activeClass));
                btn.classList.add(activeClass);
            });
        });

        if (container) {
            container.appendChild(toggleContainer);
        }

        return toggleContainer;
    }

    // Update all elements with data-translate attribute
    updateTranslatedElements(platform = 'common') {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            const translatedText = this.t(key, platform);

            if (element.hasAttribute('data-translate-html')) {
                element.innerHTML = translatedText;
            } else {
                element.textContent = translatedText;
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            const translatedText = this.t(key, platform);
            element.placeholder = translatedText;
        });

        // Update titles
        document.querySelectorAll('[data-translate-title]').forEach(element => {
            const key = element.getAttribute('data-translate-title');
            const translatedText = this.t(key, platform);
            element.title = translatedText;
        });
    }

    // Initialize translation system
    init(platform, translationData) {
        this.loadTranslations(platform, translationData);
        this.updatePageLanguage();

        // Listen for language changes
        window.addEventListener('languageChanged', () => {
            this.updateTranslatedElements(platform);
        });

        // Initial translation
        this.updateTranslatedElements(platform);
    }
}

// Global translation instance
window.translator = new TranslationSystem();

// Utility function for quick translations
window.t = (key, platform = 'common', variables = {}) => {
    return window.translator.t(key, platform, variables);
};