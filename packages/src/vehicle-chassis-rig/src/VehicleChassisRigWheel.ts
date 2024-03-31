/* eslint-disable roblox-ts/no-private-identifier */

import { Pseudo, Servant } from "@mekstuff-rbxts/core";
import CONSTS from "./CONSTANTS";
import ValueResolver from "@mekstuff-rbxts/value-resolver";

const TweenService = game.GetService("TweenService");

/**
 * Command line executables:
 *
 * - Creating a `Face` Part inside a wheel model:
~~~~~~~~~~ COPY START ~~~~~~~~~~
local Selection = game:GetService("Selection");
local updated = {}
for _,v in Selection:Get() do
	if not(v:IsA("Model"))then
		warn(`VehicleChassisRigWheel -> Skipping "{tostring(v)}" as it is not a model.`);
		continue;
	end
	local BoundsCF = v:GetBoundingBox();
	local _face = Instance.new("Part");
	_face.Name = "_face";
	_face.CanCollide = false;
	_face.CanQuery = false;
	_face.CanTouch = false;
	_face.Position = BoundsCF.Position;
	_face.Size = Vector3.new(1,1,1);
	_face.Parent = v;
	table.insert(updated, _face)
	v.PrimaryPart = v.PrimaryPart or _face;
end
Selection:Set(updated);
updated = nil;
Selection = nil;
warn(`\n\nVehicleChassisRigWheel -> CTRL+Z Will NOT Undo recent changes!`);
~~~~~~~~~~ COPY END ~~~~~~~~~~
 */

export default class VehicleChassisRigWheel extends Pseudo<{
	PhysicalWheel: Part;
}> {
	Name = "VehicleChassisRigWheel";
	Steerable = CONSTS.VehicleDefaults.Steerable;
	SteerAngle = CONSTS.VehicleDefaults.SteerAngle;
	SteerInversed = CONSTS.VehicleDefaults.SteerInversed;
	Spring = CONSTS.VehicleDefaults.Spring;
	SpringLimitsEnabled = CONSTS.VehicleDefaults.SpringLimitsEnabled;
	SpringDamping = CONSTS.VehicleDefaults.SpringDamping;
	SpringMinLength = CONSTS.VehicleDefaults.SpringMinLength;
	SpringMaxLength = CONSTS.VehicleDefaults.SpringMaxLength;
	SpringFreeLength = CONSTS.VehicleDefaults.SpringFreeLength;
	SpringMaxForce = CONSTS.VehicleDefaults.SpringMaxForce;
	SpringStiffness = CONSTS.VehicleDefaults.SpringStiffness;
	CylindricalLimitsEnabled = CONSTS.VehicleDefaults.CylindricalLimitsEnabled;
	CylindricalLowerLimit = CONSTS.VehicleDefaults.CylindricalLowerLimit;
	CylindricalUpperLimit = CONSTS.VehicleDefaults.CylindricalUpperLimit;
	CylindricalAngularVelocity = CONSTS.VehicleDefaults.CylindricalAngularVelocity;
	CylindricalMaxAngularAcceleration = CONSTS.VehicleDefaults.CylindricalMaxAngularAcceleration;
	CylindricalMaxTorque = CONSTS.VehicleDefaults.CylindricalMaxTorque;
	Attachment0OrientationSpeed = CONSTS.VehicleDefaults.Attachment0OrientationSpeed;
	CollisionGroup = "Default";

	SpringVisible = CONSTS.VehicleDefaults.WheelSpringsVisible;
	Size = CONSTS.VehicleDefaults.WheelSize;
	Visible = CONSTS.VehicleDefaults.WheelsVisible;
	Motor = CONSTS.VehicleDefaults.WheelsMotor;
	PhysicalProperties: PhysicalProperties | undefined = CONSTS.VehicleDefaults.WheelsPhysicalProperties;
	Shape: Enum.PartType = CONSTS.VehicleDefaults.WheelShape;
	/**
	 * If the Wheel is on the `Left Side` of the car, then the AttachmentAlignement should be on the `Right`.
	 */
	AttachmentAlignment: Enum.HorizontalAlignment | "Left" | "Center" | "Right" = "Right";
	GetPrimaryPart(): BasePart {
		const wheel = this.Wheel;
		if (wheel.IsA("Model")) {
			const f = wheel.PrimaryPart ?? wheel.FindFirstChildWhichIsA("BasePart");
			if (f) {
				return f;
			}
		}
		if (wheel.IsA("BasePart")) {
			return wheel;
		}
		throw "Could not resolve wheels PrimaryPart.";
	}
	_Main: BasePart | undefined = undefined;
	constructor(public Wheel: Instance) {
		super("VehicleChassisRigWheel");
		this.usePropertyRelationBinding(
			[
				"SpringLimitsEnabled",
				"SpringDamping",
				"SpringMinLength",
				"SpringMaxLength",
				"SpringFreeLength",
				"SpringMaxForce",
				"SpringStiffness",
			],
			"Spring",
			true,
		);
		this.usePropertyRelationBinding(
			["CylindricalLowerLimit", "CylindricalUpperLimit"],
			"CylindricalLimitsEnabled",
			true,
		);
		const PhysicalWheel = new Instance("Part");
		this._dev.PhysicalWheel = PhysicalWheel;
		PhysicalWheel.Name = Wheel.Name;
		this.useMapping(["Size"], [PhysicalWheel]);
		PhysicalWheel.CFrame = ValueResolver.GetCFrameValue(Wheel);
		PhysicalWheel.Material = Enum.Material.SmoothPlastic;
		PhysicalWheel.Anchored = false;

		this.useMapping(["CollisionGroup"], [PhysicalWheel]);

		this.usePropertyEffect(() => {
			PhysicalWheel.Shape = this.Shape;
		}, ["Shape"]);
		this.usePropertyEffect(() => {
			PhysicalWheel.Transparency = this.Visible ? 0.1 : 1;
		}, ["Visible"]);
		this.usePropertyEffect(() => {
			PhysicalWheel.CustomPhysicalProperties = this.PhysicalProperties;
		}, ["PhysicalProperties"]);

		const PhysicalWheel_To_Wheel_Weld = new Instance("WeldConstraint");
		PhysicalWheel_To_Wheel_Weld.Name = "PhysicalWeld";
		PhysicalWheel_To_Wheel_Weld.Part0 = PhysicalWheel;
		PhysicalWheel_To_Wheel_Weld.Part1 = this.GetPrimaryPart();
		PhysicalWheel_To_Wheel_Weld.Parent = this.GetRef();

		const _getAttachmentAlignmentValue = (): -1 | 0 | 1 => {
			const _AttachmentAlignment = typeIs(this.AttachmentAlignment, "string")
				? Enum.HorizontalAlignment[this.AttachmentAlignment]
				: this.AttachmentAlignment;
			const AttachmentAlignmentValue =
				_AttachmentAlignment === Enum.HorizontalAlignment.Left
					? -1
					: _AttachmentAlignment === Enum.HorizontalAlignment.Right
					? 1
					: 0;
			return AttachmentAlignmentValue;
		};

		this.usePropertyEffect(() => {
			if (this._Main !== undefined) {
				const MainServant = new Servant();
				const [Attachment0] = MainServant.Keep(new Instance("Attachment"));
				Attachment0.Name = "Attachment0_" + Wheel.Name;
				Attachment0.Parent = this._Main;
				const [Attachment1] = MainServant.Keep(new Instance("Attachment"));
				Attachment1.Orientation = new Vector3(0, -180, 0);
				Attachment1.Name = "Attachment1_" + Wheel.Name;
				Attachment1.Parent = PhysicalWheel;

				MainServant.Keep(
					this.usePropertyEffect(() => {
						if (this.Steerable) {
							TweenService.Create(Attachment0, new TweenInfo(this.Attachment0OrientationSpeed), {
								Orientation: new Vector3(0, -this.SteerAngle * (this.SteerInversed ? -1 : 1), 90),
							}).Play();
						} else {
							TweenService.Create(Attachment0, new TweenInfo(this.Attachment0OrientationSpeed), {
								Orientation: new Vector3(0, 0, 90),
							}).Play();
						}
					}, ["SteerAngle", "Steerable", "SteerInversed"]),
				);

				MainServant.Keep(
					this.usePropertyEffect(() => {
						if (this.Spring) {
							const CurrentSpring = new Instance("SpringConstraint");
							CurrentSpring.Name = "Spring_" + Wheel.Name;
							CurrentSpring.Attachment0 = Attachment0;
							CurrentSpring.Attachment1 = Attachment1;
							CurrentSpring.Visible = true;
							CurrentSpring.Parent = PhysicalWheel;
							const s = this.usePropertyEffect(() => {
								CurrentSpring.LimitsEnabled = this.SpringLimitsEnabled;
								CurrentSpring.Damping = this.SpringDamping;
								CurrentSpring.FreeLength = this.SpringFreeLength;
								CurrentSpring.Stiffness = this.SpringStiffness;
								CurrentSpring.MaxForce = this.SpringMaxForce;
							}, [
								"SpringDamping",
								"SpringFreeLength",
								"SpringStiffness",
								"SpringMaxForce",
								"SpringLimitsEnabled",
							]);
							s.Keep(
								this.usePropertyEffect(() => {
									CurrentSpring.MinLength = this.SpringMinLength;
									CurrentSpring.MaxLength = this.SpringMaxLength;
								}, ["SpringMinLength", "SpringMaxLength"]),
							);
							s.Keep(
								this.usePropertyEffect(() => {
									CurrentSpring.Visible = this.SpringVisible;
								}, ["SpringVisible"]),
							);
							return () => {
								s.Destroy();
								CurrentSpring.Destroy();
							};
						}
					}, ["Spring"]),
				);

				const [CylindricalConstraint] = MainServant.Keep(new Instance("CylindricalConstraint"));
				CylindricalConstraint.Name = "Cylindrical_" + Wheel.Name;

				CylindricalConstraint.InclinationAngle = 90;
				CylindricalConstraint.Attachment0 = Attachment0;
				CylindricalConstraint.Attachment1 = Attachment1;
				CylindricalConstraint.Parent = PhysicalWheel;

				this.usePropertyEffect(() => {
					CylindricalConstraint.LimitsEnabled = this.CylindricalLimitsEnabled;
					CylindricalConstraint.UpperLimit = this.CylindricalUpperLimit;
					CylindricalConstraint.LowerLimit = this.CylindricalLowerLimit;
				}, ["CylindricalUpperLimit", "CylindricalLowerLimit", "CylindricalLimitsEnabled"]);

				this.usePropertyEffect(() => {
					CylindricalConstraint.AngularActuatorType =
						this.Motor === true ? Enum.ActuatorType.Motor : Enum.ActuatorType.None;
					if (this.Motor === true) {
						CylindricalConstraint.AngularVelocity = this.CylindricalAngularVelocity;
						CylindricalConstraint.MotorMaxAcceleration = this.CylindricalMaxAngularAcceleration;
						CylindricalConstraint.MotorMaxTorque = this.CylindricalMaxTorque;
					}
				}, [
					"Motor",
					"CylindricalAngularVelocity",
					"CylindricalMaxAngularAcceleration",
					"CylindricalMaxTorque",
				]);

				MainServant.Keep(
					this.usePropertyEffect(() => {
						Attachment1.Position = new Vector3(PhysicalWheel.Size.X / 2).mul(
							new Vector3(_getAttachmentAlignmentValue()),
						);
						Attachment0.WorldPosition = new Vector3(
							Attachment1.WorldPosition.X,
							ValueResolver.GetVector3Value(this._Main!).Y,
							Attachment1.WorldPosition.Z,
						);
					}, ["AttachmentAlignment"]),
				);

				return () => {
					MainServant.Destroy();
				};
			}
		}, ["_Main"]);

		/*
		this.usePropertyEffect(() => {
			if (this.BalanceSupport !== false && this._Main !== undefined) {
				const Balance = new Instance("Part");
				Balance.Name = `.WheelBalanceSupport`;
				Balance.Size = typeIs(this.BalanceSupport, "boolean")
					? new Vector3(5, this.Size.Y, 3)
					: typeIs(this.BalanceSupport, "number")
					? new Vector3(this.BalanceSupport, this.BalanceSupport, this.BalanceSupport)
					: this.BalanceSupport;
				Balance.Position = PhysicalWheel.Position.sub(new Vector3(0, Balance.Size.Y * 0.5, 0));
				Balance.Massless = true;
				Balance.CustomPhysicalProperties = new PhysicalProperties(0.01, 0, 0, 0, 0);

				const NoCollisionConstraint = new Instance("NoCollisionConstraint");
				NoCollisionConstraint.Part0 = Balance;
				NoCollisionConstraint.Part1 = PhysicalWheel;
				NoCollisionConstraint.Parent = Balance;

				const ue = this.usePropertyEffect(() => {
					Balance.CollisionGroup = this.CollisionGroup;
				}, ["CollisionGroup"]);

				const BalanceWeld = new Instance("WeldConstraint");
				BalanceWeld.Part0 = this._Main;
				BalanceWeld.Part1 = Balance;
				BalanceWeld.Parent = Balance;
				Balance.Parent = Wheel;
				return () => {
					ue.Destroy();
					Balance.Destroy();
					NoCollisionConstraint.Destroy();
				};
			}
		}, ["BalanceSupport", "_Main"]);
		*/

		PhysicalWheel.Parent = this.GetRef();
		this.useReferenceInstanceBehaviour();
	}
}
