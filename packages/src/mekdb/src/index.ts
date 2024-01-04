import { PrimitivesForSchema } from "@mekstuff-rbxts/primitive";
import { DataStoreDatabase, OrderedDataStoreDatabase } from "./providers/datastore2";
import { SuphiDataStoreDatabase } from "./providers/suphi-datastore";

const DBProviders = {
	datastore: DataStoreDatabase,
	["suphi-datastore"]: SuphiDataStoreDatabase,
	["ordered-datastore"]: OrderedDataStoreDatabase,
} as const;

/**
 * List of all databases
 */
const Databases: Map<string, true> = new Map();

const GET_DB_ID = (provider: string, scope?: string) => {
	return `${provider}-${scope ?? "default"}`;
};

export function CreateDatabase<S, provider extends keyof typeof DBProviders>(
	name: string,
	config: {
		provider: provider;
		schema: (p: typeof PrimitivesForSchema) => S;
		scope?: string;
		options?: (typeof DBProviders)[provider]["prototype"]["_options"];
	},
): provider extends "datastore"
	? DataStoreDatabase<S>
	: provider extends "ordered-datastore"
	? OrderedDataStoreDatabase<S>
	: provider extends "suphi-datastore"
	? SuphiDataStoreDatabase<S>
	: never {
	config.scope = config.scope ?? "default";
	const providername = config.provider;
	if (!typeIs(config.provider, "string")) {
		throw `Provider is missing "Name". ${config.provider}`;
	}
	const dbid = GET_DB_ID(config.provider, config.scope);
	const alreadyCreated = Databases.get(dbid);
	if (alreadyCreated) {
		throw `You cannot create a database with similar dbid, Only a single database in your project can be named "${name}" with the provider "${config.provider}" under the scope "${config.scope}"`;
	}
	const targetprovider = DBProviders[config.provider];
	if (targetprovider === undefined) {
		throw `Could not create provider "${config.provider}", non-existing provider provided.`;
	}
	const db = new targetprovider(
		name,
		config.schema(PrimitivesForSchema),
		dbid,
		config.scope,
		config.options as never,
	);
	Databases.set(dbid, true);
	return db as never;
}
