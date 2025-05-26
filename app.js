// Main Three.js application
let scene, camera, renderer, controls;
let museumGroup, exhibits = [];
let currentPosition = new THREE.Vector3(0, 1.6, 0);
let targetPosition = currentPosition.clone();
let isDragging = false;
let previousMouseX = 0;
let scrollSpeed = 0.5;
let loadingManager;
let loadingScreen = document.getElementById('loadingScreen');

// Museum configuration
const museumConfig = {
    length: 100, // Length of the museum in units
    width: 30,   // Width of the museum in units (wider for side exhibits)
    height: 10,  // Height of the museum in units
    exhibitCount: 10,
    spacing: 8   // Space between exhibits
};

// Exhibit data
const exhibitData = [
    // Left side exhibits (odd numbers)
    {
        title: "Ancient Greek Vase",
        description: "This exquisite vase dates back to 500 BCE and was used for storing wine. The intricate patterns depict scenes from Greek mythology.",
        videoId: "dQw4w9WgXcQ",
        model: "models/model1.stl",
        position: 0,
        side: 'left',
        xOffset: -8
    },
    {
        title: "Renaissance Sculpture",
        description: "Marble sculpture from the Italian Renaissance period, circa 1500. This piece exemplifies the revival of classical forms.",
        videoId: "dQw4w9WgXcQ",
        model: "models/model3.stl",
        position: 2,
        side: 'left',
        xOffset: -8
    },
    {
        title: "Art Nouveau Lamp",
        description: "Handcrafted Tiffany-style lamp from the early 20th century. Featuring organic forms and vibrant stained glass.",
        videoId: "dQw4w9WgXcQ",
        model: "models/model5.stl",
        position: 4,
        side: 'left',
        xOffset: -8
    },
    {
        title: "Space Age Prototype",
        description: "Early model of a satellite component from the 1960s space race. This aluminum and titanium piece represents cutting-edge technology.",
        videoId: "dQw4w9WgXcQ",
        model: "models/model7.stl",
        position: 6,
        side: 'left',
        xOffset: -8
    },
    {
        title: "Contemporary Art Installation",
        description: "Interactive kinetic sculpture from a 21st century multimedia artist exploring technology and human perception.",
        videoId: "dQw4w9WgXcQ",
        model: "models/model9.stl",
        position: 8,
        side: 'left',
        xOffset: -8
    },
    // Right side exhibits (even numbers)
    {
        title: "Medieval Knight Armor",
        description: "Full plate armor from the 15th century, worn by knights in the Hundred Years' War. Weighing approximately 50 pounds.",
        videoId: "dQw4w9WgXcQ",
        model: "models/model2.stl",
        position: 1,
        side: 'right',
        xOffset: 8
    },
    {
        title: "Industrial Revolution Machine",
        description: "Early steam engine component from the 18th century that powered the first factories, revolutionizing production methods.",
        videoId: "dQw4w9WgXcQ",
        model: "models/model4.stl",
        position: 3,
        side: 'right',
        xOffset: 8
    },
    {
        title: "Modernist Chair",
        description: "Bauhaus-inspired chair from the 1920s, combining form and function with minimalist design using tubular steel and leather.",
        videoId: "dQw4w9WgXcQ",
        model: "models/model6.stl",
        position: 5,
        side: 'right',
        xOffset: 8
    },
    {
        title: "Digital Revolution",
        description: "First generation microprocessor from the 1970s that powered early personal computers, containing thousands of transistors.",
        videoId: "dQw4w9WgXcQ",
        model: "models/model8.stl",
        position: 7,
        side: 'right',
        xOffset: 8
    },
    {
        title: "Futuristic Concept Car",
        description: "Scale model of an eco-friendly vehicle design proposing alternative energy solutions through hydrogen fuel cell technology.",
        videoId: "dQw4w9WgXcQ",
        model: "models/model10.stl",
        position: 9,
        side: 'right',
        xOffset: 8
    }
];

function addRotationControls(panel, exhibit) {
    const controls = document.createElement('div');
    controls.className = 'rotation-controls';

    controls.innerHTML = `
        <button class="rotate-btn up">↑</button>
        <div class="rotate-side-buttons">
            <button class="rotate-btn left">←</button>
            <button class="rotate-btn right">→</button>
        </div>
        <button class="rotate-btn down">↓</button>
    `;

    panel.appendChild(controls);

    const rotateStep = 0.1;
    controls.querySelector('.up').addEventListener('click', () => {
        exhibit.mesh.rotation.x -= rotateStep;
    });
    controls.querySelector('.down').addEventListener('click', () => {
        exhibit.mesh.rotation.x += rotateStep;
    });
    controls.querySelector('.left').addEventListener('click', () => {
        exhibit.mesh.rotation.y -= rotateStep;
    });
    controls.querySelector('.right').addEventListener('click', () => {
        exhibit.mesh.rotation.y += rotateStep;
    });
}

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 5); // Starts 5 units inside the museum
    currentPosition.set(0, 1.6, 5);
    targetPosition = currentPosition.clone();
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Set up loading manager
    loadingManager = new THREE.LoadingManager(
        // Loaded callback
        () => {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1000);
        }
    );
    
    // Create museum environment
    createMuseum();
    
    // Load exhibits
    loadExhibits();
    
    // Add lights
    addLights();
    
    // Add event listeners
    setupEventListeners();
    
    // Add instructions
    addInstructions();
    
    // Start animation loop
    animate();
}

// Create museum environment
function createMuseum() {
    museumGroup = new THREE.Group();
    scene.add(museumGroup);
    museumGroup.position.z = -40;
    
    // Floor (red carpet)
    const floorGeometry = new THREE.PlaneGeometry(museumConfig.width, museumConfig.length);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B0000, 
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    museumGroup.add(floor);
    
    // Ceiling (white)
    const ceilingGeometry = new THREE.PlaneGeometry(museumConfig.width, museumConfig.length);
    const ceilingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF, 
        roughness: 0.4,
        metalness: 0.1
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = museumConfig.height;
    ceiling.receiveShadow = true;
    museumGroup.add(ceiling);
    
    // Left wall (dark gray)
    const leftWallGeometry = new THREE.PlaneGeometry(museumConfig.length, museumConfig.height);
    const leftWallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        roughness: 0.7,
        metalness: 0.1
    });
    const leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-museumConfig.width/2, museumConfig.height/2, 0);
    leftWall.receiveShadow = true;
    museumGroup.add(leftWall);
    
    // Right wall (dark gray)
    const rightWallGeometry = new THREE.PlaneGeometry(museumConfig.length, museumConfig.height);
    const rightWallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        roughness: 0.7,
        metalness: 0.1
    });
    const rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(museumConfig.width/2, museumConfig.height/2, 0);
    rightWall.receiveShadow = true;
    museumGroup.add(rightWall);
    
    // Back wall (dark gray)
    const backWallGeometry = new THREE.PlaneGeometry(museumConfig.width, museumConfig.height);
    const backWallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        roughness: 0.7,
        metalness: 0.1
    });
    const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
    backWall.position.set(0, museumConfig.height/2, -museumConfig.length/2);
    backWall.receiveShadow = true;
    museumGroup.add(backWall);
}

// Add lights to the scene
function addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    // Directional light (like sunlight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Spotlights for each exhibit
    exhibitData.forEach((exhibit) => {
        const spotlight = new THREE.SpotLight(0xffffff, 1.5, 20, Math.PI/6, 0.5, 0.5);
        spotlight.position.set(exhibit.xOffset, museumConfig.height - 1, -exhibit.position * museumConfig.spacing - 5);
        spotlight.target.position.set(exhibit.xOffset, 1.5, -exhibit.position * museumConfig.spacing - 5);
        spotlight.castShadow = true;
        spotlight.shadow.mapSize.width = 1024;
        spotlight.shadow.mapSize.height = 1024;
        scene.add(spotlight);
        scene.add(spotlight.target);
    });
}

// Load exhibits
function loadExhibits() {
    const stlLoader = new THREE.STLLoader(loadingManager);
    
    exhibitData.forEach((exhibit, index) => {
        // Position along the museum length
        const zPosition = -exhibit.position * museumConfig.spacing - 5;
        
        // Load STL model
        stlLoader.load(exhibit.model, (geometry) => {
            const material = new THREE.MeshStandardMaterial({ 
                color: 0xaaaaaa, 
                metalness: 0.5,
                roughness: 0.7
            });
            const mesh = new THREE.Mesh(geometry, material);
            
            // Center and scale the model
            geometry.computeBoundingBox();
            const boundingBox = geometry.boundingBox;
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            mesh.geometry.translate(-center.x, -center.y, -center.z);
            
            // Scale to reasonable size
            const size = boundingBox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            mesh.scale.set(scale, scale, scale);
            
            mesh.position.set(exhibit.xOffset, 1.5, zPosition);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            
            // Create exhibit panel
            const exhibitObject = {
                mesh: mesh,
                position: zPosition,
                panel: null,
                xOffset: exhibit.xOffset,
                title: exhibit.title,
                description: exhibit.description,
                videoId: exhibit.videoId
            };

            exhibits.push(exhibitObject);
            createExhibitPanel(exhibitObject);

        });
    });
}

// Create exhibit information panel
function createExhibitPanel(exhibit) {
    const panel = document.createElement('div');
    panel.className = 'exhibit-panel';

    panel.innerHTML = `
        <h3 class="exhibit-title">${exhibit.title}</h3>
        <div class="video-container">
            <iframe src="https://www.youtube.com/embed/${exhibit.videoId}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>
        </div>
        <button class="toggle-description">Show Description ▼</button>
        <div class="exhibit-description">${exhibit.description}</div>
    `;

    // Style override to guarantee visibility
    panel.style.position = 'absolute';
    panel.style.opacity = 1;
    panel.style.display = 'block';
    panel.style.pointerEvents = 'auto';
    panel.style.zIndex = '9999';

    document.body.appendChild(panel);

    // Toggle button
    const toggleBtn = panel.querySelector('.toggle-description');
    const description = panel.querySelector('.exhibit-description');

    toggleBtn.addEventListener('click', () => {
        description.classList.toggle('expanded');
        toggleBtn.textContent = description.classList.contains('expanded')
            ? 'Hide Description ▲'
            : 'Show Description ▼';
    });

    addRotationControls(panel, exhibit); // ✅ Add the controls

    exhibit.panel = panel;
}


// Update exhibit panels positions
function updateExhibitPanels() {
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    exhibits.forEach(exhibit => {
        if (!exhibit.panel || !exhibit.mesh) return;

        const modelPos = new THREE.Vector3();
        exhibit.mesh.getWorldPosition(modelPos);

        // Compute distance to camera
        const distance = camera.position.distanceTo(modelPos);
        const visibilityThreshold = 5; // Distance at which the panel appears

        if (distance > visibilityThreshold) {
            // Too far — hide and disable interaction
            exhibit.panel.style.opacity = '0';
            exhibit.panel.style.pointerEvents = 'none';
            exhibit.panel.style.display = 'none';
            return;
        }

        // Visible and interactive
        exhibit.panel.style.display = 'block';

        // Calculate screen position with offset
        const offset = new THREE.Vector3()
            .crossVectors(camera.up, cameraDirection)
            .normalize()
            .multiplyScalar(1.5);
        const panelWorldPos = modelPos.clone().add(offset);

        const projected = panelWorldPos.clone().project(camera);
        const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(projected.y * 0.5) + 0.5) * window.innerHeight;

        exhibit.panel.style.left = `${x - 175}px`;
        exhibit.panel.style.top = `${y - 120}px`;

        // Fade in closer we get
        const opacity = Math.max(0, 1 - (distance / visibilityThreshold));
        exhibit.panel.style.opacity = opacity;
        exhibit.panel.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
    });
}





// Set up event listeners
function setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Mouse drag to look around (only rotate camera now)
    document.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMouseX = e.clientX;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - previousMouseX;
        previousMouseX = e.clientX;
        
        // Rotate only the camera around Y axis
        camera.rotation.y -= deltaX * 0.005;
    });
    
    // Mouse wheel to move forward/backward
    document.addEventListener('wheel', (e) => {
    e.preventDefault();

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyEuler(camera.rotation).normalize();
    direction.y = 0;
    direction.multiplyScalar(e.deltaY * scrollSpeed * 0.01);
    targetPosition.add(direction);

    // Clamp all axes
    const minX = -museumConfig.width / 2 + 3;  // avoid crossing left wall
    const maxX = museumConfig.width / 2 - 5;   // avoid crossing right wall
    const minY = 1.4;                            // keep camera above ground
    const maxY = 2.0;
    const minZ = -museumConfig.length + 15 ;       // near back wall
    const maxZ = 5;                              // entrance

    targetPosition.x = Math.max(minX, Math.min(maxX, targetPosition.x));
    targetPosition.y = Math.max(minY, Math.min(maxY, targetPosition.y));
    targetPosition.z = Math.max(minZ, Math.min(maxZ, targetPosition.z));

});
    
    // Touch events for mobile
    document.addEventListener('touchstart', (e) => {
        isDragging = true;
        previousMouseX = e.touches[0].clientX;
    });
    
    document.addEventListener('touchend', () => {
        isDragging = false;
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const deltaX = e.touches[0].clientX - previousMouseX;
        previousMouseX = e.touches[0].clientX;
        
        camera.rotation.y -= deltaX * 0.005;
    });
}

// Add instructions overlay
function addInstructions() {
    const instructions = document.createElement('div');
    instructions.className = 'instructions';
    instructions.textContent = 'Scroll to move • Click and drag to look around';
    document.body.appendChild(instructions);
    
    // Hide after 5 seconds
    setTimeout(() => {
        instructions.style.opacity = '0';
        setTimeout(() => {
            instructions.style.display = 'none';
        }, 1000);
    }, 5000);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Smooth movement
    currentPosition.lerp(targetPosition, 0.1);
    camera.position.copy(currentPosition);
    
    // Update exhibit panels
    updateExhibitPanels();
    
    renderer.render(scene, camera);
}

// Start the application
init();