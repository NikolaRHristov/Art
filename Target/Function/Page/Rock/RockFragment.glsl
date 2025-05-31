precision highp float;

precision highp int;

#define PI 3.14159265359
#define saturate(a) clamp(a, 0.0, 1.0)

in vec3 vWorldPosition;

in vec2 vUv;

in vec3 vEyeVector;

in mat3 vTBN_world;

// --- Three.js standard uniforms (if lights: true or other features are on) ---
// Already have vEyeVector and vWorldPosition
// uniform vec3 cameraPosition;

// --- Your Custom Uniforms (MUST be defined in JS ShaderMaterial.uniforms) ---
uniform float uGlobalSeed;

uniform float uTime;

uniform float uSynthesisProgress;

// Three.js provides these if lights:true
uniform vec3 uAmbientLightColor;

// and you use its lighting chunks
uniform vec3 uDirLightColor;    
// or its PBR/standard material uniforms
uniform vec3 uDirLightDirection;

uniform float uTriPlanar_BlendSharpness;

// Albedo Params
uniform vec3 uSlateColorLight;

uniform vec3 uSlateColorDark;

uniform int uAlbedoBase_Octaves;

uniform float uAlbedoBase_Persistence;

uniform float uAlbedoBase_Lacunarity;

uniform float uAlbedoBase_Scale;

uniform float uAlbedoBase_Amplitude;

uniform float uAlbedoBase_SeedOffset;

uniform vec3 uStrataColor;

uniform float uStrata_Influence;

uniform float uStrata_FrequencyY_Stretch;

uniform int uStrata_Octaves;

uniform float uStrata_Persistence;

uniform float uStrata_Lacunarity;

uniform float uStrata_Scale;

uniform float uStrata_Amplitude;

uniform float uStrata_SeedOffset;

uniform vec3 uVeinColorPrimary;

uniform float uVeins_Threshold;

uniform int uVeins_Octaves;

uniform float uVeins_Persistence;

uniform float uVeins_Lacunarity;

uniform float uVeins_Scale;

uniform float uVeins_Amplitude;

uniform float uVeins_SeedOffset;

uniform int uVeins_Warp_Octaves;

uniform float uVeins_Warp_Persistence;

uniform float uVeins_Warp_Lacunarity;

uniform float uVeins_Warp_Scale;

uniform float uVeins_Warp_Amplitude;

uniform float uVeins_Warp_SeedOffset;

uniform vec3 uFleckColor;

uniform float uFlecks_Threshold;

uniform int uFlecks_Octaves;

uniform float uFlecks_Persistence;

uniform float uFlecks_Lacunarity;

uniform float uFlecks_Scale;

uniform float uFlecks_Amplitude;

uniform float uFlecks_SeedOffset;

uniform float uRoughness_Min;

uniform float uRoughness_Max;

uniform int uRoughness_Octaves;

uniform float uRoughness_Persistence;

uniform float uRoughness_Lacunarity;

uniform float uRoughness_Scale;

uniform float uRoughness_Amplitude;

uniform float uRoughness_SeedOffset;

uniform float uAO_Strength;

uniform int uAO_Octaves;

uniform float uAO_Persistence;

uniform float uAO_Lacunarity;

uniform float uAO_Scale;

uniform float uAO_Amplitude;

uniform float uAO_SeedOffset;

uniform float uNormalDetail_Strength;

uniform int uNormalDetail_Octaves;

uniform float uNormalDetail_Persistence;

uniform float uNormalDetail_Lacunarity;

uniform float uNormalDetail_Scale;

uniform float uNormalDetail_Amplitude;

uniform float uNormalDetail_SeedOffset;

uniform bool uEnablePOM;

uniform float uPOM_HeightScale;

uniform int uPOM_MinSteps;

uniform int uPOM_MaxSteps;

uniform float uPOM_WorldSpaceUVScale;

uniform int uPOMHeight_Octaves;

uniform float uPOMHeight_Persistence;

uniform float uPOMHeight_Lacunarity;

uniform float uPOMHeight_Scale;

uniform float uPOMHeight_Amplitude;

uniform float uPOMHeight_SeedOffset;

uniform vec3 uDustColor;

uniform float uDust_AccumulationFactor;

uniform float uDust_NoiseScale;

uniform float uDust_SeedOffset;

uniform int uDust_Noise_Octaves;

uniform float uDust_Noise_Persistence;

uniform float uDust_Noise_Lacunarity;

uniform float uDust_Noise_Amplitude;

uniform vec3 uWaterStreakColor;

uniform float uWaterStreak_Influence;

uniform float uWaterStreak_RoughnessFactor;

uniform float uWaterStreaks_VerticalStretch;

uniform float uWaterStreaks_FlowSpeed;

uniform int uWaterStreaks_Octaves;

uniform float uWaterStreaks_Persistence;

uniform float uWaterStreaks_Lacunarity;

uniform float uWaterStreaks_Scale;

uniform float uWaterStreaks_Amplitude;

uniform float uWaterStreaks_SeedOffset;

uniform vec3 uLichenColor;

uniform float uLichen_Coverage;

uniform float uLichen_Threshold;

uniform float uLichen_Smoothness;

uniform float uLichen_Roughness;

uniform float uLichen_UpwardBias;

uniform float uLichen_AOInfluence;

uniform int uLichen_Octaves;

uniform float uLichen_Persistence;

uniform float uLichen_Lacunarity;

uniform float uLichen_Scale;

uniform float uLichen_Amplitude;

uniform float uLichen_SeedOffset;

uniform int uReveal_Octaves;

uniform float uReveal_Persistence;

uniform float uReveal_Lacunarity;

uniform float uReveal_Scale;

uniform float uReveal_Amplitude;

uniform float uReveal_SeedOffset;

uniform sampler2D uBakedAlbedoMap;

uniform bool uUseBakedAlbedo;

uniform sampler2D uBakedNormalMap;

uniform bool uUseBakedNormal;

uniform sampler2D uBakedRoughnessMap;

uniform bool uUseBakedRoughness;

uniform sampler2D uBakedAOMap;

uniform bool uUseBakedAO;

uniform sampler2D uBakedPOMHeightMap;

uniform bool uUseBakedPOMHeight;

// layout(location = 0) out vec4 FragColor;

vec3 mod289(vec3 x) {
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
	return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
	return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
	const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);

	const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

	vec3 i = floor(v + dot(v, C.yyy));

	vec3 x0 = v - i + dot(i, C.xxx);

	vec3 g = step(x0.yzx, x0.xyz);

	vec3 l = 1.0 - g;

	vec3 i1 = min(g.xyz, l.zxy);

	vec3 i2 = max(g.xyz, l.zxy);

	vec3 x1 = x0 - i1 + C.xxx;

	vec3 x2 = x0 - i2 + C.yyy;

	vec3 x3 = x0 - D.yyy;

	i = mod289(i);

	vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

	float n_ = 0.142857142857;

	vec3 ns = n_ * D.wyz - D.xzx;

	vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

	vec4 x_ = floor(j * ns.z);

	vec4 y_ = floor(j - 7.0 * x_);

	vec4 x = x_ * ns.x + ns.yyyy;

	vec4 y = y_ * ns.x + ns.yyyy;

	vec4 h = 1.0 - abs(x) - abs(y);

	vec4 b0 = vec4(x.xy, y.xy);

	vec4 b1 = vec4(x.zw, y.zw);

	vec4 s0 = floor(b0) * 2.0 + 1.0;

	vec4 s1 = floor(b1) * 2.0 + 1.0;

	vec4 sh = -step(h, vec4(0.0));

	vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;

	vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

	vec3 p0 = vec3(a0.xy, h.x);

	vec3 p1 = vec3(a0.zw, h.y);

	vec3 p2 = vec3(a1.xy, h.z);

	vec3 p3 = vec3(a1.zw, h.w);

	vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));

	p0 *= norm.x;

	p1 *= norm.y;

	p2 *= norm.z;

	p3 *= norm.w;

	vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);

	m = m * m;

	return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float fbm(vec3 p, int octaves, float persistence, float lacunarity, float scale, float seed_offset, float amplitude_mult) {
	float total = 0.0;

	float frequency = 1.0;

	float amplitude = 1.0;

	float total_amplitude_for_norm = 0.0;

	p = p * scale + vec3(uGlobalSeed * 0.0137 + seed_offset * 13.71);

	for(int i = 0; i < octaves; i++) {
		total += snoise(p * frequency) * amplitude;

		total_amplitude_for_norm += amplitude;

		amplitude *= persistence;

		frequency *= lacunarity;
	}

	return ((total / max(total_amplitude_for_norm, 0.0001)) + 1.0) * 0.5 * amplitude_mult;
}

float sampleTriPlanarFBM(
	vec3 p_world,

	vec3 normal_world,

	float blendSharpness,

	int octaves,

	float persistence,

	float lacunarity,

	float scale,

	float seedOffset,

	float amplitude
) {
	vec3 blending = pow(abs(normal_world), vec3(blendSharpness));

	blending = normalize(max(blending, vec3(0.00001)));

	float noiseX = fbm(p_world.yzx, octaves, persistence, lacunarity, scale, seedOffset + 10.0, amplitude);

	float noiseY = fbm(p_world.xzy, octaves, persistence, lacunarity, scale, seedOffset + 20.0, amplitude);

	float noiseZ = fbm(p_world.xyx, octaves, persistence, lacunarity, scale, seedOffset + 30.0, amplitude);

	return (noiseX * blending.x + noiseY * blending.y + noiseZ * blending.z);
}

vec3 sampleTriPlanarFBM_vec3(
	vec3 p_world,

	vec3 normal_world,

	float blendSharpness,

	int octaves,

	float persistence,

	float lacunarity,

	float scale,

	float seedOffR,

	float seedOffG,

	float seedOffB,

	float amplitude
) {
	return vec3(sampleTriPlanarFBM(p_world, normal_world, blendSharpness, octaves, persistence, lacunarity, scale, seedOffR, amplitude), sampleTriPlanarFBM(p_world, normal_world, blendSharpness, octaves, persistence, lacunarity, scale, seedOffG, amplitude), sampleTriPlanarFBM(p_world, normal_world, blendSharpness, octaves, persistence, lacunarity, scale, seedOffB, amplitude));
}

vec2 parallaxOcclusionMapping(
	vec3 viewDir_tangent,

	vec2 base_uv,

	mat3 tbn_tangent_to_world_mat,

	float heightScale,

	int minSteps,

	int maxSteps,

	int H_oct,

	float H_pers,

	float H_lac,

	float H_scale,

	float H_seed_off,

	float H_amp
) {
	float numStepsFloat = mix(float(maxSteps), float(minSteps), saturate(abs(viewDir_tangent.z)));

	int numSteps = int(numStepsFloat);

	if(numSteps < 1)
		return base_uv;

	float layerDepth = 1.0 / numStepsFloat;

	vec2 P_uv_step_per_depth_unit = viewDir_tangent.xy * heightScale / (abs(viewDir_tangent.z) + 0.0001);

	vec2 delta_uv_per_ray_step = P_uv_step_per_depth_unit / numStepsFloat;

	vec2 current_uv_offset = vec2(0.0);

	float currentLayerHeight = 0.0;

	for(int i = 0; i <= numSteps; ++i) {
		vec3 world_offset_on_tangent_plane = (tbn_tangent_to_world_mat[0] * current_uv_offset.x +
			tbn_tangent_to_world_mat[1] * current_uv_offset.y) * uPOM_WorldSpaceUVScale;

		vec3 current_world_pos_for_height_sample = vWorldPosition + world_offset_on_tangent_plane;

		float height_at_current_sample;

		if(uUseBakedPOMHeight) {
			height_at_current_sample = texture(uBakedPOMHeightMap, base_uv + current_uv_offset).r;

		} else {
			height_at_current_sample = sampleTriPlanarFBM(current_world_pos_for_height_sample, vTBN_world[2], uTriPlanar_BlendSharpness, H_oct, H_pers, H_lac, H_scale, H_seed_off, H_amp);
		}

		if(height_at_current_sample > currentLayerHeight) {
			vec2 prev_uv_offset = current_uv_offset + delta_uv_per_ray_step;

			float prevLayerHeight = currentLayerHeight - layerDepth;

			vec3 prev_world_offset_on_tangent_plane = (tbn_tangent_to_world_mat[0] * prev_uv_offset.x +
				tbn_tangent_to_world_mat[1] * prev_uv_offset.y) * uPOM_WorldSpaceUVScale;

			vec3 prev_world_pos_for_height_sample = vWorldPosition + prev_world_offset_on_tangent_plane;

			float height_at_prev_sample;

			if(uUseBakedPOMHeight) {
				height_at_prev_sample = texture(uBakedPOMHeightMap, base_uv + prev_uv_offset).r;
			} else {
				height_at_prev_sample = sampleTriPlanarFBM(prev_world_pos_for_height_sample, vTBN_world[2], uTriPlanar_BlendSharpness, H_oct, H_pers, H_lac, H_scale, H_seed_off, H_amp);
			}

			float dist_current = height_at_current_sample - currentLayerHeight;

			float dist_prev = height_at_prev_sample - prevLayerHeight;

			float weight = dist_current / (dist_current - dist_prev + 0.0001);

			current_uv_offset = mix(current_uv_offset, prev_uv_offset, saturate(weight));

			break;

		}

		currentLayerHeight += layerDepth;

		current_uv_offset -= delta_uv_per_ray_step;
	}

	return base_uv + current_uv_offset;
}

// Helper function for procedural normal detail
float getHeightForNormal(vec3 pos_world_sample, vec3 geom_normal_world) {
	return sampleTriPlanarFBM(pos_world_sample, geom_normal_world, uTriPlanar_BlendSharpness, uNormalDetail_Octaves, uNormalDetail_Persistence, uNormalDetail_Lacunarity, uNormalDetail_Scale, uNormalDetail_SeedOffset, uNormalDetail_Amplitude);
}

void main() {
	vec3 T_world_frag = normalize(vTBN_world[0]);

	vec3 B_world_frag = normalize(vTBN_world[1]);

	vec3 N_world_geom_frag = normalize(vTBN_world[2]);

	mat3 tbn_tangent_to_world = vTBN_world;

	mat3 tbn_world_to_tangent = transpose(tbn_tangent_to_world);

	float revealVal = fbm(vWorldPosition, uReveal_Octaves, uReveal_Persistence, uReveal_Lacunarity, uReveal_Scale, uReveal_SeedOffset, uReveal_Amplitude);

	if(revealVal < uSynthesisProgress * 1.1 - 0.05) { /* Continue */ 
	} else {
		discard;
	}

	vec2 final_uv_for_baked_maps = vUv;

	vec3 samplePos_world_for_3D_noise = vWorldPosition;

	if(uEnablePOM && uPOM_HeightScale > 0.0) {
		vec3 viewDir_tangent = normalize(tbn_world_to_tangent * vEyeVector);

		final_uv_for_baked_maps = parallaxOcclusionMapping(viewDir_tangent, vUv, tbn_tangent_to_world, uPOM_HeightScale, uPOM_MinSteps, uPOM_MaxSteps, uPOMHeight_Octaves, uPOMHeight_Persistence, uPOMHeight_Lacunarity, uPOMHeight_Scale, uPOMHeight_SeedOffset, uPOMHeight_Amplitude);

		vec2 pom_uv_delta = final_uv_for_baked_maps - vUv;

		samplePos_world_for_3D_noise = vWorldPosition + (T_world_frag * pom_uv_delta.x + B_world_frag * pom_uv_delta.y) * uPOM_WorldSpaceUVScale;
	}

	vec3 albedo;

	if(uUseBakedAlbedo) {
		albedo = texture(uBakedAlbedoMap, final_uv_for_baked_maps).rgb;

	} else {
		float base_noise = sampleTriPlanarFBM(samplePos_world_for_3D_noise, N_world_geom_frag, uTriPlanar_BlendSharpness, uAlbedoBase_Octaves, uAlbedoBase_Persistence, uAlbedoBase_Lacunarity, uAlbedoBase_Scale, uAlbedoBase_SeedOffset, uAlbedoBase_Amplitude);

		albedo = mix(uSlateColorDark, uSlateColorLight, saturate(base_noise));

		vec3 strata_sample_pos = vec3(samplePos_world_for_3D_noise.x, samplePos_world_for_3D_noise.y * uStrata_FrequencyY_Stretch, samplePos_world_for_3D_noise.z);

		float strata_noise = sampleTriPlanarFBM(strata_sample_pos, N_world_geom_frag, uTriPlanar_BlendSharpness, uStrata_Octaves, uStrata_Persistence, uStrata_Lacunarity, uStrata_Scale, uStrata_SeedOffset, uStrata_Amplitude);

		albedo = mix(albedo, uStrataColor, saturate(strata_noise) * uStrata_Influence);

		vec3 vein_warp_noise3D = sampleTriPlanarFBM_vec3(samplePos_world_for_3D_noise, N_world_geom_frag, uTriPlanar_BlendSharpness, uVeins_Warp_Octaves, uVeins_Warp_Persistence, uVeins_Warp_Lacunarity, uVeins_Warp_Scale, uVeins_Warp_SeedOffset + 0.0, uVeins_Warp_SeedOffset + 1.0, uVeins_Warp_SeedOffset + 2.0, uVeins_Warp_Amplitude);

		vec3 vein_sample_pos = samplePos_world_for_3D_noise + vein_warp_noise3D * uVeins_Warp_Amplitude;

		float vein_noise = sampleTriPlanarFBM(vein_sample_pos, N_world_geom_frag, uTriPlanar_BlendSharpness, uVeins_Octaves, uVeins_Persistence, uVeins_Lacunarity, uVeins_Scale, uVeins_SeedOffset, uVeins_Amplitude);

		if(vein_noise > uVeins_Threshold) {
			float vein_intensity = smoothstep(uVeins_Threshold, uVeins_Threshold + 0.1, vein_noise);

			albedo = mix(albedo, uVeinColorPrimary, vein_intensity);

		}

		float fleck_noise = fbm(samplePos_world_for_3D_noise, uFlecks_Octaves, uFlecks_Persistence, uFlecks_Lacunarity, uFlecks_Scale, uFlecks_SeedOffset, uFlecks_Amplitude);

		if(fleck_noise > uFlecks_Threshold) {
			albedo = mix(albedo, uFleckColor, 0.9 * smoothstep(uFlecks_Threshold, uFlecks_Threshold + 0.05, fleck_noise));

		}
	}

	vec3 shadingNormal;

	if(uUseBakedNormal) {
		vec3 normal_from_map = texture(uBakedNormalMap, final_uv_for_baked_maps).rgb * 2.0 - 1.0;

		shadingNormal = normalize(tbn_tangent_to_world * normal_from_map);

	} else {
		float delta_norm = 0.001 / max(0.0001, uNormalDetail_Scale * (uEnablePOM ? uPOM_WorldSpaceUVScale : 1.0));

		float h_center = getHeightForNormal(samplePos_world_for_3D_noise, N_world_geom_frag);

		float h_px = getHeightForNormal(samplePos_world_for_3D_noise + T_world_frag * delta_norm, N_world_geom_frag);

		float h_py = getHeightForNormal(samplePos_world_for_3D_noise + B_world_frag * delta_norm, N_world_geom_frag);

		vec3 surf_grad_tangent_space = normalize(vec3((h_center - h_px) / delta_norm * uNormalDetail_Strength, (h_center - h_py) / delta_norm * uNormalDetail_Strength, 1.0));

		shadingNormal = normalize(tbn_tangent_to_world * surf_grad_tangent_space);
	}

	float roughness;

	if(uUseBakedRoughness) {
		roughness = texture(uBakedRoughnessMap, final_uv_for_baked_maps).r;

	} else {
		float rough_noise = sampleTriPlanarFBM(samplePos_world_for_3D_noise, shadingNormal, uTriPlanar_BlendSharpness, uRoughness_Octaves, uRoughness_Persistence, uRoughness_Lacunarity, uRoughness_Scale, uRoughness_SeedOffset, uRoughness_Amplitude);

		roughness = mix(uRoughness_Min, uRoughness_Max, saturate(rough_noise));
	}

	float ao;

	if(uUseBakedAO) {
		ao = texture(uBakedAOMap, final_uv_for_baked_maps).r;

	} else {
		float ao_noise = sampleTriPlanarFBM(samplePos_world_for_3D_noise, shadingNormal, uTriPlanar_BlendSharpness, uAO_Octaves, uAO_Persistence, uAO_Lacunarity, uAO_Scale, uAO_SeedOffset, uAO_Amplitude);

		ao = mix(1.0 - uAO_Strength, 1.0, saturate(ao_noise));
	}

	float upward_facing = saturate(dot(shadingNormal, vec3(0.0, 1.0, 0.0)));

	float dust_ao_factor = saturate(ao * 1.5 - 0.2);

	float dust_base_noise = fbm(samplePos_world_for_3D_noise, uDust_Noise_Octaves, uDust_Noise_Persistence, uDust_Noise_Lacunarity, uDust_NoiseScale, uDust_SeedOffset, uDust_Noise_Amplitude);

	float dust_influence = pow(upward_facing, 2.5) * saturate(1.0 - roughness * 0.7) * uDust_AccumulationFactor * dust_ao_factor * (0.6 + dust_base_noise * 0.8);

	albedo = mix(albedo, uDustColor, saturate(dust_influence));

	roughness = mix(roughness, saturate(roughness + 0.25), saturate(dust_influence * 0.6));

	float steepness = 1.0 - upward_facing;

	vec3 water_streak_sample_pos = samplePos_world_for_3D_noise;

	water_streak_sample_pos.y = water_streak_sample_pos.y * uWaterStreaks_VerticalStretch + uTime * uWaterStreaks_FlowSpeed;

	float streak_noise = sampleTriPlanarFBM(water_streak_sample_pos, N_world_geom_frag, 6.0, uWaterStreaks_Octaves, uWaterStreaks_Persistence, uWaterStreaks_Lacunarity, uWaterStreaks_Scale, uWaterStreaks_SeedOffset, uWaterStreaks_Amplitude);

	streak_noise = pow(saturate(streak_noise), 2.5);

	float streak_influence_final = saturate(streak_noise * steepness * uWaterStreak_Influence * dust_ao_factor);

	albedo = mix(albedo, mix(albedo, uWaterStreakColor, 0.6), streak_influence_final);

	roughness = mix(roughness, saturate(roughness * uWaterStreak_RoughnessFactor), streak_influence_final);

	float lichen_upward_factor = saturate(dot(shadingNormal, vec3(0.0, 1.0, 0.0)) * (1.0 + uLichen_UpwardBias) - uLichen_UpwardBias * 0.5);

	float lichen_ao_factor = saturate((1.0 - ao) * (1.0 + uLichen_AOInfluence) - uLichen_AOInfluence * 0.5);

	float lichen_base_noise = sampleTriPlanarFBM(samplePos_world_for_3D_noise, shadingNormal, 7.0, uLichen_Octaves, uLichen_Persistence, uLichen_Lacunarity, uLichen_Scale, uLichen_SeedOffset, uLichen_Amplitude);

	float lichen_suitability = lichen_upward_factor * lichen_ao_factor * saturate(roughness * 1.2 - 0.1);

	float lichen_mask = smoothstep(uLichen_Threshold - uLichen_Smoothness * 0.5, uLichen_Threshold + uLichen_Smoothness * 0.5, lichen_base_noise * lichen_suitability);

	lichen_mask *= uLichen_Coverage;

	albedo = mix(albedo, uLichenColor, lichen_mask);

	roughness = mix(roughness, uLichen_Roughness, lichen_mask);

	vec3 N_pbr = shadingNormal;

	vec3 V_pbr = normalize(vEyeVector);

	// Assuming uDirLightDirection is already a direction
	vec3 L_pbr = normalize(uDirLightDirection);

	vec3 H_pbr = normalize(L_pbr + V_pbr);

	float NdotL = saturate(dot(N_pbr, L_pbr));

	float NdotV = saturate(dot(N_pbr, V_pbr));

	float NdotH = saturate(dot(N_pbr, H_pbr));

	float LdotH = saturate(dot(L_pbr, H_pbr));

	vec3 F0 = vec3(0.04);

	vec3 F = F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - LdotH, 5.0);

	// Use squared roughness for alpha in GGX
	float roughness_pbr_sq = roughness * roughness;

	float alphaSq = roughness_pbr_sq * roughness_pbr_sq;

	float D_denom = NdotH * NdotH * (alphaSq - 1.0) + 1.0;

	float D_ggx = alphaSq / (PI * D_denom * D_denom + 0.0001);

	// k for Schlick-GGX approximation of G_Smith
	float k_schlick_ggx = roughness_pbr_sq / 2.0;

	float G_V = NdotV / (NdotV * (1.0 - k_schlick_ggx) + k_schlick_ggx + 0.0001);

	float G_L = NdotL / (NdotL * (1.0 - k_schlick_ggx) + k_schlick_ggx + 0.0001);

	float G_smith = G_V * G_L;

	vec3 specular_brdf = D_ggx * G_smith * F;

	vec3 kD = (vec3(1.0) - F);

	vec3 diffuse_brdf = kD * albedo / PI;

// Get light color and intensity from Three.js injected uniforms if available

// For a single directional light, uDirLightColor likely contains intensity.

// Three.js will also provide `directLight[]` and `ambientLightProbe` arrays.

// For simplicity, using your uDirLightColor directly.

	vec3 outgoingLight = (diffuse_brdf + specular_brdf) * uDirLightColor * NdotL * PI;

	// Basic ambient = albedo * AO
	vec3 ambientLightContribution = albedo * ao;

    #ifdef USE_ENVMAP
// If you have an environment map for IBL

// ambientLightContribution = texture(envMap, reflect(-V_pbr, N_pbr)).rgb * albedo * ao;

// Or use more advanced IBL with prefiltered env maps and irradiance maps

    #else
// Fallback to simple ambient light color

	ambientLightContribution *= uAmbientLightColor;

    #endif

	vec3 finalColorLinear = ambientLightContribution + outgoingLight;

	// Exposure adjustment
	finalColorLinear = finalColorLinear * 0.8;

	// Gamma correction
	pc_fragColor = vec4(pow(finalColorLinear, vec3(1.0 / 2.2)), 1.0);
}
