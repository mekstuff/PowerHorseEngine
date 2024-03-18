/* eslint-disable roblox-ts/no-private-identifier */
import { Pseudo, Servant } from "@mekstuff-rbxts/core";

const workspace = game.GetService("Workspace");
const RunService = game.GetService("RunService");
const Players = game.GetService("Players");
const TeleportService = game.GetService("TeleportService");

type ShutdownAsyncSharedContent = string | number | boolean;

class SoftShutdownClass extends Pseudo<{
	_playerAddedEvent: BindableEvent;
}> {
	public IsShuttingDown(): boolean {
		return RunService.IsServer() ? this._shutdown : workspace.GetAttribute(this._key) !== undefined ? true : false;
	}
	/**
	 * Runs the soft shutdown lifecycle.
	 *
	 * @server
	 */
	public ShutdownAsync(
		content?: ShutdownAsyncSharedContent,
		teleportData?: { [key: string | symbol | number]: unknown },
		gracePeriod?: number,
	) {
		assert(RunService.IsServer(), "ShutdownAsync can only be called by the server!");
		if (this._shutdown) {
			return;
		}
		this._shutdown = true;
		workspace.SetAttribute(this._key, content ?? true);
		if (RunService.IsStudio()) {
			warn(`${this.ClassName} - cannot continue executing in studio`);
			return;
		}
		task.wait(gracePeriod ?? 4);
		const ServerPlayers = Players.GetPlayers();
		if (ServerPlayers.size() <= 0) {
			warn(`${this.ClassName} - no players to teleport`);
			return;
		}
		const tpOptions = new Instance("TeleportOptions");
		let _d = {
			[this._key]: content ?? true,
		} as typeof teleportData;
		if (teleportData) {
			assert(typeIs(teleportData, "table"), `${this.ClassName} - Teleport data must be of type table.`);
			_d = { _d, ...teleportData };
		}
		tpOptions.SetTeleportData(_d);
		const tryTp = () => {
			const [s, r] = pcall(() => {
				TeleportService.TeleportAsync(game.PlaceId, ServerPlayers, tpOptions);
			});
			if (!s) {
				warn(`soft-shutdown: Bulk teleport request err: ${r}`);
			}
		};
		tryTp();
		let totalRetries = 0;
		while (true) { // eslint-disable-line
			if (Players.GetPlayers().size() <= 0) {
				break;
			}
			if (totalRetries >= 6) {
				Players.GetPlayers().forEach((plr) => {
					warn(
						`soft-shutdown: Bulk teleport request err: Failed to teleport all players, will kick remaining.`,
					);
					plr.Kick("Please rejoin another server is this one is outdated.");
				});
				break;
			}
			totalRetries += 1;
			tryTp();
			task.wait(1);
		}
	}

	/***/
	public BindToEntry(callback: (Player: Player) => void): Servant {
		const BindServant = new Servant();
		const _handlePlayer = (Player: Player) => {
			if (RunService.IsClient() && Players.LocalPlayer !== Player) {
				return;
			}
			if (Player.GetAttribute(this._key) !== undefined) {
				callback(Player);
			}
		};
		Players.GetPlayers().forEach((plr) => {
			_handlePlayer(plr);
		});
		if (RunService.IsServer()) {
			BindServant.Keep(this._dev._playerAddedEvent.Event.Connect(_handlePlayer));
		}
		return BindServant;
	}
	/**
	 * The Servant is destroyed automatically once the callback is called.
	 */
	public BindToShutdown(callback: (content: ShutdownAsyncSharedContent) => void): Servant {
		const BindServant = new Servant();
		if (workspace.GetAttribute(this._key) !== undefined) {
			callback(workspace.GetAttribute(this._key) as ShutdownAsyncSharedContent);
			BindServant.Destroy();
		} else {
			BindServant.Keep(
				workspace.GetAttributeChangedSignal(this._key).Connect(() => {
					callback(workspace.GetAttribute(this._key) as ShutdownAsyncSharedContent);
					BindServant.Destroy();
				}),
			);
		}
		return BindServant;
	}

	private _shutdown = false;
	private _key = "mekstuff_rbxts_softshutdown";
	constructor() {
		super("SoftShutdown");
		if (RunService.IsServer()) {
			this._dev._playerAddedEvent = new Instance("BindableEvent");
			Players.PlayerAdded.Connect((Player) => {
				const tpData = Player.GetJoinData().TeleportData as { [key: string]: unknown } | undefined;
				if (tpData === undefined) {
					return;
				}
				if (tpData[this._key] !== undefined) {
					Player.SetAttribute(this._key, (tpData[this._key] as ShutdownAsyncSharedContent) ?? true);
					this._dev._playerAddedEvent.Fire(Player, tpData[this._key]);
				}
			});
		}
	}
}

const SoftShutdown = new SoftShutdownClass();
export { SoftShutdown };
export default SoftShutdown;
