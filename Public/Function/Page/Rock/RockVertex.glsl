// #version 300 es // REMOVE THIS - Three.js will handle it
precision highp float;

// --- Three.js will provide these standard uniforms and attributes ---
// uniform mat4 modelMatrix;
// uniform mat4 modelViewMatrix;
// uniform mat4 projectionMatrix;
// uniform vec3 cameraPosition;
// in vec3 position;
// in vec3 normal;
// in vec2 uv;
// in vec4 tangent; // If HAS_VERTEX_TANGENTS is defined and attribute provided

// --- Your Custom Uniforms (if any) ---
// uniform float uMyCustomVertexUniform;

// Output varyings to Fragment Shader
out vec3 vWorldPosition;
out vec2 vUv;
out vec3 vEyeVector;
out mat3 vTBN_world;

void main() {
	vec3 objectNormal = normalize(normal);
	vec3 displacedPosition = position;

	vec4 worldPosition_vec4 = modelMatrix * vec4(displacedPosition, 1.0);
	vWorldPosition = worldPosition_vec4.xyz;

	vUv = uv;

	vEyeVector = normalize(cameraPosition - vWorldPosition);

	vec3 N_world = normalize((modelMatrix * vec4(objectNormal, 0.0)).xyz);
	vec3 T_world;
	vec3 B_world;

#ifdef HAS_VERTEX_TANGENTS
    // Ensure 'tangent' attribute is provided to geometry if this is defined
	T_world = normalize((modelMatrix * vec4(tangent.xyz, 0.0)).xyz);
	B_world = normalize(cross(N_world, T_world) * tangent.w);
	T_world = normalize(cross(B_world, N_world));
#else
	if(abs(N_world.y) < 0.999) {
		T_world = normalize(cross(N_world, vec3(0.0, 1.0, 0.0)));
	} else {
		T_world = normalize(cross(N_world, vec3(1.0, 0.0, 0.0)));
	}
	B_world = normalize(cross(N_world, T_world));
	T_world = normalize(cross(B_world, N_world));
#endif

	vTBN_world = mat3(T_world, B_world, N_world);

	gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
