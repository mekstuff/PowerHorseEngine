/* eslint-disable roblox-ts/no-private-identifier */

declare global {
	namespace PHe {
		interface Pseudos {
			ComputedPath: ComputedPath;
		}
		interface CreateablePseudos {
			ComputedPath: ComputedPath;
		}
	}
}

import { Pseudo, Engine, typeIs } from "@mekstuff-rbxts/core";
import { Signal } from "@mekstuff-rbxts/signal";

const PathfindingService = game.GetService("PathfindingService");
const RunService = game.GetService("RunService");
const useFrameSkip = RunService.IsClient() ? RunService.RenderStepped : RunService.Stepped;

type PathfindingPath = ReturnType<PathfindingService["CreatePath"]>;

type ValidAgentAndDestinations = Instance | BasePart | CFrame | Vector3;

// For debug visualization gizmos we store them inside of a folder/container, we can simply ignore this container with the debug visualizations!
const DEBUG_VISUALS_CONTAINER_NAME = "@mekstuff-rbxts/path-computing-service.path-gizmos";
// exported so it can externally be used for ignore lists if needed.
export const GetDebugVisualizationGizmosContainer = <T extends boolean>(
	createIfDoesntExist?: T,
): T extends true ? Folder : Folder | undefined => {
	const InWorkspace = Engine.FetchWorkspaceStorage().FindFirstChild(DEBUG_VISUALS_CONTAINER_NAME);
	if (!InWorkspace) {
		if (createIfDoesntExist === true) {
			const n = new Instance("Folder");
			n.Name = DEBUG_VISUALS_CONTAINER_NAME;
			n.Parent = Engine.FetchWorkspaceStorage();
			return n;
		}
	}
	return InWorkspace as never;
};

/**
 * Gets the `Vector3` value from the item
 */
export function GetVector3Fromitem(Item: ValidAgentAndDestinations): Vector3 {
	if (typeIs(Item, "Instance")) {
		if (Item.IsA("Model")) {
			return (Item.PrimaryPart && Item.PrimaryPart.Position) || Item.FindFirstChildWhichIsA("BasePart")!.Position;
		} else {
			if (Item.IsA("BasePart")) {
				return Item.Position;
			} else {
				throw `Could not resolve a Vector3 for ${tostring(Item)}`;
			}
		}
	} else if (typeIs(Item, "CFrame")) {
		return Item.Position;
	}
	return Item;
}

/**
 * Gets the nearest object from between the agent and the list of destinations.
 */
export function CalculateNearestDestination(
	Agent: ValidAgentAndDestinations,
	Destinations: ValidAgentAndDestinations[],
) {
	const AgentVector3 = GetVector3Fromitem(Agent);
	let lowestmag = math.huge;
	let currt;
	for (const v of Destinations) {
		const pos = GetVector3Fromitem(v);
		const nmag = AgentVector3.sub(pos).Magnitude;
		if (nmag < lowestmag) {
			lowestmag = nmag;
			currt = v;
		}
	}
	return $tuple(currt, lowestmag);
}

/**
 * A Class for adding `PathfindingModifiers` But implements the ability to add modifier to a Instance and have it replicate to its children at a given level.
 *
 * ### Performance
 * This class needs optimizing.
 */
export class ComputedPathModifier extends Pseudo<{
	CurrentModifiers: PathfindingModifier[];
	ParentDescendantAdded: RBXScriptConnection | undefined;
}> {
	/**
	 * Current amount of active modifiers.
	 */
	private TotalActiveModifiers = 0;
	/**
	 * By default, only `Models` and `Folders` are traversed, however you can have it traverse baseparts if your component has baseparts within baseparts.
	 */
	TraverseBaseParts = false;
	/**
	 * The Label that will be set for the `PathfindingModifiers`, If you use an array of strings, the labels will be set based on the traverse level relative
	 * to the index of the array.
	 * e.g. a modifier that was created at the traverse level of `1` will get the label of the string at the index `0`, level `1` will get the label of the string at the index `1` etc.
	 */
	Label: string | string[] = "";
	/**
	 * The `PassThrough` that will be set for the `PathfindingModifiers`, If you use an array of booleans, the PassThrough will be set based on the traverse level relative
	 * to the index of the array.
	 * e.g. a modifier that was created at the traverse level of `1` will get the PassThrough of the boolean at the index `0`, level `1` will get the PassThrough of the boolean at the index `1` etc.
	 */
	PassThrough: boolean | boolean[] = false;
	/**
	 * @param TraverseLevel How deep will the `PathfindingModifier` be replicated within the Instance, at level `1` (default) it will only affect the immediate parent.
	 */
	constructor(public TraverseLevel: number = 1) {
		super("ComputedPathModifier");
		this.Name = this._id;
		this.GetRef().Name = this.Name;
		this.TraverseLevel = this.TraverseLevel ?? 1;
		this._dev.CurrentModifiers = [];

		const UpdateModifiers = () => {
			this._dev.CurrentModifiers.forEach((x) => {
				x.Destroy();
			});
			this._dev.CurrentModifiers.clear();
			const run = (Parent: Instance, lvl: number) => {
				if (Parent.IsA("BasePart")) {
					const modifierName = `${this.Name}+${lvl}`;
					if (!Parent.FindFirstChild(modifierName)) {
						const targetUsePathfindingModifier = new Instance("PathfindingModifier");
						targetUsePathfindingModifier.Name = modifierName;
						targetUsePathfindingModifier.Label = typeIs(this.Label, "string")
							? this.Label
							: this.Label[lvl - 1] ?? "";
						targetUsePathfindingModifier.PassThrough = typeIs(this.PassThrough, "boolean")
							? this.PassThrough
							: this.PassThrough[lvl - 1] ?? false;
						this._dev.CurrentModifiers.push(targetUsePathfindingModifier);
						targetUsePathfindingModifier.Parent = Parent;
					}
					if (this.TraverseBaseParts && lvl < this.TraverseLevel) {
						Parent.GetChildren().forEach((x) => {
							run(x, lvl + 1);
						});
					}
				} else {
					if (lvl < this.TraverseLevel) {
						Parent.GetChildren().forEach((x) => {
							run(x, lvl + 1);
						});
					}
				}
			};

			if (this.Parent !== undefined) {
				run(this.Parent as Instance, 1);
			}
			this.TotalActiveModifiers = this._dev.CurrentModifiers.size();
			this.GetRef().Parent = typeIs(this.Parent, "Pseudo") ? this.Parent.GetRef() : this.Parent;
		};

		this.usePropertyEffect(() => {
			if (this.Parent !== undefined) {
				if (!typeIs(this.Parent, "Instance")) {
					throw `ComputedPathModifier Parent can only be an Instance or nil. Got ${typeOf(this.Parent)}`;
				}
				if (!this.Parent.IsA("Model") || this.Parent.IsA("Folder") || this.Parent.IsA("BasePart")) {
					throw `ComputedPathModifier Parent can only be of Instance type "Model", "Folder" or "BasePart". Got ${this.Parent.ClassName}`;
				}
				this._dev.ParentDescendantAdded = this.Parent.DescendantAdded.Connect((x) => {
					if (x.IsA("BasePart")) {
						UpdateModifiers();
					}
				});
			}
			UpdateModifiers();
			return () => {
				this._dev.ParentDescendantAdded?.Disconnect();
			};
		}, ["Parent"]);

		this.usePropertyRender(() => {
			UpdateModifiers();
		}, ["PassThrough", "Label", "TraverseLevel", "TraverseBaseParts"]);
	}
}

/**
 * A Class for computing paths with pathfinding.
 *
 * You can set the `Agent` to be a Character at it will use `MoveTo` method of the `Humanoid`, If `Agent` is a `BasePart` then it will use `TweenService`.
 * You can override how the `Agent` moves using the `SetDoMoveAgent` method.
 */
export class ComputedPath extends Pseudo {
	Name = "ComputedPath";
	/**
	 * Spawn parts to visualize paths that are created
	 */
	public DebugVisualization = false;

	/**
	 * Contains information about debugging.
	 */
	private DebugComputationInfo: PathWaypoint[] | undefined = undefined;
	/**
	 * Contains information about debugging for the currently blocked path index.
	 */
	private DebugComputationInfo_BlockedIndex: number[] = [];
	/**
	 * uses `useSetNewIndexAssignment` to trigger a newindex effect on the `DebugComputationInfo_BlockedIndex` to state a new values was added or changed.
	 */
	private _triggerBlockedIndexArrayNewIndex() {
		this.useSetNewIndexAssignment(
			"DebugComputationInfo_BlockedIndex",
			this.DebugComputationInfo_BlockedIndex,
			true,
		);
	}
	/**
	 * Adds the index from the DebugComputationInfo_BlockedIndex and calls the `_triggerBlockedIndexArrayNewIndex` if the item was added.
	 */
	private _addIndexFromDebugComputationInfo_BlockedIndex(index: number) {
		const indx = this.DebugComputationInfo_BlockedIndex.indexOf(index);
		if (indx === -1) {
			this.DebugComputationInfo_BlockedIndex.push(index);
			this._triggerBlockedIndexArrayNewIndex();
		}
	}
	/**
	 * Removes the index from the DebugComputationInfo_BlockedIndex and calls the `_triggerBlockedIndexArrayNewIndex` if the item was removed.
	 *
	 */
	private _removeIndexFromDebugComputationInfo_BlockedIndex(index: number): boolean {
		const indx = this.DebugComputationInfo_BlockedIndex.indexOf(index);
		if (indx !== -1) {
			this.DebugComputationInfo_BlockedIndex.remove(indx);
			this._triggerBlockedIndexArrayNewIndex();
			return true;
		}
		return false;
	}
	/**
	 * Gets the current first `Blocked` waypoint, will be `-1` if no waypoint is currently blocked.
	 *
	 * Keep in mind that if a waypoint was blocked, then the item that blocked it were to no longer block it, the waypoint will still be considered blocked until
	 * the path is recomputed.
	 */
	public GetCurrentBlockedWaypointIndex(): number {
		return this.DebugComputationInfo_BlockedIndex[0] ?? -1;
	}
	/**
	 * Gets the currently `Blocked` waypoint indexes if any.
	 */
	public GetCurrentBlockedWaypointIndexes(): number[] {
		return this.DebugComputationInfo_BlockedIndex;
	}
	/**
	 * When `true`, a ray will be casted from the `Agent` to the `Desstination`. If there's nothing between the
	 * path, then that means the path can just be a straight line.
	 *
	 * If you have `Costs` specified, `OptimizeWithRaycast` will not be used.
	 *
	 * @todo Optimize and fix bugs
	 * Not production ready.
	 */
	public OptimizeWithRaycast = false;
	/**
	 * If set, whenever the `Blocked` event is caught, It will cast a ray from the Waypoint before the blocked Waypoint to the
	 * blocked Waypoint, if the results are `undefined`/it doesn't hit anything, It will ignore the `Blocked` event and the path will still be valid.
	 *
	 * for e.g. you may not wish for the agent to be able to interrupt the path, for that you can add the `Agent` if an Instance within the `FilterDescendantsInstances`
	 * table and set the `FilterType` to be Exclude.
	 *
	 * PLEASE NOTE: The debug visualization gizmos aren't by default included in the filter list! If you're using a filterType of `Exclude`, make sure to add
	 * the gizmos folder by using the `GetDebugVisualizationGizmosContainer` function,
	 */
	public BlockedRaycastParams: RaycastParams | undefined = undefined;
	/**
	 * Returns the global `DebugVisualizationGizmosContainer`. Creates it if it doesn't exist.
	 */
	public GetDebugVisualizationGizmosContainer() {
		return GetDebugVisualizationGizmosContainer(true);
	}
	/**
	 * Automatically calls `Compute` whenever the destination changes.
	 */
	public AutoMoveDestination = false;
	/**
	 * Automatically calls `DoMoveAgent` whenever a waypoint is finished, If you plan to recompute on every waypoint reached,
	 * it is best to set this value to false. since keeping it as true will `DoMoveAgent` unnecessarily.
	 */
	public AutoMoveAgentOnWaypoint = true;
	/**
	 * Will continue to follow the destination while this property is true. Whenever the destinations position changes it will
	 * recompute.
	 *
	 * Use the `FollowDestinationMagnitude` property to set when change is detected
	 */
	public FollowDestination = false;
	/**
	 * The difference of which the current position has to be from the previous position. e.g. if `10`, the agent will have to
	 * move `10` studs away from their last position for recomputation to happen.
	 *
	 * Since the agent can now move within this magnitude without being detected, there may be cases where the Agent will stop a
	 * fair distance away from the current destination ( it will stop at the last known destination within the magnitude ).
	 * To combat this, you can implement you own recomputation logic whenever a computation as completed.
	 *
	 * ```ts
	 * ComputedPath.Completed.Connect((reached,noWaypoints) => {
	 * 	if(noWaypoints) {
	 * 	retun;
	 * }
	 * if(ComputedPath.GetAgentVector().sub(ComputedPath.GetDestinationVector()).Magnitude > 5) {
	 * 	ComputedPath.Compute();
	 * }
	 * }))
	 * ```
	 */
	public FollowDestinationMagnitude = 10;
	/**
	 * TweenInfo in cases where `Agent` is not a Humanoid Character.
	 */
	public AgentTweenInfo = new TweenInfo(0.1, Enum.EasingStyle.Linear);
	/**
	 * Is `true` while the path is computing, will be `false` if the path `failed`,`blocked`,`completed`
	 */
	public IsComputing = false;
	/**
	 * Whenever the path failed, this will be true until the path is computed again.
	 *
	 * This is used alongside `DebugVisualization` to display failed paths.
	 */
	public PathFailed = false;
	/**
	 * The `noWaypoints` is passed whenever the path is computed and there's no following waypoints. This can happen
	 * if the `Destination` is already at the position of the `Agent`. It will still be considered as completed but you can
	 * so the `noWaypoints` provides a way to detect there weren't any "Movement".
	 */
	public Completed: Signal<(reached: boolean, noWaypoints?: boolean) => void>;
	/**
	 * Fired whenever a Waypoint is reached.
	 */
	public WaypointReached: Signal<(Waypoint: PathWaypoint, completed: boolean, isLastWaypoint: boolean) => void>;
	/**
	 * Fired whenever the `Compute` method is called.
	 */
	public Computing: Signal<() => void>;
	/**
	 * The `InstanceThatBlocked` is only available if `BlockedRaycastParams` is set or `OptimizeWithRaycast` is enabled and
	 * the resulting path was generated through `Raycast`.
	 *
	 * You may wish to `Compute` again whenever the path gets blocked, You can do this by just simply calling the `Compute` method.
	 * However you should always check that the blocked index was not already traversed, to prevent an unnecessary recomputation.
	 *
	 * ```ts
	 * ComputedPath.Blocked.Connect((WaypointIndex) => {
	 * 		if(ComputedPath.GetCurrentWaypointIndex() < WaypointIndex) {
	 * 			ComputedPath.ComputeFromCurrent();
	 * 		}
	 * })
	 *
	 * ```
	 */
	public Blocked: Signal<(WaypointIndex: number, InstanceThatBlocked?: Instance) => void>;
	public Unblocked: Signal<(UnblockedWaypointIndex: number) => void>;
	/**
	 * Fired whenever the path fails.
	 */
	public Failed: Signal<(PathStatus: Enum.PathStatus, Err: unknown) => void>;
	/**
	 * Fired whenever the `CurrentWaypointIndex` changes
	 */
	public CurrentWaypointIndexChanged: Signal<(newIndex: number, oldIndex: number) => void>;

	/**
	 * uses `GetVector3FromItem` to get Destination
	 */
	public GetDestinationVector(): Vector3 {
		if (this.Destination !== undefined) {
			return GetVector3Fromitem(this.Destination);
		}
		throw "No destination vector exists, cannot _getDestinationVector";
	}
	/**
	 * uses `GetVector3FromItem` to get Agents position
	 */
	public GetAgentVector(): Vector3 {
		if (this.Agent !== undefined) {
			return GetVector3Fromitem(this.Agent);
		}
		throw "No agent exists, cannot _getAgentPrimaryPart";
	}

	/**
	 * Returns the `Humanoid` of the `Agent` if it exists. Throws an error if `Agent` is not an `Instance`.
	 */
	public GetAgentHumanoid(): Humanoid | undefined {
		if (this.Agent && typeIs(this.Agent, "Instance")) {
			return this.Agent.FindFirstChildWhichIsA("Humanoid");
		}
		throw `Cannot GetAgentHumanoid from the current agent.`;
	}

	/**
	 * For Getting the `Reached` event to connect to based on the `Agent`.
	 */
	private GetReachedConnect(): RBXScriptSignal {
		const agentTween = this._dev.get("AgentTween");
		if (agentTween !== undefined) {
			return (agentTween as Tween).Completed;
		}
		const customMoveEvent = this._dev.get("customMoveEvent");
		if (customMoveEvent !== undefined) {
			return customMoveEvent as RBXScriptSignal;
		}
		const AgentHumanoid = this.GetAgentHumanoid()!;
		return AgentHumanoid.MoveToFinished;
	}
	/**
	 * Overrides the default agent `DoMoveToAgent`,
	 *
	 * Your callback will be called everytime `DoMoveToAgent` is called
	 * the `targetPosition` is the target Waypoints Position.
	 * the `waypointLabel` is the target Waypoints Label.
	 *
	 * Calling finish will trigger the next `DoMoveAgent` if any with the next waypoint etc..
	 * By default the `complete` argument for t will be set as true
	 *
	 * Your callback can return a function that will be used as a cleanup function.
	 */
	SetDoMoveToAgent(
		callback: (
			finish: (didNotComplete?: boolean, ...args: unknown[]) => void,
			Waypoint: PathWaypoint,
		) => (() => void) | void,
	): void {
		if (this._dev._customDoMoveAgent !== undefined) {
			throw `You can only call "SetDoMoveToAgent" on a ComputedPath only once.`;
		}
		this._dev.set("customMoveEvent", new Signal());
		this._dev._customDoMoveAgent = callback;
	}
	/**
	 * Calls the customDoMoveAgent cleanup function if any exists then sets it to undefined.
	 */
	private _CallCustomDoMoveAgentCleanup(): void {
		if (typeIs(this._dev._customDoMoveAgentCleanupFunc, "function")) {
			(this._dev._customDoMoveAgentCleanupFunc as Callback)();
			this._dev._customDoMoveAgentCleanupFunc = undefined;
		}
	}
	/**
	 * For trigger the Move of the `Agent`.
	 */
	private DoMoveToAgent(Waypoint: PathWaypoint): void {
		this._CallCustomDoMoveAgentCleanup();
		if (this._dev._customDoMoveAgent !== undefined) {
			const res = (this._dev._customDoMoveAgent as Callback)((didNotComplete: boolean, ...args: unknown[]) => {
				(this._dev.get("customMoveEvent") as Signal).Fire(
					didNotComplete === undefined ? true : didNotComplete,
					...args,
				);
			}, Waypoint);
			if (typeIs(res, "function")) {
				this._dev._customDoMoveAgentCleanupFunc = res;
			}
			return;
		}
		const AgentTween = this._dev.get("AgentTween") as Tween | undefined;
		if (AgentTween) {
			AgentTween.Destroy();
			this._dev.set("AgentTween", undefined);
		}
		const AgentHumanoid = this.GetAgentHumanoid();
		if (AgentHumanoid) {
			AgentHumanoid.MoveTo(Waypoint.Position);
		} else {
			const ActiveTween = game
				.GetService("TweenService")
				.Create(this._getAgentPrimaryPart() as BasePart, this.AgentTweenInfo, {
					Position: Waypoint.Position,
				});
			this._dev.set("AgentTween", ActiveTween);
			ActiveTween.Play();
		}
	}
	/**
	 * Internally set the waypoint index.
	 */
	private _setWaypointIndex(index: number, noWaypointIndexChangedEvent?: boolean): void {
		const old_currentWaypointIndex = this.GetCurrentWaypointIndex();
		this._dev.set("currentWaypointIndex", index);
		if (!noWaypointIndexChangedEvent) {
			this.CurrentWaypointIndexChanged.Fire(index, old_currentWaypointIndex);
		}
	}
	/**
	 * Gets the `PrimaryPart` of the agent if any, Throws an error if the `Agent` is not an Instance.
	 */
	private _getAgentPrimaryPart(): Instance | undefined {
		if (typeIs(this.Agent, "Instance")) {
			if (this.Agent.IsA("Model")) {
				return this.Agent.PrimaryPart || this.Agent.FindFirstChildWhichIsA("BasePart");
			}
			return this.Agent;
		}
		throw `Unknown this.Agent ${typeOf(this.Agent)}`;
	}

	/**
	 * Gets the current waypoints.
	 */
	public GetCurrentWaypoints(): PathWaypoint[] {
		return (this._dev.get("mainPath") as PathfindingPath).GetWaypoints();
	}
	/**
	 * Gets the waypoint at the given index.
	 */
	public GetWaypointAtIndex(index: number): PathWaypoint | undefined {
		return (this._dev.get("mainPath") as PathfindingPath).GetWaypoints()[index];
	}
	/**
	 * Gets the current waypoint.
	 */
	public GetCurrentWaypoint(): PathWaypoint | undefined {
		return this.GetCurrentWaypoints()[this._dev.get("currentWaypointIndex") as number];
	}
	/**
	 * Gets the index of the current `Waypoint`.
	 *
	 * Will be `-1` if there's no current `Waypoint`.
	 */
	public GetCurrentWaypointIndex(): number {
		return this._dev.get("currentWaypointIndex") as number;
	}
	/**
	 * Computes the path
	 *
	 * @param startVector3 You can set the start vector at which the path will be computed from, By default it will use the `Agent`.
	 * @param endVector3 You can set the ebd vector at which the path will be computed to, By default it will use the `Destination`.
	 */
	public Compute(startVector3?: Vector3, endVector3?: Vector3) {
		// reset values and fire computing event
		// this.DebugComputationInfo_BlockedIndex = [];
		this.DebugComputationInfo_BlockedIndex.clear();
		this._triggerBlockedIndexArrayNewIndex();
		this.PathFailed = false;
		this.Computing.Fire();

		// use to disconnect any events in `_dev`
		const _DisconnectDevEvent = (Name: string) => {
			const target = this._dev.get(Name);
			if (typeIs(target, "RBXScriptConnection")) {
				this._dev[Name] = undefined;
				target.Disconnect();
			}
		};

		// disconnect the previous RayCastConnection
		_DisconnectDevEvent("RayCastConnection");

		// get the mainPath from `PathFindingService`
		const path = this._dev.get("mainPath") as PathfindingPath;

		// Custom waypoints
		let USE_CUSTOM_WAYPOINTS: { Position: Vector3; Label: string }[] | undefined = undefined;

		const SET_USE_CUSTOM_WAYPOINTS = () => {
			if (!this.OptimizeWithRaycast || this.AgentParameters?.Costs !== undefined) {
				return;
			}
			const rcp = new RaycastParams();
			rcp.FilterType = Enum.RaycastFilterType.Exclude;
			if (typeIs(this.Agent, "Instance")) {
				rcp.AddToFilter(this.Agent);
			}
			if (typeIs(this.Destination, "Instance")) {
				rcp.AddToFilter(this.Destination);
			}
			const gizmos = GetDebugVisualizationGizmosContainer();
			if (gizmos) {
				rcp.AddToFilter(gizmos);
			}
			const AgentVector = startVector3 ?? this.GetAgentVector();
			const DestinationVector = endVector3 ?? this.GetDestinationVector();
			const AgentHeight = this.AgentParameters ? this.AgentParameters.AgentHeight ?? 5 : 5;
			if (DestinationVector.Y - AgentVector.Y > AgentHeight) {
				return;
			}
			const Ray = game.Workspace.Raycast(
				AgentVector,
				CFrame.lookAt(AgentVector, DestinationVector).LookVector.mul(
					AgentVector.sub(DestinationVector).Magnitude,
				),
				rcp,
			);
			if (Ray && Ray.Instance !== undefined) {
				return;
			}
			const Difference = AgentVector.sub(DestinationVector);
			const WaypointSpacing = this.AgentParameters ? this.AgentParameters.WaypointSpacing ?? 4 : 4;
			const PartsNeededToFill = math.ceil(Difference.Magnitude / WaypointSpacing);
			USE_CUSTOM_WAYPOINTS = [];
			for (let index = 0; index <= PartsNeededToFill; index++) {
				USE_CUSTOM_WAYPOINTS.push({
					Position: AgentVector.sub(Difference.Unit.mul((index * Difference.Magnitude) / PartsNeededToFill)),
					Label: "$RayCast",
				});
			}
			let PathIsBlocked = false;
			this._dev.set(
				"RayCastConnection",
				useFrameSkip.Connect(() => {
					const sVector = startVector3 ?? this.GetAgentVector();
					const eVector = endVector3 ?? this.GetDestinationVector();
					const Direction = CFrame.lookAt(sVector, eVector).LookVector.mul(sVector.sub(eVector).Magnitude);
					const Ray = game.Workspace.Raycast(sVector, Direction, rcp);
					if (Ray && Ray.Instance) {
						// _DisconnectDevEvent("RayCastConnection"); // no longer disconnect on hit to support unblocked event
						PathIsBlocked = true;
						this._addIndexFromDebugComputationInfo_BlockedIndex(this.GetCurrentWaypointIndex());
						// this.DebugComputationInfo_BlockedIndex = this.GetCurrentWaypointIndex();
						this.Blocked.Fire(this.GetCurrentWaypointIndex(), Ray.Instance);
					} else {
						if (PathIsBlocked) {
							this._removeIndexFromDebugComputationInfo_BlockedIndex(this.GetCurrentWaypointIndex());
							this.Unblocked.Fire(this.GetCurrentWaypointIndex());
						}
						PathIsBlocked = false;
					}
				}),
			);
		};
		SET_USE_CUSTOM_WAYPOINTS();
		const [s, r] = pcall(() => {
			if (USE_CUSTOM_WAYPOINTS === undefined) {
				path.ComputeAsync(startVector3 ?? this.GetAgentVector(), endVector3 ?? this.GetDestinationVector());
			}
		});
		_DisconnectDevEvent("reachedConnection");
		_DisconnectDevEvent("blockedConnection");
		_DisconnectDevEvent("unblockedConnection");
		this._CallCustomDoMoveAgentCleanup();
		if (s && (path.Status === Enum.PathStatus.Success || USE_CUSTOM_WAYPOINTS !== undefined)) {
			const waypoints = (USE_CUSTOM_WAYPOINTS as unknown as PathWaypoint[]) ?? path.GetWaypoints();
			this.DebugComputationInfo = waypoints;
			let instance_which_blocked: Instance | undefined;
			// blocked
			this._dev.set(
				"blockedConnection",
				path.Blocked.Connect((blockedWaypointIdx) => {
					if (
						this.BlockedRaycastParams !== undefined &&
						this.BlockedRaycastParams.FilterDescendantsInstances.size() > 0
					) {
						const Waypoints = this.GetCurrentWaypoints();
						// we need to do -2, -1 for roblox-ts as the blockedWaypointIndx is stored as if the Waypoints start at 1
						const PreviousWaypoint = Waypoints[blockedWaypointIdx - 2];
						const BlockedWaypoint = Waypoints[blockedWaypointIdx - 1];
						if (!PreviousWaypoint) {
							warn("No previous waypoint, blocked cannot be validated.");
						}
						if (!BlockedWaypoint) {
							warn("Blocked waypoint doesn't exist, blocked cannot be validated.");
						}
						if (PreviousWaypoint && BlockedWaypoint) {
							const RayResults = game.Workspace.Raycast(
								PreviousWaypoint.Position,
								CFrame.lookAt(PreviousWaypoint.Position, BlockedWaypoint.Position).LookVector.mul(
									PreviousWaypoint.Position.sub(BlockedWaypoint.Position).Magnitude,
								),
								this.BlockedRaycastParams,
							);
							if (RayResults === undefined || (RayResults && RayResults.Instance === undefined)) {
								if (this.DebugVisualization) {
									warn(
										`[${this.ClassName}] DEBUG => Path was blocked at index ${
											blockedWaypointIdx - 1
										} -> ${blockedWaypointIdx} but will be ignored due the current BlockedRaycastParams.`,
									);
								}
								return;
							}
							instance_which_blocked = RayResults.Instance;
						}
					}
					this._addIndexFromDebugComputationInfo_BlockedIndex(blockedWaypointIdx - 1);
					this.Blocked.Fire(blockedWaypointIdx - 1, instance_which_blocked);
				}),
			);
			// unblocked
			this._dev.set(
				"unblockedConnection",
				path.Unblocked.Connect((index) => {
					const removed = this._removeIndexFromDebugComputationInfo_BlockedIndex(index - 1);
					if (removed) {
						this.Unblocked.Fire(index - 1);
					}
				}),
			);

			const getWaypoint = (index?: number): PathWaypoint | undefined => {
				return waypoints[index ?? (this._dev.get("currentWaypointIndex") as number)];
			};
			this._setWaypointIndex(0);
			const initialWaypoint = getWaypoint();
			if (!initialWaypoint) {
				// No waypoints?
				this.Completed.Fire(true, true);
				return;
			}
			// If there's a _customDoMoveAgent, we want to call it AFTER we connected to the reachedConnection
			// However for a tween, we need to do the DoMoveToAgent call first since it has to set the tween completed as the connection
			// ^ also happens for a humanoid which might cause an error if the event is fired before the connection is made (for the first try only, following humanoid tries will already be connected)
			if (this._dev.get("_customDoMoveAgent") === undefined) {
				this.DoMoveToAgent(initialWaypoint);
			}

			let LAST_DO_MOVE_TO_ENTRY_TICK = tick();

			if (this._dev.get("reachedConnection") === undefined) {
				this._dev.set(
					"reachedConnection",
					this.GetReachedConnect().Connect((reached: boolean) => {
						this.WaypointReached.Fire(
							getWaypoint()!,
							reached,
							// (this._dev.get("currentWaypointIndex") as number) === waypoints.size() - 1,
							(this._dev.get("currentWaypointIndex") as number) === waypoints.size(),
						);
						const nextIndx = (this._dev.get("currentWaypointIndex") as number) + 1;
						const nextWaypoint = getWaypoint(nextIndx);
						if (nextWaypoint) {
							this._setWaypointIndex(nextIndx);
							if (this.AutoMoveAgentOnWaypoint === false) {
								return;
							}
							if (LAST_DO_MOVE_TO_ENTRY_TICK - tick() < 1) {
								useFrameSkip.Wait(); // attempt to combat re-entrancy mostly for customDoMoveAgent
							}
							LAST_DO_MOVE_TO_ENTRY_TICK = tick();
							this.DoMoveToAgent(nextWaypoint);
						} else {
							this.DebugComputationInfo = undefined;
							_DisconnectDevEvent("reachedConnection");
							_DisconnectDevEvent("blockedConnection");
							_DisconnectDevEvent("unblockedConnection");
							this._setWaypointIndex(-1);
							this._CallCustomDoMoveAgentCleanup();
							this.Completed.Fire(reached);
						}
					}),
				);
			}
			// If there's a _customDoMoveAgent, we want to call it AFTER we connected to the reachedConnection
			// However for a tween, we need to do the DoMoveToAgent call first since it has to set the tween completed as the connection
			// ^ also happens for a humanoid which might cause an error if the event is fired before the connection is made (for the first try only, following humanoid tries will already be connected)
			if (this._dev.get("_customDoMoveAgent") !== undefined) {
				this.DoMoveToAgent(initialWaypoint);
			}
		} else {
			this.PathFailed = true;
			this.Failed.Fire(path.Status, r);
		}
	}
	/**
	 * @param Agent The Agent is the location at which the path will start.
	 * @param Destination The Destination is the location at which the path will end.
	 * @param AgentParameters These parameters will be used when computing the path.
	 * @param DoMoveAgentHandler For a custom DoMoveAgent handler, If set, will  call the `SetDoMoveToAgent` with the function you passed.
	 * View the `SetDoMoveToAgent` method for more information.
	 */
	constructor(
		public Agent: Instance | CFrame | Vector3 | undefined = undefined,
		public Destination: Instance | CFrame | Vector3 | undefined = undefined,
		public AgentParameters: AgentParameters | undefined = undefined,
		DoMoveAgentHandler?: Parameters<ComputedPath["SetDoMoveToAgent"]>[0],
	) {
		super("ComputedPath");
		this._setWaypointIndex(-1, true);
		this.Completed = new Signal();
		this.WaypointReached = new Signal();
		this.Computing = new Signal();
		this.Blocked = new Signal();
		this.Unblocked = new Signal();
		this.Failed = new Signal();
		this.CurrentWaypointIndexChanged = new Signal();

		if (DoMoveAgentHandler) {
			this.SetDoMoveToAgent(DoMoveAgentHandler);
		}

		// Create a new `mainPath` whenever the `AgentParameters` change, will also initiate the `mainPath`
		this.usePropertyEffect(() => {
			if (this._dev.get("mainPath") !== undefined) {
				(this._dev.get("mainPath") as PathfindingPath).Destroy();
			}
			this._dev.set("mainPath", PathfindingService.CreatePath(this.AgentParameters));
		}, ["AgentParameters"]);

		this.useDestroying(() => {
			this.Completed.Destroy();
			this.WaypointReached.Destroy();
			this.Computing.Destroy();
			this.Blocked.Destroy();
			this.Failed.Destroy();
			this.CurrentWaypointIndexChanged.Destroy();
		});

		this.Computing.Connect(() => {
			this.IsComputing = true;
		});
		this.Blocked.Connect(() => {
			this.IsComputing = false;
		});
		this.Failed.Connect(() => {
			this.IsComputing = false;
		});
		this.Completed.Connect(() => {
			this.IsComputing = false;
		});

		this.useReferenceInstanceBehaviour();

		// Debug visualization.
		this.usePropertyEffect(() => {
			if (this.DebugVisualization === true) {
				const c = this.CurrentWaypointIndexChanged.Connect(() => {
					if (this.DebugComputationInfo !== undefined) {
						// re-renders the Debug Info to display the new index.
						this.DebugComputationInfo = [...this.DebugComputationInfo];
					}
				});
				return () => {
					c.Disconnect();
				};
			}
		}, ["DebugVisualization"]);

		const DebugVisualizationColor = BrickColor.random();
		this.usePropertyEffect(() => {
			if (this.DebugVisualization === true) {
				const DebugVisualizationContainer = new Instance("Folder");
				DebugVisualizationContainer.Name = `DebugComputationInfo-${this.Name}-${this.ClassName}-${DebugVisualizationColor.Color}`;
				DebugVisualizationContainer.Parent = GetDebugVisualizationGizmosContainer(true);
				this._dev.DebugVisualizationContainer = DebugVisualizationContainer;

				const useDebugComputationInfo = this.usePropertyEffect(() => {
					if (this.DebugComputationInfo !== undefined) {
						const destinationVector = this.GetDestinationVector();
						const DebugVisualizationTexts: { Waypoint: PathWaypoint; TextLabel: TextLabel }[] = [];
						this.DebugComputationInfo.forEach((x, index) => {
							const visual = new Instance("Part");
							visual.Anchored = true;
							visual.CanCollide = false;
							visual.BrickColor = DebugVisualizationColor;
							visual.Material = Enum.Material.SmoothPlastic;
							visual.CFrame = CFrame.lookAt(x.Position, destinationVector);
							visual.Size = new Vector3(1, 1, 1);
							visual.Name = tostring(index + 1);
							const DebugVisualizationBillboardUI = new Instance("BillboardGui");
							DebugVisualizationBillboardUI.Name = "Billboard";
							DebugVisualizationBillboardUI.Size = UDim2.fromScale(100, 0.8);
							DebugVisualizationBillboardUI.StudsOffset = Vector3.yAxis;
							DebugVisualizationBillboardUI.AlwaysOnTop = true;
							DebugVisualizationBillboardUI.LightInfluence = 0;
							DebugVisualizationBillboardUI.Parent = visual;
							const DebugVisualizationTextLabel = new Instance("TextLabel");
							DebugVisualizationTextLabel.TextScaled = true;
							DebugVisualizationTextLabel.TextColor3 = Color3.fromRGB(255, 255, 255);
							DebugVisualizationTextLabel.Font = Enum.Font.GothamBold;
							DebugVisualizationTextLabel.TextStrokeTransparency = 0;
							DebugVisualizationTextLabel.BackgroundTransparency = 1;
							DebugVisualizationTextLabel.Size = UDim2.fromScale(1, 1);
							DebugVisualizationTextLabel.Parent = DebugVisualizationBillboardUI;
							DebugVisualizationTexts.push({
								TextLabel: DebugVisualizationTextLabel,
								Waypoint: x,
							});
							visual.Parent = DebugVisualizationContainer;
						});
						const useDebugComputationInfoBlockedIndex = this.usePropertyEffect(() => {
							DebugVisualizationTexts.forEach((v, i) => {
								const isBlocked: boolean = this.DebugComputationInfo_BlockedIndex.indexOf(i) !== -1;
								v.TextLabel.Text =
									(isBlocked ? "BLOCKED | " : "") +
									(this.PathFailed ? "PATH-FAILED | " : "") +
									`${i}. ${v.Waypoint.Label} | ${v.Waypoint.Action.Name}`;

								if (isBlocked || this.PathFailed) {
									v.TextLabel.TextColor3 = Color3.fromRGB(240, 38, 58);
								} else {
									const CurrentIndex = this.GetCurrentWaypointIndex();
									if (i < CurrentIndex) {
										v.TextLabel.TextColor3 = Color3.fromRGB(77, 232, 118);
									} else if (i === CurrentIndex) {
										v.TextLabel.TextColor3 = Color3.fromRGB(79, 188, 255);
									} else if (i === CurrentIndex + 1) {
										v.TextLabel.TextColor3 = Color3.fromRGB(255, 246, 222);
									} else {
										v.TextLabel.TextColor3 = Color3.fromRGB(255, 255, 255);
									}
								}
							});
						}, ["DebugComputationInfo_BlockedIndex", "PathFailed"]);
						return () => {
							DebugVisualizationTexts.clear();
							useDebugComputationInfoBlockedIndex.Destroy();
							DebugVisualizationContainer.ClearAllChildren();
						};
					}
				}, ["DebugComputationInfo"]);
				return () => {
					DebugVisualizationContainer.Destroy();
					useDebugComputationInfo.Destroy();
				};
			}
		}, ["DebugVisualization"]);

		// Automove on destination changed if `AutoMoveDestination` is true.
		this.usePropertyEffect(() => {
			if (this.Destination && this.AutoMoveDestination) {
				this.Compute();
			}
		}, ["Destination", "AutoMoveDestination"]);

		// Following the destination.
		this.usePropertyEffect(() => {
			if (this.FollowDestination === true) {
				let lastPos = this.Destination ? this.GetDestinationVector() : new Vector3();

				const render = useFrameSkip.Connect(() => {
					if (this.Destination !== undefined) {
						const cDV3 = this.GetDestinationVector();
						if (cDV3.sub(lastPos).Magnitude > this.FollowDestinationMagnitude) {
							lastPos = cDV3;
							this.Compute();
						}
					}
				});
				return () => {
					render.Disconnect();
				};
			}
		}, ["FollowDestination"]);
	}
}
