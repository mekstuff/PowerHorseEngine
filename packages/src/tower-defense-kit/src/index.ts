/* eslint-disable roblox-ts/no-private-identifier */

declare global {
	namespace PHe {
		/** A list of pseudo classes*/
		interface Pseudos {
			TDKScene: TDKScene;
		}
		/**Classes that should be able to be created with `new` constructor*/
		interface CreateablePseudos {
			TDKScene: TDKScene;
		}
		/**
		 * Types that can be checked with custom _typeIs.
		 */
		interface CheckablePseudos {
			TDKScene: TDKScene;
		}
	}
}

declare global {
	interface ImitationServiceSchemas {
		TDKImitScenes: typeof TDKImitScenesSchema;
		TDKImitMasterTokenSchema: typeof TDKImitMasterTokenSchema;
		TDKImitMasterUnitTokenSchema: typeof TDKImitMasterUnitTokenSchema;
	}
}

import { Pseudo } from "@mekstuff-rbxts/core";
import { Region, RegionOption } from "@mekstuff-rbxts/region";
import { ImitToken, ImitationService, createSchema } from "@mekstuff-rbxts/imit";

import { BindToScenes } from "./client";
export { BindToScenes };

const RunService = game.GetService("RunService");
const Players = game.GetService("Players");
const IsServer = RunService.IsServer();

const TDKImitScenesSchema = createSchema((p) =>
	p.default(
		p.object({
			Test: p.array(p.string()),
		}),
		{
			Test: [],
		},
	),
);

const TDKImitMasterTokenSchema = createSchema((p) =>
	p.default(
		p.object({
			troopUnits: p.dict(p.either(p.string(), p.number()), p.unknown()),
		}),
		{
			troopUnits: {},
		},
	),
);
const TDKImitMasterUnitTokenSchema = createSchema((p) =>
	p.default(
		p.object({
			data: p.unknown(),
		}),
		{
			data: {},
		},
	),
);

type unitData = { [key: string | number]: unknown };

export class TDKScene extends Pseudo {
	public SceneTranmissionExclusion: Player[] | undefined = undefined;
	public UpdateAccuracy = 1;

	private _MasterTokenID: string;
	private _units: Record<string | number, ImitToken> = {};
	private _SceneMasterToken: ImitToken<typeof TDKImitMasterTokenSchema>;

	public AddUnit(UnitId: string | number, UnitData: unitData) {
		this._SceneMasterToken.Imitation.troopUnits[UnitId] = true;
		const existing = this._units[UnitId];
		if (existing) {
			(existing.Imitation as unitData).data = UnitData;
			existing.ImitateSync();
			return;
		}
		const n = ImitationService.newToken(`${this._MasterTokenID}/${UnitId}`, TDKImitMasterUnitTokenSchema);
		(n.Imitation as unitData).data = UnitData;
		this._units[UnitId] = n;
		n.ImitateSync();
		this._SceneMasterToken.ImitateSync();
	}

	public RemoveUnit(UnitId: string | number): boolean {
		if (this._units[UnitId]) {
			this._units[UnitId].Destroy();
		}
		if (this._SceneMasterToken.Imitation.troopUnits[UnitId] !== undefined) {
			delete this._SceneMasterToken.Imitation.troopUnits[UnitId];
			this._SceneMasterToken.ImitateSync();
			return true;
		}
		return false;
	}
	public UpdateUnit(UnitId: string | number, UnitData?: unitData) {
		if (!UnitData) {
			const existing = this._units[UnitId];
			if (existing) {
				return this.AddUnit(UnitId, existing.Imitation.data);
			}
			throw "No UnitData was passed when calling UpdateUnit but the UnitId didn't exist.";
		}
		return this.AddUnit(UnitId, UnitData);
	}
	constructor(ScenePart: Instance) {
		super("TDKScene");
		this.Name = this.ClassName;
		this._MasterTokenID = game.GetService("HttpService").GenerateGUID();
		this._SceneMasterToken = ImitationService.newToken(this._MasterTokenID, TDKImitMasterTokenSchema);
		assert(IsServer, `${this} can only be created on the server`);
		const _transmittingTo: Player[] = [];
		const _transmittingTokens: Record<number, ImitToken> = {};
		const rmvToken = (Player: Player) => {
			if (_transmittingTokens[Player.UserId]) {
				_transmittingTokens[Player.UserId].Destroy();
				delete _transmittingTokens[Player.UserId];
			}
		};
		Players.PlayerRemoving.Connect((player) => {
			_transmittingTo.remove(_transmittingTo.indexOf(player));
		});
		let _lastupdate = tick();
		RunService.Heartbeat.Connect(() => {
			if (tick() - _lastupdate < this.UpdateAccuracy) {
				return;
			}
			_lastupdate = tick();
			Players.GetPlayers().forEach((player) => {
				const indexOf = _transmittingTo.indexOf(player);
				if (this.SceneTranmissionExclusion) {
					if (indexOf !== -1) {
						_transmittingTo.remove(indexOf);
						rmvToken(player);
						return;
					}
				}
				const Char = player.Character;
				if (!Char) {
					return;
				}
				const Root = Char.FindFirstChild("HumanoidRootPart");
				if (!Root) {
					return;
				}
				const IsInScene = Region.IsInRegion(new RegionOption(Root, ScenePart));
				if (IsInScene && indexOf === -1) {
					_transmittingTo.push(player);
					_transmittingTokens[player.UserId] = ImitationService.newToken(
						`TDKImitScenes/${player.UserId}`,
						TDKImitScenesSchema,
						{
							scene: ScenePart,
							_MasterTokenID: this._MasterTokenID,
						},
					);
					return;
				}
				if (!IsInScene && indexOf !== -1) {
					_transmittingTo.remove(indexOf);
					rmvToken(player);
					return;
				}
			});
		});
		this.useReferenceInstanceBehaviour();
	}
}
