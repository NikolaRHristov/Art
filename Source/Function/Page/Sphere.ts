// --- Import necessary Three.js components and CSG library ---
import * as THREE from "three";
import { CSG } from "three-csg-ts";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// --- Shader Code (Ideally, load these from separate .glsl files) ---
const concreteVertexShader = `
    varying vec3 vWorldPosition;
    
	// Pass normal for potential lighting
	varying vec3 vNormal;

    void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        
		// Transform normal to view space
		vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const concreteFragmentShader = `
    varying vec3 vWorldPosition;
    
	// Receive normal
	varying vec3 vNormal;

    uniform float uMaxHeight;
    uniform float uMinHeight;
    uniform vec3 uColorTop;
    uniform vec3 uColorBottom;
    uniform float uNoiseScale;
    uniform float uGrainIntensity;
    
	// Lighting (very basic lambertian diffuse for example)
	
	// Example: sunLight.position.normalize()
	uniform vec3 uLightDirection;
    
	// Example: sunLight.color
	uniform vec3 uLightColor;    

	// Simple 2D pseudo-random function
	
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

	// Value noise (simple version)
	
    float valueNoise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
    }

    void main() {
	// Gradient based on world Z position (assuming Z is visually "up")
	
        float normalizedHeight = smoothstep(uMinHeight, uMaxHeight, vWorldPosition.z);
        vec3 gradientColor = mix(uColorBottom, uColorTop, normalizedHeight);

	// Grainy noise using world XY position
		
        
	// 0 to 1 range
		float noise = valueNoise(vWorldPosition.xy * uNoiseScale);
        
		// Remap to -1 to 1
		noise = (noise - 0.5) * 2.0;
        
		// Scale intensity
		noise *= uGrainIntensity;

        vec3 baseConcreteColor = gradientColor + noise;

	// Basic Lambertian diffuse lighting
		
        vec3 norm = normalize(vNormal);
        float diff = max(dot(norm, normalize(uLightDirection)), 0.0);
        vec3 diffuse = uLightColor * diff;

        
		// Ambient + Diffuse term
		vec3 finalColor = baseConcreteColor * (vec3(0.2) + diffuse);

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

// --- Scene Setup (Renderer, Scene, Camera, Lights) ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	60,
	window.innerWidth / window.innerHeight,
	0.1,
	1000,
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// Darker, slightly desaturated background
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

// Lighting
// Slightly brighter ambient
const ambientLight = new THREE.AmbientLight(0x505050, 1);
scene.add(ambientLight);
// A bit less intense sun
const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(8, 12, 10);
// Enable shadows for the sun
sunLight.castShadow = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Sun shadow properties
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 50;
sunLight.shadow.camera.left = -15;
sunLight.shadow.camera.right = 15;
sunLight.shadow.camera.top = 15;
sunLight.shadow.camera.bottom = -15;
scene.add(sunLight);
// Visualize shadow frustum
// const sunHelper = new THREE.CameraHelper(sunLight.shadow.camera);
// scene.add(sunHelper);

// --- Parameters ---
const sphereOriginalRadius = 4.0;
const sphereFlattenScaleZ = 0.3;
const effectiveBowlHeight = sphereOriginalRadius * sphereFlattenScaleZ;
// Adjusted for new beam style
const sphereQuadrantGap = 0.6;
// Increased for smoother bowl
const sphereSegments = 64;
const sphereRings = 32;

// Beams
// Offset between the two beams in a split pair
const crossBeamPairOffset = 0.5;
// Thickness of an individual beam in the pair
const crossBeamThickness = 0.1;
const crossBeamHeight = 0.25;
// Extends slightly beyond original radius
const crossBeamLengthFactor = 1.2;

const originalCenterLocation = new THREE.Vector3(0, 0, 0);

// --- Materials ---
// Concrete Shader Material
const concreteMaterial = new THREE.ShaderMaterial({
	vertexShader: concreteVertexShader,
	fragmentShader: concreteFragmentShader,
	uniforms: {
		// Top of the flattened bowl (approx)
		uMaxHeight: { value: effectiveBowlHeight / 2.0 },
		// Bottom of the flattened bowl (approx)
		uMinHeight: { value: -effectiveBowlHeight / 2.0 },
		// White-ish
		uColorTop: { value: new THREE.Color(0.9, 0.9, 0.9) },
		// Grey
		uColorBottom: { value: new THREE.Color(0.5, 0.5, 0.55) },
		// Adjust for grain size
		uNoiseScale: { value: 512.0 },
		// Adjust for grain visibility
		uGrainIntensity: { value: 0.05 },
		uLightDirection: {
			value: new THREE.Vector3().copy(sunLight.position).normalize(),
			// Pass light direction
		},
		uLightColor: { value: sunLight.color },
	},
	// If insides of bowl are important
	// side: THREE.DoubleSide,
});

// Dark Metal Material for Beams
const darkMetalMaterial = new THREE.MeshStandardMaterial({
	// Dark grey, slightly blue
	color: 0xffffff,
	metalness: 0.9,
	roughness: 0.4,
});

// --- 1. Create Flattened Bowl Base (for CSG operations) ---
const baseBowlGeometry = new THREE.SphereGeometry(
	sphereOriginalRadius,
	sphereSegments,
	sphereRings,
);
const baseBowlMeshForCSG = new THREE.Mesh(baseBowlGeometry);
baseBowlMeshForCSG.scale.setZ(sphereFlattenScaleZ);
baseBowlMeshForCSG.updateMatrixWorld(true);

// --- 2. Create Bowl Quadrants using CSG ---
const bowlQuadrantsFinal = [];
const cutterActualSize = sphereOriginalRadius * 1.0;
const cutterCenterOffset = sphereOriginalRadius / 2.0;
const cutterDefs = [
	{ name_suffix: "PosX_PosY", location_center_coeff: [1, 1] },
	{ name_suffix: "NegX_PosY", location_center_coeff: [-1, 1] },
	{ name_suffix: "NegX_NegY", location_center_coeff: [-1, -1] },
	{ name_suffix: "PosX_NegY", location_center_coeff: [1, -1] },
];

for (let i = 0; i < cutterDefs.length; i++) {
	const cutterDef = cutterDefs[i];
	const quadrantName = `BowlQuadrant_${cutterDef.name_suffix}`;
	const cutterGeometry = new THREE.BoxGeometry(
		cutterActualSize,
		cutterActualSize,
		sphereOriginalRadius * sphereFlattenScaleZ * 2.2,
	);
	const cutterMeshCSG = new THREE.Mesh(cutterGeometry);
	const [coeffX, coeffY] = cutterDef.location_center_coeff;
	cutterMeshCSG.position.set(
		coeffX * cutterCenterOffset,
		coeffY * cutterCenterOffset,
		0,
	);
	cutterMeshCSG.updateMatrixWorld(true);

	try {
		const baseCSG = CSG.fromMesh(baseBowlMeshForCSG);
		const cutterCSG = CSG.fromMesh(cutterMeshCSG);
		const intersectedCSG = baseCSG.intersect(cutterCSG);
		const quadrantMesh = CSG.toMesh(
			intersectedCSG,
			baseBowlMeshForCSG.matrix,
		);

		// Use new concrete shader
		quadrantMesh.material = concreteMaterial;
		quadrantMesh.name = quadrantName;
		quadrantMesh.castShadow = true;
		quadrantMesh.receiveShadow = true;

		if (quadrantMesh.geometry.attributes.position.count === 0) {
			console.warn(
				`!!!! WARNING: CSG for ${quadrantName} resulted in EMPTY MESH.`,
			);
			continue;
		}
		bowlQuadrantsFinal.push(quadrantMesh);
		scene.add(quadrantMesh);
	} catch (e) {
		console.error(
			`----------- ERROR during CSG for ${quadrantName}: ${e} -----------`,
		);
		continue;
	}
}

// Positioning Bowl Quadrants
if (bowlQuadrantsFinal.length === 4) {
	bowlQuadrantsFinal.forEach((part) => {
		let xDir = 0,
			yDir = 0;
		if (part.name.includes("PosX")) xDir = 1;
		else if (part.name.includes("NegX")) xDir = -1;
		if (part.name.includes("PosY")) yDir = 1;
		else if (part.name.includes("NegY")) yDir = -1;
		if (xDir !== 0 && yDir !== 0) {
			const offsetDirection = new THREE.Vector3(
				xDir,
				yDir,
				0,
			).normalize();
			part.position
				.copy(originalCenterLocation)
				.addScaledVector(offsetDirection, sphereQuadrantGap);
		}
	});
} else {
	console.error("ERROR: Not enough bowl quadrants created for positioning.");
}

// --- 3. Beams in Gaps (SPLIT Cross Beams) ---
const allBeams = [];
console.log("DEBUG: Creating SPLIT cross beams...");

// Length of one arm from center
const crossBeamArmLength = sphereOriginalRadius * crossBeamLengthFactor;
// Z position of beams
const crossBeamZLevel = originalCenterLocation.z - effectiveBowlHeight * -0.8;

// Create SPLIT beams along X-axis
for (let sign = -1; sign <= 1; sign += 2) {
	// -1 and 1
	const beamX1 = new THREE.Mesh(
		new THREE.BoxGeometry(
			crossBeamArmLength,
			crossBeamThickness,
			crossBeamHeight,
		),
		darkMetalMaterial,
	);
	beamX1.name = `CrossBeam_X_Arm${sign > 0 ? "Pos" : "Neg"}_1`;
	// Position one arm of the pair, then the other
	// Center of this beam arm will be at (sign * crossBeamArmLength / 2, crossBeamPairOffset / 2, crossBeamZLevel)
	beamX1.position.set(
		(sign * crossBeamArmLength) / 2,
		(sign * crossBeamPairOffset) / 2,
		crossBeamZLevel,
	);
	beamX1.castShadow = true;
	beamX1.receiveShadow = true;
	scene.add(beamX1);
	allBeams.push(beamX1);

	const beamX2 = new THREE.Mesh(
		new THREE.BoxGeometry(
			crossBeamArmLength,
			crossBeamThickness,
			crossBeamHeight,
		),
		darkMetalMaterial,
	);
	beamX2.name = `CrossBeam_X_Arm${sign > 0 ? "Pos" : "Neg"}_2`;
	beamX2.position.set(
		(sign * crossBeamArmLength) / 2,
		(-sign * crossBeamPairOffset) / 2,
		crossBeamZLevel,
	);
	beamX2.castShadow = true;
	beamX2.receiveShadow = true;
	scene.add(beamX2);
	allBeams.push(beamX2);
}
console.log("DEBUG: Created X-axis split beams");

// Create SPLIT beams along Y-axis
for (let sign = -1; sign <= 1; sign += 2) {
	// -1 and 1
	const beamY1 = new THREE.Mesh(
		new THREE.BoxGeometry(
			crossBeamThickness,
			crossBeamArmLength,
			crossBeamHeight,
			// Note swapped X/Y dimensions
		),
		darkMetalMaterial,
	);
	beamY1.name = `CrossBeam_Y_Arm${sign > 0 ? "Pos" : "Neg"}_1`;
	beamY1.position.set(
		(sign * crossBeamPairOffset) / 2,
		(sign * crossBeamArmLength) / 2,
		crossBeamZLevel,
	);
	beamY1.castShadow = true;
	beamY1.receiveShadow = true;
	scene.add(beamY1);
	allBeams.push(beamY1);

	const beamY2 = new THREE.Mesh(
		new THREE.BoxGeometry(
			crossBeamThickness,
			crossBeamArmLength,
			crossBeamHeight,
		),
		darkMetalMaterial,
	);
	beamY2.name = `CrossBeam_Y_Arm${sign > 0 ? "Pos" : "Neg"}_2`;
	beamY2.position.set(
		(-sign * crossBeamPairOffset) / 2,
		(sign * crossBeamArmLength) / 2,
		crossBeamZLevel,
	);
	beamY2.castShadow = true;
	beamY2.receiveShadow = true;
	scene.add(beamY2);
	allBeams.push(beamY2);
}
console.log("DEBUG: Created Y-axis split beams");

// --- Camera and Controls Setup ---
const camDistanceTop = sphereOriginalRadius * 3.0;
// Raise camera a bit more
camera.position.set(0, 0, camDistanceTop + effectiveBowlHeight);
camera.lookAt(0, 0, 0);
scene.add(camera);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = true;
controls.minDistance = sphereOriginalRadius * 0.5;
// Increased max distance
controls.maxDistance = sphereOriginalRadius * 15;
controls.target.set(0, 0, 0);
// Keep mostly top-down, uncomment if desired
// controls.maxPolarAngle = Math.PI / 2 - 0.01;
controls.update();
console.log("OrbitControls enabled.");

// --- Animation/Render Loop ---
function animate() {
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener(
	"resize",
	() => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	},
	false,
);
