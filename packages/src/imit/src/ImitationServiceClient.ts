/* eslint-disable roblox-ts/no-private-identifier */

declare global {
	namespace PHe {
		interface Pseudos {
			ImitationServiceClient: ImitationServiceClient;
			ClientImitToken: ClientImitToken;
			ClientImitator: ClientImitator;
		}
	}
}

type TokenEventerRemote = RemoteEvent<(EventType: TokenEventerEventType, ...args: unknown[]) => void>;

import { Engine, Pseudo } from "@mekstuff-rbxts/core";
import { Servant, ServantTrackableItem } from "@mekstuff-rbxts/servant";
import { ClientTokenImitEventType, FormatTokenId, TokenEventerEventType } from "./shared";
import { Serializer } from "@mekstuff-rbxts/serializer";

const RunService = game.GetService("RunService");
const IsClient = RunService.IsClient();

export type ClientTapIntoDictionary<T> = {
	[K in T extends unknown[] ? number : keyof T]: K extends keyof T ? T[K] : never;
};

type onConnector<T = unknown> = {
	callback: (value: T, servant: Servant, key: string) => void | ((isDestroying?: boolean) => void);
	cleanup?: (isDestroyed?: boolean) => void;
	servant?: Servant;
};

class ClientImitToken<T extends object = { [key: string]: unknown }> extends Pseudo {
	set(key: Partial<T>, value?: undefined): void;
	set<X extends keyof T, U extends T[X]>(key: X, value: U): void;
	/**
	 * Set value of a imitation.
	 */
	set(key: unknown, value: unknown): void {
		if (typeIs(key, "string")) {
			this.token.FireServer("$set", {
				[key]: value,
			});
		} else {
			this.token.FireServer("$set", key);
		}
	}
	constructor(private token: RemoteEvent<(eventType: ClientTokenImitEventType, ...args: unknown[]) => void>) {
		super("ClientImitToken");

		task.delay(1, () => {
			this.Destroy();
		});

		this.useDestroying(() => {
			this.token.FireServer("$disconnect");
		});
	}
}

class ClientImitator<ImitatorProps extends object = { [key: string]: unknown }> extends Pseudo<{
	ReceiveDataTransmittionCallbacks: Callback[];
	_serializer: Serializer;
}> {
	private _onConnectors: Map<string | number | symbol, onConnector[]> = new Map();
	private ReplicationTable: { [key: string]: unknown } = {};
	private CallOnConnector(connector: onConnector, Value: unknown, Key: string, isDestroyed?: boolean) {
		if (connector.cleanup) {
			connector.cleanup(isDestroyed);
			if (connector.servant) {
				connector.servant.Destroy();
			}
		}
		const ns = new Servant();
		connector.servant = ns;
		const r = connector.callback(Value, ns, Key);
		if (typeIs(r, "function")) {
			connector.cleanup = r;
		}
	}
	private CallOnConnectorsForScope(Scope: string) {
		const inScope = this._onConnectors.get(Scope);
		const _all = this._onConnectors.get("*");
		if (_all !== undefined) {
			_all.forEach((x) => {
				this.CallOnConnector(x, this.ReplicationTable[Scope], Scope);
			});
		}
		if (inScope !== undefined) {
			inScope.forEach((x) => {
				this.CallOnConnector(x, this.ReplicationTable[Scope], Scope);
			});
		}
	}
	/**
	 * # INTERNAL USE ONLY
	 * @private
	 * @deprecated
	 * @hidden
	 */
	private GetSerializer(): Serializer {
		if (this._dev._serializer) {
			return this._dev._serializer;
		}
		this._dev._serializer = new Serializer(this.ReplicatorFolder.Name);
		return this._dev._serializer;
	}
	/**
	 * # INTERNAL USE ONLY
	 * @private
	 * @deprecated
	 * @hidden
	 */
	_SetAndRunOnConnectors(attr: string, value: unknown, isSecured?: boolean) {
		if (isSecured === true) {
			this.ReplicationTable[attr] = value;
			this.CallOnConnectorsForScope(attr);
			return;
		}
		let _rv: unknown;
		const _vm = typeIs(value, "string") && value.match("%$_%->{(.*)}")[0];
		if (typeIs(_vm, "string")) {
			_rv = this.GetSerializer().Decode(_vm);
		} else {
			_rv = value;
		}

		this.ReplicationTable[attr] = _rv;
		this.CallOnConnectorsForScope(attr);
	}
	/**
	 * You pass `"*"` as the ValueName to receive trigger callback on any imitation.
	 */
	on<T extends keyof ImitatorProps>(ValueName: T, Callback: onConnector<ImitatorProps[T]>["callback"]): Servant {
		const OnServant = new Servant();
		this.TapInServant.Keep(OnServant);
		if (!this._onConnectors.has(ValueName)) {
			this._onConnectors.set(ValueName, []);
		}
		const v = { callback: Callback, servant: OnServant };
		if (ValueName === "*") {
			for (const [a, b] of pairs(this.ReplicationTable)) {
				this.CallOnConnector(v as onConnector, b, a as string);
			}
		}
		this._onConnectors.get(ValueName)?.push(v as onConnector);
		if (this.ReplicationTable[ValueName as string] !== undefined) {
			this.CallOnConnector(v as onConnector, this.ReplicationTable[ValueName as string], ValueName as string);
		}
		OnServant.useDestroying(() => {
			if (this._onConnectors.has(ValueName)) {
				const IO = this._onConnectors.get(ValueName)?.indexOf(v as onConnector);
				if (typeIs(IO, "number") && IO !== -1) {
					this._onConnectors.get(ValueName)?.remove(IO);
				}
			}
		}, true);
		return OnServant;
	}
	/**
	 * For using `dictionary` or `array` values, passes the key and value, if the value does not change
	 * your callback would not be triggered. Cleanup functions are called when the value changes and/or the
	 * imitator is destroyed.
	 */
	dict<
		T extends keyof ImitatorProps,
		K extends keyof ClientTapIntoDictionary<ImitatorProps[T]>,
		V extends ClientTapIntoDictionary<ImitatorProps[T]>[K],
	>(
		ValueName: T,
		Callback: (key: K, value: V) => ((removed?: boolean, isDestroying?: boolean) => void) | void,
	): Servant {
		const t = new Map<unknown, { value: unknown; cleanup?: Callback }>();
		return this.on(ValueName, (value) => {
			if (!typeIs(value, "table")) {
				throw `${ValueName as string} did not send a table. Type ${typeOf(
					ValueName,
				)} cannot be used with "dict".`;
			}
			t.forEach((v, k) => {
				const l = value as { [key: string]: unknown };
				if (l[k as string] === undefined) {
					if (v.cleanup) {
						v.cleanup(true);
					}
				}
			});
			for (const [a, b] of pairs(value)) {
				const existingValue = t.get(a);
				if (existingValue && existingValue.value === b) {
					continue;
				}
				/* wth was this doing? added ^^ instead... ?
				if (!typeIs(existingValue, "table") && !typeIs(b, "table") && b === existingValue) {
					continue;
				}
				*/
				if (existingValue?.cleanup) {
					existingValue.cleanup();
				}
				const r = Callback(a as K, b as V);
				t.set(a, {
					value: b,
					cleanup: typeIs(r, "function") ? r : undefined,
				});
			}
			return (isDestroying) => {
				if (isDestroying) {
					t.forEach((x) => {
						if (x.cleanup) {
							x.cleanup(undefined, isDestroying);
						}
					});
				}
			};
		});
	}
	/**
	 * Sends data to server using a `remote event`
	 */
	send(...data: unknown[]) {
		this.TokenEventer.FireServer("$send", ...data);
	}
	/**
	 * Receives information from server that called `sent`
	 */
	receive(callback: (...data: unknown[]) => void): Servant {
		const s = new Servant();
		const n = "_receiveTransmission" + s._id;
		this._dev[n] = s;
		this._dev.ReceiveDataTransmittionCallbacks.push(callback);
		s.useDestroying(() => {
			this._dev.ReceiveDataTransmittionCallbacks.remove(
				this._dev.ReceiveDataTransmittionCallbacks.indexOf(callback),
			);
			delete this._dev[n];
		}, true);
		return s;
	}
	/**
	 * Gets the `props` of the imitation
	 */
	getProps(): object | undefined {
		return this.props;
	}
	/**
	 * Returns the replication table.
	 */
	getReplicationTable<T extends ImitatorProps>(): T {
		return this.ReplicationTable as never;
	}
	constructor(
		private ReplicatorFolder: Folder,
		private TapInServant: Servant,
		private readonly props: object | undefined,
		private readonly TokenEventer: TokenEventerRemote,
	) {
		super("ClientImitator");
		this._dev.ReceiveDataTransmittionCallbacks = [];
		this.TapInServant.Keep(
			this.ReplicatorFolder.AttributeChanged.Connect((attr) => {
				this._SetAndRunOnConnectors(attr, this.ReplicatorFolder.GetAttribute(attr));
			}),
		);
		this.ReplicatorFolder.GetAttributes().forEach((_, attr) => {
			this._SetAndRunOnConnectors(attr, this.ReplicatorFolder.GetAttribute(attr));
		});
		this.TokenEventer.OnClientEvent.Connect((eventType, ...args) => {
			if (eventType === "$send") {
				this._dev.ReceiveDataTransmittionCallbacks.forEach((x) => {
					x(...args);
				});
			}
		});
		this.useDestroying(() => {
			this._onConnectors.forEach((x) => {
				x.forEach((y) => {
					if (y.cleanup) {
						y.cleanup(true);
					}
					y.servant?.Destroy();
				});
			});
		}, true);
	}
}

class ImitationServiceClient extends Pseudo {
	private GetImitationServiceFolder(): Folder {
		return Engine.FetchReplicatedStorage().WaitForChild("@ImitationService") as Folder;
	}
	private GetServerTokensFolder(): Folder {
		return this.GetImitationServiceFolder().WaitForChild("Tokens") as Folder;
	}
	private GetClientTokenProcessor(): RemoteFunction {
		return this.GetImitationServiceFolder().WaitForChild("clientTokenProcessor") as RemoteFunction;
	}
	private ListenForFolder(Parent: Instance, Target: string, TapInServant: Servant): Promise<Folder> {
		return new Promise((resolve) => {
			const exists = Parent.FindFirstChild(Target) as Folder | undefined;
			if (exists) {
				return resolve(exists);
			} else {
				const Connection = Parent.ChildAdded.Connect((c) => {
					if (c.Name === Target && c.IsA("Folder")) {
						Connection.Disconnect();
						return resolve(c);
					}
				});
				TapInServant.Keep(Connection);
			}
		});
	}
	newClientToken<T extends keyof ImitationServiceSchemas>(
		TokenId: T,
		...params: unknown[]
	): Promise<ClientImitToken<ImitationServiceSchemas[T]>> {
		const clientTokenProcessor = this.GetClientTokenProcessor();
		const formattedToken = FormatTokenId(TokenId);
		if (formattedToken.TokenIsWildCard && formattedToken.TokenValue === "*") {
			throw `ClientReplicationToken's id cannot be a wild card of "*".`;
		}
		return new Promise((resolve, reject) => {
			const res: { success: boolean; results?: RemoteEvent | string } = clientTokenProcessor.InvokeServer(
				TokenId,
				...params,
			);
			if (res.success) {
				if (res.results === undefined || !typeIs(res.results, "Instance")) {
					return reject(`Invalid result type.`);
				}
				resolve(new ClientImitToken(res.results));
			} else {
				reject(res.results);
			}
		});
	}
	tapIn<T extends keyof ImitationServiceSchemas>(
		TokenId: T,
		Subchannel: string,
		Callback: (Imitator: ClientImitator<ImitationServiceSchemas[T]>) => void,
	): Servant;
	tapIn<T extends keyof ImitationServiceSchemas>(
		TokenId: T,
		Callback: (Imitator: ClientImitator<ImitationServiceSchemas[T]>) => void,
	): Servant;
	tapIn<T extends keyof ImitationServiceSchemas>(
		TokenId: T,
		Subchannel: string | ((Imitator: ClientImitator<ImitationServiceSchemas[T]>) => void),
		...args: unknown[]
	): Servant {
		const TapInServant = new Servant();
		TapInServant._dev.set("_isTAPIN_SERVANT", true);
		let useCallback: (Imitator: ClientImitator<ImitationServiceSchemas[T]>) => void | undefined;
		if (typeIs(Subchannel, "function")) {
			useCallback = Subchannel;
		} else {
			useCallback = args[0] as typeof useCallback;
		}
		let useTokenId: string = TokenId;
		if (typeIs(Subchannel, "string")) {
			useTokenId = `${TokenId}/${Subchannel}`;
		}
		const formattedToken = FormatTokenId(useTokenId);
		function handleChild(Child: Folder) {
			const TokenEventer = Child.WaitForChild("TokenEventer", 300) as TokenEventerRemote | undefined;
			if (TokenEventer === undefined) {
				print(Child);
				throw `^^^ Does not have a token eventer ^^^`;
			}
			let Imitator: ClientImitator<ImitationServiceSchemas[T]> | undefined;
			TapInServant.Keep(
				TokenEventer.OnClientEvent.Connect((eventType, ...args) => {
					if (eventType === "$initialize") {
						const ReplicatorFolder = args[0] as Folder;
						const SecureImits = args[1] as { [key: string]: unknown };
						const props = args[2] as object | undefined;
						Imitator = new ClientImitator(ReplicatorFolder, TapInServant, props, TokenEventer);
						TapInServant.Keep(Imitator as unknown as ServantTrackableItem);
						for (const [a, b] of pairs(SecureImits)) {
							Imitator._SetAndRunOnConnectors(a as string, b, true);
						}
						useCallback(Imitator);
						return;
					}
					if (eventType === "$secure-imit") {
						if (Imitator !== undefined) {
							Imitator._SetAndRunOnConnectors(args[0] as string, args[1], true);
						}
						return;
					}
					if (eventType === "$destroy") {
						Imitator?.Destroy();
						return;
					}
				}),
			);
			TokenEventer.FireServer("$initialize");
		}

		const TokensFolder = this.GetServerTokensFolder();
		if (formattedToken.TokenIsWildCard) {
			this.ListenForFolder(TokensFolder, formattedToken.TokenName, TapInServant).then((pres) => {
				if (formattedToken.TokenValue === "*") {
					pres.ChildAdded.Connect((x) => {
						if (x.IsA("Folder")) {
							handleChild(x);
						}
					});
					for (const x of pres.GetChildren()) {
						if (x.IsA("Folder")) {
							handleChild(x);
						}
					}
				} else {
					this.ListenForFolder(pres, formattedToken.TokenValue, TapInServant).then((res) => {
						handleChild(res);
					});
				}
			});
		} else {
			this.ListenForFolder(TokensFolder, formattedToken.TokenValue, TapInServant).then((res) => {
				handleChild(res);
			});
		}
		return TapInServant;
	}
	tapOut(TapInServant: Servant) {
		if (!TapInServant._dev.has("_isTAPIN_SERVANT")) {
			throw `${TapInServant} is not a tapIn servant.`;
		}
		TapInServant.Destroy();
	}
	constructor() {
		super("ImitationServiceClient");
	}
}

let nISC: ImitationServiceClient;
if (IsClient) {
	nISC = new ImitationServiceClient();
}
export { nISC as ImitationServiceClient };
