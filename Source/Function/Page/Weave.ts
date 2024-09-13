document.addEventListener("DOMContentLoaded", () => {
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000,
	);
	const renderer = new THREE.WebGLRenderer({ antialias: true });

	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0xffffff, 1);
	document.body.appendChild(renderer.domElement);

	const light = new THREE.PointLight(0xffffff, 1, 100);
	light.position.set(10, 10, 10);
	scene.add(light);

	const ambientLight = new THREE.AmbientLight(0x404040);
	scene.add(ambientLight);

	const pipeMaterial = new THREE.ShaderMaterial({
		uniforms: {
			diffuse: { value: new THREE.Color(0x800080) },
			shininess: { value: 30.0 },
		},
		vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
		fragmentShader: `
            uniform vec3 diffuse;
            uniform float shininess;
            
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewPosition = normalize(vViewPosition);
                
                float diffuseStrength = max(dot(normal, viewPosition), 0.0);
                vec3 diffuseColor = diffuse * diffuseStrength;
                
                vec3 halfVector = normalize(viewPosition + vec3(0.0, 0.0, 1.0));
                float specularStrength = pow(max(dot(normal, halfVector), 0.0), shininess);
                vec3 specularColor = vec3(1.0, 1.0, 1.0) * specularStrength;
                
                gl_FragColor = vec4(diffuseColor + specularColor, 1.0);
            }
        `,
	});

	const createTube = (points) => {
		const curve = new THREE.CatmullRomCurve3(points);
		const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.3, 16, false);
		const tube = new THREE.Mesh(tubeGeometry, pipeMaterial);
		scene.add(tube);
	};

	const gridSize = 10;
	const spacing = 1;

	// Create horizontal tubes
	for (let i = 0; i < gridSize; i++) {
		const points = [];
		for (let j = 0; j < gridSize; j++) {
			const x = (j - gridSize / 2) * spacing;
			const y = (i - gridSize / 2) * spacing;
			const z = j % 2 === 0 ? 0.3 : -0.3;
			points.push(new THREE.Vector3(x, y, z));
		}
		createTube(points);
	}

	// Create vertical tubes
	for (let j = 0; j < gridSize; j++) {
		const points = [];
		for (let i = 0; i < gridSize; i++) {
			const x = (j - gridSize / 2) * spacing;
			const y = (i - gridSize / 2) * spacing;
			const z = i % 2 === 0 ? -0.3 : 0.3;
			points.push(new THREE.Vector3(x, y, z));
		}
		createTube(points);
	}

	camera.position.z = 10;
	camera.lookAt(scene.position);

	function animate() {
		requestAnimationFrame(animate);
		renderer.render(scene, camera);
	}

	animate();

	window.addEventListener("resize", () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	});
});
