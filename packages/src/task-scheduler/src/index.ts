/* eslint-disable roblox-ts/no-private-identifier */
declare global {
	namespace PHe {
		interface Pseudos {
			TaskScheduler: TaskScheduler;
		}
		interface CreateablePseudos {
			TaskScheduler: TaskScheduler;
		}
	}
}

import { Pseudo, threader } from "@mekstuff-rbxts/core";
import { Servant, sp } from "@mekstuff-rbxts/servant";
import { Signal } from "@mekstuff-rbxts/signal";

const RunService = game.GetService("RunService");
const HttpService = game.GetService("HttpService");
const useStepped = RunService.IsClient() ? RunService.RenderStepped : RunService.Stepped;

export type TaskSchedulerExtendDefault = {
	default: unknown;
} & object;

/**
 * Returns a `GUID`
 */
function generateRandomTaskName(): string {
	return HttpService.GenerateGUID();
}

let GROUP_PRIORITES: { name: string; priority: number }[] = [{ name: "default", priority: 1 }];

export type TaskSchedulerPushMethods = Pick<TaskScheduler, "atIndex" | "atStart" | "atEnd" | "atNext" | "atNow">;

type manualCompleteTask = {
	/**
	 * Sets the task to manually completed, you should set this at the beginning of the task `action`
	 * Make sure to call the `complete` function else your task will be running indefinitly
	 */
	setManualComplete: () => void;
	/**Alias for setManualComplete*/
	manual: () => void;
	/**
	 * call `setManualComplete` before calling `complete`. `complete` can be used in non-sync task functions, for e.g in a promise
	 * or event callback.
	 */
	complete: () => void;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never;

export type TaskAction<propType = unknown> = (
	prop: propType,
	taskServant: Servant,
	taskThread: threader,
	manualComplete: manualCompleteTask,
) => propType;

type taskProperties<T> = {
	/**
	 * The group of the task, will default to `default`. different groups can have different values, introduction to different behaviour per group
	 * may be added.
	 */
	group: T;
	/**
	 * The action of the task, this will be called when the task is at the top of the scheduler.
	 */
	action: TaskAction;
	/**
	 * Optional `name` for the task
	 */
	name: string;
	/**
	 * exits the `scheduler` on error, this will stop executing the task and any remaining tasks will not be executed.
	 *
	 * If `onError` is set, this will be ignored.
	 */
	exitOnError?: boolean;
	/**
	 * Handle errors, returning `true` will end/exit the scheduler.
	 */
	onError?: (err: unknown) => true | void;
	/**
	 * @param taskServant You should not `Destroy` this `Servant` as it is cleaned up by itself, it is only passed in cases
	 * where you need to add some last minute cleanup objects.
	 */
	onFinish?: (completed: boolean, taskServant: Servant) => void;
	/**
	 * Readonly property of the sorted index of the task
	 */
	readonly index?: number;
	/**
	 * The higher the priority, the higher up the task will be considered in the task scheduler.
	 * If `task A` was added with an initial_index of 1 and `task 2` was also added with an initial_index of 1
	 * By default the task that was added first will be executed, however if either task has a higher priority over
	 * another, it will be executed first.
	 */
	readonly priority?: number;
	readonly initial_index: number;
	readonly tick_stamp: number;
};

type groupParam<T> = T | Partial<Omit<taskProperties<T>, "index" | "initial_index" | "tick_stamp" | "action">>;

let LAST_EXECUTED_GROUP = "";

/**
 * Executes `tasks` in a scheduled sequential manner.
 *
 * The order in which tasks are executed are as followed:
 *
 * Tasks with lower `indexes` will execute first. e.g. `task1` with index of `1` will execute before `task2` with index of `2`.
 * Tasks can have priorities, so if `task1` has an index of `1` with a priority of `1`  and `task2` has an index of `1` also but a priority of `2`, `task2` will
 * be executed first as it has a higher priority.
 * If both the `index` and `priority` of tasks are the same, they will be executed by the order in which they were added to the scheduler.
 *
 * `Tasks` are always attempted to be executed by the group of which they belong to. So if `task1` is of `group1` and `task2` is of `group2`, and another `task3` was added
 * while `task1` *(or another group 1 task)* is still active, `task3` will preceed before `task2`. You can define predetermined group priorties within the `constructor`
 * or by using the `SetGroupPriority` method.
 */
export class TaskScheduler<groups extends TaskSchedulerExtendDefault = TaskSchedulerExtendDefault> extends Pseudo<{
	_activeExecutingPromise: Promise<void> | undefined;
	_currentActiveTarget: taskProperties<unknown> | undefined;
	renderConnection: RBXScriptConnection | undefined;
}> {
	/**
	 * Calling `atIndex` automatically starts the `task-scheduler` whenever a task is added.
	 */
	public auto = true;
	public running = false;
	public UnOrderedScheduler: taskProperties<keyof groups>[] = [];
	public Scheduler: taskProperties<unknown>[] = [];

	private groupValues: Map<string, unknown> = new Map();

	/**
	 * Sorts the scheduler tasks in order
	 */
	public SortScheduler() {
		const Groups: Map<keyof groups, taskProperties<keyof groups>[]> = new Map();
		this.UnOrderedScheduler.forEach((x) => {
			if (Groups.get(x.group) === undefined) {
				Groups.set(x.group, []);
			}

			Groups.get(x.group)!.push(x);
		});

		Groups.forEach((v, k) => {
			Groups.set(
				k,
				v.sort((a, b) => {
					if (a.priority === b.priority && a.initial_index === b.initial_index) {
						return a.tick_stamp < b.tick_stamp;
					}
					if (a.priority === b.priority && a.initial_index !== b.initial_index) {
						return a.initial_index < b.initial_index;
					}
					if (a.initial_index === b.initial_index && a.priority !== b.priority) {
						return (a.priority ?? 1) > (b.priority ?? 1);
					}
					return (a.priority ?? 1) < (b.priority ?? 1);
				}),
			);
		});
		let TASKS_IN_FULL_ORDER: taskProperties<keyof groups>[] = [];
		GROUP_PRIORITES.forEach(({ name }) => {
			const target = Groups.get(name as keyof groups);
			if (target) {
				TASKS_IN_FULL_ORDER = [...TASKS_IN_FULL_ORDER, ...target];
			}
		});

		this.Scheduler = TASKS_IN_FULL_ORDER;
	}
	/**
	 * Adds the current active task to the unOrdered list keeping it's original values and cancels the current execution of it
	 */
	private resetCurrentTask() {
		if (this._dev._currentActiveTarget !== undefined && this._dev._activeExecutingPromise !== undefined) {
			this.atIndex(this._dev._currentActiveTarget.action, {
				group: this._dev._currentActiveTarget.group as "default",
				initial_index: this._dev._currentActiveTarget.initial_index,
				tick_stamp: this._dev._currentActiveTarget.tick_stamp,
				exitOnError: this._dev._currentActiveTarget.exitOnError,
				name: this._dev._currentActiveTarget.name,
				onError: this._dev._currentActiveTarget.onError,
			});
			this._dev._activeExecutingPromise.cancel();
			this._dev._activeExecutingPromise = undefined;
			this._dev._currentActiveTarget = undefined;
		}
	}
	/**
	 * Stops the execution of the current task if any
	 */
	private endCurrentTask() {
		if (this._dev._currentActiveTarget !== undefined && this._dev._activeExecutingPromise !== undefined) {
			this._dev._activeExecutingPromise.cancel();
			this._dev._activeExecutingPromise = undefined;
			this._dev._currentActiveTarget = undefined;
		}
	}
	/**
	 * Sets the priority of a group.
	 *
	 * e.g. if group1 has a priority of 2, since default as a priority of 1, `group1` will be able to override using `atNow`,
	 * and just like normal any preceeding task with the `group1` group name will execute before returning to the default group if
	 * the hault method was `reset`.
	 */
	SetGroupPriority(group: { [k in keyof groups]?: number }): void;
	SetGroupPriority(group: keyof groups, priority: number): void;
	SetGroupPriority(group: keyof groups | { [k in keyof groups]?: number }, priority?: number) {
		if (typeIs(group, "string") && priority !== undefined) {
			GROUP_PRIORITES = GROUP_PRIORITES.filter((x) => x.name !== group);
			GROUP_PRIORITES.push({ name: group as string, priority: priority });
		} else {
			for (const [a, b] of pairs(group as Record<keyof groups, number>)) {
				GROUP_PRIORITES = GROUP_PRIORITES.filter((x) => x.name !== a);
				GROUP_PRIORITES.push({ name: a as string, priority: b as number });
			}
		}
		GROUP_PRIORITES.sort((a, b) => a.priority > b.priority);
	}
	GetGroupPriority(group: keyof groups): number | undefined {
		const t = GROUP_PRIORITES.find((x) => x.name === group);
		if (t) {
			return t.priority;
		}
	}
	/**
	 * Removes all tasks within the given group
	 */
	RemoveTasksByGroup(group: keyof groups) {
		const TasksByGroup = this.UnOrderedScheduler.map((x) => {
			if (x.group === group) {
				return x;
			}
			return undefined as never;
		});
		if (TasksByGroup.size() > 0) {
			this.remove(
				TasksByGroup.map((x) => x.name),
				group,
			);
		}
	}
	/**
	 * Starts the execution of the `scheduler`. Using `atIndex` will automatically trigger starting so you
	 * should not manually call this.
	 */
	start() {
		if (this._dev.renderConnection !== undefined) {
			return;
		}
		this.running = true;
		let executingTask = false;
		this._dev.renderConnection = useStepped.Connect(() => {
			if (executingTask) {
				return;
			}
			this.SortScheduler();
			const length = this.Scheduler.size();
			if (length === 0) {
				return this.end();
			}
			const target = this.Scheduler[0];
			LAST_EXECUTED_GROUP = target.group as string;
			executingTask = true;
			let _ps: Servant;
			this._dev._activeExecutingPromise = new Promise<void>(
				sp((resolve, _, onCancel, ps, thread) => {
					_ps = ps;
					onCancel(() => {
						if (target.onFinish) {
							target.onFinish(false, ps);
						}
						ps.Destroy();
					});
					let MANUALLY_COMPLETE = false;
					const manualComplete: manualCompleteTask = {
						manual: () => {
							return manualComplete.setManualComplete();
						},
						setManualComplete: () => {
							MANUALLY_COMPLETE = true;
						},
						complete: () => {
							if (MANUALLY_COMPLETE === false) {
								warn(
									`You called .complete but "setManualComplete" was not called. This may be a mistake and result in unexpected behaviour.`,
								);
							}
							resolve();
						},
					};
					const targetGroupName = (target.group as string) ?? "default";
					this._dev._currentActiveTarget = target;
					this.groupValues.set(
						targetGroupName,
						target.action(this.groupValues.get(targetGroupName), ps, thread, manualComplete),
					);
					if (!MANUALLY_COMPLETE) {
						resolve();
					}
				}),
			)
				.then(() => {
					if (target.onFinish) {
						target.onFinish(true, _ps);
					}
				})
				.catch((err) => {
					if (target.onError) {
						const res = target.onError(err);
						if (target.onFinish) {
							target.onFinish(false, _ps);
						}
						if (res === true) {
							this.end(err);
							return;
						}
					} else {
						warn(err);
					}
					if (target.exitOnError === true && target.onError === undefined) {
						this.end(err);
					}
				})
				.finally(() => {
					// LAST_EXECUTED_GROUP = "";
					this._dev._currentActiveTarget = undefined;
					this._dev._activeExecutingPromise = undefined;
					//TODO: maybe use a different filter so we can break whenever we find match.
					this.UnOrderedScheduler = this.UnOrderedScheduler.filter((x) => x !== target);
					executingTask = false;
				});
		});
	}

	/**
	 * Stops the execution of the `scheduler`
	 *
	 * @param stopRunningTask If a task is currently running, end it's execution instantly.
	 */
	stop(stopRunningTask?: boolean) {
		if (this._dev.renderConnection) {
			this._dev.renderConnection.Disconnect();
			this._dev.renderConnection = undefined;
		}
		if (stopRunningTask === true) {
			this.resetCurrentTask();
		}
		this.running = false;
	}
	/**
	 * Fired whenever the `end` method is called.
	 *
	 * Passes `err` as first argument if there was an error.
	 */
	Ended: Signal<(err?: string) => void> = new Signal();
	/**
	 * Yields until the `Ended` event is fired
	 * @yields
	 */
	AwaitEnd() {
		return this.Ended.Wait()[0];
	}
	/**
	 * Stops the execution of the `scheduler` and removes all tasks.
	 */
	end(err?: string) {
		this.stop();
		this.endCurrentTask();
		this.UnOrderedScheduler.clear();
		this.Scheduler.clear();
		this.groupValues.clear();
		this.Ended.Fire(err);
	}
	/**
	 * Makes the task executes now, if a current task is running you can `reset` or `shift` it
	 *
	 * Adds with an initial_index of `0`
	 *
	 * @param haultMethod defaults to `reset`
	 * shift - Current task executing task if any will be considered complete and removed from the scheduler
	 *
	 * reset - will stop the task from executing but will not remove it from the scheduler, it will run again when it's back at the top of the scheduler, cleanup functions will be called as usual but with a second param `true` which signifies reset
	 */
	atNow<T extends keyof groups, U = groups[T]>(
		task: (prop: U, servant: Servant, thread: threader, manualComplete: manualCompleteTask) => U,
		group?: groupParam<T>,
		haultMethod?: "reset" | "shift",
	): ReturnType<TaskScheduler["atIndex"]> {
		if (group === undefined || typeIs(group, "string")) {
			group = { group: group as T };
		}
		haultMethod = haultMethod ?? "reset";
		const _activeExecutingPromise = this._dev._activeExecutingPromise;
		if (haultMethod !== undefined && _activeExecutingPromise !== undefined) {
			if (haultMethod === "reset") {
				// add it back to the unordered list, keeping the same values
				this.resetCurrentTask();
			} else if (haultMethod === "shift") {
				//cancelling will remove from the unordered list, no need to remove here.
				_activeExecutingPromise.cancel();
			}
			this.SortScheduler(); //resort
		}
		const x = group as taskProperties<T>;
		return this.atIndex(task, { ...x, initial_index: 0, tick_stamp: tick() });
	}
	/**
	 * Adds to the top of the list, something is currently being executed, this
	 * task will be executed after
	 *
	 * Adds with an initial_index of `1`
	 */
	atNext<T extends keyof groups, U = groups[T]>(
		task: (prop: U, servant: Servant, thread: threader, manualComplete: manualCompleteTask) => U,
		group?: groupParam<T>,
	): ReturnType<TaskScheduler["atIndex"]> {
		if (group === undefined || typeIs(group, "string")) {
			group = { group: group as T };
		}
		const x = group as taskProperties<T>;
		return this.atIndex(task, { ...x, initial_index: 1, tick_stamp: tick() });
	}
	/**
	 * Adds the task at the start of the scheduler.
	 *
	 * Adds with an initial_index of `2`
	 */
	atStart<T extends keyof groups, U = groups[T]>(
		task: (prop: U, servant: Servant, thread: threader, manualComplete: manualCompleteTask) => U,
		group?: groupParam<T>,
	): ReturnType<TaskScheduler["atIndex"]> {
		if (group === undefined || typeIs(group, "string")) {
			group = { group: group as T };
		}
		const x = group as taskProperties<T>;
		return this.atIndex(task, { ...x, initial_index: 2, tick_stamp: tick() });
	}
	/**
	 * Adds the task at the end of the scheduler.
	 *
	 * Adds with an initial_index of `1e4`
	 */
	atEnd<T extends keyof groups, U = groups[T]>(
		task: (prop: U, servant: Servant, thread: threader, manualComplete: manualCompleteTask) => U,
		group?: groupParam<T>,
	): ReturnType<TaskScheduler["atIndex"]> {
		if (group === undefined || typeIs(group, "string")) {
			group = { group: group as T };
		}
		const x = group as taskProperties<T>;
		return this.atIndex(task, { ...x, initial_index: 1e4, tick_stamp: tick() });
	}
	/**
	 * Push a list of tasks
	 *
	 * @param method The method to use, if you use `atNow`, only the first task will be `atNow`, preceeding tasks will be `atNext`.
	 */
	push<T extends keyof groups, M extends keyof TaskSchedulerPushMethods, U = groups[T]>(
		tasks: ((prop: U, servant: Servant, thread: threader, manualComplete: manualCompleteTask) => U)[],
		method?: M,
		group?: groupParam<T>,
		...args: Parameters<OmitFirstArg<OmitFirstArg<TaskScheduler[M]>>>
	): ReturnType<TaskScheduler["atIndex"]>[] {
		const nameids: ReturnType<TaskScheduler["atIndex"]>[] = [];
		tasks.forEach((x, index) => {
			let useMethod = method ?? "atStart";
			if (method === "atNow" && index > 0) {
				useMethod = "atNext";
			}
			const v = this as unknown as { [key: string]: Callback };
			nameids.push(v[useMethod](this, x, group, ...args));
		});
		return nameids;
	}
	/**
	 * Adds the task at the index of the scheduler
	 */
	atIndex<T extends keyof groups, U = groups[T]>(
		task: (prop: U, servant: Servant, thread: threader, manualComplete: manualCompleteTask) => U,
		group?: Omit<taskProperties<T>, "action">,
	): string {
		const useTaskName = group !== undefined ? group.name ?? generateRandomTaskName() : generateRandomTaskName();
		const pushData: taskProperties<T> =
			group === undefined
				? ({
						name: useTaskName,
						group: "default" as T,
						initial_index: 2,
						tick_stamp: tick(),
						priority: 1,
						action: task,
				  } as taskProperties<T>)
				: ({
						name: useTaskName,
						group: group.group ?? ("default" as T),
						initial_index: group.initial_index ?? 2,
						tick_stamp: group.tick_stamp ?? tick(),
						priority: group.priority ?? 1,
						exitOnError: group.exitOnError,
						onFinish: group.onFinish,
						onError: group.onError,
						action: task,
				  } as taskProperties<T>);
		this.UnOrderedScheduler.push(pushData);
		if (this.auto === true) {
			this.start();
		}
		return useTaskName;
	}
	/**
	 * This executes the action `atFreeWill`, meaning it will not be included and sorted in the scheduler. it does not wait on sorted scheduler tasks nor any other `FreeWill` tasks.
	 * however it will behave similarly, passing a servant and a threader, and returning a value from the task will change the group value as usual.
	 *
	 * `atFreeWill` returns a `Promise` which you can `.await()` to have asynchronous behaviour which is perfect if you're attempting to execute tasks within a scheduled task.
	 *
	 * Properties like initial_index, tick_stamp, priority or any other sorting properties are ignored.
	 */
	atFreeWill<T extends keyof groups, U = groups[T]>(
		task: (prop: U, servant: Servant, thread: threader, manualComplete: manualCompleteTask) => U,
		group?: groupParam<T>,
	): Promise<void> {
		const target = (
			typeIs(group, "table")
				? {
						name: group.name ?? math.random(),
						group: group.group ?? ("default" as T),
						// initial_index: group.initial_index ?? 2,
						// tick_stamp: group.tick_stamp ?? tick(),
						// priority: group.priority ?? 1,
						exitOnError: group.exitOnError,
						onFinish: group.onFinish,
						onError: group.onError,
						action: task,
				  }
				: typeIs(group, "string")
				? {
						name: math.random(),
						group: "default" as T,
						// initial_index: 2,
						// tick_stamp: tick(),
						// priority: 1,
						action: task,
				  }
				: {
						name: math.random(),
						group: "default" as T,
						action: task,
				  }
		) as taskProperties<T>;
		let _ps: Servant;
		return new Promise<void>(
			sp((resolve, _, onCancel, ps, thread) => {
				_ps = ps;
				onCancel(() => {
					if (target.onFinish) {
						target.onFinish(false, ps);
					}
					ps.Destroy();
				});
				let MANUALLY_COMPLETE = false;
				const manualComplete: manualCompleteTask = {
					manual: () => {
						return manualComplete.setManualComplete();
					},
					setManualComplete: () => {
						MANUALLY_COMPLETE = true;
					},
					complete: () => {
						if (MANUALLY_COMPLETE === false) {
							warn(
								`You called .complete but "setManualComplete" was not called. This may be a mistake and result in unexpected behaviour.`,
							);
						}
						resolve();
					},
				};
				const targetGroupName = (target.group as string) ?? "default";
				// this._dev._currentActiveTarget = target;
				this.groupValues.set(
					targetGroupName,
					target.action(this.groupValues.get(targetGroupName), ps, thread, manualComplete),
				);
				if (!MANUALLY_COMPLETE) {
					resolve();
				}
			}),
		)
			.then(() => {
				if (target.onFinish) {
					target.onFinish(true, _ps);
				}
			})
			.catch((err) => {
				if (target.onError) {
					const res = target.onError(err);
					if (target.onFinish) {
						target.onFinish(false, _ps);
					}
					if (res === true) {
						this.end(err);
						return;
					}
				} else {
					warn(err);
				}
				if (target.exitOnError === true && target.onError === undefined) {
					this.end(err);
				}
			});
	}
	/**
	 * Remove a task from the scheduler
	 */
	remove(taskName: string | string[], group: keyof groups) {
		const initialRunningState = this.running;
		const initialAutoState = this.auto;
		this.auto = false;
		const runRemove = (name: string) => {
			const currentlyRunning = this.Scheduler[0];
			if (currentlyRunning && currentlyRunning.name === name && currentlyRunning.group === group) {
				this.stop(true);
			}
			this.UnOrderedScheduler = this.UnOrderedScheduler.filter((x) => {
				return x.name !== name && x.group !== group;
			});
		};
		typeIs(taskName, "string") ? runRemove(taskName) : taskName.forEach((x) => runRemove(x));
		this.SortScheduler();
		this.auto = initialAutoState;
		if (initialRunningState === true) {
			this.start();
		}
	}
	constructor(GroupPriorities?: { [k in keyof groups]?: number }) {
		super("TaskScheduler");
		if (GroupPriorities !== undefined) {
			for (const [a, b] of pairs(GroupPriorities)) {
				this.SetGroupPriority(a as keyof groups, b as number);
			}
		}
		this.usePropertyRender(() => {
			if (this.auto === true) {
				this.start();
			}
		}, ["auto"]);
	}
}
