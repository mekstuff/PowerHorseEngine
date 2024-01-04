/* Made with ❤ By mekstuff */

type PrimitiveValuePostValidator<V = unknown> = (player: Player | undefined, value: V) => unknown;

/**
 * Definition of a PrimitiveValue
 */
export type PrimitiveValue<T = unknown, R extends boolean = false> = R extends true
	? T
	: {
			Type: string;
			default?: unknown;
			postValidate?: PrimitiveValuePostValidator[];
			params?: { [key: string]: unknown };
	  };

/**
 * The `custom` Primitive handler type
 */
export type defineCustomPrimitiveParamsHandler<V> = (
	value: unknown,
	initiator: Player | undefined,
	primitive: PrimitiveValue,
	keyTrace: string | undefined,
) => V;

export type booleanPrimitive<R extends boolean> = PrimitiveValue<boolean, R>;
export type booleanPrimitiveParams = {
	literal: true | false;
};

export type stringPrimitive<R extends boolean> = PrimitiveValue<string, R>;
export type stringPrimitiveParams = {
	literal?: string;
	min?: number;
	max?: number;
};

export type Color3Primitive<R extends boolean> = PrimitiveValue<Color3, R>;
// export type Color3PrimitiveParams = {};

export type Vector2Primitive<R extends boolean> = PrimitiveValue<Vector2, R>;
// export type Vector2PrimitiveParams = {};

export type Vector3Primitive<R extends boolean> = PrimitiveValue<Vector3, R>;
// export type Vector3PrimitiveParams = {};

export type CFramePrimitive<R extends boolean> = PrimitiveValue<CFrame, R>;
// export type CFramePrimitiveParams = {};

export type InstancePrimitive<R extends boolean, I extends keyof Instances> = PrimitiveValue<Instances[I], R>;
export type InstancePrimitiveParams = {
	InstanceType: keyof Instances;
};

export type numberPrimitive<R extends boolean> = PrimitiveValue<number, R>;
export type numberPrimitiveParams = {
	min?: number;
	max?: number;
	error?: boolean;
};

export type objectPrimitive<R extends boolean, O extends object> = PrimitiveValue<O, R>;

export type arrayPrimitive<R extends boolean, O> = PrimitiveValue<O[], R>;

export type dictionaryPrimitive<R extends boolean, K extends string | number | symbol, V> = PrimitiveValue<
	{ [Key in K]: V },
	R
>;
// type dictionaryPrimitiveParams = {};

/**
 * Type definitions for primitives.
 */
type Primitives = {
	/**
	 * Accepts only the given types passed, values are checked with `typeIs`. You can use this for Primitive types that do not exist.
	 */
	type: <T extends CheckableTypes, Y extends keyof T>(...types: Y[]) => T[Y];
	/**
	 * Define a custom primitive
	 *
	 * ```ts
	 * // a custom primitive
	 * stringExample: p.custom<string>((value, initiator, primitive, keyTrace) => {
	 * 	return "";
	 * }),
	 *
	 * // a custom primitive modifier
	 * modifierExample: <T>(input: T) => {
	 * 	return p.custom<T>((value, initiator, primitive) => {
	 * 		return value as T;
	 * 	});
	 * },
	 * ```
	 */
	custom: <T>(handler: defineCustomPrimitiveParamsHandler<T>) => PrimitiveValue<T, true>;
	/**
	 * unknown value, basically will be ignored.
	 */
	unknown: () => PrimitiveValue<unknown, true>;
	/**
	 * expects a nil value
	 */
	undefined: () => PrimitiveValue<undefined, true>;
	/**
	 * expects a boolean value
	 */
	boolean: (params?: booleanPrimitiveParams) => booleanPrimitive<true>;
	/**
	 * expects a string value
	 */
	string: (params?: stringPrimitiveParams) => stringPrimitive<true>;
	/**
	 * expects a number value
	 */
	number: (params?: numberPrimitiveParams) => numberPrimitive<true>;
	/**
	 * expects a Color3 value
	 */
	Color3: () => Color3Primitive<true>;
	/**
	 * expects a Vector2 value
	 */
	Vector2: () => Vector2Primitive<true>;
	/**
	 * expects a Vector3 value
	 */
	Vector3: () => Vector3Primitive<true>;
	/**
	 * expects a CFrame value
	 */
	CFrame: () => CFramePrimitive<true>;
	/**
	 * expects an Instance value
	 */
	Instance: <P extends InstancePrimitiveParams>(params?: P) => InstancePrimitive<true, P["InstanceType"]>;
	/**
	 * expects an array value
	 */
	array: <V>(array: V) => arrayPrimitive<true, V>;
	/**
	 * expects an object value
	 */
	object: <O extends object>(object: O) => objectPrimitive<true, O>;
	/**
	 * expects a dictionary value
	 */
	dict: <K extends string | number | symbol, V>(
		key: K,
		value: V,
		dropInvalidInputs?: boolean,
	) => dictionaryPrimitive<true, K, V>;
	/**
	 * Post Validate. Returning a value other than `undefined` will result in the value be changed to that.
	 *
	 * You can have multiple validations on top of each other.
	 */
	validate: <V>(Primitive: V, Validator: PrimitiveValuePostValidator<V>) => PrimitiveValue<V, true>;

	/**
	 * expects either of the primitives listed
	 */
	either: <V extends unknown[]>(...primitives: V) => PrimitiveValue<V[number], true>;
	/**
	 * Sets the default value of the Primitive
	 */
	default: <V>(Primitive: V, value: V) => PrimitiveValue<V, true>;
	/**
	 * Adds `undefined` primitive to a `either` modifier and makes it optional
	 */
	optional: <V>(Primitive: V) => PrimitiveValue<V | undefined, true>;

	/**
	 * runs the `exec` function, this is **NOT** a primitive value nor modifier but was included to have the enable the import of only primitives.
	 */
	exec: <res>(primitive: res, input: res extends object ? res : res | undefined, initiator?: Player) => Promise<res>;
	/**
	 * runs the `execSync` function, this is **NOT** a primitive value nor modifier but was included to have the enable the import of only primitives.
	 */
	execSync: <res>(primitive: res, input: res extends object ? res : res | undefined, initiator?: Player) => res;
};

/**
 * Primitive handlers.
 */
const p: Primitives = {
	type: (...types) => {
		const pv: PrimitiveValue = {
			Type: "$type",
			params: {
				types: types,
			},
		};
		return pv as never;
	},
	custom: (handler) => {
		const pv: PrimitiveValue = {
			Type: "$custom",
			params: {
				handler: handler,
			},
		};
		return pv as never;
	},
	unknown: () => {
		const pv: PrimitiveValue = {
			Type: "unknown",
		};
		return pv as never;
	},
	undefined: () => {
		const pv: PrimitiveValue = {
			Type: "undefined",
		};
		return pv as never;
	},
	boolean: (params) => {
		const pv: PrimitiveValue = {
			Type: "boolean",
			params: params,
		};
		return pv as never;
	},
	string: (params) => {
		const pv: PrimitiveValue = {
			Type: "string",
			params: params,
		};
		return pv as never;
	},
	number: (params) => {
		const pv: PrimitiveValue = {
			Type: "number",
			params: params,
		};
		return pv as never;
	},
	Color3: () => {
		const pv: PrimitiveValue = {
			Type: "Color3",
			// params: params,
		};
		return pv as never;
	},
	Vector2: () => {
		const pv: PrimitiveValue = {
			Type: "Vector2",
			// params: params,
		};
		return pv as never;
	},
	Vector3: () => {
		const pv: PrimitiveValue = {
			Type: "Vector3",
			// params: params,
		};
		return pv as never;
	},
	CFrame: () => {
		const pv: PrimitiveValue = {
			Type: "CFrame",
			// params: params,
		};
		return pv as never;
	},
	Instance: (params) => {
		const pv: PrimitiveValue = {
			Type: "Instance",
			params: params,
		};
		return pv as never;
	},
	array: (array) => {
		const pv: PrimitiveValue = {
			Type: "array",
			params: {
				array: array,
			},
		};
		return pv as never;
	},
	object: (object) => {
		const pv: PrimitiveValue = {
			Type: "object",
			params: {
				object: object,
			},
		};
		return pv as never;
	},
	dict: (k, v, dropInvalidInputs) => {
		const pv: PrimitiveValue = {
			Type: "dictionary",
			params: {
				key: k,
				value: v,
				dropInvalidInputs,
			},
		};
		return pv as never;
	},
	validate: (primitive, validator) => {
		const p = primitive as PrimitiveValue;
		if (!p.postValidate) {
			p.postValidate = [];
		}
		p.postValidate.push(validator as never);
		return primitive as never;
	},
	either: (...primitives) => {
		const np: PrimitiveValue = {
			Type: "$either",
			params: {
				options: primitives,
			},
		};
		return np;
	},
	default: (primitive, v) => {
		(primitive as PrimitiveValue).default = v;
		return primitive as never;
	},
	optional: (primitive) => {
		const v = p.either(primitive, p.undefined());
		return v as never;
	},

	//
	exec: (primitive, input, initiator) => {
		return exec(primitive, input, initiator);
	},
	execSync: (primitive, input, initiator) => {
		return execSync(primitive, input, initiator);
	},
};

/**
 * Main entry handler for primitives.
 *
 * Calls itself recursively for dictionaries and objects until all are resolved.
 */
function validateType(up: unknown, input: unknown, initiator?: Player, usekeyTrack?: string) {
	if (!typeIs(up, "table")) {
		throw `The primitive value ${up} was expected to be a table. Got ${typeOf(up)}`;
	}
	const primitive = up as objectPrimitive<false, {}>;
	const v = primitive as PrimitiveValue;

	// postValidate primitive
	if (v.postValidate) {
		v.postValidate.forEach((cb) => {
			const res = cb(initiator, input);
			if (res !== undefined) {
				input = res;
			}
		});
	}
	if (primitive.default !== undefined && input === undefined) {
		input = primitive.default;
	}
	// dictionary primitive
	if (primitive.Type === "dictionary") {
		const nd: { [key: string]: unknown } = {};
		if (!typeIs(primitive.params, "table")) {
			throw `Invalid params of dictionary.`;
		}
		if (!typeIs(input, "table")) {
			throw `Invalid input for dictionary. ${
				typeIs(input, "nil")
					? `The input was undefined, did you forget to specify a "default" object for this dictionary?`
					: ""
			}`;
		}
		for (const [a, b] of pairs(input as typeof nd)) {
			let vk: string;
			try {
				vk = validateType(primitive.params.key, a, initiator, usekeyTrack) as string;
			} catch (err) {
				const logm = `The key "${a}" is incorrect for "${usekeyTrack}" -> ${
					(primitive.params.key as PrimitiveValue).Type as string
				}, ${err}`;
				if (primitive.params.dropInvalidInputs === true) {
					warn(logm + "\n\nKey will be ignored and dropped.");
					continue;
				} else {
					throw logm;
				}
			}
			try {
				nd[vk] = validateType(primitive.params.value, b, initiator, usekeyTrack);
			} catch (err) {
				const logm = `The value "${b}" is incorrect for "${usekeyTrack}" -> ${
					(primitive.params.value as PrimitiveValue).Type as string
				}, ${err}`;
				if (primitive.params.dropInvalidInputs === true) {
					warn(logm + "\n\nValue will be ignored and dropped.");
					continue;
				} else {
					throw logm;
				}
			}
		}
		return nd;
	}
	// array primitive
	if (primitive.Type === "array") {
		if (!typeIs(input, "table")) {
			throw `table expected for array primitive, got "${typeOf(input)}"`;
		}
		const arrayTypeExpected = primitive.params?.array;
		if (arrayTypeExpected === undefined) {
			throw `Could not resolve expected array type.`;
		}
		for (const [a, b] of pairs(input)) {
			if (!typeIs(a, "number")) {
				throw `key "${a}" is not permitted inside of an array primitive. only type of "number" are permitted but got "${typeOf(
					a,
				)}"`;
			}
			const [s, r] = pcall(() => {
				validateType(arrayTypeExpected, b, initiator, usekeyTrack);
			});
			if (s === false) {
				throw `Value for array item "[${a}]=${b}" failed. ${r}`;
			}
		}
		return input;
	}
	// object primitive
	if (primitive.Type === "object") {
		return validateObjectKeyValues(up, input, initiator, usekeyTrack);
	}
	// either primitive
	if (primitive.Type === "$either") {
		if (!typeIs(primitive.params, "table")) {
			throw `Invalid params of $either.`;
		}
		const options = primitive.params.options as { [key: string]: PrimitiveValue };
		let success = false;
		let err = "";
		let valuefromeither: unknown;
		for (const [a, b] of pairs(options)) {
			const [s, r] = pcall(() => {
				valuefromeither = validateType(b, input, initiator, usekeyTrack);
			});
			if (s === true) {
				success = true;
				break;
			} else {
				err += r;
			}
		}
		if (success === false) {
			throw `either options failed: ${err}`;
		} else {
			return valuefromeither;
		}
	}
	// type primitive
	if (primitive.Type === "$type") {
		if (!typeIs(primitive.params, "table")) {
			throw `Invalid params of $type.`;
		}
		const types = primitive.params.types as string[];
		let t: string | undefined;
		for (const x of types) {
			if (typeIs(input, x as keyof CheckableTypes)) {
				t = x;
				break;
			}
		}
		if (t === undefined) {
			throw `The type ${typeOf(input)} did not match any of the types: ${types.join(",")}`;
		}
		return input;
	}
	// custom primitive
	if (primitive.Type === "$custom") {
		if (!typeIs(primitive.params, "table")) {
			throw `Invalid params of $custom.`;
		}
		const handler = primitive.params.handler as defineCustomPrimitiveParamsHandler<unknown>;
		return handler(input, initiator, primitive, usekeyTrack);
	}
	// unknown primitive
	if (primitive.Type === "unknown") {
		return input;
	}
	// undefined primitive
	if (primitive.Type === "undefined") {
		if (typeIs(input, "nil")) {
			return input;
		}
	}
	// string primitive
	if (primitive.Type === "string") {
		if (!typeIs(input, "string")) {
			throw `string expected, got ${typeOf(input)}`;
		}
		const params = (primitive.params ?? {}) as stringPrimitiveParams;
		if (typeIs(params.literal, "string")) {
			if (input !== params.literal) {
				throw `string expected to be literal value "${params.literal}", but got "${input}".`;
			}
		}
		if (params.min !== undefined && input.size() < params.min) {
			throw `string must be minimum of ${params.min}, "${input}" has a length of ${input.size()}`;
		}
		if (params.max !== undefined) {
			input = input.sub(1, params.max);
		}
		return input;
	}
	// number primitive
	if (primitive.Type === "number") {
		if (!typeIs(input, "number")) {
			throw `number expected, got ${typeOf(input)}`;
		}
		const params = (primitive.params ?? {}) as numberPrimitiveParams;
		if (params.error) {
			if (params.min !== undefined && input < params.min) {
				throw `number must be minimum of ${params.min}, value is ${input}`;
			}
			if (params.max !== undefined && input > params.max) {
				throw `number must be maximum of ${params.max}, value is ${input}`;
			}
		}
		return math.clamp(input, params.min ?? -math.huge, params.max ?? math.huge);
	}

	// Instance primitive
	if (primitive.Type === "Instance") {
		if (!typeIs(input, "Instance")) {
			throw `Instance expected, got ${typeOf(input)}`;
		}
		const params = (primitive.params ?? {}) as InstancePrimitiveParams;
		if (!input.IsA(params.InstanceType)) {
			throw `Instance expected to be of type ${params.InstanceType}, but got ${typeOf(input)}`;
		}
		return input;
	}

	// primitive that do not have any params and did not get handled manually by Type above, just check if the type defined is the typeOf input.
	if (!typeIs(input, primitive.Type as keyof CheckableTypes)) {
		throw `${primitive.Type}* expected, got ${typeOf(input)}*`; //error with * to notify that it was an "estimated" error.
	}

	print("\n\n", primitive.Type, ":", primitive);
	throw `^^ unhandled type printed above ^^\n\n`;
}

/**
 * For validating objects
 */
function validateObjectKeyValues(up: unknown, ut: unknown, initiator?: Player, usekeyTrack?: string) {
	if (!typeIs(up, "table")) {
		throw `The input value ${up} was expected to be a table. Got ${typeOf(up)}`;
	}
	if (!typeIs(ut, "table")) {
		throw `The target value ${ut} was expected to be a table. Got ${typeOf(ut)}`;
	}
	const primitive = up as objectPrimitive<false, {}>;
	const target = ut as { [key: string]: unknown };
	if (primitive.Type !== "object") {
		throw `The input value is not a valid primitive object.`;
	}
	if (!typeIs(primitive.params, "table")) {
		throw `Invalid params of object.`;
	}
	const obj = primitive.params.object as typeof target;
	const resolvedObject: { [key: string]: unknown } = {};
	for (const [a, b] of pairs(obj)) {
		const trackKey = (usekeyTrack !== undefined ? `${usekeyTrack}/${a}` : a) as string;
		let [s, r] = pcall(() => {
			return validateType(b, target[a], initiator, trackKey);
		});
		if (typeIs(primitive.default, "table")) {
			if (s === false) {
				if ((primitive.default as typeof resolvedObject)[a as string] !== undefined) {
					warn(
						`"${trackKey}" => ${r}. Falling back to default value "${
							(primitive.default as typeof resolvedObject)[a]
						}".`,
					);
					s = true;
					r = (primitive.default as typeof resolvedObject)[a];
				}
			}
		}
		if (s === false) {
			throw `object validation failed for key "${trackKey}": ${r}`;
		} else {
			resolvedObject[a] = r;
		}
	}
	return resolvedObject;
}

/**
 * Validates the `input` against the `primitive`. If successful, will resolve with the altered input, input
 * can be altered in cases like having a string with a maximum length, if the text overflows, it will be cut
 * to size and returned.
 */
function exec<res>(
	primitive: res,
	input: res extends object ? res : res | undefined,
	initiator?: Player,
): Promise<res> {
	return new Promise((resolve) => {
		if (!typeIs(primitive, "table")) {
			throw `exec argument #2 was expected to be a primitive. Got ${typeOf(primitive)}`;
		}
		resolve(validateType(primitive, input, initiator) as res);
	});
}
/**
 * Runs `exec` synchronously.
 */
export function execSync<res>(
	primitive: res,
	input: res extends object ? res : res | undefined,
	initiator?: Player,
): res {
	const r = exec(primitive, input, initiator).await();
	if (r[0] === false) {
		throw r[1];
	}
	return r[1];
}

/**
 * Primitive schema types.
 */
export type SchemaPrimitives = Omit<typeof p, "exec" | "execSync" | "custom">;
/**
 * Only includes primitives that should be used for a `schema`.
 */
export const PrimitivesForSchema: SchemaPrimitives = {
	string: p.string,
	boolean: p.boolean,
	CFrame: p.CFrame,
	default: p.default,
	dict: p.dict,
	either: p.either,
	Instance: p.Instance,
	number: p.number,
	array: p.array,
	object: p.object,
	optional: p.optional,
	type: p.type,
	undefined: p.undefined,
	unknown: p.unknown,
	validate: p.validate,
	Color3: p.Color3,
	Vector2: p.Vector2,
	Vector3: p.Vector3,
};

export default p;
export { exec, p, p as Primitives };
