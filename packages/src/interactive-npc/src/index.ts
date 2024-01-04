/* eslint-disable roblox-ts/no-private-identifier */

declare global {
	namespace PHe {
		interface Pseudos {
			InteractiveNPC: InteractiveNPC;
		}
		interface CreateablePseudos {
			InteractiveNPC: InteractiveNPC;
		}
	}
}

import { Pseudo } from "@mekstuff-rbxts/core";
import { CreateR15Rig, R15Character } from "@mekstuff-rbxts/rig-builder";
import { TaskAction, TaskScheduler, TaskSchedulerExtendDefault } from "@mekstuff-rbxts/task-scheduler";
import { Servant } from "@mekstuff-rbxts/servant";
import { ComputedPath } from "@mekstuff-rbxts/path-computing-service";

const Players = game.GetService("Players");
const InsertService = game.GetService("InsertService");

const IsClient = Players.LocalPlayer ? true : false;

export class InteractiveNPC<
	InternalSchedulerGroups extends TaskSchedulerExtendDefault = TaskSchedulerExtendDefault,
> extends Pseudo {
	/**
	 * Use a player id as the appearance of the `NPC`.
	 */
	public PlayerAppearanceId: number | undefined = 1;
	/**
	 * Returns the `R15` character model.
	 */
	public GetCharacterModel(): R15Character {
		return this.GetRef();
	}

	/***/
	public GetHumanoid(): R15Character["Humanoid"] {
		return this.GetCharacterModel().Humanoid;
	}

	/***/
	public GetHumanoidRootPart(): MeshPart {
		return this.GetCharacterModel().HumanoidRootPart;
	}

	/****/
	private InternalScheduler: TaskScheduler<InternalSchedulerGroups> | undefined = undefined;

	/***/
	public GetTaskScheduler(): TaskScheduler<InternalSchedulerGroups> {
		if (!this.InternalScheduler) {
			this.InternalScheduler = new TaskScheduler<InternalSchedulerGroups>();
		}
		return this.InternalScheduler;
	}
	/**
	 * Accessories added by id
	 */
	private ActiveIdAccessories = new Map<number, Accessory>();
	/**
	 * `Humanoid.GetAccessories`
	 */
	public GetAccessories() {
		return this.GetHumanoid().GetAccessories();
	}
	/**
	 * Methods wrapped in promises
	 */
	public promises = {
		AddAccessory: (
			...args: Parameters<InteractiveNPC["AddAccessory"]>
		): Promise<ReturnType<InteractiveNPC["AddAccessory"]>> => {
			return new Promise((resolve) => {
				resolve(this.AddAccessory(...args));
			});
		},
		RemoveAccessory: (
			...args: Parameters<InteractiveNPC["RemoveAccessory"]>
		): Promise<ReturnType<InteractiveNPC["RemoveAccessory"]>> => {
			return new Promise((resolve) => {
				resolve(this.RemoveAccessory(...args));
			});
		},
	};
	/**
	 * Adds an accessory to the NPC
	 */
	public AddAccessory(Accessory: number | Accessory): Accessory {
		const Humanoid = this.GetHumanoid();
		if (typeIs(Accessory, "number") && IsClient === true) {
			throw `You cannot AddAccessory by id from the client: ${Accessory}`;
		}
		let UseAccessory: Accessory | undefined;
		if (typeIs(Accessory, "number")) {
			try {
				const r = InsertService.LoadAsset(Accessory);
				const v = r.GetChildren()[0];
				if (v === undefined) {
					throw `Did not get anything from LoadAsset`;
				}
				if (v.IsA("Accessory")) {
					UseAccessory = v;
					this.ActiveIdAccessories.set(Accessory, v);
				} else {
					r.Destroy();
					throw `"${Accessory}" does not result in an Accessory`;
				}
			} catch (err) {
				throw `Failed to load asset with AddAccessory: ${Accessory}. ERR: ${err}`;
			}
		} else {
			UseAccessory = Accessory;
		}
		Humanoid.AddAccessory(UseAccessory);
		return UseAccessory;
	}
	/**
	 * Removes an accessory to the NPC
	 *
	 * @param Accessory If you're using the accessory id, the accessory must be added using `InteractiveNPC.AddAccessory`.
	 */
	public RemoveAccessory(Accessory: number | Accessory) {
		let UseAccessory: Accessory | undefined;
		if (typeIs(Accessory, "number")) {
			const mapped = this.ActiveIdAccessories.get(Accessory);
			if (mapped === undefined) {
				throw `Accessory id ${Accessory} was not found to be used by npc. Make sure it was added using AddAccessory(id: number)`;
			}
			UseAccessory = mapped;
			this.ActiveIdAccessories.delete(Accessory);
		} else {
			const Humanoid = this.GetHumanoid();
			const HumanoidAccessories = Humanoid.GetAccessories();
			if (HumanoidAccessories.indexOf(Accessory) === -1) {
				print(Accessory);
				throw `↑↑↑ The accessory below was not found as an accessory used by npc. You're attempting to remove the wrong accessory. ↑↑↑`;
			}
			UseAccessory = Accessory;
		}
		UseAccessory.Destroy();
	}

	/**
	 * `Humanoid.RemoveAccessories`
	 */
	public RemoveAccessories() {
		return this.GetHumanoid().RemoveAccessories();
	}

	/**
	 * Invokes the `PlayEmote` bindable function.
	 *
	 * `this.GetCharacterModel().Animate.PlayEmote.Invoke(EmoteName)`
	 */
	public PlayEmote(Emote: string) {
		this.GetCharacterModel().Animate.PlayEmote.Invoke(Emote);
	}

	/**
	 * Makes the NPC face the direction
	 */
	public TurnToFaceDirection(Direction: Vector3) {
		const Char = this.GetCharacterModel();
		const Root = Char.HumanoidRootPart;
		Root.CFrame = CFrame.lookAt(Root.Position, new Vector3(Direction.X, Root.Position.Y, Direction.Z));
	}

	/**
	 * A list of tasks ship with `interactive-npc` that you can pass into the `TaskScheduler`.
	 */
	public NPCDefaultTasks = {
		/**
		 * Uses `ComputedPath` to walk to the destination
		 *
		 * @param retries How manu times will the path recompute if it was blocked or failed. Defaults to `8`.
		 *
		 * If you have an `onBlocked` or `onFailed` then the default behaviour of handling them will not run.
		 */
		Walk: (
			WalkDestination: Vector3,
			retries?: number,
			onBlocked?: (Path: ComputedPath, ...args: unknown[]) => void,
			onFailed?: (Path: ComputedPath, ...args: unknown[]) => void,
		): TaskAction => {
			return (_: unknown, taskServant: Servant, __: unknown, manualComplete) => {
				retries = retries ?? 5;
				manualComplete.manual();
				const CharacterModel = this.GetCharacterModel();
				const Path = taskServant.Keep(new ComputedPath())[0] as ComputedPath;
				let totalRetries = 0;
				taskServant.Keep(
					Path.Failed.Connect((...args) => {
						if (onFailed) {
							onFailed(Path, ...args);
							return;
						}
						if (totalRetries < retries!) {
							totalRetries++;
							Path.Compute();
						} else {
							manualComplete.complete();
						}
					}),
				);
				Path.Blocked.Connect((...args) => {
					if (onBlocked) {
						onBlocked(Path, ...args);
						return;
					}
					if (totalRetries < retries!) {
						totalRetries++;
						Path.Compute();
					} else {
						manualComplete.complete();
					}
				});
				taskServant.Keep(
					Path.Completed.Connect(() => {
						manualComplete.complete();
					}),
				);
				Path.Agent = CharacterModel;
				Path.Destination = WalkDestination;
				Path.Compute();
			};
		},
		/**
		 * Invokes the wave emote
		 */
		Wave: (Direction?: Vector3): TaskAction => {
			return (_, __, ___, manualComplete) => {
				manualComplete.manual();
				if (Direction !== undefined) {
					this.TurnToFaceDirection(Direction);
					task.wait(0.4);
				}
				this.PlayEmote("wave");
				task.wait(1);
				manualComplete.complete();
			};
		},
	};

	/***/
	public SetCharacterPosition(Position: CFrame | Vector3) {
		const Character = this.GetCharacterModel();
		Character.PivotTo(typeIs(Position, "Vector3") ? new CFrame(Position) : Position);
	}

	constructor() {
		super("InteractiveNPC", CreateR15Rig());
		this.useReferenceInstanceBehaviour();

		this.SetCharacterPosition(new Vector3(0, 0, 0));

		this.usePropertyEffect(() => {
			if (this.PlayerAppearanceId !== undefined) {
				return new Promise<HumanoidDescription>((resolve) => {
					resolve(Players.GetHumanoidDescriptionFromUserId(this.PlayerAppearanceId as number));
				}).then((res) => {
					this.GetCharacterModel().Humanoid.ApplyDescription(res);
				});
			}
		}, ["PlayerAppearanceId"]);
	}
}
