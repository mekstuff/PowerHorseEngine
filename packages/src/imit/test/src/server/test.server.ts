import { ImitationService, createSchema } from "@mekstuff-rbxts/imit";

declare global {
	interface ImitationServiceSchemas {
		test: typeof Schema;
	}
}

const Schema = createSchema((p) =>
	p.default(
		p.object({
			Test: p.array(p.string()),
		}),
		{
			Test: [],
		},
	),
);

const token = ImitationService.newToken("test", Schema);

task.wait(3);
token.Imitation.Test.push("a");
token.ImitateSync();
task.wait(1);
token.Imitation.Test.push("b");
token.ImitateSync();
task.wait(1);
token.Imitation.Test.pop();
token.ImitateSync();
// token.ImitateSync();
// const Schema = createSchema((p) => {
// 	return p.object({
// 		CurrentList: p.default(
// 			p.array(
// 				p.object({
// 					DonatorUserId: p.number(),
// 					DonateeUserId: p.number(),
// 					AmountInRobux: p.number(),
// 				}),
// 			),
// 			[],
// 		),
// 		Object: p.default(
// 			p.dict(
// 				p.string(),
// 				p.object({
// 					DonatorUserId: p.number(),
// 					DonateeUserId: p.number(),
// 					AmountInRobux: p.number(),
// 				}),
// 			),
// 			{},
// 		),
// 	});
// });

// token.Imitation.CurrentList.push({
// 	AmountInRobux: 1,
// 	DonateeUserId: 1,
// 	DonatorUserId: 1,
// });
// // print(token.Imitation);
// token.ImitateSync();
// // task.wait(3);
// // token.Imitation.CurrentList.push({
// // 	AmountInRobux: 2,
// // 	DonateeUserId: 2,
// // 	DonatorUserId: 2,
// // });
// // print(token.Imitation);
// // token.ImitateSync();
// task.wait(5);
// print("REMOVING ON SERVER");
// token.Imitation.CurrentList.remove(0);
// // print(token.Imitation);
// token.ImitateSync();
