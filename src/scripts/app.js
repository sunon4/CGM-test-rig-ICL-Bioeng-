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

// DOM Elements
const nav = document.querySelector('.nav-container');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.nav-link');
const scrollProgress = document.getElementById('scrollProgress');
const sections = document.querySelectorAll('.section');
const animatedElements = document.querySelectorAll('.animate-in');

// Navigation Toggle
navToggle.addEventListener('click', () => {
    nav.classList.toggle('nav-open');
    navToggle.classList.toggle('active');
});

// Smooth Scroll for Navigation Links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            nav.classList.remove('nav-open');
            navToggle.classList.remove('active');
        }
    });
});

// Scroll Progress Indicator
function updateScrollProgress() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrolled = window.scrollY;
    const progress = (scrolled / documentHeight) * 100;
    
    scrollProgress.style.transform = `scaleX(${progress / 100})`;
}

// Intersection Observer for Animations
const observerOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: '0px'
};

const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Unobserve after animation
            intersectionObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all animated elements
animatedElements.forEach(element => {
    intersectionObserver.observe(element);
});

// Active Section Observer
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Update navigation
            const activeSection = entry.target.id;
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${activeSection}`);
            });
        }
    });
}, {
    root: null,
    threshold: 0.5
});

// Observe all sections
sections.forEach(section => {
    sectionObserver.observe(section);
});

// Parallax Effect for Hero Background
let heroBackground = document.querySelector('.hero-background');
if (heroBackground) {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
    });
}

// Form Submission Handler
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const submitButton = contactForm.querySelector('button[type="submit"]');
        
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            
            // Add your form submission logic here
            // Example:
            // await submitFormData(Object.fromEntries(formData));
            
            // Success message
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('There was an error sending your message. Please try again.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Send Message';
        }
    });
}

// Event Listeners
window.addEventListener('scroll', () => {
    updateScrollProgress();
    
    // Add/remove sticky navigation
    if (window.scrollY > 100) {
        nav.classList.add('nav-sticky');
    } else {
        nav.classList.remove('nav-sticky');
    }
});

// Initialize
updateScrollProgress(); 