varying vec3 VWorldPosition;

// Receive normal
varying vec3 VNormal;

// Renamed Uniforms to PascalCase
uniform float UMaxHeight;

uniform float UMinHeight;

uniform vec3 UColorTop;

uniform vec3 UColorBottom;

uniform float UNoiseScale;

uniform float UGrainIntensity;

// Example: SunLight.position.normalize()
uniform vec3 ULightDirection; 

// Example: SunLight.color
uniform vec3 ULightColor;  

// Added for shading control
uniform float UAmbientContribution;
uniform float UDiffuseContribution;

// Simple 2D pseudo-random function
// Renamed function and its parameter St
float Random(vec2 St) {
	return fract(sin(dot(St.xy, vec2(12.9898, 78.233))) * 43758.5453123);

}

// Value noise (simple version)
// Renamed function and its parameter St
float ValueNoise(vec2 St) {
// Renamed local variables I, F, A, B, C, D, U
	vec2 I = floor(St);

	vec2 F = fract(St);

	float A = Random(I);

	float B = Random(I + vec2(1.0, 0.0));

	float C = Random(I + vec2(0.0, 1.0));

	float D = Random(I + vec2(1.0, 1.0));

	vec2 U = F * F * (3.0 - 2.0 * F);

	return mix(A, B, U.x) + (C - A) * U.y * (1.0 - U.x) + (D - B) * U.y * U.x;

}

void main() {
	// Gradient based on world Z position (assuming Z is visually "up")
	float NormalizedHeight = smoothstep(UMinHeight, UMaxHeight, VWorldPosition.z);

	vec3 GradientColor = mix(UColorBottom, UColorTop, NormalizedHeight);

	// Grainy noise using world XY position
	float NoiseAmount = ValueNoise(VWorldPosition.xy * UNoiseScale);

	// Remap to -1 to 1
	NoiseAmount = (NoiseAmount - 0.5) * 2.0;

	// Scale intensity
	NoiseAmount *= UGrainIntensity;

	vec3 BaseConcreteColor = GradientColor + NoiseAmount;

	// Basic Lambertian diffuse lighting
	vec3 Norm = normalize(VNormal);

	float Diff = max(dot(Norm, normalize(ULightDirection)), 0.0);

	vec3 DiffuseLight = ULightColor * Diff;

	// Modulate contribution of ambient and diffuse light
	vec3 FinalColor = BaseConcreteColor * (vec3(UAmbientContribution) + DiffuseLight * UDiffuseContribution);

	gl_FragColor = vec4(FinalColor, 1.0);

}
