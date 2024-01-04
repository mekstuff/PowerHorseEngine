/* eslint-disable roblox-ts/no-private-identifier */
import { Database } from "../core";

/**
 * Database provider for ROBLOX's DataStore2.
 *
 * DataStore2 is native so no installation of other packages are required.
 *
 * This is the base version of DataStore2, It does not include session locking, caching or no extra features than what native ROBLOX provides.
 */
export class DataStoreDatabase<S> extends Database<
	S,
	{
		GET: (options?: DataStoreGetOptions) => LuaTuple<[S | undefined, DataStoreKeyInfo]>;
		REMOVE: () => LuaTuple<[S | undefined, DataStoreKeyInfo | undefined]>;
		SET: (userIds?: number[], options?: DataStoreSetOptions) => string;
		UPDATE: () => LuaTuple<[S | undefined, DataStoreKeyInfo]>;
		INCREMENT: (userIds?: number[], options?: DataStoreIncrementOptions) => S;
	}
> {
	protected DataStore: DataStore;
	constructor(
		protected name: string,
		protected SCHEMA: unknown,
		protected dbid: string,
		protected scope: string,
		readonly _options: DataStoreOptions,
	) {
		super(name, SCHEMA, dbid, scope, _options);
		this.DataStore = game.GetService("DataStoreService").GetDataStore(name, scope, _options);
		this.SET_DB_BRIDGE({
			GET: (key, options) => {
				return this.DataStore.GetAsync(key, options);
			},
			REMOVE: (key) => {
				return this.DataStore.RemoveAsync(key);
			},
			HAS: (key) => {
				return this.DataStore.GetAsync(key)[0] === undefined ? false : true;
			},
			SET: (key, value, userIds, options) => {
				return this.DataStore.SetAsync(key, value, userIds, options);
			},
			UPDATE: (key, callback) => {
				return this.DataStore.UpdateAsync(key, callback);
			},
			INCREMENT: (key, delta, userIds, options) => {
				return this.DataStore.IncrementAsync(key, delta, userIds, options) as S;
			},
		});
	}
}

/**
 * Ordered DataStore for `DataStoreDatabase`
 */
export class OrderedDataStoreDatabase<S> extends Database<
	S,
	{
		GET: () => number | undefined;
		REMOVE: () => number | undefined;
		UPDATE: () => number | undefined;
		INCREMENT: () => number;
		SET: () => void;
	}
> {
	protected OrderedDataStore: OrderedDataStore;
	/**
	 * Gets the values sorted until the index is met or no more values exists.
	 */
	GetSortedAsyncUntil(
		index: number,
		acsending: boolean,
		minValue?: number,
		maxValue?: number,
		/**
		 * Determines how much items per page, default will be 100/index if < 100.
		 */
		chunks?: number,
	): { key: string; value: S }[] {
		const Data: { key: string; value: S }[] = [];
		const Pages = this.GetSortedAsync(acsending, chunks ?? (index > 100 ? 100 : index), minValue, maxValue);
		const loadFromPages = (): { key: string; value: S }[] => {
			for (const x of Pages.GetCurrentPage()) {
				Data.push(x as never);
				if (Data.size() >= index) {
					return Data;
				}
			}
			if (!Pages.IsFinished) {
				Pages.AdvanceToNextPageAsync();
				return loadFromPages();
			}
			return Data;
		};
		return loadFromPages();
	}
	GetSortedAsync(acsending: boolean, pagesize: number, minValue?: number, maxValue?: number): DataStorePages {
		return this.OrderedDataStore.GetSortedAsync(acsending, pagesize, minValue, maxValue);
	}
	constructor(
		protected name: string,
		protected SCHEMA: unknown,
		protected dbid: string,
		protected scope: string,
		readonly _options: never,
	) {
		super(name, SCHEMA, dbid, scope, _options);
		this.OrderedDataStore = game.GetService("DataStoreService").GetOrderedDataStore(name, scope);
		this.SET_DB_BRIDGE({
			GET: (key) => {
				return this.OrderedDataStore.GetAsync(key);
			},
			REMOVE: (key) => {
				return this.OrderedDataStore.RemoveAsync(key);
			},
			HAS: (key) => {
				return this.OrderedDataStore.GetAsync(key) === undefined ? false : true;
			},
			SET: (key, value) => {
				return this.OrderedDataStore.SetAsync(key, value);
			},
			UPDATE: (key, callback) => {
				return this.OrderedDataStore.UpdateAsync(key, callback);
			},
			INCREMENT: (key, delta) => {
				return this.OrderedDataStore.IncrementAsync(key, delta);
			},
		});
	}
}
