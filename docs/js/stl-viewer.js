class STLViewer {
    constructor(modelUrl, elementId) {
        this.modelUrl = modelUrl;
        this.elementId = elementId;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.init();
    }

    init() {
        // Get container
        const container = document.getElementById(this.elementId);
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0xf5f5f5);
        container.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.z = 5;

        // Setup lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(ambientLight);
        this.scene.add(directionalLight);

        // Add additional lights for better visibility
        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(-1, -1, -1);
        this.scene.add(backLight);

        // Setup controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 2.0;

        // Load STL
        const loader = new THREE.STLLoader();
        loader.load(this.modelUrl, (geometry) => {
            const material = new THREE.MeshPhongMaterial({ 
                color: 0x007bff,
                specular: 0x111111,
                shininess: 200
            });
            const mesh = new THREE.Mesh(geometry, material);
            
            // Center the model
            geometry.computeBoundingBox();
            const center = geometry.boundingBox.getCenter(new THREE.Vector3());
            mesh.position.sub(center);
            
            this.scene.add(mesh);
            
            // Adjust camera to fit model
            const box = new THREE.Box3().setFromObject(mesh);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            this.camera.position.z = maxDim * 2;
        });

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }
}

// Initialize viewers when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new STLViewer('assets/Stepwise mixer Noah with circular cross section - STL.STL', 'stl-viewer-1');
    new STLViewer('assets/Passive mixer with attachments FINAL VERSION v2 - PART STL6.STL', 'stl-viewer-2');
    new STLViewer('assets/Noah Sinusoidal Mixer v2 STL.STL', 'stl-viewer-3');
    new STLViewer('assets/AnnaInterface_pt1 - Noah Edit with bottom + seal and housing for the sensor V11.STL', 'stl-viewer-4');
}); 