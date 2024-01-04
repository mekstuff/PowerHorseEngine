import { Pseudo } from "@mekstuff-rbxts/core";
import { GetVector3Value, GetVector3ValueInputTypes } from "@mekstuff-rbxts/value-resolver";
const Player = game.GetService("Players").LocalPlayer;
const RunService = game.GetService("RunService");

const useStepped = Player !== undefined ? RunService.RenderStepped : RunService.Stepped;

function GetCharacterOfPlayer(Player: Player | undefined): Instance | undefined {
	if (Player === undefined) {
		return;
	}
	const Char = Player.Character ?? Player.CharacterAdded.Wait()[0];
	return Char.WaitForChild("HumanoidRootPart");
}

export class ProximityReader extends Pseudo {
	/**
	 * The `source` of the proximity reader
	 */
	Source: GetVector3ValueInputTypes | undefined = GetCharacterOfPlayer(Player);
	/**
	 * The `target` of the proximity reader
	 */
	Target: GetVector3ValueInputTypes | undefined = undefined;
	/**
	 * Target magnitude that changes the status
	 */
	Magnitude = 30;
	/**
	 * Current magnitude between `Source` and `Target`.
	 */
	CurrentMagnitude = -1;
	/**
	 * Disconnects and connects the render step. While `Enabled` is `false`, `Status` will also always be `false`.
	 */
	Enabled = true;
	/**
	 * Current status of the reader, `false` if outside of given `Magnitude`, `true` if within given `Magnitude`.
	 */
	Status = false;

	/**
	 * Runs a `usePropertyEffect` on the `Status`.
	 */
	useStatus(cb: Callback) {
		return this.usePropertyEffect(cb, ["Status"]);
	}
	/**
	 * Runs a `usePropertyEffect` on the `CurrentMagnitude`.
	 */
	useCurrentMagnitude(cb: Callback) {
		return this.usePropertyEffect(cb, ["CurrentMagnitude"]);
	}
	constructor() {
		super("ProximityReader");
		this.useReferenceInstanceBehaviour();
		this.usePropertyEffect(() => {
			if (this.Enabled === true) {
				const Connection = useStepped.Connect(() => {
					if (this.Source === undefined || this.Target === undefined) {
						this.Status = false;
						return;
					}
					const diff = GetVector3Value(this.Source).sub(GetVector3Value(this.Target)).Magnitude;
					this.CurrentMagnitude = diff;
					if (diff > this.Magnitude) {
						this.Status = false;
					} else {
						this.Status = true;
					}
				});
				this._dev.set("ProximityReader-main-connection", Connection);
				return () => {
					Connection.Disconnect();
					this._dev.set("ProximityReader-main-connection", undefined);
					this.Status = false;
					this.CurrentMagnitude = -1;
				};
			}
		}, ["Enabled"]);
	}
}
