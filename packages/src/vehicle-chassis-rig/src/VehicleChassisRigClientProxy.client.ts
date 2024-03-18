/* eslint-disable roblox-ts/no-private-identifier */

import { Pseudo, Servant } from "@mekstuff-rbxts/core";
import { Serializer } from "@mekstuff-rbxts/serializer";
import { VehicleChassisRigClientProxy_vEncode } from "./VehicleChassisRig";

const TweenService = game.GetService("TweenService");

new (class VehicleChassisRigClientProxy extends Pseudo {
	public SteerFloat = 0;
	public ThrottleFloat = 0;
	public MaxSteerAngleDecay = 0;
	public ReverseTorque = undefined;
	public Torque = 0;
	public ReverseMaxSpeed = undefined;
	public MaxSpeed = 0;
	public MaxSteerAngle = 0;
	public TurnSpeed = 0;
	public ChassisType = "Car";
	public BikeOrientationMaxTorque = 1000000;
	public BikeOrientationResponsiveness = 10;
	public BikeXAxisRotation = 0;
	public BikeYAxisRotation = 0;
	public BikeZAxisRotation = 0;
	public AutoBikeZAxisRotation = true;
	public AutoBikeZAxisRotationAngle = 45;

	private _AssemblyLinearVelocityMagnitude = 0;
	constructor() {
		super("VehicleChassisRig");
		this.GetRef().Name = "VehicleChassisRigClientProxy";
		const RigServant = new Servant();
		this._dev.RigServant = RigServant;
		RigServant.Parent = this.GetRef();

		if (script.Name === "__") {
			this.Destroy();
			RigServant.Destroy();
			task.wait(0.1);
			script.Destroy();
			return;
		}

		RigServant.Keep(
			script.GetPropertyChangedSignal("Name").Connect(() => {
				this.Destroy();
				RigServant.Destroy();
				task.wait(0.1);
				script.Destroy();
			}),
		);

		const [NOESerializer] = RigServant.Keep(new Serializer(this.ClassName + "NetworkOwnership"));
		const _v = script.WaitForChild("_v") as StringValue;
		const _upd = script.WaitForChild("_upd") as StringValue;
		const Data = NOESerializer.Decode(_v.Value) as VehicleChassisRigClientProxy_vEncode;
		this.ThrottleFloat = Data.vehicleSeat.ThrottleFloat;
		this.SteerFloat = Data.vehicleSeat.SteerFloat;

		RigServant.Keep(
			Data.vehicleSeat.GetPropertyChangedSignal("ThrottleFloat").Connect(() => {
				this.ThrottleFloat = Data.vehicleSeat.ThrottleFloat;
			}),
		);
		RigServant.Keep(
			Data.vehicleSeat.GetPropertyChangedSignal("SteerFloat").Connect(() => {
				this.SteerFloat = Data.vehicleSeat.SteerFloat;
			}),
		);
		RigServant.Keep(
			game.GetService("RunService").RenderStepped.Connect(() => {
				this._AssemblyLinearVelocityMagnitude = Data.vehicleSeat.AssemblyLinearVelocity.Magnitude;
			}),
		);

		const update_upd = () => {
			const _updData = NOESerializer.Decode(_upd.Value) as Record<string, unknown>;
			for (const [key, value] of pairs(_updData)) {
				(this as Record<string, unknown>)[key] = value;
			}
		};
		update_upd();
		RigServant.Keep(
			_upd.GetPropertyChangedSignal("Value").Connect(() => {
				update_upd();
			}),
		);

		this.usePropertyEffect(() => {
			if (this.ChassisType === "Bike") {
				const BikeServant = new Servant();
				const BikeOrientationConstraint = Data.main.WaitForChild(
					"BikeOrientationConstraint",
				) as AlignOrientation;

				BikeServant.Keep(
					this.usePropertyEffect(() => {
						BikeOrientationConstraint.MaxTorque = this.BikeOrientationMaxTorque;
						BikeOrientationConstraint.Responsiveness = this.BikeOrientationResponsiveness;
					}, ["BikeOrientationMaxTorque", "BikeOrientationResponsiveness"]),
				);
				BikeServant.Keep(
					this.usePropertyEffect(() => {
						BikeOrientationConstraint.CFrame = CFrame.Angles(
							math.rad(this.BikeXAxisRotation),
							math.rad(this.BikeYAxisRotation),
							math.rad(this.BikeZAxisRotation),
						);
					}, ["BikeXAxisRotation", "BikeYAxisRotation", "BikeZAxisRotation"]),
				);
				BikeServant.Keep(
					game.GetService("RunService").Heartbeat.Connect(() => {
						BikeOrientationConstraint.PrimaryAxis = Vector3.xAxis.add(
							Data.main.CFrame.LookVector.Cross(Vector3.xAxis).mul(this.SteerFloat * 1),
						).Unit;
					}),
				);
				return () => {
					BikeServant.Destroy();
				};
			}
		}, ["ChassisType"]);

		this.usePropertyEffect(() => {
			const SteerAngle =
				this.SteerFloat *
				(this.MaxSteerAngle - this.MaxSteerAngleDecay * this._AssemblyLinearVelocityMagnitude);
			Data.steer.forEach((steer) => {
				if (!steer || !steer.Attachment0) {
					return;
				}
				const targetY = -SteerAngle * (steer.SteerInversed ? -1 : 1);
				TweenService.Create(steer.Attachment0, new TweenInfo(this.TurnSpeed), {
					Orientation: new Vector3(0, targetY, 90),
				}).Play();
			});
		}, ["SteerFloat", "MaxSteerAngle", "_AssemblyLinearVelocityMagnitude"]);

		this.usePropertyEffect(() => {
			Data.wheels.forEach((wheel) => {
				const WheelCylindrical = wheel.FindFirstChildWhichIsA("CylindricalConstraint") as
					| CylindricalConstraint
					| undefined;

				if (!WheelCylindrical) {
					return;
				}
				const _targetMaxSpeed =
					this.ReverseMaxSpeed !== undefined
						? this.ThrottleFloat === -1
							? this.ReverseMaxSpeed
							: this.MaxSpeed
						: this.MaxSpeed;

				const _targetTorque =
					this.ReverseTorque !== undefined
						? this.ThrottleFloat === -1
							? this.ReverseTorque
							: this.Torque
						: this.Torque;
				WheelCylindrical.AngularVelocity = (_targetMaxSpeed / (Data.wheelZSize * 0.5)) * this.ThrottleFloat;
				WheelCylindrical.MotorMaxTorque = (_targetTorque * 1000) / Data.wheels.size();
			});
		}, ["ThrottleFloat", "Torque", "MaxSpeed", "ReverseMaxSpeed", "ReverseTorque"]);

		this.GetRef().Parent = Data.rig;
	}
})();
