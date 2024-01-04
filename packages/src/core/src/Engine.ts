//Engine
const ServerScriptServices = game.GetService("ServerScriptService");
const ReplicatedStorage = game.GetService("ReplicatedStorage");
const ServerStorage = game.GetService("ServerStorage");
const Workspace = game.GetService("Workspace");
const RunService = game.GetService("RunService");

export const Engine = {
	/**
	 * Initializes the server
	 */
	InitServer: () => {
		if (game.GetService("RunService").IsClient() && game.GetService("RunService").IsRunning()) {
			warn("Server cannot be initiated from the client.");
			return;
		}

		if (ServerStorage.FindFirstChild("PHe_SS") === undefined) {
			const SSStorage = new Instance("Folder");
			SSStorage.Name = "PHe_SS";
			SSStorage.Parent = ServerStorage;
		}

		if (Workspace.FindFirstChild("PHe_WS") === undefined) {
			const WSStorage = new Instance("Folder");
			WSStorage.Name = "PHe_WS";
			WSStorage.Parent = Workspace;
		}

		if (ServerScriptServices.FindFirstChild("PHe_Server") === undefined) {
			const ServerScripts = new Instance("Folder");
			ServerScripts.Name = "PHe_Server";
			ServerScripts.Parent = ServerScriptServices;
		}

		if (ReplicatedStorage.FindFirstChild("PHe_RS") === undefined) {
			const RSStorage = new Instance("Folder");
			RSStorage.Name = "PHe_RS";
			RSStorage.Parent = ReplicatedStorage;
		}
	},
	FetchReplicatedStorage: () => {
		return ReplicatedStorage.WaitForChild("PHe_RS");
	},
	FetchWorkspaceStorage: () => {
		return Workspace.WaitForChild("PHe_WS");
	},
	FetchServerStorage: () => {
		return ServerStorage.WaitForChild("PHe_SS");
	},
	FetchServerScripts: () => {
		return ServerScriptServices.WaitForChild("PHe_Server");
	},
};
//start engine
if (RunService.IsServer()) {
	Engine.InitServer();
}
