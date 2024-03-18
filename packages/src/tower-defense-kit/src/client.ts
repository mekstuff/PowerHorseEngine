import { ImitationServiceClient } from "@mekstuff-rbxts/imit";
const RunService = game.GetService("RunService");
const Players = game.GetService("Players");
const IsServer = RunService.IsServer();

let _CLIENT_BINDED_TO_SCENES = false;
/**
 * Called by the client to initialize
 */
export function BindToScenes(handleUnit: (unitData: unknown, unitId: string | number, scene: Part) => void) {
	assert(!IsServer, `BindToScenes can only be called on the client`);
	assert(!_CLIENT_BINDED_TO_SCENES, `BindToScenes can only be called once on the client`);
	_CLIENT_BINDED_TO_SCENES = true;

	ImitationServiceClient.tapIn("TDKImitScenes", tostring(Players.LocalPlayer.UserId), (sceneImitator) => {
		const props = sceneImitator.getProps();
		if (props) {
			const _MasterTokenID = (props as any)._MasterTokenID as string /* eslint-disable-line */
			ImitationServiceClient.tapIn(_MasterTokenID as "TDKImitMasterTokenSchema", (masterImitator) => { /* eslint-disable-line */
				masterImitator.dict("troopUnits", (unitId) => {
					const tapInToTroop = ImitationServiceClient.tapIn(
						`${_MasterTokenID}/${unitId}` as "TDKImitMasterUnitTokenSchema",
						(unitImitator) => {
							unitImitator.on("data", (data) => {
								return handleUnit(data, unitId, (props as any).scene as Part); /* eslint-disable-line */
							});
						},
					);
					return () => {
						tapInToTroop.Destroy();
						// TODO: DOESN"T RUN ^^ VERY IMPORTANT, IMIT BUG MAYBE.
					};
				});
			});
		}
	});
}
