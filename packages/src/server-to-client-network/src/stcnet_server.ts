/* eslint-disable roblox-ts/no-private-identifier */
import { Pseudo, Engine } from "@mekstuff-rbxts/core";
import { ImitToken, ImitationService, createSchema, tokenSecuredKeys } from "@mekstuff-rbxts/imit";
import { execSync, PrimitivesForSchema } from "@mekstuff-rbxts/primitive";

const HttpService = game.GetService("HttpService");
const SessionPropsScopeId = HttpService.GenerateGUID();
const IsServer = game.GetService("RunService").IsServer();

const stcnet_container = IsServer ? new Instance("Folder") : undefined;
if (stcnet_container) {
	stcnet_container.Name = "@stcnet";
	stcnet_container.Parent = Engine.FetchReplicatedStorage();
}

declare global {
	interface stcnetServices {}
}

type stcnetClient =
	| {
			[key: string]: ((Player: Player, ...args: any[]) => void) | RemoteEvent; // eslint-disable-line @typescript-eslint/no-explicit-any
	  }
	| {
			$props: object | boolean;
	  };

const Services: Map<string, stcnetServer> = new Map();
const ServiceAddedEventer = new Instance("BindableEvent");
const RunService = game.GetService("RunService");

type _proxy_$remote = {
	__remote: RemoteEvent;
};

export class stcnetServer extends Pseudo {
	private _tokenId: string;
	/**
	 * API exposed to the client.
	 *
	 * The unique `props` object are primitive values that are replicated with `ImitationService` onto clients.
	 */
	client: stcnetClient | undefined = undefined;
	$schema = createSchema;
	/**
	 * Uses the `PrimitivesForSchema` from `@mekstuff-rbxts/primitives`.
	 */
	$p = PrimitivesForSchema;
	/**
	 * Create a remote event that the client and server can fire.
	 *
	 * @example
	 * client: {
	 * 	test: $remote(this.$p.boolean()) // the first argument will be validated to always be a boolean value.
	 * }
	 * ...
	 * this.client.test.FireClient(Player, true) // will fire the client since "0" is a boolean
	 * this.client.test.FireClient(Player, 0) // will not fire the client since "0" is not a boolean
	 * // Similar behaviour to using "FireServer" from the client aswell. The value is only checked and validated on the server.
	 */
	$remote<T extends unknown[]>(
		...schema: T
	): {
		/**
		 * Since `$remotes` values are validated, `...args` are defined and not `unknown`. Since they gurantee existence.
		 * Be aware of using the `Wait` of the Signal as the values **WILL** be `undefined` if validation failed.
		 */
		readonly OnServerEvent: RBXScriptSignal<(player: Player, ...args: T) => void>;
	} & RemoteEvent<(...args: T) => void> {
		const _remote = new Instance("RemoteEvent");
		// we do not actually return the remote event Instance, we return a "proxy" that will give us the ability to validate
		// the values first.
		const fe: _proxy_$remote = {
			__remote: _remote,
		};
		const ValidateParams = (...params: unknown[]) => {
			const _initiator = (typeIs(params[0], "Instance") && params[0].IsA("Player") && params[0]) || undefined;
			return pcall(() => {
				const values: defined[] = [];
				(schema as unknown as readonly []).forEach((x, i) => {
					try {
						const res = execSync(x, params[i], _initiator);
						values.push(res as defined);
					} catch (err) {
						throw `Argument for ValidateParams at "args_${i}" failed, ${err}`;
					}
				});
				return values;
			});
		};
		const OnServerEventProxy = {
			Connect: (_: unknown, callback: Callback) => {
				return _remote.OnServerEvent.Connect((Player, ...params) => {
					const [paramsValid, Validated] = ValidateParams(...params);
					if (paramsValid) callback(Player, ...Validated);
					else {
						warn(
							`The Incoming OnServerEvent Data for you "Connect" connection was dropped because: ${Validated}`,
						);
					}
				});
			},
			ConnectParallel: (_: unknown, callback: Callback) => {
				return _remote.OnServerEvent.ConnectParallel((Player, ...params) => {
					const [paramsValid, Validated] = ValidateParams(...params);
					if (paramsValid) callback(Player, ...Validated);
					else {
						warn(
							`The Incoming OnServerEvent Data for you "ConnectParallel" connection was dropped because: ${Validated}`,
						);
					}
				});
			},
			Once: (_: unknown, callback: Callback) => {
				return _remote.OnServerEvent.Once((Player, ...params) => {
					const [paramsValid, Validated] = ValidateParams(...params);
					if (paramsValid) callback(Player, ...Validated);
					else {
						warn(
							`The Incoming OnServerEvent Data for you "Once" connection was dropped because: ${Validated}`,
						);
					}
				});
			},
			Wait: () => {
				// Warning about using Wait: since the value can be validated and failed, there's cases where the value returned will be undefined.
				const res = _remote.OnServerEvent.Wait();
				const [paramsValid, Validated] = ValidateParams(...select(2, ...res));
				if (paramsValid) {
					return $tuple(res[0], ...Validated);
				}
				warn(
					`The Incoming OnServerEvent Data for you "Wait" yield was dropped because: ${Validated}.\n\nOnly the Player Instance argument will be returned.`,
				);
				return $tuple(res[0]);
			},
		};
		const FireClientProxy = (_: unknown, Player: Player, ...params: unknown[]) => {
			const [paramsValid, Validated] = ValidateParams(...params);
			if (paramsValid) {
				_remote.FireClient(Player, ...Validated);
			} else {
				throw `An outgoing "FireClient" request has failed because: ${Validated}`;
			}
		};
		const FireAllClientsProxy = (_: unknown, ...params: unknown[]) => {
			const [paramsValid, Validated] = ValidateParams(...params);
			if (paramsValid) {
				_remote.FireAllClients(...Validated);
			} else {
				throw `An outgoing "FireAllClients" request has failed because: ${Validated}`;
			}
		};
		setmetatable(fe, {
			__newindex: () => {
				throw "Cannot assign value to $remote";
			},
			__index: (_, k) => {
				if (k === "FireClient") {
					return FireClientProxy;
				}
				if (k === "FireAllClients") {
					return FireAllClientsProxy;
				}
				if (k === "OnServerEvent") {
					return OnServerEventProxy;
				}
				if (k === "Destroy") {
					_remote.Destroy();
				}
				throw `"${k}" cannot be accessed by $remote`;
			},
		});
		return fe as never;
	}
	/**
	 * Uses the `send` method of the imitation token. You must have `client` defined for the ImitationToken to exist.
	 */
	$send(...args: Parameters<ImitToken["send"]>) {
		assert(this._PropsImitationToken, "ImitationToken does not exist. Cannot use 'send'");
		this._PropsImitationToken?.send(...args);
	}
	/**
	 * Uses the `receive` method of the imitation token. You must have `client` defined for the ImitationToken to exist.
	 */
	$receive(...args: Parameters<ImitToken["receive"]>) {
		assert(this._PropsImitationToken, "ImitationToken does not exist. Cannot use 'receive'");
		this._PropsImitationToken?.receive(...args);
	}
	/**
`	 * Gets the `Service` by the name, services don't have to exist at the current point in time,
`	 * so a `Promise` is returned.
	 */
	GetService<T extends keyof stcnetServices>(ServiceName: T): Promise<stcnetServices[T]> {
		return new Promise((resolve) => {
			const exists = Services.get(ServiceName);
			if (exists !== undefined) {
				return resolve(exists as stcnetServices[T]);
			}
			const c = ServiceAddedEventer.Event.Connect((x: unknown) => {
				if (x === ServiceName) {
					c.Disconnect();
					RunService.Stepped.Wait();
					return resolve(Services.get(ServiceName) as stcnetServices[T]);
				}
			});
		});
	}
	private _PropsImitationToken: ImitToken<object> | undefined = undefined;

	/***/
	private _RunImitate() {
		if (this._PropsImitationToken) {
			if (!this.client) {
				return;
			}
			if (typeIs(this.client.$props, "boolean")) {
				if (this.client.$props === true) {
					return; //$props is true, most likely meaning the $props was defined to be able to access the $receive and $send methods.
				} else {
					warn(
						`[${this.ClassName}]: You defined $props but the value is false. To surpress this warning, set the value to true.`,
					);
				}
			}
			this._PropsImitationToken.ImitateSync();
		} else {
			warn("_PropsImitationToken is not set. Cannot ImitateClientProps.");
		}
	}
	/**
	 * If you have `client.props`, this function will trigger the imitation of the token. You are expected to call this
	 * whenver you make a change to props. It will use the `ImitateSync` method.
	 */
	ImitateClientProps() {
		this._RunImitate();
	}
	/**
	 * @param ServiceName The name of the `Service` which can then be fetched with `GetController`.
	 *
	 * @param securedPropKeys Pass secure prop keys to the `ImitationToken` for client props. Learn more from `ImitationService`.
	 */
	constructor(ServiceName: string, securedTokenKeys?: tokenSecuredKeys) {
		super("stcnet");
		if (Services.has(ServiceName) === true) {
			throw `A Service with the name "${ServiceName}" already exists.`;
		}
		this.GetRef().Name = ServiceName;
		this.GetRef().Parent = stcnet_container;

		const rfs = new Instance("Folder");
		rfs.Name = "rfs";
		rfs.Parent = this.GetRef();
		const res = new Instance("Folder");
		res.Name = "res";
		res.Parent = this.GetRef();

		this._tokenId = `${SessionPropsScopeId}/${HttpService.GenerateGUID()}`;

		let PROPS_ASSIGNED = false;

		this.usePropertyEffect(() => {
			if (this.client !== undefined) {
				rfs.ClearAllChildren();
				for (const [key, value] of pairs(this.client)) {
					if (key === "$props") {
						if (PROPS_ASSIGNED === true) {
							continue;
						}
						PROPS_ASSIGNED = true;
						const PropsValueStr = new Instance("StringValue");
						const token = ImitationService.newToken(
							this._tokenId,
							typeIs(this.client.$props, "boolean")
								? this.$schema((p) => p.unknown()) // we make imitservice expect unknown values since none of the values will be imitated. (cases where $props is only defined to use $send and $receive methods)
								: this.client.$props,
							undefined,
							securedTokenKeys,
						);
						this._PropsImitationToken = token;
						this.client.$props = typeIs(this.client.$props, "boolean")
							? this.client.$props
							: token.Imitation;
						PropsValueStr.Name = "$props";
						PropsValueStr.Parent = rfs;
						PropsValueStr.Value = this._tokenId;
						this._RunImitate();
						continue;
					}
					if (typeIs(value, "function")) {
						const rf = new Instance("RemoteFunction");
						rf.Name = key as string;
						rf.Parent = rfs;
						rf.OnServerInvoke = (Player, ...args) => {
							return value(Player, ...args);
						};
						continue;
					}
					if (typeIs(value, "Instance") && value.IsA("RemoteEvent")) {
						throw 'You passed a "RemoteEvent" as a client prop which is not supported. To create remote events, use the $remote method of stcnet.';
					}
					if (typeIs(value, "table") && (value as _proxy_$remote)["__remote"] !== undefined) {
						const v = value as _proxy_$remote;
						v.__remote.Name = key as string;
						v.__remote.Parent = res;
						continue;
					}
					throw `Unhandled client value "${key}": ${typeOf(value)}`;
				}
			}
		}, ["client"]);

		Services.set(ServiceName, this);
		ServiceAddedEventer.Fire(ServiceName);
	}
}
