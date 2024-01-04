import { ImitationServiceClient } from "@mekstuff-rbxts/imit";

ImitationServiceClient.tapIn("test", (ci) => {
	ci.dict("Test", (key, value) => {
		print("k:", key, "v:", value);
		return () => {
			print("Cleanup -> k:", key, "v:", value);
		};
	});
	// ci.dict("CurrentList", (key, value) => {
	// 	// print("dict CurrentList: ", key, value);
	// 	return () => {
	// 		// print("cleanup for ", key);
	// 	};
	// });
	// ci.dict("Object", (key, value) => {
	// 	print("dict Object: ", key, value);
	// });
});

// ImitationServiceClient.tapIn("test", (ci) => {
// 	const rep = ci.getReplicationTable();
// 	ci.on("CurrentList", (value) => {
// 		print(value.size());
// 		// const x = ["x"];
// 		// print(x.size());
// 		// print(value.size());
// 	});
// 	ci.dict("CurrentList", (key, value) => {});
// 	ci.dict("Object", (key, value) => {});
// 	// ci.dict("CurrentList", (key, value) => {
// 	// 	print("current list:", key, value);
// 	// });
// });

// ImitationServiceClient.tapIn("test", (ci) => {
// 	// ci.dict("TopDonations", (k: number, v) => {
// 	// 	print(v.Username);
// 	// });
// });
// ImitationServiceClient.tapIn("Test2", (ci) => {
// 	ci.on("dictionary", (value) => {
// 		const v = value.x;
// 	});
// 	ci.on("object", (value) => {
// 		const v = value.x;
// 	});
// });

// ImitationServiceClient.tapIn("")
// ImitationServiceClient.newClientToken("Test").then((x) => {
// 	x.set("x", new CFrame());
// 	x.set("y", {
// 		x: 1,
// 		y: false,
// 	});
// });

// ImitationServiceClient.tapIn("Test/*", (ci) => {
// 	ci.receive((...args) => {
// 		print("received: ", ...args);
// 	});
// 	ci.send("tapped in success");
// });
// ImitationServiceClient.tapIn("test/1", (ci) => {
// 	ci.dict("demo", (key, value) => {
// 		// print(key, value);
// 		print(key, "received");
// 		return (removed) => {
// 			print(key, "changed", removed);
// 		};
// 	});
// });

// ImitationServiceClient.tapIn("MousePosition")
// ImitationServiceClient.tapIn("MousePosition/1", (ci) => {
// 	ci.on("demo", () => {});
// 	// ci.on("Accessories", (acccessories) => {
// 	// 	acccessories.
// 	// });
// });
// const TestUI = new Instance("ScreenGui")

// const ToggleButton = new Instance("TextButton")
// ImitationServiceClient.newClientToken("MousePosition", true)
// 	.then((cit) => {
// 		// cit.set("Position", new Vector3(1, 2, 2));
// 		// UIS.InputChanged.Connect((inputObject) => {
// 		// 	if (inputObject.UserInputType === Enum.UserInputType.MouseMovement) {
// 		// 		cit.set("Position", inputObject.Position);
// 		// 	}
// 		// });
// 	})
// 	.catch((err) => {
// 		warn(`FAILED: ${err}`);
// 	});

// ImitationServiceClient.tapIn("MousePosition/*", (imitator) => {
// 	const props = imitator.getProps() as { owner: Player };
// 	print("Getting mouse position for: ", props.owner.Name);
// 	imitator.on("Position", (v) => {
// 		print(props.owner.Name, "Mouse Position Is:", v);
// 		return (destroyed) => {
// 			print(props.owner.Name, "Mouse Position Is No Longer:", v, destroyed);
// 		};
// 	});
// });
