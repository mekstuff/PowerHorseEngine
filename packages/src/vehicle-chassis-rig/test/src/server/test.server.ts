import { VehicleChassisRig, VehicleChassisRigWheel } from "@mekstuff-rbxts/vehicle-chassis-rig";
import { AutoRigVehicleModel, RigFromModel } from "../VehicleChassisRig";

const Car = game.Workspace.FindFirstChild("Car") as AutoRigVehicleModel;
const ChassisRig = new VehicleChassisRig(
	RigFromModel(Car, {
		WheelsCollisionGroup: "CarWheel",
	}),
);

ChassisRig.Parent = Car;

// const TestWheelModel = game.Workspace.FindFirstChild("TestWheel") as {
// 	FL: BasePart;
// 	FR: BasePart;
// 	BR: BasePart;
// 	BL: BasePart;
// 	Main: BasePart;
// } & Model;
// const TestWheel_FL = new VehicleChassisRigWheel(TestWheelModel.FL);
// TestWheel_FL.AttachmentAlignment = "Right";
// TestWheel_FL.Parent = TestWheelModel;
// TestWheel_FL._Main = TestWheelModel.Main;
// const TestWheel_FR = new VehicleChassisRigWheel(TestWheelModel.FR);
// TestWheel_FR.AttachmentAlignment = "Left";
// TestWheel_FR.Parent = TestWheelModel;
// TestWheel_FR._Main = TestWheelModel.Main;
// const TestWheel_BL = new VehicleChassisRigWheel(TestWheelModel.BL);
// TestWheel_BL.AttachmentAlignment = "Right";
// TestWheel_BL.Parent = TestWheelModel;
// TestWheel_BL._Main = TestWheelModel.Main;
// const TestWheel_BR = new VehicleChassisRigWheel(TestWheelModel.BR);
// TestWheel_BR.AttachmentAlignment = "Left";
// TestWheel_BR.Parent = TestWheelModel;
// TestWheel_BR._Main = TestWheelModel.Main;

const CreateRig = (Model: AutoRigVehicleModel) => {
	const ChassisRig = new VehicleChassisRig(
		RigFromModel(Model, {
			WheelsCollisionGroup: "CarWheel",
		}),
	);
	ChassisRig.Parent = Model;

	const DriveSeat = Model.FindFirstChild("DriveSeat") as VehicleSeat;

	let CurrentExtraMassContribution = 0;

	const CalculateMassAndUpdateSprings = () => {
		// ChassisRig.SetAssemblyAnchored(true);
		// const [Stiffness, Damping] = ChassisRig.GetSpringValues(
		// 	ChassisRig.GetTotalMass(Model, [Model.Wheels]) + CurrentExtraMassContribution,
		// 	4,
		// 	game.Workspace.Gravity,
		// 	ChassisRig.SpringFreeLength,
		// );
		// ChassisRig.SpringStiffness = Stiffness;
		// ChassisRig.SpringDamping = Damping;
		// game.GetService("RunService").Heartbeat.Wait();
		ChassisRig.SetAssemblyAnchored(false);
	};

	ChassisRig.usePropertyEffect(() => {
		CalculateMassAndUpdateSprings();
	}, ["SpringFreeLength"]);

	DriveSeat.ChildAdded.Connect((child) => {
		if (child.IsA("Weld")) {
			const c = child.Part1?.Parent;
			if (!c) {
				return;
			}
			if (!game.GetService("Players").GetPlayerFromCharacter(c)) {
				return;
			}
			const _cMass = ChassisRig.GetTotalMass(c);
			CurrentExtraMassContribution = _cMass;
			CalculateMassAndUpdateSprings();
			child.Destroying.Connect(() => {
				CurrentExtraMassContribution -= _cMass;
				CalculateMassAndUpdateSprings();
			});
		}
	});

	ChassisRig.BindToVehicleSeat(DriveSeat);
};

// CreateRig(game.Workspace.FindFirstChild("Jeep") as AutoRigVehicleModel);
// CreateRig(game.Workspace.FindFirstChild("Mercedes") as AutoRigVehicleModel);
// CreateRig(game.Workspace.FindFirstChild("BlueCar") as AutoRigVehicleModel);

// coroutine.wrap(() => {
// 	while (true) { // eslint-disable-line
// 		const n = new Instance("Part");
// 		n.Anchored = true;
// 		n.Material = Enum.Material.SmoothPlastic;
// 		n.CanCollide = true;
// 		n.Position = new Vector3(0);
// 		n.Size = new Vector3(200, 2, 2);
// 		n.Shape = Enum.PartType.Cylinder;
// 		const t = game
// 			.GetService("TweenService")
// 			.Create(n, new TweenInfo(math.random(10, 16), Enum.EasingStyle.Linear), {
// 				Position: new Vector3(0, 0, 300),
// 			});
// 		t.Completed.Connect(() => {
// 			t.Destroy();
// 			n.Destroy();
// 		});
// 		t.Play();
// 		n.Parent = game.Workspace;
// 		task.wait(math.random());
// 	}
// })();
