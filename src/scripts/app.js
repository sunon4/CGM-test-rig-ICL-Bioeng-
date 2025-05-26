const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();

class AppManager {
    constructor() {
        this.content = null;
        this.navigationManager = null;
        this.accessibilityManager = null;
        this.performanceManager = null;
        
        this.initialize();
    }

    async initialize() {
        try {
            // Load content from configuration
            this.content = await this.loadContent();
            
            // Initialize managers
            this.navigationManager = new NavigationManager();
            this.accessibilityManager = new AccessibilityManager();
            this.performanceManager = new PerformanceManager();
            
            // Render initial content
            this.renderContent();
            
            console.log('CGM Test-Rig Showcase initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            this.handleError(error);
        }
    }

    async loadContent() {
        try {
            const response = await fetch('../config/content.json');
            return await response.json();
        } catch (error) {
            console.error('Failed to load content:', error);
            return null;
        }
    }

    renderContent() {
        if (!this.content) return;

        // Update navigation
        this.updateNavigation();

        // Update hero section
        this.updateHeroSection();

        // Update features
        this.updateFeatures();

        // Update team section
        this.updateTeamSection();
    }

    updateNavigation() {
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu || !this.content.navigation) return;

        navMenu.innerHTML = this.content.navigation
            .map(item => `
                <li class="nav-item">
                    <a href="#${item.id}" 
                       class="nav-link ${item.active ? 'active' : ''}" 
                       data-section="${item.id}">
                        ${item.label}
                    </a>
                </li>
            `).join('');
    }

    updateHeroSection() {
        const heroSection = document.querySelector('#background .section-content');
        if (!heroSection || !this.content.hero) return;

        heroSection.innerHTML = `
            <h1>${this.content.hero.title}</h1>
            <p>${this.content.hero.subtitle}</p>
            <p>${this.content.hero.description}</p>
        `;
    }

    updateFeatures() {
        const featuresGrid = document.querySelector('#features .feature-grid');
        if (!featuresGrid || !this.content.features) return;

        featuresGrid.innerHTML = this.content.features
            .map(feature => `
                <div class="feature-card">
                    <h3>${feature.icon} ${feature.title}</h3>
                    <p>${feature.description}</p>
                </div>
            `).join('');
    }

    updateTeamSection() {
        const teamGrid = document.querySelector('#about .team-grid');
        if (!teamGrid || !this.content.team) return;

        teamGrid.innerHTML = this.content.team
            .map(member => `
                <div class="team-member">
                    <div class="member-avatar">${member.avatar}</div>
                    <h3>${member.name}</h3>
                    <p style="color: #6B7A8F; margin-bottom: 8px;">${member.role}</p>
                    <p>${member.description}</p>
                </div>
            `).join('');
    }

    handleError(error) {
        // Implement error handling UI
        console.error('Application error:', error);
    }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if ('IntersectionObserver' in window && 'fetch' in window) {
        window.app = new AppManager();
    } else {
        console.warn('Some features may not be available in this browser');
        initializeFallbackBehavior();
    }
}); 