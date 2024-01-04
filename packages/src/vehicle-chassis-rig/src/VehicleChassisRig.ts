/* eslint-disable roblox-ts/no-private-identifier */

import { Pseudo, Servant } from "@mekstuff-rbxts/core";
import VehicleChassisRigWheel from "./VehicleChassisRigWheel";
import CONSTS from "./CONSTANTS";

export type VehicleModelInfo = {
	/**
	 * The `Main` is the central part of the Model.
	 *
	 * You can have a `VehicleChassisConfig` Configuration Folder within your `Main` to set default values. Any attribute/child
	 * of this Configuration Folder will directly apply to the `VehicleChassisRig`. For children, it must be a `ValueBase`, it will
	 * use the `Name` as the `Property` and the `Value` as the `Value`, For attributes it will use the `Name` of the Attribute as the `Property`
	 * and the `Value` of the Attribute as the `Value`.
	 */
	Main: BasePart & {
		VehicleChassisConfig?: Configuration & {};
	};
	/**
	 * List of items that will be welded to the `Main`, If `true` it will weld everything from the parent of the `Main`.
	 */
	WeldAssembly?: Instance[] | true;
	// /**
	//  * List of items that will be unanchored when the rig is ready.
	//  */
	// UnAnchorAssembly?: Instance[] | boolean;
	/**
	 * List of items that will become `Massless`.
	 */
	Massless?: Instance[];
	OccupantsBecomeMassless?: boolean;
	/**
	 * The `HitBox` is a non massed BasePart that will be used as the hitbox of the car. Defaults to the assembly size.
	 */
	Hitbox?: BasePart;
	Wheels?: VehicleChassisRigWheel[];
	/**
	 * These `BaseParts` will inherit the Default Body Collision Group.
	 */
	BodyParts?: Instance | Instance[];
};

type RigFromModelCallback = (ChassisRig: VehicleChassisRig) => VehicleModelInfo;

export type AutoRigVehicleModel = {
	Main: BasePart;
	Body: Folder | Model;
	Wheels: Folder | Model;
} & Model;
/**
 * The Naming convensions for Wheels should be `FL_...`, Only the first capital letters matter.
 * `FL` - FrontLeft
 * `FR` - FrontRight
 * `BL` - BackLeft
 * `BR` - BackRight
 * `FC` - FrontCenter
 * `BC` - BackCenter
 */
export function RigFromModel(
	VehicleModel: AutoRigVehicleModel,
	Options?: {
		BackWheelsSteerable?: boolean;
		InverseBackWheels?: boolean;
		WheelsCollisionGroup?: string;
	},
): RigFromModelCallback {
	return (ChassRig) => {
		return {
			Main: VehicleModel.Main,
			WeldAssembly: true,
			// UnAnchorAssembly: true,
			Wheels: VehicleModel.Wheels.GetChildren().map((wheel) => {
				const _M = wheel.Name.match("^(%u+)")[0] as string | undefined;
				if (_M === undefined) {
					print(wheel);
					throw "Wheel printed above did not match the proper naming convention. e.g. FL_...";
				}
				let AttachmentAlignment: VehicleChassisRigWheel["AttachmentAlignment"] | undefined;
				if (_M === "FL" || _M === "BL") {
					AttachmentAlignment = "Right";
				} else if (_M === "FR" || _M === "BR") {
					AttachmentAlignment = "Left";
				} else if (_M === "FC" || _M === "BC") {
					AttachmentAlignment = "Center";
				}
				if (!AttachmentAlignment) {
					throw `Could not resolve AttachmentAlignment from name: "${_M}" -> "${wheel.Name}"`;
				}
				const FirstLetter = _M.sub(1, 1);
				const WheelPos: "Front" | "Back" | undefined =
					FirstLetter === "B" ? "Back" : FirstLetter === "F" ? "Front" : undefined;
				if (WheelPos === undefined) {
					throw `Could not resolve Position of wheel from name: "${FirstLetter}" -> "${_M}" -> "${wheel.Name}". Should be "F" || "B"`;
				}
				const RigWheel = new VehicleChassisRigWheel(wheel);
				if (Options?.WheelsCollisionGroup !== undefined) {
					RigWheel.CollisionGroup = Options.WheelsCollisionGroup;
				}
				RigWheel.Name = _M + "_" + RigWheel.Name;
				RigWheel.AttachmentAlignment = AttachmentAlignment;
				RigWheel.SteerInversed = WheelPos === "Front" ? false : Options?.InverseBackWheels ?? false;
				RigWheel.Steerable = WheelPos === "Front" ? true : Options?.BackWheelsSteerable ?? false;
				if ((typeIs(wheel, "Instance") && wheel.IsA("BasePart")) || wheel.IsA("Model")) {
					ChassRig.SetWheelSize(RigWheel, wheel);
				}
				RigWheel.Parent = ChassRig.GetRef();
				return RigWheel;
			}),
		};
	};
}

/**
 * It is recommended that you initial have your target Vehicle `Model` in a state where no physics is applied. This can be for
 * e.g. anchoring all moving parts or placing into `ReplicatedStorage`. Then after the `ChassisRig` is applied, reapply physics.
 */
export default class VehicleChassisRig extends Pseudo<{
	MainServant: Servant;
}> {
	private _VehicleModelInfo: VehicleModelInfo;
	MaxSteerAngle = CONSTS.VehicleDefaults.MaxSteerAngle;
	SteerFloat = CONSTS.VehicleDefaults.SteerFloat;
	Torque = CONSTS.VehicleDefaults.Torque;
	ThrottleFloat = CONSTS.VehicleDefaults.ThrottleFloat;
	MaxSpeed = CONSTS.VehicleDefaults.MaxSpeed;
	TurnSpeed = CONSTS.VehicleDefaults.TurnSpeed;
	SpringDamping = CONSTS.VehicleDefaults.SpringDamping;
	SpringMinLength = CONSTS.VehicleDefaults.SpringMinLength;
	SpringMaxLength = CONSTS.VehicleDefaults.SpringMaxLength;
	SpringFreeLength = CONSTS.VehicleDefaults.SpringFreeLength;
	SpringMaxForce = CONSTS.VehicleDefaults.SpringMaxForce;
	SpringStiffness = CONSTS.VehicleDefaults.SpringStiffness;
	SpringLimitsEnabled = CONSTS.VehicleDefaults.SpringLimitsEnabled;
	CylindricalLimitsEnabled = CONSTS.VehicleDefaults.CylindricalLimitsEnabled;
	CylindricalLowerLimit = CONSTS.VehicleDefaults.CylindricalLowerLimit;
	CylindricalUpperLimit = CONSTS.VehicleDefaults.CylindricalUpperLimit;

	WheelRigsVisible = CONSTS.VehicleDefaults.WheelsVisible;
	/**
	 * Uses the values from the DrvieSeat like the `SteerFloat`, `ThrottleFloat` `Torque`, `MaxSpeed`, `TurnSpeed`.
	 */
	BindToVehicleSeat(VehicleSeat: VehicleSeat): Servant {
		const _C = ["SteerFloat", "Torque", "MaxSpeed", "ThrottleFloat", "TurnSpeed"];
		const [_S] = this._dev.MainServant.Keep(new Servant());
		_S.Keep(
			VehicleSeat.Destroying.Connect(() => {
				_S.Destroy();
			}),
		);
		_C.forEach((c) => {
			_S.Keep(
				VehicleSeat.GetPropertyChangedSignal(c as never).Connect(() => {
					this.useSetNewIndexAssignment(c, VehicleSeat[c as never]);
				}),
			);
			this.useSetNewIndexAssignment(c, VehicleSeat[c as never]);
		});
		return _S;
	}
	private _ForEachInstance(Instances: Instance[], Callback: (Instance: Instance) => void, Ignore?: Instance[]) {
		Instances.forEach((x) => {
			if (Ignore) {
				if (Ignore.indexOf(x) !== -1) {
					return;
				}
			}
			Callback(x);
		});
	}
	private _WeldInstanceDescendants(Instances: Instance[], To: BasePart, Ignore?: Instance[]) {
		this._ForEachInstance(
			Instances,
			(x) => {
				if (x.IsA("BasePart")) {
					if (x === To) {
						return;
					}
					const [_w] = this._dev.MainServant.Keep(new Instance("WeldConstraint"));
					_w.Part0 = To;
					_w.Part1 = x;
					_w.Name = `VehicleChassisRigWeld->${To.Name}->${x.Name}`;
					_w.Parent = x;
				}
				this._WeldInstanceDescendants(x.GetChildren(), To, Ignore);
			},
			Ignore,
		);
	}
	private _InstanceMasslessDescendants(Instances: Instance[], State: boolean, Ignore?: Instance[]) {
		this._ForEachInstance(
			Instances,
			(x) => {
				if (x.IsA("BasePart")) {
					x.Massless = State;
				}
				this._InstanceMasslessDescendants(x.GetChildren(), State, Ignore);
			},
			Ignore,
		);
	}
	/**
	 * Useful for making character `Massless` when inside the vehicle, then back to default when they leave.
	 */
	public SetCharacterMassless(Character: Model, Massless: boolean) {
		this._InstanceMasslessDescendants([Character], Massless);
	}
	public SetInstancesMassless(Instances: Instance | Instance[], Massless: boolean) {
		return this._InstanceMasslessDescendants(typeIs(Instances, "Instance") ? [Instances] : Instances, Massless);
	}

	/**
	 * @param Entry Defaults to `Main.Parent`
	 */
	public GetTotalMass(Entry: Instance, Ignore?: Instance[]): number {
		let _M = 0;
		this._ForEachInstance(
			Entry.GetChildren(),
			(x) => {
				if (x.IsA("BasePart")) {
					_M += x.Mass;
				}
				_M += this.GetTotalMass(x, Ignore);
			},
			Ignore,
		);
		return _M;
	}
	public GetSpringStiffness(
		Mass: number,
		TotalWheels: number,
		Gravity: number,
		DesiredSuspensionHeight: number,
	): number {
		return ((Mass * Gravity) / DesiredSuspensionHeight) * TotalWheels;
	}
	public GetSpringDamping(Mass: number, Stiffness: number, TotalWheels: number, DampingCONSTS?: number): number {
		return (2 * math.sqrt(Mass * Stiffness) * (DampingCONSTS ?? 1)) / TotalWheels;
	}
	/**
	 * Returns the Spring Stiffness and Spring Damping in that order.
	 */
	public GetSpringValues(
		Mass: number,
		TotalWheels: number,
		Gravity: number,
		DesiredSuspensionHeight: number,
		DampingCONSTS?: number,
	): LuaTuple<[number, number]> {
		const Stiffness = this.GetSpringStiffness(Mass, TotalWheels, Gravity, DesiredSuspensionHeight);
		return $tuple(Stiffness, this.GetSpringDamping(Mass, Stiffness, TotalWheels, DampingCONSTS));
	}

	public SetWheelSize(Wheel: string | VehicleChassisRigWheel, Size: Vector3 | Model | BasePart) {
		let WheelRig: VehicleChassisRigWheel | undefined;
		if (typeIs(Wheel, "string")) {
			if (this._VehicleModelInfo.Wheels) {
				for (const [_, wheel] of pairs(this._VehicleModelInfo.Wheels)) { //eslint-disable-line
					if (wheel.Wheel.Name === Wheel) {
						WheelRig = wheel;
						break;
					}
				}
			}
		} else {
			WheelRig = Wheel;
		}
		if (!WheelRig) {
			throw `Expected VehicleChassisRigWheel Pseudo, got ${Wheel} when trying to SetWheelSize.`;
		}
		if (typeIs(Size, "Vector3")) {
			WheelRig.Size = Size;
			return;
		}
		WheelRig.Size = Size.IsA("Model") ? Size.GetExtentsSize() : Size.Size;
	}

	public SetAssemblyAnchored(Anchored: boolean, AssemblyInstances?: Instance[]) {
		const _setAnchored = (t: Instance[]) => {
			this._ForEachInstance(t, (x) => {
				if (x.IsA("BasePart")) {
					x.Anchored = Anchored;
				}
				_setAnchored(x.GetChildren());
			});
		};
		_setAnchored(AssemblyInstances ? AssemblyInstances : [this._VehicleModelInfo.Main.Parent as Instance]);
	}
	constructor(__VehicleModelInfo: VehicleModelInfo | RigFromModelCallback) {
		super("VehicleChassisRig");
		this.Name = this.ClassName;
		if (typeIs(__VehicleModelInfo, "function")) {
			this._VehicleModelInfo = __VehicleModelInfo(this);
		} else {
			this._VehicleModelInfo = __VehicleModelInfo;
		}
		this._dev.MainServant = new Servant();
		if (this._VehicleModelInfo.Main.FindFirstChild("VehicleChassisConfig")) {
			const ConfigTrackerServant = new Servant();
			this._dev.set("_ConfigTrackerServant", ConfigTrackerServant);
			const ApplyPropertyValue = (key: unknown, value: unknown, realm: "ValueBase" | "Attribute") => {
				try {
					this.useSetNewIndexAssignment(key, value);
				} catch (err) {
					throw `Configuration-${realm}: Could not apply property: "${key}" of value: ${value}. ERR0R: ${err}`;
				}
			};
			const VehicleChassisConfig = this._VehicleModelInfo.Main.VehicleChassisConfig!;
			VehicleChassisConfig.GetChildren().forEach((config) => {
				if (!config.IsA("ValueBase")) {
					throw "Only `ValueBase` Instances should be inside your `VehicleChassisConfig`.";
				}
				ApplyPropertyValue(config.Name, config.Value, "ValueBase");
				ConfigTrackerServant.Keep(
					config.Changed.Connect(() => {
						ApplyPropertyValue(config.Name, config.Value, "ValueBase");
					}),
				);
			});
			VehicleChassisConfig.GetAttributes().forEach((attr) => {
				ApplyPropertyValue(attr, VehicleChassisConfig.GetAttribute(attr as string), "Attribute");
				ConfigTrackerServant.Keep(
					VehicleChassisConfig.GetAttributeChangedSignal(attr as string).Connect(() => {
						ApplyPropertyValue(attr, VehicleChassisConfig.GetAttribute(attr as string), "Attribute");
					}),
				);
			});
		}

		if (this._VehicleModelInfo.Wheels) {
			this._VehicleModelInfo.Wheels.forEach((wheel) => {
				wheel._Main = this._VehicleModelInfo.Main;
			});
			this.usePropertyEffect(() => {
				this._VehicleModelInfo.Wheels!.forEach((wheel) => {
					wheel.Visible = this.WheelRigsVisible;
				});
			}, ["WheelRigsVisible"]);
		}

		if (this._VehicleModelInfo.WeldAssembly) {
			const VehicleWheelsModels = this._VehicleModelInfo.Wheels
				? this._VehicleModelInfo.Wheels.map((x) => x.Wheel)
				: undefined;

			// Weld wheels
			if (this._VehicleModelInfo.Wheels) {
				this._VehicleModelInfo.Wheels.forEach((wheel) => {
					this._WeldInstanceDescendants([wheel.Wheel], wheel.GetPrimaryPart());
					this.useMapping(
						[
							"SpringDamping",
							"SpringMinLength",
							"SpringMaxLength",
							"SpringFreeLength",
							"SpringMaxForce",
							"SpringStiffness",
							"SpringLimitsEnabled",
							"CylindricalLowerLimit",
							"CylindricalLimitsEnabled",
							"CylindricalUpperLimit",
						],
						[wheel],
					);
				});
			}

			this._WeldInstanceDescendants(
				this._VehicleModelInfo.WeldAssembly === true
					? [this._VehicleModelInfo.Main.Parent as Instance]
					: this._VehicleModelInfo.WeldAssembly,
				this._VehicleModelInfo.Main,
				VehicleWheelsModels,
			);
		}

		if (this._VehicleModelInfo.Wheels) {
			this.usePropertyRender(() => {
				const v = this.SteerFloat * this.MaxSteerAngle;
				this._VehicleModelInfo.Wheels!.forEach((wheel) => {
					wheel.SteerAngle = v;
				});
			}, ["SteerFloat", "MaxSteerAngle"]);

			this.usePropertyRender(() => {
				const WheelsWithMotors = this._VehicleModelInfo.Wheels!.mapFiltered((wheel) => {
					if (wheel.Motor) {
						return wheel;
					}
				});
				WheelsWithMotors.forEach((wheel) => {
					wheel.CylindricalAngularVelocity =
						(this.MaxSpeed / (wheel._dev.PhysicalWheel.Size.Z / 2)) * this.ThrottleFloat;
					wheel.CylindricalMaxTorque = (this.Torque * 1000) / WheelsWithMotors.size();
				});
			}, ["Torque", "ThrottleFloat", "MaxSpeed"]);

			this.usePropertyRender(() => {
				this._VehicleModelInfo.Wheels!.forEach((wheel) => {
					wheel.Attachment0OrientationSpeed = this.TurnSpeed;
				});
			}, ["TurnSpeed"]);
		}
		if (this._VehicleModelInfo.Massless) {
			this._InstanceMasslessDescendants(this._VehicleModelInfo.Massless, true);
		}
		/*
		if (this._VehicleModelInfo.UnAnchorAssembly) {
			const _unAnchor = (t: Instance[]) => {
				this._ForEachInstance(t, (x) => {
					if (x.IsA("BasePart")) {
						x.Anchored = false;
					}
					_unAnchor(x.GetChildren());
				});
			};
			_unAnchor(
				this._VehicleModelInfo.UnAnchorAssembly === true
					? [this._VehicleModelInfo.Main.Parent as Instance]
					: this._VehicleModelInfo.UnAnchorAssembly!,
			);
		}
		*/
		this.useReferenceInstanceBehaviour();
	}
}
