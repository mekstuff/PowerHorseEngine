/* eslint-disable roblox-ts/no-private-identifier */
import SuphiDataStore from "@rbxts/suphi-datastore";

import { Database } from "../core";
import { execSync } from "@mekstuff-rbxts/primitive";

/**
 * Database provider for suphi's data-store
 *
 * Requires @rbxts/suphi-datastore^1.0.0 to be installed.
 */
export class SuphiDataStoreDatabase<S> extends Database<S> {
	constructor(
		protected name: string,
		protected SCHEMA: unknown,
		protected dbid: string,
		protected scope: string,
		readonly _options: never,
	) {
		super(name, SCHEMA, dbid, scope, _options);
		const template = execSync(SCHEMA, undefined);
		this.SET_DB_BRIDGE({
			GET: (key) => {
				const DataStore = new SuphiDataStore(name, scope, key);
				if (DataStore.Open()[0] === "Success") {
					if (DataStore.Value === undefined) {
						DataStore.Value = template;
					}
					return DataStore.Value;
				}
				throw `Could not open DataStore.`;
			},
			HAS: (key) => {
				const DataStore = new SuphiDataStore(name, scope, key);
				if (DataStore.Open()[0] === "Success") {
					if (DataStore.Value !== undefined) {
						return true;
					}
					return false;
				}
				throw `Could not open DataStore.`;
			},
			INCREMENT: (key, delta) => {
				const DataStore = new SuphiDataStore(name, scope, key);
				if (DataStore.Open()[0] === "Success") {
					DataStore.Value = typeIs(DataStore.Value, "number") ? DataStore.Value + delta : delta;
					DataStore.Destroy();
				}
			},
			REMOVE: (key) => {
				const DataStore = new SuphiDataStore(name, scope, key);
				if (DataStore.Open()[0] === "Success") {
					DataStore.Value = undefined;
					DataStore.Destroy();
				}
			},
			SET: (key, value) => {
				const DataStore = new SuphiDataStore(name, scope, key);
				if (DataStore.Open()[0] === "Success") {
					DataStore.Value = value;
					DataStore.Destroy();
				}
			},
			UPDATE: (key, callback) => {
				const DataStore = new SuphiDataStore(name, scope, key);
				if (DataStore.Open()[0] === "Success") {
					// since we're passing the value of the template as oldValue, assure to use it as a readonly value!
					const oldValue = DataStore.Value !== undefined ? DataStore.Value : template;
					const newValue = callback(oldValue);
					DataStore.Value = newValue;
					DataStore.Destroy();
				}
			},
		});
	}
}

export { SuphiDataStore };
