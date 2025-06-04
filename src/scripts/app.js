// DOM Elements and Initialization
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.nav-container');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelectorAll('.nav-link');
    const scrollProgress = document.getElementById('scrollProgress');
    const sections = document.querySelectorAll('.section');
    const animatedElements = document.querySelectorAll('.animate-in');

    // Navigation Toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            nav.classList.toggle('nav-open');
            navToggle.classList.toggle('active');
        });
    }

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
        
        if (scrollProgress) {
            scrollProgress.style.transform = `scaleX(${progress / 100})`;
        }
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
    const heroBackground = document.querySelector('.hero-background');
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
}); 