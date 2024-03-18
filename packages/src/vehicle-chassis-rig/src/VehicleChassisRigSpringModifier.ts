/* eslint-disable roblox-ts/no-private-identifier */

import { Pseudo, Servant } from "@mekstuff-rbxts/core";
import VehicleChassisRig from "./VehicleChassisRig";

export default class VehicleChassisRigSpringModifier extends Pseudo {
	public Enabled = true;
	/**
	 * Setting this value to anything other than `0` will automatically update the `DesiredRideHeight`
	 * whenever the `SpringFreeLength` of the `VehicleChassisRig` changes. The `DesiredRideHeight` will be `SpringFreeLength - SpringFreeLengthOffset`
	 */
	public SpringFreeLengthOffset = 0;
	public readonly Mass = 0;

	public update() {
		if (!this.Rig) {
			return warn(`Cannot call ${this.ClassName}.update without a Rig`);
		}
		const [SpringStiffness, SpringDamping] = this.Rig.GetSpringValues(
			this.Mass,
			this.TotalWheels,
			this.Gravity,
			this.DesiredRideHeight,
			this.DampingCoefficient,
		);
		this.Rig.SpringStiffness = SpringStiffness;
		this.Rig.SpringDamping = SpringDamping;
	}
	constructor(
		public Rig: VehicleChassisRig | undefined = undefined,
		public DesiredRideHeight: number = 1.6,
		public DampingCoefficient: number = 0.9,
		public Gravity: number = game.Workspace.Gravity,
		public TotalWheels: number = 4,
	) {
		super("VehicleChassisRigSpringModifier");
		this.Name = this.ClassName;
		this.usePropertyEffect(() => {
			if (this.Enabled) {
				const enabledServant = new Servant();

				enabledServant.Keep(
					this.usePropertyRender(() => {
						this.update();
					}, ["DesiredRideHeight", "DampingCoefficient", "Gravity", "TotalWheels"]),
				);

				enabledServant.Keep(
					this.usePropertyEffectWrap(() => {
						if (this.Rig) {
							game.GetService("RunService").Heartbeat.Wait();
							const RigMain = this.Rig.GetMain();
							if (!RigMain.Parent) {
								throw "Rig.GetMain() is not Parented!";
							}
							const [rigServant] = enabledServant.Keep(new Servant());
							const setMass = () => {
								if (RigMain.AssemblyMass === math.huge) {
									warn(
										`${this.ClassName} - AssemblyMass got "inf", Mass will be 0, Assembly may have been anchored.`,
									);
									this.useAssignReadonlyProperty("Mass", 0);
									return;
								}
								this.useAssignReadonlyProperty("Mass", RigMain.AssemblyMass);
							};

							setMass();
							rigServant.Keep(
								RigMain.GetPropertyChangedSignal("AssemblyMass").Connect(() => {
									setMass();
								}),
							);

							rigServant.Keep(
								this.usePropertyEffect(() => {
									if (this.SpringFreeLengthOffset !== 0) {
										if (!this.Rig) {
											return;
										}
										const [SpringFreeLengthUE] = rigServant.Keep(
											this.Rig.usePropertyEffect(() => {
												if (!this.Rig) {
													return;
												}
												this.DesiredRideHeight =
													this.Rig.SpringFreeLength - this.SpringFreeLengthOffset;
											}, ["SpringFreeLength"]),
										);
										return () => {
											SpringFreeLengthUE.Destroy();
										};
									}
								}, ["SpringFreeLengthOffset"]),
							);

							return () => {
								rigServant.Destroy();
							};
						}
					}, ["Rig"]),
				);

				enabledServant.Keep(
					this.usePropertyEffect(() => {
						this.update();
					}, ["Mass"]),
				);

				return () => {
					enabledServant.Destroy();
				};
			}
		}, ["Enabled"]);
		this.useReferenceInstanceBehaviour();
	}
}
