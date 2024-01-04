import Object from "@mekstuff-rbxts/object";

const trackable = Object.ttable<string[]>(["hello"], true);

trackable.Bind((k, v, p) => {
	print("change", k, v, p);
	return (_v) => {
		print("removed", _v);
	};
});

print(trackable.find((x) => x === "hello"));
trackable._push(1);
// trackable.t = 4;

// // trackable.ChildRemoved.Connect((x, y, z) => {
// // 	print("Child removed:", x, y, z);
// // });
// // trackable.ChildChanged.Connect((x, y, z) => {
// // 	print("Child changed:", x, y, z);
// // });

// task.wait(2);
// trackable.t = {};
// // trackable.t.x = {};
// // trackable.t.x.y = {};

// // task.wait(2);
// // trackable.t = undefined;

// task.wait(1);
// trackable.t = 1;
// trackable.t = undefined;
// // trackable.Destroy();
// // trackable.x = 1;

// // trackable.forEach((v, i) => {
// // 	print(v, i);
// // });

// // print(trackable.size());
// // const t = {
// // 	x: true,
// // 	y: {
// // 		r: 1,
// // 	},
// // };

// // Object.setValue(t, ["x"], 1);

// // Object.setValue(t, ["x", "y", "r"], 1);
// // // for (const v of t) {
// // 	print();
// // }
// // for (const [a, b] of t) {
// // }
// // Object.onSetValue(t, (key, value) => {
// // 	print("Setting value");
// // 	print(value);
// // 	return 4;
// // });

// // Object.setValue(t, "a", true);

// // print(t);
// // const t = {
// // 	x: 1,
// // };
// // Object.changed(t, () => {});
// // t.x = 3;

// // for (const [a, b] of pairs(t)) {
// // 	print(a, b);
// // }
// // print(t);
// // for (const x of Object.iterate(t)) {
// // 	print("nice");
// // }
// // const t: string[] = ["a", "b", "c"];

// // print(Object.keys(t));
// // print(Object.values(t));
// // print(Object.length(t));

// // Object.keys(t).forEach((x) => {});
// // Object.values(t).forEach((x) => {});

// // Array.listen(t, (k, v, path) => {
// // 	print(path, k, v);
// // });

// // t.x = {};
// // (t.x as typeof t).y = {};
// // ((t.x as typeof t).y as typeof t).z = 1;
// // ((t.x as typeof t).y as typeof t).z = 2;
