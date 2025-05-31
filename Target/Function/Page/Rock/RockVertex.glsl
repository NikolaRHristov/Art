precision highp float;

// Uniforms
uniform mat4 modelMatrix;

uniform mat4 modelViewMatrix;

uniform mat4 projectionMatrix;

// Use for view-space normals if needed, world-space is often more versatile
// uniform mat3 normalMatrix;

// World space camera position
uniform vec3 cameraPosition;

// Optional Vertex Displacement (Example, can be removed if all shape is from MC)
// uniform float uTime;

// uniform float uVertexDisplacementScale;

// uniform int uVertexDisp_Octaves;

// uniform float uVertexDisp_Persistence;

// uniform float uVertexDisp_Lacunarity;

// uniform float uVertexDisp_Scale;

// uniform float uVertexDisp_SeedOffset;

// uniform float uVertexDisp_Amplitude;

// Attributes
attribute vec3 position;

attribute vec3 normal;

attribute vec2 uv;

// Optional: x,y,z for tangent, w for handedness (-1 or 1)
attribute vec4 tangent;

// Varyings to Fragment Shader
varying vec3 vWorldPosition;

varying vec2 vUv;

// World-space vector from fragment to camera (normalized)
varying vec3 vEyeVector;   
// Tangent, Bitangent, Normal matrix in World Space
varying mat3 vTBN_world;   

// --- GLSL Noise Functions (IF USED FOR VERTEX DISPLACEMENT) ---
// If you use FBM for vertex displacement, paste snoise and fbm here.
// Otherwise, they are only needed in the fragment shader.
// float snoise(vec3 p) { /* ... */ return noise_value; }

// float fbm(vec3 p, int octaves, float persistence, float lacunarity, float scale, float seed_offset, float amplitude) { /* ... */ return normalized_noise_value; }

// --- End Noise Functions ---

void main() {
	// Ensure normal is unit length
	vec3 objectNormal = normalize(normal);

	vec3 displacedPosition = position;

	// Optional: Finer Vertex Displacement in shader

	// if (uVertexDisplacementScale > 0.0) {
	//     float displacement = fbm(position, uVertexDisp_Octaves, uVertexDisp_Persistence, uVertexDisp_Lacunarity, uVertexDisp_Scale, uVertexDisp_SeedOffset, uVertexDisp_Amplitude);
	//     displacedPosition += objectNormal * displacement * uVertexDisplacementScale;
	// }

	vec4 worldPosition_vec4 = modelMatrix * vec4(displacedPosition, 1.0);

	vWorldPosition = worldPosition_vec4.xyz;

	// Pass through UVs
	vUv = uv;

	// Vector from surface point to camera
	vEyeVector = normalize(cameraPosition - vWorldPosition);

	// Calculate TBN matrix in World Space

	vec3 N_world = normalize((modelMatrix * vec4(objectNormal, 0.0)).xyz);

	vec3 T_world;

	vec3 B_world;

    // Define this in JS if 'tangent' attribute is successfully provided and used
	#ifdef HAS_VERTEX_TANGENTS
	T_world = normalize((modelMatrix * vec4(tangent.xyz, 0.0)).xyz);

	// Calculate Bitangent orthogonally, respecting handedness from tangent.w
	B_world = normalize(cross(N_world, T_world) * tangent.w);

	// Re-orthogonalize T_world to ensure basis is orthogonal after potential model matrix shear
	T_world = normalize(cross(B_world, N_world));

    #else

	// Fallback: Create an arbitrary orthogonal tangent frame if no tangent attribute.

	// This is less ideal for effects like anisotropic reflections or specific normal map orientations.

	// Avoid singularity when N_world is aligned with Y
	if(abs(N_world.x) > abs(N_world.z)) {
		T_world = vec3(-N_world.y, N_world.x, 0.0);
	} else {
		T_world = vec3(0.0, -N_world.z, N_world.y);
	}

	T_world = normalize(T_world);

	B_world = normalize(cross(N_world, T_world));

    #endif

	vTBN_world = mat3(T_world, B_world, N_world);

	gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
