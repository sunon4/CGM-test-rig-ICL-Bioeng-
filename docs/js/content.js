const siteContent = {
    navigation: [
        { id: 'hero', label: 'Home', active: true },
        { id: 'gallery', label: 'Gallery', active: false },
        { id: 'resources', label: 'Resources', active: false },
        { id: 'contact', label: 'Contact', active: false }
    ],
    background: `
        <h2>Advancing CGM Technology</h2>
        <p>Our test-rig platform represents a significant leap forward in continuous glucose monitoring (CGM) sensor validation and development. We combine precision engineering with intuitive design to accelerate your development process.</p>
    `,
    resources: [
        {
            title: 'Technical Documentation',
            description: 'Comprehensive guides and specifications for implementation.',
            link: '#'
        },
        {
            title: 'API Reference',
            description: 'Detailed documentation of all available endpoints and methods.',
            link: '#'
        },
        {
            title: 'Example Code',
            description: 'Sample implementations and integration examples.',
            link: '#'
        }
    ]
};

// Make content available globally
window.siteContent = siteContent; 