import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js";

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000,
);

const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

// Create a transparent torus geometry
const torusRadius = 10;

const tubeRadius = 3;

const torusGeometry = new THREE.TorusGeometry(
	torusRadius,
	tubeRadius,
	100,
	100,
);

const torusMaterial = new THREE.MeshBasicMaterial({
	color: 0x888888,
	wireframe: true,
	transparent: true,
	opacity: 0.2,
});

const torus = new THREE.Mesh(torusGeometry, torusMaterial);

scene.add(torus);

// Function to create a gradient texture
function createGradientTexture(color1, color2) {
	const canvas = document.createElement("canvas");

	canvas.width = 256;

	canvas.height = 1;

	const context = canvas.getContext("2d");

	const gradient = context.createLinearGradient(0, 0, 256, 0);

	gradient.addColorStop(0, color1);

	gradient.addColorStop(1, color2);

	context.fillStyle = gradient;

	context.fillRect(0, 0, 256, 1);

	return new THREE.CanvasTexture(canvas);
}

// Function to create a leaf
function createLeaf(u, v, color1, color2) {
	const leafShape = new THREE.Shape();

	leafShape.moveTo(0, -tubeRadius);

	leafShape.quadraticCurveTo(tubeRadius * 2, 0, 0, tubeRadius);

	leafShape.quadraticCurveTo(-tubeRadius * 2, 0, 0, -tubeRadius);

	const leafGeometry = new THREE.ShapeGeometry(leafShape);

	const leafMaterial = new THREE.MeshBasicMaterial({
		map: createGradientTexture(color1, color2),
		side: THREE.DoubleSide,
		transparent: true,
		opacity: 0.8,
	});

	const leaf = new THREE.Mesh(leafGeometry, leafMaterial);

	// Position the leaf on the torus surface
	const x = (torusRadius + tubeRadius * Math.cos(v)) * Math.cos(u);

	const y = (torusRadius + tubeRadius * Math.cos(v)) * Math.sin(u);

	const z = tubeRadius * Math.sin(v);

	leaf.position.set(x, y, z);

	// Orient the leaf to face outward from the torus surface
	leaf.lookAt(torus.position);

	leaf.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

	return leaf;
}

const leaves: { mesh: any; u: number; v: number; speed: number }[] = [];

const numLeaves = 20;

// Create leaves
for (let i = 0; i < numLeaves; i++) {
	const u = (i / numLeaves) * Math.PI * 2;

	const v = (i / numLeaves) * Math.PI * 2;

	const color1 = new THREE.Color().setHSL(i / numLeaves, 1, 0.5);

	const color2 = new THREE.Color().setHSL((i + 0.5) / numLeaves, 1, 0.5);

	const leaf = createLeaf(u, v, color1.getStyle(), color2.getStyle());

	scene.add(leaf);

	leaves.push({
		mesh: leaf,
		u: u,
		v: v,
		speed: 0.005 + Math.random() * 0.005,
	});
}

camera.position.z = 30;

// Handle window resize
window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;

	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
	requestAnimationFrame(animate);

	leaves.forEach((leaf) => {
		leaf.u += leaf.speed;

		leaf.v += leaf.speed * 0.5;

		const x =
			(torusRadius + tubeRadius * Math.cos(leaf.v)) * Math.cos(leaf.u);

		const y =
			(torusRadius + tubeRadius * Math.cos(leaf.v)) * Math.sin(leaf.u);

		const z = tubeRadius * Math.sin(leaf.v);

		leaf.mesh.position.set(x, y, z);

		leaf.mesh.lookAt(torus.position);

		leaf.mesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

		// Adjust z-index for overlapping effect
		leaf.mesh.renderOrder = Math.sin(leaf.u) + Math.cos(leaf.v);
	});

	renderer.render(scene, camera);
}

animate();
