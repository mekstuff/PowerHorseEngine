import { CreateDatabase } from "@mekstuff-rbxts/mekdb";

export const DataStoreTest = CreateDatabase("DataStoreTest", {
	provider: "datastore",
	schema: (p) =>
		p.object({
			coins: p.number(),
		}),
});

export const OrderedDataStoreTest = CreateDatabase("OrderedDataStoreTest", {
	provider: "ordered-datastore",
	schema: (p) => p.number(),
});

export const SuphiDataStoreTest = CreateDatabase("SuphiDataStoreTest", {
	provider: "suphi-datastore",
	schema: (p) => p.default(p.number(), 0),
});
