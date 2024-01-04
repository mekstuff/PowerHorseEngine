/* eslint-disable roblox-ts/no-private-identifier */
import { execSync } from "@mekstuff-rbxts/primitive";

type DB_BRDIGE_EXTRA_ARGS = {
	SET: Callback;
	GET: Callback;
	UPDATE: Callback;
	REMOVE: Callback;
	HAS: Callback;
	INCREMENT: Callback;
};

type ParametersOrUnknown<V extends Callback | undefined> = V extends Callback ? Parameters<V> : unknown[];
type ReturnValueOrVoid<V extends Callback | undefined> = V extends Callback ? ReturnType<V> : void;

/**
 * DB_BRIDGE is a standard type that providers will use to SET, GET, UPDATE, REMOVE, HAS/check and INCREMENT.
 *
 * The idea is any provider can interact with mekdb once they set up this bridge
 * the return types however will be different for each bridge function, hence T.
 */
type DB_BRIDGE<T extends Partial<DB_BRDIGE_EXTRA_ARGS>> = {
	SET: (key: string, value: unknown, ...args: ParametersOrUnknown<T["SET"]>) => ReturnValueOrVoid<T["SET"]>;
	GET: (key: string, ...args: ParametersOrUnknown<T["GET"]>) => ReturnValueOrVoid<T["GET"]>;
	UPDATE: (
		key: string,
		callback: Callback,
		...args: ParametersOrUnknown<T["UPDATE"]>
	) => ReturnValueOrVoid<T["UPDATE"]>;
	REMOVE: (key: string, ...args: ParametersOrUnknown<T["REMOVE"]>) => ReturnValueOrVoid<T["REMOVE"]>;
	INCREMENT: (
		key: string,
		delta: number,
		...args: ParametersOrUnknown<T["INCREMENT"]>
	) => ReturnValueOrVoid<T["INCREMENT"]>;
	HAS: (key: string, ...args: ParametersOrUnknown<T["HAS"]>) => boolean;
};

export class Database<S, B extends Partial<DB_BRDIGE_EXTRA_ARGS> = DB_BRDIGE_EXTRA_ARGS> {
	/**
	 * Required name of the provider, will default to `math.random` value.
	 */
	readonly Name: string = tostring(math.random());
	/**
	 * The `bridge` between mekdb and the underlying datastore at use.
	 */
	private DB_BRIDGE: DB_BRIDGE<B> | undefined;
	/**
	 * Any schema actions are ran within the Database class itself, for example before `SetAsync` calls your bridge `SET`
	 * It will validate the input value first
	 */
	protected SET_DB_BRIDGE(BRIDGE: DB_BRIDGE<B>) {
		this.DB_BRIDGE = BRIDGE;
	}

	/**
	 * Gets the DB_BRIDGE, Throws an error if it doesn't exist.
	 */
	protected GET_DB_BRIDGE(): DB_BRIDGE<B> {
		if (!this.DB_BRIDGE) {
			throw `No DB_BRIDGE was defined, Make sure your provider sets it correctly.`;
		}
		return this.DB_BRIDGE;
	}
	/**
	 * Updates the value for the key.
	 *
	 * The returned value from your transformFunction is ran against the schema before updating.
	 */
	UpdateAsync(key: string, transformFunction: (oldValue: S) => S, ...args: ParametersOrUnknown<B["UPDATE"]>) {
		// we wrap the transformFunction inside of our own callback function for update, so we validate the returned value (from transformFunction)
		// if the validation failed, then the error will be thrown inside the UPDATE callback, causing the key/value to not be updated.
		const cb: typeof transformFunction = (_oldvalue) => {
			const res = transformFunction(_oldvalue);
			const nv = execSync(this.SCHEMA, res);
			return nv as S;
		};
		return this.GET_DB_BRIDGE().UPDATE(key, cb, ...(args as never));
	}
	/**
	 * Removes the value from key.
	 */
	RemoveAsync(key: string, ...args: ParametersOrUnknown<B["REMOVE"]>) {
		return this.GET_DB_BRIDGE().REMOVE(key, ...(args as never));
	}
	/**
	 * Checks if the database has any value for the key.
	 */
	HasAsync(key: string, ...args: ParametersOrUnknown<B["HAS"]>) {
		return this.GET_DB_BRIDGE().HAS(key, ...(args as never));
	}
	/**
	 * Gets the value of the key.
	 *
	 * The value is ran against the schema before returning.
	 */
	GetAsync(key: string, ...args: ParametersOrUnknown<B["GET"]>) {
		const getres = this.GET_DB_BRIDGE().GET(key, ...(args as never));
		const res = execSync(this.SCHEMA, getres);
		return res as typeof getres;
	}
	/**
	 * Sets the value of the key.
	 *
	 * The value is ran against the schema before calling `SET`.
	 */
	SetAsync(key: string, value: S, ...args: ParametersOrUnknown<B["SET"]>) {
		const res = execSync(this.SCHEMA, value);
		return this.GET_DB_BRIDGE().SET(key, res, ...(args as never));
	}
	/**
	 * Increments the value of the key by the delta.
	 *
	 * The value will not be ran against the schema.
	 */
	IncrementAsync(key: string, delta: number, ...args: ParametersOrUnknown<B["INCREMENT"]>) {
		if ((this.SCHEMA as { [key: string]: unknown }).Type !== "number") {
			throw `The use of "IncrementAsync" requires the schema value to be of type "number", "${
				(this.SCHEMA as { [key: string]: unknown }).Type
			}" is the type the schema defined! Key: "${key}"`;
		}
		return this.GET_DB_BRIDGE().INCREMENT(key, delta, ...(args as never));
	}

	constructor(
		protected name: string,
		protected SCHEMA: unknown,
		protected dbid: string,
		protected scope: string,
		readonly _options: unknown,
	) {}
}
