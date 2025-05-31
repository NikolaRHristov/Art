import GUI from "lil-gui";
import * as THREE from "three";

import * as WasmModuleNamespace from "../../../Public/Function/Page/Rock/ArtRock.js";

// --- Global Variables ---
let scene: THREE.Scene;

let camera: THREE.PerspectiveCamera;

let renderer: THREE.WebGLRenderer;

let rockMesh:
	| THREE.Mesh<
			THREE.BufferGeometry<THREE.NormalBufferAttributes>,
			// Changed any to THREE.ShaderMaterial
			THREE.ShaderMaterial,
			THREE.Object3DEventMap
	  >
	// rockMesh can be undefined before first generation
	| undefined;

// rockMaterial can be undefined before first generation
let rockMaterial: THREE.ShaderMaterial | undefined;

// Define a type for the WASM module's expected parameters for better clarity
interface FBMParams {
	octaves: number;

	frequency: number;

	persistence: number;

	lacunarity: number;

	amplitude: number;

	seed_offset: number;
}

interface ScalarFieldShapeParamsForWasm {
	base_sphere_radius: number;

	base_sphere_influence: number;

	sphere_distort_fbm: FBMParams;

	large_form_fbm: FBMParams;

	medium_detail_fbm: FBMParams;

	fine_detail_fbm: FBMParams;
}

interface GridDimensions {
	width: number;

	height: number;

	depth: number;
}

interface AlbedoBakeParamsForWasm {
	base_fbm: FBMParams;

	strata_fbm: FBMParams;

	vein_fbm: FBMParams;

	vein_warp_fbm: FBMParams;

	fleck_fbm: FBMParams;

	slate_color_dark_r: number;

	slate_color_dark_g: number;

	slate_color_dark_b: number;

	slate_color_light_r: number;

	slate_color_light_g: number;

	slate_color_light_b: number;

	strata_color_r: number;

	strata_color_g: number;

	strata_color_b: number;

	strata_influence: number;

	strata_frequency_y_stretch: number;

	vein_color_primary_r: number;

	vein_color_primary_g: number;

	vein_color_primary_b: number;

	vein_threshold: number;

	fleck_color_r: number;

	fleck_color_g: number;

	fleck_color_b: number;

	fleck_threshold: number;
}

interface HeightBakeParamsForWasm {
	base_fbm: FBMParams;

	detail_fbm: FBMParams;

	detail_blend_factor: number;

	overall_amplitude: number;
}

interface NormalBakeParamsForWasm {
	strength: number;
}

interface RoughnessBakeParamsForWasm {
	fbm_params: FBMParams;

	min_roughness: number;

	max_roughness: number;
}

interface AoBakeParamsForWasm {
	fbm_params: FBMParams;

	strength: number;
}

type WasmModuleType = typeof WasmModuleNamespace & {
	default: () => Promise<void>;
};

let wasmModule: WasmModuleType;

let clock = new THREE.Clock();

let currentGlobalSeed: number;

let gui: GUI;

// Baked Textures
let bakedAlbedoMap: THREE.DataTexture | null = null;

let bakedHeightMapData: Float32Array | null = null;

let bakedHeightMapTexture: THREE.DataTexture | null = null;

let bakedNormalMap: THREE.DataTexture | null = null;

let bakedRoughnessMap: THREE.DataTexture | null = null;

let bakedAOMap: THREE.DataTexture | null = null;

// DOM Elements
const rockContainer = document.getElementById("rock-container");

const loadingIndicator = document.getElementById("loading-indicator");

const seedDisplay = document.getElementById("seedDisplay");

// --- Configuration Object for UI & Parameters ---
const config = {
	// Generation
	// Initial random seed
	seed: Math.floor(Math.random() * 100000),

	grid: { width: 48, height: 48, depth: 48 },

	isoLevel: 0.0,

	scalarField: {
		baseSphereRadius: 0.9,

		baseSphereInfluence: 1.5,

		sphereDistortFBM: {
			// FBMParams
			octaves: 3,

			frequency: 1.2,

			persistence: 0.5,

			lacunarity: 2.0,

			amplitude: 0.2,

			seed_offset: 10,
		},

		largeFormFBM: {
			// FBMParams
			octaves: 5,

			frequency: 0.3,

			persistence: 0.5,

			lacunarity: 2.0,

			amplitude: 0.35,

			seed_offset: 20,
		},

		mediumDetailFBM: {
			// FBMParams
			octaves: 6,

			frequency: 0.9,

			persistence: 0.45,

			lacunarity: 2.2,

			amplitude: 0.15,

			seed_offset: 30,
		},

		fineDetailFBM: {
			// FBMParams
			octaves: 7,

			frequency: 2.5,

			persistence: 0.4,

			lacunarity: 2.3,

			amplitude: 0.05,

			seed_offset: 40,
		},
	},

	meshConstruction: {
		worldSize: 2.0,
	},

	// Material & Shaders
	synthesisProgress: 1.0,

	triPlanarBlendSharpness: 8.0,

	albedo: {
		useBaked: false,

		slateColorLight: "#8c8c96",

		slateColorDark: "#404048",

		baseFBM: {
			// FBMParams
			octaves: 5,

			persistence: 0.5,

			lacunarity: 2.0,

			frequency: 0.2,

			amplitude: 1.0,

			seed_offset: 100,
		},

		strataColor: "#605048",

		strataInfluence: 0.25,

		strataFreqYStretch: 0.1,

		strataFBM: {
			// FBMParams
			octaves: 4,

			persistence: 0.5,

			lacunarity: 2.0,

			frequency: 0.15,

			amplitude: 1.0,

			seed_offset: 110,
		},

		veinColorPrimary: "#a0a5b0",

		veinsThreshold: 0.75,

		veinsFBM: {
			// FBMParams
			octaves: 6,

			persistence: 0.4,

			lacunarity: 2.2,

			frequency: 0.3,

			amplitude: 1.0,

			seed_offset: 120,
		},

		veinsWarpFBM: {
			// FBMParams
			octaves: 3,

			persistence: 0.5,

			lacunarity: 2.0,

			frequency: 0.5,

			amplitude: 0.1,

			seed_offset: 125,
		},

		fleckColor: "#c0b0a0",

		flecksThreshold: 0.88,

		flecksFBM: {
			// FBMParams
			octaves: 7,

			persistence: 0.3,

			lacunarity: 2.8,

			frequency: 2.5,

			amplitude: 1.0,

			seed_offset: 130,
		},
	},

	roughness: {
		useBaked: false,

		min: 0.3,

		max: 0.9,

		fbm: {
			// FBMParams
			octaves: 5,

			persistence: 0.55,

			lacunarity: 1.9,

			frequency: 0.25,

			amplitude: 1.0,

			seed_offset: 150,
		},
	},

	ao: {
		useBaked: false,

		strength: 0.7,

		fbm: {
			// FBMParams
			octaves: 4,

			persistence: 0.6,

			lacunarity: 1.8,

			frequency: 0.1,

			amplitude: 1.0,

			seed_offset: 160,
		},
	},

	normalDetail: {
		useBaked: false,

		strength: 0.4,

		fbm: {
			// FBMParams
			octaves: 6,

			persistence: 0.45,

			lacunarity: 2.1,

			frequency: 1.8,

			amplitude: 0.1,

			seed_offset: 200,
		},
	},

	pom: {
		enable: true,

		useBakedHeight: false,

		heightScaleEffect: 0.04,

		minSteps: 8,

		maxSteps: 48,

		worldSpaceUVScale: 0.05,

		heightFBM: {
			// FBMParams
			octaves: 5,

			persistence: 0.5,

			lacunarity: 2.0,

			frequency: 0.6,

			amplitude: 1.0,

			seed_offset: 300,
		},
	},

	dust: {
		color: "#968D82",

		accumulationFactor: 0.4,

		noiseFBM: {
			// FBMParams
			octaves: 4,

			persistence: 0.5,

			lacunarity: 2.0,

			frequency: 0.8,

			amplitude: 0.6,

			seed_offset: 400,
		},
	},

	waterStreaks: {
		color: "#302820",

		influence: 0.3,

		roughnessFactor: 0.4,

		verticalStretch: 5.0,

		flowSpeed: 0.01,

		fbm: {
			// FBMParams
			octaves: 5,

			persistence: 0.5,

			lacunarity: 2.0,

			frequency: 0.3,

			amplitude: 1.0,

			seed_offset: 500,
		},
	},

	lichen: {
		color: "#405030",

		coverage: 0.2,

		threshold: 0.6,

		smoothness: 0.1,

		roughness: 0.8,

		upwardBias: 0.2,

		aoInfluence: 0.3,

		fbm: {
			// FBMParams
			octaves: 6,

			persistence: 0.45,

			lacunarity: 2.1,

			frequency: 1.2,

			amplitude: 1.0,

			seed_offset: 600,
		},
	},

	revealFBM: {
		// FBMParams
		octaves: 4,

		persistence: 0.5,

		lacunarity: 2.0,

		frequency: 0.15,

		amplitude: 1.0,

		seed_offset: 700,
	},

	actions: {
		regenerate: () => {
			generateAndDisplayRock();
		},

		bakeAllTextures: () => {
			bakeAllTextures();
		},

		giftRock: () => {
			giftRock();
		},

		savePreset: () => {
			saveCurrentPresetToLocalStorage();
		},

		loadPreset: () => {
			// Will be properly assigned later
			loadSelectedPreset();
		},
	},

	presets: {
		currentPresetName: "MyRock",

		selectedPreset: "Default Slate",

		// Added for type safety
		availablePresets: [] as string[],
	},
};

// Type for a preset configuration (essentially config minus functions)
// This is a simplified version. A more robust solution might involve mapped types.
type PresetConfig = Omit<typeof config, "actions">;

// --- WASM Loader ---
async function initWasm() {
	try {
		// @ts-expect-error: Dynamic import from JS file, TypeScript might not fully resolve its type
		const wasm = await import("/Public/Function/Page/Rock/ArtRock.js");

		await wasm.default();

		wasmModule = wasm as WasmModuleType;

		console.log("WASM Module Loaded:", wasmModule);

		return wasmModule;
	} catch (err) {
		console.error("Error loading WASM module:", err);

		if (loadingIndicator) {
			loadingIndicator.innerText = "Error loading WASM. Check console.";

			loadingIndicator.style.display = "block";
		}

		throw err;
	}
}

// --- Three.js Setup ---
function initThreeJS() {
	scene = new THREE.Scene();

	scene.background = new THREE.Color(0x101015);

	const aspect = window.innerWidth / window.innerHeight;

	camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);

	camera.position.set(0, 0.3, 3.0);

	camera.lookAt(0, 0, 0);

	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });

	renderer.setSize(window.innerWidth, window.innerHeight);

	renderer.setPixelRatio(window.devicePixelRatio);

	renderer.localClippingEnabled = true;

	rockContainer?.appendChild(renderer.domElement);

	const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);

	scene.add(ambientLight);

	const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);

	dirLight1.position.set(5, 10, 7);

	scene.add(dirLight1);

	const dirLight2 = new THREE.DirectionalLight(0xaaccff, 0.4);

	dirLight2.position.set(-5, -2, -5);

	scene.add(dirLight2);

	window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;

	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- lil-gui Setup ---
function setupGUI() {
	gui = new GUI();

	gui.title("Rock Generator Controls");

	// --- Generation Folder ---
	const genFolder = gui.addFolder("Generation").close();

	genFolder
		.add(config, "seed")
		.name("Main Seed")
		.min(0)
		.max(999999)
		.step(1)
		.onChange(config.actions.regenerate);

	const gridFolder = genFolder.addFolder("Grid Dimensions");

	gridFolder
		.add(config.grid, "width", 16, 128, 4)
		.name("Width")
		.onChange(config.actions.regenerate);

	gridFolder
		.add(config.grid, "height", 16, 128, 4)
		.name("Height")
		.onChange(config.actions.regenerate);

	gridFolder
		.add(config.grid, "depth", 16, 128, 4)
		.name("Depth")
		.onChange(config.actions.regenerate);

	genFolder
		.add(config, "isoLevel", -1.0, 1.0, 0.01)
		.name("Iso Level")
		.onChange(config.actions.regenerate);

	const sfFolder = genFolder.addFolder("Scalar Field Shape").close();

	sfFolder
		.add(config.scalarField, "baseSphereRadius", 0.1, 2.0, 0.05)
		.name("Base Radius")
		.onChange(config.actions.regenerate);

	sfFolder
		.add(config.scalarField, "baseSphereInfluence", 0.1, 3.0, 0.1)
		.name("Base Influence")
		.onChange(config.actions.regenerate);

	addFBMToGUI(
		sfFolder,

		config.scalarField.sphereDistortFBM,

		"Sphere Distort FBM",

		config.actions.regenerate,
	);

	addFBMToGUI(
		sfFolder,

		config.scalarField.largeFormFBM,

		"Large Form FBM",

		config.actions.regenerate,
	);

	addFBMToGUI(
		sfFolder,

		config.scalarField.mediumDetailFBM,

		"Medium Detail FBM",

		config.actions.regenerate,
	);

	addFBMToGUI(
		sfFolder,

		config.scalarField.fineDetailFBM,

		"Fine Detail FBM",

		config.actions.regenerate,
	);

	genFolder
		.add(config.meshConstruction, "worldSize", 0.5, 10.0, 0.1)
		.name("Target World Size")
		.onChange(config.actions.regenerate);

	// --- Material & Shader Folder ---
	const matFolder = gui.addFolder("Material & Shader").close();

	matFolder
		.add(config, "synthesisProgress", 0, 1, 0.01)
		.name("Synthesis")
		.listen()
		.onChange(updateMaterialUniforms);

	matFolder
		.add(config, "triPlanarBlendSharpness", 1.0, 32.0, 0.5)
		.name("Tri-Planar Blend")
		.onChange(updateMaterialUniforms);

	// Albedo
	const albedoFolder = matFolder.addFolder("Albedo").close();

	albedoFolder
		.add(config.albedo, "useBaked")
		.name("Use Baked Albedo")
		.onChange(handleBakeToggleChange);

	albedoFolder
		.addColor(config.albedo, "slateColorLight")
		.name("Slate Light")
		.onChange(updateMaterialUniforms);

	albedoFolder
		.addColor(config.albedo, "slateColorDark")
		.name("Slate Dark")
		.onChange(updateMaterialUniforms);

	addFBMToGUI(
		albedoFolder,

		config.albedo.baseFBM,

		"Base FBM",

		updateMaterialUniforms,
	);

	const strataFolder = albedoFolder.addFolder("Strata").close();

	strataFolder
		.addColor(config.albedo, "strataColor")
		.onChange(updateMaterialUniforms);

	strataFolder
		.add(config.albedo, "strataInfluence", 0, 1, 0.01)
		.onChange(updateMaterialUniforms);

	strataFolder
		.add(config.albedo, "strataFreqYStretch", 0.01, 1, 0.01)
		.name("Y Stretch")
		.onChange(updateMaterialUniforms);

	addFBMToGUI(
		strataFolder,

		config.albedo.strataFBM,

		"Strata FBM",

		updateMaterialUniforms,
	);

	const veinsFolder = albedoFolder.addFolder("Veins").close();

	veinsFolder
		.addColor(config.albedo, "veinColorPrimary")
		.name("Vein Color")
		.onChange(updateMaterialUniforms);

	veinsFolder
		.add(config.albedo, "veinsThreshold", 0, 1, 0.01)
		.name("Threshold")
		.onChange(updateMaterialUniforms);

	addFBMToGUI(
		veinsFolder,

		config.albedo.veinsFBM,

		"Veins FBM",

		updateMaterialUniforms,
	);

	addFBMToGUI(
		veinsFolder,

		config.albedo.veinsWarpFBM,

		"Vein Warp FBM",

		updateMaterialUniforms,
	);

	const flecksFolder = albedoFolder.addFolder("Flecks").close();

	flecksFolder
		.addColor(config.albedo, "fleckColor")
		.onChange(updateMaterialUniforms);

	flecksFolder
		.add(config.albedo, "flecksThreshold", 0, 1, 0.01)
		.name("Threshold")
		.onChange(updateMaterialUniforms);

	addFBMToGUI(
		flecksFolder,

		config.albedo.flecksFBM,

		"Flecks FBM",

		updateMaterialUniforms,
	);

	// Roughness
	const roughFolder = matFolder.addFolder("Roughness").close();

	roughFolder
		.add(config.roughness, "useBaked")
		.name("Use Baked Roughness")
		.onChange(handleBakeToggleChange);

	roughFolder
		.add(config.roughness, "min", 0, 1, 0.01)
		.onChange(updateMaterialUniforms);

	roughFolder
		.add(config.roughness, "max", 0, 1, 0.01)
		.onChange(updateMaterialUniforms);

	addFBMToGUI(
		roughFolder,

		config.roughness.fbm,

		"Roughness FBM",

		updateMaterialUniforms,
	);

	// Ambient Occlusion
	const aoFolder = matFolder.addFolder("Ambient Occlusion").close();

	aoFolder
		.add(config.ao, "useBaked")
		.name("Use Baked AO")
		.onChange(handleBakeToggleChange);

	aoFolder
		.add(config.ao, "strength", 0, 1, 0.01)
		.name("AO Strength")
		.onChange(updateMaterialUniforms);

	addFBMToGUI(aoFolder, config.ao.fbm, "AO FBM", updateMaterialUniforms);

	// Normal Detail
	const normalFolder = matFolder.addFolder("Normal Detail").close();

	normalFolder
		.add(config.normalDetail, "useBaked")
		.name("Use Baked Normals")
		.onChange(handleBakeToggleChange);

	normalFolder
		.add(config.normalDetail, "strength", 0, 3, 0.01)
		.name("Strength")
		.onChange(updateMaterialUniforms);

	addFBMToGUI(
		normalFolder,

		config.normalDetail.fbm,

		"Normal Height FBM",

		updateMaterialUniforms,
	);

	// Parallax Occlusion Mapping (POM)
	const pomFolder = matFolder.addFolder("Parallax Occlusion (POM)").close();

	pomFolder
		.add(config.pom, "enable")
		.name("Enable POM")
		.onChange(updateMaterialUniforms);

	pomFolder
		.add(config.pom, "useBakedHeight")
		.name("Use Baked POM Height")
		.onChange(handleBakeToggleChange);

	pomFolder
		.add(config.pom, "heightScaleEffect", 0, 0.2, 0.001)
		.name("Height Scale (Effect)")
		.onChange(updateMaterialUniforms);

	pomFolder
		.add(config.pom, "minSteps", 4, 32, 1)
		.name("Min Steps")
		.onChange(updateMaterialUniforms);

	pomFolder
		.add(config.pom, "maxSteps", 8, 128, 1)
		.name("Max Steps")
		.onChange(updateMaterialUniforms);

	pomFolder
		.add(config.pom, "worldSpaceUVScale", 0.001, 0.5, 0.001)
		.name("World UV Scale")
		.onChange(updateMaterialUniforms);

	addFBMToGUI(
		pomFolder,

		config.pom.heightFBM,

		"POM Height FBM",

		updateMaterialUniforms,
	);

	// Weathering - Dust
	const dustFolder = matFolder.addFolder("Weathering - Dust").close();

	dustFolder
		.addColor(config.dust, "color")
		.name("Dust Color")
		.onChange(updateMaterialUniforms);

	dustFolder
		.add(config.dust, "accumulationFactor", 0, 1, 0.01)
		.name("Factor")
		.onChange(updateMaterialUniforms);

	addFBMToGUI(
		dustFolder,

		config.dust.noiseFBM,

		"Dust Noise FBM",

		updateMaterialUniforms,
	);

	// Weathering - Water Streaks
	const streaksFolder = matFolder
		.addFolder("Weathering - Water Streaks")
		.close();

	streaksFolder
		.addColor(config.waterStreaks, "color")
		.name("Streak Color")
		.onChange(updateMaterialUniforms);

	streaksFolder
		.add(config.waterStreaks, "influence", 0, 1, 0.01)
		.onChange(updateMaterialUniforms);

	streaksFolder
		.add(config.waterStreaks, "roughnessFactor", 0, 1, 0.01)
		.onChange(updateMaterialUniforms);

	streaksFolder
		.add(config.waterStreaks, "verticalStretch", 0.1, 20, 0.1)
		.onChange(updateMaterialUniforms);

	streaksFolder
		.add(config.waterStreaks, "flowSpeed", 0, 0.1, 0.001)
		.onChange(updateMaterialUniforms);

	addFBMToGUI(
		streaksFolder,

		config.waterStreaks.fbm,

		"Streaks FBM",

		updateMaterialUniforms,
	);

	// Weathering - Lichen/Moss
	const lichenFolder = matFolder
		.addFolder("Weathering - Lichen/Moss")
		.close();

	lichenFolder
		.addColor(config.lichen, "color")
		.name("Lichen Color")
		.onChange(updateMaterialUniforms);

	lichenFolder
		.add(config.lichen, "coverage", 0, 1, 0.01)
		.onChange(updateMaterialUniforms);

	lichenFolder
		.add(config.lichen, "threshold", 0, 1, 0.01)
		.onChange(updateMaterialUniforms);

	lichenFolder
		.add(config.lichen, "smoothness", 0, 0.5, 0.01)
		.onChange(updateMaterialUniforms);

	lichenFolder
		.add(config.lichen, "roughness", 0, 1, 0.01)
		.name("Lichen Roughness")
		.onChange(updateMaterialUniforms);

	lichenFolder
		.add(config.lichen, "upwardBias", 0, 1, 0.01)
		.onChange(updateMaterialUniforms);

	lichenFolder
		.add(config.lichen, "aoInfluence", 0, 1, 0.01)
		.onChange(updateMaterialUniforms);

	addFBMToGUI(
		lichenFolder,

		config.lichen.fbm,

		"Lichen FBM",

		updateMaterialUniforms,
	);

	// Reveal FBM
	const revealFolder = matFolder.addFolder("Synthesis Reveal Mask").close();

	addFBMToGUI(
		revealFolder,

		config.revealFBM,

		"Reveal FBM",

		updateMaterialUniforms,
	);

	// --- Actions & Presets ---
	gui.add(config.actions, "regenerate").name("🔄 Regenerate Rock");

	gui.add(config.actions, "bakeAllTextures").name("📦 Bake All Textures");

	const presetGuiFolder = gui.addFolder("Presets").close();

	presetGuiFolder.add(config.presets, "currentPresetName").name("Save Name");

	presetGuiFolder.add(config.actions, "savePreset").name("💾 Save Preset");

	presetGuiFolder
		// Options populated by updatePresetDropdownGUI
		.add(config.presets, "selectedPreset", [])
		.name("Load Preset")
		// Will call loadSelectedPreset
		.onChange(config.actions.loadPreset);

	gui.add(config.actions, "giftRock").name("🎁 Gift This Rock");
}

// Updated addFBMToGUI to accept a change callback
function addFBMToGUI(
	parentFolder: GUI,

	// Use FBMParams type
	fbmObject: FBMParams,

	name: string,

	onChangeCallback = updateMaterialUniforms,
) {
	// Most FBM groups start closed
	const folder = parentFolder.addFolder(name).close();

	folder.add(fbmObject, "octaves", 1, 10, 1).onChange(onChangeCallback);

	folder
		.add(fbmObject, "frequency", 0.001, 20.0, 0.001)
		.name("Scale/Frequency")
		.onChange(onChangeCallback);

	folder
		.add(fbmObject, "persistence", 0.1, 1.0, 0.01)
		.onChange(onChangeCallback);

	folder
		.add(fbmObject, "lacunarity", 1.0, 4.0, 0.01)
		.onChange(onChangeCallback);

	folder
		.add(fbmObject, "amplitude", 0.0, 2.0, 0.01)
		.onChange(onChangeCallback);

	folder.add(fbmObject, "seed_offset", 0, 1000, 1).onChange(onChangeCallback);
}

function handleBakeToggleChange() {
	updateMaterialUniforms();

	// Future: Could auto-trigger bake if a "Use Baked" is checked and map is null
}

// --- Parameter Getter Functions (for WASM and Uniforms) ---
function getScalarFieldParamsForWasm(): ScalarFieldShapeParamsForWasm {
	return {
		base_sphere_radius: config.scalarField.baseSphereRadius,

		base_sphere_influence: config.scalarField.baseSphereInfluence,

		sphere_distort_fbm: { ...config.scalarField.sphereDistortFBM },

		large_form_fbm: { ...config.scalarField.largeFormFBM },

		medium_detail_fbm: { ...config.scalarField.mediumDetailFBM },

		fine_detail_fbm: { ...config.scalarField.fineDetailFBM },
	};
}

function getGridDimensionsForWasm(): GridDimensions {
	return { ...config.grid };
}

function getAlbedoBakeParamsForWasm(): AlbedoBakeParamsForWasm {
	const dark = new THREE.Color(config.albedo.slateColorDark);

	const light = new THREE.Color(config.albedo.slateColorLight);

	const strata = new THREE.Color(config.albedo.strataColor);

	const vein = new THREE.Color(config.albedo.veinColorPrimary);

	const fleck = new THREE.Color(config.albedo.fleckColor);

	return {
		base_fbm: { ...config.albedo.baseFBM },

		strata_fbm: { ...config.albedo.strataFBM },

		vein_fbm: { ...config.albedo.veinsFBM },

		vein_warp_fbm: { ...config.albedo.veinsWarpFBM },

		fleck_fbm: { ...config.albedo.flecksFBM },

		slate_color_dark_r: dark.r,

		slate_color_dark_g: dark.g,

		slate_color_dark_b: dark.b,

		slate_color_light_r: light.r,

		slate_color_light_g: light.g,

		slate_color_light_b: light.b,

		strata_color_r: strata.r,

		strata_color_g: strata.g,

		strata_color_b: strata.b,

		strata_influence: config.albedo.strataInfluence,

		strata_frequency_y_stretch: config.albedo.strataFreqYStretch,

		vein_color_primary_r: vein.r,

		vein_color_primary_g: vein.g,

		vein_color_primary_b: vein.b,

		vein_threshold: config.albedo.veinsThreshold,

		fleck_color_r: fleck.r,

		fleck_color_g: fleck.g,

		fleck_color_b: fleck.b,

		fleck_threshold: config.albedo.flecksThreshold,
	};
}

function getHeightBakeParamsForWasm(): HeightBakeParamsForWasm {
	return {
		base_fbm: { ...config.pom.heightFBM },

		detail_fbm: {
			...config.pom.heightFBM,

			frequency: config.pom.heightFBM.frequency * 2.5,

			amplitude: config.pom.heightFBM.amplitude * 0.5,
		},

		detail_blend_factor: 0.4,

		overall_amplitude: 1.0,
	};
}

function getNormalBakeParamsForWasm(): NormalBakeParamsForWasm {
	return { strength: config.normalDetail.strength };
}

function getRoughnessBakeParamsForWasm(): RoughnessBakeParamsForWasm {
	return {
		fbm_params: { ...config.roughness.fbm },

		min_roughness: config.roughness.min,

		max_roughness: config.roughness.max,
	};
}

function getAoBakeParamsForWasm(): AoBakeParamsForWasm {
	return {
		fbm_params: { ...config.ao.fbm },

		strength: config.ao.strength,
	};
}

// --- Rock Generation Logic ---
async function generateAndDisplayRock() {
	if (!wasmModule) {
		console.error("WASM module not loaded. Cannot generate rock.");

		if (loadingIndicator) {
			loadingIndicator.innerText = "WASM Error. Refresh.";

			loadingIndicator.style.display = "block";
		}

		return;
	}

	if (loadingIndicator) {
		loadingIndicator.innerText = "Generating Rock...";

		loadingIndicator.style.display = "block";
	}

	currentGlobalSeed = config.seed;

	if (seedDisplay)
		seedDisplay.innerText = `Generating with Seed: ${currentGlobalSeed}`;

	const gridDims = getGridDimensionsForWasm();

	const scalarFieldShapeParams = getScalarFieldParamsForWasm();

	const isoLevel = config.isoLevel;

	const largestGridDim = Math.max(
		gridDims.width,

		gridDims.height,

		gridDims.depth,
	);

	const scaleFactor =
		config.meshConstruction.worldSize / Math.max(1, largestGridDim);

	const meshScale = { x: scaleFactor, y: scaleFactor, z: scaleFactor };

	const meshOffset = {
		x: (-(gridDims.width - 1) * scaleFactor) / 2.0,

		y: (-(gridDims.height - 1) * scaleFactor) / 2.0,

		z: (-(gridDims.depth - 1) * scaleFactor) / 2.0,
	};

	console.time("Scalar Field (WASM)");

	let scalarFieldData: Float32Array;

	try {
		scalarFieldData = wasmModule.get_scalar_field_structured_params_wasm(
			gridDims,

			currentGlobalSeed,

			scalarFieldShapeParams,
		);
	} catch (e) {
		console.error("Scalar field WASM error:", e);

		if (loadingIndicator) loadingIndicator.style.display = "none";

		return;
	}

	console.timeEnd("Scalar Field (WASM)");

	console.time("Mesh Extraction (WASM)");

	let meshDataWasm: { vertices: Float32Array; indices: Uint32Array };

	try {
		const finalScalarFieldData =
			scalarFieldData instanceof Float32Array
				? scalarFieldData
				: // Ensure it's Float32Array
					new Float32Array(scalarFieldData);

		meshDataWasm = wasmModule.extract_mesh_wasm(
			finalScalarFieldData,

			gridDims,

			isoLevel,

			meshScale.x,

			meshScale.y,

			meshScale.z,

			meshOffset.x,

			meshOffset.y,

			meshOffset.z,
		);
	} catch (e) {
		console.error("Mesh extraction WASM error:", e);

		if (loadingIndicator) loadingIndicator.style.display = "none";

		return;
	}

	console.timeEnd("Mesh Extraction (WASM)");

	if (
		!meshDataWasm ||
		!meshDataWasm.vertices ||
		meshDataWasm.vertices.length === 0
	) {
		console.warn(
			"Mesh extraction returned no vertices. Try adjusting Iso Level or grid parameters.",
		);

		if (loadingIndicator) loadingIndicator.style.display = "none";

		if (rockMesh) {
			scene.remove(rockMesh);

			rockMesh.geometry.dispose();
		}

		return;
	}

	const geometry = new THREE.BufferGeometry();

	const vertexData = meshDataWasm.vertices;

	const indexData = meshDataWasm.indices;

	const positions = [];

	const normals = [];

	const uvs = [];

	for (let i = 0; i < vertexData.length; i += 8) {
		positions.push(vertexData[i], vertexData[i + 1], vertexData[i + 2]);

		normals.push(vertexData[i + 3], vertexData[i + 4], vertexData[i + 5]);

		uvs.push(vertexData[i + 6], vertexData[i + 7]);
	}

	geometry.setAttribute(
		"position",
		// @ts-expect-error
		new THREE.Float32BufferAttribute(positions, 3),
	);

	geometry.setAttribute(
		"normal",

		// @ts-expect-error
		new THREE.Float32BufferAttribute(normals, 3),
	);

	// @ts-expect-error
	geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

	geometry.setIndex(new THREE.BufferAttribute(indexData, 1));

	// Shader Material Setup
	if (!rockMaterial) {
		const [vertexShaderText, fragmentShaderText] = await Promise.all([
			fetch("/Public/Function/Page/Rock/RockVertex.glsl").then((res) =>
				res.text(),
			),

			fetch("/Public/Function/Page/Rock/RockFragment.glsl").then(
				(res) => {
					return res.text().then(async (mainShader) => {
						const includeRegex = /#include\s+<([\w./]+)>/g;

						let match: RegExpExecArray | null;

						let processedShader = mainShader;

						const includePromises = [];

						while (
							(match = includeRegex.exec(mainShader)) !== null
						) {
							const includePath = `./shaders/${match[1]}`;

							includePromises.push(
								fetch(includePath)
									.then((r) => r.text())
									.then((includeContent) => {
										if (match) {
											processedShader =
												processedShader.replace(
													match[0],

													`\n// --- Included ${match[1]} ---\n${includeContent}\n// --- End ${match[1]} ---\n`,
												);
										}
									})
									.catch((err) =>
										console.warn(
											`Failed to load shader include: ${includePath}`,

											err,
										),
									),
							);
						}

						await Promise.all(includePromises);

						return processedShader;
					});
				},
			),
		]);

		rockMaterial = new THREE.ShaderMaterial({
			vertexShader: vertexShaderText,

			fragmentShader: fragmentShaderText,

			uniforms: createShaderUniforms(),

			clippingPlanes: [
				new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.001),
			],

			lights: true,
		});
	}

	// Update all uniforms based on current config object
	updateMaterialUniforms();

	if (rockMaterial.uniforms["uGlobalSeed"]) {
		rockMaterial.uniforms["uGlobalSeed"].value = parseFloat(
			currentGlobalSeed.toString(),
		);
	}

	if (rockMaterial.uniforms["uSynthesisProgress"]) {
		rockMaterial.uniforms["uSynthesisProgress"].value = 0.0;
	}

	if (rockMesh) {
		rockMesh.geometry.dispose();

		rockMesh.geometry = geometry;

		rockMesh.material = rockMaterial;
	} else {
		rockMesh = new THREE.Mesh(geometry, rockMaterial);

		scene.add(rockMesh);
	}

	animateSynthesis();

	if (loadingIndicator) loadingIndicator.style.display = "none";

	if (seedDisplay)
		seedDisplay.innerText = `Displayed Seed: ${currentGlobalSeed}`;
}

// --- Create Shader Uniforms (Matches GLSL and config structure) ---
function createShaderUniforms() {
	const uniforms = {
		// Time & Seed
		uGlobalSeed: { value: 0.0 },

		uTime: { value: 0.0 },

		uSynthesisProgress: { value: 0.0 },

		cameraPosition: { value: new THREE.Vector3() },

		// Custom light uniforms (Three.js lights will also populate built-ins)
		uAmbientLightColor: { value: new THREE.Color(0x000000) },

		uDirLightColor: { value: new THREE.Color(0x000000) },

		uDirLightDirection: { value: new THREE.Vector3(0, 1, 0) },

		// Material Globals
		uTriPlanar_BlendSharpness: { value: 8.0 },

		// Albedo
		uSlateColorLight: { value: new THREE.Color() },

		uSlateColorDark: { value: new THREE.Color() },

		uAlbedoBase_Octaves: { value: 0 },

		uAlbedoBase_Persistence: { value: 0.0 },

		uAlbedoBase_Lacunarity: { value: 0.0 },

		uAlbedoBase_Scale: { value: 0.0 },

		uAlbedoBase_Amplitude: { value: 0.0 },

		uAlbedoBase_SeedOffset: { value: 0.0 },

		uStrataColor: { value: new THREE.Color() },

		uStrata_Influence: { value: 0.0 },

		uStrata_FrequencyY_Stretch: { value: 0.0 },

		uStrata_Octaves: { value: 0 },

		uStrata_Persistence: { value: 0.0 },

		uStrata_Lacunarity: { value: 0.0 },

		uStrata_Scale: { value: 0.0 },

		uStrata_Amplitude: { value: 0.0 },

		uStrata_SeedOffset: { value: 0.0 },

		uVeinColorPrimary: { value: new THREE.Color() },

		uVeins_Threshold: { value: 0.0 },

		uVeins_Octaves: { value: 0 },

		uVeins_Persistence: { value: 0.0 },

		uVeins_Lacunarity: { value: 0.0 },

		uVeins_Scale: { value: 0.0 },

		uVeins_Amplitude: { value: 0.0 },

		uVeins_SeedOffset: { value: 0.0 },

		uVeins_Warp_Octaves: { value: 0 },

		uVeins_Warp_Persistence: { value: 0.0 },

		uVeins_Warp_Lacunarity: { value: 0.0 },

		uVeins_Warp_Scale: { value: 0.0 },

		uVeins_Warp_Amplitude: { value: 0.0 },

		uVeins_Warp_SeedOffset: { value: 0.0 },

		uFleckColor: { value: new THREE.Color() },

		uFlecks_Threshold: { value: 0.0 },

		uFlecks_Octaves: { value: 0 },

		uFlecks_Persistence: { value: 0.0 },

		uFlecks_Lacunarity: { value: 0.0 },

		uFlecks_Scale: { value: 0.0 },

		uFlecks_Amplitude: { value: 0.0 },

		uFlecks_SeedOffset: { value: 0.0 },

		// Roughness
		uRoughness_Min: { value: 0.0 },

		uRoughness_Max: { value: 0.0 },

		uRoughness_Octaves: { value: 0 },

		uRoughness_Persistence: { value: 0.0 },

		uRoughness_Lacunarity: { value: 0.0 },

		uRoughness_Scale: { value: 0.0 },

		uRoughness_Amplitude: { value: 0.0 },

		uRoughness_SeedOffset: { value: 0.0 },

		// AO
		uAO_Strength: { value: 0.0 },

		uAO_Octaves: { value: 0 },

		uAO_Persistence: { value: 0.0 },

		uAO_Lacunarity: { value: 0.0 },

		uAO_Scale: { value: 0.0 },

		uAO_Amplitude: { value: 0.0 },

		uAO_SeedOffset: { value: 0.0 },

		// Normal Detail
		uNormalDetail_Strength: { value: 0.0 },

		uNormalDetail_Octaves: { value: 0 },

		uNormalDetail_Persistence: { value: 0.0 },

		uNormalDetail_Lacunarity: { value: 0.0 },

		uNormalDetail_Scale: { value: 0.0 },

		uNormalDetail_Amplitude: { value: 0.0 },

		uNormalDetail_SeedOffset: { value: 0.0 },

		// POM
		uEnablePOM: { value: true },

		uPOM_HeightScale: { value: 0.0 },

		uPOM_MinSteps: { value: 0 },

		uPOM_MaxSteps: { value: 0 },

		uPOM_WorldSpaceUVScale: { value: 0.0 },

		uPOMHeight_Octaves: { value: 0 },

		uPOMHeight_Persistence: { value: 0.0 },

		uPOMHeight_Lacunarity: { value: 0.0 },

		uPOMHeight_Scale: { value: 0.0 },

		uPOMHeight_Amplitude: { value: 0.0 },

		uPOMHeight_SeedOffset: { value: 0.0 },

		// Dust
		uDustColor: { value: new THREE.Color() },

		uDust_AccumulationFactor: { value: 0.0 },

		uDust_Noise_Octaves: { value: 0 },

		uDust_Noise_Persistence: { value: 0.0 },

		uDust_Noise_Lacunarity: { value: 0.0 },

		uDust_NoiseScale: { value: 0.0 },

		uDust_Noise_Amplitude: { value: 0.0 },

		uDust_SeedOffset: { value: 0.0 },

		// Water Streaks
		uWaterStreakColor: { value: new THREE.Color() },

		uWaterStreak_Influence: { value: 0.0 },

		uWaterStreak_RoughnessFactor: { value: 0.0 },

		uWaterStreaks_VerticalStretch: { value: 0.0 },

		uWaterStreaks_FlowSpeed: { value: 0.0 },

		uWaterStreaks_Octaves: { value: 0 },

		uWaterStreaks_Persistence: { value: 0.0 },

		uWaterStreaks_Lacunarity: { value: 0.0 },

		uWaterStreaks_Scale: { value: 0.0 },

		uWaterStreaks_Amplitude: { value: 0.0 },

		uWaterStreaks_SeedOffset: { value: 0.0 },

		// Lichen
		uLichenColor: { value: new THREE.Color() },

		uLichen_Coverage: { value: 0.0 },

		uLichen_Threshold: { value: 0.0 },

		uLichen_Smoothness: { value: 0.0 },

		uLichen_Roughness: { value: 0.0 },

		uLichen_UpwardBias: { value: 0.0 },

		uLichen_AOInfluence: { value: 0.0 },

		uLichen_Octaves: { value: 0 },

		uLichen_Persistence: { value: 0.0 },

		uLichen_Lacunarity: { value: 0.0 },

		uLichen_Scale: { value: 0.0 },

		uLichen_Amplitude: { value: 0.0 },

		uLichen_SeedOffset: { value: 0.0 },

		// Reveal Mask
		uReveal_Octaves: { value: 0 },

		uReveal_Persistence: { value: 0.0 },

		uReveal_Lacunarity: { value: 0.0 },

		uReveal_Scale: { value: 0.0 },

		uReveal_Amplitude: { value: 0.0 },

		uReveal_SeedOffset: { value: 0.0 },

		// Baked Textures
		uUseBakedAlbedo: { value: false },

		uBakedAlbedoMap: { value: null as THREE.DataTexture | null },

		uUseBakedNormal: { value: false },

		uBakedNormalMap: { value: null as THREE.DataTexture | null },

		uUseBakedRoughness: { value: false },

		uBakedRoughnessMap: { value: null as THREE.DataTexture | null },

		uUseBakedAO: { value: false },

		uBakedAOMap: { value: null as THREE.DataTexture | null },

		uUseBakedPOMHeight: { value: false },

		uBakedPOMHeightMap: { value: null as THREE.DataTexture | null },
	};

	return THREE.UniformsUtils.merge([uniforms, THREE.UniformsLib.lights]);
}

// --- Update Material Uniforms from Config Object ---
function updateMaterialUniforms() {
	if (!rockMaterial || !rockMaterial.uniforms) return;

	const uniforms = rockMaterial.uniforms;

	// Use the global config object
	const matConfig = config;

	function setShaderFBMUniforms(
		uniformPrefix: string,

		configFBMObject: FBMParams,
	) {
		if (!uniforms[uniformPrefix + "Octaves"]) {
			// Potentially noisy
			// console.warn(`Uniform ${uniformPrefix}Octaves not found`);

			return;
		}

		// @ts-expect-error
		uniforms[uniformPrefix + "Octaves"].value = configFBMObject.octaves;

		// @ts-expect-error
		uniforms[uniformPrefix + "Persistence"].value =
			configFBMObject.persistence;
		// @ts-expect-error

		uniforms[uniformPrefix + "Lacunarity"].value =
			configFBMObject.lacunarity;

		// Config 'frequency' maps to GLSL 'Scale'
		// @ts-expect-error
		uniforms[uniformPrefix + "Scale"].value = configFBMObject.frequency;

		// @ts-expect-error
		uniforms[uniformPrefix + "Amplitude"].value = configFBMObject.amplitude;

		// @ts-expect-error
		uniforms[uniformPrefix + "SeedOffset"].value =
			configFBMObject.seed_offset;
	}

	// General Material Uniforms
	if (uniforms["uSynthesisProgress"])
		uniforms["uSynthesisProgress"].value = matConfig.synthesisProgress;

	if (uniforms["uTriPlanar_BlendSharpness"])
		uniforms["uTriPlanar_BlendSharpness"].value =
			matConfig.triPlanarBlendSharpness;

	// Albedo
	if (uniforms["uSlateColorLight"])
		(uniforms["uSlateColorLight"].value as THREE.Color).set(
			matConfig.albedo.slateColorLight,
		);

	if (uniforms["uSlateColorDark"])
		(uniforms["uSlateColorDark"].value as THREE.Color).set(
			matConfig.albedo.slateColorDark,
		);

	setShaderFBMUniforms("uAlbedoBase_", matConfig.albedo.baseFBM);

	if (uniforms["uStrataColor"])
		(uniforms["uStrataColor"].value as THREE.Color).set(
			matConfig.albedo.strataColor,
		);

	if (uniforms["uStrata_Influence"])
		uniforms["uStrata_Influence"].value = matConfig.albedo.strataInfluence;

	if (uniforms["uStrata_FrequencyY_Stretch"])
		uniforms["uStrata_FrequencyY_Stretch"].value =
			matConfig.albedo.strataFreqYStretch;

	setShaderFBMUniforms("uStrata_", matConfig.albedo.strataFBM);

	if (uniforms["uVeinColorPrimary"])
		(uniforms["uVeinColorPrimary"].value as THREE.Color).set(
			matConfig.albedo.veinColorPrimary,
		);

	if (uniforms["uVeins_Threshold"])
		uniforms["uVeins_Threshold"].value = matConfig.albedo.veinsThreshold;

	setShaderFBMUniforms("uVeins_", matConfig.albedo.veinsFBM);

	setShaderFBMUniforms("uVeins_Warp_", matConfig.albedo.veinsWarpFBM);

	if (uniforms["uFleckColor"])
		(uniforms["uFleckColor"].value as THREE.Color).set(
			matConfig.albedo.fleckColor,
		);

	if (uniforms["uFlecks_Threshold"])
		uniforms["uFlecks_Threshold"].value = matConfig.albedo.flecksThreshold;

	setShaderFBMUniforms("uFlecks_", matConfig.albedo.flecksFBM);

	// Roughness
	if (uniforms["uRoughness_Min"])
		uniforms["uRoughness_Min"].value = matConfig.roughness.min;

	if (uniforms["uRoughness_Max"])
		uniforms["uRoughness_Max"].value = matConfig.roughness.max;

	setShaderFBMUniforms("uRoughness_", matConfig.roughness.fbm);

	// Ambient Occlusion
	if (uniforms["uAO_Strength"])
		uniforms["uAO_Strength"].value = matConfig.ao.strength;

	setShaderFBMUniforms("uAO_", matConfig.ao.fbm);

	// Normal Detail
	if (uniforms["uNormalDetail_Strength"])
		uniforms["uNormalDetail_Strength"].value =
			matConfig.normalDetail.strength;

	setShaderFBMUniforms("uNormalDetail_", matConfig.normalDetail.fbm);

	// POM
	if (uniforms["uEnablePOM"])
		uniforms["uEnablePOM"].value = matConfig.pom.enable;

	if (uniforms["uPOM_HeightScale"])
		uniforms["uPOM_HeightScale"].value = matConfig.pom.heightScaleEffect;

	if (uniforms["uPOM_MinSteps"])
		uniforms["uPOM_MinSteps"].value = matConfig.pom.minSteps;

	if (uniforms["uPOM_MaxSteps"])
		uniforms["uPOM_MaxSteps"].value = matConfig.pom.maxSteps;

	if (uniforms["uPOM_WorldSpaceUVScale"])
		uniforms["uPOM_WorldSpaceUVScale"].value =
			matConfig.pom.worldSpaceUVScale;

	setShaderFBMUniforms("uPOMHeight_", matConfig.pom.heightFBM);

	// Weathering - Dust
	if (uniforms["uDustColor"])
		(uniforms["uDustColor"].value as THREE.Color).set(matConfig.dust.color);

	if (uniforms["uDust_AccumulationFactor"])
		uniforms["uDust_AccumulationFactor"].value =
			matConfig.dust.accumulationFactor;

	// Note: GLSL might use "uDust_NoiseScale" for frequency. Assuming setShaderFBMUniforms handles this mapping.
	// Or specific handling for dust noise FBM if names differ significantly.
	// Corrected mapping for dust noise FBM:
	if (uniforms["uDust_NoiseScale"])
		uniforms["uDust_NoiseScale"].value = matConfig.dust.noiseFBM.frequency;

	if (uniforms["uDust_SeedOffset"])
		uniforms["uDust_SeedOffset"].value =
			matConfig.dust.noiseFBM.seed_offset;

	if (uniforms["uDust_Noise_Octaves"])
		uniforms["uDust_Noise_Octaves"].value = matConfig.dust.noiseFBM.octaves;

	if (uniforms["uDust_Noise_Persistence"])
		uniforms["uDust_Noise_Persistence"].value =
			matConfig.dust.noiseFBM.persistence;

	if (uniforms["uDust_Noise_Lacunarity"])
		uniforms["uDust_Noise_Lacunarity"].value =
			matConfig.dust.noiseFBM.lacunarity;

	if (uniforms["uDust_Noise_Amplitude"])
		uniforms["uDust_Noise_Amplitude"].value =
			matConfig.dust.noiseFBM.amplitude;

	// Weathering - Water Streaks
	if (uniforms["uWaterStreakColor"])
		(uniforms["uWaterStreakColor"].value as THREE.Color).set(
			matConfig.waterStreaks.color,
		);

	if (uniforms["uWaterStreak_Influence"])
		uniforms["uWaterStreak_Influence"].value =
			matConfig.waterStreaks.influence;

	if (uniforms["uWaterStreak_RoughnessFactor"])
		uniforms["uWaterStreak_RoughnessFactor"].value =
			matConfig.waterStreaks.roughnessFactor;

	if (uniforms["uWaterStreaks_VerticalStretch"])
		uniforms["uWaterStreaks_VerticalStretch"].value =
			matConfig.waterStreaks.verticalStretch;

	if (uniforms["uWaterStreaks_FlowSpeed"])
		uniforms["uWaterStreaks_FlowSpeed"].value =
			matConfig.waterStreaks.flowSpeed;

	setShaderFBMUniforms("uWaterStreaks_", matConfig.waterStreaks.fbm);

	// Weathering - Lichen/Moss
	if (uniforms["uLichenColor"])
		(uniforms["uLichenColor"].value as THREE.Color).set(
			matConfig.lichen.color,
		);

	if (uniforms["uLichen_Coverage"])
		uniforms["uLichen_Coverage"].value = matConfig.lichen.coverage;

	if (uniforms["uLichen_Threshold"])
		uniforms["uLichen_Threshold"].value = matConfig.lichen.threshold;

	if (uniforms["uLichen_Smoothness"])
		uniforms["uLichen_Smoothness"].value = matConfig.lichen.smoothness;

	if (uniforms["uLichen_Roughness"])
		uniforms["uLichen_Roughness"].value = matConfig.lichen.roughness;

	if (uniforms["uLichen_UpwardBias"])
		uniforms["uLichen_UpwardBias"].value = matConfig.lichen.upwardBias;

	if (uniforms["uLichen_AOInfluence"])
		uniforms["uLichen_AOInfluence"].value = matConfig.lichen.aoInfluence;

	setShaderFBMUniforms("uLichen_", matConfig.lichen.fbm);

	// Reveal Mask FBM
	setShaderFBMUniforms("uReveal_", matConfig.revealFBM);

	// Baked Texture Flags & Samplers
	if (uniforms["uUseBakedAlbedo"])
		uniforms["uUseBakedAlbedo"].value =
			matConfig.albedo.useBaked && !!bakedAlbedoMap;

	if (uniforms["uBakedAlbedoMap"])
		uniforms["uBakedAlbedoMap"].value = bakedAlbedoMap;

	if (uniforms["uUseBakedNormal"])
		uniforms["uUseBakedNormal"].value =
			matConfig.normalDetail.useBaked && !!bakedNormalMap;

	if (uniforms["uBakedNormalMap"])
		uniforms["uBakedNormalMap"].value = bakedNormalMap;

	if (uniforms["uUseBakedRoughness"])
		uniforms["uUseBakedRoughness"].value =
			matConfig.roughness.useBaked && !!bakedRoughnessMap;

	if (uniforms["uBakedRoughnessMap"])
		uniforms["uBakedRoughnessMap"].value = bakedRoughnessMap;

	if (uniforms["uUseBakedAO"])
		uniforms["uUseBakedAO"].value = matConfig.ao.useBaked && !!bakedAOMap;

	if (uniforms["uBakedAOMap"]) uniforms["uBakedAOMap"].value = bakedAOMap;

	if (uniforms["uUseBakedPOMHeight"])
		uniforms["uUseBakedPOMHeight"].value =
			matConfig.pom.useBakedHeight && !!bakedHeightMapTexture;

	if (uniforms["uBakedPOMHeightMap"])
		uniforms["uBakedPOMHeightMap"].value = bakedHeightMapTexture;

	// Update custom light uniforms
	const ambientLightInScene = scene.children.find(
		// Type guard
		// @ts-expect-error
		(obj): obj is THREE.AmbientLight => obj.isAmbientLight,
	);

	if (ambientLightInScene && uniforms["uAmbientLightColor"]) {
		(uniforms["uAmbientLightColor"].value as THREE.Color)
			.copy(ambientLightInScene.color)
			.multiplyScalar(ambientLightInScene.intensity);
	}

	const dirLightInScene = scene.children.find(
		// Type guard
		// @ts-expect-error
		(obj): obj is THREE.DirectionalLight => obj.isDirectionalLight,

		// Assuming one main directional light
	);

	if (dirLightInScene) {
		if (uniforms["uDirLightColor"]) {
			(uniforms["uDirLightColor"].value as THREE.Color)
				.copy(dirLightInScene.color)
				.multiplyScalar(dirLightInScene.intensity);
		}

		if (uniforms["uDirLightDirection"]) {
			(uniforms["uDirLightDirection"].value as THREE.Vector3)
				// Or get direction from target
				.copy(dirLightInScene.position)
				.normalize();
		}
	}

	rockMaterial.needsUpdate = true;
}

// --- Texture Baking Workflow ---
async function bakeAllTextures() {
	if (!wasmModule) {
		console.error("WASM not ready for baking.");

		return;
	}

	if (loadingIndicator) {
		loadingIndicator.style.display = "block";

		loadingIndicator.innerText = "Baking Textures...";
	}

	const textureSize = 512;

	currentGlobalSeed = config.seed;

	try {
		// --- Albedo ---
		if (config.albedo.useBaked) {
			const params = getAlbedoBakeParamsForWasm();

			const texData = await wasmModule.bake_texture_wasm(
				wasmModule.JsTextureType.Albedo,

				textureSize,

				textureSize,

				currentGlobalSeed,

				params,

				null,
			);

			if (bakedAlbedoMap) bakedAlbedoMap.dispose();

			bakedAlbedoMap = new THREE.DataTexture(
				texData,

				textureSize,

				textureSize,

				// Assuming RGBA; adjust if WASM outputs different format
				THREE.RGBAFormat,
			);

			bakedAlbedoMap.needsUpdate = true;

			console.log("Albedo map baked.");
		} else {
			if (bakedAlbedoMap) bakedAlbedoMap.dispose();

			bakedAlbedoMap = null;
		}

		// --- Height (for POM and Normals) ---
		const heightParams = getHeightBakeParamsForWasm();

		const heightTexDataBytes = await wasmModule.bake_texture_wasm(
			wasmModule.JsTextureType.Height,

			textureSize,

			textureSize,

			currentGlobalSeed,

			heightParams,

			null,
		);

		if (bakedHeightMapTexture) bakedHeightMapTexture.dispose();

		bakedHeightMapTexture = new THREE.DataTexture(
			heightTexDataBytes,

			textureSize,

			textureSize,

			// Assuming RGBA for height (e.g., in R channel)
			THREE.RGBAFormat,
		);

		bakedHeightMapTexture.needsUpdate = true;

		bakedHeightMapData = new Float32Array(textureSize * textureSize);

		for (let i = 0; i < textureSize * textureSize; i++) {
			// Assuming R channel for height
			// @ts-expect-error
			bakedHeightMapData[i] = heightTexDataBytes[i * 4] / 255.0;
		}

		console.log("Height map baked (for POM/Normal).");

		// --- Normal Map (uses bakedHeightMapData) ---
		if (config.normalDetail.useBaked) {
			if (!bakedHeightMapData) {
				console.warn(
					"Cannot bake normals without a height map. Bake height first.",
				);
			} else {
				const params = getNormalBakeParamsForWasm();

				const normalTexData = await wasmModule.bake_texture_wasm(
					wasmModule.JsTextureType.Normal,

					textureSize,

					textureSize,

					currentGlobalSeed,

					params,

					bakedHeightMapData,
				);

				if (bakedNormalMap) bakedNormalMap.dispose();

				bakedNormalMap = new THREE.DataTexture(
					normalTexData,

					textureSize,

					textureSize,

					// Normals usually RGB
					THREE.RGBAFormat,
				);

				bakedNormalMap.needsUpdate = true;

				console.log("Normal map baked.");
			}
		} else {
			if (bakedNormalMap) bakedNormalMap.dispose();

			bakedNormalMap = null;
		}

		// --- Roughness Map ---
		if (config.roughness.useBaked) {
			const params = getRoughnessBakeParamsForWasm();

			const roughData = await wasmModule.bake_texture_wasm(
				wasmModule.JsTextureType.Roughness,

				textureSize,

				textureSize,

				currentGlobalSeed,

				params,

				null,
			);

			if (bakedRoughnessMap) bakedRoughnessMap.dispose();

			bakedRoughnessMap = new THREE.DataTexture(
				roughData,

				textureSize,

				textureSize,

				// Roughness often in R channel
				THREE.RGBAFormat,
			);

			bakedRoughnessMap.needsUpdate = true;

			console.log("Roughness map baked.");
		} else {
			if (bakedRoughnessMap) bakedRoughnessMap.dispose();

			bakedRoughnessMap = null;
		}

		// --- Ambient Occlusion Map ---
		if (config.ao.useBaked) {
			const params = getAoBakeParamsForWasm();

			const aoData = await wasmModule.bake_texture_wasm(
				wasmModule.JsTextureType.AmbientOcclusion,

				textureSize,

				textureSize,

				currentGlobalSeed,

				params,

				null,
			);

			if (bakedAOMap) bakedAOMap.dispose();

			bakedAOMap = new THREE.DataTexture(
				aoData,

				textureSize,

				textureSize,

				// AO often in R channel
				THREE.RGBAFormat,
			);

			bakedAOMap.needsUpdate = true;

			console.log("AO map baked.");
		} else {
			if (bakedAOMap) bakedAOMap.dispose();

			bakedAOMap = null;
		}
	} catch (e) {
		console.error("Error during texture baking:", e);

		let message = "Texture baking failed. See console.";

		if (e instanceof Error) message = e.message;

		alert(message);
	} finally {
		// Update shader with newly baked/nulled maps
		updateMaterialUniforms();

		if (loadingIndicator) {
			loadingIndicator.style.display = "none";

			// Reset text
			loadingIndicator.innerText = "Generating Rock...";
		}
	}
}

// --- Animation Loop & Synthesis ---
let synthesisStartTime: number | undefined;

function animateSynthesis() {
	synthesisStartTime = clock.getElapsedTime();

	// Reset GUI progress bar as well
	config.synthesisProgress = 0;

	if (gui)
		gui
			.controllersRecursive()
			.find((c) => c.property === "synthesisProgress")
			?.updateDisplay();
}

function animate() {
	requestAnimationFrame(animate);

	const elapsedTime = clock.getElapsedTime();

	// For frame-rate independent animation
	const deltaTime = clock.getDelta();

	if (rockMaterial && rockMaterial.uniforms) {
		if (rockMaterial.uniforms["uTime"])
			rockMaterial.uniforms["uTime"].value = elapsedTime;

		if (rockMaterial.uniforms["cameraPosition"])
			(
				rockMaterial.uniforms["cameraPosition"].value as THREE.Vector3
			).copy(camera.position);

		if (synthesisStartTime !== undefined) {
			// seconds
			const synthesisDuration = 3.0;

			let progress =
				(elapsedTime - synthesisStartTime) / synthesisDuration;

			progress = Math.min(progress, 1.0);

			if (rockMaterial.uniforms["uSynthesisProgress"])
				rockMaterial.uniforms["uSynthesisProgress"].value = progress;

			// Update GUI if it's listening
			config.synthesisProgress = progress;

			if (progress >= 1.0) {
				// Stop updating progress once complete
				synthesisStartTime = undefined;
			}
		}

		if (
			rockMesh &&
			(!synthesisStartTime ||
				(rockMaterial.uniforms["uSynthesisProgress"] &&
					(rockMaterial.uniforms["uSynthesisProgress"]
						.value as number) >= 1.0))
		) {
			// Roughly 0.018 rad/sec
			rockMesh.rotation.y += 0.0003 * deltaTime * 60.0;
		}
	}

	renderer.render(scene, camera);
}

// --- Preset Management ---
// Use PresetConfig type
let presets: Record<string, PresetConfig> = {};

// Increment version if structure changes significantly
const PRESET_STORAGE_KEY = "rockGenPresets_v1.3";

function loadPresetsFromLocalStorage() {
	const storedPresets = localStorage.getItem(PRESET_STORAGE_KEY);

	if (storedPresets) {
		try {
			presets = JSON.parse(storedPresets) as Record<string, PresetConfig>;
		} catch (e) {
			console.error("Error parsing presets from localStorage:", e);

			// Reset if corrupted
			presets = {};
		}
	}

	if (Object.keys(presets).length === 0) {
		const defaultConfigCopy: PresetConfig = JSON.parse(
			JSON.stringify(config),
		);

		// Actions are not part of PresetConfig type
		// delete (defaultConfigCopy as any).actions;

		// Ensure the presets part of the config is also cleaned for storage
		if (defaultConfigCopy.presets) {
			// @ts-expect-error
			delete defaultConfigCopy.presets.availablePresets;
		}

		presets["Default Slate"] = defaultConfigCopy;

		localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
	}

	updatePresetDropdownGUI();
}

function saveCurrentPresetToLocalStorage() {
	const name = config.presets.currentPresetName.trim();

	if (!name) {
		alert("Please enter a preset name.");

		return;
	}

	const presetDataToSave: PresetConfig = JSON.parse(JSON.stringify(config));

	// Actions are not part of PresetConfig
	// delete (presetDataToSave as any).actions;

	if (presetDataToSave.presets) {
		// Don't save internal GUI state
		// @ts-expect-error
		delete presetDataToSave.presets.availablePresets;
	}

	presets[name] = presetDataToSave;

	try {
		localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));

		updatePresetDropdownGUI();

		const presetController = gui
			.controllersRecursive()
			.find(
				(c) =>
					c.object === config.presets &&
					c.property === "selectedPreset",
			);

		if (presetController) {
			// Auto-select newly saved preset
			presetController.setValue(name);
		}

		alert(`Preset "${name}" saved.`);
	} catch (e: unknown) {
		let message = "Unknown error";

		if (e instanceof Error) message = e.message;
		else if (typeof e === "string") message = e;

		alert(`Error saving preset: ${message}. LocalStorage might be full.`);

		console.error("Error saving to localStorage:", e);
	}
}

function loadSelectedPreset() {
	// Value from lil-gui dropdown
	const name = config.presets.selectedPreset;

	const presetToLoad = presets[name];

	if (!name || !presetToLoad) {
		if (name) alert(`Preset "${name}" not found or is invalid.`);

		return;
	}

	const deepClonedPreset = JSON.parse(
		JSON.stringify(presetToLoad),
	) as PresetConfig;

	// Apply to global config object recursively
	// Be careful with direct assignment vs. merging complex objects
	function applyRecursive(target: any, source: any) {
		for (const key in source) {
			if (source.hasOwnProperty(key) && target.hasOwnProperty(key)) {
				// Skip functions and internal GUI state
				if (key === "actions" || key === "availablePresets") continue;

				if (
					typeof source[key] === "object" &&
					source[key] !== null &&
					!Array.isArray(source[key]) &&
					// THREE.Color is handled by lil-gui
					!(source[key] instanceof THREE.Color)
				) {
					if (
						typeof target[key] !== "object" ||
						target[key] === null
					) {
						// Create object if it doesn't exist
						target[key] = {};
					}

					applyRecursive(target[key], source[key]);
				} else {
					// Ensure not to overwrite functions in target with undefined from preset
					if (typeof target[key] !== "function") {
						target[key] = source[key];
					}
				}
			}
		}
	}

	applyRecursive(config, deepClonedPreset);

	gui.controllersRecursive().forEach((controller) =>
		controller.updateDisplay(),
	);

	// Update the name input field
	config.presets.currentPresetName = name;

	const nameController = gui
		.controllersRecursive()
		.find(
			(c) =>
				c.object === config.presets &&
				c.property === "currentPresetName",
		);

	if (nameController) nameController.updateDisplay();

	// Regenerate with loaded preset values
	generateAndDisplayRock();

	alert(`Preset "${name}" loaded.`);
}

function updatePresetDropdownGUI() {
	const presetNames = Object.keys(presets);

	// Store for internal logic if needed
	config.presets.availablePresets = presetNames;

	const presetController = gui
		.controllersRecursive()
		.find(
			(c) =>
				c.object === config.presets && c.property === "selectedPreset",
		);

	if (presetController) {
		const currentVal = presetController.getValue();

		// Clear existing options and add new ones
		presetController.options(presetNames);

		if (presetNames.includes(currentVal)) {
			// Try to keep current selection
			presetController.setValue(currentVal);
		} else if (presetNames.length > 0) {
			// Select first if current is gone
			presetController.setValue(presetNames[0]);
		}

		presetController.updateDisplay();
	}
}

function assignPresetActions() {
	// Ensure actions point to the correct functions after GUI setup
	config.actions.loadPreset = loadSelectedPreset;

	config.actions.savePreset = saveCurrentPresetToLocalStorage;
}

// --- Gifting ---
function giftRock() {
	const paramsToGift: PresetConfig = JSON.parse(JSON.stringify(config));

	// actions not in PresetConfig type
	// delete (paramsToGift as any).actions;

	if (paramsToGift.presets) {
		// @ts-expect-error
		delete paramsToGift.presets.availablePresets;
	}

	const jsonData = JSON.stringify(paramsToGift, null, 2);

	console.log("GIFTING ROCK PARAMS:", jsonData);

	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard
			.writeText(jsonData)
			.then(() => {
				alert(
					`Rock parameters (JSON) copied to clipboard! (Seed: ${currentGlobalSeed})`,
				);
			})
			.catch((err) => {
				console.warn("Could not copy to clipboard automatically:", err);

				alert(
					`Could not copy to clipboard. See console for JSON data. (Seed: ${currentGlobalSeed})`,
				);

				// Fallback prompt
				prompt("Copy this JSON:", jsonData);
			});
	} else {
		// Fallback for older browsers/contexts
		prompt("Copy this JSON:", jsonData);
	}
}

// --- Main Initialization ---
async function main() {
	try {
		if (loadingIndicator) {
			loadingIndicator.innerText = "Loading WASM...";

			loadingIndicator.style.display = "block";
		}

		await initWasm();

		if (loadingIndicator)
			loadingIndicator.innerText = "Initializing 3D Scene...";

		initThreeJS();

		if (loadingIndicator) loadingIndicator.innerText = "Setting up UI...";

		// Setup lil-gui, which also reads initial config values
		setupGUI();

		// Assign preset actions after GUI controllers are created
		assignPresetActions();

		// Load presets and populate dropdown
		loadPresetsFromLocalStorage();

		if (loadingIndicator)
			loadingIndicator.innerText = "Generating Initial Rock...";

		await generateAndDisplayRock();

		animate();
	} catch (error) {
		console.error("Initialization failed:", error);

		if (loadingIndicator) {
			loadingIndicator.innerText =
				"Error during initialization. Check console.";

			loadingIndicator.style.display = "block";
		}
	}
}

main();
