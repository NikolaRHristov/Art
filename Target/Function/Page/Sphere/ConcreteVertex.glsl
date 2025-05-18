varying vec3 VWorldPosition;

// Pass normal for potential lighting
varying vec3 VNormal;

void main() {
	// Renamed local variable WorldPos
	vec4 WorldPos = modelMatrix * vec4(position, 1.0);

	VWorldPosition = WorldPos.xyz;

	// Transform normal to view space
	VNormal = normalize(normalMatrix * normal);

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}
