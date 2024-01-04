import { TaskScheduler } from "@mekstuff-rbxts/task-scheduler";

// print(
// 	[-30, -300, -10].sort((a, b) => {
// 		return a < b;
// 	}),
// );

// print(
// 	[
// 		{ priority: 1, time_stamp: 1, initial_index: 1 },
// 		{ priority: 1, time_stamp: 3, initial_index: 1 },
// 		{ priority: 2, time_stamp: 2, initial_index: 2 },
// 		{ priority: 3, time_stamp: 3, initial_index: 2 },
// 	].sort((a, b) => {
// 		// if (a.initial_index === b.initial_index) {
// 		// 	return a.time_stamp < b.time_stamp;
// 		// }
// 		if (a.priority === b.priority && a.initial_index === b.initial_index) {
// 			return a.time_stamp < b.time_stamp;
// 		}
// 		if (a.priority === b.priority && a.initial_index !== b.initial_index) {
// 			return a.initial_index < b.initial_index;
// 		}
// 		if (a.initial_index === b.initial_index && a.priority !== b.priority) {
// 			return a.priority > b.priority;
// 		}
// 		return a.priority < b.priority;
// 	}),
// );
const scheuler = new TaskScheduler<{ default: unknown; first: unknown; second: unknown; third: unknown }>({
	first: 3,
	second: 2,
	third: 1,
});

scheuler.Ended.Connect((err) => {
	print("ended!", err);
});

scheuler.atNext(
	() => {
		print('group: "first" priority: "1"');
		scheuler.atNext(
			() => {
				print('group: "first" priority: "1" --nested');
				throw "WTF";
			},
			{ group: "first", exitOnError: true },
		);
	},
	{ priority: 1, group: "first" },
);
scheuler.atNext(
	() => {
		print('group: "second" priority: "1"');
	},
	{ priority: 1, group: "second" },
);
scheuler.atNext(
	() => {
		print('group: "third" priority: "1"');
	},
	{ priority: 1, group: "third" },
);
scheuler.atNext(
	() => {
		print('group: "first" priority: "4"');
	},
	{ priority: 4, group: "first" },
);
scheuler.atNext(
	() => {
		print('group: "default" priority: "6"');
	},
	{ priority: 6 },
);

scheuler.SetGroupPriority({
	default: 1,
});
// // scheuler.atNext(() => {}, { priority: 1 });
// // scheuler.atNext(() => {}, { priority: 1 });

// print(scheuler.Scheduler);
