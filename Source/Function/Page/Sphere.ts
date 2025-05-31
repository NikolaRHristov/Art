// --- Import necessary Three.js components, CSG library, and GUI ---
import GUI from "lil-gui";
import * as THREE from "three";
import { CSG } from "three-csg-ts";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// --- Main Async Function to Load Shaders and Initialize Scene ---
async function InitializeSceneAndApp() {
	// --- Fetch Shader Code ---
	const ConcreteVertexShaderSource = await fetch(
		// Assuming this path is correct
		"/Function/Page/Sphere/ConcreteVertex.glsl",
	).then((Response) => Response.text());

	const ConcreteFragmentShaderSource = await fetch(
		// Assuming this path is correct
		"/Function/Page/Sphere/ConcreteFragment.glsl",
	).then((Response) => Response.text());

	// --- Scene Setup (Renderer, Scene, Camera, Lights) ---
	const Scene = new THREE.Scene();

	const Camera = new THREE.PerspectiveCamera(
		60,

		window.innerWidth / window.innerHeight,

		0.1,

		// Increased far plane for very long beam
		1000,
	);

	const Renderer = new THREE.WebGLRenderer({ antialias: true });

	Renderer.setSize(window.innerWidth, window.innerHeight);

	Renderer.setClearColor(0xf5f5f5);

	document.body.appendChild(Renderer.domElement);

	// --- Lighting ---
	const AmbientLight = new THREE.AmbientLight(0xffffff, 0.8);

	Scene.add(AmbientLight);

	const SunLight = new THREE.DirectionalLight(0xffffff, 0.7);

	SunLight.position.set(8, 12, 10);

	SunLight.castShadow = true;

	Renderer.shadowMap.enabled = true;

	Renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	SunLight.shadow.mapSize.width = 2048;

	SunLight.shadow.mapSize.height = 2048;

	SunLight.shadow.camera.near = 0.5;

	// Increased shadow camera far for long beam
	SunLight.shadow.camera.far = 100;

	// Increased shadow frustum for long beam
	SunLight.shadow.camera.left = -50;

	SunLight.shadow.camera.right = 50;

	SunLight.shadow.camera.top = 50;

	SunLight.shadow.camera.bottom = -50;

	Scene.add(SunLight);

	// --- "In Progress" Element: Construction Grid ---

	// --- Controllable Parameters ---
	const UpdatableParams = {
		SphereOriginalRadius: 4.0,

		SphereFlattenScaleZ: 0.3,

		SphereQuadrantGap: 0.6,

		RotationX: 0.0,

		RotationY: 0.0,

		RotationZ: 0.0,

		CrossBeamThickness: 0.07,

		CrossBeamHeight: 0.25,

		CrossBeamPairOffset: 0.5,

		CrossBeamLengthFactor: 1.2,

		// New parameters for the central long beam
		ShowCentralBeam: true,
		CentralBeamThickness: 0.15,
		// Very long
		CentralBeamLength: 150.0,
	};

	// Large grid
	const GridHelper = new THREE.GridHelper(200, 50, 0xcccccc, 0xdddddd);

	GridHelper.position.y =
		-UpdatableParams.SphereOriginalRadius *
			UpdatableParams.SphereFlattenScaleZ -
		// Position below the object
		5;

	Scene.add(GridHelper);

	// --- Fixed Parameters (not GUI controlled for now) ---
	const SphereSegments = 64;

	const SphereRings = 32;

	const OriginalCenterLocation = new THREE.Vector3(0, 0, 0);

	// --- Materials ---
	const ConcreteMaterial = new THREE.ShaderMaterial({
		vertexShader: ConcreteVertexShaderSource,

		fragmentShader: ConcreteFragmentShaderSource,

		uniforms: {
			UMaxHeight: { value: 0 },
			UMinHeight: { value: 0 },
			UColorTop: { value: new THREE.Color(0.95, 0.95, 0.95) },
			UColorBottom: { value: new THREE.Color(0.85, 0.85, 0.88) },
			UNoiseScale: { value: 512.0 },
			UGrainIntensity: { value: 0.025 },
			ULightDirection: {
				value: new THREE.Vector3().copy(SunLight.position).normalize(),
			},
			ULightColor: { value: SunLight.color },
			UAmbientContribution: { value: 0.4 },
			UDiffuseContribution: { value: 0.6 },
		},
	});

	const DarkMetalMaterial = new THREE.MeshStandardMaterial({
		color: new THREE.Color(0x654321),
		metalness: 0.2,
		roughness: 0.8,
	});

	// --- Scene Objects ---
	const RotatableAssembly = new THREE.Group();

	Scene.add(RotatableAssembly);

	// @ts-expect-error
	const BowlQuadrantsFinal = [];

	// --- Mesh Creation and Assembly Rebuild Function ---
	function RebuildAssembly() {
		while (RotatableAssembly.children.length > 0) {
			const OldMesh = RotatableAssembly.children[0] as THREE.Mesh;

			RotatableAssembly.remove(OldMesh);

			if (OldMesh.geometry) OldMesh.geometry.dispose();
		}
		BowlQuadrantsFinal.length = 0;

		const CurrentEffectiveBowlHeight =
			UpdatableParams.SphereOriginalRadius *
			UpdatableParams.SphereFlattenScaleZ;

		// @ts-expect-error
		ConcreteMaterial.uniforms["UMaxHeight"].value =
			CurrentEffectiveBowlHeight / 2.0;

		// @ts-expect-error
		ConcreteMaterial.uniforms["UMinHeight"].value =
			-CurrentEffectiveBowlHeight / 2.0;

		const BaseBowlMeshForCSG = new THREE.Mesh(
			new THREE.SphereGeometry(
				UpdatableParams.SphereOriginalRadius,
				SphereSegments,
				SphereRings,
			),
		);

		BaseBowlMeshForCSG.scale.setZ(UpdatableParams.SphereFlattenScaleZ);

		BaseBowlMeshForCSG.updateMatrixWorld(true);

		const CurrentCutterActualSize =
			UpdatableParams.SphereOriginalRadius * 1.0;

		const CurrentCutterCenterOffset =
			UpdatableParams.SphereOriginalRadius / 2.0;

		const CutterDefs = [
			{ NameSuffix: "PosX_PosY", LocationCenterCoeff: [1, 1] },
			{ NameSuffix: "NegX_PosY", LocationCenterCoeff: [-1, 1] },
			{ NameSuffix: "NegX_NegY", LocationCenterCoeff: [-1, -1] },
			{ NameSuffix: "PosX_NegY", LocationCenterCoeff: [1, -1] },
		];

		for (let I = 0; I < CutterDefs.length; I++) {
			// Direct access
			const CutterDef = CutterDefs[I];

			const QuadrantName = `BowlQuadrant_${CutterDef?.NameSuffix}`;

			const CutterMeshCSG = new THREE.Mesh(
				new THREE.BoxGeometry(
					CurrentCutterActualSize,
					CurrentCutterActualSize,
					UpdatableParams.SphereOriginalRadius *
						UpdatableParams.SphereFlattenScaleZ *
						2.2,
				),
			);

			// Direct access
			const [CoeffX, CoeffY] = CutterDef?.LocationCenterCoeff ?? [];

			CutterMeshCSG.position.set(
				(CoeffX ?? 0) * CurrentCutterCenterOffset,
				(CoeffY ?? 0) * CurrentCutterCenterOffset,
				0,
			);

			CutterMeshCSG.updateMatrixWorld(true);

			try {
				const IntersectedCSG = CSG.fromMesh(
					BaseBowlMeshForCSG,
				).intersect(CSG.fromMesh(CutterMeshCSG));

				const QuadrantMesh = CSG.toMesh(
					IntersectedCSG,
					BaseBowlMeshForCSG.matrix,
				);

				QuadrantMesh.material = ConcreteMaterial;

				QuadrantMesh.name = QuadrantName;

				QuadrantMesh.castShadow = true;

				QuadrantMesh.receiveShadow = true;

				if (QuadrantMesh.geometry.attributes["position"]?.count === 0) {
					console.warn(
						`CSG for ${QuadrantName} resulted in EMPTY MESH.`,
					);

					continue;
				}
				BowlQuadrantsFinal.push(QuadrantMesh);

				RotatableAssembly.add(QuadrantMesh);
			} catch (e) {
				console.error(`ERROR during CSG for ${QuadrantName}: ${e}`);

				continue;
			}
			CutterMeshCSG.geometry.dispose();
		}
		BaseBowlMeshForCSG.geometry.dispose();

		if (BowlQuadrantsFinal.length === 4) {
			// @ts-expect-error
			BowlQuadrantsFinal.forEach((Part) => {
				let XDir = 0,
					YDir = 0;

				if (Part.name.includes("PosX")) XDir = 1;
				else if (Part.name.includes("NegX")) XDir = -1;

				if (Part.name.includes("PosY")) YDir = 1;
				else if (Part.name.includes("NegY")) YDir = -1;

				if (XDir !== 0 && YDir !== 0) {
					Part.position
						.copy(OriginalCenterLocation)
						.addScaledVector(
							new THREE.Vector3(XDir, YDir, 0).normalize(),
							UpdatableParams.SphereQuadrantGap,
						);
				}
			});
		}

		const CurrentCrossBeamArmLength =
			UpdatableParams.SphereOriginalRadius *
			UpdatableParams.CrossBeamLengthFactor;

		const CurrentCrossBeamZLevel =
			OriginalCenterLocation.z - CurrentEffectiveBowlHeight * -0.8;

		const CreateAndAddBeamSegment = (
			Name: string,
			GeoParams: number[],
			PositionVec: THREE.Vector3Like,
			Material: THREE.MeshStandardMaterial,
		) => {
			const Beam = new THREE.Mesh(
				new THREE.BoxGeometry(...GeoParams),
				Material,
			);

			Beam.name = Name;

			Beam.position.copy(PositionVec);

			Beam.castShadow = true;

			Beam.receiveShadow = true;

			RotatableAssembly.add(Beam);
		};

		for (let Sign = -1; Sign <= 1; Sign += 2) {
			CreateAndAddBeamSegment(
				`CrossBeam_X_Arm${Sign > 0 ? "Pos" : "Neg"}_1`,
				[
					CurrentCrossBeamArmLength,
					UpdatableParams.CrossBeamThickness,
					UpdatableParams.CrossBeamHeight,
				],
				new THREE.Vector3(
					(Sign * CurrentCrossBeamArmLength) / 2,
					(Sign * UpdatableParams.CrossBeamPairOffset) / 2,
					CurrentCrossBeamZLevel,
				),
				DarkMetalMaterial,
			);

			CreateAndAddBeamSegment(
				`CrossBeam_X_Arm${Sign > 0 ? "Pos" : "Neg"}_2`,
				[
					CurrentCrossBeamArmLength,
					UpdatableParams.CrossBeamThickness,
					UpdatableParams.CrossBeamHeight,
				],
				new THREE.Vector3(
					(Sign * CurrentCrossBeamArmLength) / 2,
					(-Sign * UpdatableParams.CrossBeamPairOffset) / 2,
					CurrentCrossBeamZLevel,
				),
				DarkMetalMaterial,
			);
		}
		for (let Sign = -1; Sign <= 1; Sign += 2) {
			CreateAndAddBeamSegment(
				`CrossBeam_Y_Arm${Sign > 0 ? "Pos" : "Neg"}_1`,
				[
					UpdatableParams.CrossBeamThickness,
					CurrentCrossBeamArmLength,
					UpdatableParams.CrossBeamHeight,
				],
				new THREE.Vector3(
					(Sign * UpdatableParams.CrossBeamPairOffset) / 2,
					(Sign * CurrentCrossBeamArmLength) / 2,
					CurrentCrossBeamZLevel,
				),
				DarkMetalMaterial,
			);

			CreateAndAddBeamSegment(
				`CrossBeam_Y_Arm${Sign > 0 ? "Pos" : "Neg"}_2`,
				[
					UpdatableParams.CrossBeamThickness,
					CurrentCrossBeamArmLength,
					UpdatableParams.CrossBeamHeight,
				],
				new THREE.Vector3(
					(-Sign * UpdatableParams.CrossBeamPairOffset) / 2,
					(Sign * CurrentCrossBeamArmLength) / 2,
					CurrentCrossBeamZLevel,
				),
				DarkMetalMaterial,
			);
		}

		// --- Create the New Central Long Beam ---
		if (UpdatableParams.ShowCentralBeam) {
			CreateAndAddBeamSegment(
				"Central_Long_Beam_Y_Axis",
				[
					// X-Dimension (width)
					UpdatableParams.CentralBeamThickness,
					// Y-Dimension (length)
					UpdatableParams.CentralBeamLength,
					// Z-Dimension (height)
					UpdatableParams.CentralBeamThickness,
				],
				// Positioned at the same Z level as other cross beams, centered at assembly origin for X and Y
				new THREE.Vector3(0, 0, CurrentCrossBeamZLevel),
				DarkMetalMaterial,
			);
		}

		RotatableAssembly.rotation.set(
			THREE.MathUtils.degToRad(UpdatableParams.RotationX),
			THREE.MathUtils.degToRad(UpdatableParams.RotationY),
			THREE.MathUtils.degToRad(UpdatableParams.RotationZ),
		);
	}

	// --- GUI Setup ---
	const SceneGUI = new GUI();

	const SphereShapeFolder = SceneGUI.addFolder("Sphere Shape");

	SphereShapeFolder.add(UpdatableParams, "SphereOriginalRadius", 1, 10, 0.1)
		.name("Radius")
		.onChange(RebuildAssembly);

	SphereShapeFolder.add(UpdatableParams, "SphereFlattenScaleZ", 0.1, 1, 0.01)
		.name("Flatten Scale Z")
		.onChange(RebuildAssembly);

	SphereShapeFolder.add(UpdatableParams, "SphereQuadrantGap", 0, 2, 0.01)
		.name("Quadrant Gap")
		.onChange(RebuildAssembly);

	const AssemblyFolder = SceneGUI.addFolder("Assembly Transform");

	AssemblyFolder.add(UpdatableParams, "RotationX", -180, 180, 1)
		.name("Rotation X (deg)")
		.onChange(RebuildAssembly);

	AssemblyFolder.add(UpdatableParams, "RotationY", -180, 180, 1)
		.name("Rotation Y (deg)")
		.onChange(RebuildAssembly);

	AssemblyFolder.add(UpdatableParams, "RotationZ", -180, 180, 1)
		.name("Rotation Z (deg)")
		.onChange(RebuildAssembly);

	const StoneFolder = SceneGUI.addFolder("Stone Appearance");

	// @ts-expect-error
	StoneFolder.addColor(ConcreteMaterial.uniforms["UColorTop"], "value").name(
		"Color Top",
	);

	StoneFolder.addColor(
		ConcreteMaterial.uniforms["UColorBottom"],
		// @ts-expect-error
		"value",
	).name("Color Bottom");

	StoneFolder.add(
		ConcreteMaterial.uniforms["UGrainIntensity"],
		// @ts-expect-error
		"value",
		0,
		0.2,
		0.001,
	).name("Grain Intensity");

	StoneFolder.add(
		ConcreteMaterial.uniforms["UNoiseScale"],
		// @ts-expect-error
		"value",
		1,
		1024,
		1,
	).name("Noise Scale");

	StoneFolder.add(
		ConcreteMaterial.uniforms["UAmbientContribution"],
		// @ts-expect-error
		"value",
		0,
		1,
		0.01,
	).name("Shader Ambient");

	StoneFolder.add(
		ConcreteMaterial.uniforms["UDiffuseContribution"],
		// @ts-expect-error
		"value",
		0,
		2,
		0.01,
	).name("Shader Diffuse");

	const BeamFolder = SceneGUI.addFolder("Cross Beam Properties");

	// This will affect all beams using this material
	BeamFolder.addColor(DarkMetalMaterial, "color").name("Beam Color");

	BeamFolder.add(DarkMetalMaterial, "metalness", 0, 1, 0.01).name(
		"Beam Metalness",
	);

	BeamFolder.add(DarkMetalMaterial, "roughness", 0, 1, 0.01).name(
		"Beam Roughness",
	);

	BeamFolder.add(UpdatableParams, "CrossBeamThickness", 0.01, 0.5, 0.001)
		.name("Thickness")
		.onChange(RebuildAssembly);

	BeamFolder.add(UpdatableParams, "CrossBeamHeight", 0.01, 1, 0.001)
		.name("Height")
		.onChange(RebuildAssembly);

	BeamFolder.add(UpdatableParams, "CrossBeamPairOffset", 0, 1, 0.01)
		.name("Pair Offset")
		.onChange(RebuildAssembly);

	BeamFolder.add(UpdatableParams, "CrossBeamLengthFactor", 0.5, 2, 0.01)
		.name("Length Factor")
		.onChange(RebuildAssembly);

	// --- GUI for Central Long Beam ---
	const CentralBeamFolder = SceneGUI.addFolder("Central Long Beam");

	CentralBeamFolder.add(UpdatableParams, "ShowCentralBeam")
		.name("Show Beam")
		.onChange(RebuildAssembly);

	CentralBeamFolder.add(
		UpdatableParams,
		"CentralBeamThickness",
		0.01,
		1.0,
		0.001,
	)
		.name("Thickness")
		.onChange(RebuildAssembly);

	CentralBeamFolder.add(UpdatableParams, "CentralBeamLength", 10, 500, 1)
		.name("Length")
		.onChange(RebuildAssembly);

	const LightingFolder = SceneGUI.addFolder("Lighting");

	LightingFolder.add(AmbientLight, "intensity", 0, 2, 0.01).name(
		"Ambient Light",
	);

	LightingFolder.add(SunLight, "intensity", 0, 3, 0.01).name("Sun Light");

	LightingFolder.addColor(SunLight, "color")
		.name("Sun Light Color")
		.onChange(() => {
			ConcreteMaterial.uniforms["ULightColor"]?.value.copy(
				SunLight.color,
			);

			// @ts-expect-error
			ConcreteMaterial.uniforms["ULightDirection"].value
				.copy(SunLight.position)
				.normalize();
		});

	const SunPositionFolder = LightingFolder.addFolder("Sun Position");

	SunPositionFolder.add(SunLight.position, "x", -50, 50, 0.1)
		.name("Sun X")
		.onChange(() =>
			// @ts-expect-error
			ConcreteMaterial.uniforms["ULightDirection"].value
				.copy(SunLight.position)
				.normalize(),
		);

	SunPositionFolder.add(SunLight.position, "y", -50, 50, 0.1)
		.name("Sun Y")
		.onChange(() =>
			// @ts-expect-error
			ConcreteMaterial.uniforms["ULightDirection"].value
				.copy(SunLight.position)
				.normalize(),
		);

	SunPositionFolder.add(SunLight.position, "z", -50, 50, 0.1)
		.name("Sun Z")
		.onChange(() =>
			// @ts-expect-error
			ConcreteMaterial.uniforms["ULightDirection"].value
				.copy(SunLight.position)
				.normalize(),
		);

	// --- Initial Build ---
	RebuildAssembly();

	// --- Camera and Controls Setup ---
	let InitialEffectiveBowlHeight =
		UpdatableParams.SphereOriginalRadius *
		UpdatableParams.SphereFlattenScaleZ;

	const CamDistanceTop = UpdatableParams.SphereOriginalRadius * 3.0;

	Camera.position.set(0, 0, CamDistanceTop + InitialEffectiveBowlHeight);

	Camera.lookAt(0, 0, 0);

	const Controls = new OrbitControls(Camera, Renderer.domElement);

	Controls.enableDamping = true;

	Controls.dampingFactor = 0.05;

	Controls.screenSpacePanning = true;

	// Allow closer zoom
	Controls.minDistance = UpdatableParams.SphereOriginalRadius * 0.1;

	// Adjust max distance based on long beam
	Controls.maxDistance = UpdatableParams.CentralBeamLength * 1.5;

	Controls.target.set(0, 0, 0);

	Controls.update();

	// --- Animation/Render Loop ---
	function AnimateScene() {
		requestAnimationFrame(AnimateScene);

		Controls.update();

		Renderer.render(Scene, Camera);
	}
	AnimateScene();

	// Handle window resize
	window.addEventListener(
		"resize",
		() => {
			Camera.aspect = window.innerWidth / window.innerHeight;

			Camera.updateProjectionMatrix();

			Renderer.setSize(window.innerWidth, window.innerHeight);
		},
		false,
	);
}

// --- Start the Application ---
InitializeSceneAndApp().catch((Error) => {
	console.error("Failed to initialize application:", Error);
});
