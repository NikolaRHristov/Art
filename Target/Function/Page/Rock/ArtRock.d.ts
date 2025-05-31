/* tslint:disable */
/* eslint-disable */
export function main_js(): void;
export function get_scalar_field_structured_params_wasm(
	grid_dims_js: any,
	global_seed: number,
	shape_params_js: any,
): Float32Array;
export function extract_mesh_wasm(
	scalar_field_js_array: Float32Array,
	grid_dims_js: any,
	iso_level: number,
	mesh_scale_x: number,
	mesh_scale_y: number,
	mesh_scale_z: number,
	mesh_offset_x: number,
	mesh_offset_y: number,
	mesh_offset_z: number,
): MeshData;
export function bake_texture_wasm(
	js_texture_type: JsTextureType,
	width: number,
	height: number,
	global_seed: number,
	params_js_value: any,
	height_map_js_array_opt?: Float32Array | null,
): Uint8Array;
export function get_default_fbm_params(): any;
export function get_default_scalar_field_shape_params(): any;
export function get_default_grid_dimensions(): any;
export function get_default_albedo_bake_params(): any;
export function get_default_height_bake_params(): any;
export function get_default_normal_bake_params(): any;
export function get_default_roughness_bake_params(): any;
export function get_default_ao_bake_params(): any;
export enum JsTextureType {
	Albedo = 0,
	Height = 1,
	Normal = 2,
	Roughness = 3,
	AmbientOcclusion = 4,
}
export enum TextureType {
	Albedo = 0,
	Height = 1,
	Normal = 2,
	Roughness = 3,
	AmbientOcclusion = 4,
}
export class AlbedoBakeParams {
	private constructor();
	free(): void;
	base_fbm: FbmParameters;
	strata_fbm: FbmParameters;
	vein_fbm: FbmParameters;
	vein_warp_fbm: FbmParameters;
	fleck_fbm: FbmParameters;
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
export class AoBakeParams {
	private constructor();
	free(): void;
	fbm_params: FbmParameters;
	strength: number;
}
export class FbmParameters {
	private constructor();
	free(): void;
	octaves: number;
	frequency: number;
	persistence: number;
	lacunarity: number;
	amplitude: number;
	seed_offset: number;
}
export class GridDimensions {
	private constructor();
	free(): void;
	width: number;
	height: number;
	depth: number;
}
export class HeightBakeParams {
	private constructor();
	free(): void;
	base_fbm: FbmParameters;
	detail_fbm: FbmParameters;
	detail_blend_factor: number;
	overall_amplitude: number;
}
export class MeshData {
	private constructor();
	free(): void;
	static new(vertices: Float32Array, indices: Uint32Array): MeshData;
	readonly vertices: Float32Array;
	readonly indices: Uint32Array;
}
export class NormalBakeParams {
	private constructor();
	free(): void;
	strength: number;
}
export class RoughnessBakeParams {
	private constructor();
	free(): void;
	fbm_params: FbmParameters;
	min_roughness: number;
	max_roughness: number;
}
export class ScalarFieldShapeParams {
	private constructor();
	free(): void;
	base_sphere_radius: number;
	base_sphere_influence: number;
	sphere_distort_fbm: FbmParameters;
	large_form_fbm: FbmParameters;
	medium_detail_fbm: FbmParameters;
	fine_detail_fbm: FbmParameters;
}

export type InitInput =
	| RequestInfo
	| URL
	| Response
	| BufferSource
	| WebAssembly.Module;

export interface InitOutput {
	readonly memory: WebAssembly.Memory;
	readonly __wbg_fbmparameters_free: (a: number, b: number) => void;
	readonly __wbg_get_fbmparameters_octaves: (a: number) => number;
	readonly __wbg_set_fbmparameters_octaves: (a: number, b: number) => void;
	readonly __wbg_get_fbmparameters_frequency: (a: number) => number;
	readonly __wbg_set_fbmparameters_frequency: (a: number, b: number) => void;
	readonly __wbg_get_fbmparameters_persistence: (a: number) => number;
	readonly __wbg_set_fbmparameters_persistence: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_fbmparameters_lacunarity: (a: number) => number;
	readonly __wbg_set_fbmparameters_lacunarity: (a: number, b: number) => void;
	readonly __wbg_get_fbmparameters_amplitude: (a: number) => number;
	readonly __wbg_set_fbmparameters_amplitude: (a: number, b: number) => void;
	readonly __wbg_get_fbmparameters_seed_offset: (a: number) => number;
	readonly __wbg_set_fbmparameters_seed_offset: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_griddimensions_free: (a: number, b: number) => void;
	readonly __wbg_get_griddimensions_width: (a: number) => number;
	readonly __wbg_set_griddimensions_width: (a: number, b: number) => void;
	readonly __wbg_get_griddimensions_height: (a: number) => number;
	readonly __wbg_set_griddimensions_height: (a: number, b: number) => void;
	readonly __wbg_get_griddimensions_depth: (a: number) => number;
	readonly __wbg_set_griddimensions_depth: (a: number, b: number) => void;
	readonly __wbg_scalarfieldshapeparams_free: (a: number, b: number) => void;
	readonly __wbg_get_scalarfieldshapeparams_sphere_distort_fbm: (
		a: number,
	) => number;
	readonly __wbg_set_scalarfieldshapeparams_sphere_distort_fbm: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_scalarfieldshapeparams_large_form_fbm: (
		a: number,
	) => number;
	readonly __wbg_set_scalarfieldshapeparams_large_form_fbm: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_scalarfieldshapeparams_medium_detail_fbm: (
		a: number,
	) => number;
	readonly __wbg_set_scalarfieldshapeparams_medium_detail_fbm: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_scalarfieldshapeparams_fine_detail_fbm: (
		a: number,
	) => number;
	readonly __wbg_set_scalarfieldshapeparams_fine_detail_fbm: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_albedobakeparams_free: (a: number, b: number) => void;
	readonly __wbg_get_albedobakeparams_base_fbm: (a: number) => number;
	readonly __wbg_set_albedobakeparams_base_fbm: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_strata_fbm: (a: number) => number;
	readonly __wbg_set_albedobakeparams_strata_fbm: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_vein_fbm: (a: number) => number;
	readonly __wbg_set_albedobakeparams_vein_fbm: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_vein_warp_fbm: (a: number) => number;
	readonly __wbg_set_albedobakeparams_vein_warp_fbm: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_fleck_fbm: (a: number) => number;
	readonly __wbg_set_albedobakeparams_fleck_fbm: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_slate_color_dark_r: (
		a: number,
	) => number;
	readonly __wbg_set_albedobakeparams_slate_color_dark_r: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_slate_color_dark_g: (
		a: number,
	) => number;
	readonly __wbg_set_albedobakeparams_slate_color_dark_g: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_slate_color_dark_b: (
		a: number,
	) => number;
	readonly __wbg_set_albedobakeparams_slate_color_dark_b: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_slate_color_light_r: (
		a: number,
	) => number;
	readonly __wbg_set_albedobakeparams_slate_color_light_r: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_slate_color_light_g: (
		a: number,
	) => number;
	readonly __wbg_set_albedobakeparams_slate_color_light_g: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_slate_color_light_b: (
		a: number,
	) => number;
	readonly __wbg_set_albedobakeparams_slate_color_light_b: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_strata_color_r: (a: number) => number;
	readonly __wbg_set_albedobakeparams_strata_color_r: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_strata_color_g: (a: number) => number;
	readonly __wbg_set_albedobakeparams_strata_color_g: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_strata_color_b: (a: number) => number;
	readonly __wbg_set_albedobakeparams_strata_color_b: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_strata_influence: (a: number) => number;
	readonly __wbg_set_albedobakeparams_strata_influence: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_strata_frequency_y_stretch: (
		a: number,
	) => number;
	readonly __wbg_set_albedobakeparams_strata_frequency_y_stretch: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_vein_color_primary_r: (
		a: number,
	) => number;
	readonly __wbg_set_albedobakeparams_vein_color_primary_r: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_vein_color_primary_g: (
		a: number,
	) => number;
	readonly __wbg_set_albedobakeparams_vein_color_primary_g: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_vein_color_primary_b: (
		a: number,
	) => number;
	readonly __wbg_set_albedobakeparams_vein_color_primary_b: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_vein_threshold: (a: number) => number;
	readonly __wbg_set_albedobakeparams_vein_threshold: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_fleck_color_r: (a: number) => number;
	readonly __wbg_set_albedobakeparams_fleck_color_r: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_fleck_color_g: (a: number) => number;
	readonly __wbg_set_albedobakeparams_fleck_color_g: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_fleck_color_b: (a: number) => number;
	readonly __wbg_set_albedobakeparams_fleck_color_b: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_albedobakeparams_fleck_threshold: (a: number) => number;
	readonly __wbg_set_albedobakeparams_fleck_threshold: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_heightbakeparams_free: (a: number, b: number) => void;
	readonly __wbg_get_heightbakeparams_detail_blend_factor: (
		a: number,
	) => number;
	readonly __wbg_set_heightbakeparams_detail_blend_factor: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_heightbakeparams_overall_amplitude: (
		a: number,
	) => number;
	readonly __wbg_set_heightbakeparams_overall_amplitude: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_normalbakeparams_free: (a: number, b: number) => void;
	readonly __wbg_roughnessbakeparams_free: (a: number, b: number) => void;
	readonly __wbg_get_roughnessbakeparams_max_roughness: (a: number) => number;
	readonly __wbg_set_roughnessbakeparams_max_roughness: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_aobakeparams_free: (a: number, b: number) => void;
	readonly __wbg_get_aobakeparams_strength: (a: number) => number;
	readonly __wbg_set_aobakeparams_strength: (a: number, b: number) => void;
	readonly main_js: () => void;
	readonly get_scalar_field_structured_params_wasm: (
		a: number,
		b: number,
		c: number,
		d: number,
	) => void;
	readonly __wbg_meshdata_free: (a: number, b: number) => void;
	readonly meshdata_new: (
		a: number,
		b: number,
		c: number,
		d: number,
	) => number;
	readonly meshdata_vertices: (a: number) => number;
	readonly meshdata_indices: (a: number) => number;
	readonly extract_mesh_wasm: (
		a: number,
		b: number,
		c: number,
		d: number,
		e: number,
		f: number,
		g: number,
		h: number,
		i: number,
		j: number,
	) => void;
	readonly bake_texture_wasm: (
		a: number,
		b: number,
		c: number,
		d: number,
		e: number,
		f: number,
		g: number,
	) => void;
	readonly get_default_fbm_params: () => number;
	readonly get_default_scalar_field_shape_params: () => number;
	readonly get_default_grid_dimensions: () => number;
	readonly get_default_albedo_bake_params: () => number;
	readonly get_default_height_bake_params: () => number;
	readonly get_default_normal_bake_params: () => number;
	readonly get_default_roughness_bake_params: () => number;
	readonly get_default_ao_bake_params: () => number;
	readonly __wbg_get_heightbakeparams_base_fbm: (a: number) => number;
	readonly __wbg_get_heightbakeparams_detail_fbm: (a: number) => number;
	readonly __wbg_get_roughnessbakeparams_fbm_params: (a: number) => number;
	readonly __wbg_get_aobakeparams_fbm_params: (a: number) => number;
	readonly __wbg_set_heightbakeparams_base_fbm: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_set_heightbakeparams_detail_fbm: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_set_roughnessbakeparams_fbm_params: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_set_aobakeparams_fbm_params: (a: number, b: number) => void;
	readonly __wbg_set_scalarfieldshapeparams_base_sphere_radius: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_set_scalarfieldshapeparams_base_sphere_influence: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_set_normalbakeparams_strength: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_set_roughnessbakeparams_min_roughness: (
		a: number,
		b: number,
	) => void;
	readonly __wbg_get_scalarfieldshapeparams_base_sphere_radius: (
		a: number,
	) => number;
	readonly __wbg_get_scalarfieldshapeparams_base_sphere_influence: (
		a: number,
	) => number;
	readonly __wbg_get_normalbakeparams_strength: (a: number) => number;
	readonly __wbg_get_roughnessbakeparams_min_roughness: (a: number) => number;
	readonly __wbindgen_export_0: (a: number, b: number, c: number) => void;
	readonly __wbindgen_export_1: (a: number, b: number) => number;
	readonly __wbindgen_export_2: (
		a: number,
		b: number,
		c: number,
		d: number,
	) => number;
	readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
	readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(
	module: { module: SyncInitInput } | SyncInitInput,
): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(
	module_or_path?:
		| { module_or_path: InitInput | Promise<InitInput> }
		| InitInput
		| Promise<InitInput>,
): Promise<InitOutput>;
