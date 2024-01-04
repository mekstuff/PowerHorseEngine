// import { ImitationService, createSchema } from "@mekstuff-rbxts/imit";

// declare global {
// 	interface ImitationServiceSchemas {
// 		Test2: typeof Test2;
// 	}
// }
// const Test2 = createSchema((p) => {
// 	return {
// 		// v3: p.Vector3(),
// 		// // dictionary: p.either(p.number(), p.boolean()),
// 		// object: p.object({
// 		// 	x: p.object({
// 		// 		q: p.CFrame(),
// 		// 	}),
// 		// }),
// 		dictionary: p.dictionary(
// 			p.number(),
// 			p.object({
// 				nested: p.number(),
// 			}),
// 		),
// 		// dictionary2: p.dictionary(p.number(), p.boolean()),

// 		// dictionary: p.dictionary(p.number(), p.dictionary(p.string(), p.number())),
// 	};
// });
// Test2;
// // Test2.v3
// // Test2.dictionary.f = {}
// // Test2.dictionary2.x = true;
// // Test2.dictionary.f = {
// // 	x: 1,
// // };
// // Test2.dictionary;

// // Test2.dictionary.a = true;
