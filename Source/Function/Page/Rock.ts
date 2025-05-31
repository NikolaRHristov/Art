import GUI from "lil-gui";
import * as THREE from "three";

// --- Global Variables ---
let scene: THREE.Scene,
	camera: THREE.PerspectiveCamera,
	renderer: THREE.WebGLRenderer,
	rockMesh: THREE.Mesh<
		THREE.BufferGeometry<THREE.NormalBufferAttributes>,
		any,
		THREE.Object3DEventMap
	>,
	rockMaterial: THREE.ShaderMaterial;

let wasmModule: {
	get_scalar_field_structured_params_wasm: (
		arg0: { width: number; height: number; depth: number },
		arg1: number,
		arg2: {
			// This structure must match what Rust's ScalarFieldShapeParams (deserialized from JsValue) expects
			base_sphere_radius: number;
			base_sphere_influence: number;
			// Spread to copy
			sphere_distort_fbm: {
				octaves: number;
				frequency: number;
				persistence: number;
				lacunarity: number;
				amplitude: number;
				seed_offset: number;
			};
			large_form_fbm: {
				octaves: number;
				frequency: number;
				persistence: number;
				lacunarity: number;
				amplitude: number;
				seed_offset: number;
			};
			medium_detail_fbm: {
				octaves: number;
				frequency: number;
				persistence: number;
				lacunarity: number;
				amplitude: number;
				seed_offset: number;
			};
			fine_detail_fbm: {
				octaves: number;
				frequency: number;
				persistence: number;
				lacunarity: number;
				amplitude: number;
				seed_offset: number;
			};
		},
	) => any;
	extract_mesh_wasm: (
		arg0: Float32Array<any>,
		arg1: { width: number; height: number; depth: number },
		arg2: number,
		arg3: number,
		arg4: number,
		arg5: number,
		arg6: number,
		arg7: number,
		arg8: number,
	) => any;
	bake_texture_wasm: (
		arg0: any,
		arg1: number,
		arg2: number,
		arg3: number,
		arg4: {
			base_fbm?:
				| {
						octaves: number;
						persistence: number;
						lacunarity: number;
						frequency: number;
						amplitude: number;
						seed_offset: number;
				  }
				| {
						octaves: number;
						persistence: number;
						lacunarity: number;
						frequency: number;
						amplitude: number;
						seed_offset: number;
				  };
			strata_fbm?: {
				octaves: number;
				persistence: number;
				lacunarity: number;
				frequency: number;
				amplitude: number;
				seed_offset: number;
			};
			vein_fbm?: {
				octaves: number;
				persistence: number;
				lacunarity: number;
				frequency: number;
				amplitude: number;
				seed_offset: number;
			};
			vein_warp_fbm?: {
				octaves: number;
				persistence: number;
				lacunarity: number;
				frequency: number;
				amplitude: number;
				seed_offset: number;
			};
			fleck_fbm?: {
				octaves: number;
				persistence: number;
				lacunarity: number;
				frequency: number;
				amplitude: number;
				seed_offset: number;
			};
			slate_color_dark_r?: number;
			slate_color_dark_g?: number;
			slate_color_dark_b?: number;
			slate_color_light_r?: number;
			slate_color_light_g?: number;
			slate_color_light_b?: number;
			strata_color_r?: number;
			strata_color_g?: number;
			strata_color_b?: number;
			strata_influence?: number;
			strata_frequency_y_stretch?: number;
			vein_color_primary_r?: number;
			vein_color_primary_g?: number;
			vein_color_primary_b?: number;
			vein_threshold?: number;
			fleck_color_r?: number;
			fleck_color_g?: number;
			fleck_color_b?: number;
			fleck_threshold?: number;
			detail_fbm?: {
				frequency: number;
				amplitude: number;
				octaves: number;
				persistence: number;
				lacunarity: number;
				seed_offset: number;
			};
			detail_blend_factor?: number;
			overall_amplitude?: number;
			strength?: number;
			fbm_params?:
				| {
						octaves: number;
						persistence: number;
						lacunarity: number;
						frequency: number;
						amplitude: number;
						seed_offset: number;
				  }
				| {
						octaves: number;
						persistence: number;
						lacunarity: number;
						frequency: number;
						amplitude: number;
						seed_offset: number;
				  };
			min_roughness?: number;
			max_roughness?: number;
		},
		arg5: Float32Array<ArrayBuffer> | null,
	) => any;
	JsTextureType: {
		Albedo: any;
		Height: any;
		Normal: any;
		Roughness: any;
		AmbientOcclusion: any;
	};
};

let clock = new THREE.Clock();

let currentGlobalSeed: number;

let gui: GUI;

// Baked Textures
let bakedAlbedoMap: null = null,
	bakedHeightMapData = null,
	bakedHeightMapTexture: null = null,
	bakedNormalMap: null = null,
	bakedRoughnessMap: null = null,
	bakedAOMap: null = null;

// DOM Elements
const rockContainer = document.getElementById("rock-container");

const loadingIndicator = document.getElementById("loading-indicator");

const seedDisplay = document.getElementById("seedDisplay");

// Shader file paths
const VERTEX_SHADER_PATH = "./shaders/rock_vertex.glsl";

const FRAGMENT_SHADER_PATH = "./shaders/rock_fragment_detailed.glsl";

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
			octaves: 3,

			frequency: 1.2,

			persistence: 0.5,

			lacunarity: 2.0,

			amplitude: 0.2,

			seed_offset: 10,
		},

		largeFormFBM: {
			octaves: 5,

			frequency: 0.3,

			persistence: 0.5,

			lacunarity: 2.0,

			amplitude: 0.35,

			seed_offset: 20,
		},

		mediumDetailFBM: {
			octaves: 6,

			frequency: 0.9,

			persistence: 0.45,

			lacunarity: 2.2,

			amplitude: 0.15,

			seed_offset: 30,
		},

		fineDetailFBM: {
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
			octaves: 6,

			persistence: 0.4,

			lacunarity: 2.2,

			frequency: 0.3,

			amplitude: 1.0,

			seed_offset: 120,
		},

		veinsWarpFBM: {
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
			octaves: 4,

			persistence: 0.6,

			lacunarity: 1.8,

			frequency: 0.1,

			amplitude: 1.0,

			seed_offset: 160,
		},
	},

	normalDetail: {
		// For procedural normal height field
		useBaked: false,

		strength: 0.4,

		fbm: {
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
			octaves: 6,

			persistence: 0.45,

			lacunarity: 2.1,

			frequency: 1.2,

			amplitude: 1.0,

			seed_offset: 600,
		},
	},

	revealFBM: {
		// FBM for synthesis reveal mask
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
			loadPresetsFromLocalStorage;
		},

		// Preset actions will be assigned after GUI setup
	},

	presets: {
		currentPresetName: "MyRock",

		// availablePresets will be an array of names, lil-gui needs an object for dropdown if using obj[key]
		// For simplicity, we'll manage availablePresets as an array and update lil-gui options.
		// The currently selected preset will be stored here by lil-gui directly.
		// Default selected
		selectedPreset: "Default Slate",
	},
};

// --- WASM Loader ---
async function initWasm() {
	try {
		// @ts-expect-error
		const wasm = await import("../rust-wasm/pkg/rock_generator_wasm.js");

		await wasm.default();

		wasmModule = wasm;

		console.log("WASM Module Loaded:", wasmModule);

		// No populateDefaultParamsFromWasm for now, config object is the source of truth
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

	// The availablePresets will be populated into the controller by updatePresetDropdown
	presetGuiFolder
		.add(config.presets, "selectedPreset", [])
		.name("Load Preset")
		.onChange(config.actions.loadPreset);

	gui.add(config.actions, "giftRock").name("🎁 Gift This Rock");
}

// Updated addFBMToGUI to accept a change callback
function addFBMToGUI(
	parentFolder: GUI,

	fbmObject: {
		octaves: number;

		frequency: number;

		persistence: number;

		lacunarity: number;

		amplitude: number;

		seed_offset: number;
	},

	name: string,

	onChangeCallback = updateMaterialUniforms,
) {
	// Most FBM groups start closed
	const folder = parentFolder.addFolder(name).close();

	folder.add(fbmObject, "octaves", 1, 10, 1).onChange(onChangeCallback);

	folder
		.add(fbmObject, "frequency", 0.001, 20.0, 0.001)
		.name("Scale/Frequency")
		// Wider range, smaller step
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
	// For now, user clicks "Bake All Textures" button.
}

// --- Parameter Getter Functions (for WASM and Uniforms) ---
// These convert values from the `config` object to the format WASM expects
// or directly to THREE.js types for uniforms.

function getScalarFieldParamsForWasm() {
	return {
		// This structure must match what Rust's ScalarFieldShapeParams (deserialized from JsValue) expects
		base_sphere_radius: config.scalarField.baseSphereRadius,

		base_sphere_influence: config.scalarField.baseSphereInfluence,

		// Spread to copy
		sphere_distort_fbm: { ...config.scalarField.sphereDistortFBM },

		large_form_fbm: { ...config.scalarField.largeFormFBM },

		medium_detail_fbm: { ...config.scalarField.mediumDetailFBM },

		fine_detail_fbm: { ...config.scalarField.fineDetailFBM },
	};
}

function getGridDimensionsForWasm() {
	// Spread to copy
	return { ...config.grid };
}

function getAlbedoBakeParamsForWasm() {
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

		// Ensure all fields expected by Rust AlbedoBakeParams are here
	};
}

function getHeightBakeParamsForWasm() {
	return {
		// Using POM's height FBM for general height too
		base_fbm: { ...config.pom.heightFBM },

		detail_fbm: {
			...config.pom.heightFBM,

			frequency: config.pom.heightFBM.frequency * 2.5,

			amplitude: config.pom.heightFBM.amplitude * 0.5,

			// Example: finer detail
		},

		// Could be a config param
		detail_blend_factor: 0.4,

		// Baked height map is normalized 0-1
		overall_amplitude: 1.0,
	};
}

function getNormalBakeParamsForWasm() {
	return { strength: config.normalDetail.strength };
}

function getRoughnessBakeParamsForWasm() {
	return {
		fbm_params: { ...config.roughness.fbm },

		min_roughness: config.roughness.min,

		max_roughness: config.roughness.max,
	};
}

function getAoBakeParamsForWasm() {
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

	// Use seed from config
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

	// Center the rock at the origin
	const meshOffset = {
		// Offset by half of the scaled grid extent
		x: (-(gridDims.width - 1) * scaleFactor) / 2.0,

		y: (-(gridDims.height - 1) * scaleFactor) / 2.0,

		z: (-(gridDims.depth - 1) * scaleFactor) / 2.0,
	};

	console.time("Scalar Field (WASM)");

	let scalarFieldData;

	try {
		scalarFieldData = wasmModule.get_scalar_field_structured_params_wasm(
			// Pass JS object directly
			gridDims,

			currentGlobalSeed,

			// Pass JS object directly
			scalarFieldShapeParams,
		);

		// scalarFieldData will be Float32Array (or Uint8Array if WASM returns ArrayBuffer and JS creates view)
	} catch (e) {
		console.error("Scalar field WASM error:", e);

		if (loadingIndicator) {
			loadingIndicator.style.display = "none";
		}

		return;
	}

	console.timeEnd("Scalar Field (WASM)");

	console.time("Mesh Extraction (WASM)");

	let meshDataWasm;

	try {
		// Ensure scalarFieldData is a Float32Array before passing
		const finalScalarFieldData =
			scalarFieldData instanceof Float32Array
				? scalarFieldData
				: new Float32Array(scalarFieldData);

		meshDataWasm = wasmModule.extract_mesh_wasm(
			// Pass Float32Array
			finalScalarFieldData,

			// Pass JS object for grid dimensions
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

		if (loadingIndicator) {
			loadingIndicator.style.display = "none";
		}

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

		if (loadingIndicator) {
			loadingIndicator.style.display = "none";
		}

		if (rockMesh) {
			scene.remove(rockMesh);

			// Dispose old geometry
			rockMesh.geometry.dispose();
		}

		return;
	}

	const geometry = new THREE.BufferGeometry();

	// This is Float32Array directly from wasm-bindgen from Vec<f32>
	const vertexData = meshDataWasm.vertices;

	// This is Uint32Array directly from wasm-bindgen from Vec<u32>
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

		new THREE.Float32BufferAttribute(positions, 3),
	);

	geometry.setAttribute(
		"normal",

		new THREE.Float32BufferAttribute(normals, 3),
	);

	geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

	geometry.setIndex(new THREE.BufferAttribute(indexData, 1));

	// If your WASM module has explicit free functions for the returned struct:
	// Example if MeshData struct has a .free() method exposed by wasm-bindgen
	// meshDataWasm.free();

	// --- Shader Material Setup ---
	if (!rockMaterial) {
		const [vertexShaderText, fragmentShaderText] = await Promise.all([
			fetch(VERTEX_SHADER_PATH).then((res) => res.text()),

			fetch(FRAGMENT_SHADER_PATH).then((res) => {
				// Basic include system (can be expanded)
				return res.text().then(async (mainShader) => {
					const includeRegex = /#include\s+<([\w./]+)>/g;

					let match: any[] | null;

					let processedShader = mainShader;

					const includePromises = [];

					// Find all includes
					while ((match = includeRegex.exec(mainShader)) !== null) {
						// Assuming includes are relative to shaders dir
						const includePath = `./shaders/${match[1]}`;

						includePromises.push(
							fetch(includePath)
								.then((r) => r.text())
								.then((includeContent) => {
									if (match) {
										// Replace in a way that doesn't mess up subsequent regex matches
										// This simple replace might have issues if includes are nested or duplicated.
										// A more robust system would track replacements.
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
			}),
		]);

		rockMaterial = new THREE.ShaderMaterial({
			vertexShader: vertexShaderText,

			fragmentShader: fragmentShaderText,

			uniforms: createShaderUniforms(),

			clippingPlanes: [
				new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.001),

				// Clip above y=0 (rock appears from below)
			],

			// Allows Three.js to populate standard light uniforms
			lights: true,

			// For debugging geometry
			// side: THREE.DoubleSide,
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
		// Dispose old geometry
		rockMesh.geometry.dispose();

		rockMesh.geometry = geometry;

		// Assign new/updated material
		rockMesh.material = rockMaterial;
	} else {
		rockMesh = new THREE.Mesh(geometry, rockMaterial);

		scene.add(rockMesh);
	}

	animateSynthesis();

	if (loadingIndicator) {
		loadingIndicator.style.display = "none";
	}

	if (seedDisplay)
		seedDisplay.innerText = `Displayed Seed: ${currentGlobalSeed}`;
}

// --- Create Shader Uniforms (Matches GLSL and config structure) ---
function createShaderUniforms() {
	// Defines the complete structure of uniforms. Values will be set by updateMaterialUniforms.
	const uniforms = {
		// Time & Seed
		uGlobalSeed: { value: 0.0 },

		uTime: { value: 0.0 },

		uSynthesisProgress: { value: 0.0 },

		cameraPosition: { value: new THREE.Vector3() },

		// --- From THREE.UniformsLib.lights ---
		// These will be automatically populated by Three.js if material.lights = true
		// and you use standard light types in your scene.
		// Example: ambientLightColor, directionalLights, directionalLightShadows, spotLights etc.
		// For custom light handling, define them explicitly:
		uAmbientLightColor: { value: new THREE.Color(0x000000) },

		uDirLightColor: { value: new THREE.Color(0x000000) },

		uDirLightDirection: { value: new THREE.Vector3(0, 1, 0) },

		// Material Globals
		uTriPlanar_BlendSharpness: { value: 8.0 },

		// Albedo Layers (Base, Strata, Veins, Flecks)
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

		// Ambient Occlusion
		uAO_Strength: { value: 0.0 },

		uAO_Octaves: { value: 0 },

		uAO_Persistence: { value: 0.0 },

		uAO_Lacunarity: { value: 0.0 },

		uAO_Scale: { value: 0.0 },

		uAO_Amplitude: { value: 0.0 },

		uAO_SeedOffset: { value: 0.0 },

		// Normal Detail (for procedural height field used to derive normals)
		uNormalDetail_Strength: { value: 0.0 },

		uNormalDetail_Octaves: { value: 0 },

		uNormalDetail_Persistence: { value: 0.0 },

		uNormalDetail_Lacunarity: { value: 0.0 },

		uNormalDetail_Scale: { value: 0.0 },

		uNormalDetail_Amplitude: { value: 0.0 },

		uNormalDetail_SeedOffset: { value: 0.0 },

		// Parallax Occlusion Mapping (POM)
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

		// Weathering - Dust
		uDustColor: { value: new THREE.Color() },

		uDust_AccumulationFactor: { value: 0.0 },

		uDust_Noise_Octaves: { value: 0 },

		uDust_Noise_Persistence: { value: 0.0 },

		uDust_Noise_Lacunarity: { value: 0.0 },

		uDust_NoiseScale: { value: 0.0 },

		uDust_Noise_Amplitude: { value: 0.0 },

		// GLSL uses uDust_NoiseScale, etc.
		uDust_SeedOffset: { value: 0.0 },

		// Weathering - Water Streaks
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

		// Weathering - Lichen/Moss
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

		// Baked Texture Samplers & Toggles
		uUseBakedAlbedo: { value: false },

		uBakedAlbedoMap: { value: null },

		uUseBakedNormal: { value: false },

		uBakedNormalMap: { value: null },

		uUseBakedRoughness: { value: false },

		uBakedRoughnessMap: { value: null },

		uUseBakedAO: { value: false },

		uBakedAOMap: { value: null },

		uUseBakedPOMHeight: { value: false },

		uBakedPOMHeightMap: { value: null },
	};

	// Merge with Three.js built-in light uniforms
	return THREE.UniformsUtils.merge([uniforms, THREE.UniformsLib.lights]);
}

// --- Update Material Uniforms from Config Object ---
function updateMaterialUniforms() {
	if (!rockMaterial || !rockMaterial.uniforms) return;

	const uniforms = rockMaterial.uniforms;

	// Use the global config object for values
	const matConfig = config;

	// Helper to set FBM uniforms in the shader from a config FBM object
	function setShaderFBMUniforms(
		uniformPrefix: string,

		configFBMObject: {
			octaves: any;

			persistence: any;

			lacunarity: any;

			frequency: any;

			amplitude: any;

			seed_offset: any;
		},
	) {
		if (!uniforms[uniformPrefix + "Octaves"]) {
			console.warn(`Uniform ${uniformPrefix}Octaves not found`);

			return;

			// Basic check
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
	// General Material Uniforms
	// @ts-expect-error
	uniforms["uSynthesisProgress"].value = matConfig.synthesisProgress;

	// @ts-expect-error
	uniforms["uTriPlanar_BlendSharpness"].value =
		matConfig.triPlanarBlendSharpness;

	// Albedo
	// Albedo
	// @ts-expect-error
	uniforms["uSlateColorLight"].value.set(matConfig.albedo.slateColorLight);

	// @ts-expect-error
	uniforms["uSlateColorDark"].value.set(matConfig.albedo.slateColorDark);

	setShaderFBMUniforms("uAlbedoBase_", matConfig.albedo.baseFBM);

	// @ts-expect-error
	uniforms["uStrataColor"].value.set(matConfig.albedo.strataColor);

	// @ts-expect-error
	uniforms["uStrata_Influence"].value = matConfig.albedo.strataInfluence;

	// @ts-expect-error
	uniforms["uStrata_FrequencyY_Stretch"].value =
		matConfig.albedo.strataFreqYStretch;

	setShaderFBMUniforms("uStrata_", matConfig.albedo.strataFBM);

	// @ts-expect-error
	uniforms["uVeinColorPrimary"].value.set(matConfig.albedo.veinColorPrimary);

	// @ts-expect-error
	uniforms["uVeins_Threshold"].value = matConfig.albedo.veinsThreshold;

	setShaderFBMUniforms("uVeins_", matConfig.albedo.veinsFBM);

	setShaderFBMUniforms("uVeins_Warp_", matConfig.albedo.veinsWarpFBM);

	// @ts-expect-error
	uniforms["uFleckColor"].value.set(matConfig.albedo.fleckColor);

	// @ts-expect-error
	uniforms["uFlecks_Threshold"].value = matConfig.albedo.flecksThreshold;

	setShaderFBMUniforms("uFlecks_", matConfig.albedo.flecksFBM);

	// Roughness
	// Roughness
	// @ts-expect-error
	uniforms["uRoughness_Min"].value = matConfig.roughness.min;

	// @ts-expect-error
	uniforms["uRoughness_Max"].value = matConfig.roughness.max;

	setShaderFBMUniforms("uRoughness_", matConfig.roughness.fbm);

	// Ambient Occlusion
	// Ambient Occlusion
	// @ts-expect-error
	uniforms["uAO_Strength"].value = matConfig.ao.strength;

	setShaderFBMUniforms("uAO_", matConfig.ao.fbm);

	// Normal Detail
	// Normal Detail
	// @ts-expect-error
	uniforms["uNormalDetail_Strength"].value = matConfig.normalDetail.strength;

	setShaderFBMUniforms("uNormalDetail_", matConfig.normalDetail.fbm);

	// Parallax Occlusion Mapping (POM)
	// Parallax Occlusion Mapping (POM)
	// @ts-expect-error
	uniforms["uEnablePOM"].value = matConfig.pom.enable;

	// @ts-expect-error
	uniforms["uPOM_HeightScale"].value = matConfig.pom.heightScaleEffect;

	// @ts-expect-error
	uniforms["uPOM_MinSteps"].value = matConfig.pom.minSteps;

	// @ts-expect-error
	uniforms["uPOM_MaxSteps"].value = matConfig.pom.maxSteps;

	// @ts-expect-error
	uniforms["uPOM_WorldSpaceUVScale"].value = matConfig.pom.worldSpaceUVScale;

	setShaderFBMUniforms("uPOMHeight_", matConfig.pom.heightFBM);

	// Weathering - Dust
	// Weathering - Dust
	// @ts-expect-error
	uniforms["uDustColor"].value.set(matConfig.dust.color);

	// @ts-expect-error
	uniforms["uDust_AccumulationFactor"].value =
		matConfig.dust.accumulationFactor;

	// GLSL uses uDust_NoiseScale, uDust_Noise_Octaves etc. Make sure config.dust.noiseFBM matches this naming implicitly
	// or adjust uniform names in GLSL / setShaderFBMUniforms to match config structure for dust noise.
	// Assuming GLSL uses "uDust_Noise_" prefix for FBM uniforms:
	// GLSL uses uDust_NoiseScale, uDust_Noise_Octaves etc. Make sure config.dust.noiseFBM matches this naming implicitly
	// or adjust uniform names in GLSL / setShaderFBMUniforms to match config structure for dust noise.
	// Assuming GLSL uses "uDust_Noise_" prefix for FBM uniforms:
	// Map config.frequency to GLSL ...NoiseScale
	// @ts-expect-error
	uniforms["uDust_NoiseScale"].value = matConfig.dust.noiseFBM.frequency;

	// @ts-expect-error
	uniforms["uDust_SeedOffset"].value = matConfig.dust.noiseFBM.seed_offset;

	// @ts-expect-error
	uniforms["uDust_Noise_Octaves"].value = matConfig.dust.noiseFBM.octaves;

	// @ts-expect-error
	uniforms["uDust_Noise_Persistence"].value =
		matConfig.dust.noiseFBM.persistence;

	// @ts-expect-error
	uniforms["uDust_Noise_Lacunarity"].value =
		matConfig.dust.noiseFBM.lacunarity;

	// @ts-expect-error
	uniforms["uDust_Noise_Amplitude"].value = matConfig.dust.noiseFBM.amplitude;

	// Weathering - Water Streaks
	// Weathering - Water Streaks
	// @ts-expect-error
	uniforms["uWaterStreakColor"].value.set(matConfig.waterStreaks.color);

	// @ts-expect-error
	uniforms["uWaterStreak_Influence"].value = matConfig.waterStreaks.influence;

	// @ts-expect-error
	uniforms["uWaterStreak_RoughnessFactor"].value =
		matConfig.waterStreaks.roughnessFactor;

	// @ts-expect-error
	uniforms["uWaterStreaks_VerticalStretch"].value =
		matConfig.waterStreaks.verticalStretch;

	// @ts-expect-error
	uniforms["uWaterStreaks_FlowSpeed"].value =
		matConfig.waterStreaks.flowSpeed;

	setShaderFBMUniforms("uWaterStreaks_", matConfig.waterStreaks.fbm);

	// Weathering - Lichen/Moss
	// Weathering - Lichen/Moss
	// @ts-expect-error
	uniforms["uLichenColor"].value.set(matConfig.lichen.color);

	// @ts-expect-error
	uniforms["uLichen_Coverage"].value = matConfig.lichen.coverage;

	// @ts-expect-error
	uniforms["uLichen_Threshold"].value = matConfig.lichen.threshold;

	// @ts-expect-error
	uniforms["uLichen_Smoothness"].value = matConfig.lichen.smoothness;

	// @ts-expect-error
	uniforms["uLichen_Roughness"].value = matConfig.lichen.roughness;

	// @ts-expect-error
	uniforms["uLichen_UpwardBias"].value = matConfig.lichen.upwardBias;

	// @ts-expect-error
	uniforms["uLichen_AOInfluence"].value = matConfig.lichen.aoInfluence;

	setShaderFBMUniforms("uLichen_", matConfig.lichen.fbm);

	// Reveal Mask FBM
	setShaderFBMUniforms("uReveal_", matConfig.revealFBM);

	// Baked Texture Flags & Samplers
	// @ts-expect-error
	uniforms["uUseBakedAlbedo"].value =
		matConfig.albedo.useBaked && !!bakedAlbedoMap;

	// @ts-expect-error
	uniforms["uBakedAlbedoMap"].value = bakedAlbedoMap;

	// @ts-expect-error
	uniforms["uUseBakedNormal"].value =
		matConfig.normalDetail.useBaked && !!bakedNormalMap;

	// @ts-expect-error
	uniforms["uBakedNormalMap"].value = bakedNormalMap;

	// @ts-expect-error
	uniforms["uUseBakedRoughness"].value =
		matConfig.roughness.useBaked && !!bakedRoughnessMap;

	// @ts-expect-error
	uniforms["uBakedRoughnessMap"].value = bakedRoughnessMap;

	// @ts-expect-error
	uniforms["uUseBakedAO"].value = matConfig.ao.useBaked && !!bakedAOMap;

	// @ts-expect-error
	uniforms["uBakedAOMap"].value = bakedAOMap;

	// @ts-expect-error
	uniforms["uUseBakedPOMHeight"].value =
		matConfig.pom.useBakedHeight && !!bakedHeightMapTexture;

	// @ts-expect-error
	uniforms["uBakedPOMHeightMap"].value = bakedHeightMapTexture;

	// Important: If using Three.js's lighting system (material.lights = true),

	// you might not need to manually set uAmbientLightColor, uDirLightColor, etc.
	// as Three.js will populate `ambientLightColor`, `directionalLights[i].color`, etc.
	// However, our custom GLSL uses uAmbientLightColor, so we should update it.
	const ambientLightInScene = scene.children.find((c) => c.isAmbientLight);

	if (ambientLightInScene) {
		// @ts-expect-error
		uniforms["uAmbientLightColor"].value
			.copy(ambientLightInScene.color)
			.multiplyScalar(ambientLightInScene.intensity);
	}

	const dirLightInScene = scene.children.find(
		(c) => c.isDirectionalLight,

		// Assuming one main directional light
	);

	if (dirLightInScene) {
		// @ts-expect-error
		uniforms["uDirLightColor"].value
			.copy(dirLightInScene.color)
			.multiplyScalar(dirLightInScene.intensity);

		// @ts-expect-error
		uniforms["uDirLightDirection"].value
			.copy(dirLightInScene.position)
			// Or get direction from target
			.normalize();
	}

	// Generally good practice, though Three.js often detects changes.
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

	// Or from config.baking.textureSize if you add it
	const textureSize = 512;

	currentGlobalSeed = config.seed;

	try {
		// --- Albedo ---
		if (config.albedo.useBaked) {
			// Only bake if the toggle is on (or bake always and let toggle control usage)
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

				THREE.RGBAFormat,
			);

			bakedAlbedoMap.needsUpdate = true;

			console.log("Albedo map baked.");
		} else {
			if (bakedAlbedoMap) bakedAlbedoMap.dispose();

			bakedAlbedoMap = null;
		}

		// --- Height (for POM and Normals) ---
		// Bake height map regardless if POM or Normal baking is enabled, as Normal baking depends on it
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

			THREE.RGBAFormat,
		);

		bakedHeightMapTexture.needsUpdate = true;

		// Convert RGBA height (using R channel) to Float32Array for normal baker
		bakedHeightMapData = new Float32Array(textureSize * textureSize);

		for (let i = 0; i < textureSize * textureSize; i++) {
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

		alert("Texture baking failed. See console.");
	} finally {
		// Crucial to update shader with newly baked (or nulled) maps
		updateMaterialUniforms();

		loadingIndicator.style.display = "none";

		loadingIndicator.innerText = "Generating Rock...";
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
		rockMaterial.uniforms.uTime.value = elapsedTime;

		rockMaterial.uniforms.cameraPosition.value.copy(camera.position);

		// Update standard Three.js light uniforms if material.lights=true
		// This happens automatically. If using custom light uniforms, update them here:
		// const ambientLightInScene = scene.children.find(c => c.isAmbientLight);

		// if (ambientLightInScene) { rockMaterial.uniforms.uAmbientLightColor.value.copy(ambientLightInScene.color).multiplyScalar(ambientLightInScene.intensity); }

		// const dirLightInScene = scene.children.find(c => c.isDirectionalLight);

		// if (dirLightInScene) { rockMaterial.uniforms.uDirLightColor.value.copy(dirLightInScene.color).multiplyScalar(dirLightInScene.intensity); rockMaterial.uniforms.uDirLightDirection.value.copy(dirLightInScene.position).normalize(); }

		if (synthesisStartTime !== undefined) {
			// seconds
			const synthesisDuration = 3.0;

			let progress =
				(elapsedTime - synthesisStartTime) / synthesisDuration;

			progress = Math.min(progress, 1.0);

			rockMaterial.uniforms.uSynthesisProgress.value = progress;

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
				rockMaterial.uniforms.uSynthesisProgress.value >= 1.0)
		) {
			// Roughly 0.018 rad/sec
			rockMesh.rotation.y += 0.0003 * deltaTime * 60.0;
		}
	}

	// If using OrbitControls
	// if (controls) controls.update();

	renderer.render(scene, camera);
}

// --- Preset Management ---
// Loaded from localStorage
let presets = {};

// Increment version if structure changes
const PRESET_STORAGE_KEY = "rockGenPresets_v1.2";

function loadPresetsFromLocalStorage() {
	const storedPresets = localStorage.getItem(PRESET_STORAGE_KEY);

	if (storedPresets) {
		try {
			presets = JSON.parse(storedPresets);
		} catch (e) {
			console.error("Error parsing presets from localStorage:", e);

			// Reset if corrupted
			presets = {};
		}
	}

	// Ensure a default preset if none exist
	if (Object.keys(presets).length === 0) {
		// Deep copy
		const defaultConfigCopy = JSON.parse(JSON.stringify(config));

		// Don't save functions
		delete defaultConfigCopy.actions;

		// Don't save the dropdown list itself
		delete defaultConfigCopy.presets.availablePresets;

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

	// Deep copy current config
	const presetDataToSave = JSON.parse(JSON.stringify(config));

	// Don't save functions
	delete presetDataToSave.actions;

	if (presetDataToSave.presets)
		// Don't save internal GUI state
		delete presetDataToSave.presets.availablePresets;

	presets[name] = presetDataToSave;

	try {
		localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));

		updatePresetDropdownGUI();

		// Automatically select the newly saved preset in the dropdown
		const presetController = gui
			.controllersRecursive()
			.find(
				(c) =>
					c.object === config.presets &&
					c.property === "selectedPreset",
			);

		if (presetController) {
			presetController.setValue(name);
		}

		alert(`Preset "${name}" saved.`);
	} catch (e) {
		alert(`Error saving preset: ${e.message}. LocalStorage might be full.`);

		console.error("Error saving to localStorage:", e);
	}
}

function loadSelectedPreset() {
	// Value from lil-gui dropdown
	const name = config.presets.selectedPreset;

	if (!name || !presets[name]) {
		if (name) alert(`Preset "${name}" not found or is invalid.`);

		return;
	}

	// Deep copy
	const presetToLoad = JSON.parse(JSON.stringify(presets[name]));

	// Apply to global config object
	// This needs to be recursive for nested objects like FBM params
	function applyRecursive(
		target: {
			[x: string]: any;

			seed?: number;

			grid?: { width: number; height: number; depth: number };

			isoLevel?: number;

			scalarField?: {
				baseSphereRadius: number;

				baseSphereInfluence: number;

				sphereDistortFBM: {
					octaves: number;

					frequency: number;

					persistence: number;

					lacunarity: number;

					amplitude: number;

					seed_offset: number;
				};

				largeFormFBM: {
					octaves: number;

					frequency: number;

					persistence: number;

					lacunarity: number;

					amplitude: number;

					seed_offset: number;
				};

				mediumDetailFBM: {
					octaves: number;

					frequency: number;

					persistence: number;

					lacunarity: number;

					amplitude: number;

					seed_offset: number;
				};

				fineDetailFBM: {
					octaves: number;

					frequency: number;

					persistence: number;

					lacunarity: number;

					amplitude: number;

					seed_offset: number;
				};
			};

			meshConstruction?: { worldSize: number };

			synthesisProgress?: number;

			triPlanarBlendSharpness?: number;

			albedo?: {
				useBaked: boolean;

				slateColorLight: string;

				slateColorDark: string;

				baseFBM: {
					octaves: number;

					persistence: number;

					lacunarity: number;

					frequency: number;

					amplitude: number;

					seed_offset: number;
				};

				strataColor: string;

				strataInfluence: number;

				strataFreqYStretch: number;

				strataFBM: {
					octaves: number;

					persistence: number;

					lacunarity: number;

					frequency: number;

					amplitude: number;

					seed_offset: number;
				};

				veinColorPrimary: string;

				veinsThreshold: number;

				veinsFBM: {
					octaves: number;

					persistence: number;

					lacunarity: number;

					frequency: number;

					amplitude: number;

					seed_offset: number;
				};

				veinsWarpFBM: {
					octaves: number;

					persistence: number;

					lacunarity: number;

					frequency: number;

					amplitude: number;

					seed_offset: number;
				};

				fleckColor: string;

				flecksThreshold: number;

				flecksFBM: {
					octaves: number;

					persistence: number;

					lacunarity: number;

					frequency: number;

					amplitude: number;

					seed_offset: number;
				};
			};

			roughness?: {
				useBaked: boolean;

				min: number;

				max: number;

				fbm: {
					octaves: number;

					persistence: number;

					lacunarity: number;

					frequency: number;

					amplitude: number;

					seed_offset: number;
				};
			};

			ao?: {
				useBaked: boolean;

				strength: number;

				fbm: {
					octaves: number;

					persistence: number;

					lacunarity: number;

					frequency: number;

					amplitude: number;

					seed_offset: number;
				};
			};

			normalDetail?: {
				// For procedural normal height field
				useBaked: boolean;

				strength: number;

				fbm: {
					octaves: number;

					persistence: number;

					lacunarity: number;

					frequency: number;

					amplitude: number;

					seed_offset: number;
				};
			};

			pom?: {
				enable: boolean;

				useBakedHeight: boolean;

				heightScaleEffect: number;

				minSteps: number;

				maxSteps: number;

				worldSpaceUVScale: number;

				heightFBM: {
					octaves: number;

					persistence: number;

					lacunarity: number;

					frequency: number;

					amplitude: number;

					seed_offset: number;
				};
			};

			dust?: {
				color: string;

				accumulationFactor: number;

				noiseFBM: {
					octaves: number;

					persistence: number;

					lacunarity: number;

					frequency: number;

					amplitude: number;

					seed_offset: number;
				};
			};

			waterStreaks?: {
				color: string;

				influence: number;

				roughnessFactor: number;

				verticalStretch: number;

				flowSpeed: number;

				fbm: {
					octaves: number;

					persistence: number;

					lacunarity: number;

					frequency: number;

					amplitude: number;

					seed_offset: number;
				};
			};

			lichen?: {
				color: string;

				coverage: number;

				threshold: number;

				smoothness: number;

				roughness: number;

				upwardBias: number;

				aoInfluence: number;

				fbm: {
					octaves: number;

					persistence: number;

					lacunarity: number;

					frequency: number;

					amplitude: number;

					seed_offset: number;
				};
			};

			revealFBM?: {
				// FBM for synthesis reveal mask
				octaves: number;

				persistence: number;

				lacunarity: number;

				frequency: number;

				amplitude: number;

				seed_offset: number;
			};

			actions?: {
				regenerate: () => void;

				bakeAllTextures: () => void;

				giftRock: () => void;
			};

			presets?: {
				currentPresetName: string;

				// availablePresets will be an array of names, lil-gui needs an object for dropdown if using obj[key]
				// For simplicity, we'll manage availablePresets as an array and update lil-gui options.
				// The currently selected preset will be stored here by lil-gui directly.
				// Default selected
				selectedPreset: string;
			};

			hasOwnProperty?: any;
		},

		source: { [x: string]: any; hasOwnProperty: (arg0: string) => any },
	) {
		for (const key in source) {
			if (source.hasOwnProperty(key) && target.hasOwnProperty(key)) {
				if (
					typeof source[key] === "object" &&
					source[key] !== null &&
					!Array.isArray(source[key]) &&
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
					target[key] = source[key];
				}
			}
		}
	}

	applyRecursive(config, presetToLoad);

	// Update GUI from the new config state
	gui.controllersRecursive().forEach(
		(controller: { updateDisplay: () => any }) =>
			controller.updateDisplay(),
	);

	// Update the name input field in GUI
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
		// Clear existing options and add new ones
		const currentVal = presetController.getValue();

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

// Modify actions for presets in the config object *after* GUI is set up
// This is because lil-gui clones the actions object upon creation.
function assignPresetActions() {
	config.actions.loadPreset = loadSelectedPreset;

	config.actions.savePreset = saveCurrentPresetToLocalStorage;
}

// --- Gifting ---
function giftRock() {
	// Deep copy
	const paramsToGift = JSON.parse(JSON.stringify(config));

	// Don't need functions in JSON
	delete paramsToGift.actions;

	// Internal GUI state
	delete paramsToGift.presets.availablePresets;

	const jsonData = JSON.stringify(paramsToGift, null, 2);

	console.log("GIFTING ROCK PARAMS:", jsonData);

	// Attempt to copy to clipboard
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard
			.writeText(jsonData)
			.then(() => {
				alert(
					"Rock parameters (JSON) copied to clipboard! (Seed: " +
						currentGlobalSeed +
						")",
				);
			})
			.catch((err) => {
				console.warn("Could not copy to clipboard automatically:", err);

				alert(
					"Could not copy to clipboard. See console for JSON data. (Seed: " +
						currentGlobalSeed +
						")",
				);

				// Fallback prompt
				prompt("Copy this JSON:", jsonData);
			});
	} else {
		// Fallback for older browsers/contexts
		prompt("Copy this JSON:", jsonData);
	}

	// In a real app, this would be an API call:
	// fetch('/api/gift-rock', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: jsonData })
	// .then(response => response.json()).then(data => console.log("Gift saved on server:", data));
}

// --- Main Initialization ---
async function main() {
	try {
		if (loadingIndicator) {
			loadingIndicator.innerText = "Loading WASM...";

			loadingIndicator.style.display = "block";
		}

		await initWasm();

		if (loadingIndicator) {
			loadingIndicator.innerText = "Initializing 3D Scene...";
		}

		initThreeJS();

		if (loadingIndicator) {
			loadingIndicator.innerText = "Setting up UI...";
		}

		// Setup lil-gui, which also reads initial config values
		setupGUI();

		// Assign preset actions after GUI controllers are created
		assignPresetActions();

		// Load presets and populate dropdown
		loadPresetsFromLocalStorage();

		if (loadingIndicator) {
			loadingIndicator.innerText = "Generating Initial Rock...";
		}

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
