import { threader } from "@mekstuff-rbxts/threader";
import { Pseudo } from "./Pseudo";
import { _typeIs } from "./typeIs";

type PROMISE_RESOLVE<T> = (value: T | Promise<T>) => void;
type PROMISE_REJECT = (reason?: unknown) => void;
type PROMISE_onCANCEL = (abortHandler?: () => void) => boolean;

/**
 * A `Servant-Promise`.
 *
 * When the `Promise` is `resolved` or `rejected`, the execution thread will stop executing
 *
 * `sp` also has a 4th param of `servant` which is a `Servant` that can be used during the lifetime of the execution thread.
 * It is useful for storing objects/connections that are related to the running Promise.
 *
 * Your callback is wrapped inside of a `threader`.
 *
 * To end execution thread on cancel, you need to manually do it
 *
 * ```ts
 * new Promise<void>(
 * 	sp((_, __, onCancel, PromiseServant, PromiseThreader)
 * 		onCancel(() => {
 * 			PromiseServant.Destroy(); //Destroys the servant, and stops the PromiseThreader, this is the recommended method
 * 			PromiseThreader.tryClose(); //Closes the threader, if you chose to do it this way remember to cleanup the PromiseServant sufficiently
 * 		});
 * 	}),
 * );
 * ```
 */
export function ServantPromise<T>(
	callback: (
		resolve: PROMISE_RESOLVE<T>,
		reject: PROMISE_REJECT,
		onCancel: PROMISE_onCANCEL,
		servant: Servant,
		threader: threader,
	) => void,
) {
	return (resolve: PROMISE_RESOLVE<T>, reject: PROMISE_REJECT, onCancel: PROMISE_onCANCEL) => {
		let executionServant: Servant | undefined = new Servant();
		const customResolve: PROMISE_RESOLVE<T> = (value) => {
			if (executionServant !== undefined) {
				resolve(value);
				executionServant.Destroy();
				executionServant = undefined;
			}
		};
		const customReject: PROMISE_REJECT = (value) => {
			if (executionServant !== undefined) {
				reject(value);
				executionServant.Destroy();
				executionServant = undefined;
			}
		};
		if (executionServant !== undefined) {
			executionServant.Keep((threader) => {
				const [s, r] = pcall(() => {
					callback(customResolve, customReject, onCancel, executionServant!, threader);
				});
				if (s === false) {
					customReject(r);
				}
			});
		}
	};
}

export type ServantTrackableItem = RBXScriptConnection | Pseudo<any> | Instance | thread | threader | Callback | {}; // eslint-disable-line @typescript-eslint/no-explicit-any
export class Servant extends Pseudo<{
	_servanttracker: Record<string | number, ServantTrackableItem>;
}> {
	/**Connects to the script signal then calls :Keep on the connection*/
	Connect(Signal: RBXScriptSignal<Callback>, Callback: Callback): LuaTuple<ServantTrackableItem[]> {
		return this.Keep(Signal.Connect(Callback));
	}
	Keep<T extends ServantTrackableItem>(TrackableId: string, TrackableItem: T): T;
	Keep<T extends ServantTrackableItem[]>(...TrackableItems: T): LuaTuple<T>;
	/**
	 * The Item will be cleaned up with the `Servant` when destroyed.
	 */
	Keep(
		TrackId: string | ServantTrackableItem,
		...TrackableItems: ServantTrackableItem[]
	): LuaTuple<unknown[]> | unknown {
		const servanttracker = this._dev._servanttracker;
		const add_trackable_item = (item: ServantTrackableItem, id: string) => {
			let pushValue: ServantTrackableItem = item;
			if (typeIs(item, "function")) {
				const thread = new threader(
					() => {
						item(thread);
					},
					undefined,
					true,
				);
				pushValue = thread;
				thread.active = true;
			}
			if (typeIs(item, "Instance") || _typeIs(item, "Pseudo")) {
				const trackInstanceDestroyedId = id + `-instance-track`;
				this.Keep(
					trackInstanceDestroyedId,
					item.Destroying.Connect(() => {
						this.Free(TrackId, trackInstanceDestroyedId);
					}),
				);
			}
			servanttracker[id] = pushValue;
		};
		if (typeIs(TrackId, "string")) {
			const TrackableItem = TrackableItems[0];
			assert(
				TrackableItems,
				'You need to provide a trackable item as the second argument whenever you\'re using "Keep" with the first argument being a string (id)',
			);
			if (servanttracker[TrackId] !== undefined) {
				warn(
					`Conflict with :Keep track ids, the id "${TrackableItem}" already existed, the previous element will be free`,
				);
				this.Free(TrackableItem);
			}
			add_trackable_item(TrackableItem, TrackId);
			return TrackableItems;
		}
		TrackableItems.push(TrackId);
		TrackableItems.forEach((e) => {
			add_trackable_item(e, tostring(math.random()));

			// this._dev._servanttracker[tostring(math.random())] = pushValue;
		});
		return $tuple(...TrackableItems);
	}
	/**
	 * "Frees" the trackable item, meaning it will not be cleaned up now or whenever the `Servant` is destroyed, it will no longer be bounded to the `Servant`.
	 */
	Free(...TrackableItems: (string | ServantTrackableItem)[]): void {
		const servanttracker = this._dev._servanttracker;
		TrackableItems.forEach((e) => {
			if (typeIs(e, "string")) {
				this._DestroyTrackedItem(servanttracker[e]);
				delete servanttracker[e];
			} else {
				for (const [i, b] of pairs(servanttracker)) {
					if (b === e) {
						delete servanttracker[i];
						break;
					}
				}
			}
		});
	}
	/**
	 * Disconnect/Destroyes/Cleansup the item
	 *
	 * You can pass the item or the unique identifier for that item if any.
	 *
	 * ```ts
	 * mainServant.Keep(
	 *	game.Workspace.GetPropertyChangedSignal("DistributedGameTime").Connect(() => {
	 *		print(game.Workspace.DistributedGameTime);
	 *	}),
	 *		"uid",
	 *	);
	 *
	 *	task.delay(4, () => {
	 *		mainServant.Purge("uid");
	 *  });
	 *
	 *```
	 */
	Purge(...TrackableItems: (string | ServantTrackableItem)[]): void {
		const servanttracker = this._dev._servanttracker;
		TrackableItems.forEach((e) => {
			if (typeIs(e, "string")) {
				this._DestroyTrackedItem(servanttracker[e]);
				delete servanttracker[e];
			} else {
				for (const [i, b] of pairs(servanttracker)) {
					if (b === e) {
						this._DestroyTrackedItem(b);
						delete servanttracker[i];
						break;
					}
				}
			}
		});
	}
	/**
	 * This will go through all tracked items and if they are no longer operational they will be removed from the tracked item list for them to
	 * be properly garbaged collected.
	 */
	Clean() {
		// no need to clean Instances/Pseudos since they are immediately cleaned when destroyed.
		const servanttracker = this._dev._servanttracker;
		for (const [i, v] of pairs(servanttracker)) {
			if (typeIs(v, "RBXScriptConnection")) {
				if (v.Connected === false) {
					delete servanttracker[i];
				}
				continue;
			}
		}
	}
	//
	_DestroyTrackedItem(Item: unknown): void {
		type DestructableItem = {
			Destroy?: () => void;
			Disconnect?: () => void;
		};
		if (Item !== undefined) {
			if (typeIs(Item, "RBXScriptConnection")) {
				Item.Disconnect();
				return;
			} else if (typeIs(Item, "Instance")) {
				Item.Destroy();
				return;
			}
			const destructable: DestructableItem = Item as DestructableItem;
			pcall(() => {
				if (destructable.Destroy) {
					destructable.Destroy();
				}
				if (destructable.Disconnect) {
					destructable.Disconnect();
				}
			});
		}
	}
	constructor() {
		super("Servant");
		this._dev._servanttracker = {};
	}
}
