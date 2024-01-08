/* eslint-disable roblox-ts/no-private-identifier */

import { GetPseudoById, GetPseudoFromObject, Pseudo, Servant } from "@mekstuff-rbxts/core";

class Test extends Pseudo {
	Angle0 = 0;
	Angle1 = 0;
	constructor() {
		super("Test");
		this.Parent = game.Workspace;
		this.usePropertyEffect(() => {
			print("Angle0 || Angle1 Update: ", this.Angle0, this.Angle1);
		}, ["Angle0", "Angle1"]);
		this.usePropertyEffect(() => {
			print("Angle0 Update: ", this.Angle0, this.Angle1);
		}, ["Angle0"]);
		this.usePropertyEffect(() => {
			print("Angle1 Update: ", this.Angle1, this.Angle1);
		}, ["Angle1"]);
		this.useReferenceInstanceBehaviour();
	}
}

const v = new Test();
// while (true) {
// 	task.wait(0.4);
// }
// v.Destroy();
