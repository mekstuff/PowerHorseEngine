import { format } from "@mekstuff-rbxts/format";

/**
 * Used by object metatables for changed to properly print values.
 */
function stringifyValueForPrint(input: unknown): string {
	if (typeIs(input, "string")) {
		return `"${input}"`;
	}
	return tostring(input);
}

function getValue(t: object, key: string | string[]) {
	if (typeIs(key, "table")) {
		let lastv: { [key: string]: unknown } = t as { [key: string]: unknown };
		for (const [a, b] of ipairs(key)) {
			if (a === key.size()) {
				return lastv[b];
			} else {
				const pv = lastv[b];
				let nv: typeof lastv | undefined;
				if (pv === undefined) {
					return undefined;
				} else {
					if (typeIs(pv, "table")) {
						nv = pv as typeof lastv;
					} else {
						return undefined;
					}
				}
				lastv[b] = nv;
				lastv = nv;
			}
		}
	} else {
		return (t as { [key: string]: unknown })[key];
	}
}

type TrackableTableMethods<T extends object, K extends keyof T = keyof T> = {
	/**
	 * Calls .push on the table but also triggers detection
	 * @hidden
	 * @private
	 * @deprecated
	 */
	readonly _push: (...items: unknown[]) => number;
	/**
	 * @hidden
	 * @private
	 * @deprecated
	 */
	readonly forEach: (callback: (v: T[K], i: K) => void) => void;
	/**
	 * @hidden
	 * @private
	 * @deprecated
	 */
	readonly size: () => number;
	/**
	 * @hidden
	 * @private
	 * @deprecated
	 */
	readonly Destroy: () => void;
	/**
	 * @hidden
	 * @private
	 * @deprecated
	 */
	readonly Bind: (callback: (...args: unknown[]) => Callback | void) => void;
	/**
	 * @hidden
	 * @private
	 * @deprecated
	 */
	readonly GetProxy: () => { [key: string | number]: unknown };
	/**
	 * @hidden
	 * @private
	 * @deprecated
	 */
	readonly Rawset: (key: unknown, value: unknown) => void;
	/**
	 * @hidden
	 * @private
	 * @deprecated
	 */
	readonly ChildAdded: RBXScriptSignal;
	/**
	 * @hidden
	 * @private
	 * @deprecated
	 */
	readonly ChildRemoved: RBXScriptSignal;
	/**
	 * @hidden
	 * @private
	 * @deprecated
	 */
	readonly ChildChanged: RBXScriptSignal;
	/**
	 * @hidden
	 * @private
	 * @deprecated
	 */
	readonly ChildAdded_Event: BindableEvent;
	/**
	 * @hidden
	 * @private
	 * @deprecated
	 */
	readonly ChildRemoved_Event: BindableEvent;
	/**
	 * @hidden
	 * @private
	 * @deprecated
	 */
	readonly ChildChanged_Event: BindableEvent;
	/**
	 * @hidden
	 * @private
	 * @deprecated
	 */
};

export type TrackableTable<T extends object> = {
	[K in keyof T]: T[K];
} & Readonly<TrackableTableMethods<T>>;

function createTrackableTable<T extends object>(
	t: T,
	nestedTablesAreTracked?: boolean,
	__ROOT?: TrackableTable<object>,
	__PRINT_INDEX?: number,
	__PREVIOUS_KEYS?: unknown[],
): TrackableTable<T> {
	const CURRENT_IS_ROOT = __ROOT === undefined ? true : false;
	const proxy: { [key: string]: unknown } = {};
	for (const [a, b] of pairs(t as typeof proxy)) {
		let ub = b;
		if (typeIs(b, "table")) {
			if (__PREVIOUS_KEYS !== undefined) {
				__PREVIOUS_KEYS = [...__PREVIOUS_KEYS, a];
			}
			ub = createTrackableTable(b, nestedTablesAreTracked, __ROOT, __PRINT_INDEX, __PREVIOUS_KEYS);
		}
		proxy[a] = ub;
		(t as typeof proxy)[a] = undefined;
	}
	const ChildAddedEvent = __ROOT === undefined ? new Instance("BindableEvent") : __ROOT.ChildAdded_Event;
	const ChildRemovedEvent = __ROOT === undefined ? new Instance("BindableEvent") : __ROOT.ChildRemoved_Event;
	const ChildChangedEvent = __ROOT === undefined ? new Instance("BindableEvent") : __ROOT.ChildChanged_Event;
	if (CURRENT_IS_ROOT === true) {
		let _tFolder = game.GetService("ReplicatedStorage").FindFirstChild("_phe-trackable-tables-temp-view");
		if (_tFolder === undefined) {
			_tFolder = new Instance("Folder");
			_tFolder.Name = "_phe-trackable-tables-temp-view";
			_tFolder.Parent = game.GetService("ReplicatedStorage");
		}
		ChildAddedEvent.Parent = _tFolder;
		ChildRemovedEvent.Parent = _tFolder;
		ChildChangedEvent.Parent = _tFolder;
	}
	__ROOT = __ROOT ?? (t as TrackableTable<object>);
	__PRINT_INDEX = __PRINT_INDEX !== undefined ? __PRINT_INDEX + 1 : 1;
	const _t_tostring = tostring(t);
	const GUID = game.GetService("HttpService").GenerateGUID();
	const UniqueGroupName = `${GUID}:${tostring(_t_tostring)}`;
	ChildAddedEvent.Name = `${UniqueGroupName}-ChildAddedEvent`;
	ChildRemovedEvent.Name = `${UniqueGroupName}-ChildRemovedEvent`;
	ChildChangedEvent.Name = `${UniqueGroupName}-ChildChangedEvent`;

	const nestedTableConnections: Map<string, TrackableTable<{}>> = new Map();

	const methods: TrackableTableMethods<T> = {
		_push: () => {
			return 1;
		},
		Rawset: (key, value) => {
			proxy[key as string] = value;
		},
		forEach: (callback) => {
			const _arg_0 = (a: unknown, b: unknown) => {
				callback(b as never, a as never);
			};
			for (const [a, b] of pairs(proxy)) {
				_arg_0(a, b);
			}
		},
		size: () => {
			return Object.length(proxy);
		},
		Destroy: () => {
			if (CURRENT_IS_ROOT) {
				ChildAddedEvent.Destroy();
				ChildChangedEvent.Destroy();
				ChildRemovedEvent.Destroy();
			}
			nestedTableConnections.forEach((x) => {
				x.Destroy();
			});
			setmetatable(t, undefined as unknown as LuaMetatable<object>);
			for (const [a, b] of pairs(proxy)) {
				(t as typeof proxy)[a] = b;
			}
		},
		Bind: (callback) => {
			const keyCleanups: Map<string, Callback[]> = new Map();
			const runCallback = (k: string, ...args: unknown[]) => {
				const res = callback(k, ...args);
				if (res !== undefined) {
					if (!keyCleanups.has(k)) {
						keyCleanups.set(k, []);
					}
					const r = keyCleanups.get(k)!;
					r.push(res);
				}
			};
			// let cleanupfunc: Callback | void;
			ChildAddedEvent.Event.Connect((k, ...args) => {
				runCallback(k, ...(args as unknown[]));
			});
			ChildRemovedEvent.Event.Connect((k) => {
				const r = keyCleanups.get(k);
				if (r !== undefined) {
					r.forEach((x) => {
						x(true);
					});
				}
				keyCleanups.delete(k);
			});
			ChildChangedEvent.Event.Connect((k, ...args) => {
				const r = keyCleanups.get(k);
				if (r !== undefined) {
					r.forEach((x) => {
						x();
					});
				}
				keyCleanups.delete(k);
				runCallback(k, ...(args as unknown[]));
			});
		},
		GetProxy: () => {
			const g: typeof proxy = {};
			for (const [a, b] of pairs(proxy)) {
				if (typeIs(b, "table") && typeIs(Object.getValue(b, "GetProxy"), "function")) {
					g[a] = (b as TrackableTable<object>).GetProxy();
				} else {
					g[a] = b;
				}
			}
			return g;
		},
		ChildAdded: ChildAddedEvent.Event,
		ChildRemoved: ChildRemovedEvent.Event,
		ChildChanged: ChildChangedEvent.Event,
		ChildAdded_Event: ChildAddedEvent,
		ChildRemoved_Event: ChildRemovedEvent,
		ChildChanged_Event: ChildChangedEvent,
	};
	return setmetatable(t, {
		__tostring: () => {
			let t_print = ``;
			for (const [a, b] of pairs(proxy)) {
				t_print = `\n${"\t".rep(__PRINT_INDEX ?? 1)}${stringifyValueForPrint(a)}: ${stringifyValueForPrint(b)}`;
			}
			return `˅ ${_t_tostring}${t_print}`;
		},
		__newindex: (_, k, v) => {
			const __PKEYS = __PREVIOUS_KEYS !== undefined ? [...__PREVIOUS_KEYS, k] : [k];
			if (typeIs(v, "table") && nestedTablesAreTracked === true) {
				const oldNestedTable = nestedTableConnections.get(k as string);
				if (oldNestedTable !== undefined) {
					oldNestedTable.Destroy();
				}
				v = createTrackableTable(v, nestedTablesAreTracked, __ROOT, __PRINT_INDEX, __PKEYS);
				nestedTableConnections.set(k as string, v as TrackableTable<object>);
			}
			const oldValueInProxy = proxy[k as string];
			proxy[k as string] = v;
			if (v === undefined && oldValueInProxy !== undefined) {
				// child removed
				const ntc = nestedTableConnections.get(k as string);
				if (ntc !== undefined) {
					ntc.Destroy();
					nestedTableConnections.delete(k as string);
				}
				ChildRemovedEvent.Fire(k, [k]);
			} else {
				if (oldValueInProxy !== v) {
					if (oldValueInProxy === undefined) {
						// child added
						ChildAddedEvent.Fire(k, v, __PKEYS);
					} else {
						// child changed
						const ntc = nestedTableConnections.get(k as string);
						if (!typeIs(v, "table") && ntc !== undefined) {
							ntc.Destroy();
							nestedTableConnections.delete(k as string);
						}
						ChildChangedEvent.Fire(k, v, __PKEYS);
					}
				}
			}
		},
		__index: (_, k) => {
			const method = (methods as typeof proxy)[k as string];
			if (method !== undefined) {
				return method;
			}
			return proxy[k as string];
		},
	}) as TrackableTable<T>;
}

function setValue(t: object, key: string, value: unknown): void;
function setValue(t: object, key: string[], value: unknown): void;
function setValue(t: object, key: string | string[], value?: unknown) {
	const totalKeys = keys(t);
	/*
	const runOnSetValueCallbacks = () => {
		const onsetcallbacks = Object_OnSetValueCallbacks.get(t);
		if (onsetcallbacks !== undefined) {
			for (const x of onsetcallbacks) {
				const res = x(key, value);
				if (res !== undefined) {
					value = res;
				}
			}
		}
	};
	*/
	if (typeIs(key, "table")) {
		let lastv: { [key: string]: unknown } = t as { [key: string]: unknown };
		key.forEach((b, a) => {
			if (a === key.size() - 1) {
				// runOnSetValueCallbacks();
				lastv[b] = value;
			} else {
				const pv = lastv[b];
				let nv: typeof lastv | undefined;
				if (pv === undefined) {
					nv = {};
				} else {
					if (typeIs(pv, "table")) {
						nv = pv as typeof lastv;
					} else {
						warn(
							`${t} "${b}" was of type ${typeOf(
								pv,
							)} and not a table. It will be converted to a table but if this was unintended, you have a bug.`,
						);
						nv = {};
					}
				}
				lastv[b] = nv;
				lastv = nv;
			}
		});
	} else {
		// runOnSetValueCallbacks();
		(t as { [key: string]: unknown })[key] = value;
	}
}

//
function keys<T extends object>(t: T): (keyof T)[] {
	const keys: (keyof T)[] = [];
	for (const [a, _] of pairs(t)) {
		keys.push(a as keyof T);
	}
	return keys;
}

//
function values<T extends object, K extends keyof T>(t: T): T[K][] {
	const values: defined[] = [];
	for (const [_, v] of pairs(t)) {
		values.push(v as defined);
	}
	return values as T[K][];
}

//
function length(t: object) {
	return values(t).size();
}

/**
 * Useful for having items with different rarities
 */
function weightChances<T>(
	target: object,
	chanceIdentifierFunction?: (key: unknown, value: T) => number,
): LuaTuple<[number, T]> {
	if (!chanceIdentifierFunction) {
		chanceIdentifierFunction = function (key, value) {
			const asNumber = tonumber(value);
			if (asNumber !== undefined) {
				warn(
					`Array.weighChances default IdentifierFunction tried to use the value of the item, but failed. If value of items aren't numbers, pass a custom chanceIdentifierFunction. ${key} = ${value}`,
				);
				return 0;
			} else {
				return asNumber as unknown as number;
			}
		};
	}
	let w = 0;
	const chances_t: { [key: number]: number } = {};
	for (const [a, b] of pairs(target)) {
		const chance: number = chanceIdentifierFunction(a, b as T);
		assert(
			typeIs(chance, "number"),
			`number expected from .weightChances chanceIdentifierFunction, got ${typeOf(chance)}`,
		);
		chances_t[a as number] = chance;
		w += chance;
	}
	if (w < 1) {
		return $tuple(-1, undefined as T);
	}
	const rand = math.random(1, w);
	w = 0;
	for (const [a, b] of pairs(target)) {
		w += chances_t[a as number];
		if (w >= rand) {
			return $tuple(a as number, b as T);
		}
	}
	return $tuple(-1, undefined as T);
}

/**
 * Adapt/Reconcile an array
 *
 * ## Unstable.
 *
 * ```ts
 * const t1 = {
 * 	a: true,
 *  b: "this will stay as string unless properTypes is set to true"
 * }
 *
 * const t2 = {
 * 	a: false, //this will true when t1 adapts `t2` since both have the same key types, but t1 is true
 *  b: false //since `t1's` b is of type string, when `t1` adapts `t2` without properTypes set to false, then it will remain string. with properTypes set to true then it will fallback to this boolean of false.
 * }
 * 	c: "since `t1` doesn't have a c key, this will be set in `t1` when `t1` adapts `t2`"
 * Array.Adapt(t1, t2)
 * ```
 *
 */
function Adapt(
	queryTable: { [key: string | number]: unknown },
	originalTable: { [key: string | number]: unknown },
	properTypes?: boolean,
	AdaptNested?: boolean,
	onImproperType?: (
		key: string | unknown,
		value: unknown,
		newValue: unknown,
		originalTable: unknown,
		queryTable: unknown,
	) => unknown,
) {
	for (const [a, b] of pairs(originalTable)) {
		let useB = b;
		if (queryTable[a] === undefined) {
			if (typeIs(useB, "string") && useB.match("^%*%*")[0]) {
				const DEFAULT = useB.match("default:(.+)")[0];
				queryTable[a] = format(DEFAULT).fromStrToObj();
			} else {
				queryTable[a] = useB;
			}
		} else {
			let btypeof: string | undefined = typeOf(useB) as string;
			if (typeIs(useB, "string") && useB.match("^%*%*")[0]) {
				const DEFAULT = useB.match("default:(.+)")[0];
				let supportedTypes: string[];
				if (DEFAULT !== undefined) {
					supportedTypes = useB
						.sub(3, useB.size())
						.gsub(DEFAULT as string, "")[0]
						.split("|");
				} else {
					supportedTypes = useB.sub(3, useB.size()).split("|");
				}
				let hasProperType = false;
				for (const v of supportedTypes) {
					if (typeOf(queryTable[a] === v)) {
						useB = queryTable[a];
						hasProperType = true;
						btypeof = v;
						break;
					}
				}
				if (!hasProperType) {
					if (DEFAULT !== undefined) {
						useB = format(DEFAULT).fromStrToObj();
					} else {
						btypeof = undefined;
					}
				}
			}
			if (properTypes && typeOf(queryTable[a]) !== btypeof) {
				let v;
				if (onImproperType) {
					const improperResults = onImproperType(a, b, queryTable[a], queryTable, originalTable);
					v = improperResults;
				} else {
					v = b;
				}
				queryTable[a] = v;
			}
		}
		if (AdaptNested && typeIs(b, "table")) {
			// queryTable[a] = Array.Adapt(queryTable[a], b, properTypes, AdaptNested, onImproperType);
		}
	}
	for (const [x] of pairs(queryTable)) {
		if (originalTable[x] === undefined) {
			queryTable[x] = undefined;
		}
	}
	return queryTable;
}

const Object = {
	getValue,
	setValue,
	keys,
	values,
	length,
	weightChances,
	Adapt,
	ttable: createTrackableTable,
};

export { Object };
export default Object;
