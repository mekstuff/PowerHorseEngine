// TODO: usePropertyEffectWrap doesn't get cleanedup!
/**
 * Core if PowerHorseEngine "Pseudo" components
 *
 * Some stuff to note:
 * * If a Pseudo has a property that will initially be undefined, you need to make it "undefined" so rbxts compiles it.
 * * For undefined properties directly in the Pseudo Class like "Parent" ( Not Properties that will be inherited ), We need to manually call
 * the __newindex method on it initially since the Pseudo will not know the property exists and will be considered not a member when attempting to index.
 *
 */

/* eslint-disable roblox-ts/no-private-identifier */
import { Servant } from "./Servant";
import { _typeIs } from "./typeIs";

type UnknownArray = { [key: string]: unknown };
type CreatableReferenceInstanceTypes = Instance | keyof CreatableInstances | (() => Instance);

let CHARSARRAY: string[] | undefined;

/**
 * Creates a new `Servant`. Needed to prevent circular dependency.
 */
function CreateServant(): PHe.Pseudos["Servant"] {
	const [ImportSuccess, Servant] = import("./Servant").await();
	if (ImportSuccess === false) {
		throw "Could not import Servant.";
	}
	return new Servant.Servant();
}

/**
 * Generate a random string for id
 * Change
 */
function GenerateRandomString(length?: number): string {
	if (!CHARSARRAY) {
		CHARSARRAY = [];
		const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";
		for (let i = 1; i <= CHARS.size(); i++) {
			CHARSARRAY.push(CHARS.sub(i, i));
		}
	}
	if (length === undefined) {
		length = 10;
	}
	let str = "";
	for (let i = 1; i < length; i++) {
		str = str + CHARSARRAY[math.random(1, CHARSARRAY.size() - 1)];
	}
	return str;
}

/**
 * The name of the Attribute that will be used to identify Pseudo's.
 */
const _PseudoIdentificationAttrServerName = `_pseudo${GenerateRandomString(4)}`;

const PseudoCollector: { [key: string]: Pseudo } = {};

/**
 * Searches for the pseudo by the id, if no pseudo matches the id then returns nil
 */
export function GetPseudoById(PseudoId: string): Pseudo | undefined {
	assert(typeIs(PseudoId, "string"), `PseudoId expected to be a string, got ${typeOf(PseudoId)}`);
	const t = PseudoCollector[PseudoId];
	return t;
}

/**
 * Tries to get the pseudo id from the object
 */
export function GetPseudoFromObject(Object: unknown): Pseudo | undefined {
	if (typeIs(Object, "Instance")) {
		const attr = Object.GetAttribute(_PseudoIdentificationAttrServerName);
		if (typeIs(attr, "string")) {
			return GetPseudoById(attr);
		}
	} else if (_typeIs(Object, "Pseudo")) {
		return Object;
	}
}

const _NON_DEV_APPROPRIATE_KEYS = ["set", "get", "has", "size", "__id"];
/**
 * Prevents setting reserved _dev keys.
 */
const MUST_BE_DEV_APPROPRIATE = (key: unknown) => {
	if (typeIs(key, "string")) {
		if (_NON_DEV_APPROPRIATE_KEYS.indexOf(key) !== -1) {
			error(`You cannot use the index key "${key}" when assigning to _dev. This key is reserved.`);
		}
	}
};

//useMapping types
type useMapping_mapsdeps = Instance | Pseudo | object;
//usePropertyEffect types
type usePropertyEffectCleanupfunc = (isDestroying?: boolean) => void;
type usePropertyEffectCleanup = usePropertyEffectCleanupfunc | Servant | Promise<unknown> | void;
type _usePropertyEffectMap = Map<string, useEffectServant[]>;
type _usePropertyEffectQuickSearchMap = Map<string, number>;
/**
 * @param usePropertyEffectExecutingServant is a Servant that is created for every useEffect call, this Servant is automatically Destroy'd when the callback
 * cleanup is called. It should be used to keep any items that your useEffect created to verify that they're properly cleaned up even if the cleanup function isn't
 * called ( Sometimes a cleanup function may not be called if the property changes before the effect finishes executing and the returned function was not met, this can happen
 * in cases where there's yielding code in your useEffect callback. )
 */
export type usePropertyEffectCallback = (usePropertyEffectExecutingServant: Servant) => usePropertyEffectCleanup;

type useEffectServant = Servant & {
	_dev: {
		ue: {
			cb: usePropertyEffectCallback;
			cleanup?: usePropertyEffectCleanup;
			executingServants?: Record<string, Servant>;
		};
	};
};

function CreateuseEffectServant(): useEffectServant {
	const Servant = CreateServant();
	Servant._dev.ue = {};
	return Servant as useEffectServant;
}

function CalluseEffectServant(ueServant: useEffectServant, isDestroying?: boolean, onlyCleanup?: boolean) {
	Promise.try(() => {		
		const _cleanup = ueServant._dev.ue.cleanup;
		if (_cleanup) {
			if (typeIs(_cleanup, "function")) {
				_cleanup(isDestroying);
			} else if (Promise.is(_cleanup)) {
				if (_cleanup.getStatus() === "Started") {
					warn(`Unresolved Promise ${tostring(_cleanup)} from useEffectServant will be cancelled.`);
					_cleanup.cancel();
				}
			} else if (_typeIs(_cleanup, "Servant")) {
				_cleanup.Destroy();
			}
		}
		if (ueServant._dev.ue.executingServants) {
			for (const [_, s] of pairs(ueServant._dev.ue.executingServants)) {
				s.Destroy();
			}
			ueServant._dev.ue.executingServants = undefined;
		}
		ueServant._dev.ue.cleanup = undefined;
		if (onlyCleanup) {
			return;
		}
		const [executingServant] = ueServant.Keep(CreateServant());
		ueServant._dev.ue.executingServants = ueServant._dev.ue.executingServants ?? {};
		ueServant._dev.ue.executingServants[executingServant._id] = executingServant;
		const results = ueServant._dev.ue.cb(executingServant);
		if (typeIs(results, "function")) {
			ueServant._dev.ue.cleanup = results;
		} else if (Promise.is(results)) {
			ueServant._dev.ue.cleanup = results;
		} else if (_typeIs(results, "Servant")) {
			ueServant._dev.ue.cleanup = results;
		} else {
			if (results !== undefined) {
				warn(
					`Unknown return type from usePropertyEffect!, Got ${typeOf(
						results,
					)}, but expected either: function, Servant, Promise or nil.`,
				);
			}
		}
	}).catch(err => {
		throw `ERROR Occurred when executing your useEffect "${tostring(ueServant)}": ${err}`;
	})
}
export interface Pseudo {
	/**
	 * Gets the currently assigned properties of the `pseudo` (including nils)
	 *
	 * @param excludeKeys Will not include the given keys, think of it as a blacklist filter.
	 * @param IncludeHiddenProps Hidden props are considered properties that begin with `_`
	 * @param IncludeFunctions Both methods and callbacks are considered functions. (NOTE: functions by classes that inherit pseudo cannot be read, only `Pseudo` functions will exist. )
	 * @param IncludeSignals Will include RBXScriptSignals and some third party library signals, if item has a ClassName of `Signal` | `RBXScriptSignal` it will be considered a signal.
	 * @param AsDictionary Returns the objects as a dictionary with their values.
	 */
	_getCurrentProperties: (
		excludeKeys?: unknown[],
		IncludeHiddenProps?: boolean,
		IncludeFunctions?: boolean,
		IncludeSignals?: boolean,
		AsDictionary?: boolean,
	) => [];
	x: number;
}

function ThrowInternalDestroyWarn(Reason: string, Err: unknown) {
	warn(`Internal Destroy Error (${Reason}) -> ${Err}`);
}
/**
 * Cleans up object
 */
function _desOnObject(f: UnknownArray) {
	const pcallwrap = (func: Callback, reason?: string) => {
		const [s, r] = pcall(() => {
			func();
		});
		if (s === false) {
			ThrowInternalDestroyWarn(reason !== undefined ? reason : "_desOnObject Failed.", r);
		}
	};
	if (typeIs(f, "table")) {
		pcallwrap(() => {
			const destroyMethod: string | undefined =
				f.Destroy !== undefined
					? "Destroy"
					: f.Delete !== undefined
					? "Delete"
					: f.destroy !== undefined
					? "destroy"
					: undefined;
			if (destroyMethod !== undefined) {
				(f[destroyMethod] as Callback)();
			}
		});
	}
	for (const [_, v] of pairs(f)) {
		if (typeIs(v, "function")) {
			continue;
		}
		if (typeIs(v, "RBXScriptConnection")) {
			if (v.Connected) {
				v.Disconnect();
			}
		} else if (_typeIs(v, "threader")) {
			v.tryClose();
		} else if (typeIs(v, "thread")) {
			pcallwrap(() => {
				coroutine.close(v);
			});
		} else if (typeIs(v, "Instance")) {
			pcallwrap(() => {
				v.Destroy();
			});
		} else if (_typeIs(v, "Pseudo")) {
			pcallwrap(() => {
				v.Destroy();
			});
		} else if (Promise.is(v)) {
			pcallwrap(() => {
				v.cancel();
			});
		} else if (typeIs(v, "table")) {
			_desOnObject(v as UnknownArray);
		}
	}
}

/**
 * Seperator used to identify deps from deps string.
 */
const DEPS_STRING_ID_SEPERATOR = "&%^;d%$";

/***/
function getAbstractPseudoId(ClassName: string): string {
	return ClassName + GenerateRandomString();
}

/**
 * Fake methods for a destroying signal.
 */
const FakeDestroyingSignalMethods = {
	ConnectParallel: () => {
		throw "You cannot use 'ConnectParallel' with fake Destroying signal. To get the real signal you will need to create the ReferenceInstance of the Pseudo by using 'CreateRef' or 'GetRef'";
	},
	Wait: () => {
		throw "You cannot use 'Wait' with fake Destroying signal. To get the real signal you will need to create the ReferenceInstance of the Pseudo by using 'CreateRef' or 'GetRef'";
	},
	Once: () => {
		throw "You cannot use 'Once' with fake Destroying signal. To get the real signal you will need to create the ReferenceInstance of the Pseudo by using 'CreateRef' or 'GetRef'";
	},
};

const IgnoreAssignAttributesToKeys: Array<string> = ["Parent"];
/***/
function AssignAttributeValue(ReferenceInstance: Instance, key: unknown, value: unknown) {
	if (typeIs(key, "string")) {
		if (key.match("^_")[0] !== undefined) {
			return;
		}
		if (IgnoreAssignAttributesToKeys.find((e) => e === key) !== undefined) {
			return;
		}
		const [success, reason] = pcall(() => {
			if (_typeIs(value, "Pseudo")) {
				ReferenceInstance.SetAttribute(key, `***${tostring(value)}***`); // Display Pseudo's values tostring values.
			} else {
				ReferenceInstance.SetAttribute(key, value as AttributeValue);
			}
		});
		// make a somewhat important check using string match when the error message could be changed by ROBLOX anytime soon? why not.
		if (typeIs(reason, "string") && reason.lower().match("^attribute name contains illegal character")[0]) {
			return;
		}
		if (!success) {
			ReferenceInstance.SetAttribute(key, `***${reason}***`);
		}
	}
}

/**
 * Mapping values
 */
function MapObjectDependencies(
	object: object,
	props: (string | { [key: string]: string })[],
	dependencies: useMapping_mapsdeps[],
	concealwarns?: boolean,
) {
	dependencies.forEach((dep) => {
		for (const prop of props) {
			const strsplit = string.split(prop as string, DEPS_STRING_ID_SEPERATOR);
			let MyPropertyName: string;
			let DepPropertyName: string;
			if (strsplit[1] !== undefined) {
				MyPropertyName = strsplit[0];
				DepPropertyName = strsplit[1];
			} else {
				MyPropertyName = prop as string;
				DepPropertyName = prop as string;
			}
			const [s, r] = pcall(() => {
				const tdep = dep as unknown as UnknownArray;
				// const tprop = prop as string;
				const tthis = object as unknown as UnknownArray;
				//this checks to make sure that the property is valid existing members of the dep.
				const _ = tdep[DepPropertyName];
				//this will assign the value but will trigger an __index on pseudo to make sure prop is a valid existing member of this.
				tdep[DepPropertyName] = tthis[MyPropertyName];
			});
			if (s === false) {
				if (!concealwarns) {
					warn(
						`Failed to map property '${tostring(prop)}' to dependency ${tostring(
							dep,
						)} from Pseudo ${tostring(object)}.\n\n${r}`,
					);
				}
			}
		}
	});
}

type PseudoDevDefs<T extends object> = {
	get: <K extends keyof T | string | number>(targetItem: K) => K extends keyof T ? T[K] : unknown;
	has: (targetItem: unknown) => boolean;
	set: <K extends keyof T | string | number, V extends K extends keyof T ? T[K] : unknown>(
		targetItem: K,
		targetValue: V,
	) => void;
	assign: (targetItem: unknown, value: unknown) => void;
	size: () => number;
	_destroyed: boolean;
	_debug: (logType: "warn" | "print" | "error", ...args: unknown[]) => void
} & UnknownArray;
/**
 * Core class of pseudo objects.
 *
 * -
 * NOTE: If your class has possible `undefined` values, Make sure to initialize those values with `undefined` so
 * Pseudo can capture them.
 * If you fail to make Pseudo capture undefined values, whenever you try to index these values you
 * will get an error.
 *
 *```ts
 * class MyClass = {
 * 	DemonstrationNil: number | undefined = undefined; //will be captured.
 * 	DemonstrationNil2: number | undefined; //will not be captured.
 * }
 *```
 * -
 * NOTE: If you want your Pseudo's `ReferenceInstance` to be parented, you must add (you might want to include `Name` aswell):
 *
 * ```ts
 * class MyClass extends Pseudo {
 * 	constructor(){
 * 		super("MyClass");
 * 		useMapping(["Parent"], [this.GetRef()])
 * 	}
 * }
 * ```
 */
export abstract class Pseudo<T extends object = {}> {
	/**
	 * A unique container where items about the pseudo should be stored. Anything within this container will be destroyed/cleaned up
	 * whenever the pseudo is destroyed. (Good for storing Servants,Maids,etc.)
	 */
	public _dev: T & PseudoDevDefs<T> = {
		_destroyed: false,
		has: (targetItem) => {
			const _dev = this._dev as UnknownArray;
			if (_dev[targetItem as string] !== undefined) {
				return true;
			}
			return false;
		},
		set: (targetItem, targetValue) => {
			MUST_BE_DEV_APPROPRIATE(targetItem);
			const _dev = this._dev as UnknownArray;
			_dev[targetItem as string] = targetValue;
		},
		assign: (k, v) => {
			return this._dev.set(k as never, v as never);
		},
		get: (targetItem) => {
			const _dev = this._dev as UnknownArray;
			return _dev[targetItem as string];
		},
		size: () => {
			const _dev = this._dev as UnknownArray;
			let s = 0;
			for (const [k] of pairs(_dev)) {
				if (typeIs(k, "string") && _NON_DEV_APPROPRIATE_KEYS.indexOf(k as string) === -1) {
					s++;
				}
			}
			return s;
		},
		// _debug(logType, ...args) {
		// 	const consoleLogger = (logType === "error" ? error : logType === "print" ? print : warn);
		// 	if(logType === "print") {
		// 		consoleLogger(...args);
		// 		return;
		// 	}
		// 	let msg = args[0] as string;
		// 	(args as string[]).forEach((x,i) => {
		// 		if(i === 0) {
		// 			return;
		// 		}
		// 		msg = `[${x}] ${msg}`;
		// 	})
		// 	msg = `${msg}\n\n${tostring(self)}`
		// },
	} as T & PseudoDevDefs<T>;

	/**
	 * A list of inherited classnames
	 */
	private _classNames: string[] = [];
	/**
	 * The name of the pseudo
	 */
	public Name = "Pseudo";

	/**
	 * The parent of the pseudo object
	 */
	public Parent: Instance | Pseudo | undefined = undefined;

	/**
	 * The unique id of the pseudo
	 */
	public _id;

	/**
	 * Fired when the reference instance is being destroyed.
	 *
	 * This will be a "fake" RBXScriptSignal object if no _referenceInstance is created.
	 */
	public Destroying: RBXScriptSignal;

	/**
	 * @private
	 *
	 * This _referenceInstance is only created when referenced with `GetRef`
	 */
	private _referenceInstance: Instance | undefined = undefined;

	protected useAssignReadonlyProperty(Property: string, Value: unknown) {
		this.useSetNewIndexAssignment(Property, Value, false, false);
	}

	/**
	 * Checks if the class inherits another class
	 */
	public IsA<T extends keyof PHe.Pseudos>(this: Pseudo, ClassName: T): this is PHe.Pseudos[T] {
		if (ClassName === "Pseudo") {
			return true;
		}
		if (this.ClassName === ClassName) {
			return true;
		}
		if (this._classNames.indexOf(ClassName) !== -1) {
			return true;
		}
		return false;
	}

	/**
	 * Converts dependencies into a singular string.
	 */
	private _GetDependencyArrayStringId(dependencies?: unknown): string {
		if (dependencies === undefined) {
			return "*";
		}
		if (typeIs(dependencies, "table")) {
			const deps = dependencies as [];
			if (deps.size() === 0) {
				return ".";
			} else {
				let str = "";
				deps.forEach((dep) => {
					const [s, r] = pcall(() => {
						return (this as unknown as UnknownArray)[dep];
					});
					if (s === false) {
						throw `Failed to _GetDependencyArrayStringId() due to dependency "${dep}". ERROR: ${r}`;
					}
					str += DEPS_STRING_ID_SEPERATOR + dep;
				});
				return str;
			}
		}
		throw `You may have accidentally passed an incorrect param to your use__Effect, the _GetDependencyArrayStringId() expected a table or "*", but instead got ${dependencies}`;
	}

	/**
	 * Run a function whenever `Pseudo` is being `Destroyed`
	 *
	 * @param sequential If you have logic that requires yielding, set to true, default behaviour is called inside of a event callback, meaning it will run on a different thread
	 * NOTE: this will only work if the object was destroyed with `Pseudo.Destroy`. If the ReferenceInstance was destroyed, it will not be sequential.
	 *
	 * If no ReferenceInstance exists, then it will be sequential by default.
	 *
	 * @returns Sevant
	 */
	public useDestroying(callback: Callback, sequential?: boolean, noServant?: boolean): Servant {
		if (!sequential) {
			this.Destroying.Connect(callback);
		} else {
			if (!this._dev.has("_useDestroySequentialCallbacks")) {
				this._dev.assign("_useDestroySequentialCallbacks", []);
			}
			const existing = this._dev.get("_useDestroySequentialCallbacks") as (typeof callback)[];
			existing.push(callback);
			this._dev.assign("_useDestroySequentialCallbacks", existing);
		}
		if ((this as unknown as Pseudo).IsA("Servant")) {
			return undefined as unknown as Servant;
		}
		if (noServant) {
			return undefined as unknown as Servant;
		}
		const s = CreateServant();
		s.useDestroying(
			() => {
				const runCallbacks = this._dev.get("_useDestroySequentialCallbacks") as Callback[] | undefined;
				runCallbacks?.remove(runCallbacks.indexOf(callback));
				return;
			},
			sequential,
			true,
		);
		return s;
	}

	/**
	 * @param excludeKeys When using "*", You can exclude keys that will be retrieved with the `_getCurrentProperties`. excluding a key will not prevent
	 * the key from triggering the map, however it will be excluded in assignment. (Don't forget to exclude "ClassName" if you're mapping to a readonly ClassName Instance property.)
	 *
	 * @param IncludeHiddenProps When using "*", You can include hidden props for `_getCurrentProperties`. Hidden props are properties that begin with an `underscore`(_)
	 */
	useMappingEffect(
		props: "*",
		dependencies: useMapping_mapsdeps,
		excludeKeys?: unknown[],
		IncludeHiddenProps?: boolean,
	): Servant;
	useMappingEffect(props: string[], dependencies: useMapping_mapsdeps): Servant;
	useMappingEffect(props: { [key: string]: string }[], dependencies: useMapping_mapsdeps): Servant;
	useMappingEffect(props: Record<string, string>, dependencies: useMapping_mapsdeps): Servant;
	/**
	 * This does exactly what `useMapping` does, but carries it out differently by using the `usePropertyEffect` method, which provides
	 * a `Servant`. Meaning you can "disconnect" from this `useMapping`.
	 * Also, unlike normal `useMapping`, you can pass custom properties like so:
	 * ```ts
	 * useMappingEffect({MyCustomPositionProperty: "Position", MyCustomPositionProperty2: "Position2"}, [ObjectWithPositionProperty]) // Good
	 * // ^^^ Is not possible in normal useMapping, Note that the props is a dictionary, not an array. (Preferred method.)
	 * ```
	 * or so:
	 * ```ts
	 * useMappingEffect([ {MyCustomPositionProperty: "Position"} , {MyCustomPositionProperty2: "Position2"} ], [ObjectWithPositionProperty]) // Good
	 * // ^^^ Similar to normal useMapping. (Not preferred, this only exists to support the old useMapping behaviour.)
	 * ```
	 */
	public useMappingEffect(
		props: (string | { [key: string]: string })[] | Record<string, string> | "*",
		dependencies: useMapping_mapsdeps[],
		excludeKeys?: unknown[],
		IncludeHiddenProps?: boolean,
	): Servant {
		this.usePropertyEffect(() => {
			return;
		});
		if (props === "*") {
			return this.usePropertyEffect(() => {
				this._getCurrentProperties(excludeKeys, IncludeHiddenProps).forEach((prop) => {
					dependencies.forEach((dep) => {
						if (dep === this) {
							print(this);
							throw "^^^ You may have unexpectedly attempt to useMappingEffect* recursively";
						}
						const [s, r] = pcall(() => {
							const tdep = dep as unknown as UnknownArray;
							// const tprop = prop as string;
							const tthis = this as unknown as UnknownArray;
							//this checks to make sure that the property is valid existing members of the dep.
							const _ = tdep[prop];
							//this will assign the value but will trigger an __index on pseudo to make sure prop is a valid existing member of this.
							tdep[prop] = tthis[prop];
						});
						if (s === false) {
							print(this, dep);
							warn(
								`^^^^\nFailed to map property* "${prop}" to dependency ${dep} from Pseudo ${this}.\n\n${r}`,
							);
						}
					});
				});
			});
		}

		const _t: Record<string, string> = {};
		for (const [a, b] of pairs(props)) { //eslint-disable-line
			if (typeIs(b, "string")) {
				// ["Property"] || {MyProperty: "Property"}
				const k = typeIs(a, "number") ? b : a;
				_t[k] = b;
			} else if (typeIs(b, "table")) {
				for (const [aa, bb] of pairs(b)) {
					_t[aa as string] = bb as string;
				}
			} else {
				throw "Unknown mapping behaviour passed. Expected an Array of strings, a Record of strings or an Array of Records of strings";
				// unknown map.
			}
		}
		const _keys: string[] = [];
		for (const [k] of pairs(_t)) {
			_keys.push(k);
		}
		return this.usePropertyEffect(() => {
			_keys.forEach((key) => {
				const targetMappedToKey = _t[key];
				dependencies.forEach((dep) => {
					if (dep === this) {
						print(this);
						throw "^^^ You may have unexpectedly attempt to useMappingEffect recursively";
					}
					const [s, r] = pcall(() => {
						const tdep = dep as unknown as UnknownArray;
						// const tprop = prop as string;
						const tthis = this as unknown as UnknownArray;
						//this checks to make sure that the property is valid existing members of the dep.
						const _ = tdep[targetMappedToKey];
						//this will assign the value but will trigger an __index on pseudo to make sure prop is a valid existing member of this.
						tdep[targetMappedToKey] = tthis[key];
					});
					if (s === false) {
						print(this, dep);
						warn(
							`^^^^\nFailed to map property "${key}" to dependency ${dep} as "${targetMappedToKey}" from Pseudo ${this}.\n\n${r}`,
						);
					}
				});
			});
		}, _keys);
	}
	/**
	 * For automatically passing properties of `Pseudo` to an `Instance` or another `Pseudo`, Most likely the `Reference Instance`.
	 *
	 * You can also pass `"*"` as props so every viable property is mapped to dependencies.
	 * We recommend using the `._getCurrentProperties` function of `Pseudo`'s to explicitly define what properties to map.
	 *
	 * @todo Improve performance, useMapping might not be very performant is large mapping scenarios.
	 *
	 * @example
	 * useMapping(["Position"], [ObjectWithPositionProperty]) //Whenever "Position" is changed on pseudo, ObjectWithPositionProperty will receive that change.
	 *
	 * useMapping can map from custom properties aswell.
	 * @example
	 * useMapping([{MyCustomPositionProperty: "Position"}], [ObjectWithPositionProperty]) //Whenever "MyCustomPositionProperty" is changed on pseudo, ObjectWithPositionProperty will receive change to its "Position" property
	 * //Only a single map in this object will be caught, each map should be seperated as dependencies and not listed under a single object
	 * useMapping([ {MyCustomPositionProperty: "Position"} , {MyCustomPositionProperty2: "Position2"} ], [ObjectWithPositionProperty]) //Good
	 * useMapping([ {MyCustomPositionProperty: "Position", MyCustomPositionProperty2: "Position2"} ], [ObjectWithPositionProperty]) //Bad (will on work for one.)
	 */
	public useMapping(props: (string | { [key: string]: string })[] | "*", dependencies: useMapping_mapsdeps[]) {
		assert(
			typeIs(props, "table") || (typeIs(props, "string") && props === "*"),
			`got ${typeOf(props)} as useMapping props, expected table or '*'`,
		);
		assert(typeIs(dependencies, "table"), `got ${typeOf(dependencies)} as useMapping dependencies, expected table`);

		if (this._dev.get("_useMapping_maps") === undefined) {
			this._dev.assign("_useMapping_maps", new Map());
		}

		const _useMapping_maps = this._dev.get("_useMapping_maps") as Map<string, useMapping_mapsdeps[]>;
		if (props === "*") {
			let global = _useMapping_maps.get("*");
			if (global === undefined) {
				_useMapping_maps.set("*", []);
				global = _useMapping_maps.get("*");
			}
			const nt = [...global!, ...(dependencies as [])];
			_useMapping_maps.set("*", nt);
			return;
		}

		const propsPassed: string[] = [];
		props.forEach((prop, index) => {
			if (typeIs(prop, "string")) {
				if (propsPassed.find((e) => e === prop) !== undefined) {
					warn(`Duplicate prop passed for useMapping(), "${prop}". Will skip duplication.`);
					return;
				}
				let t = _useMapping_maps.get(prop);
				if (t === undefined) {
					_useMapping_maps.set(prop, []);
					t = _useMapping_maps.get(prop);
				}
				const nt = [...t!, ...(dependencies as [])];
				_useMapping_maps.set(prop, nt);
				propsPassed.push(prop);
			} else if (typeIs(prop, "table")) {
				for (const [MyPropertyName, MapToPropertyName] of pairs(prop)) {
					assert(
						typeIs(MyPropertyName, "string"),
						`Could build map for property ${this.Name} as it was expected to be a string, but got ${typeOf(
							MyPropertyName,
						)}`,
					);
					assert(
						typeIs(MapToPropertyName, "string"),
						`Could build map for property ${MyPropertyName} as the property it is mapping to was expected to be a string, but got ${typeOf(
							MapToPropertyName,
						)}`,
					);
					const TargetName = MyPropertyName + DEPS_STRING_ID_SEPERATOR + MapToPropertyName;
					let t = _useMapping_maps.get(TargetName);
					if (t === undefined) {
						_useMapping_maps.set(TargetName, []);
						t = _useMapping_maps.get(TargetName);
					}
					const nt = [...t!, ...(dependencies as [])];
					_useMapping_maps.set(TargetName, nt);
					props[index] = TargetName;
					break;
				}
			} else {
				throw `Unexpected property, expected string or table, got ${typeOf(prop)}`;
			}
		});
		MapObjectDependencies(this, props, dependencies);
	}

	/**
	 * @deprecated `usePropertyEffect` supports this feature by default.
	 *
	 * Wraps the `usePropertyRender` in a coroutine.
	 *
	 * @todo Only a single coroutine should be spawned for each usePropertyRenderWrap callback instead of the current behaviour
	 * of all callbacks having their own threads.
	 */
	public usePropertyRenderWrap(callback: usePropertyEffectCallback, dependencies?: string[]): PHe.Pseudos["Servant"] {
		warn("`usePropertyRenderWrap` is deprecated, switch to using `usePropertyRender` instead.");
		return this.usePropertyRender(callback, dependencies);
	}

	/**
	 * Wraps `usePropertyEffect` but only triggers callback after the initial render.
	 *
	 * @remarks
	 *
	 * This should not be used in cases where it is ran under a condition, it should only be called at top level where the it's called with the initial
	 * render of the component.
	 */
	public usePropertyRender(callback: usePropertyEffectCallback, dependencies?: string[]): PHe.Pseudos["Servant"] {
		let didRender = false;
		return this.usePropertyEffect((...params) => {
			if (!didRender) {
				didRender = true;
				return;
			}
			callback(...params);
		}, dependencies);
	}

	/**
	 * @deprecated `usePropertyEffect` supports this feature by default.
	 *
	 * Wraps the `usePropertyEffect` in a coroutine.
	 *
	 * @todo Only a single coroutine should be spawned for each usePropertyEffectWrap callback instead of the current behaviour
	 * of all callbacks having their own threads.
	 */
	public usePropertyEffectWrap(callback: usePropertyEffectCallback, dependencies?: string[]): PHe.Pseudos["Servant"] {
		warn("`usePropertyEffectWrap` is deprecated, switch to using `usePropertyEffect` instead.");
		return this.usePropertyEffect(callback, dependencies);
	}

	/**
	 * `Callback` is called whenever property is changed, if `dependencies` is provided then it will only trigger when those properties changed.
	 * `Callback` will run when initiated.
	 *
	 * `Callbacks` are not ran in any particular order but do note
	 * that `independent` callbacks are exeecuted after `dependent` callbacks.
	 *
	 * Please note if no dependencies are provided, No Servant will be returned nor will a ExecutingServant be passed to the callback.
	 *
	 * Whenever the value changes, Based on what your `usePropertyEffect` returns, the following will happen:
	 * * If you return a `Promise`, If the `Promise` state is `Started`, then it will will be cancelled.
	 * * If you return a `Servant`, then it will be Destroyed. Meaning you can chain `usePropertyEffect` together
	 * * If you return a `Function`, it will be called
	 */
	public usePropertyEffect(callback: usePropertyEffectCallback, dependencies?: string[]): PHe.Pseudos["Servant"] {
		assert(typeIs(callback, "function"), `expected callback to be a function, got ${typeOf(callback)}`);
		if (!this._dev.has("_usePropertyEffect")) {
			this._dev.assign("_usePropertyEffect", new Map<string, unknown>());
		}
		if (!this._dev.has("_usePropertyEffectQuickSearch")) {
			this._dev.assign("_usePropertyEffectQuickSearch", new Map<string, number>());
		}
		if (this.ClassName === "Servant") {
			throw "You cannot usePropertyEffect on a Servant.";
		}
		const _usePropertyEffect = this._dev.get("_usePropertyEffect") as _usePropertyEffectMap;
		const _usePropertyEffectQuickSearch = this._dev.get(
			"_usePropertyEffectQuickSearch",
		) as _usePropertyEffectQuickSearchMap;
		const depsStr = this._GetDependencyArrayStringId(dependencies);

		//means an empty array was passed, so only render once ("onMount")
		if (depsStr === ".") {
			const cleanup = callback(undefined as never);
			if (typeIs(cleanup, "function")) {
				this.useDestroying(cleanup);
			}
			return undefined as unknown as PHe.Pseudos["Servant"];
		}
		if (depsStr !== "*") {
			// We store the name of every dependency that uses `usePropertyEffect` inside a QuickSearch map, This is so that whenever a property
			// changes with __newindex, we do not search the entire `_usePropertyEffect` for a key that does not exist.
			depsStr.split(DEPS_STRING_ID_SEPERATOR).forEach((dep) => {
				if (dep === "") {
					return;
				}
				const currTargetValue = _usePropertyEffectQuickSearch.get(dep);
				_usePropertyEffectQuickSearch.set(dep, currTargetValue !== undefined ? currTargetValue + 1 : 1);
			});
		}
		let list = _usePropertyEffect.get(depsStr)!;
		if (!list) {
			_usePropertyEffect.set(depsStr, []);
			list = _usePropertyEffect.get(depsStr)!;
		}
		const usePropertyEffectServant = CreateuseEffectServant();
		usePropertyEffectServant._dev.ue.cb = callback;
		CalluseEffectServant(usePropertyEffectServant);
		list.push(usePropertyEffectServant);
		usePropertyEffectServant.useDestroying(() => {
			// removing from _usePropertyEffect
			const indxof = list.indexOf(usePropertyEffectServant);
			if (indxof !== -1) {
				if (list.size() === 1) {
					// If we were the last item in the _usePropertyEffect with this depsStr, then remove the entry record
					_usePropertyEffect.delete(depsStr);
				} else {
					list.remove(indxof);
				}
			}
			// removing from _usePropertyEffectQuickSearch
			if (depsStr !== "*") {
				depsStr.split(DEPS_STRING_ID_SEPERATOR).forEach((dep) => {
					if (dep === "") {
						return;
					}
					const currTargetValue = _usePropertyEffectQuickSearch.get(dep);
					if (currTargetValue === 1) {
						_usePropertyEffectQuickSearch.delete(dep);
						return;
					}
					_usePropertyEffectQuickSearch.set(dep, currTargetValue !== undefined ? currTargetValue + -1 : 1);
				});
			}
			CalluseEffectServant(usePropertyEffectServant, true, true);
		});
		// usePropertyEffectServant._dev.ue.cb;
		/*
		const obj = {
			callback: callback,
		};
		list!.push(obj);
		callusePropertyEffectObjectCallback(obj);
		const usePropertyEffectServant = CreateServant();

		if (!this._dev.has("_usePropertyEffect__Servants")) {
			this._dev.assign("_usePropertyEffect__Servants", {});
		}

		(this._dev._usePropertyEffect__Servants as Record<string, PHe.Pseudos["Servant"]>)[
			usePropertyEffectServant._id
		] = usePropertyEffectServant;

		usePropertyEffectServant.useDestroying(() => {
			const t = _usePropertyEffect.get(depsStr);
			delete (this._dev._usePropertyEffect__Servants as Record<string, PHe.Pseudos["Servant"]>)[
				usePropertyEffectServant._id
			];
			if (t) {
				const indexOfObj = t.indexOf(obj);
				if (indexOfObj !== -1) {
					callusePropertyEffectObjectCallback(t[indexOfObj], true, true);
					if (t.size() === 1) {
						// remove the depsStr from the _usePropertyEffect list since it is empty
						_usePropertyEffect.delete(depsStr);
					} else {
						t.remove(indexOfObj);
					}
				}
			}
		});
		*/
		return usePropertyEffectServant;
	}

	/*
	 *
	 */
	public useCombinePropertyEffects(callback: usePropertyEffectCallback, ...usePropertyEffectServants: (PHe.Pseudos["Servant"])[]): PHe.Pseudos["Servant"] {
		let _callbackServant = CreateuseEffectServant();
		let _isfirstRun = true;
		_callbackServant._dev.ue.cb = callback;
		usePropertyEffectServants.forEach((servant, i) => {
			_callbackServant.Keep(servant);
			const oldCB = (servant as useEffectServant)._dev.ue.cb;
			(servant as useEffectServant)._dev.ue.cb = (_executingServant) => {
				const res = oldCB(_executingServant);
				if(_isfirstRun){
					return res;
				}
				CalluseEffectServant(_callbackServant);
				return res;
			}
			CalluseEffectServant(servant as useEffectServant);
			if(i === usePropertyEffectServants.size() - 1){
				CalluseEffectServant(_callbackServant); // only call the callback for the last useEffect servant in the index.
				_isfirstRun = false;
			}
		});
		return _callbackServant;
	}

	public usePropertyEffectCombine(callback: usePropertyEffectCallback,  dependencies?: string[]): PHe.Pseudos["Servant"] {
		return this.usePropertyRender(callback, dependencies)
	}

	/**
	 * Destroys the Pseudo.
	 */
	public Destroy(...args: unknown[]) {
		if(this._dev._destroyed === true) {
			return;
		}
		this._dev._destroyed = true;
		// run destroy functions that were created using the "fake" destroy signal or "sequential" useDestroying callbacks.
		this.runDestroyCallbacks(...args);
		// cleanup everything in _dev.
		_desOnObject(this._dev as UnknownArray);
		if (this._referenceInstance) {
			this.GetRef().Destroy();
		}
	}

	/***/
	private runDestroyCallbacks(...args: unknown[]) {
		if (this._dev.get("_destroyCallbacksran-") !== undefined) {
			return;
		}
		this._dev.assign("_destroyCallbacksran-", true);
		const runCallbacks = this._dev.get("_useDestroySequentialCallbacks") as Callback[] | undefined;
		if (runCallbacks !== undefined) {
			runCallbacks.forEach((c) => {
				c(...args);
			});
		}
	}
	/**
	 * Creates the Reference Instance if it did not exist.
	 */
	public CreateRef() {
		this.GetRef();
	}
	/**
	 * Returns the reference instance of the pseudo
	 *
	 * The reference Instance will not exist prior to the first call of this method for optimization sake.
	 */
	private _initializeReferenceInstanceCallback: Callback;
	public GetRef<T = Folder>(): T {
		if (!this._referenceInstance) {
			this._initializeReferenceInstanceCallback();
		}
		return this._referenceInstance as T;
	}

	/**
	 * Creates a `usePropertyEffect` effect to the `ReferenceInstance` for the `"Name"` & `"Parent"` properties.
	 *
	 * Note that if no Reference Instance exists, if the `Parent` is undefined/nil, the `GetRef` method will not be called, ultimately no ref will be created by
	 * this method unless the `Parent` exists, only then will the `GetRef` be called, which will create the reference instance if it didn't exist.
	 *
	 * ```ts
	 * this.useReferenceInstance()
	 * // same as
	 * return this.usePropertyEffect(() => {
	 *  this.GetRef().Name = this.Name;
	 *  this.GetRef().Parent = _typeIs(this.Parent, "Pseudo") ? this.Parent.GetRef() : this.Parent;
	 * }, ["Name", "Parent"]);
	 * // same as (sorta)
	 * this.useMapping(["Name","Parent"], [this.GetRef()]) // However, Mapping Parent to a Pseudo will throw an error, so the method above is recommended.
	 * ```
	 */
	public useReferenceInstanceBehaviour(): Servant {
		return this.usePropertyEffect(() => {
			if (this._referenceInstance === undefined && this.Parent === undefined) {
				return; // Do not do anything unless the reference instance exists or it doesn't exist and the parent isn't nil.
			}
			this.GetRef().Name = this.Name;
			this.GetRef().Parent = _typeIs(this.Parent, "Pseudo") ? this.Parent.GetRef() : this.Parent;
		}, ["Name", "Parent"]);
	}

	private _useStrictProperties: Callback;
	/**
	 * Using strict properties will throw an error if an attempt to __newindex a property that doesn't already exist
	 * is made. To enable, it is expected that this method is called after you assign your internal properties but before
	 * you write your class logic.
	 *
	 * @param strict
	 * Setting this to `true` will only throw errors when __newindex is called and the property doesn't exist
	 * Setting this to `type` will throw an error when __newindex is called and the property doesn't exist OR the property
	 * exists but the currently assigned type is not of the current value.
	 */
	protected useStrictProperties(strict?: true) {
		this._useStrictProperties(strict);
	}

	private _useSetNewIndexAssignment: Callback;
	/**
	 * Assigns the key with the value to the class.with the internal `__newindex` function.
	 *
	 * @param allowSameValueWrite Will trigger the assignment even if the current value is the same. This is useful in cases where the value of a table changed but the actual
	 * table reference remains the same. Since the property did not technical change, you wull need to "fake" the change by using this method.
	 */
	protected useSetNewIndexAssignment(
		key: unknown,
		value: unknown,
		allowSameValueWrite?: boolean,
		allowNoTypeAndNonMemberCheck?: boolean,
	) {
		this._useSetNewIndexAssignment(key, value, allowSameValueWrite, allowNoTypeAndNonMemberCheck);
	}

	private _usePropertyRelationBinding: Callback;
	/**
	 * This creates a "relation" between the `RelationalProperties` and the `RelationProperty`, If the `RelationValue` is the current value of the `RelationProperty`
	 * then the `RelationalProperties` will become available, else they will be unavailable.
	 * 
	 * A property becoming available only currently shows/hides it from the Attributes list, you can still read/write to these properties from scripts as usual.
	 * 
	 * @example
	 * class Test extends Pseudo {
	 * LimitsEnabled = false;
	 * UpperLimit = 2;
	 * LowerLimit = 1;
	 * constructor() {
	 * 	super("Test");
	 * 	this.usePropertyRelationBinding(["UpperLimit", "LowerLimit"], "LimitsEnabled", true);
	 * 	this.usePropertyEffect(() => {
	 * 		if (this.LimitsEnabled) {
	 * 			// This will only execute whenever LimitsEnabled is true.
	 * 			return this.usePropertyEffect(() => {
	 * 				// since we are returning the useEffect Servant, whenever LimitsEnabled goes from true->false, the Servant will be destroyed. so this will not run while LimitsEnabled is false
	 * 				print("Upper Limit:", this.UpperLimit, "Lower Limit:", this.LowerLimit);
	 * 			}, ["UpperLimit", "LowerLimit"]);
	 * 		}
	 * 	}, ["LimitsEnabled"]);
	 * }
}
	 */
	protected usePropertyRelationBinding(
		RelationalProperties: string[],
		RelationProperty: string,
		RelationValue: unknown,
	): Servant {
		return this._usePropertyRelationBinding(RelationalProperties, RelationProperty, RelationValue);
	}

	constructor(
		/**The ClassName of the pseudo*/
		public readonly ClassName: string,
		/**The item ClassName of the instance that should be used as the reference instnce of the pseudo*/
		private _ReferenceInstanceType?: CreatableReferenceInstanceTypes,
	) {
		//create id
		const ID = getAbstractPseudoId(this.ClassName);
		this._id = ID;

		// events and signals
		// A fake Destroying signal is used until the ReferenceInstance is created.
		this.Destroying = {
			Connect: (_: unknown, callback: Callback) => {
				this.useDestroying(callback, true);
				return {
					Disconnect: (): void => {
						const runCallbacks = this._dev.get("_useDestroySequentialCallbacks") as Callback[] | undefined;
						runCallbacks?.remove(runCallbacks.indexOf(callback));
						return;
					},
					Connected: (): boolean => {
						if (this._dev.get("_destroyCallbacksran-") !== undefined) {
							return true;
						}
						return false;
					},
				};
			},
			ConnectParallel: FakeDestroyingSignalMethods.ConnectParallel,
			Wait: FakeDestroyingSignalMethods.Wait,
			Once: FakeDestroyingSignalMethods.Once,
		} as unknown as RBXScriptSignal;

		//metatables __indexing
		const OBJECT_PROXY: UnknownArray = {};
		OBJECT_PROXY._getCurrentProperties = (
			excludeKeys?: unknown[],
			IncludeHiddenProps?: boolean,
			IncludeFunctions?: boolean,
			IncludeSignals?: boolean,
			AsDictionary?: boolean,
		) => {
			const p = [];
			let t = { ...OBJECT_PROXY };
			if (!_DEFINED_NILS.isEmpty()) {
				const pushTot: typeof t = {};
				//include defined nil properties aswell
				_DEFINED_NILS.forEach((n) => {
					pushTot[n as string] = "*!EXCLUDE-FROM-AS-DICTIONARY!*--?=true!"; //when as-dictionary is false, we want to include defined nil values in the array
				});
				t = { ...t, ...pushTot };
			}
			for (const [a, b] of pairs(t)) {
				if (excludeKeys) {
					const existsInExclude = (excludeKeys as string[]).indexOf(a as string) !== -1;
					if (existsInExclude) {
						continue;
					}
				}
				if (typeIs(a, "string")) {
					if (!IncludeHiddenProps && a.match("^_")[0]) {
						continue;
					}
				}
				if (typeIs(b, "function") && !IncludeFunctions) {
					continue;
				}
				if (typeIs(b, "RBXScriptSignal") && !IncludeSignals) {
					continue;
				}
				if (
					typeIs(b, "table") &&
					a === "Destroying" &&
					this._referenceInstance === undefined &&
					!IncludeSignals
				) {
					continue;
				}
				if (AsDictionary) {
					let v = b;
					if (b === "*!EXCLUDE-FROM-AS-DICTIONARY!*--?=true!") {
						v = undefined; //if it's a defined nil, dictionary should not show
					}
					(p as unknown as Map<unknown, unknown>).set(a, v);
				} else {
					p.push(a);
				}
			}
			return p;
		};

		let USE_STRICT_PROPERTIES = false;
		const ASSIGNING_ATTRIBUTES: Map<string, boolean | undefined> = new Map();
		const HIDDEN_ATTRIBUTES: string[] = [];
		const ORIGINAL_THIS_INDEX = (this as unknown as typeof OBJECT_PROXY).__index as typeof OBJECT_PROXY; //store the origin index so we can capture methods.
		const _DEFINED_NILS: string[] = []; //Incases where you attempt to index child that doesn't seem to exist but the child is actual set to nil by developer.
		const __newindex = (_: object, key: unknown, value: unknown, allowSameValueWrite?: boolean) => {
			// assert(this._referenceInstance, `No ReferenceInstance was found, __newindex failed`);
			if (USE_STRICT_PROPERTIES === true) {
				const [s, r] = pcall(() => {
					return (this as unknown as UnknownArray)[key as string];
				});
				if (s === false) {
					throw `{StrictProperty} => ${r}`;
				}
			}
			if (key === "ClassName" && typeIs(value, "string")) {
				this._classNames.push(value);
			}
			if (value === undefined) {
				//push to defined nils
				if (_DEFINED_NILS.find((e) => e === key) === undefined) {
					_DEFINED_NILS.push(key as string);
				}
			} else {
				//if it's no longer nil and it was defined in _DEFINED_NILS then remove
				_DEFINED_NILS.filter((e) => e === key);
			}
			// assigned same value, ignore newindex.
			if (OBJECT_PROXY[key as string] === value && allowSameValueWrite !== true) {
				return;
			}
			OBJECT_PROXY[key as string] = value;

			//trigger any Mappings
			const _useMapping_maps = (OBJECT_PROXY._dev as Map<unknown, unknown>).get("_useMapping_maps") as Map<
				string,
				useMapping_mapsdeps[]
			>;

			if (_useMapping_maps) {
				const DirectMap = _useMapping_maps.get(key as string); //for cases where it's not a custom property name.
				if (DirectMap) {
					MapObjectDependencies(this, [key as string], DirectMap);
				}
				//mapping customs
				for (const [_n, _deps] of _useMapping_maps) {
					if (_n === "*") {
						MapObjectDependencies(this, [key as string], _deps);
					} else {
						const split = string.split(_n, DEPS_STRING_ID_SEPERATOR);
						const name = split[0];
						assert(
							typeIs(name, "string"),
							`Could not resolve property name to compare to prepare for map. ${this} || Property ${key}. Got ${name}`,
						);
						MapObjectDependencies(this, [_n], _deps);
					}
				}
			}

			//trigger any usePropertyEffect callbacks
			const _usePropertyEffect = (OBJECT_PROXY._dev as Map<unknown, unknown>).get(
				"_usePropertyEffect",
			) as _usePropertyEffectMap;
			const _usePropertyEffectQuickSearch = (OBJECT_PROXY._dev as Map<unknown, unknown>).get(
				"_usePropertyEffectQuickSearch",
			) as _usePropertyEffectQuickSearchMap;

			if (_usePropertyEffectQuickSearch && _usePropertyEffectQuickSearch.get(key as string) !== undefined) {
				let _targetuseEffectServants: useEffectServant[] = [];
				for (const [usePropertyEffectKey, usePropertyEffectServants] of _usePropertyEffect) {
					if (usePropertyEffectKey === "*") {
						// skip items within [*] since they are called after these.
						continue;
					}
					// Keys are stored as: __splitter__key01__splitter__key02
					// So here we split the key and find if any of the keys is the current newindex key.
					const keySplit = usePropertyEffectKey.split(DEPS_STRING_ID_SEPERATOR);
					if (keySplit.indexOf(key as string) !== -1) {
						_targetuseEffectServants = [..._targetuseEffectServants, ...usePropertyEffectServants];
					}
				}
				// Calling deps that contains the newindex key in their keySplit
				_targetuseEffectServants.forEach((propEffectServant) => {
					CalluseEffectServant(propEffectServant);
				});
				// Calling no deps effects[*]
				_usePropertyEffect.get("*")?.forEach((propEffectServant) => {
					CalluseEffectServant(propEffectServant);
				});
			}
			// using attributes to display the properties of the pseudo ( only if reference instance exists. )
			if (this._referenceInstance !== undefined) {
				if (typeIs(key, "string")) {
					if (ASSIGNING_ATTRIBUTES.has(key) === false) {
						if (HIDDEN_ATTRIBUTES.indexOf(key) !== -1) {
							return;
						}
						ASSIGNING_ATTRIBUTES.set(key, true);
						AssignAttributeValue(this.GetRef(), key, value);
						ASSIGNING_ATTRIBUTES.delete(key);
					}
				}
			}
		};

		const __index = (_: object, key: unknown) => {
			// assert(this._referenceInstance, `No ReferenceInstance was found, __index failed`);
			let toReturn;
			if (OBJECT_PROXY[key as string] !== undefined) {
				toReturn = OBJECT_PROXY[key as string];
			} else {
				toReturn = ORIGINAL_THIS_INDEX[key as string];
			}
			if (toReturn === undefined) {
				if (_DEFINED_NILS.find((e) => e === key) === undefined) {
					throw `'${tostring(key)}' is not a valid member of ${this}\n\nIf '${tostring(
						key,
					)}' can be "undefined" you need to initialize it with "undefined" or set it before indexing.`;
				}
			}
			return toReturn;
		};

		// Setting up internal private methods a props

		this._initializeReferenceInstanceCallback = () => {
			//creating reference instance
			let CreateNewInstance = true;
			if (!this._ReferenceInstanceType) {
				this._ReferenceInstanceType = "Folder";
			} else if (typeIs(this._ReferenceInstanceType, "function")) {
				// If a function is passed, call it and use the returned value as the _ReferenceInstanceType.
				const results = this._ReferenceInstanceType();
				assert(typeIs(results, "Instance"), "Your _ReferenceInstanceType function did not return an Instance.");
				this._ReferenceInstanceType = results; // So that the following code treats "_ReferenceInstanceType" as an Instance and not a function.
			}

			if (typeIs(this._ReferenceInstanceType, "string")) {
				CreateNewInstance = true;
			} else if (typeIs(this._ReferenceInstanceType, "Instance")) {
				assert(
					this._ReferenceInstanceType.GetAttribute(_PseudoIdentificationAttrServerName) === undefined,
					`_pseudoid already existed on instance ${this._ReferenceInstanceType.ClassName} || ${this._ReferenceInstanceType.Name}`,
				);
				CreateNewInstance = false;
			} else {
				error(`Unknown reference instance type received ${tostring(this._ReferenceInstanceType)}`);
			}

			const ReferenceInstance =
				((CreateNewInstance === true &&
					new Instance(this._ReferenceInstanceType as keyof CreatableInstances)) as Instance) ||
				(this._ReferenceInstanceType as typeof this._ReferenceInstanceType);

			// ReferenceInstance.Name = this.ClassName;

			// reference instance id
			ReferenceInstance.SetAttribute(_PseudoIdentificationAttrServerName, this._id);
			// setting attributes since the ref can be created after props were __newindexed.
			for (const [k, v] of pairs(
				this._getCurrentProperties(undefined, false, false, false, true) as unknown as Record<string, unknown>,
			)) {
				AssignAttributeValue(ReferenceInstance, k, v);
			}
			// handling attributes changed
			ReferenceInstance.AttributeChanged.Connect((attr) => {
				if (attr === _PseudoIdentificationAttrServerName) {
					return;
				}
				if (ASSIGNING_ATTRIBUTES.has(attr) === false) {
					if (HIDDEN_ATTRIBUTES.indexOf(attr) !== -1) {
						return;
					}
					const v = ReferenceInstance.GetAttribute(attr);
					// we use `***` at the start and end of the attribute value if it is not a supported attribute type (or just should not be considered a value.)
					if (typeIs(v, "string") && v.match("^***")[0] !== undefined && v.match("***$")[0] !== undefined) {
						return;
					}
					ASSIGNING_ATTRIBUTES.set(attr, true);
					(this as unknown as typeof OBJECT_PROXY)[attr] = v;
					ASSIGNING_ATTRIBUTES.delete(attr);
				}
			});

			// If the reference Instance is destroyed, destroy the Pseudo. The `Destroy` method of the Pseudo also calls to Destroy the ReferenceInstance
			// But ROBLOX handles that if the case is reference-destroyed -> pseudo-destroyed -> pseudo destroy reference
			ReferenceInstance.Destroying.Connect(() => {
				this.Destroy();
			});
			this.Destroying = ReferenceInstance.Destroying; // Remove the "fake" destroying signal
			this._referenceInstance = ReferenceInstance;
		};

		this._useStrictProperties = () => {
			USE_STRICT_PROPERTIES = true;
		};

		this._useSetNewIndexAssignment = (key, value, allowSameValueWrite, allowNoTypeAndNonMemberCheck) => {
			if ((allowNoTypeAndNonMemberCheck as boolean) !== true) {
				__index(this, key); // make sure the key is assignable first.
			}
			__newindex(this, key, value, allowSameValueWrite);
		};

		this._usePropertyRelationBinding = (
			RelationalProperties: string[],
			RelationProperty: string,
			RelationValue: unknown,
		): Servant => {
			const t = this as unknown as UnknownArray;
			const ue = this.usePropertyEffect(() => {
				if (t[RelationProperty] !== RelationValue) {
					// Hide attributes
					RelationalProperties.forEach((prop) => {
						if (t[prop] === undefined) {
							return; // ^^ so it will error if the relational prop is not a member.
						}
						HIDDEN_ATTRIBUTES.push(prop);
						if (this._referenceInstance) {
							AssignAttributeValue(this._referenceInstance, prop, undefined);
						}
					});
				} else {
					// Show attributes
					let Shift = 0;
					RelationalProperties.forEach((prop, index) => {
						const ds = HIDDEN_ATTRIBUTES.remove(index - Shift);
						if (ds !== undefined) {
							Shift++;
							if (this._referenceInstance) {
								AssignAttributeValue(this._referenceInstance, prop, t[prop]);
							}
						}
					});
				}
			}, [RelationProperty]);
			ue.useDestroying(() => {
				// Show attributes
				let Shift = 0;
				RelationalProperties.forEach((prop, index) => {
					const ds = HIDDEN_ATTRIBUTES.remove(index - Shift);
					if (ds !== undefined) {
						Shift++;
						if (this._referenceInstance) {
							AssignAttributeValue(this._referenceInstance, prop, t[prop]);
						}
					}
				});
			});
			return ue;
		};

		// assign to Pseudo Collector
		PseudoCollector[ID] = this as never;
		this.useDestroying(() => {
			delete PseudoCollector[ID];
		}, true);

		//then call __newindex on pseudo properties so they'll be considered.
		for (const [a, b] of pairs(this)) {
			OBJECT_PROXY[a as string] = b;
			__newindex(this, a, b);
			(this as unknown as typeof OBJECT_PROXY)[a as string] = undefined; //we remove the props from this (pseudo) so __newindex will be captured for items from pseudo, "Name" etc.
		}
		// Call any undefined/nil properties that are within the Pseudo Class (not needed for objects inheriting pseudo that are undefined)
		__newindex(this, "Parent", undefined);
		__newindex(this, "_referenceInstance", undefined);
		__newindex(this, "_ReferenceInstanceType", _ReferenceInstanceType);
		__newindex(this, "_ReferenceInstanceType", _ReferenceInstanceType);
		// Create the metatable.
		setmetatable(this, {
			__index: __index,
			__newindex: __newindex,
			__tostring: () => {
				return `${this.Name}++${this.ClassName} ${this._id}`;
			},
		});
	}
}

// Reactive Pseudo
export class reactivePseudo<T = unknown> extends Pseudo {
	public use(callback: (newValue: T, oldValue: T, reactive: reactivePseudo) => usePropertyEffectCleanup): Servant {
		let _oldValue: T;
		this._dev._usecb = callback;
		return this.usePropertyEffect(() => {
			const cb = callback(this.value, _oldValue, this);
			_oldValue = this.value;
			return cb;
		}, ["value"]);
	}
	constructor(public value: T) {
		super("reactivePseudo");
		this.Name = this.ClassName;
		this.useReferenceInstanceBehaviour();
	}
}
export function Reactive<T = unknown>(defaultValue: T): reactivePseudo<T> {
	return new reactivePseudo(defaultValue);
}
