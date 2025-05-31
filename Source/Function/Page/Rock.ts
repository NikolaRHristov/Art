import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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
		arg0: { width: any; height: any; depth: any },
		arg1: any,
		arg2: {
			base_sphere_radius: any;

			base_sphere_influence: any;

			sphere_distort_fbm: {
				octaves: any;

				frequency: any;

				persistence: any;

				lacunarity: any;

				amplitude: any;

				seed_offset: any;
			};

			large_form_fbm: {
				octaves: any;

				frequency: any;

				persistence: any;

				lacunarity: any;

				amplitude: any;

				seed_offset: any;
			};

			medium_detail_fbm: {
				octaves: any;

				frequency: any;

				persistence: any;

				lacunarity: any;

				amplitude: any;

				seed_offset: any;
			};

			fine_detail_fbm: {
				octaves: any;

				frequency: any;

				persistence: any;

				lacunarity: any;

				amplitude: any;

				seed_offset: any;
			};
		},
	) => any;

	extract_mesh_wasm: (
		arg0: any,
		arg1: { width: any; height: any; depth: any },
		arg2: any,
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
		arg3: any,
		arg4: { strength: any },
		arg5: Float32Array<ArrayBuffer> | null,
	) => any;

	JsTextureType: { Albedo: any; Height: any; Normal: any };
};

let clock = new THREE.Clock();

let currentGlobalSeed: string;

let bakedAlbedoMap: THREE.DataTexture | null = null;

let bakedHeightMapData = null;

let bakedHeightMapTexture: THREE.DataTexture | null = null;

let bakedNormalMap: THREE.DataTexture | null = null;

let bakedRoughnessMap: { dispose: () => void } | null = null;

let bakedAOMap: { dispose: () => void } | null = null;

const rockContainer = document.getElementById("rock-container");

const loadingIndicator = document.getElementById("loading-indicator");

const giftButton = document.getElementById("giftButton");

const VERTEX_SHADER_PATH = "/Function/Page/Sphere/RockVertex.glsl";

const FRAGMENT_SHADER_PATH = "/Function/Page/Sphere/RockFragment.glsl";

async function initWasm() {
	try {
		const wasm = await import("/Function/Page/Sphere/Wasm.js");

		await wasm.default();

		wasmModule = wasm;

		console.log("WASM Module Loaded:", wasmModule);

		return wasmModule;
	} catch (err) {
		console.error("Error loading WASM module:", err);

		loadingIndicator.innerText = "Error loading WASM. Check console.";

		loadingIndicator.style.display = "block";

		throw err;
	}
}

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

	rockContainer.appendChild(renderer.domElement);

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

function getInputValue(id: string, type = "float") {
	const el = document.getElementById(id);

	if (!el) {
		console.warn(`UI element with ID "${id}" not found!`);

		return type === "int" ? 0 : type === "bool" ? false : 0.0;
	}

	switch (type) {
		case "float":
			return parseFloat(el.value);

		case "int":
			return parseInt(el.value);

		case "bool":
			return el.checked;

		case "color":
			return new THREE.Color(el.value);

		default:
			return el.value;
	}
}

function getFbmParamsFromUI(prefix: string) {
	return {
		octaves: getInputValue(prefix + "OctavesInput", "int"),

		frequency: getInputValue(prefix + "ScaleInput", "float"),
		persistence: getInputValue(prefix + "PersistenceInput", "float"),
		lacunarity: getInputValue(prefix + "LacunarityInput", "float"),
		amplitude: getInputValue(prefix + "AmplitudeInput", "float"),

		seed_offset: getInputValue(prefix + "SeedOffsetInput", "int"),
	};
}

function getScalarFieldParamsForWasm() {
	return {
		base_sphere_radius: getInputValue("baseSphereRadius", "float"),
		base_sphere_influence: getInputValue("baseSphereInfluence", "float"),
		sphere_distort_fbm: getFbmParamsFromUI("sphereDistortFBM_"),
		large_form_fbm: getFbmParamsFromUI("largeFormFBM_"),
		medium_detail_fbm: getFbmParamsFromUI("mediumDetailFBM_"),
		fine_detail_fbm: getFbmParamsFromUI("fineDetailFBM_"),
	};
}

function getGridDimensionsForWasm() {
	return {
		width: getInputValue("gridWidth", "int"),
		height: getInputValue("gridHeight", "int"),
		depth: getInputValue("gridDepth", "int"),
	};
}

function getAlbedoBakeParamsForWasm() {
	const dark = getInputValue("slateColorDarkInput", "color");

	const light = getInputValue("slateColorLightInput", "color");

	const strata = getInputValue("strataColorInput", "color");

	const vein = getInputValue("veinColorPrimaryInput", "color");

	const fleck = getInputValue("fleckColorInput", "color");

	return {
		base_fbm: getFbmParamsFromUI("albedoBaseFBM_"),
		strata_fbm: getFbmParamsFromUI("strataFBM_"),
		vein_fbm: getFbmParamsFromUI("veinsFBM_"),
		vein_warp_fbm: getFbmParamsFromUI("veinsWarpFBM_"),
		fleck_fbm: getFbmParamsFromUI("flecksFBM_"),
		slate_color_dark_r: dark.r,
		slate_color_dark_g: dark.g,
		slate_color_dark_b: dark.b,
		slate_color_light_r: light.r,
		slate_color_light_g: light.g,
		slate_color_light_b: light.b,
		strata_color_r: strata.r,
		strata_color_g: strata.g,
		strata_color_b: strata.b,
		strata_influence: getInputValue("strataInfluenceInput", "float"),
		strata_frequency_y_stretch: getInputValue(
			"strataFreqYStretchInput",
			"float",
		),
		vein_color_primary_r: vein.r,
		vein_color_primary_g: vein.g,
		vein_color_primary_b: vein.b,
		vein_threshold: getInputValue("veinsThresholdInput", "float"),
		fleck_color_r: fleck.r,
		fleck_color_g: fleck.g,
		fleck_color_b: fleck.b,
		fleck_threshold: getInputValue("flecksThresholdInput", "float"),
	};
}

function getHeightBakeParamsForWasm() {
	return {
		base_fbm: getFbmParamsFromUI("heightBaseFBM_"),
		detail_fbm: getFbmParamsFromUI("heightDetailFBM_"),
		detail_blend_factor: getInputValue("heightDetailBlendInput", "float"),
		overall_amplitude: getInputValue(
			"heightOverallAmplitudeInput",
			"float",
		),
	};
}

function getNormalBakeParamsForWasm() {
	return { strength: getInputValue("normalBakeStrengthInput", "float") };
}

function getRoughnessBakeParamsForWasm() {
	return {
		fbm_params: getFbmParamsFromUI("roughnessFBM_"),
		min_roughness: getInputValue("roughnessMinInput", "float"),
		max_roughness: getInputValue("roughnessMaxInput", "float"),
	};
}

function getAoBakeParamsForWasm() {
	return {
		fbm_params: getFbmParamsFromUI("aoFBM_"),

		strength: getInputValue("aoStrengthInputUI", "float"),
	};
}

async function generateAndDisplayRock() {
	if (!wasmModule) {
		console.error("WASM module not loaded.");

		return;
	}

	loadingIndicator.style.display = "block";

	giftButton.disabled = true;

	currentGlobalSeed = getInputValue("mainSeedInput", "int");

	document.getElementById("seedDisplay").innerText =
		`Generating with Seed: ${currentGlobalSeed}`;

	const gridDims = getGridDimensionsForWasm();

	const scalarFieldShapeParams = getScalarFieldParamsForWasm();

	const isoLevel = getInputValue("isoLevelInput", "float");

	const desiredWorldSize = 2.0;

	const largestGridDim = Math.max(
		gridDims.width,
		gridDims.height,
		gridDims.depth,
	);

	const scaleFactor = desiredWorldSize / largestGridDim;

	const meshScale = { x: scaleFactor, y: scaleFactor, z: scaleFactor };

	const meshOffset = {
		x: -desiredWorldSize / 2,
		y: -desiredWorldSize / 2,
		z: -desiredWorldSize / 2,
	};

	console.time("Scalar Field (WASM)");

	let scalarFieldData;

	try {
		scalarFieldData = wasmModule.get_scalar_field_structured_params_wasm(
			gridDims,
			currentGlobalSeed,
			scalarFieldShapeParams,
		);
	} catch (e) {
		console.error("Scalar field WASM error:", e);

		loadingIndicator.style.display = "none";

		return;
	}

	console.timeEnd("Scalar Field (WASM)");

	console.time("Mesh Extraction (WASM)");

	let meshDataWasm;

	try {
		meshDataWasm = wasmModule.extract_mesh_wasm(
			scalarFieldData,
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

		loadingIndicator.style.display = "none";

		return;
	}

	console.timeEnd("Mesh Extraction (WASM)");

	if (
		!meshDataWasm ||
		!meshDataWasm.vertices ||
		meshDataWasm.vertices.length === 0
	) {
		console.warn("Mesh extraction returned no vertices.");

		loadingIndicator.style.display = "none";

		if (rockMesh) scene.remove(rockMesh);

		return;
	}

	const geometry = new THREE.BufferGeometry();

	geometry.setAttribute(
		"position",
		new THREE.Float32BufferAttribute(
			meshDataWasm.vertices.filter((_: any, i: number) => i % 8 < 3),
			3,
		),
	);

	geometry.setAttribute(
		"normal",
		new THREE.Float32BufferAttribute(
			meshDataWasm.vertices.filter(
				(_: any, i: number) => i % 8 >= 3 && i % 8 < 6,
			),
			3,
		),
	);

	geometry.setAttribute(
		"uv",
		new THREE.Float32BufferAttribute(
			meshDataWasm.vertices.filter((_: any, i: number) => i % 8 >= 6),
			2,
		),
	);

	geometry.setIndex(new THREE.BufferAttribute(meshDataWasm.indices, 1));

	if (bakedAlbedoMap) bakedAlbedoMap.dispose();

	bakedAlbedoMap = null;

	bakedHeightMapData = null;

	if (bakedHeightMapTexture) bakedHeightMapTexture.dispose();

	bakedHeightMapTexture = null;

	if (bakedNormalMap) bakedNormalMap.dispose();

	bakedNormalMap = null;

	if (bakedRoughnessMap) bakedRoughnessMap.dispose();

	bakedRoughnessMap = null;

	if (bakedAOMap) bakedAOMap.dispose();

	bakedAOMap = null;

	const textureSize = 512;

	if (getInputValue("useBakedAlbedoToggle", "bool")) {
		const params = getAlbedoBakeParamsFromUI();

		const texData = await wasmModule.bake_texture_wasm(
			wasmModule.JsTextureType.Albedo,
			textureSize,
			textureSize,
			currentGlobalSeed,
			params,
			null,
		);

		bakedAlbedoMap = new THREE.DataTexture(
			texData,
			textureSize,
			textureSize,
			THREE.RGBAFormat,
		);

		bakedAlbedoMap.needsUpdate = true;
	}

	if (getInputValue("useBakedHeightToggle", "bool")) {
		const params = getHeightBakeParamsFromUI();

		const heightTexDataBytes = await wasmModule.bake_texture_wasm(
			wasmModule.JsTextureType.Height,
			textureSize,
			textureSize,
			currentGlobalSeed,
			params,
			null,
		);

		bakedHeightMapData = new Float32Array(textureSize * textureSize);

		for (let i = 0; i < textureSize * textureSize; i++) {
			bakedHeightMapData[i] = heightTexDataBytes[i * 4] / 255.0;
		}

		bakedHeightMapTexture = new THREE.DataTexture(
			heightTexDataBytes,
			textureSize,
			textureSize,
			THREE.RGBAFormat,
		);

		bakedHeightMapTexture.needsUpdate = true;
	}

	if (getInputValue("useBakedNormalToggle", "bool")) {
		if (!bakedHeightMapData) {
			console.warn(
				"Baking normals requires height map to be baked first.",
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

			bakedNormalMap = new THREE.DataTexture(
				normalTexData,
				textureSize,
				textureSize,
				THREE.RGBAFormat,
			);

			bakedNormalMap.needsUpdate = true;
		}
	}

	if (!rockMaterial) {
		const vertexShader = await (await fetch(VERTEX_SHADER_PATH)).text();

		const fragmentShader = await (await fetch(FRAGMENT_SHADER_PATH)).text();

		rockMaterial = new THREE.ShaderMaterial({
			vertexShader,
			fragmentShader,

			uniforms: createShaderUniforms(),
			clippingPlanes: [
				new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.001),
			],

			lights: true,
		});
	}

	updateAllMaterialUniformsFromUI();

	rockMaterial.uniforms.uGlobalSeed.value = parseFloat(currentGlobalSeed);

	rockMaterial.uniforms.uSynthesisProgress.value = 0.0;

	if (rockMesh) {
		rockMesh.geometry.dispose();

		rockMesh.geometry = geometry;

		rockMesh.material = rockMaterial;
	} else {
		rockMesh = new THREE.Mesh(geometry, rockMaterial);

		scene.add(rockMesh);
	}

	animateSynthesis();

	loadingIndicator.style.display = "none";

	document.getElementById("seedDisplay").innerText =
		`Displayed Seed: ${currentGlobalSeed}`;
}

function createShaderUniforms() {
	return THREE.UniformsUtils.merge([
		THREE.UniformsLib.lights,
		{
			uGlobalSeed: { value: 0.0 },
			uTime: { value: 0.0 },
			uSynthesisProgress: { value: 0.0 },
			cameraPosition: { value: new THREE.Vector3() },

			uSlateColorLight: { value: new THREE.Color() },
			uSlateColorDark: { value: new THREE.Color() },
			uTriPlanar_BlendSharpness: { value: 8.0 },
			uAlbedoBase_Octaves: { value: 5 },
			uAlbedoBase_Persistence: { value: 0.5 },
			uAlbedoBase_Lacunarity: { value: 2.0 },
			uAlbedoBase_Scale: { value: 0.2 },
			uAlbedoBase_Amplitude: { value: 1.0 },
			uAlbedoBase_SeedOffset: { value: 100.0 },

			uStrataColor: { value: new THREE.Color() },
			uStrata_Influence: { value: 0.25 },
			uStrata_FrequencyY_Stretch: { value: 0.1 },
			uStrata_Octaves: { value: 4 },
			uStrata_Persistence: { value: 0.5 },
			uStrata_Lacunarity: { value: 2.0 },
			uStrata_Scale: { value: 0.15 },
			uStrata_Amplitude: { value: 1.0 },
			uStrata_SeedOffset: { value: 110.0 },

			uVeinColorPrimary: { value: new THREE.Color() },
			uVeins_Threshold: { value: 0.75 },
			uVeins_Octaves: { value: 6 },
			uVeins_Persistence: { value: 0.4 },
			uVeins_Lacunarity: { value: 2.2 },
			uVeins_Scale: { value: 0.3 },
			uVeins_Amplitude: { value: 1.0 },
			uVeins_SeedOffset: { value: 120.0 },
			uVeins_Warp_Octaves: { value: 3 },
			uVeins_Warp_Persistence: { value: 0.5 },
			uVeins_Warp_Lacunarity: { value: 2.0 },
			uVeins_Warp_Scale: { value: 0.5 },
			uVeins_Warp_Amplitude: { value: 0.2 },
			uVeins_Warp_SeedOffset: { value: 125.0 },

			uFleckColor: { value: new THREE.Color() },
			uFlecks_Threshold: { value: 0.88 },
			uFlecks_Octaves: { value: 7 },
			uFlecks_Persistence: { value: 0.3 },
			uFlecks_Lacunarity: { value: 2.8 },
			uFlecks_Scale: { value: 2.0 },
			uFlecks_Amplitude: { value: 1.0 },
			uFlecks_SeedOffset: { value: 130.0 },

			uRoughness_Min: { value: 0.3 },
			uRoughness_Max: { value: 0.9 },
			uRoughness_Octaves: { value: 5 },
			uRoughness_Persistence: { value: 0.55 },
			uRoughness_Lacunarity: { value: 1.9 },
			uRoughness_Scale: { value: 0.25 },
			uRoughness_Amplitude: { value: 1.0 },
			uRoughness_SeedOffset: { value: 150.0 },

			uAO_Strength: { value: 0.7 },
			uAO_Octaves: { value: 4 },
			uAO_Persistence: { value: 0.6 },
			uAO_Lacunarity: { value: 1.8 },
			uAO_Scale: { value: 0.1 },
			uAO_Amplitude: { value: 1.0 },
			uAO_SeedOffset: { value: 160.0 },

			uNormalDetail_Strength: { value: 0.4 },
			uNormalDetail_Octaves: { value: 6 },
			uNormalDetail_Persistence: { value: 0.45 },
			uNormalDetail_Lacunarity: { value: 2.1 },
			uNormalDetail_Scale: { value: 1.5 },
			uNormalDetail_Amplitude: { value: 0.1 },
			uNormalDetail_SeedOffset: { value: 200.0 },

			uEnablePOM: { value: true },
			uPOM_HeightScale: { value: 0.04 },
			uPOM_MinSteps: { value: 8 },
			uPOM_MaxSteps: { value: 48 },
			uPOM_WorldSpaceUVScale: { value: 0.05 },
			uPOMHeight_Octaves: { value: 5 },
			uPOMHeight_Persistence: { value: 0.5 },
			uPOMHeight_Lacunarity: { value: 2.0 },
			uPOMHeight_Scale: { value: 0.5 },
			uPOMHeight_Amplitude: { value: 1.0 },
			uPOMHeight_SeedOffset: { value: 300.0 },

			uDustColor: { value: new THREE.Color() },
			uDust_AccumulationFactor: { value: 0.4 },
			uDust_NoiseScale: { value: 0.8 },
			uDust_SeedOffset: { value: 400.0 },

			uWaterStreakColor: { value: new THREE.Color() },
			uWaterStreak_Influence: { value: 0.3 },
			uWaterStreak_RoughnessFactor: { value: 0.4 },
			uWaterStreaks_VerticalStretch: { value: 5.0 },
			uWaterStreaks_FlowSpeed: { value: 0.01 },
			uWaterStreaks_Octaves: { value: 5 },
			uWaterStreaks_Persistence: { value: 0.5 },
			uWaterStreaks_Lacunarity: { value: 2.0 },
			uWaterStreaks_Scale: { value: 0.3 },
			uWaterStreaks_Amplitude: { value: 1.0 },
			uWaterStreaks_SeedOffset: { value: 500.0 },

			uLichenColor: { value: new THREE.Color() },
			uLichen_Coverage: { value: 0.2 },
			uLichen_Threshold: { value: 0.6 },
			uLichen_Smoothness: { value: 0.1 },
			uLichen_Roughness: { value: 0.8 },
			uLichen_UpwardBias: { value: 0.2 },
			uLichen_AOInfluence: { value: 0.3 },
			uLichen_Octaves: { value: 6 },
			uLichen_Persistence: { value: 0.45 },
			uLichen_Lacunarity: { value: 2.1 },
			uLichen_Scale: { value: 1.2 },
			uLichen_Amplitude: { value: 1.0 },
			uLichen_SeedOffset: { value: 600.0 },

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
		},
	]);
}

function updateAllMaterialUniformsFromUI() {
	if (!rockMaterial || !rockMaterial.uniforms) return;

	const uniforms = rockMaterial.uniforms;

	function setFBMUniforms(
		prefix: string,
		fbmParams: {
			octaves: any;

			frequency: any;

			persistence: any;

			lacunarity: any;

			amplitude: any;

			seed_offset: any;
		},
	) {
		uniforms[prefix + "Octaves"].value = fbmParams.octaves;

		uniforms[prefix + "Persistence"].value = fbmParams.persistence;

		uniforms[prefix + "Lacunarity"].value = fbmParams.lacunarity;

		uniforms[prefix + "Scale"].value = fbmParams.frequency;

		uniforms[prefix + "Amplitude"].value = fbmParams.amplitude;

		uniforms[prefix + "SeedOffset"].value = fbmParams.seed_offset;
	}

	uniforms.uTriPlanar_BlendSharpness.value = getInputValue(
		"triPlanarBlendSharpnessInput",
		"float",
	);

	uniforms.uSlateColorLight.value.set(
		getInputValue("slateColorLightInput", "color"),
	);

	uniforms.uSlateColorDark.value.set(
		getInputValue("slateColorDarkInput", "color"),
	);

	setFBMUniforms("uAlbedoBase_", getFbmParamsFromUI("albedoBaseFBM_"));

	uniforms.uStrataColor.value.set(getInputValue("strataColorInput", "color"));

	uniforms.uStrata_Influence.value = getInputValue(
		"strataInfluenceInput",
		"float",
	);

	uniforms.uStrata_FrequencyY_Stretch.value = getInputValue(
		"strataFreqYStretchInput",
		"float",
	);

	setFBMUniforms("uStrata_", getFbmParamsFromUI("strataFBM_"));

	uniforms.uVeinColorPrimary.value.set(
		getInputValue("veinColorPrimaryInput", "color"),
	);

	uniforms.uVeins_Threshold.value = getInputValue(
		"veinsThresholdInput",
		"float",
	);

	setFBMUniforms("uVeins_", getFbmParamsFromUI("veinsFBM_"));

	setFBMUniforms("uVeins_Warp_", getFbmParamsFromUI("veinsWarpFBM_"));

	uniforms.uFleckColor.value.set(getInputValue("fleckColorInput", "color"));

	uniforms.uFlecks_Threshold.value = getInputValue(
		"flecksThresholdInput",
		"float",
	);

	setFBMUniforms("uFlecks_", getFbmParamsFromUI("flecksFBM_"));

	uniforms.uRoughness_Min.value = getInputValue("roughnessMinInput", "float");

	uniforms.uRoughness_Max.value = getInputValue("roughnessMaxInput", "float");

	setFBMUniforms("uRoughness_", getFbmParamsFromUI("roughnessFBM_"));

	uniforms.uAO_Strength.value = getInputValue("aoStrengthInputUI", "float");

	setFBMUniforms("uAO_", getFbmParamsFromUI("aoFBM_"));

	uniforms.uNormalDetail_Strength.value = getInputValue(
		"normalDetailStrengthInputUI",
		"float",
	);

	setFBMUniforms("uNormalDetail_", getFbmParamsFromUI("normalDetailFBM_"));

	uniforms.uEnablePOM.value = getInputValue("enablePOMToggle", "bool");

	uniforms.uPOM_HeightScale.value = getInputValue(
		"pomHeightScaleInputUI",
		"float",
	);

	uniforms.uPOM_MinSteps.value = getInputValue("pomMinStepsInput", "int");

	uniforms.uPOM_MaxSteps.value = getInputValue("pomMaxStepsInput", "int");

	uniforms.uPOM_WorldSpaceUVScale.value = getInputValue(
		"pomWorldSpaceUVScaleInput",
		"float",
	);

	setFBMUniforms("uPOMHeight_", getFbmParamsFromUI("pomHeightFBM_"));

	uniforms.uDustColor.value.set(getInputValue("dustColorInput", "color"));

	uniforms.uDust_AccumulationFactor.value = getInputValue(
		"dustAccumulationFactorInput",
		"float",
	);

	setFBMUniforms("uDust_Noise_", getFbmParamsFromUI("dustNoiseFBM_"));

	uniforms.uWaterStreakColor.value.set(
		getInputValue("waterStreakColorInput", "color"),
	);

	uniforms.uWaterStreak_Influence.value = getInputValue(
		"waterStreakInfluenceInput",
		"float",
	);

	uniforms.uWaterStreak_RoughnessFactor.value = getInputValue(
		"waterStreakRoughFactorInput",
		"float",
	);

	uniforms.uWaterStreaks_VerticalStretch.value = getInputValue(
		"waterStreakVerticalStretchInput",
		"float",
	);

	uniforms.uWaterStreaks_FlowSpeed.value = getInputValue(
		"waterStreakFlowSpeedInput",
		"float",
	);

	setFBMUniforms("uWaterStreaks_", getFbmParamsFromUI("waterStreaksFBM_"));

	uniforms.uLichenColor.value.set(getInputValue("lichenColorInput", "color"));

	uniforms.uLichen_Coverage.value = getInputValue(
		"lichenCoverageInput",
		"float",
	);

	uniforms.uLichen_Threshold.value = getInputValue(
		"lichenThresholdInput",
		"float",
	);

	uniforms.uLichen_Smoothness.value = getInputValue(
		"lichenSmoothnessInput",
		"float",
	);

	uniforms.uLichen_Roughness.value = getInputValue(
		"lichenRoughnessInput",
		"float",
	);

	uniforms.uLichen_UpwardBias.value = getInputValue(
		"lichenUpwardBiasInput",
		"float",
	);

	uniforms.uLichen_AOInfluence.value = getInputValue(
		"lichenAOInfluenceInput",
		"float",
	);

	setFBMUniforms("uLichen_", getFbmParamsFromUI("lichenFBM_"));

	uniforms.uUseBakedAlbedo.value =
		getInputValue("useBakedAlbedoToggle", "bool") && !!bakedAlbedoMap;

	uniforms.uUseBakedNormal.value =
		getInputValue("useBakedNormalToggle", "bool") && !!bakedNormalMap;

	uniforms.uUseBakedRoughness.value =
		getInputValue("useBakedRoughnessToggle", "bool") && !!bakedRoughnessMap;

	uniforms.uUseBakedAO.value =
		getInputValue("useBakedAOToggle", "bool") && !!bakedAOMap;

	uniforms.uUseBakedPOMHeight.value =
		getInputValue("useBakedPOMHeightToggle", "bool") &&
		!!bakedHeightMapTexture;

	rockMaterial.needsUpdate = true;
}

let synthesisStartTime: number | undefined;

function animateSynthesis() {
	synthesisStartTime = clock.getElapsedTime();
}

function animate() {
	requestAnimationFrame(animate);

	const elapsedTime = clock.getElapsedTime();

	const deltaTime = clock.getDelta();

	if (rockMaterial && rockMaterial.uniforms.uTime) {
		rockMaterial.uniforms.uTime.value = elapsedTime;
	}

	if (rockMaterial && rockMaterial.uniforms.cameraPosition) {
		rockMaterial.uniforms.cameraPosition.value.copy(camera.position);
	}

	if (
		rockMaterial &&
		rockMaterial.uniforms.uSynthesisProgress &&
		synthesisStartTime !== undefined
	) {
		const synthesisDuration = 3.0;

		let progress = (elapsedTime - synthesisStartTime) / synthesisDuration;

		progress = Math.min(progress, 1.0);

		rockMaterial.uniforms.uSynthesisProgress.value = progress;

		if (progress >= 1.0) {
			synthesisStartTime = undefined;

			giftButton.disabled = false;
		}
	}

	if (
		rockMesh &&
		rockMaterial &&
		(!synthesisStartTime ||
			rockMaterial.uniforms.uSynthesisProgress.value >= 1.0)
	) {
		rockMesh.rotation.y += 0.0003 * deltaTime * 60;
	}

	renderer.render(scene, camera);
}

function setupEventListeners() {
	document
		.getElementById("regenerateButton")
		.addEventListener("click", generateAndDisplayRock);

	document.getElementById("giftButton").addEventListener("click", () => {
		const allParams = {
			seed: currentGlobalSeed,
			grid: getGridDimensionsForWasm(),
			scalarField: getScalarFieldParamsForWasm(),
			isoLevel: getInputValue("isoLevelInput", "float"),

			albedoBaseScale: getInputValue("albedoBaseFBM_ScaleInput", "float"),
		};

		console.log(
			"Gifting rock with params:",
			JSON.stringify(allParams, null, 2),
		);

		alert(
			`Rock Seed ${currentGlobalSeed} ready for gifting! (Check console for full params)`,
		);
	});

	const controlsToUpdateShader = document.querySelectorAll(
		'#controlsPanel input[type="number"], #controlsPanel input[type="range"], #controlsPanel input[type="color"], #controlsPanel input[type="checkbox"]',
	);

	controlsToUpdateShader.forEach((input) => {
		if (
			input.id !== "mainSeedInput" &&
			!input.id.startsWith("grid") &&
			input.id !== "isoLevelInput"
		) {
			const eventType =
				input.type === "range" ||
				input.type === "text" ||
				(input.type === "number" && input.step)
					? "input"
					: "change";

			input.addEventListener(eventType, updateAllMaterialUniformsFromUI);
		}
	});

	[
		"useBakedAlbedoToggle",
		"useBakedNormalToggle",
		"useBakedRoughnessToggle",
		"useBakedAOToggle",
		"useBakedPOMHeightToggle",
	].forEach((id) => {
		document.getElementById(id)?.addEventListener("change", () => {
			updateAllMaterialUniformsFromUI();
		});
	});
}

async function main() {
	try {
		await initWasm();

		initThreeJS();

		setupEventListeners();

		await generateAndDisplayRock();

		animate();
	} catch (error) {
		console.error("Initialization failed:", error);

		loadingIndicator.innerText =
			"Error during initialization. Check console.";

		loadingIndicator.style.display = "block";
	}
}

main();
