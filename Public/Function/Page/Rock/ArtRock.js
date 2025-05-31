let wasm;

const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) {
	return heap[idx];
}

let heap_next = heap.length;

function addHeapObject(obj) {
	if (heap_next === heap.length) heap.push(heap.length + 1);

	const idx = heap_next;

	heap_next = heap[idx];

	heap[idx] = obj;

	return idx;
}

const cachedTextDecoder =
	typeof TextDecoder !== "undefined"
		? new TextDecoder("utf-8", { ignoreBOM: true, fatal: true })
		: {
				decode: () => {
					throw Error("TextDecoder not available");
				},
			};

if (typeof TextDecoder !== "undefined") {
	cachedTextDecoder.decode();
}

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
	if (
		cachedUint8ArrayMemory0 === null ||
		cachedUint8ArrayMemory0.byteLength === 0
	) {
		cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
	}

	return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
	ptr = ptr >>> 0;

	return cachedTextDecoder.decode(
		getUint8ArrayMemory0().subarray(ptr, ptr + len),
	);
}

function dropObject(idx) {
	if (idx < 132) return;

	heap[idx] = heap_next;

	heap_next = idx;
}

function takeObject(idx) {
	const ret = getObject(idx);

	dropObject(idx);

	return ret;
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder =
	typeof TextEncoder !== "undefined"
		? new TextEncoder("utf-8")
		: {
				encode: () => {
					throw Error("TextEncoder not available");
				},
			};

const encodeString =
	typeof cachedTextEncoder.encodeInto === "function"
		? function (arg, view) {
				return cachedTextEncoder.encodeInto(arg, view);
			}
		: function (arg, view) {
				const buf = cachedTextEncoder.encode(arg);

				view.set(buf);

				return {
					read: arg.length,

					written: buf.length,
				};
			};

function passStringToWasm0(arg, malloc, realloc) {
	if (realloc === undefined) {
		const buf = cachedTextEncoder.encode(arg);

		const ptr = malloc(buf.length, 1) >>> 0;

		getUint8ArrayMemory0()
			.subarray(ptr, ptr + buf.length)
			.set(buf);

		WASM_VECTOR_LEN = buf.length;

		return ptr;
	}

	let len = arg.length;

	let ptr = malloc(len, 1) >>> 0;

	const mem = getUint8ArrayMemory0();

	let offset = 0;

	for (; offset < len; offset++) {
		const code = arg.charCodeAt(offset);

		if (code > 0x7f) break;

		mem[ptr + offset] = code;
	}

	if (offset !== len) {
		if (offset !== 0) {
			arg = arg.slice(offset);
		}

		ptr = realloc(ptr, len, (len = offset + arg.length * 3), 1) >>> 0;

		const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);

		const ret = encodeString(arg, view);

		offset += ret.written;

		ptr = realloc(ptr, len, offset, 1) >>> 0;
	}

	WASM_VECTOR_LEN = offset;

	return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
	if (
		cachedDataViewMemory0 === null ||
		cachedDataViewMemory0.buffer.detached === true ||
		(cachedDataViewMemory0.buffer.detached === undefined &&
			cachedDataViewMemory0.buffer !== wasm.memory.buffer)
	) {
		cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
	}

	return cachedDataViewMemory0;
}

function isLikeNone(x) {
	return x === undefined || x === null;
}

function debugString(val) {
	// primitive types
	const type = typeof val;

	if (type == "number" || type == "boolean" || val == null) {
		return `${val}`;
	}

	if (type == "string") {
		return `"${val}"`;
	}

	if (type == "symbol") {
		const description = val.description;

		if (description == null) {
			return "Symbol";
		} else {
			return `Symbol(${description})`;
		}
	}

	if (type == "function") {
		const name = val.name;

		if (typeof name == "string" && name.length > 0) {
			return `Function(${name})`;
		} else {
			return "Function";
		}
	}

	// objects
	if (Array.isArray(val)) {
		const length = val.length;

		let debug = "[";

		if (length > 0) {
			debug += debugString(val[0]);
		}

		for (let i = 1; i < length; i++) {
			debug += ", " + debugString(val[i]);
		}

		debug += "]";

		return debug;
	}

	// Test for built-in
	const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));

	let className;

	if (builtInMatches && builtInMatches.length > 1) {
		className = builtInMatches[1];
	} else {
		// Failed to match the standard '[object ClassName]'
		return toString.call(val);
	}

	if (className == "Object") {
		// we're a user defined class or Object
		// JSON.stringify avoids problems with cycles, and is generally much
		// easier than looping through ownProperties of `val`.
		try {
			return "Object(" + JSON.stringify(val) + ")";
		} catch (_) {
			return "Object";
		}
	}

	// errors
	if (val instanceof Error) {
		return `${val.name}: ${val.message}\n${val.stack}`;
	}

	// TODO we could test for more things here, like `Set`s and `Map`s.
	return className;
}

function _assertClass(instance, klass) {
	if (!(instance instanceof klass)) {
		throw new Error(`expected instance of ${klass.name}`);
	}
}

export function main_js() {
	wasm.main_js();
}

let cachedFloat32ArrayMemory0 = null;

function getFloat32ArrayMemory0() {
	if (
		cachedFloat32ArrayMemory0 === null ||
		cachedFloat32ArrayMemory0.byteLength === 0
	) {
		cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
	}

	return cachedFloat32ArrayMemory0;
}

function getArrayF32FromWasm0(ptr, len) {
	ptr = ptr >>> 0;

	return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

/**
 * @param {any} grid_dims_js
 * @param {number} global_seed
 * @param {any} shape_params_js
 * @returns {Float32Array}
 *
 *
 */
export function get_scalar_field_structured_params_wasm(
	grid_dims_js,

	global_seed,

	shape_params_js,
) {
	try {
		const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);

		wasm.get_scalar_field_structured_params_wasm(
			retptr,

			addHeapObject(grid_dims_js),

			global_seed,

			addHeapObject(shape_params_js),
		);

		var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);

		var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);

		var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);

		var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);

		if (r3) {
			throw takeObject(r2);
		}

		var v1 = getArrayF32FromWasm0(r0, r1).slice();

		wasm.__wbindgen_export_0(r0, r1 * 4, 4);

		return v1;
	} finally {
		wasm.__wbindgen_add_to_stack_pointer(16);
	}
}

function passArrayF32ToWasm0(arg, malloc) {
	const ptr = malloc(arg.length * 4, 4) >>> 0;

	getFloat32ArrayMemory0().set(arg, ptr / 4);

	WASM_VECTOR_LEN = arg.length;

	return ptr;
}

let cachedUint32ArrayMemory0 = null;

function getUint32ArrayMemory0() {
	if (
		cachedUint32ArrayMemory0 === null ||
		cachedUint32ArrayMemory0.byteLength === 0
	) {
		cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
	}

	return cachedUint32ArrayMemory0;
}

function passArray32ToWasm0(arg, malloc) {
	const ptr = malloc(arg.length * 4, 4) >>> 0;

	getUint32ArrayMemory0().set(arg, ptr / 4);

	WASM_VECTOR_LEN = arg.length;

	return ptr;
}

/**
 * @param {Float32Array} scalar_field_js_array
 * @param {any} grid_dims_js
 * @param {number} iso_level
 * @param {number} mesh_scale_x
 * @param {number} mesh_scale_y
 * @param {number} mesh_scale_z
 * @param {number} mesh_offset_x
 * @param {number} mesh_offset_y
 * @param {number} mesh_offset_z
 * @returns {MeshData}
 *
 *
 */
export function extract_mesh_wasm(
	scalar_field_js_array,

	grid_dims_js,

	iso_level,

	mesh_scale_x,

	mesh_scale_y,

	mesh_scale_z,

	mesh_offset_x,

	mesh_offset_y,

	mesh_offset_z,
) {
	try {
		const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);

		wasm.extract_mesh_wasm(
			retptr,

			addHeapObject(scalar_field_js_array),

			addHeapObject(grid_dims_js),

			iso_level,

			mesh_scale_x,

			mesh_scale_y,

			mesh_scale_z,

			mesh_offset_x,

			mesh_offset_y,

			mesh_offset_z,
		);

		var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);

		var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);

		var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);

		if (r2) {
			throw takeObject(r1);
		}

		return MeshData.__wrap(r0);
	} finally {
		wasm.__wbindgen_add_to_stack_pointer(16);
	}
}

function getArrayU8FromWasm0(ptr, len) {
	ptr = ptr >>> 0;

	return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

/**
 * @param {JsTextureType} js_texture_type
 * @param {number} width
 * @param {number} height
 * @param {number} global_seed
 * @param {any} params_js_value
 * @param {Float32Array | null} [height_map_js_array_opt]
 * @returns {Uint8Array}
 *
 *
 */
export function bake_texture_wasm(
	js_texture_type,

	width,

	height,

	global_seed,

	params_js_value,

	height_map_js_array_opt,
) {
	try {
		const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);

		wasm.bake_texture_wasm(
			retptr,

			js_texture_type,

			width,

			height,

			global_seed,

			addHeapObject(params_js_value),

			isLikeNone(height_map_js_array_opt)
				? 0
				: addHeapObject(height_map_js_array_opt),
		);

		var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);

		var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);

		var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);

		var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);

		if (r3) {
			throw takeObject(r2);
		}

		var v1 = getArrayU8FromWasm0(r0, r1).slice();

		wasm.__wbindgen_export_0(r0, r1 * 1, 1);

		return v1;
	} finally {
		wasm.__wbindgen_add_to_stack_pointer(16);
	}
}

/**
 * @returns {any}
 *
 *
 */
export function get_default_fbm_params() {
	const ret = wasm.get_default_fbm_params();

	return takeObject(ret);
}

/**
 * @returns {any}
 *
 *
 */
export function get_default_scalar_field_shape_params() {
	const ret = wasm.get_default_scalar_field_shape_params();

	return takeObject(ret);
}

/**
 * @returns {any}
 *
 *
 */
export function get_default_grid_dimensions() {
	const ret = wasm.get_default_grid_dimensions();

	return takeObject(ret);
}

/**
 * @returns {any}
 *
 *
 */
export function get_default_albedo_bake_params() {
	const ret = wasm.get_default_albedo_bake_params();

	return takeObject(ret);
}

/**
 * @returns {any}
 *
 *
 */
export function get_default_height_bake_params() {
	const ret = wasm.get_default_height_bake_params();

	return takeObject(ret);
}

/**
 * @returns {any}
 *
 *
 */
export function get_default_normal_bake_params() {
	const ret = wasm.get_default_normal_bake_params();

	return takeObject(ret);
}

/**
 * @returns {any}
 *
 *
 */
export function get_default_roughness_bake_params() {
	const ret = wasm.get_default_roughness_bake_params();

	return takeObject(ret);
}

/**
 * @returns {any}
 *
 *
 */
export function get_default_ao_bake_params() {
	const ret = wasm.get_default_ao_bake_params();

	return takeObject(ret);
}

/**
 * @enum {0 | 1 | 2 | 3 | 4}
 *
 *
 */
export const JsTextureType = Object.freeze({
	Albedo: 0,

	"0": "Albedo",

	Height: 1,

	"1": "Height",

	Normal: 2,

	"2": "Normal",

	Roughness: 3,

	"3": "Roughness",

	AmbientOcclusion: 4,

	"4": "AmbientOcclusion",
});

/**
 * @enum {0 | 1 | 2 | 3 | 4}
 *
 *
 */
export const TextureType = Object.freeze({
	Albedo: 0,

	"0": "Albedo",

	Height: 1,

	"1": "Height",

	Normal: 2,

	"2": "Normal",

	Roughness: 3,

	"3": "Roughness",

	AmbientOcclusion: 4,

	"4": "AmbientOcclusion",
});

const AlbedoBakeParamsFinalization =
	typeof FinalizationRegistry === "undefined"
		? { register: () => {}, unregister: () => {} }
		: new FinalizationRegistry((ptr) =>
				wasm.__wbg_albedobakeparams_free(ptr >>> 0, 1),
			);

export class AlbedoBakeParams {
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;

		this.__wbg_ptr = 0;

		AlbedoBakeParamsFinalization.unregister(this);

		return ptr;
	}

	free() {
		const ptr = this.__destroy_into_raw();

		wasm.__wbg_albedobakeparams_free(ptr, 0);
	}

	/**
	 * @returns {FbmParameters}
	 *
	 *
	 */
	get base_fbm() {
		const ret = wasm.__wbg_get_albedobakeparams_base_fbm(this.__wbg_ptr);

		return FbmParameters.__wrap(ret);
	}

	/**
	 * @param {FbmParameters} arg0
	 */
	set base_fbm(arg0) {
		_assertClass(arg0, FbmParameters);

		var ptr0 = arg0.__destroy_into_raw();

		wasm.__wbg_set_albedobakeparams_base_fbm(this.__wbg_ptr, ptr0);
	}

	/**
	 * @returns {FbmParameters}
	 *
	 *
	 */
	get strata_fbm() {
		const ret = wasm.__wbg_get_albedobakeparams_strata_fbm(this.__wbg_ptr);

		return FbmParameters.__wrap(ret);
	}

	/**
	 * @param {FbmParameters} arg0
	 */
	set strata_fbm(arg0) {
		_assertClass(arg0, FbmParameters);

		var ptr0 = arg0.__destroy_into_raw();

		wasm.__wbg_set_albedobakeparams_strata_fbm(this.__wbg_ptr, ptr0);
	}

	/**
	 * @returns {FbmParameters}
	 *
	 *
	 */
	get vein_fbm() {
		const ret = wasm.__wbg_get_albedobakeparams_vein_fbm(this.__wbg_ptr);

		return FbmParameters.__wrap(ret);
	}

	/**
	 * @param {FbmParameters} arg0
	 */
	set vein_fbm(arg0) {
		_assertClass(arg0, FbmParameters);

		var ptr0 = arg0.__destroy_into_raw();

		wasm.__wbg_set_albedobakeparams_vein_fbm(this.__wbg_ptr, ptr0);
	}

	/**
	 * @returns {FbmParameters}
	 *
	 *
	 */
	get vein_warp_fbm() {
		const ret = wasm.__wbg_get_albedobakeparams_vein_warp_fbm(
			this.__wbg_ptr,
		);

		return FbmParameters.__wrap(ret);
	}

	/**
	 * @param {FbmParameters} arg0
	 */
	set vein_warp_fbm(arg0) {
		_assertClass(arg0, FbmParameters);

		var ptr0 = arg0.__destroy_into_raw();

		wasm.__wbg_set_albedobakeparams_vein_warp_fbm(this.__wbg_ptr, ptr0);
	}

	/**
	 * @returns {FbmParameters}
	 *
	 *
	 */
	get fleck_fbm() {
		const ret = wasm.__wbg_get_albedobakeparams_fleck_fbm(this.__wbg_ptr);

		return FbmParameters.__wrap(ret);
	}

	/**
	 * @param {FbmParameters} arg0
	 */
	set fleck_fbm(arg0) {
		_assertClass(arg0, FbmParameters);

		var ptr0 = arg0.__destroy_into_raw();

		wasm.__wbg_set_albedobakeparams_fleck_fbm(this.__wbg_ptr, ptr0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get slate_color_dark_r() {
		const ret = wasm.__wbg_get_albedobakeparams_slate_color_dark_r(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set slate_color_dark_r(arg0) {
		wasm.__wbg_set_albedobakeparams_slate_color_dark_r(
			this.__wbg_ptr,

			arg0,
		);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get slate_color_dark_g() {
		const ret = wasm.__wbg_get_albedobakeparams_slate_color_dark_g(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set slate_color_dark_g(arg0) {
		wasm.__wbg_set_albedobakeparams_slate_color_dark_g(
			this.__wbg_ptr,

			arg0,
		);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get slate_color_dark_b() {
		const ret = wasm.__wbg_get_albedobakeparams_slate_color_dark_b(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set slate_color_dark_b(arg0) {
		wasm.__wbg_set_albedobakeparams_slate_color_dark_b(
			this.__wbg_ptr,

			arg0,
		);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get slate_color_light_r() {
		const ret = wasm.__wbg_get_albedobakeparams_slate_color_light_r(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set slate_color_light_r(arg0) {
		wasm.__wbg_set_albedobakeparams_slate_color_light_r(
			this.__wbg_ptr,

			arg0,
		);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get slate_color_light_g() {
		const ret = wasm.__wbg_get_albedobakeparams_slate_color_light_g(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set slate_color_light_g(arg0) {
		wasm.__wbg_set_albedobakeparams_slate_color_light_g(
			this.__wbg_ptr,

			arg0,
		);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get slate_color_light_b() {
		const ret = wasm.__wbg_get_albedobakeparams_slate_color_light_b(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set slate_color_light_b(arg0) {
		wasm.__wbg_set_albedobakeparams_slate_color_light_b(
			this.__wbg_ptr,

			arg0,
		);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get strata_color_r() {
		const ret = wasm.__wbg_get_albedobakeparams_strata_color_r(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set strata_color_r(arg0) {
		wasm.__wbg_set_albedobakeparams_strata_color_r(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get strata_color_g() {
		const ret = wasm.__wbg_get_albedobakeparams_strata_color_g(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set strata_color_g(arg0) {
		wasm.__wbg_set_albedobakeparams_strata_color_g(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get strata_color_b() {
		const ret = wasm.__wbg_get_albedobakeparams_strata_color_b(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set strata_color_b(arg0) {
		wasm.__wbg_set_albedobakeparams_strata_color_b(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get strata_influence() {
		const ret = wasm.__wbg_get_albedobakeparams_strata_influence(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set strata_influence(arg0) {
		wasm.__wbg_set_albedobakeparams_strata_influence(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get strata_frequency_y_stretch() {
		const ret = wasm.__wbg_get_albedobakeparams_strata_frequency_y_stretch(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set strata_frequency_y_stretch(arg0) {
		wasm.__wbg_set_albedobakeparams_strata_frequency_y_stretch(
			this.__wbg_ptr,

			arg0,
		);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get vein_color_primary_r() {
		const ret = wasm.__wbg_get_albedobakeparams_vein_color_primary_r(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set vein_color_primary_r(arg0) {
		wasm.__wbg_set_albedobakeparams_vein_color_primary_r(
			this.__wbg_ptr,

			arg0,
		);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get vein_color_primary_g() {
		const ret = wasm.__wbg_get_albedobakeparams_vein_color_primary_g(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set vein_color_primary_g(arg0) {
		wasm.__wbg_set_albedobakeparams_vein_color_primary_g(
			this.__wbg_ptr,

			arg0,
		);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get vein_color_primary_b() {
		const ret = wasm.__wbg_get_albedobakeparams_vein_color_primary_b(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set vein_color_primary_b(arg0) {
		wasm.__wbg_set_albedobakeparams_vein_color_primary_b(
			this.__wbg_ptr,

			arg0,
		);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get vein_threshold() {
		const ret = wasm.__wbg_get_albedobakeparams_vein_threshold(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set vein_threshold(arg0) {
		wasm.__wbg_set_albedobakeparams_vein_threshold(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get fleck_color_r() {
		const ret = wasm.__wbg_get_albedobakeparams_fleck_color_r(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set fleck_color_r(arg0) {
		wasm.__wbg_set_albedobakeparams_fleck_color_r(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get fleck_color_g() {
		const ret = wasm.__wbg_get_albedobakeparams_fleck_color_g(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set fleck_color_g(arg0) {
		wasm.__wbg_set_albedobakeparams_fleck_color_g(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get fleck_color_b() {
		const ret = wasm.__wbg_get_albedobakeparams_fleck_color_b(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set fleck_color_b(arg0) {
		wasm.__wbg_set_albedobakeparams_fleck_color_b(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get fleck_threshold() {
		const ret = wasm.__wbg_get_albedobakeparams_fleck_threshold(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set fleck_threshold(arg0) {
		wasm.__wbg_set_albedobakeparams_fleck_threshold(this.__wbg_ptr, arg0);
	}
}

const AoBakeParamsFinalization =
	typeof FinalizationRegistry === "undefined"
		? { register: () => {}, unregister: () => {} }
		: new FinalizationRegistry((ptr) =>
				wasm.__wbg_aobakeparams_free(ptr >>> 0, 1),
			);

export class AoBakeParams {
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;

		this.__wbg_ptr = 0;

		AoBakeParamsFinalization.unregister(this);

		return ptr;
	}

	free() {
		const ptr = this.__destroy_into_raw();

		wasm.__wbg_aobakeparams_free(ptr, 0);
	}

	/**
	 * @returns {FbmParameters}
	 *
	 *
	 */
	get fbm_params() {
		const ret = wasm.__wbg_get_albedobakeparams_base_fbm(this.__wbg_ptr);

		return FbmParameters.__wrap(ret);
	}

	/**
	 * @param {FbmParameters} arg0
	 */
	set fbm_params(arg0) {
		_assertClass(arg0, FbmParameters);

		var ptr0 = arg0.__destroy_into_raw();

		wasm.__wbg_set_albedobakeparams_base_fbm(this.__wbg_ptr, ptr0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get strength() {
		const ret = wasm.__wbg_get_aobakeparams_strength(this.__wbg_ptr);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set strength(arg0) {
		wasm.__wbg_set_aobakeparams_strength(this.__wbg_ptr, arg0);
	}
}

const FbmParametersFinalization =
	typeof FinalizationRegistry === "undefined"
		? { register: () => {}, unregister: () => {} }
		: new FinalizationRegistry((ptr) =>
				wasm.__wbg_fbmparameters_free(ptr >>> 0, 1),
			);

export class FbmParameters {
	static __wrap(ptr) {
		ptr = ptr >>> 0;

		const obj = Object.create(FbmParameters.prototype);

		obj.__wbg_ptr = ptr;

		FbmParametersFinalization.register(obj, obj.__wbg_ptr, obj);

		return obj;
	}

	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;

		this.__wbg_ptr = 0;

		FbmParametersFinalization.unregister(this);

		return ptr;
	}

	free() {
		const ptr = this.__destroy_into_raw();

		wasm.__wbg_fbmparameters_free(ptr, 0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get octaves() {
		const ret = wasm.__wbg_get_fbmparameters_octaves(this.__wbg_ptr);

		return ret >>> 0;
	}

	/**
	 * @param {number} arg0
	 */
	set octaves(arg0) {
		wasm.__wbg_set_fbmparameters_octaves(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get frequency() {
		const ret = wasm.__wbg_get_fbmparameters_frequency(this.__wbg_ptr);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set frequency(arg0) {
		wasm.__wbg_set_fbmparameters_frequency(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get persistence() {
		const ret = wasm.__wbg_get_fbmparameters_persistence(this.__wbg_ptr);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set persistence(arg0) {
		wasm.__wbg_set_fbmparameters_persistence(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get lacunarity() {
		const ret = wasm.__wbg_get_fbmparameters_lacunarity(this.__wbg_ptr);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set lacunarity(arg0) {
		wasm.__wbg_set_fbmparameters_lacunarity(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get amplitude() {
		const ret = wasm.__wbg_get_fbmparameters_amplitude(this.__wbg_ptr);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set amplitude(arg0) {
		wasm.__wbg_set_fbmparameters_amplitude(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get seed_offset() {
		const ret = wasm.__wbg_get_fbmparameters_seed_offset(this.__wbg_ptr);

		return ret >>> 0;
	}

	/**
	 * @param {number} arg0
	 */
	set seed_offset(arg0) {
		wasm.__wbg_set_fbmparameters_seed_offset(this.__wbg_ptr, arg0);
	}
}

const GridDimensionsFinalization =
	typeof FinalizationRegistry === "undefined"
		? { register: () => {}, unregister: () => {} }
		: new FinalizationRegistry((ptr) =>
				wasm.__wbg_griddimensions_free(ptr >>> 0, 1),
			);

export class GridDimensions {
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;

		this.__wbg_ptr = 0;

		GridDimensionsFinalization.unregister(this);

		return ptr;
	}

	free() {
		const ptr = this.__destroy_into_raw();

		wasm.__wbg_griddimensions_free(ptr, 0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get width() {
		const ret = wasm.__wbg_get_griddimensions_width(this.__wbg_ptr);

		return ret >>> 0;
	}

	/**
	 * @param {number} arg0
	 */
	set width(arg0) {
		wasm.__wbg_set_griddimensions_width(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get height() {
		const ret = wasm.__wbg_get_griddimensions_height(this.__wbg_ptr);

		return ret >>> 0;
	}

	/**
	 * @param {number} arg0
	 */
	set height(arg0) {
		wasm.__wbg_set_griddimensions_height(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get depth() {
		const ret = wasm.__wbg_get_griddimensions_depth(this.__wbg_ptr);

		return ret >>> 0;
	}

	/**
	 * @param {number} arg0
	 */
	set depth(arg0) {
		wasm.__wbg_set_griddimensions_depth(this.__wbg_ptr, arg0);
	}
}

const HeightBakeParamsFinalization =
	typeof FinalizationRegistry === "undefined"
		? { register: () => {}, unregister: () => {} }
		: new FinalizationRegistry((ptr) =>
				wasm.__wbg_heightbakeparams_free(ptr >>> 0, 1),
			);

export class HeightBakeParams {
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;

		this.__wbg_ptr = 0;

		HeightBakeParamsFinalization.unregister(this);

		return ptr;
	}

	free() {
		const ptr = this.__destroy_into_raw();

		wasm.__wbg_heightbakeparams_free(ptr, 0);
	}

	/**
	 * @returns {FbmParameters}
	 *
	 *
	 */
	get base_fbm() {
		const ret = wasm.__wbg_get_albedobakeparams_base_fbm(this.__wbg_ptr);

		return FbmParameters.__wrap(ret);
	}

	/**
	 * @param {FbmParameters} arg0
	 */
	set base_fbm(arg0) {
		_assertClass(arg0, FbmParameters);

		var ptr0 = arg0.__destroy_into_raw();

		wasm.__wbg_set_albedobakeparams_base_fbm(this.__wbg_ptr, ptr0);
	}

	/**
	 * @returns {FbmParameters}
	 *
	 *
	 */
	get detail_fbm() {
		const ret = wasm.__wbg_get_albedobakeparams_strata_fbm(this.__wbg_ptr);

		return FbmParameters.__wrap(ret);
	}

	/**
	 * @param {FbmParameters} arg0
	 */
	set detail_fbm(arg0) {
		_assertClass(arg0, FbmParameters);

		var ptr0 = arg0.__destroy_into_raw();

		wasm.__wbg_set_albedobakeparams_strata_fbm(this.__wbg_ptr, ptr0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get detail_blend_factor() {
		const ret = wasm.__wbg_get_heightbakeparams_detail_blend_factor(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set detail_blend_factor(arg0) {
		wasm.__wbg_set_heightbakeparams_detail_blend_factor(
			this.__wbg_ptr,

			arg0,
		);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get overall_amplitude() {
		const ret = wasm.__wbg_get_heightbakeparams_overall_amplitude(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set overall_amplitude(arg0) {
		wasm.__wbg_set_heightbakeparams_overall_amplitude(this.__wbg_ptr, arg0);
	}
}

const MeshDataFinalization =
	typeof FinalizationRegistry === "undefined"
		? { register: () => {}, unregister: () => {} }
		: new FinalizationRegistry((ptr) =>
				wasm.__wbg_meshdata_free(ptr >>> 0, 1),
			);

export class MeshData {
	static __wrap(ptr) {
		ptr = ptr >>> 0;

		const obj = Object.create(MeshData.prototype);

		obj.__wbg_ptr = ptr;

		MeshDataFinalization.register(obj, obj.__wbg_ptr, obj);

		return obj;
	}

	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;

		this.__wbg_ptr = 0;

		MeshDataFinalization.unregister(this);

		return ptr;
	}

	free() {
		const ptr = this.__destroy_into_raw();

		wasm.__wbg_meshdata_free(ptr, 0);
	}

	/**
	 * @param {Float32Array} vertices
	 * @param {Uint32Array} indices
	 * @returns {MeshData}
	 *
	 *
	 */
	static new(vertices, indices) {
		const ptr0 = passArrayF32ToWasm0(vertices, wasm.__wbindgen_export_1);

		const len0 = WASM_VECTOR_LEN;

		const ptr1 = passArray32ToWasm0(indices, wasm.__wbindgen_export_1);

		const len1 = WASM_VECTOR_LEN;

		const ret = wasm.meshdata_new(ptr0, len0, ptr1, len1);

		return MeshData.__wrap(ret);
	}

	/**
	 * @returns {Float32Array}
	 *
	 *
	 */
	get vertices() {
		const ret = wasm.meshdata_vertices(this.__wbg_ptr);

		return takeObject(ret);
	}

	/**
	 * @returns {Uint32Array}
	 *
	 *
	 */
	get indices() {
		const ret = wasm.meshdata_indices(this.__wbg_ptr);

		return takeObject(ret);
	}
}

const NormalBakeParamsFinalization =
	typeof FinalizationRegistry === "undefined"
		? { register: () => {}, unregister: () => {} }
		: new FinalizationRegistry((ptr) =>
				wasm.__wbg_normalbakeparams_free(ptr >>> 0, 1),
			);

export class NormalBakeParams {
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;

		this.__wbg_ptr = 0;

		NormalBakeParamsFinalization.unregister(this);

		return ptr;
	}

	free() {
		const ptr = this.__destroy_into_raw();

		wasm.__wbg_normalbakeparams_free(ptr, 0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get strength() {
		const ret = wasm.__wbg_get_fbmparameters_frequency(this.__wbg_ptr);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set strength(arg0) {
		wasm.__wbg_set_fbmparameters_frequency(this.__wbg_ptr, arg0);
	}
}

const RoughnessBakeParamsFinalization =
	typeof FinalizationRegistry === "undefined"
		? { register: () => {}, unregister: () => {} }
		: new FinalizationRegistry((ptr) =>
				wasm.__wbg_roughnessbakeparams_free(ptr >>> 0, 1),
			);

export class RoughnessBakeParams {
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;

		this.__wbg_ptr = 0;

		RoughnessBakeParamsFinalization.unregister(this);

		return ptr;
	}

	free() {
		const ptr = this.__destroy_into_raw();

		wasm.__wbg_roughnessbakeparams_free(ptr, 0);
	}

	/**
	 * @returns {FbmParameters}
	 *
	 *
	 */
	get fbm_params() {
		const ret = wasm.__wbg_get_albedobakeparams_base_fbm(this.__wbg_ptr);

		return FbmParameters.__wrap(ret);
	}

	/**
	 * @param {FbmParameters} arg0
	 */
	set fbm_params(arg0) {
		_assertClass(arg0, FbmParameters);

		var ptr0 = arg0.__destroy_into_raw();

		wasm.__wbg_set_albedobakeparams_base_fbm(this.__wbg_ptr, ptr0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get min_roughness() {
		const ret = wasm.__wbg_get_aobakeparams_strength(this.__wbg_ptr);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set min_roughness(arg0) {
		wasm.__wbg_set_aobakeparams_strength(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get max_roughness() {
		const ret = wasm.__wbg_get_roughnessbakeparams_max_roughness(
			this.__wbg_ptr,
		);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set max_roughness(arg0) {
		wasm.__wbg_set_roughnessbakeparams_max_roughness(this.__wbg_ptr, arg0);
	}
}

const ScalarFieldShapeParamsFinalization =
	typeof FinalizationRegistry === "undefined"
		? { register: () => {}, unregister: () => {} }
		: new FinalizationRegistry((ptr) =>
				wasm.__wbg_scalarfieldshapeparams_free(ptr >>> 0, 1),
			);

export class ScalarFieldShapeParams {
	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;

		this.__wbg_ptr = 0;

		ScalarFieldShapeParamsFinalization.unregister(this);

		return ptr;
	}

	free() {
		const ptr = this.__destroy_into_raw();

		wasm.__wbg_scalarfieldshapeparams_free(ptr, 0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get base_sphere_radius() {
		const ret = wasm.__wbg_get_fbmparameters_frequency(this.__wbg_ptr);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set base_sphere_radius(arg0) {
		wasm.__wbg_set_fbmparameters_frequency(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {number}
	 *
	 *
	 */
	get base_sphere_influence() {
		const ret = wasm.__wbg_get_fbmparameters_persistence(this.__wbg_ptr);

		return ret;
	}

	/**
	 * @param {number} arg0
	 */
	set base_sphere_influence(arg0) {
		wasm.__wbg_set_fbmparameters_persistence(this.__wbg_ptr, arg0);
	}

	/**
	 * @returns {FbmParameters}
	 *
	 *
	 */
	get sphere_distort_fbm() {
		const ret = wasm.__wbg_get_scalarfieldshapeparams_sphere_distort_fbm(
			this.__wbg_ptr,
		);

		return FbmParameters.__wrap(ret);
	}

	/**
	 * @param {FbmParameters} arg0
	 */
	set sphere_distort_fbm(arg0) {
		_assertClass(arg0, FbmParameters);

		var ptr0 = arg0.__destroy_into_raw();

		wasm.__wbg_set_scalarfieldshapeparams_sphere_distort_fbm(
			this.__wbg_ptr,

			ptr0,
		);
	}

	/**
	 * @returns {FbmParameters}
	 *
	 *
	 */
	get large_form_fbm() {
		const ret = wasm.__wbg_get_scalarfieldshapeparams_large_form_fbm(
			this.__wbg_ptr,
		);

		return FbmParameters.__wrap(ret);
	}

	/**
	 * @param {FbmParameters} arg0
	 */
	set large_form_fbm(arg0) {
		_assertClass(arg0, FbmParameters);

		var ptr0 = arg0.__destroy_into_raw();

		wasm.__wbg_set_scalarfieldshapeparams_large_form_fbm(
			this.__wbg_ptr,

			ptr0,
		);
	}

	/**
	 * @returns {FbmParameters}
	 *
	 *
	 */
	get medium_detail_fbm() {
		const ret = wasm.__wbg_get_scalarfieldshapeparams_medium_detail_fbm(
			this.__wbg_ptr,
		);

		return FbmParameters.__wrap(ret);
	}

	/**
	 * @param {FbmParameters} arg0
	 */
	set medium_detail_fbm(arg0) {
		_assertClass(arg0, FbmParameters);

		var ptr0 = arg0.__destroy_into_raw();

		wasm.__wbg_set_scalarfieldshapeparams_medium_detail_fbm(
			this.__wbg_ptr,

			ptr0,
		);
	}

	/**
	 * @returns {FbmParameters}
	 *
	 *
	 */
	get fine_detail_fbm() {
		const ret = wasm.__wbg_get_scalarfieldshapeparams_fine_detail_fbm(
			this.__wbg_ptr,
		);

		return FbmParameters.__wrap(ret);
	}

	/**
	 * @param {FbmParameters} arg0
	 */
	set fine_detail_fbm(arg0) {
		_assertClass(arg0, FbmParameters);

		var ptr0 = arg0.__destroy_into_raw();

		wasm.__wbg_set_scalarfieldshapeparams_fine_detail_fbm(
			this.__wbg_ptr,

			ptr0,
		);
	}
}

async function __wbg_load(module, imports) {
	if (typeof Response === "function" && module instanceof Response) {
		if (typeof WebAssembly.instantiateStreaming === "function") {
			try {
				return await WebAssembly.instantiateStreaming(module, imports);
			} catch (e) {
				if (module.headers.get("Content-Type") != "application/wasm") {
					console.warn(
						"`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",

						e,
					);
				} else {
					throw e;
				}
			}
		}

		const bytes = await module.arrayBuffer();

		return await WebAssembly.instantiate(bytes, imports);
	} else {
		const instance = await WebAssembly.instantiate(module, imports);

		if (instance instanceof WebAssembly.Instance) {
			return { instance, module };
		} else {
			return instance;
		}
	}
}

function __wbg_get_imports() {
	const imports = {};

	imports.wbg = {};

	imports.wbg.__wbg_buffer_609cc3eee51ed158 = function (arg0) {
		const ret = getObject(arg0).buffer;

		return addHeapObject(ret);
	};

	imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function (arg0, arg1) {
		let deferred0_0;

		let deferred0_1;

		try {
			deferred0_0 = arg0;

			deferred0_1 = arg1;

			console.error(getStringFromWasm0(arg0, arg1));
		} finally {
			wasm.__wbindgen_export_0(deferred0_0, deferred0_1, 1);
		}
	};

	imports.wbg.__wbg_getwithrefkey_1dc361bd10053bfe = function (arg0, arg1) {
		const ret = getObject(arg0)[getObject(arg1)];

		return addHeapObject(ret);
	};

	imports.wbg.__wbg_instanceof_ArrayBuffer_e14585432e3737fc = function (
		arg0,
	) {
		let result;

		try {
			result = getObject(arg0) instanceof ArrayBuffer;
		} catch (_) {
			result = false;
		}

		const ret = result;

		return ret;
	};

	imports.wbg.__wbg_instanceof_Uint8Array_17156bcf118086a9 = function (arg0) {
		let result;

		try {
			result = getObject(arg0) instanceof Uint8Array;
		} catch (_) {
			result = false;
		}

		const ret = result;

		return ret;
	};

	imports.wbg.__wbg_isSafeInteger_343e2beeeece1bb0 = function (arg0) {
		const ret = Number.isSafeInteger(getObject(arg0));

		return ret;
	};

	imports.wbg.__wbg_length_3b4f022188ae8db6 = function (arg0) {
		const ret = getObject(arg0).length;

		return ret;
	};

	imports.wbg.__wbg_length_a446193dc22c12f8 = function (arg0) {
		const ret = getObject(arg0).length;

		return ret;
	};

	imports.wbg.__wbg_new_405e22f390576ce2 = function () {
		const ret = new Object();

		return addHeapObject(ret);
	};

	imports.wbg.__wbg_new_780abee5c1739fd7 = function (arg0) {
		const ret = new Float32Array(getObject(arg0));

		return addHeapObject(ret);
	};

	imports.wbg.__wbg_new_8a6f238a6ece86ea = function () {
		const ret = new Error();

		return addHeapObject(ret);
	};

	imports.wbg.__wbg_new_a12002a7f91c75be = function (arg0) {
		const ret = new Uint8Array(getObject(arg0));

		return addHeapObject(ret);
	};

	imports.wbg.__wbg_new_e3b321dcfef89fc7 = function (arg0) {
		const ret = new Uint32Array(getObject(arg0));

		return addHeapObject(ret);
	};

	imports.wbg.__wbg_newwithbyteoffsetandlength_e6b7e69acd4c7354 = function (
		arg0,

		arg1,

		arg2,
	) {
		const ret = new Float32Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);

		return addHeapObject(ret);
	};

	imports.wbg.__wbg_newwithbyteoffsetandlength_f1dead44d1fc7212 = function (
		arg0,

		arg1,

		arg2,
	) {
		const ret = new Uint32Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);

		return addHeapObject(ret);
	};

	imports.wbg.__wbg_set_10bad9bee0e9c58b = function (arg0, arg1, arg2) {
		getObject(arg0).set(getObject(arg1), arg2 >>> 0);
	};

	imports.wbg.__wbg_set_3f1d0b984ed272ed = function (arg0, arg1, arg2) {
		getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
	};

	imports.wbg.__wbg_set_65595bdd868b3009 = function (arg0, arg1, arg2) {
		getObject(arg0).set(getObject(arg1), arg2 >>> 0);
	};

	imports.wbg.__wbg_stack_0ed75d68575b0f3c = function (arg0, arg1) {
		const ret = getObject(arg1).stack;

		const ptr1 = passStringToWasm0(
			ret,

			wasm.__wbindgen_export_1,

			wasm.__wbindgen_export_2,
		);

		const len1 = WASM_VECTOR_LEN;

		getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);

		getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
	};

	imports.wbg.__wbindgen_as_number = function (arg0) {
		const ret = +getObject(arg0);

		return ret;
	};

	imports.wbg.__wbindgen_bigint_from_u64 = function (arg0) {
		const ret = BigInt.asUintN(64, arg0);

		return addHeapObject(ret);
	};

	imports.wbg.__wbindgen_bigint_get_as_i64 = function (arg0, arg1) {
		const v = getObject(arg1);

		const ret = typeof v === "bigint" ? v : undefined;

		getDataViewMemory0().setBigInt64(
			arg0 + 8 * 1,

			isLikeNone(ret) ? BigInt(0) : ret,

			true,
		);

		getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
	};

	imports.wbg.__wbindgen_boolean_get = function (arg0) {
		const v = getObject(arg0);

		const ret = typeof v === "boolean" ? (v ? 1 : 0) : 2;

		return ret;
	};

	imports.wbg.__wbindgen_debug_string = function (arg0, arg1) {
		const ret = debugString(getObject(arg1));

		const ptr1 = passStringToWasm0(
			ret,

			wasm.__wbindgen_export_1,

			wasm.__wbindgen_export_2,
		);

		const len1 = WASM_VECTOR_LEN;

		getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);

		getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
	};

	imports.wbg.__wbindgen_error_new = function (arg0, arg1) {
		const ret = new Error(getStringFromWasm0(arg0, arg1));

		return addHeapObject(ret);
	};

	imports.wbg.__wbindgen_in = function (arg0, arg1) {
		const ret = getObject(arg0) in getObject(arg1);

		return ret;
	};

	imports.wbg.__wbindgen_is_bigint = function (arg0) {
		const ret = typeof getObject(arg0) === "bigint";

		return ret;
	};

	imports.wbg.__wbindgen_is_object = function (arg0) {
		const val = getObject(arg0);

		const ret = typeof val === "object" && val !== null;

		return ret;
	};

	imports.wbg.__wbindgen_is_undefined = function (arg0) {
		const ret = getObject(arg0) === undefined;

		return ret;
	};

	imports.wbg.__wbindgen_jsval_eq = function (arg0, arg1) {
		const ret = getObject(arg0) === getObject(arg1);

		return ret;
	};

	imports.wbg.__wbindgen_jsval_loose_eq = function (arg0, arg1) {
		const ret = getObject(arg0) == getObject(arg1);

		return ret;
	};

	imports.wbg.__wbindgen_memory = function () {
		const ret = wasm.memory;

		return addHeapObject(ret);
	};

	imports.wbg.__wbindgen_number_get = function (arg0, arg1) {
		const obj = getObject(arg1);

		const ret = typeof obj === "number" ? obj : undefined;

		getDataViewMemory0().setFloat64(
			arg0 + 8 * 1,

			isLikeNone(ret) ? 0 : ret,

			true,
		);

		getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
	};

	imports.wbg.__wbindgen_number_new = function (arg0) {
		const ret = arg0;

		return addHeapObject(ret);
	};

	imports.wbg.__wbindgen_object_clone_ref = function (arg0) {
		const ret = getObject(arg0);

		return addHeapObject(ret);
	};

	imports.wbg.__wbindgen_object_drop_ref = function (arg0) {
		takeObject(arg0);
	};

	imports.wbg.__wbindgen_string_get = function (arg0, arg1) {
		const obj = getObject(arg1);

		const ret = typeof obj === "string" ? obj : undefined;

		var ptr1 = isLikeNone(ret)
			? 0
			: passStringToWasm0(
					ret,

					wasm.__wbindgen_export_1,

					wasm.__wbindgen_export_2,
				);

		var len1 = WASM_VECTOR_LEN;

		getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);

		getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
	};

	imports.wbg.__wbindgen_string_new = function (arg0, arg1) {
		const ret = getStringFromWasm0(arg0, arg1);

		return addHeapObject(ret);
	};

	imports.wbg.__wbindgen_throw = function (arg0, arg1) {
		throw new Error(getStringFromWasm0(arg0, arg1));
	};

	return imports;
}

function __wbg_init_memory(imports, memory) {}

function __wbg_finalize_init(instance, module) {
	wasm = instance.exports;

	__wbg_init.__wbindgen_wasm_module = module;

	cachedDataViewMemory0 = null;

	cachedFloat32ArrayMemory0 = null;

	cachedUint32ArrayMemory0 = null;

	cachedUint8ArrayMemory0 = null;

	wasm.__wbindgen_start();

	return wasm;
}

function initSync(module) {
	if (wasm !== undefined) return wasm;

	if (typeof module !== "undefined") {
		if (Object.getPrototypeOf(module) === Object.prototype) {
			({ module } = module);
		} else {
			console.warn(
				"using deprecated parameters for `initSync()`; pass a single object instead",
			);
		}
	}

	const imports = __wbg_get_imports();

	__wbg_init_memory(imports);

	if (!(module instanceof WebAssembly.Module)) {
		module = new WebAssembly.Module(module);
	}

	const instance = new WebAssembly.Instance(module, imports);

	return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
	if (wasm !== undefined) return wasm;

	if (typeof module_or_path !== "undefined") {
		if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
			({ module_or_path } = module_or_path);
		} else {
			console.warn(
				"using deprecated parameters for the initialization function; pass a single object instead",
			);
		}
	}

	if (typeof module_or_path === "undefined") {
		module_or_path = new URL("ArtRock_bg.wasm", import.meta.url);
	}

	const imports = __wbg_get_imports();

	if (
		typeof module_or_path === "string" ||
		(typeof Request === "function" && module_or_path instanceof Request) ||
		(typeof URL === "function" && module_or_path instanceof URL)
	) {
		module_or_path = fetch(module_or_path);
	}

	__wbg_init_memory(imports);

	const { instance, module } = await __wbg_load(
		await module_or_path,

		imports,
	);

	return __wbg_finalize_init(instance, module);
}

export { initSync };

export default __wbg_init;
