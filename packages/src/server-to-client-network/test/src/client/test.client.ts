import { stcnet } from "@mekstuff-rbxts/stcnet";

declare global {
	interface stcnetControllers {
		TestController: TestController;
	}
}
class TestController extends stcnet.client {
	constructor() {
		super("TestController");
		const TestService = this.AwaitService("TestService");
		TestService.remoteEvent.OnClientEvent.Connect((message) => {
			print("Received: ", message);
			TestService.remoteEvent.FireServer("s", 500);
		});
	}
}

export default new TestController();
