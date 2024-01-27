/* eslint-disable roblox-ts/no-private-identifier */

import { Pseudo } from "@mekstuff-rbxts/core";

class Test extends Pseudo {
	Property = 0;
	PropertyNested = true;
	constructor() {
		super("Test");
		const ue = this.usePropertyEffect(() => {
			if (this.Property !== 0) {
				print("Property updated: ", this.Property);
				// const c = this.usePropertyEffect(() => {
				// 	print("Property nested updated: ", this.PropertyNested);
				// 	return () => {
				// 		print("Property nested cleanup");
				// 	};
				// }, ["PropertyNested"]);
				ue.Destroy();
				return () => {
					print("Property cleanup");
					// c.Destroy();
				};
			}
		}, ["Property"]);
		this.GetRef().Parent = game.Workspace;
	}
}

new Test();
