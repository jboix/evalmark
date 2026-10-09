#!/usr/bin/env node
import { copyFile, cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, stat, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { deflateSync, gunzipSync, gzipSync, inflateRawSync, zstdDecompressSync } from "node:zlib";
import { createReadStream, existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createServer } from "node:http";
import { pipeline } from "node:stream";
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
	const numericValues = Object.values(entries).filter((v) => typeof v === "number");
	return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function joinValues(array, separator = "|") {
	return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
	if (typeof value === "bigint") return value.toString();
	return value;
}
var Cached = class {
	constructor(getter) {
		this._getter = getter;
		this._value = void 0;
	}
	get value() {
		const getter = this._getter;
		if (getter !== void 0) {
			this._value = getter();
			this._getter = void 0;
		}
		return this._value;
	}
};
function cached(getter) {
	return new Cached(getter);
}
function nullish(input) {
	return input === null || input === void 0;
}
function cleanRegex(source) {
	const start = source.startsWith("^") ? 1 : 0;
	const end = source.endsWith("$") ? source.length - 1 : source.length;
	return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
	const ratio = val / step;
	const roundedRatio = Math.round(ratio);
	const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
	if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
	return ratio - roundedRatio;
}
function assignProp(target, prop, value) {
	Object.defineProperty(target, prop, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
/**
* Whichever object a def's `shape` currently answers from: the one the caller passed until the first read, the frozen copy after it.
*
* Its keys and descriptors read without invoking anything, which is what lets a discriminated union check its discriminator, and the cycle walk read a shape, without resolving a getter that references the schema being constructed. A def that answers `shape` from an accessor of its own has none.
*/
function rawShape(def) {
	const desc = Object.getOwnPropertyDescriptor(def, "shape");
	return desc?.get ? desc.get.raw : desc?.value;
}
function sourceShape(schema) {
	return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
function deferProp(target, key, getter) {
	Object.defineProperty(target, key, {
		get() {
			const value = getter();
			assignProp(this, key, value);
			return value;
		},
		enumerable: true,
		configurable: true
	});
}
function putProp(target, key, value) {
	if (key in target) assignProp(target, key, value);
	else target[key] = value;
}
/**
* Copies `keys` of `source`'s shape onto `target`, each value passed through `wrap`.
*
* A key the source has resolved is copied through now, so the derived shape states it outright and nothing has to resolve it to learn what it holds. A key the source still defers stays deferred, and reads back through the source's own `shape`, so it resolves once and both shapes get that one schema.
*/
function mirrorShape(target, source, keys, wrap) {
	const raw = sourceShape(source);
	for (const key of keys) {
		const desc = Object.getOwnPropertyDescriptor(raw, key);
		if (!desc.enumerable) continue;
		if (desc.get) deferProp(target, key, () => {
			const value = source._zod.def.shape[key];
			return wrap ? wrap(value, key) : value;
		});
		else putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
	}
}
function mirrorProps(target, source) {
	for (const key of Reflect.ownKeys(source)) {
		const desc = Object.getOwnPropertyDescriptor(source, key);
		if (!desc.enumerable) continue;
		if (desc.get) deferProp(target, key, () => source[key]);
		else putProp(target, key, desc.value);
	}
}
function mergeDefs(...defs) {
	const mergedDescriptors = {};
	for (const def of defs) {
		const descriptors = Object.getOwnPropertyDescriptors(def);
		Object.assign(mergedDescriptors, descriptors);
	}
	return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
	return JSON.stringify(str);
}
function slugify(input) {
	return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
const allowsEval = /* @__PURE__*/ cached(() => {
	if (globalConfig.jitless) return false;
	if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
	try {
		new Function("");
		return true;
	} catch (_) {
		return false;
	}
});
function isPlainObject(o) {
	if (isObject(o) === false) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return true;
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;
	if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
	return true;
}
function shallowClone(o) {
	if (isPlainObject(o)) return { ...o };
	if (Array.isArray(o)) return [...o];
	if (o instanceof Map) return new Map(o);
	if (o instanceof Set) return new Set(o);
	return o;
}
const propertyKeyTypes = /* @__PURE__*/ new Set([
	"string",
	"number",
	"symbol"
]);
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
	const cl = new inst._zod.constr(def ?? inst._zod.def);
	if (!def || params?.parent) cl._zod.parent = inst;
	return cl;
}
function normalizeParams(_params) {
	const params = _params;
	if (!params) return {};
	if (typeof params === "string") return { error: () => params };
	if (params?.message !== void 0) {
		if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
		params.error = params.message;
	}
	delete params.message;
	if (typeof params.error === "string") return {
		...params,
		error: () => params.error
	};
	return params;
}
function stringifyPrimitive(value) {
	if (typeof value === "bigint") return value.toString() + "n";
	if (typeof value === "string") return `"${value}"`;
	return `${value}`;
}
function optionalKeys(shape) {
	return Object.keys(shape).filter((k) => {
		return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
	});
}
const NUMBER_FORMAT_RANGES = /*@__PURE__*/ (() => ({
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
const BIGINT_FORMAT_RANGES = {
	int64: [/* @__PURE__*/ BigInt("-9223372036854775808"), /* @__PURE__*/ BigInt("9223372036854775807")],
	uint64: [/* @__PURE__*/ BigInt(0), /* @__PURE__*/ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
	const newShape = {};
	mirrorShape(newShape, schema, maskedKeys(schema, mask));
	return clone(schema, mergeDefs(currDef, {
		shape: newShape,
		checks: []
	}));
}
function maskedKeys(schema, mask) {
	const raw = sourceShape(schema);
	const keys = [];
	for (const key of Reflect.ownKeys(mask)) {
		if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) throw new Error(`Unrecognized key: "${String(key)}"`);
		if (mask[key]) keys.push(key);
	}
	return keys;
}
function omit(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
	const omitted = new Set(maskedKeys(schema, mask));
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
	return clone(schema, mergeDefs(currDef, {
		shape: newShape,
		checks: []
	}));
}
function extend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) {
		const existingShape = sourceShape(schema);
		for (const key of Reflect.ownKeys(shape)) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function extended(schema, shape) {
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
	mirrorProps(newShape, shape);
	return newShape;
}
function safeExtend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
	return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function merge(a, b) {
	if (!b?._zod?.def) throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
	if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
	const newShape = {};
	mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
	mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
	return clone(a, mergeDefs(a._zod.def, {
		shape: newShape,
		get catchall() {
			return b._zod.def.catchall;
		},
		checks: b._zod.def.checks ?? []
	}));
}
function partial(Class, schema, mask, name = "partial") {
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
	const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class && ((value, key) => selected && !selected.has(key) ? value : new Class({
		type: "optional",
		innerType: value
	})));
	return clone(schema, mergeDefs(schema._zod.def, {
		shape: newShape,
		checks: []
	}));
}
function required(Class, schema, mask) {
	const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => selected && !selected.has(key) ? value : new Class({
		type: "nonoptional",
		innerType: value
	}));
	return clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
}
function aborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
	return false;
}
function explicitlyAborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
	return false;
}
function prefixIssues(path, issues) {
	return issues.map((iss) => {
		var _a;
		(_a = iss).path ?? (_a.path = []);
		iss.path.unshift(path);
		return iss;
	});
}
function unwrapMessage(message) {
	return typeof message === "string" ? message : message?.message;
}
function attachSchema(issues, start, inst) {
	var _a;
	for (let i = start; i < issues.length; i++) (_a = issues[i]).schema ?? (_a.schema = inst);
}
function finalizeIssue(iss, ctx, config) {
	var _a;
	const traits = iss.inst?._zod?.traits;
	if (traits?.has("$ZodType")) {
		if (traits.has("$ZodCheck")) (_a = iss).schema ?? (_a.schema = iss.inst);
		else iss.schema = iss.inst;
	}
	const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
	const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
	const full = {};
	for (const k of Object.keys(iss)) {
		if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__") continue;
		full[k] = iss[k];
	}
	full.path ?? (full.path = []);
	full.message = message;
	if (ctx?.reportInput) full.input = iss.input;
	return full;
}
const highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
	const units = str.length;
	if (!highSurrogate.test(str)) return units;
	let count = units;
	for (let i = 0; i < units - 1; i++) if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
		count--;
		i++;
	}
	return count;
}
function getLengthableOrigin(input) {
	if (Array.isArray(input)) return "array";
	if (typeof input === "string") return "string";
	return "unknown";
}
function parsedType(data) {
	const t = typeof data;
	switch (t) {
		case "number": return Number.isNaN(data) ? "nan" : "number";
		case "object": {
			if (data === null) return "null";
			if (Array.isArray(data)) return "array";
			const obj = data;
			if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) return obj.constructor.name;
		}
	}
	return t;
}
function issue(...args) {
	const [iss, input, inst] = args;
	if (typeof iss === "string") return {
		message: iss,
		code: "custom",
		input,
		inst
	};
	return { ...iss };
}
/**
* Installs a trait's members on its prototype. Each value builds that member for the instance on first read; the built value shadows the accessor as an own property, so a detached `const { parse } = schema` keeps working.
*
* Call this from a `proto` initializer, which runs once per prototype — never per instance.
*/
function members(proto, table) {
	for (const key in table) {
		const desc = Object.getOwnPropertyDescriptor(table, key);
		if (desc.get) Object.defineProperty(proto, key, {
			...desc,
			enumerable: false
		});
		else defineBound(proto, key, desc.value);
	}
}
/** Shadows a prototype member with an own value, so a getter that builds from the instance runs once. */
function own(inst, key, value, enumerable = true) {
	Object.defineProperty(inst, key, {
		configurable: true,
		writable: true,
		enumerable,
		value
	});
	return value;
}
/** Like {@link own}, for a member that was never an own data property and has to stay out of `Object.keys`. */
function hide(inst, key, value) {
	return own(inst, key, value, false);
}
/** Adds members a table derives from the instance: each builds on first read and shadows as own data, and assignment shadows the same way, as when these were own properties. */
function derived(computes, table) {
	for (const key in computes) {
		const compute = computes[key];
		Object.defineProperty(table, key, {
			configurable: true,
			enumerable: true,
			get() {
				return own(this, key, compute(this));
			},
			set(value) {
				own(this, key, value);
			}
		});
	}
	return table;
}
function defineBound(proto, key, fn) {
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			return this == null ? fn : own(this, key, fn.bind(this));
		},
		set(value) {
			own(this, key, value);
		}
	});
}
/** Returns the prototype to install on, or `undefined` if this group is already installed on it. */
function claim(inst, sentinel) {
	const proto = Object.getPrototypeOf(inst);
	return sentinel in proto ? void 0 : proto;
}
let installing;
let broke = false;
const breaker = {
	configurable: true,
	get() {
		broke = true;
	}
};
/**
* Installs a lazily-derived internal on the `_zod` prototype of `inst`'s
* constructor, computed from the internals object itself and cached there on
* first read. One accessor per constructor rather than one per instance.
*/
function defineLazyInternal(inst, key, compute) {
	const proto = Object.getPrototypeOf(inst._zod);
	if (key in proto && installing !== inst._zod) {
		installing = void 0;
		return;
	}
	installing = inst._zod;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			Object.defineProperty(this, key, breaker);
			const outer = broke;
			broke = false;
			try {
				const value = compute(this);
				if (broke) delete this[key];
				else Object.defineProperty(this, key, {
					configurable: true,
					writable: true,
					value
				});
				broke = broke || outer;
				return value;
			} catch (err) {
				delete this[key];
				broke = broke || outer;
				throw err;
			}
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				value
			});
		}
	});
}
/**
* Installs `key` on `inst`'s prototype, computed by `make` on first read and cached there as an own
* data property. One accessor per constructor rather than one per instance, because an own accessor
* puts every instance after the first into v8 dictionary mode. The key doubles as the sentinel.
*/
function installLazyProp(inst, key, make, enumerable) {
	const proto = claim(inst, key);
	if (!proto) return;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			const desc = {
				configurable: true,
				writable: true,
				enumerable,
				value: void 0
			};
			Object.defineProperty(this, key, desc);
			desc.value = make(this);
			Object.defineProperty(this, key, desc);
			return desc.value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				enumerable,
				value
			});
		}
	});
}
/** Marks the thunk `_catch` synthesises for a constant catch value. `Function.length` cannot tell that thunk from a user callback — rest and defaulted parameters both report arity 0 — and a user callback reads `ctx.error`, whose issues only finalize correctly against the caller's per-parse error map. Provenance can say what arity cannot. A plain string key rather than `Symbol.for`, whose call at module scope no bundler can prove pure — the same shape that anchored `urlCanParse` into every build. */
const CONSTANT_CATCH = "~constantCatch";
/** Wraps a constant catch value in a thunk tagged with {@link CONSTANT_CATCH}. */
function constantCatch(value) {
	const fn = () => value;
	fn[CONSTANT_CATCH] = true;
	return fn;
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/core.js
var _a$1;
const _zodDesc = {
	value: void 0,
	enumerable: false
};
let _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
	const E = _E;
	if (E) {
		const saved = E.stackTraceLimit;
		if (typeof saved === "number") {
			try {
				E.stackTraceLimit = 0;
			} catch {
				_E = null;
				return new Definition();
			}
			try {
				return new Definition();
			} finally {
				E.stackTraceLimit = saved;
			}
		}
	}
	return new Definition();
}
function $constructor(name, initializer, proto, params) {
	const zodProto = {};
	function Internals(def) {
		this.def = def;
		this.constr = _;
		this.traits = /* @__PURE__ */ new Set();
	}
	Internals.prototype = zodProto;
	const protoMembers = proto;
	const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
	function init(inst, def) {
		if (!inst._zod) {
			_zodDesc.value = new Internals(def);
			try {
				Object.defineProperty(inst, "_zod", _zodDesc);
			} finally {
				_zodDesc.value = void 0;
			}
		} else if (inst._zod.traits.has(name)) return;
		inst._zod.traits.add(name);
		initializer(inst, def);
		if (initialized) {
			const own = Object.getPrototypeOf(inst);
			const ctorProto = inst._zod.constr.prototype;
			let up = own;
			while (up && up !== ctorProto) up = Object.getPrototypeOf(up);
			const target = up ?? own;
			if (!initialized.has(target)) {
				initialized.add(target);
				members(target, protoMembers);
			}
		}
		const proto = _.prototype;
		for (const k in proto) {
			if (!Object.prototype.hasOwnProperty.call(proto, k)) continue;
			if (!(k in inst)) inst[k] = proto[k].bind(inst);
		}
	}
	const Parent = params?.Parent ?? Object;
	class Definition extends Parent {}
	Object.defineProperty(Definition, "name", { value: name });
	function _(def) {
		const inst = params?.Parent ? newError(Definition) : this;
		init(inst, def);
		const deferred = inst._zod.deferred;
		if (deferred) {
			for (const fn of deferred) fn();
			inst._zod.deferred = void 0;
		}
		const pp = globalThis.__zod_globalConfig?.postProcessor;
		if (pp) pp(inst);
		return inst;
	}
	Object.defineProperty(_, "init", { value: init });
	Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
		if (params?.Parent && inst instanceof params.Parent) return true;
		return inst?._zod?.traits?.has(name);
	} });
	Object.defineProperty(_, "name", { value: name });
	return _;
}
var $ZodAsyncError = class extends Error {
	constructor() {
		super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
	}
};
var $ZodEncodeError = class extends Error {
	constructor(name) {
		super(`Encountered unidirectional transform during encode: ${name}`);
		this.name = "ZodEncodeError";
	}
};
(_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
const globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
	if (newConfig) Object.assign(globalConfig, newConfig);
	return globalConfig;
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/errors.js
function _getMessage() {
	const internals = this._zod;
	internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
	return internals.message;
}
function _setMessage(value) {
	this._zod.message = value;
}
const _messageDesc = {
	get: _getMessage,
	set: _setMessage,
	enumerable: true,
	configurable: true
};
const _issuesDesc = {
	value: void 0,
	enumerable: false
};
const _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
const initializer$1 = (inst, def) => {
	inst.name = "$ZodError";
	_issuesDesc.value = def;
	Object.defineProperty(inst, "issues", _issuesDesc);
	_issuesDesc.value = void 0;
	Object.defineProperty(inst, "message", _messageDesc);
	const proto = Object.getPrototypeOf(inst);
	if (!_installedToString.has(proto)) {
		_installedToString.add(proto);
		Object.defineProperty(proto, "toString", {
			configurable: true,
			enumerable: false,
			get() {
				const value = () => this.message;
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
				return value;
			},
			set(value) {
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
			}
		});
	}
};
const $ZodError = $constructor("$ZodError", initializer$1);
$constructor("$ZodError", initializer$1, void 0, { Parent: Error });
/** Get-or-create `obj[key]` as an own data property. A path segment naming an inherited member
* ("toString", "constructor") would otherwise read through to the prototype, and assigning
* "__proto__" would hit the setter instead of creating a key. */
function node(obj, key, make) {
	if (!Object.prototype.hasOwnProperty.call(obj, key)) {
		if (key === "__proto__") Object.defineProperty(obj, key, {
			value: make(),
			writable: true,
			enumerable: true,
			configurable: true
		});
		else obj[key] = make();
	}
	return obj[key];
}
function flattenError(error, mapper = (issue) => issue.message) {
	const fieldErrors = {};
	const formErrors = [];
	for (const sub of error.issues) if (sub.path.length > 0) node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
	else formErrors.push(mapper(sub));
	return {
		formErrors,
		fieldErrors
	};
}
function formatError(error, mapper = (issue) => issue.message) {
	const fieldErrors = { _errors: [] };
	const processError = (error, path = []) => {
		for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
		else if (issue.code === "invalid_key") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else if (issue.code === "invalid_element") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else {
			const fullpath = [...path, ...issue.path];
			if (fullpath.length === 0) fieldErrors._errors.push(mapper(issue));
			else {
				let curr = fieldErrors;
				let i = 0;
				while (i < fullpath.length) {
					const el = fullpath[i];
					const terminal = i === fullpath.length - 1;
					if (el === "_errors") {
						if (terminal) curr._errors.push(mapper(issue));
						i++;
						continue;
					}
					if (!Object.prototype.hasOwnProperty.call(curr, el)) Object.defineProperty(curr, el, {
						value: { _errors: [] },
						enumerable: true,
						writable: true,
						configurable: true
					});
					const node = curr[el];
					if (terminal) node._errors.push(mapper(issue));
					curr = node;
					i++;
				}
			}
		}
	};
	processError(error);
	return fieldErrors;
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/parse.js
function finalizeParams(callee, params) {
	return {
		callee: params?.callee ?? callee,
		Err: params?.Err
	};
}
const _parse = (_Err) => {
	const fn = (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: false
		} : { async: false };
		const result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) throw new $ZodAsyncError();
		if (result.issues.length) {
			const e = new ((_params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, _params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
const _parseAsync = (_Err) => {
	const fn = async (schema, value, _ctx, params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: true
		} : { async: true };
		let result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) result = await result;
		if (result.issues.length) {
			const e = new ((params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
const _safeParse = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length ? failure(_Err, result.issues, ctx) : {
		success: true,
		data: result.value
	};
};
function failure(Err, issues, ctx) {
	let error;
	return {
		success: false,
		get error() {
			if (!error) {
				error = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
				issues = void 0;
				ctx = void 0;
			}
			return error;
		},
		set error(e) {
			error = e;
			issues = void 0;
			ctx = void 0;
		}
	};
}
const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true
	} : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length ? failure(_Err, result.issues, ctx) : {
		success: true,
		data: result.value
	};
};
const COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
const COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
const validate = ((schema, value, _ctx) => {
	const validator = schema._zod.bag.validator;
	if (validator !== void 0) {
		if (validator(value) !== COMPILE_INVALID) return true;
		if (validator.definite === true && _ctx === void 0) return false;
	}
	return validateFallback(schema, value, _ctx);
});
function validateFallback(schema, value, _ctx) {
	const ctx = _ctx ? {
		..._ctx,
		async: false,
		abortEarly: true
	} : {
		async: false,
		abortEarly: true
	};
	const fallbackRun = schema._zod.bag.fallbackRun;
	let result;
	if (fallbackRun) {
		ctx[COMPILE_FALLBACK] = true;
		result = fallbackRun({
			value,
			issues: []
		}, ctx);
	} else result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length === 0;
}
const validateAsync$1 = async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true,
		abortEarly: true
	} : {
		async: true,
		abortEarly: true
	};
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length === 0;
};
const _encode = (_Err) => {
	const parse = _parse(_Err);
	const fn = (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			direction: "backward"
		} : { direction: "backward" };
		return parse(schema, value, ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _decode = (_Err) => {
	const parse = _parse(_Err);
	const fn = (schema, value, _ctx, _params) => {
		return parse(schema, value, _ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _encodeAsync = (_Err) => {
	const parseAsync = _parseAsync(_Err);
	const fn = async (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			direction: "backward"
		} : { direction: "backward" };
		return await parseAsync(schema, value, ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _decodeAsync = (_Err) => {
	const parseAsync = _parseAsync(_Err);
	const fn = async (schema, value, _ctx, _params) => {
		return await parseAsync(schema, value, _ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _safeEncode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParse(_Err)(schema, value, ctx);
};
const _safeDecode = (_Err) => (schema, value, _ctx) => {
	return _safeParse(_Err)(schema, value, _ctx);
};
const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParseAsync(_Err)(schema, value, ctx);
};
const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _safeParseAsync(_Err)(schema, value, _ctx);
};
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/regexes.js
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link cuid2} instead.
* See https://github.com/paralleldrive/cuid.
*/
const cuid = /^[cC][0-9a-z]{6,}$/;
const cuid2 = /^[0-9a-z]+$/;
const ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
const xid = /^[0-9a-vA-V]{20}$/;
const ksuid = /^[A-Za-z0-9]{27}$/;
const nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
	return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
const duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
/** Returns a regex for validating an RFC 9562/4122 UUID.
*
* @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
const uuid = (version) => {
	if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
	return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
/** Practical email validation */
const email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
const _emoji$1 = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
	return new RegExp(_emoji$1, "u");
}
const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
const httpProtocol = /^https?$/;
const e164 = /^\+[1-9]\d{6,14}$/;
const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
/** Anchors a pattern source. The interpolation lives here rather than at the call site because
* esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
* will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */
function anchor(source) {
	return new RegExp(`^${source}$`);
}
const date = /*@__PURE__*/ anchor(dateSource);
function timeSource(args) {
	const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
	return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function time(args) {
	return new RegExp(`^${timeSource(args)}$`);
}
function datetime$1(args) {
	const opts = ["Z"];
	if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
	const qualified = `${timeSource({
		precision: args.precision,
		seconds: true
	})}(?:${opts.join("|")})`;
	const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
	return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
const anyString = /^[\s\S]{0,}$/;
const integer = /^-?\d+$/;
const number$1 = /^-?\d+(?:\.\d+)?$/;
const boolean$1 = /^(?:true|false)$/i;
const lowercase = /^[^A-Z]*$/;
const uppercase = /^[^a-z]*$/;
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/checks.js
const $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def) => {
	var _a;
	inst._zod ?? (inst._zod = {});
	inst._zod.def = def;
	(_a = inst._zod).onattach ?? (_a.onattach = []);
});
/** Default `when` for length-based checks: run only on non-nullish values with a `length`. */
const _whenHasLength = (payload) => {
	const val = payload.value;
	return !nullish(val) && val.length !== void 0;
};
const numericOriginMap = {
	number: "number",
	bigint: "bigint",
	object: "date"
};
const $ZodCheckLessThan = /*@__PURE__*/ $constructor("$ZodCheckLessThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_big",
			maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckGreaterThan = /*@__PURE__*/ $constructor("$ZodCheckGreaterThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_small",
			minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMultipleOf = /*@__PURE__*/ $constructor("$ZodCheckMultipleOf", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
		if (typeof payload.value === "bigint" ? def.value !== BigInt(0) && payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) return;
		payload.issues.push({
			origin: typeof payload.value,
			code: "not_multiple_of",
			divisor: def.value,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckNumberFormat = /*@__PURE__*/ $constructor("$ZodCheckNumberFormat", (inst, def) => {
	$ZodCheck.init(inst, def);
	def.format = def.format || "float64";
	const isInt = def.format?.includes("int");
	const origin = isInt ? "int" : "number";
	const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (isInt) {
			if (!Number.isInteger(input)) {
				payload.issues.push({
					expected: origin,
					format: def.format,
					code: "invalid_type",
					continue: false,
					input,
					inst
				});
				return;
			}
			if (!Number.isSafeInteger(input)) {
				if (input > 0) payload.issues.push({
					input,
					code: "too_big",
					maximum: Number.MAX_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				else payload.issues.push({
					input,
					code: "too_small",
					minimum: Number.MIN_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				return;
			}
		}
		if (input < minimum) payload.issues.push({
			origin: "number",
			input,
			code: "too_small",
			minimum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
		if (input > maximum) payload.issues.push({
			origin: "number",
			input,
			code: "too_big",
			maximum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units > def.maximum ? codePointLength(input) : units) <= def.maximum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: def.maximum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units) >= def.minimum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: def.minimum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		const length = typeof input === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
		if (length === def.length) return;
		const origin = getLengthableOrigin(input);
		const tooBig = length > def.length;
		payload.issues.push({
			origin,
			...tooBig ? {
				code: "too_big",
				maximum: def.length
			} : {
				code: "too_small",
				minimum: def.length
			},
			inclusive: true,
			exact: true,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStringFormat = /*@__PURE__*/ $constructor("$ZodCheckStringFormat", (inst, def) => {
	var _a, _b;
	$ZodCheck.init(inst, def);
	if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: def.format,
			input: payload.value,
			...def.pattern ? { pattern: def.pattern.toString() } : {},
			inst,
			continue: !def.abort
		});
	});
	else (_b = inst._zod).check ?? (_b.check = () => {});
});
const $ZodCheckRegex = /*@__PURE__*/ $constructor("$ZodCheckRegex", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: payload.value,
			pattern: def.pattern.toString(),
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLowerCase = /*@__PURE__*/ $constructor("$ZodCheckLowerCase", (inst, def) => {
	def.pattern ?? (def.pattern = lowercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = /*@__PURE__*/ $constructor("$ZodCheckUpperCase", (inst, def) => {
	def.pattern ?? (def.pattern = uppercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = /*@__PURE__*/ $constructor("$ZodCheckIncludes", (inst, def) => {
	$ZodCheck.init(inst, def);
	const escapedRegex = escapeRegex(def.includes);
	def.pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
	inst._zod.check = (payload) => {
		if (payload.value.includes(def.includes, def.position)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: def.includes,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStartsWith = /*@__PURE__*/ $constructor("$ZodCheckStartsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.check = (payload) => {
		if (payload.value.startsWith(def.prefix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: def.prefix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckEndsWith = /*@__PURE__*/ $constructor("$ZodCheckEndsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.check = (payload) => {
		if (payload.value.endsWith(def.suffix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: def.suffix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		payload.value = def.tx(payload.value);
	};
});
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/doc.js
var Doc = class {
	constructor(args = [], closed = {}) {
		this.content = [];
		this.indent = 0;
		this.args = args;
		this.closed = closed;
	}
	indented(fn) {
		this.indent += 1;
		try {
			fn(this);
		} finally {
			this.indent -= 1;
		}
	}
	write(arg) {
		if (typeof arg === "function") {
			arg(this, { execution: "sync" });
			arg(this, { execution: "async" });
			return;
		}
		const lines = arg.split("\n").filter((x) => x);
		const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
		const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
		for (const line of dedented) this.content.push(line);
	}
	compile() {
		const F = Function;
		const content = this?.content ?? [``];
		return new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {\n${content.join("\n")}\n};`)(...Object.values(this.closed));
	}
};
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/versions.js
const version = {
	major: 4,
	minor: 6,
	patch: 5
};
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/schemas.js
const $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def) => {
	var _a;
	inst ?? (inst = {});
	inst._zod.def = def;
	inst._zod.bag = inst._zod.bag || {};
	inst._zod.version = version;
	const defChecks = inst._zod.def.checks;
	const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
	for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
	if (checks.length === 0) {
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred?.push(() => {
			inst._zod.run = inst._zod.parse;
		});
	} else {
		const runChecks = (payload, checks, ctx) => {
			if (payload.memo) return payload;
			let isAborted = aborted(payload);
			let asyncResult;
			for (const ch of checks) {
				if (ch._zod.def.when) {
					if (explicitlyAborted(payload)) continue;
					if (!ch._zod.def.when(payload)) continue;
				} else if (isAborted) continue;
				const currLen = payload.issues.length;
				const _ = ch._zod.check(payload);
				if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
				if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
					await _;
					if (payload.issues.length === currLen) return;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				});
				else {
					if (payload.issues.length === currLen) continue;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				}
			}
			if (asyncResult) return asyncResult.then(() => {
				return payload;
			});
			return payload;
		};
		const handleCanaryResult = (canary, payload, ctx) => {
			if (aborted(canary)) {
				canary.aborted = true;
				return canary;
			}
			const checkResult = runChecks(payload, checks, ctx);
			if (checkResult instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
			}
			return inst._zod.parse(checkResult, ctx);
		};
		inst._zod.run = (payload, ctx) => {
			if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
			if (ctx.direction === "backward") {
				const canary = inst._zod.parse({
					value: payload.value,
					issues: []
				}, {
					...ctx,
					skipChecks: true
				});
				if (canary instanceof Promise) return canary.then((canary) => {
					return handleCanaryResult(canary, payload, ctx);
				});
				return handleCanaryResult(canary, payload, ctx);
			}
			const result = inst._zod.parse(payload, ctx);
			if (result instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return result.then((result) => runChecks(result, checks, ctx));
			}
			return runChecks(result, checks, ctx);
		};
	}
}, {
	get "~standard"() {
		return hide(this, "~standard", standardProps(this));
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	}
});
/** The Standard Schema surface for `inst`. Shared so wrappers can extend it without forcing it. */
const toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync(inst, value) {
	const ctx = { async: true };
	return toStandardResult(await inst._zod.run({
		value,
		issues: []
	}, ctx), ctx);
}
function standardProps(inst) {
	return {
		validate: (value) => {
			const ctx = { async: false };
			try {
				const r = inst._zod.run({
					value,
					issues: []
				}, ctx);
				if (!(r instanceof Promise)) return toStandardResult(r, ctx);
			} catch (_) {}
			return validateAsync(inst, value);
		},
		vendor: "zod",
		version: 1
	};
}
const $ZodString = /*@__PURE__*/ $constructor("$ZodString", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = def.pattern ?? anyString;
	inst._zod.parse = (payload, _) => {
		if (def.coerce) try {
			payload.value = String(payload.value);
		} catch (_) {}
		if (typeof payload.value === "string") return payload;
		payload.issues.push({
			expected: "string",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
const $ZodStringFormat = /*@__PURE__*/ $constructor("$ZodStringFormat", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	$ZodString.init(inst, def);
});
const $ZodGUID = /*@__PURE__*/ $constructor("$ZodGUID", (inst, def) => {
	def.pattern ?? (def.pattern = guid);
	$ZodStringFormat.init(inst, def);
});
const $ZodUUID = /*@__PURE__*/ $constructor("$ZodUUID", (inst, def) => {
	if (def.version) {
		const v = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[def.version];
		if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
		def.pattern ?? (def.pattern = uuid(v));
	} else def.pattern ?? (def.pattern = uuid());
	$ZodStringFormat.init(inst, def);
});
const $ZodEmail = /*@__PURE__*/ $constructor("$ZodEmail", (inst, def) => {
	def.pattern ?? (def.pattern = email);
	$ZodStringFormat.init(inst, def);
});
function canParseURL(input) {
	try {
		if (typeof URL !== "undefined" && typeof URL.canParse === "function") return URL.canParse(input);
		new URL(input);
		return true;
	} catch {
		return false;
	}
}
function validateURL(trimmed, def) {
	if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) return canParseURL(trimmed) || 2;
	return parseURLObject(trimmed, def);
}
/** Parses a URL while preserving the non-normalizing HTTP guard. */
function parseURLObject(trimmed, def) {
	if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) return 1;
	try {
		if (typeof URL !== "undefined") {
			const URLStatic = URL;
			if (typeof URLStatic.parse === "function") return URLStatic.parse(trimmed) ?? 2;
		}
		return new URL(trimmed);
	} catch {
		return 2;
	}
}
const asciiTabOrNewline = /[\t\n\r]/g;
/** The URL parser deletes every ASCII tab, LF and CR from its input before it parses, so `new URL("https://exa\nmple.com")` reports on `example.com`. Applying the same deletion to the returned value closes the half of that divergence which can move the host; the parser's other rewrite, stripping C0 controls at the edges, cannot. */
function stripTabAndNewline(value) {
	return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url, hostname) {
	hostname.lastIndex = 0;
	return hostname.test(url.hostname);
}
function urlProtocolOk(url, protocol) {
	protocol.lastIndex = 0;
	return protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
}
const $ZodURL = /*@__PURE__*/ $constructor("$ZodURL", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		try {
			const trimmed = payload.value.trim();
			const url = validateURL(trimmed, def);
			if (url === 1) {
				payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid URL format",
					input: payload.value,
					inst,
					continue: !def.abort
				});
				return;
			}
			if (url === 2) {
				payload.issues.push({
					code: "invalid_format",
					format: "url",
					input: payload.value,
					inst,
					continue: !def.abort
				});
				return;
			}
			if (url === true) {
				payload.value = stripTabAndNewline(trimmed);
				return;
			}
			if (def.hostname && !urlHostnameOk(url, def.hostname)) payload.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid hostname",
				pattern: def.hostname.source,
				input: payload.value,
				inst,
				continue: !def.abort
			});
			if (def.protocol && !urlProtocolOk(url, def.protocol)) payload.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid protocol",
				pattern: def.protocol.source,
				input: payload.value,
				inst,
				continue: !def.abort
			});
			payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);
			return;
		} catch (_) {
			payload.issues.push({
				code: "invalid_format",
				format: "url",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
const $ZodEmoji = /*@__PURE__*/ $constructor("$ZodEmoji", (inst, def) => {
	def.pattern ?? (def.pattern = emoji());
	$ZodStringFormat.init(inst, def);
});
const $ZodNanoID = /*@__PURE__*/ $constructor("$ZodNanoID", (inst, def) => {
	if (def.length !== void 0 && (!Number.isInteger(def.length) || def.length < 1)) throw new Error(`Invalid nanoid length: ${def.length}`);
	def.pattern ?? (def.pattern = def.length === void 0 ? nanoid : nanoidOfLength(def.length));
	$ZodStringFormat.init(inst, def);
});
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link $ZodCUID2} instead.
* See https://github.com/paralleldrive/cuid.
*/
const $ZodCUID = /*@__PURE__*/ $constructor("$ZodCUID", (inst, def) => {
	def.pattern ?? (def.pattern = cuid);
	$ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = /*@__PURE__*/ $constructor("$ZodCUID2", (inst, def) => {
	def.pattern ?? (def.pattern = cuid2);
	$ZodStringFormat.init(inst, def);
});
const $ZodULID = /*@__PURE__*/ $constructor("$ZodULID", (inst, def) => {
	def.pattern ?? (def.pattern = ulid);
	$ZodStringFormat.init(inst, def);
});
const $ZodXID = /*@__PURE__*/ $constructor("$ZodXID", (inst, def) => {
	def.pattern ?? (def.pattern = xid);
	$ZodStringFormat.init(inst, def);
});
const $ZodKSUID = /*@__PURE__*/ $constructor("$ZodKSUID", (inst, def) => {
	def.pattern ?? (def.pattern = ksuid);
	$ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = /*@__PURE__*/ $constructor("$ZodISODateTime", (inst, def) => {
	def.pattern ?? (def.pattern = datetime$1(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODate = /*@__PURE__*/ $constructor("$ZodISODate", (inst, def) => {
	def.pattern ?? (def.pattern = date);
	$ZodStringFormat.init(inst, def);
});
const $ZodISOTime = /*@__PURE__*/ $constructor("$ZodISOTime", (inst, def) => {
	def.pattern ?? (def.pattern = time(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODuration = /*@__PURE__*/ $constructor("$ZodISODuration", (inst, def) => {
	def.pattern ?? (def.pattern = duration);
	$ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = /*@__PURE__*/ $constructor("$ZodIPv4", (inst, def) => {
	def.pattern ?? (def.pattern = ipv4);
	$ZodStringFormat.init(inst, def);
});
/** An IPv6 address is written with hex digits, colons and dots, and nothing else. The guard is what makes the check below an IPv6 check: `new URL("http://[...]")` parses an authority, not an address, so `@` and `\` re-delimit it and `"::@1\\"` validates against the host `0.0.0.1`. The URL parser also deletes ASCII tab, LF and CR rather than failing, which is how `"::1\n"` validated as `::1`. */
const ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
	if (!ipv6Alphabet.test(value)) return false;
	return canParseURL(`http://[${value}]`);
}
const $ZodIPv6 = /*@__PURE__*/ $constructor("$ZodIPv6", (inst, def) => {
	def.pattern ?? (def.pattern = ipv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (!isValidIPv6(payload.value)) payload.issues.push({
			code: "invalid_format",
			format: "ipv6",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCIDRv4 = /*@__PURE__*/ $constructor("$ZodCIDRv4", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv4);
	$ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
	const parts = value.split("/");
	if (parts.length !== 2) return false;
	const [address, prefix] = parts;
	if (!prefix) return false;
	const prefixNum = Number(prefix);
	if (`${prefixNum}` !== prefix) return false;
	if (prefixNum < 0 || prefixNum > 128) return false;
	return isValidIPv6(address);
}
const $ZodCIDRv6 = /*@__PURE__*/ $constructor("$ZodCIDRv6", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (!isValidCIDRv6(payload.value)) payload.issues.push({
			code: "invalid_format",
			format: "cidrv6",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
function isValidBase64(data) {
	if (data === "") return true;
	if (/\s/.test(data)) return false;
	if (data.length % 4 !== 0) return false;
	try {
		atob(data);
		return true;
	} catch {
		return false;
	}
}
const base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
const $ZodBase64 = /*@__PURE__*/ $constructor("$ZodBase64", (inst, def) => {
	def.pattern ?? (def.pattern = base64Charset);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidBase64(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
	if (!base64urlCharset.test(data)) return false;
	const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
	return isValidBase64(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}
const $ZodBase64URL = /*@__PURE__*/ $constructor("$ZodBase64URL", (inst, def) => {
	def.pattern ?? (def.pattern = base64urlCharset);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidBase64URL(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodE164 = /*@__PURE__*/ $constructor("$ZodE164", (inst, def) => {
	def.pattern ?? (def.pattern = e164);
	$ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
	try {
		const tokensParts = token.split(".");
		if (tokensParts.length !== 3) return false;
		const [header] = tokensParts;
		if (!header) return false;
		const parsedHeader = JSON.parse(atob(header));
		if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
		if (!parsedHeader.alg) return false;
		if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
		return true;
	} catch {
		return false;
	}
}
const $ZodJWT = /*@__PURE__*/ $constructor("$ZodJWT", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidJWT(payload.value, def.alg)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodNumber = /*@__PURE__*/ $constructor("$ZodNumber", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = number$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Number(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
		const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
		payload.issues.push({
			expected: "number",
			code: "invalid_type",
			input,
			inst,
			...received ? { received } : {}
		});
		return payload;
	};
});
const $ZodNumberFormat = /*@__PURE__*/ $constructor("$ZodNumberFormat", (inst, def) => {
	$ZodCheckNumberFormat.init(inst, def);
	$ZodNumber.init(inst, def);
});
const $ZodBoolean = /*@__PURE__*/ $constructor("$ZodBoolean", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = boolean$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Boolean(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "boolean") return payload;
		payload.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
const $ZodUnknown = /*@__PURE__*/ $constructor("$ZodUnknown", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
const $ZodNever = /*@__PURE__*/ $constructor("$ZodNever", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		payload.issues.push({
			expected: "never",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
function handleArrayResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
const $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def) => {
	$ZodType.init(inst, def);
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				expected: "array",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
		const proms = [];
		const abortEarly = ctx?.abortEarly;
		for (let i = 0; i < input.length; i++) {
			const item = input[i];
			const result = def.element._zod.run({
				value: item,
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
			else {
				handleArrayResult(result, payload, i);
				if (abortEarly && result.issues.length !== 0 && aborted(result)) break;
			}
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
function handlePropertyResult(result, final, key, input, optin, optout) {
	const isPresent = key in input;
	const isOptionalOut = optout === "optional";
	if (!isPresent && isOptionalOut && optin === "optional") return;
	if (result.issues.length) {
		if (optin !== void 0 && isOptionalOut && !isPresent) return;
		final.issues.push(...prefixIssues(key, result.issues));
	}
	if (!isPresent && optin === void 0) {
		if (!result.issues.length) final.issues.push({
			code: "invalid_type",
			expected: "nonoptional",
			input: void 0,
			path: [key]
		});
		return;
	}
	if (result.value === void 0) {
		if (isPresent || optin === "defaulted" && !isOptionalOut) final.value[key] = void 0;
	} else final.value[key] = result.value;
}
const NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
	const keys = Object.keys(def.shape);
	const ownSymbols = Object.getOwnPropertySymbols(def.shape);
	const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
	const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
	for (const k of allKeys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
	const okeys = optionalKeys(def.shape);
	return {
		...def,
		allKeys,
		symbolKeys,
		keySet: new Set(keys),
		numKeys: keys.length,
		optionalKeys: new Set(okeys)
	};
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
	const unrecognized = [];
	const keySet = def.keySet;
	const _catchall = def.catchall._zod;
	const t = _catchall.def.type;
	const optin = _catchall.optin;
	const optout = _catchall.optout;
	let seen = 0;
	for (const key in input) {
		if (abortEarly && payload.issues.length !== seen) {
			if (aborted(payload, seen)) break;
			seen = payload.issues.length;
		}
		if (keySet.has(key)) continue;
		if (key === "__proto__") {
			if (t === "never") unrecognized.push(key);
			continue;
		}
		if (t === "never") {
			unrecognized.push(key);
			continue;
		}
		const r = _catchall.run({
			value: input[key],
			issues: []
		}, ctx);
		if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
		else handlePropertyResult(r, payload, key, input, optin, optout);
	}
	if (unrecognized.length) payload.issues.push({
		code: "unrecognized_keys",
		keys: unrecognized,
		input,
		inst,
		continue: true
	});
	if (!proms.length) return payload;
	return Promise.all(proms).then(() => {
		return payload;
	});
}
const $ZodObject = /*@__PURE__*/ $constructor("$ZodObject", (inst, def) => {
	$ZodType.init(inst, def);
	const desc = Object.getOwnPropertyDescriptor(def, "shape");
	const sh = desc?.get ? desc.get.raw : def.shape ?? {};
	if (sh) {
		const get = () => {
			const newSh = { ...sh };
			Object.defineProperty(def, "shape", { value: newSh });
			get.raw = newSh;
			return newSh;
		};
		get.raw = sh;
		Object.defineProperty(def, "shape", { get });
	}
	const _normalized = cached(() => normalizeDef(def));
	defineLazyInternal(inst, "propValues", (zod) => {
		const shape = zod.def.shape;
		const propValues = {};
		for (const key in shape) {
			const field = shape[key]._zod;
			if (field.values) {
				if (!Object.prototype.hasOwnProperty.call(propValues, key)) assignProp(propValues, key, /* @__PURE__ */ new Set());
				for (const v of field.values) propValues[key].add(v);
				if (field.optin !== void 0) propValues[key].add(void 0);
			}
		}
		return propValues;
	});
	const isObject$2 = isObject;
	const catchall = def.catchall;
	let value;
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$2(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
		const proms = [];
		const shape = value.shape;
		const abortEarly = ctx?.abortEarly;
		let seen = payload.issues.length;
		for (const key of value.allKeys) {
			if (abortEarly && payload.issues.length !== seen) {
				if (aborted(payload, seen)) break;
				seen = payload.issues.length;
			}
			if (key === "__proto__") continue;
			const el = shape[key];
			const optin = el._zod.optin;
			const optout = el._zod.optout;
			const r = el._zod.run({
				value: input[key],
				issues: []
			}, ctx);
			if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
			else handlePropertyResult(r, payload, key, input, optin, optout);
		}
		if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
		return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
	};
});
const $ZodObjectJIT = /*@__PURE__*/ $constructor("$ZodObjectJIT", (inst, def) => {
	$ZodObject.init(inst, def);
	const superParse = inst._zod.parse;
	const _normalized = cached(() => normalizeDef(def));
	const memo = globalConfig.memoizer;
	const generateFastpass = (shape) => {
		const normalized = _normalized.value;
		const syms = normalized.symbolKeys;
		const doc = new Doc(["payload", "ctx"], {
			shape,
			inst,
			memo,
			syms
		});
		const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
		const prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
		doc.write(`const input = payload.value;`);
		const ids = Object.create(null);
		let counter = 0;
		for (const key of normalized.allKeys) ids[key] = `key_${counter++}`;
		doc.write(memo ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
		for (const key of normalized.allKeys) {
			if (key === "__proto__") continue;
			const id = ids[key];
			const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key);
			const isPresent = `${k} in input`;
			const schema = shape[key];
			const optin = schema?._zod?.optin;
			const isOptionalIn = optin !== void 0;
			const isOptionalOut = schema?._zod?.optout === "optional";
			doc.write(`const ${id} = ${parseStr(k)};`);
			if (isOptionalIn && isOptionalOut) {
				const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
				doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
			} else if (!isOptionalIn) doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
			else {
				doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
				if (optin === "defaulted") doc.write(`newResult[${k}] = ${id}.value;`);
				else doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
			}
		}
		doc.write(`payload.value = newResult;`);
		doc.write(`return payload;`);
		return doc.compile();
	};
	let fastpass;
	const isObject$1 = isObject;
	const jit = !globalConfig.jitless;
	const fastEnabled = jit && allowsEval.value;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
			if (!fastpass) fastpass = generateFastpass(def.shape);
			payload = fastpass(payload, ctx);
			if (!catchall) return payload;
			return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
		}
		return superParse(payload, ctx);
	};
});
function handleUnionResults(results, final, inst, ctx) {
	for (const result of results) if (result.issues.length === 0) {
		final.value = result.value;
		return final;
	}
	const nonaborted = results.filter((r) => !aborted(r));
	if (nonaborted.length === 1) {
		final.value = nonaborted[0].value;
		return nonaborted[0];
	}
	final.issues.push({
		code: "invalid_union",
		input: final.value,
		inst,
		errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	});
	return final;
}
const $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== void 0) ? "optional" : void 0);
	defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
	defineLazyInternal(inst, "values", (zod) => {
		if (zod.def.options.every((o) => o._zod.values)) return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		if (zod.def.options.every((o) => o._zod.pattern)) {
			const patterns = zod.def.options.map((o) => o._zod.pattern);
			return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
		}
	});
	const first = def.options.length === 1 ? def.options[0]._zod.run : null;
	inst._zod.parse = (payload, ctx) => {
		if (first) return first(payload, ctx);
		let async = false;
		const results = [];
		for (const option of def.options) {
			const result = option._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) {
				results.push(result);
				async = true;
			} else {
				if (result.issues.length === 0) return result;
				results.push(result);
			}
		}
		if (!async) return handleUnionResults(results, payload, inst, ctx);
		return Promise.all(results).then((results) => {
			return handleUnionResults(results, payload, inst, ctx);
		});
	};
});
const $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		const left = def.left._zod.run({
			value: input,
			issues: []
		}, ctx);
		const right = def.right._zod.run({
			value: input,
			issues: []
		}, ctx);
		if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left, right]) => {
			return handleIntersectionResults(payload, left, right);
		});
		return handleIntersectionResults(payload, left, right);
	};
});
function mergeValues(a, b) {
	if (a === b) return {
		valid: true,
		data: a
	};
	if (a instanceof Date && b instanceof Date && +a === +b) return {
		valid: true,
		data: a
	};
	if (isPlainObject(a) && isPlainObject(b)) {
		const bKeys = Object.keys(b);
		const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		if (Object.prototype.hasOwnProperty.call(newObj, "__proto__")) delete newObj.__proto__;
		for (const key of sharedKeys) {
			if (key === "__proto__") continue;
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
			};
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return {
			valid: false,
			mergeErrorPath: []
		};
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
			};
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	}
	return {
		valid: false,
		mergeErrorPath: []
	};
}
function handleIntersectionResults(result, left, right) {
	const unrecKeys = /* @__PURE__ */ new Map();
	let unrecIssue;
	const keyIssues = /* @__PURE__ */ new Map();
	const collect = (iss, side) => {
		let keys;
		if (iss.code === "unrecognized_keys" && !iss.path?.length) {
			unrecIssue ?? (unrecIssue = iss);
			keys = iss.keys;
		} else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
			const k = String(iss.path[0]);
			if (!keyIssues.has(k)) keyIssues.set(k, iss);
			keys = [k];
		} else return false;
		for (const k of keys) {
			if (!unrecKeys.has(k)) unrecKeys.set(k, {});
			unrecKeys.get(k)[side] = true;
		}
		return true;
	};
	for (const iss of left.issues) if (!collect(iss, "l")) result.issues.push(iss);
	for (const iss of right.issues) if (!collect(iss, "r")) result.issues.push(iss);
	const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
	if (bothKeys.length) {
		const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
		if (aggregated.length) result.issues.push({
			...unrecIssue,
			keys: aggregated
		});
		for (const k of bothKeys) if (!aggregated.includes(k) && keyIssues.has(k)) result.issues.push(keyIssues.get(k));
	}
	const merged = mergeValues(left.value, right.value);
	if (!merged.valid) {
		if (aborted(result)) return result;
		throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
	}
	result.value = merged.data;
	return result;
}
const $ZodRecord = /*@__PURE__*/ $constructor("$ZodRecord", (inst, def) => {
	$ZodType.init(inst, def);
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!isPlainObject(input)) {
			payload.issues.push({
				expected: "record",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		const proms = [];
		const values = def.keyType._zod.values;
		if (values && !def.partial) {
			payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
			const recordKeys = /* @__PURE__ */ new Set();
			for (const key of values) if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
				recordKeys.add(typeof key === "number" ? key.toString() : key);
				if (key === "__proto__") continue;
				const keyResult = def.keyType._zod.run({
					value: key,
					issues: []
				}, ctx);
				if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
				if (keyResult.issues.length) {
					payload.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
						input: key,
						path: [key],
						inst
					});
					continue;
				}
				const outKey = keyResult.value;
				if (outKey === "__proto__") continue;
				const result = def.valueType._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[outKey] = result.value;
				}));
				else {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[outKey] = result.value;
				}
			}
			let unrecognized;
			for (const key in input) if (!recordKeys.has(key)) {
				if (def.mode === "loose") {
					if (key === "__proto__") continue;
					payload.value[key] = input[key];
				} else {
					unrecognized = unrecognized ?? [];
					unrecognized.push(key);
				}
			}
			if (unrecognized && unrecognized.length > 0) payload.issues.push({
				code: "unrecognized_keys",
				input,
				inst,
				keys: unrecognized,
				continue: true
			});
		} else {
			payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
			let unrecognized;
			for (const key of Reflect.ownKeys(input)) {
				if (key === "__proto__") continue;
				if (!Object.prototype.propertyIsEnumerable.call(input, key)) continue;
				let keyResult = def.keyType._zod.run({
					value: key,
					issues: []
				}, ctx);
				if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
				if (typeof key === "string" && number$1.test(key) && keyResult.issues.length) {
					const retryResult = def.keyType._zod.run({
						value: Number(key),
						issues: []
					}, ctx);
					if (retryResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
					if (retryResult.issues.length === 0) keyResult = retryResult;
				}
				if (keyResult.issues.length) {
					if (def.mode === "loose") payload.value[key] = input[key];
					else if (values) {
						unrecognized = unrecognized ?? [];
						unrecognized.push(key);
					} else payload.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
						input: key,
						path: [key],
						inst
					});
					continue;
				}
				const outKey = keyResult.value;
				if (outKey === "__proto__") continue;
				const result = def.valueType._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[outKey] = result.value;
				}));
				else {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[outKey] = result.value;
				}
			}
			if (unrecognized && unrecognized.length > 0) payload.issues.push({
				code: "unrecognized_keys",
				input,
				inst,
				keys: unrecognized,
				continue: true
			});
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
const $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def) => {
	$ZodType.init(inst, def);
	const values = getEnumValues(def.entries);
	const valuesSet = new Set(values);
	inst._zod.values = valuesSet;
	defineLazyInternal(inst, "pattern", (zod) => {
		const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
		return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
	});
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (valuesSet.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values,
			input,
			inst
		});
		return payload;
	};
});
const $ZodLiteral = /*@__PURE__*/ $constructor("$ZodLiteral", (inst, def) => {
	$ZodType.init(inst, def);
	const values = new Set(def.values);
	inst._zod.values = values;
	defineLazyInternal(inst, "pattern", (zod) => {
		const vals = zod.def.values;
		return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
	});
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (values.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values: def.values,
			input,
			inst
		});
		return payload;
	};
});
const $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	globalConfig.memoizer?.guard(inst);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		const _out = def.transform(payload.value, payload);
		if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
			payload.value = output;
			return payload;
		});
		if (_out instanceof Promise) throw new $ZodAsyncError();
		payload.value = _out;
		return payload;
	};
});
function handleOptionalResult(payload, result) {
	payload.value = result.issues.length ? void 0 : result.value;
	return payload;
}
const $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	inst._zod.optout = "optional";
	defineLazyInternal(inst, "values", (zod) => {
		const values = zod.def.innerType._zod.values;
		return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === void 0) {
			if (def.innerType._zod.optin !== "defaulted") return payload;
			const result = def.innerType._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) return result.then((result) => handleOptionalResult(payload, result));
			return handleOptionalResult(payload, result);
		}
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
	inst._zod.parse = (payload, ctx) => {
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
	});
	defineLazyInternal(inst, "values", (zod) => {
		return zod.def.innerType._zod.values ? /* @__PURE__ */ new Set([...zod.def.innerType._zod.values, null]) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === null) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "defaulted";
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) {
			payload.value = def.defaultValue;
			/**
			* $ZodDefault returns the default value immediately in forward direction.
			* It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
			return payload;
		}
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleDefaultResult(result, def));
		return handleDefaultResult(result, def);
	};
});
function handleDefaultResult(payload, def) {
	if (payload.value === void 0) payload.value = def.defaultValue;
	return payload;
}
const $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "defaulted";
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) payload.value = def.defaultValue;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => {
		const v = zod.def.innerType._zod.values;
		return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleNonOptionalResult(result, inst));
		return handleNonOptionalResult(result, inst);
	};
});
function handleNonOptionalResult(payload, inst) {
	if (!payload.issues.length && payload.value === void 0) payload.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: payload.value,
		inst
	});
	return payload;
}
function handleCatchResult(payload, result, def, ctx) {
	if (!result.issues.length) {
		payload.value = result.value;
		if (result.memo) payload.memo = true;
		return payload;
	}
	payload.value = def.catchValue({
		...result,
		value: payload.value,
		error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
		input: payload.value
	});
	return payload;
}
const $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run({
			value: payload.value,
			issues: []
		}, ctx);
		if (result instanceof Promise) return result.then((result) => handleCatchResult(payload, result, def, ctx));
		return handleCatchResult(payload, result, def, ctx);
	};
});
const $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
	defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
	defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") {
			const right = def.out._zod.run(payload, ctx);
			if (right instanceof Promise) return right.then((right) => handlePipeResult(right, def.in, ctx));
			return handlePipeResult(right, def.in, ctx);
		}
		const left = def.in._zod.run(payload, ctx);
		if (left instanceof Promise) return left.then((left) => handlePipeResult(left, def.out, ctx));
		return handlePipeResult(left, def.out, ctx);
	};
});
function handlePipeResult(left, next, ctx) {
	if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
		left.aborted = true;
		return left;
	}
	return next._zod.run({
		value: left.value,
		issues: left.issues
	}, ctx);
}
const $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then(handleReadonlyResult);
		return handleReadonlyResult(result);
	};
});
function handleReadonlyResult(payload) {
	if (!payload.memo) payload.value = Object.freeze(payload.value);
	return payload;
}
const $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def) => {
	$ZodCheck.init(inst, def);
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _) => {
		return payload;
	};
	inst._zod.check = (payload) => {
		const input = payload.value;
		const r = def.fn(input);
		if (r instanceof Promise) return r.then((r) => handleRefineResult(r, payload, input, inst));
		handleRefineResult(r, payload, input, inst);
	};
});
function handleRefineResult(result, payload, input, inst) {
	if (!result) {
		const _iss = {
			code: "custom",
			input,
			inst,
			path: [...inst._zod.def.path ?? []],
			continue: !inst._zod.def.abort
		};
		if (inst._zod.def.params) _iss.params = inst._zod.def.params;
		payload.issues.push(issue(_iss));
	}
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/memoizer.js
var $ZodCyclicError = class extends Error {
	constructor() {
		super(`Cannot parse a reference cycle that closes through a transform`);
		this.name = "ZodCyclicError";
	}
};
/** Keyed off the context object every schema in one parse call already shares. */
const STATE = "~memo";
const NO_ISSUES = [];
function isRef(value) {
	return value !== null && typeof value === "object";
}
function cloneIssues(issues) {
	return issues.map((iss) => iss.path ? {
		...iss,
		path: iss.path.slice()
	} : { ...iss });
}
const recursive = /*@__PURE__*/ new WeakMap();
/** What the walk established, in order of certainty: ordered so the strongest answer among children wins. */
const NONE = 0;
const ASSUMED = 1;
const PROVEN = 2;
/** Whether this schema's subtree contains a cycle, so one parse can re-enter it. */
function isRecursive(inst, stack, resolve) {
	const cached = recursive.get(inst);
	if (cached !== void 0) return cached ? PROVEN : NONE;
	if (stack.has(inst)) return PROVEN;
	stack.add(inst);
	let result = NONE;
	const check = (child) => {
		if (result !== PROVEN && child?._zod) {
			const answer = isRecursive(child, stack, resolve);
			if (answer > result) result = answer;
		}
	};
	const shape = (sh, spread) => {
		let answer = NONE;
		for (const key of Reflect.ownKeys(sh)) {
			const desc = Object.getOwnPropertyDescriptor(sh, key);
			if (spread && !desc.enumerable) continue;
			const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
			if (child > answer) answer = child;
		}
		return answer;
	};
	const merge = (answer) => {
		if (answer > result) result = answer;
	};
	const def = inst._zod.def;
	switch (def.type) {
		case "object": {
			const raw = rawShape(def);
			merge(raw ? shape(raw, true) : ASSUMED);
			check(def.catchall);
			break;
		}
		case "array":
			check(def.element);
			break;
		case "tuple":
			for (const el of def.items) check(el);
			check(def.rest);
			break;
		case "record":
		case "map":
			check(def.keyType);
			check(def.valueType);
			break;
		case "set":
			check(def.valueType);
			break;
		case "union":
			for (const el of def.options) check(el);
			break;
		case "intersection":
			check(def.left);
			check(def.right);
			break;
		case "optional":
		case "nullable":
		case "default":
		case "prefault":
		case "catch":
		case "readonly":
		case "nonoptional":
		case "promise":
		case "success":
			check(def.innerType);
			break;
		case "pipe":
			check(def.in);
			check(def.out);
			break;
		case "function":
			check(def.input);
			check(def.output);
			break;
		case "lazy": {
			const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : void 0);
			merge(inner ? isRecursive(inner, stack, false) : ASSUMED);
			break;
		}
		case "template_literal":
		case "string":
		case "number":
		case "int":
		case "boolean":
		case "bigint":
		case "symbol":
		case "undefined":
		case "null":
		case "void":
		case "never":
		case "any":
		case "unknown":
		case "date":
		case "nan":
		case "enum":
		case "literal":
		case "file":
		case "transform":
		case "custom": break;
		default: for (const key in def) {
			const desc = Object.getOwnPropertyDescriptor(def, key);
			if (!desc || desc.get) continue;
			const value = desc.value;
			if (!value || typeof value !== "object") continue;
			if (value._zod) check(value);
			else if (Array.isArray(value)) for (const el of value) check(el);
		}
	}
	stack.delete(inst);
	return settle(inst, result);
}
/** An assumed answer must not outlive the resolution that settles it, so only a certain one is cached. */
function settle(inst, answer) {
	if (answer !== ASSUMED) recursive.set(inst, answer === PROVEN);
	return answer;
}
function bucketFor(state, inst) {
	let bucket = state.buckets.get(inst);
	if (!bucket) {
		bucket = /* @__PURE__ */ new WeakMap();
		state.buckets.set(inst, bucket);
	}
	return bucket;
}
let handoff;
const open = [];
const memo = {
	alloc(_inst, payload, empty) {
		const bucket = handoff;
		if (!bucket) return empty;
		handoff = void 0;
		const entry = {
			value: empty,
			issues: null
		};
		bucket.set(payload.value, entry);
		open.push(entry);
		return empty;
	},
	guard(inst) {
		var _a;
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred.push(() => {
			const base = inst._zod.parse;
			const wrapped = (payload, ctx) => {
				if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value)) throw new $ZodCyclicError();
				return base(payload, ctx);
			};
			inst._zod.parse = wrapped;
			if (inst._zod.run === base) inst._zod.run = wrapped;
		});
	},
	attach(inst) {
		var _a;
		let isRecursiveInst;
		let rechecked = false;
		let lastCtx;
		let lastBucket;
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred.push(() => {
			const base = inst._zod.parse;
			const wrapped = (payload, ctx) => {
				if (isRecursiveInst === void 0) {
					const walked = isRecursive(inst, /* @__PURE__ */ new Set(), false);
					if (walked === NONE) {
						inst._zod.parse = base;
						if (inst._zod.run === wrapped) inst._zod.run = base;
						return base(payload, ctx);
					}
					if (walked === PROVEN || rechecked) isRecursiveInst = true;
					else rechecked = true;
				}
				const input = payload.value;
				if (!isRef(input)) return base(payload, ctx);
				let state = ctx[STATE];
				if (!state) {
					state = {
						buckets: /* @__PURE__ */ new WeakMap(),
						backEdges: void 0
					};
					ctx[STATE] = state;
				}
				let bucket;
				if (lastCtx === ctx) bucket = lastBucket;
				else {
					bucket = bucketFor(state, inst);
					lastCtx = ctx;
					lastBucket = bucket;
				}
				const hit = bucket.get(input);
				if (hit) {
					payload.value = hit.value;
					if (hit.issues) {
						if (hit.issues.length) payload.issues.push(...cloneIssues(hit.issues));
					} else {
						payload.memo = true;
						state.backEdges ?? (state.backEdges = /* @__PURE__ */ new WeakSet());
						state.backEdges.add(hit.value);
					}
					return payload;
				}
				handoff = bucket;
				const depth = open.length;
				const result = base(payload, ctx);
				handoff = void 0;
				const entry = open.length > depth ? open.pop() : void 0;
				if (result instanceof Promise) return result.then((r) => {
					if (entry) entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
					return r;
				});
				if (entry) entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
				return result;
			};
			inst._zod.parse = wrapped;
			if (inst._zod.run === base) inst._zod.run = wrapped;
		});
	}
};
/** The memoizer that gives containers cycle support. `zod` installs it by default; `zod/mini` opts in with `config({ memoizer: memoizer() })`. */
function memoizer() {
	return memo;
}
/** Whether this value is a node a back-edge resolved to before it finished. */
function isBackEdge(ctx, value) {
	const backEdges = ctx[STATE]?.backEdges;
	return backEdges !== void 0 && isRef(value) && backEdges.has(value);
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/locales/en.js
const error = () => {
	const Sizable = {
		string: {
			unit: "characters",
			verb: "to have"
		},
		file: {
			unit: "bytes",
			verb: "to have"
		},
		array: {
			unit: "items",
			verb: "to have"
		},
		set: {
			unit: "items",
			verb: "to have"
		},
		map: {
			unit: "entries",
			verb: "to have"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "input",
		email: "email address",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datetime",
		date: "ISO date",
		time: "ISO time",
		duration: "ISO duration",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		mac: "MAC address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded string",
		base64url: "base64url-encoded string",
		json_string: "JSON string",
		e164: "E.164 number",
		currency_code: "currency code",
		credit_card: "credit card number",
		iban: "IBAN",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = { nan: "NaN" };
	function getTypeName(type, input) {
		if (type === "number" && typeof input === "number" && !Number.isFinite(input)) return String(input);
		return TypeDictionary[type] ?? type;
	}
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": return `Invalid input: expected ${getTypeName(issue.expected)}, received ${getTypeName(parsedType(issue.input), issue.input)}`;
			case "invalid_value":
				if (issue.values.length === 1) return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
				return `Invalid option: expected one of ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.exact ? "exactly " : issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
				return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.exact ? "exactly " : issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Invalid string: must start with "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Invalid string: must end with "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Invalid string: must include "${_issue.includes}"`;
				if (_issue.format === "regex") return `Invalid string: must match pattern ${_issue.pattern}`;
				return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Invalid number: must be a multiple of ${issue.divisor}`;
			case "unrecognized_keys": return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Invalid key in ${issue.origin}`;
			case "invalid_union":
				if (issue.options && Array.isArray(issue.options) && issue.options.length > 0) return `Invalid discriminator value. Expected ${issue.options.map((o) => `'${o}'`).join(" | ")}`;
				if (issue.inclusive === false) return "Invalid input: more than one option matched";
				return "Invalid input";
			case "invalid_element": return `Invalid value in ${issue.origin}`;
			default: return `Invalid input`;
		}
	};
};
function en_default() {
	return { localeError: error() };
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/registries.js
var _a;
var $ZodRegistry = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
	}
	add(schema, ..._meta) {
		const meta = _meta[0];
		this._map.set(schema, meta);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.set(meta.id, schema);
		return this;
	}
	clear() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
		return this;
	}
	remove(schema) {
		const meta = this._map.get(schema);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.delete(meta.id);
		this._map.delete(schema);
		return this;
	}
	get(schema) {
		const p = schema._zod.parent;
		if (p) {
			const pm = { ...this.get(p) ?? {} };
			delete pm.id;
			const f = {
				...pm,
				...this._map.get(schema)
			};
			return Object.keys(f).length ? f : void 0;
		}
		return this._map.get(schema);
	}
	has(schema) {
		return this._map.has(schema);
	}
};
function registry() {
	return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
const globalRegistry = globalThis.__zod_globalRegistry;
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/api.js
function snapshotChecks(def) {
	if (def.checks) def.checks = [...def.checks];
	return def;
}
// @__NO_SIDE_EFFECTS__
function _string(Class, params) {
	return new Class(snapshotChecks({
		type: "string",
		...normalizeParams(params)
	}));
}
// @__NO_SIDE_EFFECTS__
function _email(Class, params) {
	return new Class({
		type: "string",
		format: "email",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _guid(Class, params) {
	return new Class({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v4",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v6",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v7",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _url(Class, params) {
	return new Class({
		type: "string",
		format: "url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _emoji(Class, params) {
	return new Class({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class, params) {
	return new Class({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link _cuid2} instead.
* See https://github.com/paralleldrive/cuid.
*/
// @__NO_SIDE_EFFECTS__
function _cuid(Class, params) {
	return new Class({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class, params) {
	return new Class({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class, params) {
	return new Class({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _xid(Class, params) {
	return new Class({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class, params) {
	return new Class({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class, params) {
	return new Class({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class, params) {
	return new Class({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _base64(Class, params) {
	return new Class({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class, params) {
	return new Class({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _e164(Class, params) {
	return new Class({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class, params) {
	return new Class({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class, params) {
	return new Class({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: false,
		local: false,
		precision: null,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class, params) {
	return new Class({
		type: "string",
		format: "date",
		check: "string_format",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class, params) {
	return new Class({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class, params) {
	return new Class({
		type: "string",
		format: "duration",
		check: "string_format",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params) {
	return new Class(snapshotChecks({
		type: "number",
		checks: [],
		...normalizeParams(params)
	}));
}
// @__NO_SIDE_EFFECTS__
function _int(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "safeint",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class, params) {
	return new Class({
		type: "boolean",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class) {
	return new Class({ type: "unknown" });
}
// @__NO_SIDE_EFFECTS__
function _never(Class, params) {
	return new Class({
		type: "never",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
	return new $ZodCheckMultipleOf({
		check: "multiple_of",
		...normalizeParams(params),
		value
	});
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
	return new $ZodCheckMaxLength({
		check: "max_length",
		...normalizeParams(params),
		maximum
	});
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
	return new $ZodCheckMinLength({
		check: "min_length",
		...normalizeParams(params),
		minimum
	});
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
	return new $ZodCheckLengthEquals({
		check: "length_equals",
		...normalizeParams(params),
		length
	});
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
	return new $ZodCheckRegex({
		check: "string_format",
		format: "regex",
		...normalizeParams(params),
		pattern
	});
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
	return new $ZodCheckLowerCase({
		check: "string_format",
		format: "lowercase",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
	return new $ZodCheckUpperCase({
		check: "string_format",
		format: "uppercase",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
	return new $ZodCheckIncludes({
		check: "string_format",
		format: "includes",
		...normalizeParams(params),
		includes
	});
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
	return new $ZodCheckStartsWith({
		check: "string_format",
		format: "starts_with",
		...normalizeParams(params),
		prefix
	});
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
	return new $ZodCheckEndsWith({
		check: "string_format",
		format: "ends_with",
		...normalizeParams(params),
		suffix
	});
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
	return new $ZodCheckOverwrite({
		check: "overwrite",
		tx
	});
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
	return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
	return /* @__PURE__ */ _overwrite((input) => input.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
	return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class, element, params) {
	return new Class({
		type: "array",
		element,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
	return new Class({
		type: "custom",
		check: "custom",
		fn,
		...normalizeParams(_params)
	});
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
	const ch = /* @__PURE__ */ _check((payload) => {
		payload.addIssue = (issue$2) => {
			if (typeof issue$2 === "string") payload.issues.push(issue(issue$2, payload.value, ch._zod.def));
			else {
				const _issue = issue$2;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				if (!("input" in _issue)) _issue.input = payload.value;
				_issue.inst ?? (_issue.inst = ch);
				_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
				payload.issues.push(issue(_issue));
			}
		};
		return fn(payload.value, payload);
	}, params);
	return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
	const ch = new $ZodCheck({
		check: "custom",
		...normalizeParams(params)
	});
	ch._zod.check = fn;
	return ch;
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/to-json-schema.js
function assignProps(target, ...sources) {
	for (const source of sources) for (const key of Reflect.ownKeys(source)) if (Object.prototype.propertyIsEnumerable.call(source, key)) assignProp(target, key, source[key]);
	return target;
}
function initializeContext(params) {
	let target = params?.target ?? "draft-2020-12";
	if (target === "draft-4") target = "draft-04";
	if (target === "draft-7") target = "draft-07";
	return {
		processors: params.processors ?? {},
		metadataRegistry: params?.metadata ?? globalRegistry,
		target,
		unrepresentable: params?.unrepresentable ?? "throw",
		override: params?.override ?? (() => {}),
		io: params?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		sharedDefsExtractedFor: void 0,
		sharedEmitDoneFor: void 0,
		cycles: params?.cycles ?? "ref",
		reused: params?.reused ?? "inline",
		intersections: [],
		deferred: [],
		external: params?.external ?? void 0
	};
}
/**
* Applies the `unrepresentable` setting at a site that has no JSON Schema equivalent. Throws
* `message` unless the setting (or the handler's return value) says otherwise. Returns `true` if a
* custom JSON Schema was written into `json`, in which case the caller must not write its own.
*/
function handleUnrepresentable(schema, ctx, json, params, message) {
	const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({
		zodSchema: schema,
		path: params.path,
		message
	}) : ctx.unrepresentable;
	if (result === "any") return false;
	if (result === void 0 || result === "throw") throw new Error(message);
	Object.assign(json, result);
	return true;
}
function processSchema(schema, ctx, _params = {
	path: [],
	schemaPath: []
}) {
	var _a;
	const def = schema._zod.def;
	const seen = ctx.seen.get(schema);
	if (seen) {
		seen.count++;
		if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
		return seen.schema;
	}
	const result = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: _params.path
	};
	ctx.seen.set(schema, result);
	ctx.sharedDefsExtractedFor = void 0;
	ctx.sharedEmitDoneFor = void 0;
	const overrideSchema = schema._zod.toJSONSchema?.();
	if (overrideSchema) result.schema = overrideSchema;
	else {
		const params = {
			..._params,
			schemaPath: [..._params.schemaPath, schema],
			path: _params.path
		};
		if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
		else {
			const _json = result.schema;
			const processor = ctx.processors[def.type];
			if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
			processor(schema, ctx, _json, params);
		}
		const parent = schema._zod.parent;
		if (parent) {
			if (!result.ref) result.ref = parent;
			processSchema(parent, ctx, params);
			ctx.seen.get(parent).isParent = true;
		}
	}
	const meta = ctx.metadataRegistry.get(schema);
	if (meta) assignProps(result.schema, meta);
	if (ctx.io === "input" && isTransforming(schema)) {
		delete result.schema.examples;
		delete result.schema.default;
	}
	if (ctx.io === "input" && "_prefault" in result.schema) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
	delete result.schema._prefault;
	return ctx.seen.get(schema).schema;
}
function encodeJSONPointerSegment(segment) {
	return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function extractDefs(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external) return;
	const idToSchema = /* @__PURE__ */ new Map();
	for (const entry of ctx.seen.entries()) {
		const id = ctx.metadataRegistry.get(entry[0])?.id;
		if (id) {
			const existing = idToSchema.get(id);
			if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			idToSchema.set(id, entry[0]);
		}
	}
	const makeURI = (entry) => {
		const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
		if (ctx.external) {
			const externalId = ctx.external.registry.get(entry[0])?.id;
			const uriGenerator = ctx.external.uri ?? ((id) => id);
			if (externalId) return { ref: uriGenerator(externalId) };
			const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
			entry[1].defId = id;
			return {
				defId: id,
				ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}`
			};
		}
		const uriPrefix = `#`;
		const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
		if (entry[1] === root && !entry[1].schema.id) return { ref: uriPrefix };
		const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
		return {
			defId,
			ref: defUriPrefix + encodeJSONPointerSegment(defId)
		};
	};
	const extractToDef = (entry) => {
		if (entry[1].schema.$ref) return;
		const seen = entry[1];
		const { ref, defId } = makeURI(entry);
		seen.def = { ...seen.schema };
		if (defId) seen.defId = defId;
		const schema = seen.schema;
		for (const key in schema) delete schema[key];
		schema.$ref = ref;
	};
	if (ctx.cycles === "throw") for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (schema === entry[0]) {
			extractToDef(entry);
			continue;
		}
		if (ctx.external) {
			const ext = ctx.external.registry.get(entry[0])?.id;
			if (schema !== entry[0] && ext) {
				extractToDef(entry);
				continue;
			}
		}
		if (ctx.metadataRegistry.get(entry[0])?.id) {
			extractToDef(entry);
			continue;
		}
		if (seen.cycle) {
			extractToDef(entry);
			continue;
		}
		if (seen.count > 1) {
			if (ctx.reused === "ref") extractToDef(entry);
		}
	}
	if (ctx.external) ctx.sharedDefsExtractedFor = ctx.external;
}
/** Rewrites `anyOf: [{type: "a"}, {type: "b"}]` to `type: ["a", "b"]`, which every JSON Schema draft treats as equivalent and most consumers render far better for the nullable case. Only branches that are a bare type assertion qualify — anything carrying a constraint, `$ref`, `const` or metadata is left alone. Runs after `flattenRef`, so a branch an override decorated or `$defs` extraction turned into a `$ref` is no longer bare and correctly stays in `anyOf`. `oneOf` is excluded: `integer` and `number` overlap, so "exactly one" and "at least one" are not the same there. OpenAPI 3.0 is excluded: its `type` must be a single string. */
function compactTypeUnion(schema) {
	const options = schema.anyOf;
	if (!Array.isArray(options) || options.length === 0 || schema.type !== void 0) return;
	const types = [];
	for (const option of options) {
		if (!option || typeof option !== "object") return;
		compactTypeUnion(option);
		const keys = Object.keys(option);
		if (keys.length !== 1 || keys[0] !== "type") return;
		const type = option.type;
		for (const member of Array.isArray(type) ? type : [type]) {
			if (typeof member !== "string") return;
			if (!types.includes(member)) types.push(member);
		}
	}
	delete schema.anyOf;
	schema.type = types.length === 1 ? types[0] : types;
}
/** Keywords `foldIntersection` knows how to combine. Anything else — `$ref`, `patternProperties`,
* an annotation like `description` — makes a member unfoldable, so a constraint this does not
* understand leaves the `allOf` alone instead of being silently dropped or misattributed. */
const FOLDABLE_KEYS = /* @__PURE__ */ new Set([
	"type",
	"properties",
	"required",
	"additionalProperties"
]);
const UNION_KEYS = ["oneOf", "anyOf"];
/** A member's constraint on a key it does not declare itself. A `catchall` states one; `false`, an absent `additionalProperties`, and the empty schema a loose object emits state nothing. */
function undeclaredConstraint(member) {
	const extra = member.additionalProperties;
	if (extra === void 0 || extra === false || typeof extra !== "object" || extra === null) return null;
	return Object.keys(extra).length ? extra : null;
}
/** Combines object members into the single object they describe together, or returns `null` if any of them carries a keyword outside {@link FOLDABLE_KEYS}. */
function foldObjects(members) {
	const objects = [];
	for (const member of members) {
		if (typeof member !== "object" || member.type !== "object") return null;
		for (const key in member) if (!FOLDABLE_KEYS.has(key)) return null;
		objects.push(member);
	}
	const properties = {};
	const required = /* @__PURE__ */ new Set();
	for (const object of objects) {
		for (const key in object.properties) {
			if (Object.prototype.hasOwnProperty.call(properties, key)) continue;
			const parts = [];
			for (const other of objects) {
				const part = other.properties?.[key] ?? undeclaredConstraint(other);
				if (part === null || part === void 0) continue;
				if (!parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part))) parts.push(part);
			}
			assignProp(properties, key, parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts });
		}
		for (const key of object.required ?? []) required.add(key);
	}
	const folded = {
		type: "object",
		properties
	};
	if (required.size) folded.required = [...required];
	if (objects.every((object) => object.additionalProperties === false)) folded.additionalProperties = false;
	else {
		const constraints = [];
		for (const object of objects) {
			const constraint = undeclaredConstraint(object);
			if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint))) constraints.push(constraint);
		}
		if (constraints.length === 1) folded.additionalProperties = constraints[0];
		else if (constraints.length > 1) folded.additionalProperties = { allOf: constraints };
	}
	return folded;
}
/** `additionalProperties` in an `allOf` member sees only that member's own `properties`, so two
* closed object members reject each other's keys and the schema validates nothing. Zod's parser
* pools the key sets instead — `handleIntersectionResults` reports a key as unrecognized only when
* *every* side rejects it — so the emitted schema has to pool them too, and folding the members
* into one object is the encoding that says so on every target.
*
* This runs from `finalize`, after `extractDefs`, which is what keeps it clear of the `$ref`
* machinery: a member extracted into `$defs` is already a `$ref` by now and declines to fold, so it
* keeps its reference and its own closedness rather than being inlined as a stale copy. */
function foldIntersection(json) {
	const allOf = json.allOf;
	if (!Array.isArray(allOf) || allOf.length < 2) return;
	for (const key of FOLDABLE_KEYS) if (key in json) return;
	const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
	let folded = null;
	if (!unions.length) folded = foldObjects(allOf);
	else {
		const union = unions[0];
		const keyword = UNION_KEYS.find((k) => Array.isArray(union[k]));
		if (Object.keys(union).length !== 1) return;
		const rest = allOf.filter((m) => m !== union);
		const branches = union[keyword].map((branch) => foldObjects([...rest, branch]));
		if (branches.some((b) => !b)) return;
		folded = { [keyword]: branches };
	}
	if (!folded) return;
	delete json.allOf;
	assignProps(json, folded);
}
function finalize(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const flattenRef = (zodSchema) => {
		const seen = ctx.seen.get(zodSchema);
		if (seen.ref === null) return;
		const schema = seen.def ?? seen.schema;
		const _cached = { ...schema };
		const ref = seen.ref;
		seen.ref = null;
		if (ref) {
			flattenRef(ref);
			const refSeen = ctx.seen.get(ref);
			const refSchema = refSeen.schema;
			if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
				schema.allOf = schema.allOf ?? [];
				schema.allOf.push(refSchema);
			} else assignProps(schema, refSchema);
			assignProps(schema, _cached);
			if (zodSchema._zod.parent === ref) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (!(key in _cached)) delete schema[key];
			}
			if (refSchema.$ref && refSeen.def) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) delete schema[key];
			}
		}
		const parent = zodSchema._zod.parent;
		if (parent && parent !== ref) {
			flattenRef(parent);
			const parentSeen = ctx.seen.get(parent);
			if (parentSeen?.schema.$ref) {
				schema.$ref = parentSeen.schema.$ref;
				if (parentSeen.def) for (const key in schema) {
					if (key === "$ref" || key === "allOf") continue;
					if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) delete schema[key];
				}
			}
		}
		ctx.override({
			zodSchema,
			jsonSchema: schema,
			path: seen.path ?? []
		});
	};
	if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
		for (const entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
		if (ctx.target !== "openapi-3.0") for (const entry of ctx.seen.entries()) compactTypeUnion(entry[1].def ?? entry[1].schema);
		for (const rewrite of ctx.deferred) rewrite();
		if (ctx.intersections.length) {
			const carriers = /* @__PURE__ */ new Map();
			for (const seen of ctx.seen.values()) for (const json of [seen.schema, seen.def]) {
				const allOf = json?.allOf;
				if (!Array.isArray(allOf)) continue;
				const existing = carriers.get(allOf);
				if (existing) existing.push(json);
				else carriers.set(allOf, [json]);
			}
			for (const allOf of ctx.intersections) for (const json of carriers.get(allOf) ?? []) foldIntersection(json);
		}
	}
	const result = {};
	if (ctx.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
	else if (ctx.target === "draft-07") result.$schema = "http://json-schema.org/draft-07/schema#";
	else if (ctx.target === "draft-04") result.$schema = "http://json-schema.org/draft-04/schema#";
	else if (ctx.target === "openapi-3.0") {}
	if (ctx.external?.uri) {
		const id = ctx.external.registry.get(schema)?.id;
		if (!id) throw new Error("Schema is missing an `id` property");
		result.$id = ctx.external.uri(id);
	}
	assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
	const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
	if (rootMetaId !== void 0 && result.id === rootMetaId) delete result.id;
	const defs = ctx.external?.defs ?? {};
	if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.def && seen.defId) {
			if (seen.def.id === seen.defId) delete seen.def.id;
			assignProp(defs, seen.defId, seen.def);
		}
	}
	if (ctx.external) ctx.sharedEmitDoneFor = ctx.external;
	if (ctx.external) {} else if (Object.keys(defs).length > 0) {
		if (ctx.target === "draft-2020-12") result.$defs = defs;
		else result.definitions = defs;
	}
	try {
		const finalized = JSON.parse(JSON.stringify(result));
		Object.defineProperty(finalized, "~standard", {
			value: {
				...schema["~standard"],
				jsonSchema: {
					input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
					output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
				}
			},
			enumerable: false,
			writable: false
		});
		return finalized;
	} catch (_err) {
		throw new Error("Error converting schema to JSON.");
	}
}
function isTransforming(_schema, _ctx) {
	const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
	if (ctx.seen.has(_schema)) return false;
	ctx.seen.add(_schema);
	const def = _schema._zod.def;
	if (def.type === "transform") return true;
	if (def.type === "array") return isTransforming(def.element, ctx);
	if (def.type === "set") return isTransforming(def.valueType, ctx);
	if (def.type === "lazy") return isTransforming(def.getter(), ctx);
	if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") return isTransforming(def.innerType, ctx);
	if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
	if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
	if (def.type === "pipe") {
		if (_schema._zod.traits.has("$ZodCodec")) return true;
		return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
	}
	if (def.type === "object") {
		for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
		return false;
	}
	if (def.type === "union") {
		for (const option of def.options) if (isTransforming(option, ctx)) return true;
		return false;
	}
	if (def.type === "tuple") {
		for (const item of def.items) if (isTransforming(item, ctx)) return true;
		if (def.rest && isTransforming(def.rest, ctx)) return true;
		return false;
	}
	return false;
}
/**
* Creates a toJSONSchema method for a schema instance.
* This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
*/
const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
	const ctx = initializeContext({
		...params,
		processors
	});
	processSchema(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
	const { libraryOptions, target } = params ?? {};
	const ctx = initializeContext({
		...libraryOptions ?? {},
		target,
		io,
		processors
	});
	processSchema(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/json-schema-processors.js
const narrowMin = (agg, key, value) => {
	if (agg[key] === void 0 || value > agg[key]) agg[key] = value;
};
const narrowMax = (agg, key, value) => {
	if (agg[key] === void 0 || value < agg[key]) agg[key] = value;
};
const narrowBoth = (agg, value) => {
	narrowMin(agg, "minimum", value);
	narrowMax(agg, "maximum", value);
};
const addDivisor = (agg, value) => {
	agg.multipleOf ?? (agg.multipleOf = []);
	if (!agg.multipleOf.includes(value)) agg.multipleOf.push(value);
};
const addPattern = (agg, pattern) => {
	agg.patterns ?? (agg.patterns = /* @__PURE__ */ new Set());
	agg.patterns.add(pattern);
};
const intersectMime = (agg, mime) => {
	agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
};
const setFormat = (agg, format) => {
	agg.format = format;
	if (format.includes("int")) agg.isInt = true;
};
const minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
const maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
const formatContributor = (ranges) => (agg, def) => {
	setFormat(agg, def.format);
	const [minimum, maximum] = ranges[def.format];
	narrowMin(agg, "minimum", minimum);
	narrowMax(agg, "maximum", maximum);
};
const contributors = {
	greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
	less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
	multiple_of: (agg, def) => addDivisor(agg, def.value),
	number_format: formatContributor(NUMBER_FORMAT_RANGES),
	bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
	min_length: minContributor,
	max_length: maxContributor,
	length_equals: (agg, def) => narrowBoth(agg, def.length),
	min_size: minContributor,
	max_size: maxContributor,
	size_equals: (agg, def) => narrowBoth(agg, def.size),
	string_format: (agg, def) => {
		setFormat(agg, def.format);
		if (def.pattern) addPattern(agg, def.pattern);
		if (def.format === "base64" || def.format === "base64url") agg.contentEncoding = def.format;
		if (def.local || def.precision === -1) agg.laxFormat = true;
	},
	mime_type: (agg, def) => intersectMime(agg, def.mime)
};
function aggregateChecks(schema) {
	const agg = {};
	const def = schema._zod.def;
	const list = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
	for (const ch of list) contributors[ch._zod.def.check]?.(agg, ch._zod.def);
	const bag = schema._zod.bag;
	if (bag.minimum !== void 0) narrowMin(agg, "minimum", bag.minimum);
	if (bag.exclusiveMinimum !== void 0) narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
	if (bag.maximum !== void 0) narrowMax(agg, "maximum", bag.maximum);
	if (bag.exclusiveMaximum !== void 0) narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
	if (bag.multipleOf !== void 0) addDivisor(agg, bag.multipleOf);
	if (bag.format !== void 0) {
		agg.format ?? (agg.format = bag.format);
		if (bag.format.includes("int")) agg.isInt = true;
	}
	if (bag.mime) intersectMime(agg, bag.mime);
	for (const pattern of bag.patterns ?? []) addPattern(agg, pattern);
	return agg;
}
const formatMap = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
};
const exactPatterns = /* @__PURE__ */ new Map([[base64Charset, base64], [base64urlCharset, base64url]]);
const exactPattern = (p) => exactPatterns.get(p) ?? p;
const stringProcessor = (schema, ctx, _json, _params) => {
	const json = _json;
	json.type = "string";
	const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
	if (typeof minimum === "number") json.minLength = minimum;
	if (typeof maximum === "number") json.maxLength = maximum;
	if (format) {
		json.format = formatMap[format] ?? format;
		if (json.format === "") delete json.format;
		if (format === "time" || laxFormat) delete json.format;
	}
	if (contentEncoding) json.contentEncoding = contentEncoding;
	if (patterns && patterns.size > 0) {
		const patternList = [...patterns].map(exactPattern);
		if (patternList.length === 1) json.pattern = patternList[0].source;
		else if (patternList.length > 1) json.allOf = [...patternList.map((regex) => ({
			...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: regex.source
		}))];
	}
};
const numberProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
	json.type = isInt ? "integer" : "number";
	const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
	const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
	const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
	if (exMin) {
		if (legacy) {
			json.minimum = exclusiveMinimum;
			json.exclusiveMinimum = true;
		} else json.exclusiveMinimum = exclusiveMinimum;
	} else if (typeof minimum === "number") json.minimum = minimum;
	if (exMax) {
		if (legacy) {
			json.maximum = exclusiveMaximum;
			json.exclusiveMaximum = true;
		} else json.exclusiveMaximum = exclusiveMaximum;
	} else if (typeof maximum === "number") json.maximum = maximum;
	if (multipleOf) {
		const divisors = /* @__PURE__ */ new Set();
		for (const divisor of multipleOf) if (Number.isFinite(divisor) && divisor !== 0) divisors.add(Math.abs(divisor));
		else handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
		const [first, ...rest] = divisors;
		if (first !== void 0) json.multipleOf = first;
		if (rest.length) json.allOf = [...json.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))];
	}
};
const booleanProcessor = (_schema, _ctx, json, _params) => {
	json.type = "boolean";
};
const neverProcessor = (_schema, _ctx, json, _params) => {
	json.not = {};
};
const enumProcessor = (schema, _ctx, json, _params) => {
	const def = schema._zod.def;
	const values = getEnumValues(def.entries);
	if (values.length === 0) {
		json.not = {};
		return;
	}
	if (values.every((v) => typeof v === "number")) json.type = "number";
	if (values.every((v) => typeof v === "string")) json.type = "string";
	json.enum = values;
};
const literalProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	if (def.values.length === 0) {
		json.not = {};
		return;
	}
	const vals = [];
	for (const val of def.values) if (val === void 0) {
		if (handleUnrepresentable(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema")) return;
	} else if (typeof val === "bigint") {
		if (handleUnrepresentable(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema")) return;
		vals.push(Number(val));
	} else vals.push(val);
	if (vals.length === 0) {} else if (vals.length === 1) {
		const val = vals[0];
		json.type = val === null ? "null" : typeof val;
		if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") json.enum = [val];
		else json.const = val;
	} else {
		if (vals.every((v) => typeof v === "number")) json.type = "number";
		if (vals.every((v) => typeof v === "string")) json.type = "string";
		if (vals.every((v) => typeof v === "boolean")) json.type = "boolean";
		if (vals.every((v) => v === null)) json.type = "null";
		json.enum = vals;
	}
};
const customProcessor = (schema, ctx, json, params) => {
	handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
};
const transformProcessor = (schema, ctx, json, params) => {
	handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
};
const arrayProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const { minimum, maximum } = aggregateChecks(schema);
	if (typeof minimum === "number") json.minItems = minimum;
	if (typeof maximum === "number") json.maxItems = maximum;
	json.type = "array";
	json.items = processSchema(def.element, ctx, {
		...params,
		path: [...params.path, "items"]
	});
};
function inputOptin(schema) {
	const def = schema._zod.def;
	if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) return inputOptin(def.out);
	if (def.type === "catch") return inputOptin(def.innerType);
	return schema._zod.optin;
}
const objectProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const shape = def.shape;
	if (Object.getOwnPropertySymbols(shape).length && handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) return;
	json.type = "object";
	json.properties = {};
	for (const key in shape) assignProp(json.properties, key, processSchema(shape[key], ctx, {
		...params,
		path: [
			...params.path,
			"properties",
			key
		]
	}));
	const requiredKeys = [];
	for (const key of Object.keys(shape)) {
		const field = def.shape[key];
		if (ctx.io === "input" ? inputOptin(field) === void 0 : field._zod.optout === void 0) requiredKeys.push(key);
	}
	if (requiredKeys.length > 0) json.required = requiredKeys;
	if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
	else if (!def.catchall) {
		if (ctx.io === "output") json.additionalProperties = false;
	} else if (def.catchall) json.additionalProperties = processSchema(def.catchall, ctx, {
		...params,
		path: [...params.path, "additionalProperties"]
	});
};
const unionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const isExclusive = def.inclusive === false;
	const options = def.options.map((x, i) => processSchema(x, ctx, {
		...params,
		path: [
			...params.path,
			isExclusive ? "oneOf" : "anyOf",
			i
		]
	}));
	if (isExclusive) json.oneOf = options;
	else json.anyOf = options;
};
const intersectionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const a = processSchema(def.left, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			0
		]
	});
	const b = processSchema(def.right, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			1
		]
	});
	const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
	const allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
	json.allOf = allOf;
	ctx.intersections.push(allOf);
};
/** JSON object keys are always strings, so a numeric record key schema is re-expressed over the
* numeric-string form the record parser matches. Deferred to `finalize`, after the flatten: a key
* behind a wrapper only carries its own `type` before then, and a union key only has its branches.
*
* A numeric bound cannot apply to a property name, so `minimum` and its siblings are dropped rather
* than carried over: keeping them beside `type: "string"` reproduces the match-nothing schema this
* exists to fix. A key that carries one therefore emits wider than the record parses — `z.record(z.number().min(5), V)`
* accepts `"3"` — which is the deliberate trade, since throwing on it would reject an ordinary schema
* outright. */
function stringifyKeyNames(bySchema, json, visited) {
	if (json.$ref) {
		if (visited.has(json)) return json;
		visited.add(json);
		const def = bySchema.get(json)?.def;
		if (!def) return json;
		const inlined = stringifyKeyNames(bySchema, def, visited);
		return inlined === def ? json : inlined;
	}
	for (const keyword of ["anyOf", "oneOf"]) {
		const branches = json[keyword];
		if (!Array.isArray(branches)) continue;
		const mapped = branches.map((branch) => stringifyKeyNames(bySchema, branch, visited));
		if (mapped.some((branch, i) => branch !== branches[i])) json = {
			...json,
			[keyword]: mapped
		};
	}
	const types = Array.isArray(json.type) ? json.type : [json.type];
	const numericType = !types.includes("string") && types.some((t) => t === "number" || t === "integer");
	const values = json.enum ?? (json.const !== void 0 ? [json.const] : void 0);
	if (!numericType && !values?.some((v) => typeof v === "number")) return json;
	const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, format, id, ...rest } = json;
	if (rest.enum) rest.enum = rest.enum.map((v) => typeof v === "number" ? String(v) : v);
	else if (typeof rest.const === "number") rest.const = String(rest.const);
	if (!numericType) return rest;
	rest.type = "string";
	if (!values) rest.pattern = (types.includes("number") ? number$1 : integer).source;
	return rest;
}
/** Every record of one conversion, so the carriers are found in a single pass rather than once per record. */
const pendingRecords = /* @__PURE__ */ new WeakMap();
function rewriteKeyNames(ctx) {
	const bySchema = /* @__PURE__ */ new Map();
	for (const entry of ctx.seen.values()) if (entry.def && !bySchema.has(entry.schema)) bySchema.set(entry.schema, entry);
	const rewrites = /* @__PURE__ */ new Map();
	for (const record of pendingRecords.get(ctx) ?? []) {
		const seen = ctx.seen.get(record);
		const names = (seen?.def ?? seen?.schema)?.propertyNames;
		if (!names || names === true || rewrites.has(names)) continue;
		const rewritten = stringifyKeyNames(bySchema, names, /* @__PURE__ */ new Set());
		if (rewritten !== names) rewrites.set(names, rewritten);
	}
	if (!rewrites.size) return;
	for (const entry of ctx.seen.values()) for (const carrier of [entry.schema, entry.def]) {
		const rewritten = carrier && rewrites.get(carrier.propertyNames);
		if (rewritten) carrier.propertyNames = rewritten;
	}
}
const recordProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	json.type = "object";
	const keyType = def.keyType;
	const patterns = aggregateChecks(keyType).patterns;
	if (def.mode === "loose" && patterns && patterns.size > 0) {
		const valueSchema = processSchema(def.valueType, ctx, {
			...params,
			path: [
				...params.path,
				"patternProperties",
				"*"
			]
		});
		json.patternProperties = {};
		for (const pattern of patterns) assignProp(json.patternProperties, exactPattern(pattern).source, valueSchema);
	} else {
		if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
			json.propertyNames = processSchema(def.keyType, ctx, {
				...params,
				path: [...params.path, "propertyNames"]
			});
			let pending = pendingRecords.get(ctx);
			if (!pending) {
				pending = [];
				pendingRecords.set(ctx, pending);
				ctx.deferred.push(() => rewriteKeyNames(ctx));
			}
			pending.push(schema);
		}
		json.additionalProperties = processSchema(def.valueType, ctx, {
			...params,
			path: [...params.path, "additionalProperties"]
		});
	}
	const keyValues = keyType._zod.values;
	const omittableOnInput = ctx.io === "input" && inputOptin(def.valueType) !== void 0;
	if (keyValues && !def.partial && !omittableOnInput) {
		const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
		if (validKeyValues.length > 0) json.required = validKeyValues.map(String);
	}
};
const nullableProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const inner = processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	if (ctx.target === "openapi-3.0") {
		seen.ref = def.innerType;
		json.nullable = true;
	} else json.anyOf = [inner, { type: "null" }];
};
const nonoptionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
/** Round-trips a default value through JSON so the emitted schema is guaranteed to be valid JSON.
* A BigInt has no reliable encoding, so it goes through `unrepresentable` like any other
* unrepresentable value. Returns a sentinel when the caller must not write a default of its own. */
const UNREPRESENTABLE_DEFAULT = Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
	let unrepresentable = false;
	const serialized = JSON.stringify(value, (_, val) => {
		if (typeof val !== "bigint") return val;
		unrepresentable = true;
		return null;
	});
	if (!unrepresentable) return JSON.parse(serialized);
	handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
	return UNREPRESENTABLE_DEFAULT;
}
const defaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
	if (value !== UNREPRESENTABLE_DEFAULT) json.default = value;
};
const prefaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	if (ctx.io !== "input") return;
	const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
	if (value !== UNREPRESENTABLE_DEFAULT) json._prefault = value;
};
const catchProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	let catchValue;
	try {
		catchValue = def.catchValue(void 0);
	} catch {
		handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
		return;
	}
	json.default = catchValue;
};
const pipeProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	const inIsTransform = def.in._zod.traits.has("$ZodTransform");
	const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
	processSchema(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
const readonlyProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json.readOnly = true;
};
const optionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/classic/errors.js
const _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _lazyMethod(proto, key, make) {
	Object.defineProperty(proto, key, {
		configurable: true,
		enumerable: false,
		get() {
			const value = make(this);
			Object.defineProperty(this, key, {
				value,
				configurable: true,
				writable: true
			});
			return value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				value,
				configurable: true,
				writable: true
			});
		}
	});
}
const initializer = (inst, issues) => {
	$ZodError.init(inst, issues);
	inst.name = "ZodError";
	const proto = Object.getPrototypeOf(inst);
	if (_installedErrorProtos.has(proto)) return;
	_installedErrorProtos.add(proto);
	_lazyMethod(proto, "format", (self) => (mapper) => formatError(self, mapper));
	_lazyMethod(proto, "flatten", (self) => (mapper) => flattenError(self, mapper));
	_lazyMethod(proto, "addIssue", (self) => (issue) => {
		self.issues.push(issue);
		self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
	});
	_lazyMethod(proto, "addIssues", (self) => (issues) => {
		self.issues.push(...issues);
		self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
	});
	Object.defineProperty(proto, "isEmpty", {
		configurable: true,
		enumerable: false,
		get() {
			return this.issues.length === 0;
		}
	});
};
const ZodError = /*@__PURE__*/ $constructor("ZodError", initializer);
const ZodRealError = /*@__PURE__*/ $constructor("ZodError", initializer, void 0, { Parent: Error });
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/classic/parse.js
const parse = /* @__PURE__ */ _parse(ZodRealError);
const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
const encode = /* @__PURE__ */ _encode(ZodRealError);
const decode = /* @__PURE__ */ _decode(ZodRealError);
const encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
const decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
const safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
const safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
const safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
const safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/classic/schemas.js
function _ensureDefaultLocale() {
	if (!globalConfig.localeError) config(en_default());
}
function _ensureDefaultMemoizer() {
	if (!globalConfig.memoizer) config({ memoizer: memoizer() });
}
const ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def) => {
	_ensureDefaultLocale();
	$ZodType.init(inst, def);
	inst.def = def;
	inst.type = def.type;
	return inst;
}, {
	check(...chks) {
		const def = this.def;
		return this.clone(mergeDefs(def, { checks: [...def.checks ?? [], ...chks.map((ch) => typeof ch === "function" ? { _zod: {
			check: ch,
			def: { check: "custom" },
			onattach: []
		} } : ch)] }), { parent: true });
	},
	with(...chks) {
		return this.check(...chks);
	},
	clone(def, params) {
		return clone(this, def, params);
	},
	brand() {
		return this;
	},
	register(reg, meta) {
		reg.add(this, meta);
		return this;
	},
	refine(check, params) {
		return this.check(refine(check, params));
	},
	superRefine(refinement, params) {
		return this.check(superRefine(refinement, params));
	},
	overwrite(fn) {
		return this.check(/* @__PURE__ */ _overwrite(fn));
	},
	optional() {
		return optional(this);
	},
	exactOptional() {
		return exactOptional(this);
	},
	nullable() {
		return nullable(this);
	},
	nullish() {
		return optional(nullable(this));
	},
	nonoptional(params) {
		return nonoptional(this, params);
	},
	array() {
		return array(this);
	},
	or(arg) {
		return union([this, arg]);
	},
	and(arg) {
		return intersection(this, arg);
	},
	transform(tx) {
		return pipe(this, transform(tx));
	},
	default(d) {
		return _default(this, d);
	},
	prefault(d) {
		return prefault(this, d);
	},
	catch(params) {
		return _catch(this, params);
	},
	pipe(target) {
		return pipe(this, target);
	},
	readonly() {
		return readonly(this);
	},
	describe(description) {
		const cl = this.clone();
		globalRegistry.add(cl, { description });
		return cl;
	},
	meta(...args) {
		if (args.length === 0) return globalRegistry.get(this);
		const cl = this.clone();
		globalRegistry.add(cl, args[0]);
		return cl;
	},
	isOptional() {
		return this.safeParse(void 0).success;
	},
	isNullable() {
		return this.safeParse(null).success;
	},
	apply(fn, ...args) {
		return args.length === 0 ? fn(this) : fn(this, ...args);
	},
	get "~standard"() {
		return hide(this, "~standard", {
			...standardProps(this),
			jsonSchema: {
				input: createStandardJSONSchemaMethod(this, "input"),
				output: createStandardJSONSchemaMethod(this, "output")
			}
		});
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	},
	parse: function _parse(data, params) {
		return parse(this, data, params, { callee: _parse });
	},
	parseAsync: async function _parseAsync(data, params) {
		return await parseAsync(this, data, params, { callee: _parseAsync });
	},
	safeParse(data, params) {
		return safeParse(this, data, params);
	},
	async safeParseAsync(data, params) {
		return safeParseAsync(this, data, params);
	},
	get spa() {
		return this?.safeParseAsync;
	},
	set spa(value) {
		own(this, "spa", value);
	},
	validate(data, params) {
		return validate(this, data, params);
	},
	validateAsync(data, params) {
		return validateAsync$1(this, data, params);
	},
	encode: function _encode(data, params) {
		return encode(this, data, params, { callee: _encode });
	},
	decode: function _decode(data, params) {
		return decode(this, data, params, { callee: _decode });
	},
	encodeAsync: async function _encodeAsync(data, params) {
		return await encodeAsync(this, data, params, { callee: _encodeAsync });
	},
	decodeAsync: async function _decodeAsync(data, params) {
		return await decodeAsync(this, data, params, { callee: _decodeAsync });
	},
	safeEncode(data, params) {
		return safeEncode(this, data, params);
	},
	safeDecode(data, params) {
		return safeDecode(this, data, params);
	},
	async safeEncodeAsync(data, params) {
		return safeEncodeAsync(this, data, params);
	},
	async safeDecodeAsync(data, params) {
		return safeDecodeAsync(this, data, params);
	},
	toJSONSchema(params) {
		return createToJSONSchemaMethod(this, {})(params);
	},
	get description() {
		return globalRegistry.get(this)?.description;
	},
	get _def() {
		return this._zod.def;
	}
});
/** @internal */
const _ZodString = /*@__PURE__*/ $constructor("_ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
}, /*@__PURE__*/ derived({
	format: (inst) => aggregateChecks(inst).format ?? null,
	minLength: (inst) => aggregateChecks(inst).minimum ?? null,
	maxLength: (inst) => aggregateChecks(inst).maximum ?? null
}, {
	regex(...args) {
		return this.check(/* @__PURE__ */ _regex(...args));
	},
	includes(...args) {
		return this.check(/* @__PURE__ */ _includes(...args));
	},
	startsWith(...args) {
		return this.check(/* @__PURE__ */ _startsWith(...args));
	},
	endsWith(...args) {
		return this.check(/* @__PURE__ */ _endsWith(...args));
	},
	min(...args) {
		return this.check(/* @__PURE__ */ _minLength(...args));
	},
	max(...args) {
		return this.check(/* @__PURE__ */ _maxLength(...args));
	},
	length(...args) {
		return this.check(/* @__PURE__ */ _length(...args));
	},
	nonempty(...args) {
		return this.check(/* @__PURE__ */ _minLength(1, ...args));
	},
	lowercase(params) {
		return this.check(/* @__PURE__ */ _lowercase(params));
	},
	uppercase(params) {
		return this.check(/* @__PURE__ */ _uppercase(params));
	},
	trim() {
		return this.check(/* @__PURE__ */ _trim());
	},
	normalize(...args) {
		return this.check(/* @__PURE__ */ _normalize(...args));
	},
	toLowerCase() {
		return this.check(/* @__PURE__ */ _toLowerCase());
	},
	toUpperCase() {
		return this.check(/* @__PURE__ */ _toUpperCase());
	},
	slugify() {
		return this.check(/* @__PURE__ */ _slugify());
	}
}));
const ZodString = /*@__PURE__*/ $constructor("ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	_ZodString.init(inst, def);
}, {
	email(params) {
		return this.check(/* @__PURE__ */ _email(ZodEmail, params));
	},
	url(params) {
		return this.check(/* @__PURE__ */ _url(ZodURL, params));
	},
	jwt(params) {
		return this.check(/* @__PURE__ */ _jwt(ZodJWT, params));
	},
	emoji(params) {
		return this.check(/* @__PURE__ */ _emoji(ZodEmoji, params));
	},
	guid(params) {
		return this.check(/* @__PURE__ */ _guid(ZodGUID, params));
	},
	uuid(params) {
		return this.check(/* @__PURE__ */ _uuid(ZodUUID, params));
	},
	uuidv4(params) {
		return this.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
	},
	uuidv6(params) {
		return this.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
	},
	uuidv7(params) {
		return this.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
	},
	nanoid(params) {
		return this.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
	},
	cuid(params) {
		return this.check(/* @__PURE__ */ _cuid(ZodCUID, params));
	},
	cuid2(params) {
		return this.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
	},
	ulid(params) {
		return this.check(/* @__PURE__ */ _ulid(ZodULID, params));
	},
	base64(params) {
		return this.check(/* @__PURE__ */ _base64(ZodBase64, params));
	},
	base64url(params) {
		return this.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
	},
	xid(params) {
		return this.check(/* @__PURE__ */ _xid(ZodXID, params));
	},
	ksuid(params) {
		return this.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
	},
	ipv4(params) {
		return this.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
	},
	ipv6(params) {
		return this.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
	},
	cidrv4(params) {
		return this.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
	},
	cidrv6(params) {
		return this.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
	},
	e164(params) {
		return this.check(/* @__PURE__ */ _e164(ZodE164, params));
	},
	datetime(params) {
		return this.check(/* @__PURE__ */ _isoDateTime(ZodISODateTime, params));
	},
	date(params) {
		return this.check(/* @__PURE__ */ _isoDate(ZodISODate, params));
	},
	time(params) {
		return this.check(/* @__PURE__ */ _isoTime(ZodISOTime, params));
	},
	duration(params) {
		return this.check(/* @__PURE__ */ _isoDuration(ZodISODuration, params));
	}
});
function string(params) {
	return /* @__PURE__ */ _string(ZodString, params);
}
const ZodStringFormat = /*@__PURE__*/ $constructor("ZodStringFormat", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	_ZodString.init(inst, def);
});
const ZodISODateTime = /*@__PURE__*/ $constructor("ZodISODateTime", (inst, def) => {
	$ZodISODateTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISODate = /*@__PURE__*/ $constructor("ZodISODate", (inst, def) => {
	$ZodISODate.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISOTime = /*@__PURE__*/ $constructor("ZodISOTime", (inst, def) => {
	$ZodISOTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISODuration = /*@__PURE__*/ $constructor("ZodISODuration", (inst, def) => {
	$ZodISODuration.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodEmail = /*@__PURE__*/ $constructor("ZodEmail", (inst, def) => {
	$ZodEmail.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodGUID = /*@__PURE__*/ $constructor("ZodGUID", (inst, def) => {
	$ZodGUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodUUID = /*@__PURE__*/ $constructor("ZodUUID", (inst, def) => {
	$ZodUUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodURL = /*@__PURE__*/ $constructor("ZodURL", (inst, def) => {
	$ZodURL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodEmoji = /*@__PURE__*/ $constructor("ZodEmoji", (inst, def) => {
	$ZodEmoji.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodNanoID = /*@__PURE__*/ $constructor("ZodNanoID", (inst, def) => {
	$ZodNanoID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link ZodCUID2} instead.
* See https://github.com/paralleldrive/cuid.
*/
const ZodCUID = /*@__PURE__*/ $constructor("ZodCUID", (inst, def) => {
	$ZodCUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCUID2 = /*@__PURE__*/ $constructor("ZodCUID2", (inst, def) => {
	$ZodCUID2.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodULID = /*@__PURE__*/ $constructor("ZodULID", (inst, def) => {
	$ZodULID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodXID = /*@__PURE__*/ $constructor("ZodXID", (inst, def) => {
	$ZodXID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodKSUID = /*@__PURE__*/ $constructor("ZodKSUID", (inst, def) => {
	$ZodKSUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodIPv4 = /*@__PURE__*/ $constructor("ZodIPv4", (inst, def) => {
	$ZodIPv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodIPv6 = /*@__PURE__*/ $constructor("ZodIPv6", (inst, def) => {
	$ZodIPv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCIDRv4 = /*@__PURE__*/ $constructor("ZodCIDRv4", (inst, def) => {
	$ZodCIDRv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCIDRv6 = /*@__PURE__*/ $constructor("ZodCIDRv6", (inst, def) => {
	$ZodCIDRv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodBase64 = /*@__PURE__*/ $constructor("ZodBase64", (inst, def) => {
	$ZodBase64.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodBase64URL = /*@__PURE__*/ $constructor("ZodBase64URL", (inst, def) => {
	$ZodBase64URL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodE164 = /*@__PURE__*/ $constructor("ZodE164", (inst, def) => {
	$ZodE164.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodJWT = /*@__PURE__*/ $constructor("ZodJWT", (inst, def) => {
	$ZodJWT.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodNumber = /*@__PURE__*/ $constructor("ZodNumber", (inst, def) => {
	$ZodNumber.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
	inst.isFinite = true;
}, /*@__PURE__*/ derived({
	minValue: (inst) => {
		const { minimum, exclusiveMinimum } = aggregateChecks(inst);
		return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
	},
	maxValue: (inst) => {
		const { maximum, exclusiveMaximum } = aggregateChecks(inst);
		return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
	},
	isInt: (inst) => {
		const { isInt, multipleOf } = aggregateChecks(inst);
		return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
	},
	format: (inst) => aggregateChecks(inst).format ?? null
}, {
	gt(value, params) {
		return this.check(/* @__PURE__ */ _gt(value, params));
	},
	gte(value, params) {
		return this.check(/* @__PURE__ */ _gte(value, params));
	},
	min(value, params) {
		return this.check(/* @__PURE__ */ _gte(value, params));
	},
	lt(value, params) {
		return this.check(/* @__PURE__ */ _lt(value, params));
	},
	lte(value, params) {
		return this.check(/* @__PURE__ */ _lte(value, params));
	},
	max(value, params) {
		return this.check(/* @__PURE__ */ _lte(value, params));
	},
	int(params) {
		return this.check(int(params));
	},
	safe(params) {
		return this.check(int(params));
	},
	positive(params) {
		return this.check(/* @__PURE__ */ _gt(0, params));
	},
	nonnegative(params) {
		return this.check(/* @__PURE__ */ _gte(0, params));
	},
	negative(params) {
		return this.check(/* @__PURE__ */ _lt(0, params));
	},
	nonpositive(params) {
		return this.check(/* @__PURE__ */ _lte(0, params));
	},
	multipleOf(value, params) {
		return this.check(/* @__PURE__ */ _multipleOf(value, params));
	},
	step(value, params) {
		return this.check(/* @__PURE__ */ _multipleOf(value, params));
	},
	finite() {
		return this;
	}
}));
function number(params) {
	return /* @__PURE__ */ _number(ZodNumber, params);
}
const ZodNumberFormat = /*@__PURE__*/ $constructor("ZodNumberFormat", (inst, def) => {
	$ZodNumberFormat.init(inst, def);
	ZodNumber.init(inst, def);
});
function int(params) {
	return /* @__PURE__ */ _int(ZodNumberFormat, params);
}
const ZodBoolean = /*@__PURE__*/ $constructor("ZodBoolean", (inst, def) => {
	$ZodBoolean.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function boolean(params) {
	return /* @__PURE__ */ _boolean(ZodBoolean, params);
}
const ZodUnknown = /*@__PURE__*/ $constructor("ZodUnknown", (inst, def) => {
	$ZodUnknown.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => void 0;
});
function unknown() {
	return /* @__PURE__ */ _unknown(ZodUnknown);
}
const ZodNever = /*@__PURE__*/ $constructor("ZodNever", (inst, def) => {
	$ZodNever.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
	return /* @__PURE__ */ _never(ZodNever, params);
}
const ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodArray.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
	inst.element = def.element;
}, {
	min(n, params) {
		return this.check(/* @__PURE__ */ _minLength(n, params));
	},
	nonempty(params) {
		return this.check(/* @__PURE__ */ _minLength(1, params));
	},
	max(n, params) {
		return this.check(/* @__PURE__ */ _maxLength(n, params));
	},
	length(n, params) {
		return this.check(/* @__PURE__ */ _length(n, params));
	},
	unwrap() {
		return this.element;
	}
});
function array(element, params) {
	return /* @__PURE__ */ _array(ZodArray, element, params);
}
const ZodObject = /*@__PURE__*/ $constructor("ZodObject", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodObjectJIT.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
	installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
}, {
	keyof() {
		return _enum(Object.keys(this._zod.def.shape));
	},
	catchall(catchall) {
		return this.clone(mergeDefs(this._zod.def, { catchall }));
	},
	passthrough() {
		return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
	},
	loose() {
		return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
	},
	strict() {
		return this.clone(mergeDefs(this._zod.def, { catchall: never() }));
	},
	strip() {
		return this.clone(mergeDefs(this._zod.def, { catchall: void 0 }));
	},
	extend(incoming) {
		return extend(this, incoming);
	},
	safeExtend(incoming) {
		return safeExtend(this, incoming);
	},
	merge(other) {
		return merge(this, other);
	},
	pick(mask) {
		return pick(this, mask);
	},
	omit(mask) {
		return omit(this, mask);
	},
	partial(...args) {
		return partial(ZodOptional, this, args[0]);
	},
	exactPartial(...args) {
		return partial(ZodExactOptional, this, args[0], "exactPartial");
	},
	required(...args) {
		return required(ZodNonOptional, this, args[0]);
	}
});
function object(shape, params) {
	const def = {
		type: "object",
		shape: shape ?? {},
		...normalizeParams(params)
	};
	return new ZodObject(def);
}
const ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def) => {
	$ZodUnion.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
	inst.options = def.options;
});
function union(options, params) {
	return new ZodUnion({
		type: "union",
		options,
		...normalizeParams(params)
	});
}
const ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def) => {
	$ZodIntersection.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
	return new ZodIntersection({
		type: "intersection",
		left,
		right
	});
}
const ZodRecord = /*@__PURE__*/ $constructor("ZodRecord", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodRecord.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => recordProcessor(inst, ctx, json, params);
	inst.keyType = def.keyType;
	inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
	if (!valueType || !valueType._zod) return new ZodRecord({
		type: "record",
		keyType: string(),
		valueType: keyType,
		...normalizeParams(valueType)
	});
	return new ZodRecord({
		type: "record",
		keyType,
		valueType,
		...normalizeParams(params)
	});
}
const ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def) => {
	$ZodEnum.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
	inst.enum = def.entries;
	inst.options = [...inst._zod.values];
	const keys = new Set(Object.keys(def.entries));
	inst.extract = (values, params) => {
		const newEntries = {};
		for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
	inst.exclude = (values, params) => {
		const newEntries = { ...def.entries };
		for (const value of values) if (keys.has(value)) delete newEntries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
});
function _enum(values, params) {
	const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
	return new ZodEnum({
		type: "enum",
		entries,
		...normalizeParams(params)
	});
}
const ZodLiteral = /*@__PURE__*/ $constructor("ZodLiteral", (inst, def) => {
	$ZodLiteral.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
	inst.values = new Set(def.values);
	Object.defineProperty(inst, "value", { get() {
		if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
		return def.values[0];
	} });
});
function literal(value, params) {
	return new ZodLiteral({
		type: "literal",
		values: Array.isArray(value) ? value : [value],
		...normalizeParams(params)
	});
}
const ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodTransform.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
	inst._zod.parse = (payload, _ctx) => {
		if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		payload.addIssue = (issue$1) => {
			if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, def));
			else {
				const _issue = issue$1;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				if (!("input" in _issue)) _issue.input = payload.value;
				_issue.inst ?? (_issue.inst = inst);
				payload.issues.push(issue(_issue));
			}
		};
		const output = def.transform(payload.value, payload);
		if (output instanceof Promise) return output.then((output) => {
			payload.value = output;
			return payload;
		});
		payload.value = output;
		return payload;
	};
});
function transform(fn) {
	return new ZodTransform({
		type: "transform",
		transform: fn
	});
}
const ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
	return new ZodOptional({
		type: "optional",
		innerType
	});
}
const ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def) => {
	$ZodExactOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
	return new ZodExactOptional({
		type: "optional",
		innerType
	});
}
const ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def) => {
	$ZodNullable.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
	return new ZodNullable({
		type: "nullable",
		innerType
	});
}
const ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def) => {
	$ZodDefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
	return new ZodDefault({
		type: "default",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
const ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def) => {
	$ZodPrefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
	return new ZodPrefault({
		type: "prefault",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
const ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def) => {
	$ZodNonOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
	return new ZodNonOptional({
		type: "nonoptional",
		innerType,
		...normalizeParams(params)
	});
}
const ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def) => {
	$ZodCatch.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
	return new ZodCatch({
		type: "catch",
		innerType,
		catchValue: typeof catchValue === "function" ? catchValue : constantCatch(catchValue)
	});
}
const ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def) => {
	$ZodPipe.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
	inst.in = def.in;
	inst.out = def.out;
});
function pipe(in_, out) {
	return new ZodPipe({
		type: "pipe",
		in: in_,
		out
	});
}
const ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def) => {
	$ZodReadonly.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
	return new ZodReadonly({
		type: "readonly",
		innerType
	});
}
const ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def) => {
	$ZodCustom.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
	return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
	return /* @__PURE__ */ _superRefine(fn, params);
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/classic/iso.js
function datetime(params) {
	return /* @__PURE__ */ _isoDateTime(ZodISODateTime, params);
}
//#endregion
//#region src/format/result.ts
/**
* The result file: what an eval harness writes after a run and hands to the action. It is the only
* thing a project has to produce. Every field but the cases is optional, so a first version can be a
* few lines; each field added makes the dashboard richer. The descriptions here become the JSON
* Schema's, which editors show on hover.
*/
config({ jitless: true });
/** Tokens and money one trial, or one message, spent. */
const usageSchema$1 = object({
	inputTokens: number().int().nonnegative().optional().describe("Tokens sent to the model."),
	outputTokens: number().int().nonnegative().optional().describe("Tokens the model wrote."),
	costUsd: number().nonnegative().optional().describe("What it cost, in US dollars.")
}).describe("Tokens and money spent.");
/** The attachments field, the same wherever it appears. */
const attachmentsSchema = array(object({
	path: string().min(1).describe("The file's path, relative to the result file, inside its folder."),
	mediaType: _enum([
		"image/png",
		"image/jpeg",
		"image/webp",
		"image/gif"
	]).describe("The image's type."),
	caption: string().optional().describe("What the image shows, under it on the dashboard.")
}).describe("A file saved next to the result, such as a screenshot of what the agent built.")).optional().describe("Images, such as screenshots, shown where they belong on the dashboard.");
/** One call the model made to a tool, with what it sent and what it got back. */
const toolCallSchema$1 = object({
	id: string().optional().describe("The call's id, as the model gave it."),
	name: string().min(1).describe("The tool's name."),
	input: unknown().optional().describe("What the model sent: any JSON value."),
	output: unknown().optional().describe("What the tool returned: any JSON value."),
	error: string().optional().describe("The error the tool returned, when it failed."),
	durationMs: number().nonnegative().optional().describe("How long the call took."),
	attachments: attachmentsSchema
}).describe("One call the model made to a tool.");
/** One message of a trial's conversation. */
const messageSchema$1 = object({
	role: _enum([
		"system",
		"user",
		"assistant",
		"tool"
	]).describe("Who wrote the message."),
	content: string().optional().describe("The message's text."),
	toolCalls: array(toolCallSchema$1).optional().describe("The tools the model called."),
	at: datetime({ offset: true }).optional().describe("When the message was written."),
	usage: usageSchema$1.optional(),
	attachments: attachmentsSchema
}).describe("One message of the conversation.");
/** A check a case makes on every trial, as the case declares it. */
const checkDefinitionSchema = object({
	id: string().min(1).describe("The check's id, as the trials' check results name it."),
	description: string().optional().describe("What the check makes sure of, in words.")
}).describe("A check the case makes on every trial.");
/** What one check found on one trial. */
const checkResultSchema = object({
	id: string().min(1).describe("The check's id."),
	pass: boolean().describe("Whether the trial passed the check."),
	message: string().optional().describe("What the check found, shown when it failed.")
}).describe("What one check found on this trial.");
/** One attempt at a case. A case runs one or more trials, to show how stable the agent is. */
const trialSchema = object({
	status: _enum([
		"pass",
		"fail",
		"error",
		"skip"
	]).describe("pass, fail (a check failed), error (the trial did not finish), or skip."),
	score: number().min(0).max(1).optional().describe("A score from 0 to 1, when the case has one."),
	durationMs: number().nonnegative().optional().describe("How long the trial took."),
	usage: usageSchema$1.optional(),
	checks: array(checkResultSchema).optional().describe("Each check's result."),
	error: string().optional().describe("Why the trial errored, or failed."),
	output: string().optional().describe("The agent's final answer."),
	attachments: attachmentsSchema,
	transcript: array(messageSchema$1).optional().describe("The conversation, message by message, with the tool calls.")
}).describe("One attempt at the case.");
/** One eval case: what it asks, what it checks, and its trials. */
const caseSchema = object({
	id: string().min(1).max(200).describe("The case's id, stable from run to run."),
	title: string().optional().describe("The case's name on the dashboard."),
	description: string().optional().describe("What the case is about."),
	input: string().optional().describe("What the case asks the agent."),
	tags: array(string()).optional().describe("Tags to filter cases by."),
	checks: array(checkDefinitionSchema).optional().describe("The checks every trial gets."),
	trials: array(trialSchema).min(1).describe("Its trials: one or more attempts, to show how stable the agent is.")
}).describe("One eval case.");
/** A whole result file. */
const resultSchema = object({
	$schema: string().optional().describe("This format's JSON Schema, for editors."),
	version: literal(1).describe("The result format's version."),
	suite: string().min(1).optional().describe("The suite's name, such as the repository's."),
	startedAt: datetime({ offset: true }).optional().describe("When the run started."),
	durationMs: number().nonnegative().optional().describe("How long the run took."),
	labels: record(string(), string()).optional().describe("What to group and compare runs by, such as a \"model\" label."),
	cases: array(caseSchema).min(1).describe("The cases that ran.")
}).describe("One run of an eval suite, as its harness writes it for the evalmark action.");
//#endregion
//#region src/import/common.ts
/**
* Helpers every importer shares: stable ids, units, labels and the final validation against the
* result format.
*/
/** The longest case id the result format accepts. */
const maxCaseIdLength = 200;
/**
* Serializes a value as JSON with object keys sorted, so equal values give equal text.
*
* @param value - Any JSON value.
* @returns The JSON text.
*/
function stableJson(value) {
	if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
	if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
	return `{${Object.entries(value).filter(([, entry]) => entry !== void 0).sort(([left], [right]) => left < right ? -1 : 1).map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`).join(",")}}`;
}
/**
* A short, stable hash of a value: the first 12 hex digits of the SHA-256 of its stable JSON.
*
* @param value - Any JSON value.
* @returns The hash.
*/
function stableHash(value) {
	return createHash("sha256").update(stableJson(value)).digest("hex").slice(0, 12);
}
/**
* A case id from a name: the name itself, or, when it is too long for the result format, its start
* followed by its hash.
*
* @param name - The name, such as a test's description.
* @returns An id of 1 to 200 characters.
*/
function caseIdOf(name) {
	const trimmed = name.trim();
	if (trimmed.length === 0) return "case";
	if (trimmed.length <= maxCaseIdLength) return trimmed;
	return `${trimmed.slice(0, 187)}-${stableHash(trimmed)}`;
}
/**
* Copies an object without its `undefined` properties, as the result format's optional fields
* must be absent rather than undefined.
*
* @param value - The object, with possibly undefined properties.
* @returns The object, typed as the result type it stands for.
*/
function pruned(value) {
	return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== void 0));
}
/**
* A value as text: a string as it is, anything else as JSON.
*
* @param value - The value.
* @returns The text, or `undefined` for `null`, `undefined` and the empty string.
*/
function textOf(value) {
	if (value === void 0 || value === null || value === "") return void 0;
	return typeof value === "string" ? value : JSON.stringify(value);
}
/**
* A score the result format accepts: a finite number from 0 to 1.
*
* @param value - The score.
* @returns The score, or `undefined` when it is outside that range.
*/
function unitScore(value) {
	if (typeof value !== "number" || !Number.isFinite(value)) return void 0;
	return value >= 0 && value <= 1 ? value : void 0;
}
/**
* A token count the result format accepts: a non-negative integer.
*
* @param value - The count.
* @returns The count, rounded, or `undefined` when it is missing or negative.
*/
function tokenCount(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return void 0;
	return Math.round(value);
}
/**
* An amount the result format accepts, such as a cost: a finite, non-negative number.
*
* @param value - The amount.
* @returns The amount, or `undefined` when it is missing or negative.
*/
function amountOf(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return void 0;
	return value;
}
/**
* A list, or `undefined` when it is empty, so an empty list is left out of a result.
*
* @param items - The list.
* @returns The list, or `undefined`.
*/
function nonEmpty(items) {
	return items.length > 0 ? items : void 0;
}
/**
* An object, or `undefined` when it has no property, so an empty object is left out of a result.
*
* @param value - The object.
* @returns The object, or `undefined`.
*/
function nonEmptyObject(value) {
	return Object.keys(value).length > 0 ? value : void 0;
}
/**
* A duration in milliseconds from seconds.
*
* @param seconds - The duration in seconds, possibly missing or negative.
* @returns The milliseconds, or `undefined`.
*/
function millisecondsOf(seconds) {
	if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) return void 0;
	return Math.round(seconds * 1e3);
}
/**
* A time as the result format writes it, from any date text `Date` reads. A time without a zone
* is read as UTC.
*
* @param text - The time, such as `2026-10-08T10:00:00` or `2026-10-08T10:00:00.123+02:00`.
* @returns The ISO 8601 time in UTC, or `undefined` when the text is not a time.
*/
function isoTimeOf(text) {
	if (!text) return void 0;
	const hasZone = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(text.trim());
	const time = new Date(hasZone ? text : `${text.trim().replace(" ", "T")}Z`);
	return Number.isNaN(time.getTime()) ? void 0 : time.toISOString();
}
/**
* Labels from a model name: the model, and the provider when it is known.
*
* @param model - The model, or `undefined`.
* @param provider - The provider, or `undefined`.
* @returns The labels, or `undefined` when there is no model.
*/
function modelLabels(model, provider) {
	if (!model) return void 0;
	return provider ? {
		model,
		provider
	} : { model };
}
/**
* Validates a converted result against the result format.
*
* @param draft - The converted result.
* @param path - The file it was read from, for the message.
* @returns The validated result.
* @throws When the conversion does not give a valid result, with the first issues listed.
*/
function validated(draft, path) {
	const parsed = resultSchema.safeParse(draft);
	if (parsed.success) return parsed.data;
	const issues = parsed.error.issues.slice(0, 10).map((issue) => `- ${issue.path.map(String).join(".") || "the result"}: ${issue.message}`);
	throw new Error(`${path} did not convert to a valid result:\n${issues.join("\n")}`);
}
//#endregion
//#region src/import/inspect-schema.ts
/**
* The part of an Inspect AI eval log the importer reads. Its fields follow `EvalLog`, `EvalSpec`,
* `EvalStats` and `EvalSample` in `inspect_ai/log/_log.py`, `Score` in `inspect_ai/scorer/_metric.py`,
* `ModelUsage` in `inspect_ai/core/_model_output.py` and the chat messages in
* `inspect_ai/core/_chat_message.py`.
*/
/** A message's content: a string, or a list of parts of which the text parts are read. */
const contentSchema = union([string(), array(object({
	type: string().nullish(),
	text: string().nullish()
}))]);
/** A tool call an assistant message made. */
const toolCallSchema = object({
	id: string().nullish(),
	function: string(),
	arguments: unknown().optional(),
	parse_error: string().nullish()
});
/** A chat message. */
const messageSchema = object({
	role: _enum([
		"system",
		"user",
		"assistant",
		"tool"
	]),
	content: contentSchema.nullish(),
	tool_calls: array(toolCallSchema).nullish(),
	tool_call_id: union([string(), array(string())]).nullish(),
	error: object({ message: string().nullish() }).nullish()
});
/** A scorer's verdict on a sample. */
const scoreSchema = object({
	value: unknown().optional(),
	answer: string().nullish(),
	explanation: string().nullish()
});
/** What a model spent on a sample. */
const usageSchema = object({
	input_tokens: number().nullish(),
	output_tokens: number().nullish(),
	total_cost: number().nullish()
});
/** One sample of one epoch. Its input is a prompt, or a list of messages. */
const sampleSchema = object({
	id: union([string(), number()]),
	epoch: number().nullish(),
	input: union([string(), array(messageSchema)]).nullish(),
	target: union([string(), array(string())]).nullish(),
	messages: array(messageSchema).nullish(),
	output: object({ completion: string().nullish() }).nullish(),
	scores: record(string(), scoreSchema).nullish(),
	model_usage: record(string(), usageSchema).nullish(),
	total_time: number().nullish(),
	error: object({ message: string().nullish() }).nullish()
});
/** The log's header: the eval's task and model, and its stats. Samples are read one by one. */
const logSchema = object({
	eval: object({
		task: string(),
		model: string(),
		created: string().nullish()
	}),
	stats: object({
		started_at: string().nullish(),
		completed_at: string().nullish()
	}).nullish()
});
//#endregion
//#region src/import/inspect-scores.ts
/** Inspect's letter values. */
const letters = {
	C: 1,
	P: .5,
	I: 0,
	N: 0
};
/** Words Inspect reads as booleans. */
const words = {
	yes: 1,
	true: 1,
	no: 0,
	false: 0
};
/**
* A scalar score value as a number.
*
* @param value - The value: a letter, a word, a number, a boolean or a numeric string.
* @returns The number, or `undefined` for a value with no number, such as free text.
*/
function numberOfValue(value) {
	if (typeof value === "boolean") return value ? 1 : 0;
	if (typeof value === "number") return Number.isFinite(value) ? value : void 0;
	return typeof value === "string" ? numberOfText(value) : void 0;
}
/**
* A text score value as a number.
*
* @param value - A letter, a word or a numeric string.
* @returns The number, or `undefined` for free text.
*/
function numberOfText(value) {
	const known = letters[value] ?? words[value.toLowerCase()];
	if (known !== void 0) return known;
	const number = value.trim() === "" ? NaN : Number(value);
	return Number.isFinite(number) ? number : void 0;
}
/**
* A list of scalar values as one number: their mean.
*
* @param values - The values.
* @returns The mean, or `undefined` when a value has no number.
*/
function meanOf(values) {
	const numbers = values.map(numberOfValue);
	if (numbers.length === 0 || numbers.some((number) => number === void 0)) return void 0;
	return numbers.reduce((sum, number) => sum + number, 0) / numbers.length;
}
/**
* One check from a value.
*
* @param id - The check's id.
* @param value - The value: a scalar, or a list whose mean is used.
* @param message - Why, from the score's explanation.
* @returns The check and its number.
*/
function checkOf$1(id, value, message) {
	const number = Array.isArray(value) ? meanOf(value) : numberOfValue(value);
	return {
		result: pruned({
			id,
			pass: number !== void 0 && number >= 1,
			message
		}),
		value: number
	};
}
/**
* The checks of one score.
*
* @param name - The scorer's name.
* @param score - The score.
* @returns One check, or one per key when the value is a dictionary.
*/
function checksOfScore(name, score) {
	const message = score.explanation || (score.answer ? `Answer: ${score.answer}` : void 0);
	const { value } = score;
	if (value === null || typeof value !== "object" || Array.isArray(value)) return [checkOf$1(name, value, message)];
	return Object.entries(value).map(([key, entry]) => checkOf$1(`${name}/${key}`, entry, message));
}
/**
* A sample's checks and score.
*
* @param scores - The sample's scores, by scorer.
* @returns The checks, and the mean of their numbers from 0 to 1, when there are some.
*/
function checksOfScores(scores) {
	const scored = Object.entries(scores ?? {}).flatMap(([name, score]) => checksOfScore(name, score));
	const units = scored.flatMap((check) => {
		const unit = unitScore(check.value);
		return unit === void 0 ? [] : [unit];
	});
	const score = units.length > 0 ? units.reduce((sum, unit) => sum + unit, 0) / units.length : void 0;
	return {
		checks: scored.map((check) => check.result),
		score
	};
}
//#endregion
//#region src/import/inspect-transcript.ts
/**
* The text of a message's content.
*
* @param content - A string, or parts.
* @returns The text parts joined by blank lines, or `undefined` when there is none.
*/
function textOfContent(content) {
	if (content === null || content === void 0) return void 0;
	if (typeof content === "string") return content || void 0;
	return content.flatMap((part) => part.text ? [part.text] : []).join("\n\n") || void 0;
}
/**
* The text of a sample's input.
*
* @param input - A prompt, or messages.
* @returns The prompt, or the messages' texts joined by blank lines.
*/
function textOfInput(input) {
	if (input === null || input === void 0 || typeof input === "string") return input || void 0;
	return input.flatMap((message) => textOfContent(message.content) ?? []).join("\n\n") || void 0;
}
/**
* Collects the results of tool messages, by the id of the call each answers.
*
* @param messages - The messages.
* @returns The results.
*/
function toolResultsOf(messages) {
	const results = /* @__PURE__ */ new Map();
	for (const message of messages) {
		if (message.role !== "tool" || typeof message.tool_call_id !== "string") continue;
		results.set(message.tool_call_id, {
			output: textOfContent(message.content),
			error: message.error?.message ?? void 0
		});
	}
	return results;
}
/**
* Converts an assistant's tool calls, with their results.
*
* @param message - The assistant message.
* @param results - The tool results.
* @returns The calls, or `undefined` when there is none.
*/
function toolCallsOf(message, results) {
	return nonEmpty((message.tool_calls ?? []).map((call) => {
		const result = call.id ? results.get(call.id) : void 0;
		return pruned({
			id: call.id ?? void 0,
			name: call.function,
			input: call.arguments ?? void 0,
			output: result?.output,
			error: result?.error ?? call.parse_error ?? void 0
		});
	}));
}
/**
* Whether a tool message answers a call an assistant message made, so it is shown on the call.
*
* @param message - The message.
* @param answered - The ids of the calls assistant messages made.
* @returns `true` when it is a tool message for one of them.
*/
function isAnswer(message, answered) {
	return message.role === "tool" && typeof message.tool_call_id === "string" && answered.has(message.tool_call_id);
}
/**
* Converts a sample's messages to a transcript.
*
* @param messages - The messages.
* @returns The transcript, or `undefined` when there is no message.
*/
function transcriptOf(messages) {
	const list = messages ?? [];
	const results = toolResultsOf(list);
	const answered = new Set(list.flatMap((message) => (message.tool_calls ?? []).flatMap((call) => call.id ? [call.id] : [])));
	return nonEmpty(list.filter((message) => !isAnswer(message, answered)).map((message) => pruned({
		role: message.role,
		content: textOfContent(message.content),
		toolCalls: message.role === "assistant" ? toolCallsOf(message, results) : void 0
	})));
}
//#endregion
//#region src/import/zip.ts
/**
* A small zip reader: the central directory, ZIP64 included, and entries stored, deflated or
* compressed with Zstandard, which is what Inspect AI writes in its `.eval` logs.
*/
/** The largest 16-bit and 32-bit values, which mean "see the ZIP64 record". */
const max16 = 65535;
const max32 = 4294967295;
/** The signatures of the records the reader reads. */
const signatures = {
	local: 67324752,
	central: 33639248,
	end: 101010256,
	end64: 101075792,
	locator64: 117853008
};
/**
* Whether bytes start like a zip archive.
*
* @param bytes - The bytes.
* @returns `true` when they start with a local file header.
*/
function isZip(bytes) {
	return bytes[0] === 80 && bytes[1] === 75 && bytes[2] === 3 && bytes[3] === 4;
}
/**
* Finds the end of central directory record, scanning back over a possible comment.
*
* @param buffer - The archive.
* @returns The record's offset.
* @throws When there is none.
*/
function endRecordOffset(buffer) {
	const lowest = Math.max(0, buffer.length - 22 - max16);
	for (let offset = buffer.length - 22; offset >= lowest; offset--) if (buffer.readUInt32LE(offset) === signatures.end) return offset;
	throw new Error("This is not a zip archive: it has no end of central directory record.");
}
/**
* Where the central directory starts and how many entries it has, from the ZIP64 record when the
* classic one is saturated.
*
* @param buffer - The archive.
* @returns The directory's offset and entry count.
*/
function directoryOf(buffer) {
	const end = endRecordOffset(buffer);
	const count = buffer.readUInt16LE(end + 10);
	const offset = buffer.readUInt32LE(end + 16);
	if (count !== max16 && offset !== max32) return {
		offset,
		count
	};
	const locator = end - 20;
	if (locator < 0 || buffer.readUInt32LE(locator) !== signatures.locator64) return {
		offset,
		count
	};
	const end64 = Number(buffer.readBigUInt64LE(locator + 8));
	if (buffer.readUInt32LE(end64) !== signatures.end64) throw new Error("Broken ZIP64 record.");
	return {
		count: Number(buffer.readBigUInt64LE(end64 + 32)),
		offset: Number(buffer.readBigUInt64LE(end64 + 48))
	};
}
/**
* Reads the 64-bit sizes and offset of an entry from its ZIP64 extra field.
*
* @param extra - The entry's extra fields.
* @param saturated - Which of its 32-bit fields are saturated, in the field's order.
* @returns The 64-bit values, in the same order.
*/
function zip64Values(extra, saturated) {
	let position = 0;
	while (position + 4 <= extra.length) {
		const id = extra.readUInt16LE(position);
		const size = extra.readUInt16LE(position + 2);
		if (id === 1) {
			let cursor = position + 4;
			return saturated.map((isSaturated) => {
				if (!isSaturated) return void 0;
				const value = Number(extra.readBigUInt64LE(cursor));
				cursor += 8;
				return value;
			});
		}
		position += 4 + size;
	}
	return saturated.map(() => void 0);
}
/**
* Reads one central directory entry.
*
* @param buffer - The archive.
* @param offset - Where the entry starts.
* @returns The entry and where the next one starts.
* @throws When there is no entry there.
*/
function entryAt(buffer, offset) {
	if (buffer.readUInt32LE(offset) !== signatures.central) throw new Error("Broken zip directory.");
	const nameLength = buffer.readUInt16LE(offset + 28);
	const extraLength = buffer.readUInt16LE(offset + 30);
	const commentLength = buffer.readUInt16LE(offset + 32);
	const fields = [
		offset + 24,
		offset + 20,
		offset + 42
	].map((at) => buffer.readUInt32LE(at));
	const extraStart = offset + 46 + nameLength;
	const [, compressed, local] = zip64Values(buffer.subarray(extraStart, extraStart + extraLength), fields.map((value) => value === max32));
	return {
		entry: {
			name: buffer.toString("utf8", offset + 46, extraStart),
			method: buffer.readUInt16LE(offset + 10),
			compressedSize: compressed ?? fields[1] ?? 0,
			localOffset: local ?? fields[2] ?? 0
		},
		next: extraStart + extraLength + commentLength
	};
}
/**
* Decompresses an entry's data.
*
* @param buffer - The archive.
* @param entry - The entry.
* @returns Its bytes.
* @throws When its method is not stored, deflate or Zstandard.
*/
function dataOf(buffer, entry) {
	const local = entry.localOffset;
	if (buffer.readUInt32LE(local) !== signatures.local) throw new Error(`Broken entry ${entry.name}.`);
	const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
	const raw = buffer.subarray(start, start + entry.compressedSize);
	if (entry.method === 0) return raw;
	if (entry.method === 8) return inflateRawSync(raw);
	if (entry.method === 93) return zstdDecompressSync(raw);
	throw new Error(`${entry.name} uses compression method ${entry.method}, which is not supported.`);
}
/**
* Opens a zip archive.
*
* @param buffer - The archive's bytes.
* @returns The archive.
* @throws When the bytes are not a readable zip archive.
*/
function readZip(buffer) {
	const { offset, count } = directoryOf(buffer);
	const entries = /* @__PURE__ */ new Map();
	let position = offset;
	for (let index = 0; index < count; index++) {
		const { entry, next } = entryAt(buffer, position);
		entries.set(entry.name, entry);
		position = next;
	}
	return {
		names: [...entries.keys()],
		read: (name) => {
			const entry = entries.get(name);
			if (entry === void 0) throw new Error(`The archive has no ${name}.`);
			return dataOf(buffer, entry);
		}
	};
}
//#endregion
//#region src/import/inspect.ts
/** The prefix of a reference to a sample's attachment in an Inspect log. */
const attachmentPrefix = "attachment://";
/**
* Replaces references to a sample's attachments (`attachment://<id>`), which Inspect writes in
* place of long strings, with the attachments' content.
*
* @param value - Any part of the sample.
* @param attachments - The sample's attachments, by id.
* @returns The value with every reference resolved.
*/
function resolveAttachments(value, attachments) {
	if (typeof value === "string" && value.startsWith(attachmentPrefix)) {
		const content = attachments[value.slice(13)];
		return typeof content === "string" ? content : value;
	}
	if (Array.isArray(value)) return value.map((item) => resolveAttachments(item, attachments));
	if (value === null || typeof value !== "object") return value;
	return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, resolveAttachments(entry, attachments)]));
}
/**
* Reads one sample, with its attachments resolved.
*
* @param data - The parsed sample.
* @returns The sample.
* @throws When it is not an Inspect sample.
*/
function sampleOf(data) {
	const attachments = data?.attachments;
	const resolved = attachments !== null && typeof attachments === "object" ? resolveAttachments(data, attachments) : data;
	return sampleSchema.parse(resolved);
}
/**
* A trial's status: `error` when the sample errored, `skip` when it was not scored, `pass` when
* every check passed, else `fail`.
*
* @param error - The sample's error, if any.
* @param checks - Its checks.
* @returns The status.
*/
function statusOf$1(error, checks) {
	if (error) return "error";
	if (checks.length === 0) return "skip";
	return checks.every((check) => check.pass) ? "pass" : "fail";
}
/**
* What a sample spent, summed over the models it used.
*
* @param sample - The sample.
* @returns The usage, or `undefined` when the log has none.
*/
function usageOf(sample) {
	const usages = Object.values(sample.model_usage ?? {});
	const sum = (pick) => usages.some((usage) => typeof pick(usage) === "number") ? usages.reduce((total, usage) => total + (pick(usage) ?? 0), 0) : void 0;
	return nonEmptyObject(pruned({
		inputTokens: tokenCount(sum((usage) => usage.input_tokens)),
		outputTokens: tokenCount(sum((usage) => usage.output_tokens)),
		costUsd: amountOf(sum((usage) => usage.total_cost))
	}));
}
/**
* The trial one sample epoch ran.
*
* @param sample - The sample.
* @returns The trial.
*/
function trialOf$3(sample) {
	const { checks, score } = checksOfScores(sample.scores);
	const error = sample.error ? sample.error.message || "The sample failed." : void 0;
	return pruned({
		status: statusOf$1(error, checks),
		score,
		durationMs: millisecondsOf(sample.total_time),
		usage: usageOf(sample),
		checks: nonEmpty(checks),
		error,
		output: sample.output?.completion || void 0,
		transcript: transcriptOf(sample.messages)
	});
}
/**
* The case of a sample, from its epochs.
*
* @param epochs - The sample's epochs, in order.
* @returns The case.
*/
function caseOf$2(epochs) {
	const [first] = epochs;
	const trials = epochs.map(trialOf$3);
	const definitions = /* @__PURE__ */ new Map();
	for (const check of trials.flatMap((trial) => trial.checks ?? [])) definitions.set(check.id, { id: check.id });
	const target = Array.isArray(first?.target) ? first.target.join(", ") : first?.target;
	return pruned({
		id: caseIdOf(String(first?.id ?? "")),
		description: target ? `Target: ${target}` : void 0,
		input: textOfInput(first?.input),
		checks: nonEmpty([...definitions.values()]),
		trials
	});
}
/**
* Groups samples by id, each with its epochs in order.
*
* @param samples - The samples.
* @returns The epochs of each sample, the samples sorted by id.
*/
function epochsById(samples) {
	const byId = /* @__PURE__ */ new Map();
	for (const sample of samples) {
		const key = String(sample.id);
		byId.set(key, [...byId.get(key) ?? [], sample]);
	}
	return [...byId.entries()].sort(([left], [right]) => left.localeCompare(right, "en", { numeric: true })).map(([, epochs]) => epochs.sort((left, right) => (left.epoch ?? 1) - (right.epoch ?? 1)));
}
/**
* Converts a log and its samples.
*
* @param log - The log's header.
* @param samples - Its samples.
* @returns The result.
* @throws When the log has no sample, as when it was written with `log_samples` off.
*/
function resultOf(log, samples) {
	if (samples.length === 0) throw new Error("The Inspect log has no sample.");
	const [provider, ...model] = log.eval.model.split("/");
	const startedAt = isoTimeOf(log.stats?.started_at) ?? isoTimeOf(log.eval.created);
	const completedAt = isoTimeOf(log.stats?.completed_at);
	const durationMs = startedAt && completedAt ? Date.parse(completedAt) - Date.parse(startedAt) : void 0;
	return pruned({
		version: 1,
		suite: log.eval.task,
		startedAt,
		durationMs: durationMs !== void 0 && durationMs >= 0 ? durationMs : void 0,
		labels: model.length > 0 ? modelLabels(model.join("/"), provider) : modelLabels(provider, void 0),
		cases: epochsById(samples).map(caseOf$2)
	});
}
/**
* Converts an Inspect log in the JSON format.
*
* @param data - The parsed log.
* @returns The result, with the eval's model as its label.
* @throws When it is not an Inspect log or has no sample.
*/
function importInspectJson(data) {
	return [resultOf(logSchema.parse(data), (data.samples ?? []).map(sampleOf))];
}
/**
* Converts an Inspect log in the `.eval` format.
*
* @param bytes - The archive.
* @returns The result, with the eval's model as its label.
* @throws When it is not an Inspect `.eval` archive or has no sample.
*/
function importInspectEval(bytes) {
	const archive = readZip(bytes);
	const headerName = archive.names.includes("header.json") ? "header.json" : "_journal/start.json";
	const readJson = (name) => JSON.parse(archive.read(name).toString("utf8"));
	return [resultOf(logSchema.parse(readJson(headerName)), archive.names.filter((name) => name.startsWith("samples/") && name.endsWith(".json")).map((name) => sampleOf(readJson(name))))];
}
//#endregion
//#region src/import/xml.ts
/** The predefined entities. */
const namedEntities = {
	lt: "<",
	gt: ">",
	amp: "&",
	quot: "\"",
	apos: "'"
};
/**
* Decodes entity and character references. An unknown reference is kept as it is.
*
* @param text - The raw text.
* @returns The decoded text.
*/
function decodeEntities(text) {
	return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (whole, reference) => {
		if (reference.startsWith("#x")) return String.fromCodePoint(Number.parseInt(reference.slice(2), 16));
		if (reference.startsWith("#")) return String.fromCodePoint(Number.parseInt(reference.slice(1), 10));
		return namedEntities[reference] ?? whole;
	});
}
/**
* Reads the attributes of a start tag.
*
* @param text - The tag's text after its name.
* @returns The attributes, decoded.
*/
function attributesOf(text) {
	const attributes = {};
	for (const match of text.matchAll(/([^\s=/]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attributes[match[1] ?? ""] = decodeEntities(match[2] ?? match[3] ?? "");
	return attributes;
}
/**
* The element being filled.
*
* @param state - The reader.
* @returns The innermost open element.
*/
function current(state) {
	return state.stack.at(-1) ?? state.stack[0];
}
/**
* Moves past a construct that ends with a marker, or to the end of the source.
*
* @param state - The reader.
* @param marker - The marker, such as `-->`.
* @returns The text between the current position and the marker.
*/
function readUntil(state, marker) {
	const end = state.source.indexOf(marker, state.index);
	const stop = end === -1 ? state.source.length : end;
	const text = state.source.slice(state.index, stop);
	state.index = end === -1 ? stop : end + marker.length;
	return text;
}
/**
* Reads a tag's text up to its closing `>`, which may not be inside a quoted attribute value.
*
* @param state - The reader, after the tag's `<`.
* @returns The text between `<` and `>`.
*/
function readTagText(state) {
	const start = state.index;
	const quoted = /(?:[^>"']+|"[^"]*"|'[^']*')*/y;
	quoted.lastIndex = start;
	quoted.exec(state.source);
	const close = state.source.indexOf(">", quoted.lastIndex);
	const end = close === -1 ? state.source.length : close;
	state.index = close === -1 ? end : end + 1;
	return state.source.slice(start, end);
}
/**
* Reads a start or end tag, opening or closing an element. An end tag closes up to the matching
* open element and is ignored when none matches.
*
* @param state - The reader, at the tag's `<`.
*/
function readTag(state) {
	state.index += 1;
	const tag = readTagText(state);
	if (tag.startsWith("/")) {
		const name = tag.slice(1).trim();
		const open = state.stack.findLastIndex((element) => element.name === name);
		if (open > 0) state.stack.length = open;
		return;
	}
	const name = /^[^\s/>]+/.exec(tag)?.[0] ?? "";
	const element = {
		name,
		attributes: attributesOf(tag.slice(name.length)),
		children: [],
		text: ""
	};
	current(state).children.push(element);
	if (!tag.trimEnd().endsWith("/")) state.stack.push(element);
}
/**
* Reads the construct at a `<`: a comment, CDATA, a processing instruction, a doctype or a tag.
*
* @param state - The reader, at a `<`.
*/
function readMarkup(state) {
	const at = (marker) => state.source.startsWith(marker, state.index);
	if (at("<!--")) {
		state.index += 4;
		readUntil(state, "-->");
	} else if (at("<![CDATA[")) {
		state.index += 9;
		current(state).text += readUntil(state, "]]>");
	} else if (at("<?") || at("<!")) readUntil(state, ">");
	else readTag(state);
}
/**
* Parses an XML document.
*
* @param source - The document.
* @returns A root element named `#document` whose children are the document's elements.
*/
function parseXml(source) {
	const document = {
		name: "#document",
		attributes: {},
		children: [],
		text: ""
	};
	const state = {
		source,
		index: 0,
		stack: [document]
	};
	while (state.index < source.length) {
		const next = source.indexOf("<", state.index);
		const stop = next === -1 ? source.length : next;
		if (stop > state.index) current(state).text += decodeEntities(source.slice(state.index, stop));
		state.index = stop;
		if (next !== -1) readMarkup(state);
	}
	return document;
}
/**
* The child elements with a name.
*
* @param element - The parent.
* @param name - The name.
* @returns The children with that name, in order.
*/
function childrenNamed(element, name) {
	return element.children.filter((child) => child.name === name);
}
/**
* Every element with a name under an element, nested ones included.
*
* @param element - Where to look.
* @param name - The name.
* @returns The matching elements, in document order.
*/
function descendantsNamed(element, name) {
	return element.children.flatMap((child) => [...child.name === name ? [child] : [], ...descendantsNamed(child, name)]);
}
//#endregion
//#region src/import/junit.ts
/** The one check a JUnit test case makes: that it passed. */
const passedCheck = {
	id: "passed",
	description: "The test passed"
};
/** The elements that end a test case other than with a pass, with the status each means. */
const outcomeElements = [
	["failure", "fail"],
	["error", "error"],
	["skipped", "skip"]
];
/**
* A suite's property, from its `properties` element.
*
* @param suite - The `testsuite` element.
* @param name - The property's name.
* @returns Its value or text, or `undefined`.
*/
function propertyOf(suite, name) {
	const property = childrenNamed(suite, "properties").flatMap((properties) => childrenNamed(properties, "property")).find((candidate) => candidate.attributes.name === name);
	if (property === void 0) return void 0;
	return (property.attributes.value ?? property.text.trim()) || void 0;
}
/**
* The text of an outcome element: its message, with its type, and its body.
*
* @param outcome - The `failure`, `error` or `skipped` element.
* @returns The message.
*/
function messageOf(outcome) {
	const { message, type } = outcome.attributes;
	return [[type, message].filter(Boolean).join(": "), outcome.text.trim()].filter(Boolean).join("\n\n") || void 0;
}
/**
* How a test case ended: the first of `failure`, `error` and `skipped` it holds, else a pass.
*
* @param testcase - The `testcase` element.
* @returns The status, and the failure's or the error's message.
*/
function outcomeOf(testcase) {
	for (const [name, status] of outcomeElements) {
		const element = childrenNamed(testcase, name)[0];
		if (element) return pruned({
			status,
			message: status === "skip" ? void 0 : messageOf(element)
		});
	}
	return { status: "pass" };
}
/**
* The trial a test case ran.
*
* @param testcase - The `testcase` element.
* @returns The trial.
*/
function trialOf$2(testcase) {
	const { status, message } = outcomeOf(testcase);
	const checks = status === "skip" ? void 0 : [pruned({
		id: passedCheck.id,
		pass: status === "pass",
		message
	})];
	return pruned({
		status,
		durationMs: millisecondsOf(Number.parseFloat(testcase.attributes.time ?? "")),
		checks,
		error: message,
		output: childrenNamed(testcase, "system-out")[0]?.text.trim() || void 0
	});
}
/**
* Adds a test case to a group, as a new case or as another trial of one already seen.
*
* @param group - The group.
* @param testcase - The `testcase` element.
* @param suiteName - The suite's name, used as a tag.
*/
function addTestcase(group, testcase, suiteName) {
	const { classname, name = "" } = testcase.attributes;
	const id = caseIdOf(classname ? `${classname}.${name}` : name);
	const trial = trialOf$2(testcase);
	const seen = group.cases.get(id);
	if (seen) {
		seen.trials.push(trial);
		return;
	}
	group.cases.set(id, pruned({
		id,
		title: name || void 0,
		description: classname,
		tags: suiteName ? [suiteName] : void 0,
		checks: [{ ...passedCheck }],
		trials: [trial]
	}));
}
/**
* The group a suite's cases go to, made when it is the first suite with its labels.
*
* @param groups - The groups, by their labels' key.
* @param suite - The `testsuite` element.
* @returns The group.
*/
function groupOf(groups, suite) {
	const labels = modelLabels(propertyOf(suite, "model"), propertyOf(suite, "provider"));
	const key = JSON.stringify(labels ?? {});
	const existing = groups.get(key);
	if (existing) return existing;
	const group = {
		labels,
		cases: /* @__PURE__ */ new Map(),
		startTimes: []
	};
	groups.set(key, group);
	return group;
}
/**
* Adds a suite's test cases to the group of its labels.
*
* @param groups - The groups, by their labels' key.
* @param suite - The `testsuite` element.
*/
function addSuite(groups, suite) {
	const testcases = childrenNamed(suite, "testcase");
	if (testcases.length === 0) return;
	const group = groupOf(groups, suite);
	const time = isoTimeOf(suite.attributes.timestamp);
	if (time) group.startTimes.push(time);
	for (const testcase of testcases) addTestcase(group, testcase, suite.attributes.name);
}
/**
* Converts a JUnit XML report.
*
* @param source - The report's text.
* @returns One result per model the suites name, or one result when they name none.
* @throws When the report has no test case.
*/
function importJunit(source) {
	const document = parseXml(source);
	const suites = descendantsNamed(document, "testsuite");
	const groups = /* @__PURE__ */ new Map();
	for (const suite of suites) addSuite(groups, suite);
	if (groups.size === 0) throw new Error("The JUnit report has no test case.");
	const suiteName = descendantsNamed(document, "testsuites")[0]?.attributes.name ?? (suites.length === 1 ? suites[0]?.attributes.name : void 0);
	return [...groups.values()].map((group) => pruned({
		version: 1,
		suite: suiteName || void 0,
		startedAt: group.startTimes.sort()[0],
		labels: group.labels,
		cases: [...group.cases.values()]
	}));
}
//#endregion
//#region src/import/promptfoo-schema.ts
/**
* The part of promptfoo's results file (`promptfoo eval -o results.json`) the importer reads. Its
* fields follow `OutputFile`, `EvaluateSummaryV3`, `EvaluateResult` and `GradingResult` in
* promptfoo's `src/types/index.ts`. Every field is optional, so files of older versions read too.
*/
/** Token counts: `prompt` and `completion` are the input and output tokens. */
const tokenUsageSchema = object({
	prompt: number().nullish(),
	completion: number().nullish()
});
/** The assertion a grading result checked. */
const assertionSchema = object({
	type: string().nullish(),
	value: unknown().optional(),
	metric: string().nullish()
});
/** One assertion's verdict. */
const componentSchema = object({
	pass: boolean().nullish(),
	score: number().nullish(),
	reason: string().nullish(),
	assertion: assertionSchema.nullish()
});
/** A test's grading: its verdict, and one component per assertion. */
const gradingSchema = componentSchema.extend({ componentResults: array(componentSchema).nullish() });
/** The provider, as an id and a label, or as an id alone in older files. */
const providerSchema = union([string(), object({
	id: string().nullish(),
	label: string().nullish()
})]);
/** One row of results: a test, run against one prompt and one provider. */
const rowSchema = object({
	description: string().nullish(),
	promptIdx: number().nullish(),
	testIdx: number().nullish(),
	testCase: object({
		description: string().nullish(),
		vars: record(string(), unknown()).nullish(),
		metadata: object({
			pluginId: string().nullish(),
			strategyId: string().nullish()
		}).nullish()
	}).nullish(),
	provider: providerSchema.nullish(),
	prompt: object({
		raw: string().nullish(),
		label: string().nullish()
	}).nullish(),
	vars: record(string(), unknown()).nullish(),
	response: object({
		output: unknown().optional(),
		error: string().nullish(),
		cost: number().nullish(),
		tokenUsage: tokenUsageSchema.nullish()
	}).nullish(),
	error: string().nullish(),
	failureReason: number().nullish(),
	success: boolean(),
	score: number().nullish(),
	latencyMs: number().nullish(),
	gradingResult: gradingSchema.nullish(),
	cost: number().nullish(),
	tokenUsage: tokenUsageSchema.nullish()
});
/** The file `promptfoo eval -o` writes. */
const promptfooFileSchema = object({
	results: object({
		timestamp: string().nullish(),
		results: array(rowSchema),
		stats: object({ durationMs: number().nullish() }).nullish()
	}),
	config: object({ description: string().nullish() }).nullish()
});
//#endregion
//#region src/import/promptfoo.ts
/** promptfoo's `failureReason` for a test that errored rather than failed an assertion. */
const failureReasonError = 2;
/** The API kinds that sit between a provider and a model in a promptfoo provider id. */
const apiKinds = /* @__PURE__ */ new Set([
	"chat",
	"completion",
	"messages",
	"responses",
	"embedding",
	"embeddings"
]);
/**
* The labels of a provider: the label as the model when there is one, else the model part of the
* id, such as `gpt-5` in `openai:chat:gpt-5`, with the provider before the first colon.
*
* @param provider - The row's provider.
* @returns The labels, or `undefined` when the row names no provider.
*/
function providerLabels(provider) {
	const { id, label } = typeof provider === "string" ? {
		id: provider,
		label: void 0
	} : provider ?? {};
	if (!id) return modelLabels(label ?? void 0, void 0);
	const [head = "", ...rest] = id.split(":");
	if (rest.length === 0) return modelLabels(label || id, void 0);
	return modelLabels(label || modelOfId(id, rest), head);
}
/**
* The model part of a provider id, after its provider, without an API kind such as `chat`. An id
* that is a URL or a path, such as `http://…` or `file://…`, is the model as a whole.
*
* @param id - The id.
* @param rest - The id's parts after the provider.
* @returns The model.
*/
function modelOfId(id, rest) {
	if (rest[0]?.startsWith("//")) return id;
	return (rest.length > 1 && apiKinds.has(rest[0] ?? "") ? rest.slice(1) : rest).join(":");
}
/**
* What tells a test from another with the same description: its variables, without promptfoo's
* runtime ones (`__` prefixed), and for a red team test its plugin and strategy.
*
* @param row - The row.
* @returns The variables, or the variables with the plugin and strategy.
*/
function identityOf(row) {
	const all = row.vars ?? row.testCase?.vars ?? {};
	const vars = Object.fromEntries(Object.entries(all).filter(([key]) => !key.startsWith("__")));
	const metadata = row.testCase?.metadata;
	if (!metadata?.pluginId && !metadata?.strategyId) return vars;
	return {
		vars,
		pluginId: metadata.pluginId,
		strategyId: metadata.strategyId
	};
}
/**
* A red team test's tags: its plugin and strategy.
*
* @param row - The test's first row.
* @returns The tags, or `undefined` for a test that is not a red team test.
*/
function tagsOf(row) {
	const metadata = row?.testCase?.metadata;
	return nonEmpty([metadata?.pluginId, metadata?.strategyId].filter((tag) => !!tag));
}
/**
* The checks of a row: one per assertion, with ids from the assertion's metric or type.
*
* @param row - The row.
* @returns The check results with their definitions, in the assertions' order.
*/
function checksOf$1(row) {
	const grading = row.gradingResult;
	if (!grading) return [];
	const components = grading.componentResults?.length ? grading.componentResults : [grading].filter((component) => component.assertion);
	const seen = /* @__PURE__ */ new Map();
	return components.map((component) => {
		const base = component.assertion?.metric || component.assertion?.type || "assert";
		const count = (seen.get(base) ?? 0) + 1;
		seen.set(base, count);
		return checkOf(component, base, count === 1 ? base : `${base}-${count}`);
	});
}
/**
* One assertion's check.
*
* @param component - The assertion's verdict.
* @param base - The assertion's metric or type.
* @param id - The check's id, unique in the test.
* @returns The check's definition and result.
*/
function checkOf(component, base, id) {
	const value = textOf(component.assertion?.value);
	const description = value && value.length <= 120 ? `${base}: ${value}` : base;
	const result = pruned({
		id,
		pass: component.pass ?? false,
		message: component.reason || void 0
	});
	return {
		definition: {
			id,
			description
		},
		result
	};
}
/**
* A row's status: `pass` on success, `error` when promptfoo says it errored, else `fail`.
*
* @param row - The row.
* @returns The status.
*/
function statusOf(row) {
	if (row.success) return "pass";
	if (row.failureReason === failureReasonError) return "error";
	return !row.gradingResult && (row.error || row.response?.error) ? "error" : "fail";
}
/**
* The trial a row ran.
*
* @param row - The row.
* @returns The trial.
*/
function trialOf$1(row) {
	const tokens = row.tokenUsage ?? row.response?.tokenUsage;
	const usage = pruned({
		inputTokens: tokenCount(tokens?.prompt),
		outputTokens: tokenCount(tokens?.completion),
		costUsd: amountOf(row.cost ?? row.response?.cost)
	});
	return pruned({
		status: statusOf(row),
		score: unitScore(row.score),
		durationMs: tokenCount(row.latencyMs),
		usage: nonEmptyObject(usage),
		checks: nonEmpty(checksOf$1(row).map((check) => check.result)),
		error: row.error || row.response?.error || void 0,
		output: textOf(row.response?.output)
	});
}
/**
* Groups rows by test: same description and same variables.
*
* @param rows - The rows of one provider and prompt.
* @returns The tests, in the order they first appear.
*/
function testsOf(rows) {
	const tests = /* @__PURE__ */ new Map();
	for (const row of rows) {
		const description = row.testCase?.description || row.description || void 0;
		const varsHash = stableHash(identityOf(row));
		const key = `${description ?? ""}\u0000${varsHash}`;
		const test = tests.get(key) ?? {
			description,
			varsHash,
			rows: []
		};
		test.rows.push(row);
		tests.set(key, test);
	}
	return [...tests.values()];
}
/**
* The case of a test.
*
* @param test - The test's rows.
* @param shared - Whether another test has the same description, so the id needs the hash.
* @returns The case.
*/
function caseOf$1(test, shared) {
	const { description, varsHash, rows } = test;
	const name = description ? shared ? `${description} (${varsHash})` : description : `vars-${varsHash}`;
	const definitions = new Map(rows.flatMap(checksOf$1).map((check) => [check.definition.id, check.definition]));
	return pruned({
		id: caseIdOf(name),
		title: description,
		input: rows[0]?.prompt?.raw ?? void 0,
		tags: tagsOf(rows[0]),
		checks: nonEmpty([...definitions.values()]),
		trials: rows.map(trialOf$1)
	});
}
/**
* The cases of one provider and prompt.
*
* @param rows - Their rows.
* @returns The cases.
*/
function casesOf$1(rows) {
	const tests = testsOf(rows);
	const counts = /* @__PURE__ */ new Map();
	for (const test of tests) if (test.description) counts.set(test.description, (counts.get(test.description) ?? 0) + 1);
	return tests.map((test) => caseOf$1(test, (counts.get(test.description ?? "") ?? 0) > 1));
}
/**
* Splits rows by provider and prompt.
*
* @param rows - Every row.
* @returns The rows of each provider and prompt, with their labels.
*/
function groupsOf(rows) {
	const prompts = new Set(rows.map((row) => row.promptIdx ?? 0));
	const groups = /* @__PURE__ */ new Map();
	for (const row of rows) {
		const promptIndex = row.promptIdx ?? 0;
		const prompt = prompts.size > 1 ? row.prompt?.label ?? `prompt-${promptIndex + 1}` : void 0;
		const labels = pruned({
			...providerLabels(row.provider),
			prompt
		});
		const key = JSON.stringify([labels, promptIndex]);
		const group = groups.get(key) ?? {
			labels: Object.keys(labels).length > 0 ? labels : void 0,
			rows: []
		};
		group.rows.push(row);
		groups.set(key, group);
	}
	return [...groups.values()];
}
/**
* Reads promptfoo's results, as `promptfoo eval -o results.json` writes them, or the evaluation
* summary alone.
*
* @param data - The parsed file.
* @returns The file.
* @throws When it is not a promptfoo results file.
*/
function fileOf(data) {
	const wrapped = data !== null && typeof data === "object" && Array.isArray(data.results) ? { results: data } : data;
	const parsed = promptfooFileSchema.safeParse(wrapped);
	if (parsed.success) return parsed.data;
	throw new Error(`This is not a promptfoo results file: ${parsed.error.issues[0]?.message ?? ""}`);
}
/**
* Converts promptfoo's results.
*
* @param data - The parsed file.
* @returns One result per provider (and per prompt, when the file has several).
* @throws When the file is not a promptfoo results file or has no row.
*/
function importPromptfoo(data) {
	const file = fileOf(data);
	if (file.results.results.length === 0) throw new Error("The promptfoo results file has no result.");
	return groupsOf(file.results.results).map((group) => pruned({
		version: 1,
		suite: file.config?.description || void 0,
		startedAt: isoTimeOf(file.results.timestamp),
		durationMs: tokenCount(file.results.stats?.durationMs),
		labels: group.labels,
		cases: casesOf$1(group.rows)
	}));
}
//#endregion
//#region src/import/import-results.ts
/**
* Importing other tools' eval output: detect the format of a file and convert it to one or more
* results, each validated against the result format. A file holding several models gives one
* result per model, as a result has one set of labels.
*/
/** The formats `importResults` reads. */
const importFormats = [
	"evalmark",
	"promptfoo",
	"inspect",
	"junit"
];
/**
* Whether a value is an object with a property.
*
* @param value - The value.
* @param key - The property.
* @returns The property's value, or `undefined`.
*/
function property(value, key) {
	return value !== null && typeof value === "object" ? value[key] : void 0;
}
/**
* The format of parsed JSON.
*
* @param json - The parsed file.
* @returns The format, or `undefined` when it is none of the JSON formats.
*/
function jsonFormatOf(json) {
	if (property(json, "version") === 1 && Array.isArray(property(json, "cases"))) return "evalmark";
	const evalSpec = property(json, "eval");
	if (typeof property(evalSpec, "task") === "string" && typeof property(evalSpec, "model") === "string") return "inspect";
	const results = property(json, "results");
	if (Array.isArray(property(results, "results"))) return "promptfoo";
	if (Array.isArray(results) && property(json, "stats") !== void 0) return "promptfoo";
}
/**
* Parses text as JSON.
*
* @param text - The text.
* @returns The parsed value, or `undefined` when it is not JSON.
*/
function parseJson(text) {
	try {
		return JSON.parse(text);
	} catch {
		return;
	}
}
/**
* Finds a file's format from its content, with its extension as a hint for XML.
*
* @param path - The file's path.
* @param bytes - Its content.
* @returns The format and, for JSON, the parsed file.
* @throws When the content is none of the formats.
*/
function sniff(path, bytes) {
	if (isZip(bytes)) return { format: "inspect" };
	const text = Buffer.from(bytes).toString("utf8").replace(/^﻿/, "");
	const trimmed = text.trimStart();
	if (trimmed.startsWith("<")) {
		if (/<testsuites?[\s>]/.test(trimmed) || extname(path).toLowerCase() === ".xml") return { format: "junit" };
	}
	const json = parseJson(text);
	const format = jsonFormatOf(json);
	if (format) return {
		format,
		json
	};
	throw new Error(`The format of ${path} was not recognised. Pass it with --format: ${importFormats.join(", ")}.`);
}
/**
* Parses a file that must be JSON.
*
* @param bytes - The file.
* @param json - The JSON already parsed by detection, if any.
* @returns The parsed value.
* @throws When it is not JSON.
*/
function jsonOf(bytes, json) {
	if (json !== void 0) return json;
	try {
		return JSON.parse(bytes.toString("utf8"));
	} catch (error) {
		throw new Error(`The file is not JSON: ${String(error)}`);
	}
}
/**
* Converts a file of a known format.
*
* @param format - The format.
* @param bytes - The file.
* @param json - The JSON already parsed by detection, if any.
* @returns The converted results, not yet validated.
*/
function convert(format, bytes, json) {
	if (format === "junit") return importJunit(bytes.toString("utf8"));
	if (format === "inspect" && isZip(bytes)) return importInspectEval(bytes);
	const data = jsonOf(bytes, json);
	if (format === "inspect") return importInspectJson(data);
	if (format === "promptfoo") return importPromptfoo(data);
	return [data];
}
/**
* Describes a conversion failure, with zod's issues in a line each.
*
* @param error - What the conversion threw.
* @returns The message.
*/
function reasonOf(error) {
	if (!(error instanceof ZodError)) return error instanceof Error ? error.message : String(error);
	return error.issues.slice(0, 5).map((issue) => `${issue.path.map(String).join(".") || "the file"}: ${issue.message}`).join("; ");
}
/**
* Reads another tool's eval output and converts it to results.
*
* @param path - The file: a promptfoo results JSON, an Inspect AI log (`.json` or `.eval`), a JUnit
*   XML report, or an evalmark result.
* @param format - Its format, or `auto` to detect it.
* @returns One result per model or provider in the file, each valid against the result format.
* @throws When the file cannot be read, its format is not recognised, or it does not convert.
*/
async function importResults(path, format = "auto") {
	const bytes = await readFile(path).catch((error) => {
		throw new Error(`${path} could not be read: ${String(error)}`);
	});
	const sniffed = format === "auto" ? sniff(path, bytes) : { format };
	let drafts;
	try {
		drafts = convert(sniffed.format, bytes, sniffed.json);
	} catch (error) {
		throw new Error(`${path} is not a readable ${sniffed.format} file: ${reasonOf(error)}`);
	}
	return drafts.map((draft) => validated(draft, path));
}
//#endregion
//#region src/action/inputs.ts
/**
* The action's inputs, read from the `INPUT_<NAME>` variables GitHub sets, with the defaults of
* `action.yml` when a variable is absent, so tests and the CLI get the same values as a workflow.
*/
/** The defaults of `action.yml`, for the inputs that have one. */
const defaults = {
	format: "auto",
	mode: "record",
	branch: "evalmark",
	folder: "evalmark",
	"keep-runs": "500",
	"keep-days": "0",
	transcripts: "failed",
	"keep-transcripts": "30",
	attachments: "failed",
	"keep-attachments": "10",
	"warn-size-mb": "100",
	history: "auto",
	comment: "true",
	badges: "true",
	title: "evalmark",
	subtitle: "eval dashboard",
	"fail-on-error": "false"
};
/**
* One input's raw value, trimmed, or its default.
*
* @param env - The environment.
* @param name - The input's name, as `action.yml` spells it.
* @returns The value, or `''` when it has neither a value nor a default.
*/
function rawInput(env, name) {
	const value = env[`INPUT_${name.replaceAll(" ", "_").toUpperCase()}`]?.trim() ?? "";
	return value === "" ? defaults[name] ?? "" : value;
}
/**
* An optional input.
*
* @param env - The environment.
* @param name - The input's name.
* @returns The value, or `undefined` when it is empty.
*/
function optionalInput(env, name) {
	const value = rawInput(env, name);
	return value === "" ? void 0 : value;
}
/**
* A boolean input, as YAML spells booleans.
*
* @param env - The environment.
* @param name - The input's name.
* @returns The value.
* @throws When the value is not a boolean.
*/
function booleanInput(env, name) {
	const value = rawInput(env, name);
	if ([
		"true",
		"True",
		"TRUE"
	].includes(value)) return true;
	if ([
		"false",
		"False",
		"FALSE",
		""
	].includes(value)) return false;
	throw new Error(`The input \`${name}\` must be \`true\` or \`false\`, not \`${value}\`.`);
}
/**
* A count input: a whole number, zero or more.
*
* @param env - The environment.
* @param name - The input's name.
* @returns The value.
* @throws When the value is not a whole number.
*/
function countInput(env, name) {
	const value = rawInput(env, name);
	if (!/^\d+$/.test(value)) throw new Error(`The input \`${name}\` must be a whole number, not \`${value}\`.`);
	return Number(value);
}
/**
* An input that takes one of a few values.
*
* @param env - The environment.
* @param name - The input's name.
* @param choices - The values it takes.
* @returns The value.
* @throws When the value is not one of the choices.
*/
function choiceInput(env, name, choices) {
	const value = rawInput(env, name);
	const choice = choices.find((entry) => entry === value);
	if (choice !== void 0) return choice;
	throw new Error(`The input \`${name}\` must be one of ${choices.join(", ")}, not \`${value}\`.`);
}
/**
* The non-empty lines of a text.
*
* @param text - The text.
* @returns Its lines, trimmed, empty ones left out.
*/
function linesOf(text) {
	return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
}
/**
* Parses labels written one `key=value` per line.
*
* @param lines - The lines.
* @returns The labels.
* @throws When a line has no `=` or an empty key.
*/
function parseLabels(lines) {
	const labels = {};
	for (const line of lines) {
		const separator = line.indexOf("=");
		const key = line.slice(0, Math.max(separator, 0)).trim();
		if (separator < 0 || key === "") throw new Error(`A label must be written \`key=value\`, not \`${line}\`.`);
		labels[key] = line.slice(separator + 1).trim();
	}
	return labels;
}
/**
* Checks the folder is a plain relative path inside the branch, and normalizes it.
*
* @param folder - The folder, as given.
* @returns The folder without leading `./` or trailing `/`.
* @throws When it is absolute, the branch's root, or climbs out with `..`.
*/
function checkFolder(folder) {
	const normalized = folder.replace(/^(\.\/)+/, "").replace(/\/+$/, "");
	const unsafe = normalized.split("/").some((part) => part === "" || part === "." || part === "..");
	if (folder.startsWith("/") || unsafe) throw new Error(`The input \`folder\` must be a folder inside the branch, not \`${folder}\`.`);
	return normalized;
}
/**
* Reads the inputs about how the run is shown: the comment, the badges, the dashboard's branding
* and its address.
*
* @param env - The environment.
* @returns Those inputs.
* @throws When an input has a value it does not take.
*/
function presentationInputs(env) {
	return {
		comment: booleanInput(env, "comment"),
		badges: booleanInput(env, "badges"),
		title: rawInput(env, "title"),
		subtitle: rawInput(env, "subtitle"),
		logo: optionalInput(env, "logo"),
		siteUrl: optionalInput(env, "site-url")
	};
}
/**
* Reads every input.
*
* @param env - The environment, such as `process.env`.
* @returns The inputs.
* @throws When an input has a value it does not take.
*/
function readInputs(env) {
	return {
		result: optionalInput(env, "result"),
		format: choiceInput(env, "format", ["auto", ...importFormats]),
		mode: choiceInput(env, "mode", ["record", "export"]),
		branch: rawInput(env, "branch"),
		folder: checkFolder(rawInput(env, "folder")),
		suite: optionalInput(env, "suite"),
		labels: parseLabels(linesOf(rawInput(env, "labels"))),
		token: optionalInput(env, "token") ?? env.GITHUB_TOKEN ?? "",
		keepRuns: countInput(env, "keep-runs"),
		keepDays: countInput(env, "keep-days"),
		transcripts: choiceInput(env, "transcripts", [
			"failed",
			"all",
			"none"
		]),
		keepTranscripts: countInput(env, "keep-transcripts"),
		attachments: choiceInput(env, "attachments", [
			"failed",
			"all",
			"none"
		]),
		keepAttachments: countInput(env, "keep-attachments"),
		warnSizeMb: countInput(env, "warn-size-mb"),
		history: choiceInput(env, "history", [
			"auto",
			"squash",
			"keep"
		]),
		...presentationInputs(env),
		redact: linesOf(rawInput(env, "redact")),
		path: optionalInput(env, "path"),
		failOnError: booleanInput(env, "fail-on-error")
	};
}
//#endregion
//#region src/format/store.ts
/** The letter for each trial status in a run summary. */
const trialLetters = {
	pass: "P",
	fail: "F",
	error: "E",
	skip: "S"
};
/** The folder, inside the action's folder, that holds the data. */
const dataFolder = "data";
/** The index's path, relative to the action's folder. */
const indexPath = `${dataFolder}/index.json`;
/**
* A run file's path, relative to the action's folder.
*
* @param runId - The run's id.
* @returns The path.
*/
function runPath(runId) {
	return `${dataFolder}/runs/${runId}.json`;
}
/**
* Turns any id into a name safe in a path and a URL: letters, digits, dot, dash and underscore stay,
* anything else becomes `_` followed by its code point, so different ids never share a name.
*
* @param id - The id, such as a case id.
* @returns The safe name.
*/
function pathSafe(id) {
	return Array.from(id, (character) => /[A-Za-z0-9.-]/.test(character) ? character : `_${character.codePointAt(0)?.toString(16)}`).join("");
}
/**
* The folder holding a run's transcripts, relative to the action's folder.
*
* @param runId - The run's id.
* @returns The path.
*/
function transcriptsFolder(runId) {
	return `${dataFolder}/transcripts/${runId}`;
}
/**
* A transcript's path, relative to the action's folder. The file is gzipped JSON: the trial's
* messages (`StoredMessage[]`), as the result file had them but with stored attachments.
*
* @param runId - The run's id.
* @param caseId - The case's id.
* @param trial - The trial's index, from 0.
* @returns The path.
*/
function transcriptPath(runId, caseId, trial) {
	return `${transcriptsFolder(runId)}/${pathSafe(caseId)}/${trial}.json.gz`;
}
/** The file extension of each attachment type. */
const attachmentExtensions = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
	"image/gif": "gif"
};
/** The folder holding the attachment files, relative to the action's folder. */
const attachmentsFolder = `${dataFolder}/attachments`;
/**
* An attachment's path, relative to the action's folder: one file per distinct content.
*
* @param sha256 - The SHA-256 of its content, in lowercase hex.
* @param mediaType - Its media type.
* @returns The path.
*/
function attachmentPath(sha256, mediaType) {
	return `${attachmentsFolder}/${sha256}.${attachmentExtensions[mediaType]}`;
}
/** The branding the dashboard shows when the project gives none. */
const defaultBranding = {
	title: "evalmark",
	subtitle: "eval dashboard"
};
/** The branding file's path, relative to the action's folder. */
const brandingPath = `${dataFolder}/branding.json`;
/** The folder the project's logo is copied into, relative to the action's folder. */
const brandingFolder = `${dataFolder}/branding`;
//#endregion
//#region src/format/totals.ts
/**
* A case's status from its trials' letters: `skip` when every trial was skipped, `pass` when every
* other trial passed, `fail` when none did, `flaky` otherwise.
*
* @param letters - The trials' letters, as a run summary keeps them, such as `PPF`.
* @returns The status.
*/
function statusOfLetters(letters) {
	const ran = letters.replaceAll(trialLetters.skip, "");
	if (ran.length === 0) return "skip";
	const passed = ran.split("").filter((letter) => letter === trialLetters.pass).length;
	if (passed === ran.length) return "pass";
	return passed === 0 ? "fail" : "flaky";
}
/**
* The letters of a case's trials.
*
* @param trials - The trials.
* @returns One letter per trial, in order.
*/
function lettersOf(trials) {
	return trials.map((trial) => trialLetters[trial.status]).join("");
}
/**
* The totals of a run.
*
* @param cases - Its cases, each with its trials.
* @param durationMs - The run's own duration, when the result gave one.
* @returns The totals.
*/
function totalsOf(cases, durationMs) {
	const trials = cases.flatMap((entry) => entry.trials);
	const statuses = cases.map((entry) => statusOfLetters(lettersOf(entry.trials)));
	const count = (status) => trials.filter((trial) => trial.status === status).length;
	const sum = (pick) => trials.reduce((total, trial) => total + (pick(trial) ?? 0), 0);
	const skipped = count("skip");
	const passed = count("pass");
	const ran = trials.length - skipped;
	return {
		cases: cases.length,
		casesPassed: statuses.filter((status) => status === "pass").length,
		casesFlaky: statuses.filter((status) => status === "flaky").length,
		casesFailed: statuses.filter((status) => status === "fail").length,
		trials: trials.length,
		passed,
		failed: count("fail"),
		errored: count("error"),
		skipped,
		passRate: ran === 0 ? null : passed / ran,
		inputTokens: sum((trial) => trial.usage?.inputTokens),
		outputTokens: sum((trial) => trial.usage?.outputTokens),
		costUsd: sum((trial) => trial.usage?.costUsd),
		durationMs: durationMs ?? sum((trial) => trial.durationMs)
	};
}
//#endregion
//#region src/action/attachment-files.ts
/**
* Finding a result's attachment files on disk. A path is relative to the result file and must
* stay inside its folder, symbolic links included. A file that is not there is reported, not
* fatal: the run is recorded without it.
*/
/**
* Every attachment of a list of messages, their tool calls' included.
*
* @param messages - The messages.
* @returns The attachments.
*/
function messageAttachments(messages) {
	return messages.flatMap((message) => [...message.attachments ?? [], ...(message.toolCalls ?? []).flatMap((call) => call.attachments ?? [])]);
}
/**
* Every attachment path of a result, each once.
*
* @param result - The result.
* @returns The paths, in the order they first appear.
*/
function attachmentPathsOf(result) {
	const attachments = result.cases.flatMap((entry) => entry.trials.flatMap((trial) => [...trial.attachments ?? [], ...messageAttachments(trial.transcript ?? [])]));
	return [...new Set(attachments.map((attachment) => attachment.path))];
}
/**
* Whether a path, written relative to a folder, names something inside it.
*
* @param folder - The folder, absolute.
* @param path - The path, as written.
* @returns `false` when it is absolute or climbs out of the folder.
*/
function staysInside(folder, path) {
	if (isAbsolute(path) || /^[A-Za-z]:|^[\\/]/.test(path)) return false;
	const inside = relative(folder, resolve(folder, path));
	return inside !== "" && inside !== ".." && !inside.startsWith(`..${sep}`) && !isAbsolute(inside);
}
/**
* The SHA-256 of a file's content, read as a stream so a large file is never held in memory.
*
* @param path - The file.
* @returns The hash, in lowercase hex.
*/
async function sha256Of(path) {
	const hash = createHash("sha256");
	for await (const chunk of createReadStream(path)) hash.update(chunk);
	return hash.digest("hex");
}
/**
* Looks for one attachment's file.
*
* @param folder - The result file's folder, absolute and real.
* @param path - The attachment's path, as written.
* @returns The file, or why there is none.
*/
async function lookUp(folder, path) {
	if (!staysInside(folder, path)) return { kind: "unsafe" };
	const source = await realpath(resolve(folder, path)).catch(() => void 0);
	if (source === void 0) return { kind: "missing" };
	if (!staysInside(folder, relative(folder, source))) return { kind: "unsafe" };
	const info = await stat(source);
	if (!info.isFile()) return { kind: "missing" };
	return {
		kind: "found",
		file: {
			source,
			bytes: info.size,
			sha256: await sha256Of(source)
		}
	};
}
/**
* Finds every attachment file of a result.
*
* @param result - The result.
* @param folder - The result file's folder.
* @returns Each path's file, and the paths whose file is missing.
* @throws When a path is absolute or leads outside the folder, with every such path listed.
*/
async function loadAttachments(result, folder) {
	const real = await realpath(resolve(folder));
	const files = /* @__PURE__ */ new Map();
	const missing = [];
	const unsafe = [];
	for (const path of attachmentPathsOf(result)) {
		const found = await lookUp(real, path);
		if (found.kind === "unsafe") unsafe.push(path);
		if (found.kind === "missing") missing.push(path);
		files.set(path, found.kind === "found" ? found.file : void 0);
	}
	if (unsafe.length > 0) {
		const list = unsafe.map((path) => `- ${path}`).join("\n");
		throw new Error(`These attachment paths are not inside the result file's folder (${folder}). Write them relative to it, without \`..\` or links that lead out:\n${list}`);
	}
	return {
		files,
		missing
	};
}
//#endregion
//#region src/action/redact.ts
/**
* Redaction: values that look like secrets, and the strings the workflow names, are replaced in
* every string of a result before anything is stored.
*/
/** What a redacted value becomes. */
const redacted = "[redacted]";
/** The shapes of common secrets. */
const secretPatterns = [
	/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g,
	/\bgh[opsur]_[A-Za-z0-9]{20,}/g,
	/\bgithub_pat_[A-Za-z0-9_]{20,}/g,
	/\bsk-[A-Za-z0-9_-]{20,}/g,
	/\bAIza[A-Za-z0-9_-]{30,}/g,
	/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
	/\bxox[abeprs]-[A-Za-z0-9-]{10,}/g
];
/** A bearer token in a header or a log line; the word `Bearer` stays. */
const bearerPattern = /\b(Bearer\s+)[A-Za-z0-9._~+/=-]{8,}/gi;
/**
* A redactor for the common secret shapes and the given strings.
*
* @param extra - Strings to remove wherever they appear, such as the workflow's token.
* @returns The redactor.
*/
function createRedactor(extra) {
	const literals = [...new Set(extra.filter((entry) => entry.length > 0))].sort((first, second) => second.length - first.length);
	return (text) => {
		let clean = literals.reduce((current, literal) => current.replaceAll(literal, redacted), text);
		for (const pattern of secretPatterns) clean = clean.replace(pattern, redacted);
		return clean.replace(bearerPattern, `$1${redacted}`);
	};
}
/**
* Redacts every string of a value, deep: object keys, object values and array items.
*
* @param value - Any JSON value.
* @param redact - The redactor.
* @returns A copy with every string redacted.
*/
function redactDeep(value, redact) {
	return redactValue(value, redact);
}
/**
* Redacts one value of any type.
*
* @param value - The value.
* @param redact - The redactor.
* @returns The redacted copy.
*/
function redactValue(value, redact) {
	if (typeof value === "string") return redact(value);
	if (Array.isArray(value)) return value.map((item) => redactValue(item, redact));
	if (value === null || typeof value !== "object") return value;
	return Object.fromEntries(Object.entries(value).map(([key, item]) => [redact(key), redactValue(item, redact)]));
}
//#endregion
//#region src/action/numbers.ts
/**
* How numbers read in the comment, the summary and the badges.
*/
/**
* A ratio as a percentage.
*
* @param ratio - From 0 to 1.
* @returns Such as `87.5%`.
*/
function formatPercent(ratio) {
	return `${trimZeros((ratio * 100).toFixed(1))}%`;
}
/**
* Drops a decimal part made of zeros.
*
* @param text - A number with decimals.
* @returns The number without `.0`.
*/
function trimZeros(text) {
	return text.replace(/\.0+$/, "");
}
/**
* An amount in US dollars: cents from a cent up, two significant digits below.
*
* @param usd - The amount, zero or more.
* @returns Such as `$1.25` or `$0.0042`.
*/
function formatCost(usd) {
	const amount = Math.abs(usd);
	const text = amount >= .01 || amount === 0 ? amount.toFixed(2) : amount.toPrecision(2);
	return `${usd < 0 ? "-" : ""}$${amount === 0 ? "0" : text}`;
}
//#endregion
//#region src/action/result-file.ts
/**
* Reading the result file: parse it, validate it against the result format, add the workflow's
* labels and redact secrets. A file another tool wrote (promptfoo, Inspect AI, JUnit XML) is
* imported first, into one result per model.
*/
/**
* Lists a validation's issues, one per line, each with where it is in the file.
*
* @param issues - The issues zod found.
* @returns The lines.
*/
function describeIssues(issues) {
	return issues.slice(0, 20).map((issue) => {
		return `- ${issue.path.length === 0 ? "the file" : issue.path.map(String).join(".")}: ${issue.message}`;
	}).join("\n");
}
/**
* Validates parsed JSON as a result.
*
* @param data - The parsed file.
* @param path - The file's path, for the message.
* @returns The result.
* @throws When the data is not a valid result, with every issue listed.
*/
function parseResult(data, path) {
	const parsed = resultSchema.safeParse(data);
	if (parsed.success) return parsed.data;
	throw new Error(`The result file ${path} is not a valid result:\n${describeIssues(parsed.error.issues)}`);
}
/**
* Reads and validates a result file, adds labels over its own, and redacts it.
*
* @param path - The file's path.
* @param labels - Labels to add, which win over the result's own.
* @param redact - The redactor.
* @returns The result, ready to record.
* @throws When the file is missing, is not JSON, or is not a valid result.
*/
async function readResult(path, labels, redact) {
	const text = await readFile(path, "utf8").catch((error) => {
		throw new Error(`The result file ${path} could not be read: ${String(error)}`);
	});
	let data;
	try {
		data = JSON.parse(text);
	} catch (error) {
		throw new Error(`The result file ${path} is not JSON: ${String(error)}`);
	}
	const result = parseResult(data, path);
	return redactDeep({
		...result,
		labels: {
			...result.labels,
			...labels
		}
	}, redact);
}
//#endregion
//#region src/action/size.ts
/**
* The folder's size: measured after each recording, reported in the job summary, and warned
* about above `warn-size-mb`, with the inputs that make it smaller.
*/
/** A megabyte, as disks count it. */
const megabyte = 1e6;
/**
* The size of every file under a folder, in bytes.
*
* @param folder - The folder.
* @returns The sum of the sizes of its files, `0` when it does not exist.
*/
async function folderSize(folder) {
	const entries = await readdir(folder, {
		recursive: true,
		withFileTypes: true
	}).catch(() => []);
	let total = 0;
	for (const entry of entries.filter((item) => item.isFile())) total += (await stat(join(entry.parentPath, entry.name))).size;
	return total;
}
/**
* A size in bytes, for a reader: `950 B`, `12.3 kB`, `4.5 MB`, `1.2 GB`.
*
* @param bytes - The size.
* @returns The text.
*/
function formatBytes(bytes) {
	const units = [
		"kB",
		"MB",
		"GB",
		"TB"
	];
	if (bytes < 1e3) return `${bytes} B`;
	let value = bytes / 1e3;
	let unit = 0;
	for (; value >= 1e3 && unit < units.length - 1; unit += 1) value /= 1e3;
	return `${value >= 100 ? Math.round(value) : Number(value.toFixed(1))} ${units[unit]}`;
}
/**
* A count with its noun, singular or plural.
*
* @param count - The count.
* @param noun - The noun, singular.
* @returns The text, such as `1 run` or `3 runs`.
*/
function counted(count, noun) {
	return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
/**
* What retention pruned, in words.
*
* @param pruned - What it pruned.
* @returns The text, such as `2 runs, the transcripts of 1 run`, or `nothing`.
*/
function prunedText(pruned) {
	const parts = [
		pruned.runs > 0 ? counted(pruned.runs, "run") : "",
		pruned.transcripts > 0 ? `the transcripts of ${counted(pruned.transcripts, "run")}` : "",
		pruned.attachments > 0 ? `the attachments of ${counted(pruned.attachments, "run")}` : "",
		pruned.files > 0 ? counted(pruned.files, "attachment file") : ""
	].filter((part) => part !== "");
	return parts.length === 0 ? "nothing" : parts.join(", ");
}
/**
* The summary's last line: the folder's size, the threshold, what the run added and what
* retention pruned.
*
* @param report - What it reports.
* @returns The line.
*/
function sizeLine(report) {
	const threshold = report.warnSizeMb === 0 ? "no size warning" : `warning above ${formatBytes(report.warnSizeMb * megabyte)}`;
	return [
		`The \`${report.folder}\` folder is ${formatBytes(report.folderBytes)} (${threshold}).`,
		`This run added ${formatBytes(report.addedBytes)}.`,
		`Retention pruned ${prunedText(report.pruned)}.`
	].join(" ");
}
/**
* The warning when the folder is above the threshold.
*
* @param report - What the size line reports.
* @returns The warning, or `undefined` when the folder is within it or the threshold is `0`.
*/
function sizeWarning(report) {
	const limit = report.warnSizeMb * megabyte;
	if (limit === 0 || report.folderBytes <= limit) return void 0;
	return [`The \`${report.folder}\` folder is ${formatBytes(report.folderBytes)}, above \`warn-size-mb\` (${formatBytes(limit)}).`, "To make it smaller, lower `keep-runs`, `keep-transcripts` or `keep-attachments`, or set `attachments: none`."].join(" ");
}
//#endregion
//#region src/action/source.ts
/**
* Where a run comes from: the workflow's `GITHUB_*` variables and its event payload give the
* repository, commit, branch, pull request and workflow run, and the run's id.
*/
/**
* A run's id: its start time, then the workflow run and attempt, or a random suffix outside
* Actions. It is safe in a path and a URL.
*
* @param startedAt - When the run started, as an ISO time.
* @param env - The environment.
* @returns The id, such as `20261008T100000Z-1234567-1`.
*/
function runIdOf(startedAt, env) {
	return `${new Date(startedAt).toISOString().replace(/\.\d+Z$/, "Z").replaceAll("-", "").replaceAll(":", "")}-${env.GITHUB_RUN_ID ? `${env.GITHUB_RUN_ID}-${env.GITHUB_RUN_ATTEMPT ?? "1"}` : randomBytes(4).toString("hex")}`.replace(/[^A-Za-z0-9.-]/g, "_");
}
//#endregion
//#region src/action/badges.ts
/**
* Badges for the default branch's latest run: pass rate and cost, as flat SVG images and as
* shields.io endpoint files, in `badges/` inside the folder.
*/
/** The folder of the badges, inside the action's folder. */
const badgesFolder = "badges";
/**
* Escapes text for XML.
*
* @param text - The text.
* @returns The escaped text.
*/
function escapeXml(text) {
	return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&apos;");
}
/**
* The width a text takes in the badge's 11px font, roughly.
*
* @param text - The text.
* @returns The width in pixels.
*/
function textWidth(text) {
	return Math.round(Array.from(text).length * 6.6) + 10;
}
/**
* A flat badge as SVG.
*
* @param badge - Its text and colour.
* @returns The SVG document.
*/
function badgeSvg(badge) {
	const [label, message] = [escapeXml(badge.label), escapeXml(badge.message)];
	const [left, right] = [textWidth(badge.label), textWidth(badge.message)];
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${left + right}" height="20" role="img" aria-label="${label}: ${message}">`,
		`<title>${label}: ${message}</title>`,
		`<rect width="${left}" height="20" fill="#555"/>`,
		`<rect x="${left}" width="${right}" height="20" fill="${escapeXml(badge.color)}"/>`,
		"<g fill=\"#fff\" text-anchor=\"middle\" font-family=\"Verdana,Geneva,DejaVu Sans,sans-serif\" font-size=\"11\">",
		`<text x="${left / 2}" y="14">${label}</text>`,
		`<text x="${left + right / 2}" y="14">${message}</text>`,
		"</g></svg>",
		""
	].join("\n");
}
/**
* A shields.io endpoint file for a badge.
*
* @param badge - Its text and colour.
* @returns The JSON text.
*/
function badgeEndpoint(badge) {
	const color = badge.color.replace(/^#/, "");
	return `${JSON.stringify({
		schemaVersion: 1,
		label: badge.label,
		message: badge.message,
		color
	})}\n`;
}
/**
* The colour of a pass rate.
*
* @param passRate - The pass rate, from 0 to 1, or `null`.
* @returns A hex colour.
*/
function passRateColor(passRate) {
	if (passRate === null) return "#9f9f9f";
	if (passRate >= .9) return "#4c1";
	if (passRate >= .75) return "#97ca00";
	if (passRate >= .5) return "#dfb317";
	return "#e05d44";
}
/**
* The badges of a run.
*
* @param run - The run.
* @returns The badges, by file name without extension.
*/
function badgesOf(run) {
	const { passRate, costUsd } = run.totals;
	return {
		"pass-rate": {
			label: "pass rate",
			message: passRate === null ? "n/a" : formatPercent(passRate),
			color: passRateColor(passRate)
		},
		cost: {
			label: "eval cost",
			message: formatCost(costUsd),
			color: "#007ec6"
		}
	};
}
/**
* The run the badges show: the newest on the default branch, or the newest when it is unknown.
*
* @param runs - The runs, newest first.
* @param defaultBranch - The default branch, when known.
* @returns The run, or `undefined` when the default branch has none.
*/
function badgeRun(runs, defaultBranch) {
	if (defaultBranch === void 0) return runs[0];
	return runs.find((run) => run.source.branch === defaultBranch);
}
/**
* Writes the badges of a run into the folder.
*
* @param folder - The action's folder on disk.
* @param run - The run they show.
* @returns When they are written.
*/
async function writeBadges(folder, run) {
	const target = join(folder, badgesFolder);
	await mkdir(target, { recursive: true });
	for (const [name, badge] of Object.entries(badgesOf(run))) {
		await writeFile(join(target, `${name}.svg`), badgeSvg(badge));
		await writeFile(join(target, `${name}.json`), badgeEndpoint(badge));
	}
}
//#endregion
//#region src/action/index-file.ts
/**
* The index, `data/index.json`, rebuilt from every run file in the folder. As it never merges, two
* runs recorded at once never conflict: each adds its own file and the index follows.
*/
/**
* Writes a file as JSON, creating its folder.
*
* @param path - The file's path.
* @param data - What to write.
* @returns When it is written.
*/
async function writeJson(path, data) {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, `${JSON.stringify(data)}\n`);
}
/**
* Sorts runs newest first by start time, then by id.
*
* @param runs - The runs.
* @returns A sorted copy.
*/
function newestFirst(runs) {
	return [...runs].sort((first, second) => second.startedAt.localeCompare(first.startedAt) || second.id.localeCompare(first.id));
}
/**
* Reads every run file in the folder. A file that is not JSON is skipped.
*
* @param folder - The action's folder on disk.
* @returns The runs, newest first.
*/
async function readRuns(folder) {
	const runsFolder = join(folder, dataFolder, "runs");
	const names = await readdir(runsFolder).catch(() => []);
	const runs = [];
	for (const name of names.filter((entry) => entry.endsWith(".json"))) try {
		runs.push(JSON.parse(await readFile(join(runsFolder, name), "utf8")));
	} catch {}
	return newestFirst(runs);
}
/**
* A run's summary for the index.
*
* @param run - The run.
* @returns Its summary.
*/
function summaryOf(run) {
	return {
		id: run.id,
		recordedAt: run.recordedAt,
		startedAt: run.startedAt,
		labels: run.labels,
		source: run.source,
		totals: run.totals,
		cases: Object.fromEntries(run.cases.map((entry) => [entry.id, lettersOf(entry.trials)])),
		transcripts: run.cases.some((entry) => entry.trials.some((trial) => trial.transcript))
	};
}
/**
* Every case's title and tags, from the newest run that has the case.
*
* @param runs - The runs, newest first.
* @returns The cases, by id.
*/
function casesOf(runs) {
	const cases = {};
	for (const entry of runs.flatMap((run) => run.cases)) {
		if (cases[entry.id] !== void 0) continue;
		cases[entry.id] = {
			...entry.title === void 0 ? {} : { title: entry.title },
			...entry.tags === void 0 ? {} : { tags: entry.tags }
		};
	}
	return cases;
}
/**
* Builds the index from the runs.
*
* @param runs - The runs, in any order.
* @param suite - The suite's name.
* @param updatedAt - When the index is written, as an ISO time.
* @returns The index.
*/
function buildIndex(runs, suite, updatedAt) {
	const sorted = newestFirst(runs);
	return {
		version: 1,
		suite,
		updatedAt,
		runs: sorted.map(summaryOf),
		cases: casesOf(sorted)
	};
}
//#endregion
//#region src/action/branding.ts
/**
* The dashboard's branding: the title, the line under it and the logo the project gives through
* the action's inputs, written into the folder on every run.
*/
/** The image types a logo may have: what every browser shows in an `<img>`. */
const logoExtensions = /* @__PURE__ */ new Set([
	".svg",
	".png",
	".webp",
	".jpg",
	".jpeg",
	".gif"
]);
/**
* Checks a logo file.
*
* @param path - Its path.
* @returns Its extension, in lower case.
* @throws When the file is missing or is not an image a browser shows.
*/
function logoExtension(path) {
	const extension = extname(path).toLowerCase();
	if (!logoExtensions.has(extension)) throw new Error(`The logo ${path} must be an SVG, PNG, WebP, JPEG or GIF image.`);
	if (!existsSync(path)) throw new Error(`The logo ${path} does not exist.`);
	return extension;
}
/**
* Writes the branding into the folder: the logo copied as `data/branding/logo.<ext>`, the previous
* one removed, and `data/branding.json`.
*
* @param folder - The action's folder on disk.
* @param input - The branding the inputs give.
* @returns When it is written.
* @throws When the logo is missing or is not an image.
*/
async function writeBranding(folder, input) {
	await rm(join(folder, brandingFolder), {
		recursive: true,
		force: true
	});
	let logo;
	if (input.logo !== void 0) {
		logo = `${brandingFolder}/logo${logoExtension(input.logo)}`;
		await mkdir(join(folder, brandingFolder), { recursive: true });
		await copyFile(input.logo, join(folder, logo));
	}
	const branding = {
		title: input.title,
		subtitle: input.subtitle,
		...logo === void 0 ? {} : { logo }
	};
	await writeJson(join(folder, brandingPath), branding);
}
//#endregion
//#region src/action/attachment-store.ts
/**
* Whether a trial keeps its attachment files.
*
* @param trial - The trial.
* @param policy - The attachments policy.
* @returns `true` when the policy keeps its files.
*/
function keepsAttachments(trial, policy) {
	if (policy === "all") return true;
	return policy === "failed" && trial.status !== "pass";
}
/**
* One attachment as stored, its file collected when it is kept.
*
* @param attachment - The attachment, as the result has it.
* @param context - The files, whether to keep them, and where to collect them.
* @returns The stored attachment.
*/
function storedAttachment(attachment, context) {
	const found = context.files.get(attachment.path);
	const caption = attachment.caption === void 0 ? {} : { caption: attachment.caption };
	const base = {
		mediaType: attachment.mediaType,
		...caption,
		bytes: found?.bytes ?? 0
	};
	if (found === void 0) return {
		...base,
		missing: true
	};
	if (!context.keep) return base;
	const file = attachmentPath(found.sha256, attachment.mediaType);
	if (!context.copies.has(file)) context.copies.set(file, found.source);
	return {
		...base,
		file
	};
}
/**
* A list of attachments as stored.
*
* @param attachments - The attachments.
* @param context - The files, whether to keep them, and where to collect them.
* @returns The stored attachments.
*/
function storedAttachments(attachments, context) {
	return attachments.map((attachment) => storedAttachment(attachment, context));
}
/**
* A tool call as stored.
*
* @param call - The tool call.
* @param context - The files, whether to keep them, and where to collect them.
* @returns The stored tool call.
*/
function storedToolCall(call, context) {
	const { attachments, ...rest } = call;
	if (attachments === void 0) return rest;
	return {
		...rest,
		attachments: storedAttachments(attachments, context)
	};
}
/**
* A transcript as stored: the attachments of its messages and tool calls are stored ones.
*
* @param messages - The trial's messages.
* @param context - The files, whether to keep them, and where to collect them.
* @returns The stored messages.
*/
function storedTranscript(messages, context) {
	return messages.map(({ attachments, toolCalls, ...message }) => ({
		...message,
		...toolCalls === void 0 ? {} : { toolCalls: toolCalls.map((call) => storedToolCall(call, context)) },
		...attachments === void 0 ? {} : { attachments: storedAttachments(attachments, context) }
	}));
}
/**
* Attachments without their files, as retention leaves them.
*
* @param attachments - The stored attachments.
* @returns The same attachments without `file`.
*/
function withoutFiles(attachments) {
	return attachments.map(({ file: _dropped, ...attachment }) => attachment);
}
/**
* Something that may hold attachments, without their files.
*
* @param holder - A stored trial, message or tool call.
* @returns The same, its attachments without `file`.
*/
function unattached(holder) {
	if (holder.attachments === void 0) return holder;
	return {
		...holder,
		attachments: withoutFiles(holder.attachments)
	};
}
/**
* A stored transcript whose attachments no longer point to files.
*
* @param messages - The stored messages.
* @returns The messages, every attachment without `file`.
*/
function transcriptWithoutFiles(messages) {
	return messages.map((message) => {
		const own = unattached(message);
		if (own.toolCalls === void 0) return own;
		return {
			...own,
			toolCalls: own.toolCalls.map(unattached)
		};
	});
}
//#endregion
//#region src/action/build-run.ts
/**
* Whether a trial's transcript is kept.
*
* @param trial - The trial.
* @param policy - The transcript policy.
* @returns `true` when it has a transcript the policy keeps.
*/
function keepsTranscript(trial, policy) {
	if (!trial.transcript || trial.transcript.length === 0) return false;
	if (policy === "all") return true;
	return policy === "failed" && trial.status !== "pass";
}
/**
* Builds a trial as stored, collecting its kept transcript and attachment files.
*
* @param trial - The trial.
* @param path - Where its transcript goes when it is kept.
* @param draft - The draft, for the policies and the files.
* @param collected - Where the transcripts and the files are added.
* @returns The stored trial.
*/
function storedTrial(trial, path, draft, collected) {
	const { transcript, attachments, ...rest } = trial;
	const context = {
		files: draft.attachmentFiles,
		keep: keepsAttachments(trial, draft.attachments),
		copies: collected.copies
	};
	const own = attachments === void 0 ? rest : {
		...rest,
		attachments: storedAttachments(attachments, context)
	};
	if (transcript === void 0) return own;
	if (!keepsTranscript(trial, draft.transcripts)) return {
		...own,
		transcriptMessages: transcript.length
	};
	collected.transcripts.push({
		path,
		messages: storedTranscript(transcript, context)
	});
	return {
		...own,
		transcript: path,
		transcriptMessages: transcript.length
	};
}
/**
* Builds a case as stored, collecting the transcripts and attachment files it keeps.
*
* @param entry - The case.
* @param draft - The draft, for the id, the policies and the files.
* @param collected - Where the transcripts and the files are added.
* @returns The stored case.
*/
function storedCase(entry, draft, collected) {
	const trials = entry.trials.map((trial, index) => storedTrial(trial, transcriptPath(draft.id, entry.id, index), draft, collected));
	return {
		...entry,
		trials,
		status: statusOfLetters(lettersOf(entry.trials))
	};
}
/**
* Builds the run from its draft.
*
* @param draft - The draft.
* @returns The run, and the transcripts and attachment files to write.
*/
function buildRun(draft) {
	const { result } = draft;
	const collected = {
		transcripts: [],
		copies: /* @__PURE__ */ new Map()
	};
	const cases = result.cases.map((entry) => storedCase(entry, draft, collected));
	const files = [...collected.copies.keys()].sort();
	const run = {
		version: 1,
		id: draft.id,
		suite: draft.suite,
		recordedAt: draft.recordedAt,
		startedAt: new Date(result.startedAt ?? draft.recordedAt).toISOString(),
		labels: result.labels ?? {},
		source: draft.source,
		totals: totalsOf(result.cases, result.durationMs),
		cases,
		...files.length === 0 ? {} : { attachmentFiles: files }
	};
	const attachments = files.map((path) => ({
		path,
		source: collected.copies.get(path) ?? ""
	}));
	return {
		run,
		transcripts: collected.transcripts,
		attachments
	};
}
//#endregion
//#region src/action/attachment-retention.ts
/**
* Retention of attachment files. A run past `keep-attachments` loses its files: its trials and
* transcripts keep each attachment's media type, caption and size, without `file`. Files are
* shared by content across runs, so a file is deleted only once no kept run points to it.
*/
/**
* Whether a run still points to attachment files.
*
* @param run - The run.
* @returns `true` when its trials or transcripts point to one.
*/
function hasAttachmentFiles(run) {
	return (run.attachmentFiles?.length ?? 0) > 0;
}
/**
* The attachment files a run's trials point to, transcripts left out.
*
* @param run - The run.
* @returns The files, each once, sorted.
*/
function trialAttachmentFiles(run) {
	const files = run.cases.flatMap((entry) => entry.trials.flatMap((trial) => (trial.attachments ?? []).map((attachment) => attachment.file)));
	return [...new Set(files.filter((file) => file !== void 0))].sort();
}
/**
* A run whose attachments no longer point to files.
*
* @param run - The run.
* @returns The run, every trial attachment without `file`, and no `attachmentFiles`.
*/
function withoutAttachmentFiles(run) {
	const { attachmentFiles: _dropped, ...rest } = run;
	return {
		...rest,
		cases: run.cases.map((entry) => ({
			...entry,
			trials: entry.trials.map(unattached)
		}))
	};
}
/**
* Rewrites a run's kept transcripts so their attachments no longer point to files.
*
* @param folder - The action's folder on disk.
* @param run - The run, as it is kept.
* @returns When every transcript is rewritten. A transcript that cannot be read is left as it is.
*/
async function unattachTranscripts(folder, run) {
	const paths = run.cases.flatMap((entry) => entry.trials.map((trial) => trial.transcript));
	for (const path of paths.filter((entry) => entry !== void 0)) try {
		const file = join(folder, path);
		const messages = JSON.parse(gunzipSync(await readFile(file)).toString());
		await writeFile(file, gzipSync(JSON.stringify(transcriptWithoutFiles(messages))));
	} catch {}
}
/**
* Deletes every attachment file no kept run points to.
*
* @param folder - The action's folder on disk.
* @param kept - The runs kept, as they are kept.
* @returns How many files it deleted.
*/
async function sweepAttachments(folder, kept) {
	const used = new Set(kept.flatMap((run) => run.attachmentFiles ?? []));
	const unused = (await readdir(join(folder, attachmentsFolder)).catch(() => [])).filter((name) => !used.has(`${attachmentsFolder}/${name}`));
	for (const name of unused) await rm(join(folder, attachmentsFolder, name), {
		force: true,
		recursive: true
	});
	return unused.length;
}
//#endregion
//#region src/action/retention.ts
/**
* Retention: which runs the folder keeps, and which of them keep their transcripts and their
* attachment files. The run just recorded is always kept.
*/
/** A day, in milliseconds. */
const day = 864e5;
/**
* Whether a run has any transcript kept.
*
* @param run - The run.
* @returns `true` when one of its trials points to a transcript.
*/
function hasTranscripts(run) {
	return run.cases.some((entry) => entry.trials.some((trial) => trial.transcript !== void 0));
}
/**
* A run without its transcript paths. The message counts stay, and the run's attachment files
* are only those its trials point to.
*
* @param run - The run.
* @returns The run, its trials pointing to no transcript.
*/
function withoutTranscripts(run) {
	const { attachmentFiles: _files, ...rest } = run;
	const stripped = {
		...rest,
		cases: run.cases.map((entry) => ({
			...entry,
			trials: entry.trials.map(({ transcript: _dropped, ...trial }) => trial)
		}))
	};
	const files = trialAttachmentFiles(stripped);
	return files.length === 0 ? stripped : {
		...stripped,
		attachmentFiles: files
	};
}
/**
* The runs past the newest ones that still have something to prune.
*
* @param runs - The kept runs, newest first.
* @param limit - How many of the newest runs keep it; `0` keeps it on every run.
* @param has - Whether a run still has it.
* @returns The runs to prune it from.
*/
function pastLimit(runs, limit, has) {
	return runs.filter((run, position) => limit > 0 && position >= limit && has(run));
}
/**
* Applies a pruning to the runs it names.
*
* @param runs - The runs.
* @param pruned - The runs to prune.
* @param prune - The pruning.
* @returns The runs, the named ones pruned.
*/
function pruneSome(runs, pruned, prune) {
	const ids = new Set(pruned.map((run) => run.id));
	return runs.map((run) => ids.has(run.id) ? prune(run) : run);
}
/**
* Plans the retention.
*
* @param runs - Every run, newest first.
* @param recordedId - The run just recorded, which is always kept.
* @param options - How much to keep.
* @param now - The current time.
* @returns The plan.
*/
function planRetention(runs, recordedId, options, now) {
	const cutoff = now.getTime() - options.keepDays * day;
	const keeps = (run, position) => run.id === recordedId || (options.keepRuns === 0 || position < options.keepRuns) && (options.keepDays === 0 || Date.parse(run.startedAt) >= cutoff);
	const kept = runs.filter(keeps);
	const removed = runs.filter((run, position) => !keeps(run, position));
	const stripped = pastLimit(kept, options.keepTranscripts, hasTranscripts);
	const withTranscripts = pruneSome(kept, stripped, withoutTranscripts);
	const unattached = pastLimit(withTranscripts, options.keepAttachments, hasAttachmentFiles);
	return {
		kept: pruneSome(withTranscripts, unattached, withoutAttachmentFiles),
		removed,
		stripped,
		unattached
	};
}
/**
* Applies a plan to the folder: deletes removed runs and their transcripts, deletes or rewrites the
* pruned transcripts, rewrites the pruned runs, and deletes the attachment files no kept run uses.
*
* @param folder - The action's folder on disk.
* @param plan - The plan.
* @returns What it pruned.
*/
async function applyRetention(folder, plan) {
	for (const run of plan.removed) {
		await rm(join(folder, runPath(run.id)), { force: true });
		await rm(join(folder, transcriptsFolder(run.id)), {
			recursive: true,
			force: true
		});
	}
	for (const run of plan.stripped) await rm(join(folder, transcriptsFolder(run.id)), {
		recursive: true,
		force: true
	});
	const changed = new Set([...plan.stripped, ...plan.unattached].map((run) => run.id));
	const unattached = new Set(plan.unattached.map((run) => run.id));
	for (const run of plan.kept.filter((entry) => changed.has(entry.id))) {
		if (unattached.has(run.id)) await unattachTranscripts(folder, run);
		await writeJson(join(folder, runPath(run.id)), run);
	}
	return {
		runs: plan.removed.length,
		transcripts: plan.stripped.length,
		attachments: plan.unattached.length,
		files: await sweepAttachments(folder, plan.kept)
	};
}
/**
* Whether retention pruned anything, which lets `history: auto` squash the history.
*
* @param pruned - What it pruned.
* @returns `true` when it removed or rewrote anything.
*/
function prunedAnything(pruned) {
	return pruned.runs + pruned.transcripts + pruned.attachments + pruned.files > 0;
}
//#endregion
//#region src/action/site.ts
/**
* The dashboard's files: found next to the running bundle, and copied into the folder over the
* previous version, leaving the data and the badges alone.
*/
/** What the folder holds besides the dashboard, which a new dashboard never replaces. */
const kept = /* @__PURE__ */ new Set([dataFolder, badgesFolder]);
/**
* The built dashboard's folder: `site/` next to the bundle, `dist/index.js`, or the repository's
* `dist/site/` when the action runs from its sources.
*
* @returns The folder's path.
*/
function defaultSiteDir() {
	const bundled = fileURLToPath(new URL("./site/", import.meta.url));
	if (existsSync(join(bundled, "index.html"))) return bundled;
	return fileURLToPath(new URL("../../dist/site/", import.meta.url));
}
/**
* Copies the dashboard into the folder. Files of a previous dashboard are removed first; `data/`
* and `badges/` stay as they are.
*
* @param siteDir - The built dashboard's folder.
* @param folder - The action's folder on disk.
* @returns When it is copied.
* @throws When the dashboard is not built.
*/
async function copySite(siteDir, folder) {
	if (!existsSync(join(siteDir, "index.html"))) throw new Error(`The dashboard is not built: ${siteDir} has no index.html.`);
	const current = await readdir(folder).catch(() => []);
	for (const name of current.filter((entry) => !kept.has(entry))) await rm(join(folder, name), {
		recursive: true,
		force: true
	});
	const files = await readdir(siteDir);
	for (const name of files.filter((entry) => !kept.has(entry))) await cp(join(siteDir, name), join(folder, name), { recursive: true });
}
//#endregion
//#region src/action/store.ts
/**
* The store: records a run into the action's folder on disk. It writes the run file and its
* transcripts, applies retention, rebuilds the index, writes the badges and copies the dashboard.
* It knows nothing of git, so the CLI records into any local folder with it.
*/
/**
* A run id the folder does not have yet: the draft's, or the draft's with `-2`, `-3`, and so on.
*
* @param folder - The action's folder on disk.
* @param id - The draft's id.
* @returns The free id.
*/
function freeId(folder, id) {
	let candidate = id;
	for (let count = 2; existsSync(join(folder, runPath(candidate))); count += 1) candidate = `${id}-${count}`;
	return candidate;
}
/**
* Copies a run's attachment files into the folder. A file the folder has already, from another
* trial or an earlier run, is the same content and is not copied again.
*
* @param folder - The action's folder on disk.
* @param built - The run and its attachment files.
* @returns The bytes of the files it copied.
*/
async function copyAttachments(folder, built) {
	let added = 0;
	for (const attachment of built.attachments) {
		const path = join(folder, attachment.path);
		if (existsSync(path)) continue;
		await mkdir(dirname(path), { recursive: true });
		await copyFile(attachment.source, path);
		added += (await stat(path)).size;
	}
	return added;
}
/**
* Writes a built run's file, its gzipped transcripts and its attachment files.
*
* @param folder - The action's folder on disk.
* @param built - The run, its transcripts and its attachments.
* @returns The bytes of the files it added.
*/
async function writeRun(folder, built) {
	let added = await copyAttachments(folder, built);
	for (const transcript of built.transcripts) {
		const path = join(folder, transcript.path);
		const content = gzipSync(JSON.stringify(transcript.messages));
		await mkdir(dirname(path), { recursive: true });
		await writeFile(path, content);
		added += content.length;
	}
	const runFile = join(folder, runPath(built.run.id));
	await writeJson(runFile, built.run);
	return added + (await stat(runFile)).size;
}
/**
* Records a run into the folder.
*
* @param folder - The action's folder on disk; created when missing.
* @param draft - The run's draft.
* @param options - Retention, badges, the dashboard and the time.
* @returns The stored run, the index, what was pruned, and the folder's size.
*/
async function storeRun(folder, draft, options) {
	await mkdir(folder, { recursive: true });
	const built = buildRun({
		...draft,
		id: freeId(folder, draft.id)
	});
	const addedBytes = await writeRun(folder, built);
	const plan = planRetention(await readRuns(folder), built.run.id, options, options.now);
	const retention = await applyRetention(folder, plan);
	const index = buildIndex(plan.kept, draft.suite, options.now.toISOString());
	await writeJson(join(folder, indexPath), index);
	const shown = badgeRun(index.runs, options.defaultBranch);
	if (options.badges && shown) await writeBadges(folder, shown);
	await copySite(options.siteDir, folder);
	await writeBranding(folder, options.branding ?? {
		...defaultBranding,
		logo: void 0
	});
	const folderBytes = await folderSize(folder);
	return {
		run: built.run,
		index,
		pruned: prunedAnything(retention),
		retention,
		folderBytes,
		addedBytes
	};
}
//#endregion
//#region src/action/record.ts
/**
* The warning about attachment files the result names but that are not there.
*
* @param paths - Their paths.
* @returns The warning, naming the first ten.
*/
function missingText(paths) {
	const named = paths.slice(0, 10).join(", ");
	const more = paths.length > 10 ? ` and ${paths.length - 10} more` : "";
	return `The result names ${paths.length} attachment file(s) that are not there, recorded without their file: ${named}${more}.`;
}
/**
* The size report of a recording.
*
* @param outcome - What recording did.
* @param folder - The folder, as the inputs name it.
* @param warnSizeMb - The size in megabytes above which the action warns.
* @returns The report.
*/
function sizeReportOf(outcome, folder, warnSizeMb) {
	const { folderBytes, addedBytes, retention } = outcome;
	return {
		folder,
		folderBytes,
		addedBytes,
		warnSizeMb,
		pruned: retention
	};
}
//#endregion
//#region src/cli/demo-catalog.ts
/** The models compared: one cheap and fast, one strong and costly, one self-hosted. */
const demoModels = [
	{
		name: "gemini-3.8-flash",
		provider: "google",
		skill: .74,
		inputPrice: .3,
		outputPrice: 2.5,
		secondsPerTurn: 3
	},
	{
		name: "claude-sonnet-5",
		provider: "anthropic",
		skill: .9,
		inputPrice: 3,
		outputPrice: 15,
		secondsPerTurn: 5
	},
	{
		name: "qwen-4-32b",
		provider: "self-hosted",
		skill: .52,
		inputPrice: .05,
		outputPrice: .2,
		secondsPerTurn: 8
	}
];
/** The sources the agent can read. */
const demoSources = [
	{
		id: "prom",
		kind: "prometheus",
		schema: { metrics: [
			"http_requests_total",
			"http_request_duration_seconds",
			"node_cpu_seconds_total"
		] }
	},
	{
		id: "pg",
		kind: "postgres",
		schema: { tables: [{
			name: "orders",
			columns: [
				"id",
				"customer_id",
				"created_at",
				"total_cents",
				"country"
			]
		}, {
			name: "signups",
			columns: [
				"id",
				"created_at",
				"step"
			]
		}] }
	},
	{
		id: "loki",
		kind: "loki",
		schema: { labels: [
			"service",
			"level",
			"namespace"
		] }
	},
	{
		id: "ch",
		kind: "clickhouse",
		schema: { tables: [{
			name: "events",
			columns: [
				"ts",
				"customer",
				"kind",
				"bytes"
			]
		}] }
	}
];
/** The two checks every case makes, before its own. */
const commonChecks = [{
	id: "built",
	description: "A dashboard was built"
}, {
	id: "query-runs",
	description: "Every panel's query runs without an error"
}];
/** The cases of the demo suite. */
const demoCases = [
	{
		id: "http-errors-by-route",
		title: "HTTP errors by route",
		input: "Show me the HTTP error rate by route over the last day",
		tags: ["prometheus", "timeseries"],
		source: "prom",
		query: "sum by (route) (rate(http_requests_total{status=~\"5..\"}[5m])) / sum by (route) (rate(http_requests_total[5m]))",
		panel: "timeseries",
		mistake: {
			query: "sum by (route) (rate(http_requests_total{status=~\"5..\"}[5m])",
			error: "parse error at char 61: unclosed left parenthesis"
		},
		check: {
			id: "grouped-by-route",
			description: "The panel has one series per route",
			failure: "The panel has one series in all, not one per route."
		},
		difficulty: .15
	},
	{
		id: "p95-latency",
		title: "p95 latency",
		input: "What is our p95 latency per service this week?",
		tags: [
			"prometheus",
			"timeseries",
			"histogram"
		],
		source: "prom",
		query: "histogram_quantile(0.95, sum by (le, service) (rate(http_request_duration_seconds_bucket[5m])))",
		panel: "timeseries",
		mistake: {
			query: "quantile(0.95, http_request_duration_seconds)",
			error: "expected type instant vector in aggregation expression, got range vector"
		},
		check: {
			id: "uses-histogram-quantile",
			description: "The query uses histogram_quantile over the buckets",
			failure: "The query averages the durations instead of reading the histogram."
		},
		difficulty: .3
	},
	{
		id: "cpu-by-node",
		title: "CPU by node",
		input: "CPU usage of every node, as a percentage",
		tags: ["prometheus", "timeseries"],
		source: "prom",
		query: "100 * (1 - avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])))",
		panel: "timeseries",
		mistake: {
			query: "avg by (instance) (node_cpu_seconds_total{mode=\"idle\"})",
			error: "The query returned a counter: use rate() over it."
		},
		check: {
			id: "unit-percent",
			description: "The panel shows a percentage",
			failure: "The panel shows a ratio from 0 to 1 with no unit."
		},
		difficulty: .1
	},
	{
		id: "orders-per-day",
		title: "Orders per day",
		input: "How many orders did we get each day this month?",
		tags: ["postgres", "bar"],
		source: "pg",
		query: "select date_trunc('day', created_at) as day, count(*) from orders where created_at >= date_trunc('month', now()) group by 1 order by 1",
		panel: "bar",
		mistake: {
			query: "select created_at, count(*) from order where created_at >= date_trunc('month', now())",
			error: "relation \"order\" does not exist"
		},
		check: {
			id: "daily-buckets",
			description: "The query groups by day",
			failure: "The query groups by created_at itself, not by date_trunc('day', created_at)."
		},
		difficulty: .2
	},
	{
		id: "revenue-by-country",
		title: "Revenue by country",
		input: "Revenue by country for the last quarter, biggest first",
		tags: ["postgres", "table"],
		source: "pg",
		query: "select country, sum(total_cents) / 100.0 as revenue from orders where created_at >= now() - interval '3 months' group by 1 order by 2 desc",
		panel: "table",
		mistake: {
			query: "select country, sum(total) from orders group by 1",
			error: "column \"total\" does not exist"
		},
		check: {
			id: "in-currency",
			description: "Revenue is in currency units, not cents",
			failure: "The revenue column is in cents."
		},
		difficulty: .25
	},
	{
		id: "slowest-queries",
		title: "Slowest database queries",
		input: "Which queries are the slowest on the main database?",
		tags: ["postgres", "table"],
		source: "pg",
		query: "select query, mean_exec_time from pg_stat_statements order by mean_exec_time desc limit 20",
		panel: "table",
		mistake: {
			query: "select query, mean_time from pg_stat_statements order by 2 desc",
			error: "column \"mean_time\" does not exist"
		},
		check: {
			id: "sorted",
			description: "The slowest query comes first",
			failure: "The table is sorted by query text."
		},
		difficulty: .35
	},
	{
		id: "signup-funnel",
		title: "Sign-up funnel",
		input: "Show the sign-up funnel: how many people reach each step",
		tags: [
			"postgres",
			"bar",
			"funnel"
		],
		source: "pg",
		query: "select step, count(distinct id) from signups group by step order by step",
		panel: "bar",
		mistake: {
			query: "select step, count(*) from signup group by step",
			error: "relation \"signup\" does not exist"
		},
		check: {
			id: "ordered-steps",
			description: "The steps are in funnel order",
			failure: "The steps are sorted by count, not by their order in the funnel."
		},
		difficulty: .45
	},
	{
		id: "error-logs-by-service",
		title: "Error logs by service",
		input: "Graph the error logs per service over the last six hours",
		tags: [
			"loki",
			"timeseries",
			"logs"
		],
		source: "loki",
		query: "sum by (service) (count_over_time({level=\"error\"}[5m]))",
		panel: "timeseries",
		mistake: {
			query: "sum by (service) (count_over_time({level=~\".*\"}[5m]))",
			error: "queries require at least one regexp or equality matcher that does not match empty"
		},
		check: {
			id: "errors-only",
			description: "Only error logs are counted",
			failure: "The query counts every log line, not only errors."
		},
		difficulty: .3,
		flaky: true
	},
	{
		id: "top-customers",
		title: "Top customers by traffic",
		input: "Who are our ten biggest customers by traffic this week?",
		tags: ["clickhouse", "table"],
		source: "ch",
		query: "select customer, sum(bytes) as traffic from events where ts >= now() - interval 7 day group by customer order by traffic desc limit 10",
		panel: "table",
		mistake: {
			query: "select user, sum(bytes) from events group by user",
			error: "Code: 47. DB::Exception: Missing columns: 'user'"
		},
		check: {
			id: "ten-rows",
			description: "The table has ten rows",
			failure: "The table has every customer, with no limit."
		},
		difficulty: .2,
		flaky: true
	},
	{
		id: "events-per-minute",
		title: "Events per minute",
		input: "Events per minute by kind, for the last hour",
		tags: ["clickhouse", "timeseries"],
		source: "ch",
		query: "select toStartOfMinute(ts) as minute, kind, count() from events where ts >= now() - interval 1 hour group by minute, kind order by minute",
		panel: "timeseries",
		mistake: {
			query: "select minute(ts), kind, count() from events group by 1, 2",
			error: "Code: 46. DB::Exception: Unknown function minute"
		},
		check: {
			id: "by-kind",
			description: "The panel has one series per kind",
			failure: "The panel sums every kind into one series."
		},
		difficulty: .15
	},
	{
		id: "disk-forecast",
		title: "Disk full forecast",
		input: "When will each disk be full at the current rate?",
		tags: [
			"prometheus",
			"stat",
			"forecast"
		],
		source: "prom",
		query: "node_filesystem_avail_bytes / -deriv(node_filesystem_avail_bytes[6h]) / 86400 > 0",
		panel: "stat",
		mistake: {
			query: "predict_linear(node_filesystem_avail_bytes[6h])",
			error: "expected 2 arguments in call to \"predict_linear\", got 1"
		},
		check: {
			id: "days-left",
			description: "The stat shows days left per disk",
			failure: "The stat shows bytes free, not days left."
		},
		difficulty: .7
	},
	{
		id: "latency-heatmap",
		title: "Latency heatmap",
		input: "A heatmap of request latency for the checkout service",
		tags: [
			"prometheus",
			"heatmap",
			"histogram"
		],
		source: "prom",
		query: "sum by (le) (rate(http_request_duration_seconds_bucket{service=\"checkout\"}[5m]))",
		panel: "heatmap",
		mistake: {
			query: "http_request_duration_seconds{service=\"checkout\"}",
			error: "The metric is a histogram: query its _bucket series."
		},
		check: {
			id: "heatmap-buckets",
			description: "The heatmap reads the histogram buckets",
			failure: "The panel is a time series, not a heatmap."
		},
		difficulty: .4,
		since: 6
	}
];
//#endregion
//#region src/cli/demo-random.ts
/**
* A step of the mulberry32 generator.
*
* @param state - The generator's state, as an unsigned 32-bit integer.
* @returns The next state and its value, from 0 included to 1 excluded.
*/
function mulberry32(state) {
	const next = state + 1831565813 >>> 0;
	let mixed = Math.imul(next ^ next >>> 15, next | 1);
	mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, mixed | 61);
	return {
		state: next,
		value: ((mixed ^ mixed >>> 14) >>> 0) / 4294967296
	};
}
/**
* A random number generator seeded with `seed`.
*
* @param seed - Any integer.
* @returns The generator.
*/
function seededRandom(seed) {
	let state = seed >>> 0;
	const next = () => {
		const step = mulberry32(state);
		state = step.state;
		return step.value;
	};
	const integer = (min, max) => min + Math.floor(next() * (max - min + 1));
	const pick = (items) => {
		const item = items[integer(0, items.length - 1)];
		if (item === void 0) throw new RangeError("Cannot pick from an empty list.");
		return item;
	};
	const hex = (length) => Array.from({ length }, () => integer(0, 15).toString(16)).join("");
	return {
		next,
		chance: (probability) => next() < probability,
		integer,
		pick,
		hex
	};
}
//#endregion
//#region src/cli/demo-png.ts
/**
* A small PNG encoder for the demo's screenshots: an indexed image of a few colours, compressed
* with `node:zlib`. Enough for flat drawings of a few kilobytes, with no dependency.
*/
/** The eight bytes every PNG file starts with. */
const signature = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
/** The CRC-32 table of the polynomial PNG uses. */
const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
	let value = index;
	for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 3988292384 ^ value >>> 1 : value >>> 1;
	return value >>> 0;
});
/**
* The CRC-32 of some bytes, as PNG chunks carry it.
*
* @param bytes - The bytes.
* @returns The checksum, unsigned.
*/
function crc32(bytes) {
	let crc = 4294967295;
	for (const byte of bytes) crc = (crcTable[(crc ^ byte) & 255] ?? 0) ^ crc >>> 8;
	return (crc ^ 4294967295) >>> 0;
}
/**
* One PNG chunk: its length, type, data and checksum.
*
* @param type - The chunk's four-letter type.
* @param data - Its data.
* @returns The chunk's bytes.
*/
function chunk(type, data) {
	const typed = new Uint8Array(4 + data.length);
	typed.set(new TextEncoder().encode(type));
	typed.set(data, 4);
	const bytes = new Uint8Array(12 + data.length);
	const view = new DataView(bytes.buffer);
	view.setUint32(0, data.length);
	bytes.set(typed, 4);
	view.setUint32(8 + data.length, crc32(typed));
	return bytes;
}
/**
* The image's header: its size, 8 bits per pixel, indexed colour.
*
* @param image - The image.
* @returns The header's data.
*/
function header(image) {
	const data = /* @__PURE__ */ new Uint8Array(13);
	const view = new DataView(data.buffer);
	view.setUint32(0, image.width);
	view.setUint32(4, image.height);
	data.set([
		8,
		3,
		0,
		0,
		0
	], 8);
	return data;
}
/**
* The image's rows, each after a filter byte of 0, compressed.
*
* @param image - The image.
* @returns The compressed data.
*/
function imageData(image) {
	const rows = new Uint8Array(image.height * (image.width + 1));
	for (let row = 0; row < image.height; row += 1) {
		const start = row * image.width;
		rows.set(image.pixels.subarray(start, start + image.width), row * (image.width + 1) + 1);
	}
	return deflateSync(rows, { level: 9 });
}
/**
* Encodes an indexed image as a PNG file.
*
* @param image - The image.
* @returns The file's bytes.
*/
function encodePng(image) {
	const parts = [
		signature,
		chunk("IHDR", header(image)),
		chunk("PLTE", Uint8Array.from(image.palette.flat())),
		chunk("IDAT", imageData(image)),
		chunk("IEND", /* @__PURE__ */ new Uint8Array())
	];
	const bytes = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
	let offset = 0;
	for (const part of parts) {
		bytes.set(part, offset);
		offset += part.length;
	}
	return bytes;
}
//#endregion
//#region src/cli/demo-screenshot.ts
/**
* The demo's screenshots: a flat drawing of the panel a trial wrote, the right one or a wrong one,
* alone as the `write_panel` tool saw it or inside the dashboard at the end of the trial. Each is
* a small indexed PNG, the same for the same case, so the store keeps one file per drawing.
*/
/** The colours, by name, as indexes into the palette. */
const colour = {
	background: 0,
	border: 1,
	titleBar: 2,
	text: 3,
	blue: 4,
	orange: 5,
	green: 6,
	grid: 7,
	red: 8,
	appBar: 9,
	page: 10,
	paleBlue: 11,
	midBlue: 12
};
/** The palette, in the order of `colour`. */
const palette = [
	[
		255,
		255,
		255
	],
	[
		212,
		212,
		208
	],
	[
		241,
		241,
		238
	],
	[
		138,
		138,
		133
	],
	[
		59,
		111,
		216
	],
	[
		224,
		128,
		58
	],
	[
		47,
		158,
		110
	],
	[
		232,
		232,
		228
	],
	[
		214,
		69,
		69
	],
	[
		35,
		39,
		46
	],
	[
		246,
		246,
		243
	],
	[
		185,
		205,
		243
	],
	[
		122,
		157,
		230
	]
];
/** The series colours, in order. */
const seriesColours = [
	colour.blue,
	colour.orange,
	colour.green
];
/**
* Fills a rectangle, clipped to the canvas.
*
* @param canvas - The canvas.
* @param box - The rectangle.
* @param index - The palette index.
*/
function fill(canvas, box, index) {
	const left = Math.max(0, Math.round(box.x));
	const right = Math.min(canvas.width, Math.round(box.x + box.width));
	const bottom = Math.min(canvas.height, Math.round(box.y + box.height));
	for (let row = Math.max(0, Math.round(box.y)); row < bottom; row += 1) canvas.pixels.fill(index, row * canvas.width + left, row * canvas.width + Math.max(left, right));
}
/**
* Draws a line two pixels thick.
*
* @param canvas - The canvas.
* @param from - Where it starts, as `[x, y]`.
* @param to - Where it ends, as `[x, y]`.
* @param index - The palette index.
*/
function line(canvas, from, to, index) {
	const [x0 = 0, y0 = 0] = from;
	const [x1 = 0, y1 = 0] = to;
	const steps = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
	for (let step = 0; step <= steps; step += 1) fill(canvas, {
		x: x0 + (x1 - x0) * step / steps,
		y: y0 + (y1 - y0) * step / steps,
		width: 2,
		height: 2
	}, index);
}
/**
* Draws the horizontal grid lines of a plot.
*
* @param canvas - The canvas.
* @param plot - The plot area.
*/
function grid(canvas, plot) {
	for (let level = 0; level <= 4; level += 1) {
		const y = plot.y + plot.height * level / 4;
		fill(canvas, {
			x: plot.x,
			y,
			width: plot.width,
			height: 1
		}, colour.grid);
		fill(canvas, {
			x: plot.x - 16,
			y: y - 2,
			width: 10,
			height: 3
		}, colour.border);
	}
}
/**
* Draws lines, one per series: three when right, one when wrong.
*
* @param canvas - The canvas.
* @param plot - The plot area.
* @param random - The generator.
* @param right - Whether the panel is the right one.
*/
const timeseries = (canvas, plot, random, right) => {
	grid(canvas, plot);
	const points = 24;
	for (const index of seriesColours.slice(0, right ? 3 : 1)) {
		let level = random.next() * .6 + .2;
		let previous;
		for (let point = 0; point < points; point += 1) {
			level = Math.min(.95, Math.max(.05, level + (random.next() - .5) * .2));
			const here = [plot.x + plot.width * point / 23, plot.y + plot.height * level];
			if (previous) line(canvas, previous, here, index);
			previous = here;
		}
	}
};
/**
* Draws bars: seven when right, three grey ones when wrong.
*
* @param canvas - The canvas.
* @param plot - The plot area.
* @param random - The generator.
* @param right - Whether the panel is the right one.
*/
const bars = (canvas, plot, random, right) => {
	grid(canvas, plot);
	const count = right ? 7 : 3;
	const slot = plot.width / count;
	for (let bar = 0; bar < count; bar += 1) {
		const height = plot.height * (.25 + random.next() * .7);
		fill(canvas, {
			x: plot.x + bar * slot + slot * .2,
			y: plot.y + plot.height - height,
			width: slot * .6,
			height
		}, right ? colour.blue : colour.text);
	}
};
/**
* Draws one row of a table: three cells, the last a number, blue in a right panel's body.
*
* @param canvas - The canvas.
* @param row - The row's area.
* @param random - The generator.
* @param numbers - The colour of the last cell.
*/
function tableRow(canvas, row, random, numbers) {
	for (const [column, share] of [
		0,
		.4,
		.75
	].entries()) {
		const last = column === 2;
		const width = (last ? .15 : .25) * row.width * (.5 + random.next() * .5);
		fill(canvas, {
			x: row.x + 6 + row.width * share,
			y: row.y + 6,
			width,
			height: 4
		}, last ? numbers : colour.border);
	}
}
/**
* Draws a table: a header and striped rows, three rows when wrong.
*
* @param canvas - The canvas.
* @param plot - The plot area.
* @param random - The generator.
* @param right - Whether the panel is the right one.
*/
const table = (canvas, plot, random, right) => {
	const height = 16;
	const rows = right ? Math.floor(plot.height / height) : 3;
	fill(canvas, {
		...plot,
		height
	}, colour.titleBar);
	tableRow(canvas, {
		...plot,
		height
	}, random, colour.text);
	for (let row = 1; row < rows; row += 1) {
		const box = {
			...plot,
			y: plot.y + row * height,
			height
		};
		if (row % 2 === 0) fill(canvas, box, colour.page);
		tableRow(canvas, box, random, right ? colour.blue : colour.border);
	}
};
/**
* Draws a big number with a sparkline under it; grey when wrong.
*
* @param canvas - The canvas.
* @param plot - The plot area.
* @param random - The generator.
* @param right - Whether the panel is the right one.
*/
const stat$1 = (canvas, plot, random, right) => {
	const digit = {
		width: 20,
		height: 36
	};
	const left = plot.x + plot.width / 2 - 2 * (digit.width + 6);
	for (let place = 0; place < 4; place += 1) {
		const box = {
			x: left + place * (digit.width + 6),
			y: plot.y + 12,
			...digit
		};
		fill(canvas, box, right ? colour.blue : colour.text);
		fill(canvas, {
			...box,
			x: box.x + 5,
			y: box.y + 7,
			width: 10,
			height: 8
		}, colour.background);
	}
	const spark = {
		...plot,
		y: plot.y + plot.height - 30,
		height: 26
	};
	let previous = [spark.x, spark.y + spark.height / 2];
	for (let point = 1; point <= 20; point += 1) {
		const here = [spark.x + spark.width * point / 20, spark.y + random.next() * spark.height];
		line(canvas, previous, here, colour.paleBlue);
		previous = here;
	}
};
/**
* Draws a heatmap of cells shaded in blues; a single line, as a time series would, when wrong.
*
* @param canvas - The canvas.
* @param plot - The plot area.
* @param random - The generator.
* @param right - Whether the panel is the right one.
*/
const heatmap = (canvas, plot, random, right) => {
	if (!right) return timeseries(canvas, plot, random, right);
	const shades = [
		colour.grid,
		colour.paleBlue,
		colour.midBlue,
		colour.blue
	];
	const [columns, rows] = [16, 6];
	const cell = {
		width: plot.width / columns,
		height: plot.height / rows
	};
	for (let index = 0; index < columns * rows; index += 1) {
		const x = plot.x + index % columns * cell.width;
		const y = plot.y + Math.floor(index / columns) * cell.height;
		fill(canvas, {
			x: x + 1,
			y: y + 1,
			width: cell.width - 2,
			height: cell.height - 2
		}, random.pick(shades));
	}
};
/** The painter of each panel type. */
const painters = {
	timeseries,
	bar: bars,
	table,
	stat: stat$1,
	heatmap
};
/**
* A number from a case's id, to seed its drawing.
*
* @param text - The id.
* @returns The seed.
*/
function seedOf(text) {
	let hash = 2166136261;
	for (const character of text) hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 16777619);
	return hash >>> 0;
}
/**
* Draws a panel: its frame, title bar and content.
*
* @param canvas - The canvas.
* @param box - Where the panel goes.
* @param demoCase - The case, for the panel's type and title.
* @param variant - Whether the panel is the right one.
*/
function panel(canvas, box, demoCase, variant) {
	fill(canvas, box, colour.border);
	fill(canvas, {
		x: box.x + 1,
		y: box.y + 1,
		width: box.width - 2,
		height: box.height - 2
	}, 0);
	fill(canvas, {
		x: box.x + 1,
		y: box.y + 1,
		width: box.width - 2,
		height: 18
	}, colour.titleBar);
	const titleWidth = Math.min(box.width - 40, demoCase.title.length * 4);
	fill(canvas, {
		x: box.x + 8,
		y: box.y + 8,
		width: titleWidth,
		height: 4
	}, colour.text);
	if (variant === "wrong") fill(canvas, {
		x: box.x + box.width - 14,
		y: box.y + 6,
		width: 7,
		height: 7
	}, colour.red);
	const plot = {
		x: box.x + 26,
		y: box.y + 28,
		width: box.width - 38,
		height: box.height - 40
	};
	(painters[demoCase.panel] ?? timeseries)(canvas, plot, seededRandom(seedOf(demoCase.id)), variant === "right");
}
/**
* Draws one screenshot.
*
* @param demoCase - The case.
* @param variant - Whether the panel is the right one.
* @param view - The panel alone, or the dashboard around it.
* @returns The PNG file's bytes.
*/
function screenshotOf(demoCase, variant, view) {
	const [width, height] = view === "panel" ? [320, 180] : [320, 200];
	const canvas = {
		width,
		height,
		pixels: new Uint8Array(width * height)
	};
	if (view === "panel") {
		panel(canvas, {
			x: 0,
			y: 0,
			width,
			height
		}, demoCase, variant);
		return encodePng({
			...canvas,
			palette
		});
	}
	fill(canvas, {
		x: 0,
		y: 0,
		width,
		height
	}, colour.page);
	fill(canvas, {
		x: 0,
		y: 0,
		width,
		height: 14
	}, colour.appBar);
	fill(canvas, {
		x: 6,
		y: 4,
		width: 6,
		height: 6
	}, colour.orange);
	fill(canvas, {
		x: 8,
		y: 20,
		width: Math.min(200, demoCase.title.length * 5),
		height: 5
	}, 3);
	panel(canvas, {
		x: 8,
		y: 32,
		width: width - 16,
		height: height - 40
	}, demoCase, variant);
	return encodePng({
		...canvas,
		palette
	});
}
/**
* Where a screenshot is, relative to the demo's result.
*
* @param caseId - The case's id.
* @param variant - Whether the panel is the right one.
* @param view - The panel alone, or the dashboard around it.
* @returns The path.
*/
function screenshotPath(caseId, variant, view) {
	return `screenshots/${caseId}-${view}-${variant}.png`;
}
/**
* Writes every screenshot the demo history may point to.
*
* @param folder - The folder its paths are relative to.
* @returns When they are written.
*/
async function writeScreenshots(folder) {
	for (const demoCase of demoCases) for (const variant of ["right", "wrong"]) for (const view of ["panel", "dashboard"]) {
		const path = join(folder, screenshotPath(demoCase.id, variant, view));
		await mkdir(dirname(path), { recursive: true });
		await writeFile(path, screenshotOf(demoCase, variant, view));
	}
}
//#endregion
//#region src/cli/demo-transcript.ts
/**
* Rounds an amount of US dollars to the millionth.
*
* @param amount - The amount.
* @returns The rounded amount.
*/
function dollars(amount) {
	return Math.round(amount * 1e6) / 1e6;
}
/**
* What one assistant turn spends.
*
* @param random - The generator.
* @param model - The model, for its prices.
* @param context - The tokens of the conversation so far, which the turn reads.
* @returns The turn's usage.
*/
function turnUsage(random, model, context) {
	const outputTokens = random.integer(40, 320);
	return {
		inputTokens: context,
		outputTokens,
		costUsd: dollars((context * model.inputPrice + outputTokens * model.outputPrice) / 1e6)
	};
}
/**
* A writer for one conversation. Each assistant turn reads the whole conversation so far, so its
* input tokens grow turn after turn.
*
* @param random - The generator.
* @param model - The model that answers.
* @param startMs - When the trial starts, in milliseconds since the epoch.
* @returns The writer.
*/
function writer(random, model, startMs) {
	const messages = [];
	const usage = {
		inputTokens: 0,
		outputTokens: 0,
		costUsd: 0
	};
	let clock = startMs;
	let context = random.integer(1500, 2200);
	const assistant = (turn) => {
		clock += Math.round(model.secondsPerTurn * 1e3 * (.6 + random.next()));
		const spent = turnUsage(random, model, context);
		messages.push({
			role: "assistant",
			...turn,
			at: new Date(clock).toISOString(),
			usage: spent
		});
		usage.inputTokens += spent.inputTokens;
		usage.outputTokens += spent.outputTokens;
		usage.costUsd = dollars(usage.costUsd + spent.costUsd);
		context += spent.outputTokens + random.integer(200, 1200);
	};
	const user = (content) => {
		messages.push({
			role: "user",
			content,
			at: new Date(clock).toISOString()
		});
	};
	const finish = () => ({
		transcript: messages,
		usage,
		durationMs: clock - startMs
	});
	return {
		user,
		assistant,
		finish
	};
}
/**
* A tool call that returned.
*
* @param random - The generator, for its id and duration.
* @param name - The tool's name.
* @param input - What the model sent.
* @param output - What the tool returned.
* @returns The tool call.
*/
function called(random, name, input, output) {
	return {
		id: `call-${random.hex(8)}`,
		name,
		input,
		output,
		durationMs: random.integer(8, 900)
	};
}
/**
* A tool call that failed.
*
* @param random - The generator, for its id and duration.
* @param name - The tool's name.
* @param input - What the model sent.
* @param error - The error the tool returned.
* @returns The tool call.
*/
function failed(random, name, input, error) {
	return {
		id: `call-${random.hex(8)}`,
		name,
		input,
		error,
		durationMs: random.integer(8, 400)
	};
}
/**
* The turns that find the source and plan the dashboard.
*
* @param random - The generator.
* @param write - The conversation's writer.
* @param demoCase - The case.
*/
function explore(random, write, demoCase) {
	const sources = demoSources.map(({ id, kind }) => ({
		id,
		kind
	}));
	const source = demoSources.find((entry) => entry.id === demoCase.source);
	write.assistant({
		content: "I will look for a source that has this data.",
		toolCalls: [called(random, "list_sources", {}, sources)]
	});
	write.assistant({ toolCalls: [called(random, "describe_source", { source: demoCase.source }, source?.schema ?? {})] });
	const panel = {
		title: demoCase.title,
		type: demoCase.panel,
		source: demoCase.source
	};
	write.assistant({
		content: `Plan: one ${demoCase.panel} panel, "${demoCase.title}".`,
		toolCalls: [called(random, "propose_plan", { panels: [panel] }, { accepted: true })]
	});
}
/**
* The turns that run the query, repairing a wrong first one when `repair` is set.
*
* @param random - The generator.
* @param write - The conversation's writer.
* @param demoCase - The case.
* @param repair - Whether the first query fails and the agent fixes it.
*/
function query(random, write, demoCase, repair) {
	const run = (text) => ({
		source: demoCase.source,
		query: text
	});
	const rows = {
		rows: random.integer(6, 1800),
		columns: 2
	};
	if (!repair) {
		write.assistant({ toolCalls: [called(random, "run_query", run(demoCase.query), rows)] });
		return;
	}
	const { mistake } = demoCase;
	write.assistant({ toolCalls: [failed(random, "run_query", run(mistake.query), mistake.error)] });
	write.assistant({
		content: `The query failed: ${mistake.error}. I will fix it.`,
		toolCalls: [called(random, "run_query", run(demoCase.query), rows)]
	});
}
/**
* A trial's conversation. An `error` trial stops after the first turn; the others go on to write
* the panel and answer.
*
* @param random - The generator.
* @param model - The model that answers.
* @param demoCase - The case.
* @param outcome - How the trial ends.
* @param startMs - When it starts, in milliseconds since the epoch.
* @returns The conversation.
*/
function conversationOf(random, model, demoCase, outcome, startMs) {
	const write = writer(random, model, startMs);
	write.user(demoCase.input);
	if (outcome === "error") {
		write.assistant({ toolCalls: [called(random, "list_sources", {}, [])] });
		return write.finish();
	}
	explore(random, write, demoCase);
	query(random, write, demoCase, random.chance(outcome === "fail" ? .5 : .2));
	const panel = {
		dashboard: "draft",
		title: demoCase.title,
		type: demoCase.panel
	};
	const variant = outcome === "pass" ? "right" : "wrong";
	const screenshot = {
		path: screenshotPath(demoCase.id, variant, "panel"),
		mediaType: "image/png",
		caption: "The panel as written"
	};
	const written = called(random, "write_panel", panel, {
		panel: "p1",
		version: 1
	});
	write.assistant({ toolCalls: [{
		...written,
		attachments: [screenshot]
	}] });
	write.assistant({ content: `The dashboard is ready: "${demoCase.title}", one ${demoCase.panel} panel.` });
	return write.finish();
}
//#endregion
//#region src/cli/demo-data.ts
/** How many commits `main` gets over the history. */
const mainCommits = 24;
/** How long the history lasts. */
const historyMs = 36288e5;
/** The `main` commits that carry the regression: from the first included to the last excluded. */
const regression = {
	from: 10,
	until: 13
};
/** The pull requests: their branch, the cases they have, and where their commits fall. */
const pullRequests = [{
	number: 41,
	branch: "feat/heatmap-panels",
	level: 6,
	positions: [
		3.4,
		4.3,
		4.7
	]
}, {
	number: 44,
	branch: "fix/sql-dialects",
	level: 12,
	positions: [11.5, 12.5]
}];
/** The errors a trial can end in. */
const trialErrors = [
	"The model call timed out after 60 s.",
	"The provider answered 429 Too Many Requests three times.",
	"The model returned a tool call with invalid JSON arguments."
];
/**
* The model every commit runs, and the full list on comparison commits.
*
* @param index - The `main` commit's index.
* @returns The models it runs.
*/
function modelsOf(index) {
	return index % 4 === 3 ? demoModels : demoModels.slice(0, 1);
}
/**
* The commits of the history, in time order.
*
* @param random - The generator.
* @param endMs - When the history ends, in milliseconds since the epoch.
* @returns The commits.
*/
function commitsOf(random, endMs) {
	const spacing = historyMs / mainCommits;
	const timeOf = (position) => endMs - historyMs + (position + .5) * spacing + random.integer(-3, 3) * 36e5;
	const main = Array.from({ length: mainCommits }, (_, index) => ({
		source: {
			commit: random.hex(40),
			branch: "main"
		},
		time: timeOf(index),
		level: index,
		regressed: index >= regression.from && index < regression.until,
		models: modelsOf(index)
	}));
	const branches = pullRequests.flatMap((pull) => pull.positions.map((position) => ({
		source: {
			commit: random.hex(40),
			branch: pull.branch,
			pullRequest: pull.number
		},
		time: timeOf(position),
		level: pull.level,
		regressed: false,
		models: demoModels.slice(0, 1)
	})));
	return [...main, ...branches].sort((first, second) => first.time - second.time);
}
/**
* The chance each trial of a case passes in one run. A flaky case's trials pass about half the
* time. Any other case is either solved in that run, and its trials nearly always pass, or not, and
* they nearly always fail; a better model solves more cases.
*
* @param random - The generator.
* @param model - The model.
* @param demoCase - The case.
* @param regressed - Whether the commit carries the regression of the SQL cases.
* @returns The probability, from 0 to 1.
*/
function passChance(random, model, demoCase, regressed) {
	if (demoCase.flaky) return .35 + model.skill * .3;
	const solves = Math.min(.97, Math.max(.03, model.skill + .3 - demoCase.difficulty));
	const broken = regressed && demoCase.source === "pg";
	return random.chance(broken ? solves * .15 : solves) ? .96 : .06;
}
/**
* The checks of a trial that did not error.
*
* @param random - The generator.
* @param demoCase - The case.
* @param passed - Whether the trial passed.
* @returns One result per check the case declares.
*/
function checksOf(random, demoCase, passed) {
	const common = commonChecks.map(({ id }) => ({
		id,
		pass: true
	}));
	if (passed) return [...common, {
		id: demoCase.check.id,
		pass: true
	}];
	const own = {
		id: demoCase.check.id,
		pass: false,
		message: demoCase.check.failure
	};
	if (!random.chance(.25)) return [...common, own];
	const empty = {
		id: "query-runs",
		pass: false,
		message: "A panel's query returned no rows."
	};
	return [
		...common.filter((check) => check.id !== "query-runs"),
		empty,
		own
	];
}
/**
* One trial of a case.
*
* @param random - The generator.
* @param model - The model.
* @param demoCase - The case.
* @param chance - Its chance to pass.
* @param startMs - When it starts, in milliseconds since the epoch.
* @returns The trial.
*/
function trialOf(random, model, demoCase, chance, startMs) {
	const outcome = random.chance(.012) ? "error" : random.chance(chance) ? "pass" : "fail";
	const { transcript, usage, durationMs } = conversationOf(random, model, demoCase, outcome, startMs);
	const base = {
		status: outcome,
		durationMs,
		usage,
		transcript
	};
	if (outcome === "error") return {
		...base,
		error: random.pick(trialErrors)
	};
	const checks = checksOf(random, demoCase, outcome === "pass");
	const score = Math.round(checks.filter((check) => check.pass).length / checks.length * 100) / 100;
	const output = `Built "${demoCase.title}" with one ${demoCase.panel} panel.`;
	const attachments = [{
		path: screenshotPath(demoCase.id, outcome === "pass" ? "right" : "wrong", "dashboard"),
		mediaType: "image/png",
		caption: "The dashboard at the end"
	}];
	return {
		...base,
		score,
		checks,
		output,
		attachments
	};
}
/**
* One case of a run, with three trials run side by side.
*
* @param random - The generator.
* @param commit - The commit.
* @param model - The model.
* @param demoCase - The case.
* @param startMs - When it starts, in milliseconds since the epoch.
* @returns The case.
*/
function caseOf(random, commit, model, demoCase, startMs) {
	const chance = passChance(random, model, demoCase, commit.regressed);
	const trials = Array.from({ length: 3 }, () => trialOf(random, model, demoCase, chance, startMs + random.integer(0, 2e3)));
	const { id, title, input, tags, check } = demoCase;
	const checks = [...commonChecks, {
		id: check.id,
		description: check.description ?? check.id
	}];
	return {
		id,
		title,
		input,
		tags: [...tags],
		checks,
		trials
	};
}
/**
* One run: a commit's result with one model, cases run one after the other.
*
* @param random - The generator.
* @param commit - The commit.
* @param model - The model.
* @param startMs - When it starts, in milliseconds since the epoch.
* @returns The run.
*/
function runOf(random, commit, model, startMs) {
	const cases = [];
	let clock = startMs;
	for (const demoCase of demoCases.filter((entry) => (entry.since ?? 0) <= commit.level)) {
		const entry = caseOf(random, commit, model, demoCase, clock);
		cases.push(entry);
		clock += Math.max(...entry.trials.map((trial) => trial.durationMs ?? 0)) + 2e3;
	}
	const result = {
		version: 1,
		suite: "dashboard-agent",
		startedAt: new Date(startMs).toISOString(),
		durationMs: clock - startMs,
		labels: {
			model: model.name,
			provider: model.provider
		},
		cases
	};
	const recordedAt = new Date(clock + random.integer(10, 40) * 1e3).toISOString();
	return {
		result,
		source: commit.source,
		recordedAt
	};
}
/**
* A synthetic eval history, for the demo: about forty runs over six weeks, oldest first.
*
* @param options - The seed and the end of the history.
* @returns The runs, in the order they were recorded.
*/
function demoHistory(options = {}) {
	const random = seededRandom(options.seed ?? 20261008);
	return commitsOf(random, (options.end ?? /* @__PURE__ */ new Date("2026-10-08T12:00:00Z")).getTime()).flatMap((commit) => commit.models.map((model, index) => runOf(random, commit, model, commit.time + index * 24e4))).sort((first, second) => first.recordedAt.localeCompare(second.recordedAt));
}
//#endregion
//#region src/cli/serve.ts
/**
* Serving a folder over HTTP on the local machine, for the dashboard: `evalmark preview` and
* `evalmark demo` both use it.
*/
/** Content types of the dashboard's files; anything else is served as bytes. */
const contentTypes = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".gif": "image/gif",
	".woff2": "font/woff2",
	".txt": "text/plain; charset=utf-8"
};
/**
* The file a request path names inside the folder: `index.html` for a folder, nothing outside.
*
* @param folder - The served folder, resolved.
* @param pathname - The request's path.
* @returns The file's path, or `undefined` when there is no such file in the folder.
*/
function fileFor(folder, pathname) {
	let path;
	try {
		path = resolve(join(folder, decodeURIComponent(pathname)));
	} catch {
		return;
	}
	if (path !== folder && !path.startsWith(`${folder}${sep}`)) return void 0;
	const stats = statSync(path, { throwIfNoEntry: false });
	if (stats?.isDirectory()) return fileFor(folder, join(pathname, "index.html"));
	return stats?.isFile() ? path : void 0;
}
/**
* The content type of a file. A gzipped transcript is plain bytes: the dashboard decompresses it
* itself, so it is served without `Content-Encoding`.
*
* @param path - The file's path.
* @returns The content type.
*/
function contentTypeOf(path) {
	if (path.endsWith(".gz")) return "application/octet-stream";
	return contentTypes[extname(path)] ?? "application/octet-stream";
}
/**
* Answers requests with the files of a folder: `index.html` for a folder, a 404 for anything
* else, nothing outside it.
*
* @param folder - The folder.
* @returns A request listener, for `node:http` or as a connect middleware.
*/
function answerFrom(folder) {
	const root = resolve(folder);
	return (request, response) => {
		const file = fileFor(root, new URL(request.url ?? "/", "http://localhost").pathname);
		if (file === void 0) {
			response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
			return;
		}
		response.writeHead(200, {
			"content-type": contentTypeOf(file),
			"cache-control": "no-store"
		});
		pipeline(createReadStream(file), response, () => response.destroy());
	};
}
/**
* The URL of an address, with an IPv6 address in brackets.
*
* @param hostname - The address listened on.
* @param port - The port.
* @returns The URL.
*/
function urlOf(hostname, port) {
	return new URL(`http://${hostname.includes(":") ? `[${hostname}]` : hostname}:${port}/`);
}
/**
* Serves a folder, on this machine only unless a host says otherwise.
*
* @param folder - The folder.
* @param port - The port; `0` picks a free one.
* @param hostname - The address to listen on, such as `0.0.0.0` for every interface.
* @returns The server, once it listens: its `url` says where.
*/
async function serveFolder(folder, port, hostname = "127.0.0.1") {
	const server = createServer(answerFrom(folder));
	await new Promise((listening, failed) => {
		server.once("error", failed);
		server.listen(port, hostname, listening);
	});
	const { port: bound } = server.address();
	const close = () => {
		server.closeAllConnections();
		return new Promise((closed) => server.close(() => closed()));
	};
	return {
		url: urlOf(hostname, bound),
		close
	};
}
/**
* Reads a bare `--host`, as Vite does, as every interface: it gets the value `0.0.0.0` when no
* address follows it.
*
* @param args - The command's arguments.
* @returns The arguments, with an address after every `--host`.
*/
function withHostValue(args) {
	return args.flatMap((arg, index) => {
		const next = args[index + 1];
		return arg === "--host" && (next === void 0 || next.startsWith("-")) ? [arg, "0.0.0.0"] : [arg];
	});
}
/**
* Reads a `--port` value.
*
* @param value - The value, as given.
* @returns The port, from 0 (any free port) to 65535.
* @throws When the value is not a port.
*/
function portOf(value) {
	const port = Number(value);
	if (!/^\d+$/.test(value) || port > 65535) throw new Error(`--port takes a number from 0 to 65535, not \`${value}\`.`);
	return port;
}
//#endregion
//#region src/cli/demo.ts
/**
* `evalmark demo`: records a synthetic history into a local folder with the action's store, one run
* at a time as the action would, and serves the dashboard on it.
*/
/** How `evalmark demo` is called. */
const demoUsage = "evalmark demo [--dir .demo] [--host [address]] [--port 4400] [--no-serve]";
/** The repository the demo pretends to be. */
const repository = "acme/dashboard-agent";
/**
* A demo run as the action would draft it, with a workflow run number of its own.
*
* @param demo - The demo run.
* @param number - Its position in the history, used as its workflow run id.
* @param attachmentFiles - Its screenshots, found next to its result.
* @returns The draft.
*/
function draftOf$1(demo, number, attachmentFiles) {
	const runId = String(9e6 + number);
	const source = {
		repository,
		commit: demo.source.commit,
		branch: demo.source.branch,
		...demo.source.pullRequest === void 0 ? {} : { pullRequest: demo.source.pullRequest },
		event: demo.source.pullRequest === void 0 ? "push" : "pull_request",
		runUrl: `https://github.com/${repository}/actions/runs/${runId}`,
		actor: "octocat"
	};
	return {
		result: demo.result,
		id: runIdOf(demo.result.startedAt ?? demo.recordedAt, { GITHUB_RUN_ID: runId }),
		suite: demo.result.suite ?? "agent",
		source,
		recordedAt: demo.recordedAt,
		transcripts: "all",
		attachments: readInputs({}).attachments,
		attachmentFiles
	};
}
/**
* Records the whole demo history into a fresh folder. The screenshots are written into a
* temporary folder, which stands for the folder of each run's result, and removed afterwards.
*
* @param folder - The folder, emptied first.
* @param siteDir - The built dashboard's folder.
* @returns How many runs it recorded.
*/
async function recordDemo(folder, siteDir = defaultSiteDir()) {
	rmSync(folder, {
		recursive: true,
		force: true
	});
	const results = await mkdtemp(join(tmpdir(), "evalmark-demo-"));
	try {
		await writeScreenshots(results);
		const history = demoHistory({ end: /* @__PURE__ */ new Date() });
		for (const [number, demo] of history.entries()) {
			const { files } = await loadAttachments(demo.result, results);
			await storeRun(folder, draftOf$1(demo, number, files), storeOptions(siteDir, demo));
		}
		return history.length;
	} finally {
		await rm(results, {
			recursive: true,
			force: true
		});
	}
}
/**
* How the demo records a run: every run and its transcripts on 30 runs, and the action's
* defaults for attachments.
*
* @param siteDir - The built dashboard's folder.
* @param demo - The run.
* @returns The store's options.
*/
function storeOptions(siteDir, demo) {
	return {
		keepRuns: 0,
		keepDays: 0,
		keepTranscripts: 30,
		keepAttachments: readInputs({}).keepAttachments,
		badges: true,
		defaultBranch: "main",
		siteDir,
		now: new Date(demo.recordedAt)
	};
}
/**
* Records the demo history and serves it.
*
* @param args - The command's arguments.
* @returns When the history is recorded and the server started.
*/
async function demoCommand(args) {
	const { values } = parseArgs({
		args: withHostValue(args),
		options: {
			dir: {
				type: "string",
				default: ".demo"
			},
			host: {
				type: "string",
				default: "127.0.0.1"
			},
			port: {
				type: "string",
				default: "4400"
			},
			"no-serve": {
				type: "boolean",
				default: false
			}
		}
	});
	const port = portOf(values.port);
	const folder = resolve(values.dir);
	const count = await recordDemo(folder);
	process.stdout.write(`Recorded ${count} demo runs into ${folder}.\n`);
	if (values["no-serve"]) return;
	const server = await serveFolder(folder, port, values.host);
	process.stdout.write(`The dashboard is on ${server.url}\n`);
}
//#endregion
//#region src/cli/import.ts
/**
* `evalmark import`: converts another tool's eval output (promptfoo, Inspect AI, JUnit XML) to result
* files, one per model, so the conversion can be read before it is recorded.
*/
/** How `evalmark import` is called. */
const importUsage = `evalmark import --from <file> --out <folder> [--format auto|${importFormats.join("|")}]`;
/**
* The file name of the n-th converted result: its number and its model, safe in a path.
*
* @param result - The result.
* @param index - Its position, from 0.
* @returns The file name, such as `1-gpt-5-mini.json`.
*/
function fileNameOf(result, index) {
	const safe = (result.labels?.model ?? result.suite ?? "result").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+|-+$/g, "") || "result";
	return `${index + 1}-${safe}.json`;
}
/**
* Reads the `--format` option.
*
* @param value - The option, if given.
* @returns The format, or `auto`.
* @throws When it is not a known format.
*/
function formatOf(value) {
	if (value === void 0 || value === "auto") return "auto";
	const format = importFormats.find((known) => known === value);
	if (format === void 0) throw new Error(`Unknown format ${value}. Usage: ${importUsage}`);
	return format;
}
/**
* Converts a file and writes each result into a folder.
*
* @param args - The command's arguments.
* @returns The paths written, in order.
* @throws When an argument is missing, or the file does not convert.
*/
async function importCommand(args) {
	const { values } = parseArgs({
		args,
		options: {
			from: { type: "string" },
			out: { type: "string" },
			format: { type: "string" }
		}
	});
	if (!values.from || !values.out) throw new Error(`Usage: ${importUsage}`);
	const results = await importResults(values.from, formatOf(values.format));
	await mkdir(values.out, { recursive: true });
	const paths = results.map((result, index) => join(values.out ?? "", fileNameOf(result, index)));
	await Promise.all(results.map((result, index) => writeFile(paths[index] ?? "", `${JSON.stringify(result, null, 2)}\n`)));
	return paths;
}
//#endregion
//#region src/cli/preview.ts
/**
* `evalmark preview`: serves the dashboard of a branch of the current clone, or of a folder on disk,
* with nothing published.
*/
/** How `evalmark preview` is called. */
const previewUsage = "evalmark preview [--branch evalmark] [--folder evalmark] [--host [address]] [--port 4400] [--dir <folder on disk>]";
/**
* Runs a command and says whether it succeeded, without printing anything.
*
* @param command - The command.
* @param args - Its arguments.
* @returns `true` when it exited with 0.
*/
function succeeds(command, args) {
	return spawnSync(command, args, { stdio: "ignore" }).status === 0;
}
/**
* Extracts a folder of a ref of the current clone into a directory, through a tar archive written
* to a file, so a large history never sits in memory.
*
* @param ref - The ref, such as `evalmark` or `refs/evalmark/data`.
* @param folder - The folder on that ref.
* @param directory - Where to extract it.
* @returns `true` when the ref has the folder.
*/
function extract(ref, folder, directory) {
	const archive = join(directory, ".evalmark-preview.tar");
	try {
		if (!succeeds("git", [
			"archive",
			"--format=tar",
			`--output=${archive}`,
			ref,
			folder
		])) return false;
		return succeeds("tar", [
			"-x",
			"-f",
			archive,
			"-C",
			directory
		]);
	} finally {
		rmSync(archive, { force: true });
	}
}
/**
* Extracts the folder from the ref as given, or else from `origin/<ref>`.
*
* @param branch - The branch or ref.
* @param folder - The folder.
* @returns The extracted folder's path, in a temporary directory.
* @throws When neither ref has the folder.
*/
function extractFolder(branch, folder) {
	const directory = mkdtempSync(join(tmpdir(), "evalmark-preview-"));
	if ([branch, `origin/${branch}`].some((ref) => extract(ref, folder, directory))) return join(directory, folder);
	rmSync(directory, {
		recursive: true,
		force: true
	});
	throw new Error(`Neither ${branch} nor origin/${branch} has a ${folder} folder in this clone.`);
}
/**
* Removes a temporary directory when the process is interrupted or stopped.
*
* @param directory - The directory.
*/
function removeOnExit(directory) {
	const stop = () => {
		rmSync(directory, {
			recursive: true,
			force: true
		});
		process.exit(0);
	};
	process.once("SIGINT", stop);
	process.once("SIGTERM", stop);
}
/**
* Serves the preview until the process stops.
*
* @param args - The command's arguments.
* @returns The server, once it listens.
* @throws When the branch has no folder, the port is not a number or is taken.
*/
async function previewCommand(args) {
	const { values } = parseArgs({
		args: withHostValue(args),
		options: {
			branch: {
				type: "string",
				default: "evalmark"
			},
			folder: {
				type: "string",
				default: "evalmark"
			},
			host: {
				type: "string",
				default: "127.0.0.1"
			},
			port: {
				type: "string",
				default: "4400"
			},
			dir: { type: "string" }
		}
	});
	const port = portOf(values.port);
	const folder = values.dir ?? extractFolder(values.branch, values.folder);
	if (values.dir === void 0) removeOnExit(dirname(folder));
	const server = await serveFolder(folder, port, values.host);
	process.stdout.write(`Serving ${values.dir ?? `${values.folder} from ${values.branch}`} at ${server.url}\n`);
	return server;
}
//#endregion
//#region src/cli/record.ts
/**
* `evalmark record`: records a result into a local folder with the action's store, without git, and
* copies the dashboard next to the data.
*/
/** How `evalmark record` is called. */
const recordUsage = "evalmark record --result <file> --dir <dir> [--labels key=value ...] [--suite name]";
/**
* Runs git in the current directory.
*
* @param args - The arguments.
* @returns What git printed, trimmed, or `undefined` when it failed.
*/
function gitOutput(args) {
	const done = spawnSync("git", args, {
		encoding: "utf8",
		stdio: [
			"ignore",
			"pipe",
			"ignore"
		]
	});
	return done.status === 0 ? done.stdout.trim() : void 0;
}
/**
* Where a local run comes from: the current clone's commit and branch, when there is one.
*
* @returns The source.
*/
function localSource() {
	const commit = gitOutput(["rev-parse", "HEAD"]);
	const branch = gitOutput([
		"rev-parse",
		"--abbrev-ref",
		"HEAD"
	]);
	return {
		...commit ? { commit } : {},
		...branch && branch !== "HEAD" ? { branch } : {},
		event: "local"
	};
}
/**
* Reads the result and drafts the run, with the action's defaults for the policies. Missing
* attachment files are reported on standard error.
*
* @param values - The command's options.
* @param inputs - The action's defaults.
* @param now - The current time.
* @returns The draft.
*/
async function draftOf(values, inputs, now) {
	const labels = parseLabels(values.labels ?? []);
	const result = await readResult(values.result, labels, createRedactor([]));
	const loaded = await loadAttachments(result, dirname(values.result));
	if (loaded.missing.length > 0) process.stderr.write(`${missingText(loaded.missing)}\n`);
	return {
		result,
		id: runIdOf(result.startedAt ?? now.toISOString(), {}),
		suite: values.suite ?? result.suite ?? "evals",
		source: localSource(),
		recordedAt: now.toISOString(),
		transcripts: inputs.transcripts,
		attachments: inputs.attachments,
		attachmentFiles: loaded.files
	};
}
/**
* Records a result into a folder.
*
* @param args - The command's arguments.
* @param siteDir - The built dashboard's folder.
* @returns What recording did, and the folder it recorded into.
* @throws When an argument is missing or the result is invalid.
*/
async function recordCommand(args, siteDir = defaultSiteDir()) {
	const { values } = parseArgs({
		args,
		options: {
			result: { type: "string" },
			dir: { type: "string" },
			labels: {
				type: "string",
				multiple: true
			},
			suite: { type: "string" }
		}
	});
	const { result, dir } = values;
	if (!result || !dir) throw new Error(`Usage: ${recordUsage}`);
	const defaults = readInputs({});
	const now = /* @__PURE__ */ new Date();
	return {
		...await storeRun(dir, await draftOf({
			...values,
			result,
			dir
		}, defaults, now), {
			...defaults,
			defaultBranch: void 0,
			siteDir,
			now
		}),
		dir
	};
}
//#endregion
//#region src/cli/main.ts
/**
* The `evalmark` command: `record` a result into a local folder, `import` another tool's output,
* `preview` a branch's dashboard, `demo` a synthetic history.
*/
/** The commands, by name. */
const commands = {
	record: async (args) => {
		const outcome = await recordCommand(args);
		const size = sizeReportOf(outcome, outcome.dir, readInputs({}).warnSizeMb);
		process.stdout.write(`Recorded run ${outcome.run.id}. ${sizeLine(size)}\n`);
		const warning = sizeWarning(size);
		if (warning !== void 0) process.stderr.write(`${warning}\n`);
	},
	import: async (args) => {
		const paths = await importCommand(args);
		process.stdout.write(`Wrote ${paths.length} result${paths.length === 1 ? "" : "s"}:\n`);
		for (const path of paths) process.stdout.write(`  ${path}\n`);
	},
	demo: demoCommand,
	preview: async (args) => {
		await previewCommand(args);
	}
};
/** The usage text. */
const usage = [
	"Usage:",
	`  ${recordUsage}`,
	`  ${importUsage}`,
	`  ${previewUsage}`,
	`  ${demoUsage}`,
	""
].join("\n");
/**
* Runs the command the arguments name.
*
* @param argv - The arguments after the program's name.
* @returns The exit code.
*/
async function main(argv) {
	const [name = "", ...args] = argv;
	const command = commands[name];
	if (command === void 0) {
		process.stderr.write(usage);
		return name === "" || name === "help" || name === "--help" ? 0 : 1;
	}
	try {
		await command(args);
		return 0;
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		return 1;
	}
}
process.exitCode = await main(process.argv.slice(2));
//#endregion
export {};
