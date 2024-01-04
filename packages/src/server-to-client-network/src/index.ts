import { stcnetClient } from "./stcnet_client";
import { stcnetServer } from "./stcnet_server";

const IsClient = game.GetService("RunService").IsClient();

const stcnet_client_core: stcnetClient = IsClient ? new stcnetClient("stcnet-client-core") : undefined!;
const stcnet_server_core: stcnetServer = !IsClient ? new stcnetServer("stcnet-server-core") : undefined!;

export const stcnet = {
	client: stcnetClient,
	server: stcnetServer,
	core: {
		client: stcnet_client_core,
		server: stcnet_server_core,
	},
};
// export * from "./stcnet_server";
// export * from "./stcnet_client";

// let stcnetcore: stcnetclient | stcnetServer;

// if (IsClient) {
// 	stcnetcore = new stcnetServer("$stcnet-server-core");
// } else {
// 	stcnetcore = new stcnetclient("#stcnet-client-core");
// }

// export { stcnetServer, stcnetServer as stcnet, stcnetclient, stcnetcore };
