/* eslint-disable roblox-ts/no-private-identifier */
// TODO: Add validation support and primitive to remote functions
import { stcnet } from "@mekstuff-rbxts/stcnet";

declare global {
	interface stcnetServices {
		TestService: TestService;
	}
}

class TestService extends stcnet.server {
	client = {
		remoteEvent: this.$remote(
			this.$p.string(),
			this.$p.optional(
				this.$p.number({
					error: false,
					max: 120,
				}),
			),
		),
	};
	constructor() {
		super("TestService");
		this.client.remoteEvent.OnServerEvent.Connect((Player, message, v) => {
			print("received", message, v);
		});
		game.GetService("Players").PlayerAdded.Connect((player) => {
			this.client.remoteEvent.FireClient(player, "welcome", undefined);
		});
	}
}

export default new TestService();
