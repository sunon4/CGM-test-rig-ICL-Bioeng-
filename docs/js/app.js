class AppManager {
    constructor() {
        this.content = siteContent;
        this.navigationManager = null;
        this.accessibilityManager = null;
        this.performanceManager = null;
        
        this.initialize();
    }

    initialize() {
        try {
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
        console.error('Application error:', error);
    }
}

class NavigationManager {
    constructor() {
        this.currentSection = 'background';
        this.sections = document.querySelectorAll('.section');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.progressDots = document.querySelectorAll('.progress-dot');
        this.sidebar = document.getElementById('sidebar');
        this.mobileToggle = document.getElementById('mobileMenuToggle');
        
        this.initializeEventListeners();
        this.initializeIntersectionObserver();
    }

    initializeEventListeners() {
        // Navigation click handlers
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('data-section');
                this.navigateToSection(targetSection);
            });
        });

        // Progress dot click handlers
        this.progressDots.forEach(dot => {
            dot.addEventListener('click', () => {
                const targetSection = dot.getAttribute('data-section');
                this.navigateToSection(targetSection);
            });
        });

        // Mobile menu toggle
        this.mobileToggle?.addEventListener('click', () => {
            this.sidebar.classList.toggle('open');
        });

        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 1200 && 
                !this.sidebar.contains(e.target) && 
                !this.mobileToggle.contains(e.target)) {
                this.sidebar.classList.remove('open');
            }
        });

        // Keyboard navigation support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.handleKeyboardNavigation(e.key);
            }
        });
    }

    initializeIntersectionObserver() {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -20% 0px',
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    const sectionId = entry.target.id;
                    this.updateActiveNavigation(sectionId);
                }
            });
        }, observerOptions);

        this.sections.forEach(section => {
            observer.observe(section);
        });
    }

    navigateToSection(sectionId) {
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            if (window.innerWidth < 1200) {
                this.sidebar.classList.remove('open');
            }
        }
    }

    updateActiveNavigation(sectionId) {
        this.currentSection = sectionId;
        
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });

        this.progressDots.forEach(dot => {
            dot.classList.remove('active');
            if (dot.getAttribute('data-section') === sectionId) {
                dot.classList.add('active');
            }
        });
    }

    handleKeyboardNavigation(key) {
        const sectionIds = ['background', 'features', 'resources', 'about'];
        const currentIndex = sectionIds.indexOf(this.currentSection);
        
        let newIndex;
        if (key === 'ArrowDown') {
            newIndex = Math.min(currentIndex + 1, sectionIds.length - 1);
        } else {
            newIndex = Math.max(currentIndex - 1, 0);
        }
        
        if (newIndex !== currentIndex) {
            this.navigateToSection(sectionIds[newIndex]);
        }
    }
}

class AccessibilityManager {
    constructor() {
        this.initializeAccessibilityFeatures();
    }

    initializeAccessibilityFeatures() {
        this.addSkipNavigation();
        this.manageFocusStates();
        this.addLiveRegions();
    }

    addSkipNavigation() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #6B7A8F;
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 10000;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    manageFocusStates() {
        const focusableElements = document.querySelectorAll(
            'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.style.outline = '2px solid #6B7A8F';
                element.style.outlineOffset = '2px';
            });
            
            element.addEventListener('blur', () => {
                element.style.outline = '';
                element.style.outlineOffset = '';
            });
        });
    }

    addLiveRegions() {
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(liveRegion);
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'class' &&
                    mutation.target.classList.contains('active')) {
                    const sectionName = mutation.target.textContent;
                    liveRegion.textContent = `Navigated to ${sectionName} section`;
                }
            });
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            observer.observe(link, { attributes: true });
        });
    }
}

class PerformanceManager {
    constructor() {
        this.initializePerformanceOptimizations();
    }

    initializePerformanceOptimizations() {
        this.setupLazyLoading();
        this.optimizeScrollHandlers();
        this.preloadCriticalResources();
    }

    setupLazyLoading() {
        const lazyElements = document.querySelectorAll('img, video, iframe');
        
        if ('IntersectionObserver' in window) {
            const lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        
                        if (element.dataset.src) {
                            element.src = element.dataset.src;
                            element.classList.add('fade-in');
                        }
                        
                        lazyObserver.unobserve(element);
                    }
                });
            });
            
            lazyElements.forEach(element => {
                lazyObserver.observe(element);
            });
        }
    }

    optimizeScrollHandlers() {
        let isScrolling = false;
        
        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                requestAnimationFrame(() => {
                    this.updateScrollProgress();
                    isScrolling = false;
                });
                isScrolling = true;
            }
        });
    }

    updateScrollProgress() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = scrollTop / docHeight;
        document.documentElement.style.setProperty('--scroll-progress', scrollPercent);
    }

    preloadCriticalResources() {
        const fonts = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
        ];

        fonts.forEach(font => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = font;
            link.as = 'style';
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if ('IntersectionObserver' in window) {
        window.app = new AppManager();
    } else {
        console.warn('Some features may not be available in this browser');
        initializeFallbackBehavior();
    }
}); 