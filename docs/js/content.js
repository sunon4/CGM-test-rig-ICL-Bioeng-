const content = {
    navigation: [
        { id: 'background', label: 'Background', active: true },
        { id: 'resources', label: 'Resources', active: false },
        { id: 'about', label: 'About', active: false }
    ],
    background: `
        <h2>Advancing CGM Technology</h2>
        <p>Our test-rig platform represents a significant leap forward in continuous glucose monitoring (CGM) sensor validation and development...</p>
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
    ],
    team: [
        {
            name: 'Dr. Sarah Chen',
            role: 'Lead Researcher',
            bio: 'Expert in biosensor development with 10+ years experience.'
        },
        {
            name: 'Michael Rodriguez',
            role: 'Senior Engineer',
            bio: 'Specializes in precision instrumentation and calibration systems.'
        },
        {
            name: 'Dr. James Wilson',
            role: 'Clinical Advisor',
            bio: 'Practicing endocrinologist with research focus in diabetes technology.'
        }
    ]
}; 