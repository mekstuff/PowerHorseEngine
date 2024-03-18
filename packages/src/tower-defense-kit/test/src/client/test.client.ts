/* eslint-disable roblox-ts/no-private-identifier */

import { Pseudo } from "@mekstuff-rbxts/core";
import { BindToScenes } from "@mekstuff-rbxts/tower-defense-kit";

class Unit extends Pseudo {
	public unitPosition: Vector3 = Vector3.zero;
	public unitName = "...";
	constructor() {
		super("Unit");

		const unit = new Instance("Part");
		unit.Anchored = true;
		unit.CanCollide = false;

		this.usePropertyEffect(() => {
			print(this.unitPosition);
			game.GetService("TweenService")
				.Create(unit, new TweenInfo(1), {
					Position: this.unitPosition,
				})
				.Play();
		}, ["unitPosition"]);
		this.usePropertyEffect(() => {
			unit.Name = this.unitName;
		}, ["unitName"]);

		unit.Parent = game.GetService("Workspace");
	}
}

const activesUnits: Record<string | number, Unit> = {};
BindToScenes((unitData, unitId, scene) => {
	const d = unitData as {
		unitPosition: Vector3;
		unitName: string;
	};
	const e = activesUnits[unitId];
	if (e) {
		e.unitPosition = d.unitPosition;
		e.unitName = d.unitName;
		print("unit updating ", unitId);
		return;
	}
	const unit = new Unit();
	unit.unitPosition = d.unitPosition;
	unit.unitName = d.unitName;
	activesUnits[unitId] = unit;
	print("unit created", unitData, scene);
});
