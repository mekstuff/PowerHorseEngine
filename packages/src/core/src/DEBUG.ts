/* eslint-disable roblox-ts/no-private-identifier */

import { Engine } from "./Engine";
import { Pseudo } from "./Pseudo";
import { Servant } from "./Servant";

function resolveToAttributeSupportedName(Name: string): string {
	return Name.gsub("%.", "_")[0];
}

type VisualRepresentationInfo = {
	Name: string;
	Color: Color3;
	Material: Enum.Material;
};
function GetVisualRepresentationInfo(
	_ServantId: string,
	InputInfo?: Partial<VisualRepresentationInfo>,
): VisualRepresentationInfo {
	return {
		Name: InputInfo?.Name ?? _ServantId,
		Color: InputInfo?.Color ?? Color3.fromRGB(255, 255, 255),
		Material: InputInfo?.Material ?? Enum.Material.Neon,
	};
}

class GameplayGlobalDebugger extends Pseudo {
	/**
	 *
	 */
	SetEnabled(state: boolean) {
		this.useSetNewIndexAssignment("Enabled", state);
	}
	common = {
		Raycast: {
			VisualizeResults: (
				Servant: Servant,
				RaycastResult?: RaycastResult,
				Visualize?: Partial<VisualRepresentationInfo>,
			): void => {
				this.New("common.Raycast.VisualizeResults", (VisualizeServant, Container, MainServant) => {
					Servant.Keep(MainServant);
					if (RaycastResult) {
						const VisualRepresentation = GetVisualRepresentationInfo(MainServant._id, Visualize);
						const [PartVisualizer] = VisualizeServant.Keep(new Instance("Part"));
						const EndPos = RaycastResult.Position.mul(RaycastResult.Normal);
						PartVisualizer.Name = VisualRepresentation!.Name!;
						PartVisualizer.Material = VisualRepresentation!.Material!;
						PartVisualizer.Color = VisualRepresentation!.Color!;
						PartVisualizer.CFrame = CFrame.lookAt(RaycastResult.Position, EndPos).mul(
							new CFrame(0, 0, -RaycastResult.Distance / 2),
						);
						PartVisualizer.Size = new Vector3(0.2, 0.2, RaycastResult.Distance);
						PartVisualizer.CanCollide = false;
						PartVisualizer.Anchored = true;
						PartVisualizer.Parent = Container();
					}
				});
			},
		},
	};
	private _DebuggerServant: Servant;
	_RemoveContainers() {
		const Ref = this.GetRef();
		Ref.GetChildren().forEach((child) => {
			if (child.IsA("Folder")) {
				child.Destroy();
			}
		});
	}
	GetContainerFor(Name: string): Folder {
		Name = resolveToAttributeSupportedName(Name);
		const Ref = this.GetRef();
		let _Container = Ref.FindFirstChild(Name) as Folder | undefined;
		if (_Container) {
			return _Container;
		}
		_Container = new Instance("Folder");
		_Container.Name = Name;
		_Container.Parent = Ref;
		return _Container;
	}
	HasContainerFor(Name: string): boolean {
		Name = resolveToAttributeSupportedName(Name);
		const Ref = this.GetRef();
		if (Ref.FindFirstChild(Name)) {
			return true;
		}
		return false;
	}
	/**
	 * @returns The "Main" Servant, This servant controls this `New` creation. Destroying it will basically remove this Controller for that Name.
	 */
	New(
		Name: string,
		Controller: (ControllerServant: Servant, GetContainer: () => Folder, MainServant: Servant) => unknown,
	): Servant {
		Name = resolveToAttributeSupportedName(Name);
		const Ref = this.GetRef();
		const [TopLevelServant] = this._DebuggerServant.Keep(new Servant());
		if (Ref.GetAttribute(Name) === undefined) {
			this.useSetNewIndexAssignment(Name, true, false, true);
		}
		const _getContainer = () => {
			return this.GetContainerFor(Name);
		};
		TopLevelServant.Keep(
			this.usePropertyEffect(() => {
				const state = (this as unknown as { [key: string]: boolean })[Name];
				if (Ref.GetAttribute("Enabled") === false) {
					return;
				}
				if (state === true) {
					const CurrentServant = TopLevelServant.Keep(new Servant())[0];
					Controller(CurrentServant, _getContainer, TopLevelServant);
					return () => {
						if (this.HasContainerFor(Name)) {
							this.GetContainerFor(Name).Destroy();
						}
						CurrentServant.Destroy();
					};
				}
			}, [Name]),
		);
		return TopLevelServant;
	}
	constructor() {
		super("GameplayGlobalDebugger");
		this._DebuggerServant = new Servant();
		this.Name = this._id;
		this.GetRef().Name = this.Name;
		this.GetRef().Parent = Engine.FetchWorkspaceStorage();
	}
}

let _GameplayGlobalDebugger: GameplayGlobalDebugger | undefined;
export const DEBUGGER = {
	GetGameplayDebugger: (): GameplayGlobalDebugger => {
		if (_GameplayGlobalDebugger) {
			return _GameplayGlobalDebugger;
		}
		_GameplayGlobalDebugger = new GameplayGlobalDebugger();
		const Set_GameplayDebuggerValuesTo = (State: boolean) => {
			const Ref = _GameplayGlobalDebugger?.GetRef();
			Ref?.GetAttributes().forEach((_, attrkey) => {
				if (
					attrkey !== "Enabled" &&
					attrkey !== "Name" &&
					attrkey !== "ClassName" &&
					attrkey !== "common" &&
					attrkey.match("^_")[0] === undefined
				) {
					Ref.SetAttribute(attrkey, State);
				}
			});
		};
		_GameplayGlobalDebugger.New("Enabled", (S) => {
			Set_GameplayDebuggerValuesTo(true);
			S.useDestroying(() => {
				Set_GameplayDebuggerValuesTo(false);
				_GameplayGlobalDebugger?._RemoveContainers();
			});
		});
		return _GameplayGlobalDebugger;
	},
};
