/* eslint-disable roblox-ts/no-private-identifier */
import { Engine, Pseudo } from "@mekstuff-rbxts/core";
import { stcnetServer } from "./stcnet_server";
import { Servant } from "@mekstuff-rbxts/servant";
import {
	ClientTapIntoDictionary,
	ImitationServiceClient as ImitationService,
} from "@mekstuff-rbxts/imit/out/ImitationServiceClient";

declare global {
	interface stcnetControllers {}
}

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never; // eslint-disable-line @typescript-eslint/no-explicit-any
type ServiceProxy<T extends stcnetServer> = {
	[K in keyof T["client"]]: T["client"][K] extends Callback
		? OmitFirstArg<T["client"][K]>
		: K extends "$props"
		? Readonly<T["client"][K]> &
				Readonly<{
					/**
					 * Uses the `receive` method of the `ClientImitator`. Information sent from the server with `send` will trigger this function.
					 */
					$receive: (
						...args: Parameters<PHe.Pseudos["ClientImitator"]["receive"]>
					) => ReturnType<PHe.Pseudos["ClientImitator"]["receive"]>;
					/**
					 * Uses the `send` method of the `ClientImitator` to send information to the server.
					 */
					$send: (
						...args: Parameters<PHe.Pseudos["ClientImitator"]["send"]>
					) => ReturnType<PHe.Pseudos["ClientImitator"]["send"]>;
					/**
					 * Yields until `Replicator` is ready. If you plan to use the `$props` property or `_observe`, You should
					 * call this function before doing so.
					 * 
					 The `Servant` that is returned is used for the entirety of the ServiceProxy, so be mindful of destroying it.
					 */
					$await: () => Servant;
					/**
					 * Uses the `on` method of Imitators. Learn more from `ImitationService`.
					 */
					$on: <_K extends keyof T["client"][K]>(
						k: _K,
						callback: (
							value: T["client"][K][_K],
							servant: Servant,
							key: string,
						) => void | ((isDestroying?: boolean) => void),
					) => void;
					/**
					 * Uses the `dict` method of Imitators. Learn more from `ImitationService`.
					 */
					$dict: <
						_T extends keyof T["client"][K],
						_K extends keyof ClientTapIntoDictionary<T["client"][K][_T]>,
						_V extends ClientTapIntoDictionary<T["client"][K][_T]>[_K],
					>(
						k: _T,
						callback: (key: _K, value: _V) => void | ((removed?: boolean, isDestroying?: boolean) => void),
					) => Servant;
					/**
					 * Returns the id of the imitation of the $props.
					 */
					$id: string;
				}>
		: T["client"][K] extends RemoteEvent
		? T["client"][K]
		: never;
};

const ServiceProxyEntries = new Map<string, unknown>();

export function GetService<T extends keyof stcnetServices>(ServiceName: T): Promise<ServiceProxy<stcnetServices[T]>> {
	return new Promise((resolve) => {
		const _p = ServiceProxyEntries.get(ServiceName);
		if (_p !== undefined) {
			return resolve(_p as ServiceProxy<stcnetServices[T]>);
		}
		const _stcnet = Engine.FetchReplicatedStorage().WaitForChild("@stcnet");
		const _service = _stcnet.WaitForChild(ServiceName);
		const _rfs = _service.WaitForChild("rfs");
		const _res = _service.WaitForChild("res");

		let props_TapIn: Servant | undefined;
		let observefunc: unknown;
		let sendfunc: unknown;
		let receivefunc: unknown;
		let observeDictfunc: unknown;
		let _tapinID: string;
		let props_rep_table: unknown;

		const await_props_rep_table = () => {
			if (props_rep_table === undefined) {
				new Promise<void>((resolve) => {
					let x = true;
					let i = 0;
					while (x === true) {
						if (i === 20) {
							warn(`$await on $props for "${ServiceName}" is taking longer than usual.`);
						}
						if (props_rep_table !== undefined) {
							x = false;
							resolve();
							break;
						}
						i++;
						task.wait(0.1);
					}
				}).await();
			}
			return props_TapIn;
		};

		const props_metatable = setmetatable(
			{},
			{
				__newindex: () => {
					throw "You cannot assign values to $props from client.";
				},
				__index: (_, k) => {
					if (k === "_await" || k === "$await") {
						return await_props_rep_table;
					} else {
						if (props_rep_table === undefined) {
							throw `$props were not received as yet. Use $await to yield until $props are ready!`;
						}
						if (k === "_id" || k === "$id") {
							return _tapinID;
						}
						if (k === "_on" || k === "$on") {
							return observefunc;
						}
						if (k === "_dict" || k === "$dict") {
							return observeDictfunc;
						}
						if (k === "$send") {
							return sendfunc;
						}
						if (k === "$receive") {
							return receivefunc;
						}
						return (props_rep_table as { [key: string]: unknown })[k as string];
					}
				},
			},
		);
		const ServiceProxy = setmetatable(
			{},
			{
				__index: (_, key) => {
					if (!typeIs(key, "string")) {
						throw `The index of a Service Proxy must be of type string, Got ${typeOf(key)}`;
					}
					if (key === "$props") {
						if (props_TapIn === undefined) {
							const props_ = _rfs.FindFirstChild("$props") as StringValue;
							if (props_ === undefined) {
								warn(`No $props found.`);
							}
							const targetId = props_.Value;
							_tapinID = targetId;
							const split = targetId.split("/");

							props_TapIn = ImitationService.tapIn(split[0] as never, split[1], (ci) => {
								observefunc = (...args: unknown[]) => {
									return ci.on(...(args as Parameters<(typeof ci)["on"]>));
								};
								sendfunc = (...args: unknown[]) => {
									return ci.send(...(args as Parameters<(typeof ci)["send"]>));
								};
								receivefunc = (...args: unknown[]) => {
									return ci.receive(...(args as Parameters<(typeof ci)["receive"]>));
								};
								observeDictfunc = (...args: unknown[]) => {
									return ci.dict(...(args as Parameters<(typeof ci)["dict"]>));
								};
								ci.on("*", () => {
									props_rep_table = ci.getReplicationTable();
								});
								// we set the default replication table to be an empty object since
								// attributes tables aren't discovered/replicated until a value is sent.
								// e.g. test = {} exists but will not be replicated, test = {...} however will replicate.
								// if the replication is done securely (through a remote event) this will not happen.
								// we only do this when tap in is successful since that means the token actually exists.
								props_rep_table = {};
							});

							// tap into the token-id/* for cases of unique keys
							props_TapIn.Keep(ImitationService.tapIn(targetId as never, "*", () => {}));
						}
						return props_metatable;
					}
					// remote event (only validated on the server.)
					const re = _res.FindFirstChild(key) as RemoteEvent | undefined;
					if (re !== undefined) {
						return re;
					}
					// remote function (normal/default client member)
					const rf = _rfs.FindFirstChild(key) as RemoteFunction | undefined;
					if (rf === undefined) {
						throw `"${key}" is not a valid member of "${ServiceName}". "${ServiceName}" was not exposed as a client value.`;
					}
					return (...args: unknown[]) => {
						return rf.InvokeServer(...args);
					};
				},
				__newindex: () => {
					throw "You cannot assign values to Service Proxies.";
				},
			},
		);
		ServiceProxyEntries.set(ServiceName, ServiceProxy);
		return resolve(ServiceProxy as ServiceProxy<stcnetServices[T]>);
	});
}

const Controllers: Map<string, stcnetClient> = new Map();
const ControllerAddedEventer = new Instance("BindableEvent");
const RunService = game.GetService("RunService");

export class stcnetClient extends Pseudo {
	/**
`	 * Gets the `Service` from the server by the name, services don't have to exist at the current point in time,
`	 * so a `Promise` is returned.
	 */
	GetService<T extends keyof stcnetServices>(ServiceName: T): Promise<ServiceProxy<stcnetServices[T]>> {
		return GetService(ServiceName);
	}
	/**
	 * Calls .await on `GetService`, returns the Service or throws error if failed.
	 */
	AwaitService<T extends keyof stcnetServices>(ServiceName: T): ServiceProxy<stcnetServices[T]> {
		const [s, r] = GetService(ServiceName).await();
		if (s === false) {
			throw `Error when awaiting for service "${ServiceName}". ${r}`;
		}
		return r;
	}
	/**
	 * Gets the `Controller` by the name, controllers don't have to exist at the current point in time,
	 * so a `Promise` is returned.
	 */
	GetController<T extends keyof stcnetControllers>(ControllerName: T): Promise<stcnetControllers[T]> {
		return new Promise((resolve) => {
			const exists = Controllers.get(ControllerName);
			if (exists !== undefined) {
				return resolve(exists as stcnetControllers[T]);
			}
			const c = ControllerAddedEventer.Event.Connect((x: unknown) => {
				if (x === ControllerName) {
					c.Disconnect();
					RunService.RenderStepped.Wait();
					return resolve(Controllers.get(ControllerName) as stcnetControllers[T]);
				}
			});
		});
	}
	/**
	 * @param ControllerName The name of the `Controller` which can then be fetched with `GetController`
	 */
	constructor(ControllerName: string) {
		super("stcnet");
		if (Controllers.has(ControllerName) === true) {
			throw `A Controller with the name "${ControllerName}" already exists.`;
		}
		this.GetRef().Name = ControllerName;
		const stcnetServerContainer = Engine.FetchReplicatedStorage().WaitForChild(`@${this.ClassName}`);
		let stcnetClientContainer = stcnetServerContainer.FindFirstChild(`...client`);
		if (!stcnetClientContainer) {
			stcnetClientContainer = new Instance("Folder");
			stcnetClientContainer.Name = "...client";
			stcnetClientContainer.Parent = stcnetServerContainer;
		}
		this.GetRef().Parent = stcnetClientContainer;
		Controllers.set(ControllerName, this);
		ControllerAddedEventer.Fire(ControllerName);
	}
}
