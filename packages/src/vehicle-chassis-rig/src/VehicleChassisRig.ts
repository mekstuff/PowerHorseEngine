/* eslint-disable roblox-ts/no-private-identifier */

import { Pseudo, Servant } from "@mekstuff-rbxts/core";
import { _typeIs } from "@mekstuff-rbxts/core/out/typeIs";
import { Serializer } from "@mekstuff-rbxts/serializer";
import { PseudoPID } from "@mekstuff-rbxts/pseudo-pid";
import VehicleChassisRigWheel from "./VehicleChassisRigWheel";
import CONSTS from "./CONSTANTS";

const VehicleChassisRigClientProxy = script.Parent!.FindFirstChild("VehicleChassisRigClientProxy") as LocalScript;
const VehicleChassisRigClientProxy_LuaRuntimeEnv = script.Parent!.FindFirstChild(
	"VehicleChassisRigClientProxyLuaRuntime",
) as LocalScript;

let NOESerializer: Serializer | undefined;

export type VehicleChassisRigClientProxy_vEncode = {
	rig: Folder;
	steer: {
		Attachment0: Attachment;
		SteerInversed: boolean;
	}[];
	wheels: BasePart[];
	main: BasePart;
	wheelZSize: number;
	vehicleSeat: VehicleSeat;
};

export type VehicleChassisTypes = "Car" | "Bike";

export type VehicleModelInfo = {
	/**
	 * The `Main` is the central part of the Model.
	 *
	 * If the `RootPriority` of Main is 0, it will automatically be changed to `99`.
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
	/**
	 * List of items that will be unanchored when the rig is ready.
	 */
	UnAnchorAssembly?: Instance[] | boolean;
	/**
	 * List of items that will become `Massless`.
	 */
	Massless?: Instance[];
	/**
	 * The `HitBox` is a non massed BasePart that will be used as the hitbox of the car. Defaults to the assembly size.
	 */
	Hitbox?: BasePart;
	Wheels?: VehicleChassisRigWheel[];
};

type RigFromModelCallback = (ChassisRig: VehicleChassisRig) => VehicleModelInfo;

export type AutoRigVehicleModel = {
	Main: BasePart;
	Body: Folder | Model;
	Wheels: Folder | Model;
} & Model;
/**
 * The Naming convensions for Wheels should be `FL...`, Only the first two capital letters matter.
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
		WheelsPhysicalProperties?: PhysicalProperties;
		/**
		 * Defaults to `true`
		 */
		WeldAssembly?: VehicleModelInfo["WeldAssembly"];
		/**
		 * Defaults to `undefined`
		 */
		UnAnchorAssembly?: VehicleModelInfo["UnAnchorAssembly"];
		/**
		 * Defaults to `VehicleModel.Main`
		 */
		Main?: Part;
	},
): RigFromModelCallback {
	return (ChassRig) => {
		return {
			Main: Options?.Main ?? VehicleModel.Main,
			WeldAssembly: Options?.WeldAssembly ?? true,
			UnAnchorAssembly: Options?.UnAnchorAssembly ?? undefined,
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
				if (Options?.WheelsPhysicalProperties !== undefined) {
					RigWheel.PhysicalProperties = Options.WheelsPhysicalProperties;
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

	public ReverseMaxSpeed: number | undefined = CONSTS.VehicleDefaults.ReverseMaxSpeed;
	public ReverseTorque: number | undefined = CONSTS.VehicleDefaults.ReverseTorque;

	public MaxSteerAngle = CONSTS.VehicleDefaults.MaxSteerAngle;
	/**
	 * `MaxSteeringAngle - [MaxSteerAngleDecay] * [CurrentVelocity]
	 *
	 * ** This only works when the a client has control over the chassis! SteeringDecay does not occur on a server controlled chassis **
	 */
	public MaxSteerAngleDecay = CONSTS.VehicleDefaults.MaxSteerAngleDecay;
	public SteerFloat = CONSTS.VehicleDefaults.SteerFloat;
	public Torque = CONSTS.VehicleDefaults.Torque;
	public ThrottleFloat = CONSTS.VehicleDefaults.ThrottleFloat;
	public MaxSpeed = CONSTS.VehicleDefaults.MaxSpeed;
	public TurnSpeed = CONSTS.VehicleDefaults.TurnSpeed;
	public Spring = CONSTS.VehicleDefaults.Spring;
	public SpringDamping = CONSTS.VehicleDefaults.SpringDamping;
	public SpringMinLength = CONSTS.VehicleDefaults.SpringMinLength;
	public SpringMaxLength = CONSTS.VehicleDefaults.SpringMaxLength;
	public SpringFreeLength = CONSTS.VehicleDefaults.SpringFreeLength;
	public SpringMaxForce = CONSTS.VehicleDefaults.SpringMaxForce;
	public SpringStiffness = CONSTS.VehicleDefaults.SpringStiffness;
	public SpringLimitsEnabled = CONSTS.VehicleDefaults.SpringLimitsEnabled;
	public CylindricalLimitsEnabled = CONSTS.VehicleDefaults.CylindricalLimitsEnabled;
	public CylindricalLowerLimit = CONSTS.VehicleDefaults.CylindricalLowerLimit;
	public CylindricalUpperLimit = CONSTS.VehicleDefaults.CylindricalUpperLimit;
	public WheelRigsVisible = CONSTS.VehicleDefaults.WheelsVisible;
	public WheelRigsSpringsVisible = CONSTS.VehicleDefaults.WheelSpringsVisible;
	public WheelsRigsShape: Enum.PartType = CONSTS.VehicleDefaults.WheelShape;

	public ChassisType: VehicleChassisTypes = "Car";
	/**
	 * Having mass set to a number will create parts needed with the density welded to the `Main` of the vehicle.
	 * Since the density of a `Part` is limited to `100`, If you were to need a `Mass` of `300`, `3` 100 dense parts
	 * will be created.
	 */
	public Mass = CONSTS.VehicleDefaults.Mass;
	public MassRelativity: "Main" | "Assembly" = CONSTS.VehicleDefaults.MassRelativity as "Assembly";
	public MassRelativeOffset = CONSTS.VehicleDefaults.MassRelativeOffset;
	public ShowMassInstances = CONSTS.VehicleDefaults.ShowMassInstances;

	public BikeOrientationMaxTorque = CONSTS.VehicleDefaults.BikeOrientationMaxTorque;
	public BikeOrientationResponsiveness = CONSTS.VehicleDefaults.BikeOrientationResponsiveness;
	public BikeXAxisRotation = CONSTS.VehicleDefaults.BikeXAxisRotation;
	public BikeYAxisRotation = CONSTS.VehicleDefaults.BikeYAxisRotation;
	public BikeZAxisRotation = CONSTS.VehicleDefaults.BikeZAxisRotation;
	public AutoBikeZAxisRotation = CONSTS.VehicleDefaults.AutoBikeZAxisRotation;
	public AutoBikeZAxisRotationAngle = CONSTS.VehicleDefaults.AutoBikeZAxisRotationAngle;

	private _networkOwnerActive: Servant | undefined = undefined;

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

	public GetMain(): BasePart {
		return this._VehicleModelInfo.Main;
	}

	private _networkOwnershipRuntimeEnvironment: "native" | "rbxts" = "rbxts";
	/**
	 * Setting what "Environment" runtime should the `VehicleChassisRigClientProxy` use, If you're using a
	 * roblox-ts compiled game, You do not need to worry about setting this. However if you're using this package
	 * inside a native ROBLOX project, you will need to use the native runtime environment. You should set it before you
	 * ever call `SetNetworkOwnership` with a client argument.
	 */
	public SetNetworkOwnershipRuntimeEnvironment(environment: "native" | "rbxts") {
		this._networkOwnershipRuntimeEnvironment = environment;
	}
	/**
	 * This will set the Network Ownership of `Main` and is also responsible for creating a `VehicleChassisRigClientProxy` on the client
	 * that is binded to this VehicleChassisRig, and physics will instead be handled by the client instead of the server.
	 *
	 * Changing the following properties will update on the client: `Torque`,`ReverseTorque`,`MaxSpeed`,`ReverseMaxSpeed`,`MaxSteerAngle`,`TurnSpeed`.
	 *
	 * The `ThrottleFloat` and `SteerFloat` are obtained by the `vehicleSeat`.
	 */
	public SetNetworkOwnership(): void;
	public SetNetworkOwnership(client: Player, VehicleSeat: VehicleSeat): void;
	public SetNetworkOwnership(client?: Player | undefined, vehicleSeat?: VehicleSeat): void {
		assert(
			!game.GetService("RunService").IsClient(),
			`${this.ClassName}.SetNetworkOwnership cannot be called from the client.`,
		);
		let parentInstance: Instance | undefined;
		if (_typeIs(this.Parent, "Pseudo")) {
			parentInstance = this.Parent.GetRef();
		} else {
			parentInstance = this.Parent;
		}
		this._VehicleModelInfo.Main.SetNetworkOwner(client);
		if (this._networkOwnerActive) {
			this._networkOwnerActive.Destroy();
			this._networkOwnerActive = undefined;
		}
		if (typeIs(client, "Instance") && client.IsA("Player")) {
			assert(
				parentInstance,
				`You can only call "${this.ClassName}.SetNetworkOwnership" with client defined when the rig is Parented.`,
			);
			assert(
				parentInstance.IsDescendantOf(game.Workspace),
				`You can only call "${this.ClassName}.SetNetworkOwnership" with client defined if the Rig is a descendant of workspace.`,
			);
			NOESerializer = NOESerializer ?? new Serializer(this.ClassName + "NetworkOwnership");
			this._networkOwnerActive = new Servant();
			const VCRCPC =
				this._networkOwnershipRuntimeEnvironment === "native"
					? VehicleChassisRigClientProxy_LuaRuntimeEnv.Clone()
					: VehicleChassisRigClientProxy.Clone();
			this._networkOwnerActive.useDestroying(() => {
				VCRCPC.Name = "__"; // change name to trigger destroy on client
				task.wait(0.4);
				VCRCPC.Destroy();
			}, true);
			const _v = new Instance("StringValue");
			_v.Name = "_v";
			const _upd = new Instance("StringValue");
			_upd.Name = "_upd";
			const _updValues = [
				"Torque",
				"ReverseTorque",
				"MaxSpeed",
				"ReverseMaxSpeed",
				"MaxSteerAngle",
				"MaxSteerAngleDecay",
				"TurnSpeed",
				"ChassisType",
				"BikeOrientationMaxTorque",
				"BikeOrientationResponsiveness",
				"BikeXAxisRotation",
				"BikeYAxisRotation",
				"BikeZAxisRotation",
				"AutoBikeZAxisRotation",
				"AutoBikeZAxisRotationAngle",
			];
			const _updRecord: Record<string, unknown> = {};
			this._networkOwnerActive.Keep(
				this.usePropertyEffect(() => {
					_updValues.forEach((key) => {
						const v = (this as Record<string, unknown>)[key];
						_updRecord[key] = v;
					});
					_upd.Value = NOESerializer!.Encode(_updRecord);
				}, _updValues),
			);
			const wheels = this.GetWheels();
			const wheelZSize = wheels[0] ? wheels[0]._dev.PhysicalWheel.Size.Z : 1;
			assert(
				typeIs(vehicleSeat, "Instance") && vehicleSeat.IsA("VehicleSeat"),
				`VehicleSeat expected, got ${typeOf(vehicleSeat)}`,
			);
			const _vToEncode: VehicleChassisRigClientProxy_vEncode = {
				rig: this.GetRef(),
				steer: wheels
					.map((x) =>
						x.Steerable
							? {
									Attachment0: this._VehicleModelInfo.Main.FindFirstChild(
										"Attachment0_" + x._dev.PhysicalWheel.Name,
									) as Attachment,
									SteerInversed: x.SteerInversed,
							  }
							: undefined!,
					)
					.filterUndefined(),
				wheels: wheels.map((x) => x._dev.PhysicalWheel),
				wheelZSize: wheelZSize,
				main: this._VehicleModelInfo.Main,
				vehicleSeat: vehicleSeat,
			};
			_v.Value = NOESerializer.Encode(_vToEncode);
			_upd.Parent = VCRCPC;
			_v.Parent = VCRCPC;
			this._networkOwnerActive.Keep(() => {
				VCRCPC.Parent = client.WaitForChild("PlayerGui");
			});
		}
	}

	/**
	 * Uses the values from the DrvieSeat like the `SteerFloat`, `ThrottleFloat` `Torque`, `MaxSpeed`, `TurnSpeed`.
	 *
	 * @param CustomProperties Determine what properties to use instead of the default `SteerFloat`, `ThrottleFloat` `Torque`, `MaxSpeed`, `TurnSpeed`.
	 */
	public BindToVehicleSeat(VehicleSeat: VehicleSeat, CustomProperties?: (keyof VehicleSeat)[]): Servant {
		assert(
			typeIs(VehicleSeat, "Instance") && VehicleSeat.IsA("VehicleSeat"),
			`VehicleSeat expected when calling "BindToVehicleSeat", got ${typeOf(VehicleSeat)} instead.`,
		);
		const _C = CustomProperties ?? ["SteerFloat", "Torque", "MaxSpeed", "ThrottleFloat", "TurnSpeed"];
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

	/**
	 * Useful for making character `Massless` when inside the vehicle, then back to default when they leave.
	 */
	public SetCharacterMassless(Character: Model, Massless: boolean) {
		this._InstanceMasslessDescendants([Character], Massless);
	}

	/**
	 * This is to get the TotalMass of the assembly, not to be mistaken with the `Mass` property.
	 *
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
		// return ((Mass / TotalWheels) * Gravity) / 1;
		return ((Mass * Gravity) / DesiredSuspensionHeight) * TotalWheels;
	}
	public GetSpringDamping(Mass: number, Stiffness: number, TotalWheels: number, DampingCONSTS?: number): number {
		// return ((DampingCONSTS ?? 0.3) * 2 * ((Stiffness * Mass) / TotalWheels)) ^ 0.5;
		return (2 * math.sqrt(Mass * Stiffness) * (DampingCONSTS ?? 0.4)) / TotalWheels;
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

	public GetWheels(): VehicleChassisRigWheel[] {
		return this._VehicleModelInfo.Wheels ?? [];
	}

	public SetWheelsSize(Size: Vector3 | Model | BasePart) {
		this.GetWheels().forEach((wheel) => {
			this.SetWheelSize(wheel, Size);
		});
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

	/**
	 * `SetAssemblyDensity(0)` may be a better option that making everything massless.
	 * This will make every `BasePart` of the assembly massless except for the `Main` and anything within the VehicleChassisRig `Ref`, e.g. Physical Wheels and custom masses from the `Mass` property.
	 *
	 * It is recommended that the `Main` have some sort of mass for physics, You can set the `Density` of the `Main` to 0.01.
	 */
	public SetAssemblyMassless(Massless: boolean) {
		this._InstanceMasslessDescendants(this._VehicleModelInfo.Main.Parent!.GetChildren(), Massless, [
			this._VehicleModelInfo.Main,
			this.GetRef(),
		]);
	}

	/**
	 * @param Assembly Defaults to the children of the `Parent` of `Main`
	 * @param Ignore Defaults to `[Main, VehicleChassisRig.GetRef()]`
	 */
	public SetAssemblyDensity(Density: number, Assembly?: Instance[], Ignore?: Instance[]) {
		Assembly = Assembly ?? this._VehicleModelInfo.Main.Parent?.GetChildren();
		Ignore = Ignore ?? [this._VehicleModelInfo.Main, this.GetRef()];
		if (!Assembly) {
			return;
		}
		this._ForEachInstance(
			Assembly,
			(x) => {
				if (x.IsA("BasePart")) {
					x.CustomPhysicalProperties = new PhysicalProperties(
						Density,
						x.CurrentPhysicalProperties.Friction,
						x.CurrentPhysicalProperties.Elasticity,
						x.CurrentPhysicalProperties.FrictionWeight,
						x.CurrentPhysicalProperties.ElasticityWeight,
					);
				}
				this.SetAssemblyDensity(Density, x.GetChildren(), Ignore);
			},
			Ignore,
		);
	}

	constructor(__VehicleModelInfo: VehicleModelInfo | RigFromModelCallback) {
		super("VehicleChassisRig");

		this.useDestroying(() => {
			if (this._networkOwnerActive) {
				// If we destroy self, remove the active network owner servant which will remove it from the client aswell.
				this._networkOwnerActive.Destroy();
			}
		});

		this.Name = this.ClassName;
		this.usePropertyRelationBinding(
			["CylindricalLowerLimit", "CylindricalUpperLimit"],
			"CylindricalLimitsEnabled",
			true,
		);
		this.usePropertyRelationBinding(
			[
				"SpringDamping",
				"SpringMinLength",
				"SpringMaxLength",
				"SpringFreeLength",
				"SpringMaxForce",
				"SpringStiffness",
				"SpringLimitsEnabled",
			],
			"Spring",
			true,
		);
		if (typeIs(__VehicleModelInfo, "function")) {
			this._VehicleModelInfo = __VehicleModelInfo(this);
		} else {
			this._VehicleModelInfo = __VehicleModelInfo;
		}
		if (this._VehicleModelInfo.Main.RootPriority === 0) {
			this._VehicleModelInfo.Main.RootPriority = 99;
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

		this.usePropertyRender(() => {
			this.GetWheels().forEach((wheel) => {
				wheel.Shape = this.WheelsRigsShape;
			});
		}, ["WheelsRigsShape"]);

		// ChassisType.bike
		this.usePropertyRelationBinding(
			[
				"BikeOrientationMaxTorque",
				"BikeOrientationResponsiveness",
				"BikeXAxisRotation",
				"BikeYAxisRotation",
				"BikeZAxisRotation",
				"AutoBikeZAxisRotation",
				"AutoBikeZAxisRotationAngle",
			],
			"ChassisType",
			"Bike",
		);
		this.usePropertyEffect(() => {
			if (this.ChassisType === "Bike") {
				const BikeServant = new Servant();
				const BikeOrientationConstraint = BikeServant.Keep(new Instance("AlignOrientation"))[0];
				const BikeOrientationConstraintAttachment0 = BikeServant.Keep(new Instance("Attachment"))[0];
				BikeOrientationConstraint.Name = "BikeOrientationConstraint";
				BikeOrientationConstraint.Attachment0 = BikeOrientationConstraintAttachment0;
				BikeOrientationConstraint.AlignType = Enum.AlignType.AllAxes;
				BikeOrientationConstraint.Mode = Enum.OrientationAlignmentMode.OneAttachment;
				BikeOrientationConstraint.Parent = this.GetMain();
				BikeOrientationConstraintAttachment0.Name = "BikeOrientationConstraintAttachment0";
				BikeOrientationConstraintAttachment0.Parent = this.GetMain();

				BikeServant.Keep(
					this.usePropertyEffect(() => {
						if (this._networkOwnerActive === undefined) {
							const c = game.GetService("RunService").Heartbeat.Connect(() => {
								BikeOrientationConstraint.PrimaryAxis = Vector3.xAxis.add(
									this.GetMain()
										.CFrame.LookVector.Cross(Vector3.xAxis)
										.mul(this.SteerFloat * 1),
								).Unit;
							});
							return () => {
								c.Disconnect();
							};
						}
					}, ["_networkOwnerActive"]),
				);

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
					this.usePropertyEffect(() => {
						if (this.AutoBikeZAxisRotation) {
							return this.usePropertyEffect(() => {
								// this.BikeZAxisRotation = -this.SteerFloat * this.AutoBikeZAxisRotationAngle;
							}, ["SteerFloat", "AutoBikeZAxisRotationAngle"]);
						}
					}, ["AutoBikeZAxisRotation"]),
				);

				return () => {
					BikeServant.Destroy();
				};
			}
		}, ["ChassisType"]);

		// Custom mass
		const MAX_MASS_DENSITY = 100;
		this.usePropertyEffect(() => {
			if (this.Mass !== 0) {
				const [MassContainer] = this._dev.MainServant.Keep(new Instance("Folder"));
				MassContainer.Name = `${tostring(this)}->CustomMassContainer`;
				const TotalParts = math.ceil(this.Mass / MAX_MASS_DENSITY);
				const Masses: { bp: BasePart; wc: WeldConstraint }[] = [];
				for (let i = 0; i < TotalParts; i++) {
					const Density =
						i === TotalParts - 1 ? MAX_MASS_DENSITY * (this.Mass / MAX_MASS_DENSITY - i) : MAX_MASS_DENSITY;
					const _Mass = new Instance("Part");
					_Mass.Name = `Mass+${tostring(math.floor(Density))}-${i}`;
					_Mass.CanCollide = false;
					_Mass.CanQuery = false;
					_Mass.CanTouch = false;
					// _Mass.CFrame = this._VehicleModelInfo.Main.CFrame;
					_Mass.Size = new Vector3(1, 1, 1);
					_Mass.Transparency = this.ShowMassInstances ? 0.5 : 1;
					_Mass.Material = Enum.Material.SmoothPlastic;
					_Mass.CustomPhysicalProperties = new PhysicalProperties(Density, 0, 0, 0, 0);
					const MassWeld = new Instance("WeldConstraint");
					MassWeld.Part0 = this._VehicleModelInfo.Main;
					MassWeld.Part1 = _Mass;
					MassWeld.Parent = _Mass;
					Masses.push({ bp: _Mass, wc: MassWeld });
					_Mass.Parent = MassContainer;
				}
				const ue = this.usePropertyEffect(() => {
					Masses.forEach((mass) => {
						let cf: CFrame;
						if (this.MassRelativity === "Assembly") {
							cf = (this._VehicleModelInfo.Main.Parent as Model).GetBoundingBox()[0];
						} else {
							cf = this._VehicleModelInfo.Main.CFrame;
						}
						mass.wc.Enabled = false;
						mass.bp.CFrame = cf.ToWorldSpace(new CFrame(this.MassRelativeOffset));
						mass.wc.Enabled = true;
					});
				}, ["MassRelativity", "MassRelativeOffset"]);
				const ueShowMass = this.usePropertyEffect(() => {
					if (this.ShowMassInstances === true) {
						Masses.forEach((mass) => {
							mass.bp.Transparency = 0.5;
						});
						return (isDestroying) => {
							if (isDestroying) {
								return;
							}
							Masses.forEach((mass) => {
								mass.bp.Transparency = 1;
							});
						};
					}
				}, ["ShowMassInstances"]);
				MassContainer.Parent = this.GetRef();
				return () => {
					ue.Destroy();
					ueShowMass.Destroy();
					MassContainer.Destroy();
				};
			}
		}, ["Mass"]);

		if (this._VehicleModelInfo.Wheels) {
			this._VehicleModelInfo.Wheels.forEach((wheel) => {
				wheel._Main = this._VehicleModelInfo.Main;
			});
			this.usePropertyEffect(() => {
				this._VehicleModelInfo.Wheels!.forEach((wheel) => {
					wheel.Visible = this.WheelRigsVisible;
				});
			}, ["WheelRigsVisible"]);
			this.usePropertyEffect(() => {
				this._VehicleModelInfo.Wheels!.forEach((wheel) => {
					wheel.SpringVisible = this.WheelRigsSpringsVisible;
				});
			}, ["WheelRigsSpringsVisible"]);
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
							"Spring",
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
			this.usePropertyEffect(() => {
				if (!this._networkOwnerActive) {
					const ue = this.usePropertyEffect(() => {
						const v = this.SteerFloat * this.MaxSteerAngle;
						this._VehicleModelInfo.Wheels!.forEach((wheel) => {
							wheel.SteerAngle = v;
						});
					}, ["SteerFloat", "MaxSteerAngle"]);
					return () => {
						ue.Destroy();
					};
				}
			}, ["_networkOwnerActive"]);

			this.usePropertyEffect(() => {
				if (!this._networkOwnerActive) {
					const ue = this.usePropertyEffect(() => {
						const WheelsWithMotors = this._VehicleModelInfo.Wheels!.mapFiltered((wheel) => {
							if (wheel.Motor) {
								return wheel;
							}
						});
						WheelsWithMotors.forEach((wheel) => {
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
							wheel.CylindricalAngularVelocity =
								(_targetMaxSpeed / (wheel._dev.PhysicalWheel.Size.Z / 2)) * this.ThrottleFloat;
							wheel.CylindricalMaxTorque = (_targetTorque * 1000) / WheelsWithMotors.size();
						});
					}, ["Torque", "ThrottleFloat", "MaxSpeed", "ReverseMaxSpeed", "ReverseTorque"]);
					return () => {
						ue.Destroy();
					};
				}
			}, ["_networkOwnerActive"]);

			this.usePropertyRender(() => {
				this._VehicleModelInfo.Wheels!.forEach((wheel) => {
					wheel.Attachment0OrientationSpeed = this.TurnSpeed;
				});
			}, ["TurnSpeed"]);
		}
		if (this._VehicleModelInfo.Massless) {
			this._InstanceMasslessDescendants(this._VehicleModelInfo.Massless, true);
		}

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

		this.useReferenceInstanceBehaviour();
	}
}
