/* eslint-disable roblox-ts/no-private-identifier */

import { VehicleChassisRig, VehicleChassisRigSpringModifier } from "@mekstuff-rbxts/vehicle-chassis-rig";
import { AutoRigVehicleModel, RigFromModel } from "../VehicleChassisRig";

const Car = game.GetService("Workspace").FindFirstChild("Motorbike") as AutoRigVehicleModel;
Car.Main.Anchored = true;
const ServerChassisRig = new VehicleChassisRig(
	RigFromModel(Car, {
		WheelsCollisionGroup: "CarWheel",
	}),
);
// ServerChassisRig.MaxSteerAngle = 10;
ServerChassisRig.ChassisType = "Bike";
ServerChassisRig.ReverseMaxSpeed = 20;
ServerChassisRig.MaxSpeed = 200;
ServerChassisRig.Torque = 60;
ServerChassisRig.ReverseTorque = 60;
ServerChassisRig.SetAssemblyDensity(0);
ServerChassisRig.Mass = 200;
ServerChassisRig.SpringFreeLength = 2;
ServerChassisRig.Spring = false;
const SpringModifier = new VehicleChassisRigSpringModifier(ServerChassisRig);
SpringModifier.TotalWheels = 2;
SpringModifier.SpringFreeLengthOffset = 0.3;
SpringModifier.Parent = ServerChassisRig;
ServerChassisRig.Parent = Car;

const DriveSeat = Car.FindFirstChild("DriveSeat") as VehicleSeat;
ServerChassisRig.BindToVehicleSeat(DriveSeat, ["SteerFloat", "ThrottleFloat"]);

DriveSeat.GetPropertyChangedSignal("Occupant").Connect(() => {
	if (DriveSeat.Occupant) {
		const Player = game.GetService("Players").GetPlayerFromCharacter(DriveSeat.Occupant.Parent);
		if (Player) {
			ServerChassisRig.SetNetworkOwnership(Player, DriveSeat);
			return;
		}
	}
	ServerChassisRig.SetNetworkOwnership();
});

ServerChassisRig.GetMain().Anchored = false;
