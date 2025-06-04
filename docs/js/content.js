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
            title: 'Report',
            description: 'Complete technical mechanism and implementation guides',
            link: 'assets/star_Group_15___DAPP_3_Project_Report_version_2_compressed.pdf'
        },
        {
            title: 'Github repo',
            description: 'code and solidwork model',
            link: 'https://github.com/sunon4/CGM-test-rig-ICL-Bioeng-'
        }
    ]
};

// Make content available globally
window.siteContent = siteContent; 