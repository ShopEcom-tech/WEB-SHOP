/* ========================================
   NEXUS - THREE.JS 3D EFFECTS
   Premium Interactive Background
   ======================================== */

(function () {
    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThreeJS);
    } else {
        initThreeJS();
    }

    function initThreeJS() {
        const container = document.getElementById('three-container');
        if (!container) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 50;

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        // Mouse tracking
        const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

        document.addEventListener('mousemove', (e) => {
            mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // ========================================
        // PARTICLE SYSTEM
        // ========================================
        const particleCount = 1500;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const velocities = [];

        // Color palette
        const colorPalette = [
            new THREE.Color(0x7c3aed), // Purple
            new THREE.Color(0xdb2777), // Pink
            new THREE.Color(0xa78bfa), // Light purple
            new THREE.Color(0xf472b6), // Light pink
        ];

        for (let i = 0; i < particleCount; i++) {
            // Position - spread in 3D space
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

            // Color
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // Size variation
            sizes[i] = Math.random() * 2 + 0.5;

            // Velocity for animation
            velocities.push({
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.01,
                originalX: positions[i * 3],
                originalY: positions[i * 3 + 1],
                originalZ: positions[i * 3 + 2]
            });
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Custom shader material for particles
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uPixelRatio: { value: renderer.getPixelRatio() }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vAlpha;
                uniform float uTime;
                uniform vec2 uMouse;
                uniform float uPixelRatio;
                
                void main() {
                    vColor = color;
                    
                    vec3 pos = position;
                    
                    // Subtle wave motion
                    pos.x += sin(uTime * 0.5 + position.y * 0.1) * 0.5;
                    pos.y += cos(uTime * 0.3 + position.x * 0.1) * 0.5;
                    pos.z += sin(uTime * 0.2 + position.x * 0.05) * 0.3;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    
                    // Distance-based alpha
                    float dist = length(mvPosition.xyz);
                    vAlpha = smoothstep(100.0, 20.0, dist) * 0.8;
                    
                    gl_PointSize = size * uPixelRatio * (50.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    // Circular particle with soft edges
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;
                    
                    if (alpha < 0.01) discard;
                    
                    // Glow effect
                    vec3 glow = vColor * (1.0 + smoothstep(0.3, 0.0, dist) * 0.5);
                    
                    gl_FragColor = vec4(glow, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        // ========================================
        // GEOMETRIC SHAPES (Floating)
        // ========================================
        const shapes = [];
        const shapeGeometries = [
            new THREE.IcosahedronGeometry(3, 0),
            new THREE.OctahedronGeometry(2.5, 0),
            new THREE.TetrahedronGeometry(2, 0),
            new THREE.BoxGeometry(2, 2, 2),
        ];

        for (let i = 0; i < 8; i++) {
            const geometry = shapeGeometries[i % shapeGeometries.length];
            const material = new THREE.MeshBasicMaterial({
                color: colorPalette[i % colorPalette.length],
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 30 - 20
            );
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            shapes.push({
                mesh,
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.01,
                    y: (Math.random() - 0.5) * 0.01,
                    z: (Math.random() - 0.5) * 0.005
                },
                floatSpeed: Math.random() * 0.5 + 0.5,
                floatOffset: Math.random() * Math.PI * 2
            });

            scene.add(mesh);
        }

        // ========================================
        // CONNECTION LINES
        // ========================================
        const lineGeometry = new THREE.BufferGeometry();
        const linePositions = new Float32Array(particleCount * 6);
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x7c3aed,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending
        });

        const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lines);

        // ========================================
        // ANIMATION LOOP
        // ========================================
        let time = 0;
        const clock = new THREE.Clock();

        function updateConnections() {
            const posArray = particleGeometry.attributes.position.array;
            const lineArray = lineGeometry.attributes.position.array;
            let lineIndex = 0;
            const maxConnections = 100;
            const connectionDistance = 15;

            // Reset line positions
            for (let i = 0; i < lineArray.length; i++) {
                lineArray[i] = 0;
            }

            // Find nearby particles and connect them
            for (let i = 0; i < particleCount && lineIndex < maxConnections; i++) {
                for (let j = i + 1; j < particleCount && lineIndex < maxConnections; j++) {
                    const dx = posArray[i * 3] - posArray[j * 3];
                    const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
                    const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < connectionDistance) {
                        lineArray[lineIndex * 6] = posArray[i * 3];
                        lineArray[lineIndex * 6 + 1] = posArray[i * 3 + 1];
                        lineArray[lineIndex * 6 + 2] = posArray[i * 3 + 2];
                        lineArray[lineIndex * 6 + 3] = posArray[j * 3];
                        lineArray[lineIndex * 6 + 4] = posArray[j * 3 + 1];
                        lineArray[lineIndex * 6 + 5] = posArray[j * 3 + 2];
                        lineIndex++;
                    }
                }
            }

            lineGeometry.attributes.position.needsUpdate = true;
        }

        function animate() {
            requestAnimationFrame(animate);

            const delta = clock.getDelta();
            time += delta;

            // Smooth mouse following
            mouse.x += (mouse.targetX - mouse.x) * 0.05;
            mouse.y += (mouse.targetY - mouse.y) * 0.05;

            // Update particle shader uniforms
            particleMaterial.uniforms.uTime.value = time;
            particleMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);

            // Rotate particles based on mouse
            particles.rotation.x = mouse.y * 0.1;
            particles.rotation.y = mouse.x * 0.1;

            // Animate geometric shapes
            shapes.forEach((shape, i) => {
                shape.mesh.rotation.x += shape.rotationSpeed.x;
                shape.mesh.rotation.y += shape.rotationSpeed.y;
                shape.mesh.rotation.z += shape.rotationSpeed.z;

                // Floating motion
                shape.mesh.position.y += Math.sin(time * shape.floatSpeed + shape.floatOffset) * 0.02;
            });

            // Update connections periodically (every 10 frames for performance)
            if (Math.floor(time * 60) % 10 === 0) {
                updateConnections();
            }

            // Camera movement based on mouse
            camera.position.x += (mouse.x * 5 - camera.position.x) * 0.02;
            camera.position.y += (mouse.y * 5 - camera.position.y) * 0.02;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        }

        animate();

        // ========================================
        // RESIZE HANDLER
        // ========================================
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            particleMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
        });

        // ========================================
        // SCROLL PARALLAX
        // ========================================
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const maxScroll = document.body.scrollHeight - window.innerHeight;
            const scrollProgress = scrollY / maxScroll;

            // Move camera on scroll
            camera.position.z = 50 + scrollProgress * 30;

            // Rotate particles on scroll
            particles.rotation.z = scrollProgress * Math.PI * 0.5;
        });
    }
})();
