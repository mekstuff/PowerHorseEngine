import { DerivativeMeasurement, PseudoPID } from "@mekstuff-rbxts/pseudo-pid";

const TrackPart = game.GetService("Workspace").WaitForChild("TrackPart") as Part;
const FollowPart = game.GetService("Workspace").WaitForChild("FollowPart") as Part;
const PID = new PseudoPID();
PID.DerivativeMeasurement = DerivativeMeasurement.ErrorRateOfChange;
const VectorForceAttachment0 = new Instance("Attachment");
VectorForceAttachment0.Parent = FollowPart;
const VectorForce = new Instance("VectorForce");
VectorForce.Attachment0 = VectorForceAttachment0;
VectorForce.Parent = FollowPart;

game.GetService("RunService").Stepped.Connect((_, dt) => {
	const upd = PID.Update(dt, FollowPart.Position.X, TrackPart.Position.X);
	VectorForce.Force = new Vector3(upd, 0, 0);
});

PID.Parent = game.Workspace;
