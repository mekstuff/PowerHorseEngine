/* eslint-disable roblox-ts/no-private-identifier */
/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
	namespace PHe {
		interface Pseudos {
			ImitationService: ImitationService;
			ImitToken: ImitToken;
		}
	}
	/**
	 * Imitation Service schemas
	 */
	interface ImitationServiceSchemas {}
}

import { Pseudo, Engine, typeIs, Servant } from "@mekstuff-rbxts/core";
import { PrimitivesForSchema, execSync, exec } from "@mekstuff-rbxts/primitive";
import { ClientTokenImitEventType, FormatTokenId, TokenEventerEventType } from "./shared";
import { Serializer } from "@mekstuff-rbxts/serializer";

const HttpService = game.GetService("HttpService");
const RunService = game.GetService("RunService");
const Players = game.GetService("Players");
const IsClient = RunService.IsClient();

const deepCopyClone = (org: object): object => {
	const copy: { [key: string]: any } = {};
	for (const [k, v] of pairs(org)) {
		let uv = v;
		if (typeIs(v, "table")) {
			uv = deepCopyClone(v);
		}
		copy[k as string] = uv;
	}
	return copy;
};

export type tokenSecuredKeys = { [key: string]: number[] | boolean };
/**
 * Create imiation tokens for replication.
 */
class ImitationService extends Pseudo<{ RS: Folder }> {
	/***/
	newToken<schema extends object>(
		tokenId: string,
		schema: schema,
		tokenProps?: unknown,
		securedTokenKeys?: tokenSecuredKeys,
	): ImitToken<schema> {
		assert(
			!game.GetService("Players").LocalPlayer,
			"`newToken` can only be called by the server. use `newClientToken` to create tokens from the client.",
		);
		assert(typeIs(tokenId, "string"), `string expected for tokenId, got ${typeOf(tokenId)}`);
		return new ImitToken(tokenId, schema, tokenProps, securedTokenKeys);
	}

	private ClientTokenProcessors = new Map<string, (creator: Player, ...args: unknown[]) => void>();
	/**
	 * Whenever a client calls `newClientReplicationToken`, you need to process it on the server for it to be created.
	 *
	 * If you want to accept the token, you must create a new server token as you normally would with `newToken` and return it.
	 * The client will then be able to make changes to this token that will then be `imitated`/`replicated` onto other clients or the specified clients
	 * set by the server token including the client that created the token.
	 */
	ProcessNewClientToken(TokenName: string, callback: (creator: Player, ...args: unknown[]) => ImitToken | void) {
		if (this.ClientTokenProcessors.has(TokenName)) {
			throw `A client token processor already exists for the token "${TokenName}".`;
		}
		this.ClientTokenProcessors.set(TokenName, callback);
	}

	constructor() {
		super("ImitationService");
		if (IsClient) {
			throw `You cannot use ImitationService from a client, Import "ImitationServiceClient" instead.`;
		}
		const ReplicationServiceRS = new Instance("Folder");
		ReplicationServiceRS.Name = `@${this.ClassName}`;
		ReplicationServiceRS.Parent = Engine.FetchReplicatedStorage();
		const clientTokenProcessor = new Instance("RemoteFunction");
		clientTokenProcessor.Name = "clientTokenProcessor";
		clientTokenProcessor.Parent = ReplicationServiceRS;

		const Tokens = new Instance("Folder", ReplicationServiceRS);
		Tokens.Name = "Tokens";
		this._dev.RS = ReplicationServiceRS;

		// Processing client tokens
		clientTokenProcessor.OnServerInvoke = (
			Player,
			TokenId,
			...args: unknown[]
		): { success: boolean; results?: RemoteEvent | string } => {
			if (!typeIs(TokenId, "string")) {
				warn(`TokenId for clientTokenProcessor was not a string.`);
				return {
					success: false,
					results: "Invalid token type.",
				};
			}
			const formattedToken = FormatTokenId(TokenId);
			if (formattedToken.TokenIsWildCard && formattedToken.TokenValue === "*") {
				warn(`ClientReplicationToken's id cannot be a wild card of "*".`);
				return {
					success: false,
					results: "wild card type not permitted.",
				};
			}
			const processor = this.ClientTokenProcessors.get(TokenId);
			if (processor === undefined) {
				warn(
					`CLIENT TOKEN PROCESSOR: No processor exists for "${TokenId}" but player ${Player} attempted to create it. Will be dropped.`,
				);
				return {
					success: false,
					results: "Token could not be processed by the server.",
				};
			}
			const res = processor(Player, ...args);
			if (typeIs(res, "Pseudo")) {
				if (res.IsA("ImitToken")) {
					res._clientOwnsToken = Player;
					const eventer = res.GetRef().FindFirstChild("TokenEventer") as RemoteEvent;
					res._dev.set(
						"_PlayerRemovingConnection-ImitToken-ClientRep",
						Players.PlayerRemoving.Connect((p) => {
							if (p === Player) {
								if (res.onClientDisconnected !== undefined) {
									res.onClientDisconnected(true);
								}
								res.Destroy();
							}
						}),
					);

					//handling events sent
					eventer.OnServerEvent.Connect((Sender, eventType, ...args) => {
						if (Sender !== Player) {
							warn(`${Sender} should not be sending this event.`);
							return;
						}
						if (typeIs(eventType, "string")) {
							const et = eventType as ClientTokenImitEventType;
							if (et === "$set") {
								const keyvalues = args[0] as { [key: string]: unknown };
								if (!typeIs(keyvalues, "table")) {
									warn`expected table for keyvalues for "set". got ${typeOf(keyvalues)}`;
									return;
								}
								for (const [a, b] of pairs(keyvalues)) {
									res.AddToImitation(a as string, b);
								}
							} else if (et === "$disconnect") {
								if (res.onClientDisconnected !== undefined) {
									res.onClientDisconnected(false);
								}
								res.Destroy();
							}
						}
					});

					return {
						success: true,
						results: eventer,
					};
				}
			}
			return {
				success: false,
				results: "Server declined token.",
			};
		};
	}
}

export class ImitToken<RT extends object = { [key: string | number | symbol]: any }> extends Pseudo<{
	TokenEventer: RemoteEvent;
	ReplicatorFolder: Folder;
	ReceiveDataTransmittionCallbacks: Callback[];
	_replicationContents: unknown;
	_callImitate: (fallbackToPreviousOnFailure?: boolean) => Promise<RT>;
}> {
	/**
	 * Adds the key with the value to the imitation table.
	 */
	AddToImitation<K extends keyof RT>(key: K, value: RT[K]) {
		if (key !== undefined) {
			(this.Imitation as { [key: string]: unknown })[key as string] = value;
		}
	}
	/**
	 * Removes the key from the imitation table.
	 */
	RemoveFromImitation<K extends keyof RT>(key: K) {
		if (key !== undefined) {
			(this.Imitation as { [key: string]: unknown })[key as string] = undefined;
		}
	}
	/**
	 * The table in which the replication/imitiation data is stored.
	 */
	Imitation: RT = {} as RT;

	/***/
	private CreateReplicatorFolder(): Folder {
		const id = HttpService.GenerateGUID(true);
		const f = new Instance("Folder");
		f.Name = id;
		f.Parent = nIS._dev.RS;
		return f;
	}

	private SecuredReplicationTable: { [key: string]: { value: unknown; restrictedTo: number[] } } = {};
	private _GetSecuredReplicationPropsForClient(Player: Player): { [key: string]: unknown } {
		const t: { [key: string]: unknown } = {};
		for (const [a, b] of pairs(this.SecuredReplicationTable)) {
			const inList =
				this.SecuredReplicationTable[a].restrictedTo.size() === 0
					? true
					: this.SecuredReplicationTable[a].restrictedTo.indexOf(Player.UserId) !== -1;
			if (inList) {
				t[a] = b.value;
			}
		}
		return t;
	}

	/**
	 * Used by tokens that are created for proxy client tokens.
	 * Callback will run whenever the client is disconnected
	 *
	 * The `clientHasLeft` will be true if the onClientDisconnected by leaving server, other wise it was disconnected because the
	 * client imitation was destroyed or for any other local reason.
	 *
	 * The server token will be destroyed after your callback finishes executing.
	 *
	 * Setting no callback will destroy the server token instantly.
	 */
	onClientDisconnected: ((clientHasLeft?: boolean) => void) | undefined = undefined;
	/**
	 * Sends data to current `ClientImitator` or a specific `ClientImitator`.
	 */
	send(PlayerOrData: unknown, ...data: unknown[]) {
		if (typeIs(PlayerOrData, "Instance") && PlayerOrData.IsA("Player")) {
			this._dev.TokenEventer.FireClient(PlayerOrData, "$send", ...data);
		} else {
			this._dev.TokenEventer.FireAllClients("$send", ...data);
		}
	}
	/**
	 * Whenever client uses `ClientImitator.send`, your callback will be called.
	 */
	receive(callback: (Player: Player, ...data: unknown[]) => void): Servant {
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
	 * Triggers an imitation of the current state.
	 * 
	 * - When imitating tables, if the key can be converted to a number, it will be received as a number on the client! So the string `"1"` will always be the number
	 * `1` on the client. This is to support `arrays`. If you require to use an ordered dictionary (basically an array, so just use `array`), then you will need to name
	 * them where `tonumber` will return nil, e.g. "one", "two", "three"
	 * 
	 * ## NOTE
	 * This will run `asynchronously`, If an error occurs, the `Imitation` object will retain the value that caused the error. It is up to you
	 * to update the `Imitation` object to resolve these errors. Use `ImitateSync` for the opposite of this behaviour.
\	 */
	Imitate(): Promise<RT> {
		return this._dev._callImitate();
	}
	/**
	 * 
	 * - When imitating tables, if the key can be converted to a number, it will be received as a number on the client! So the string `"1"` will always be the number
	 * `1` on the client. This is to support `arrays`. If you require to use an ordered dictionary (basically an array, so just use `array`), then you will need to name
	 * them where `tonumber` will return nil, e.g. "one", "two", "three"
	 * ## NOTE
	 * This will run `synchronously`, If an error occurs, the `Imitation` object will fallback to the previously validated version. That being said, for consistency
	 * You should call this method everytime you make a change to the `Imitation` object, or there will be cases where if you added a value which is fine, then later added a value
	 * which will cause an error and then called `ImitateSync`, It will fallback to the previous successful `ImitateSync` which will be before the fine value was added, losing the value completely.
	 * 
	 * Use `ImitateSync` for the opposite of this behaviour.
\	 */
	ImitateSync(): RT | undefined {
		const [Success, Results] = this._dev._callImitate(true).await();
		if (Success) {
			return Results;
		}
		return undefined;
	}

	/**
	 * # DO NOT USE.
	 *
	 * @private
	 * @hidden
	 * @deprecated
	 */
	_clientOwnsToken: Player | undefined = undefined;

	constructor(
		private tokenId: string,
		schema: unknown,
		private readonly props?: unknown,
		securedTokenKeys?: tokenSecuredKeys,
	) {
		super("ImitToken");
		type t = { [key: string]: unknown };
		const formattedToken = FormatTokenId(this.tokenId);
		this.useReferenceInstanceBehaviour();
		this._dev.ReceiveDataTransmittionCallbacks = [];
		const ReplicatorFolder = this.CreateReplicatorFolder();
		this._dev.ReplicatorFolder = ReplicatorFolder;
		const TokenEventer = new Instance("RemoteEvent");
		TokenEventer.Name = "TokenEventer";
		TokenEventer.Parent = this.GetRef();
		this._dev.TokenEventer = TokenEventer;

		let _Serializer: Serializer | undefined;
		const GetSerializer = (): Serializer => {
			if (_Serializer) {
				return _Serializer;
			}
			_Serializer = new Serializer(ReplicatorFolder.Name);
			this._dev._Serializer = _Serializer;
			return _Serializer;
		};

		TokenEventer.OnServerEvent.Connect((Player, queryEventType, ...args) => {
			if (typeIs(queryEventType, "string")) {
				const et = queryEventType as TokenEventerEventType;
				if (et === "$initialize") {
					TokenEventer.FireClient(
						Player,
						"$initialize",
						this._dev.ReplicatorFolder,
						this._GetSecuredReplicationPropsForClient(Player),
						this.props,
					);
				} else if (et === "$send") {
					this._dev.ReceiveDataTransmittionCallbacks.forEach((x) => {
						x(Player, ...args);
					});
				}
			}
		});

		const ServiceTokensFolder = nIS._dev.RS.FindFirstChild("Tokens") as Folder;
		let useParent: Folder = ServiceTokensFolder;
		if (formattedToken.TokenIsWildCard) {
			let existingScope = ServiceTokensFolder.FindFirstChild(formattedToken.TokenName) as Folder | undefined;
			if (existingScope === undefined) {
				existingScope = new Instance("Folder");
				existingScope.Name = formattedToken.TokenName;
				existingScope.Parent = ServiceTokensFolder;
			}
			useParent = existingScope;
		}

		this.Name = formattedToken.TokenValue;
		this.Parent = useParent;

		this.useDestroying(() => {
			TokenEventer.FireAllClients("$destroy");
			RunService.Stepped.Wait();
			if (useParent.GetChildren().size() === 1) {
				useParent.Destroy();
			}
		}, true);

		const _ADD_TO_SECURE_REPLICATION_TABLE = (key: string, v: { value: unknown; restrictedTo: number[] }) => {
			this.SecuredReplicationTable[key] = v;
		};
		const _REMOVE_FROM_SECURE_REPLICATION_TABLE = (key: string) => {
			delete this.SecuredReplicationTable[key];
		};

		function setAttributes(t: t, _: unknown): string[] {
			const usedAttributes: string[] = [];
			for (const [a, b] of pairs(t)) {
				if (securedTokenKeys !== undefined && securedTokenKeys[a]) {
					const secured = securedTokenKeys[a];
					if (secured === false) {
						continue;
					}
					_ADD_TO_SECURE_REPLICATION_TABLE(a as string, {
						value: b,
						restrictedTo: secured === true ? [] : secured,
					});
					if (secured === true) {
						TokenEventer.FireAllClients("$secure-imit", a, b);
					} else {
						secured.forEach((x) => {
							const Player = game.GetService("Players").GetPlayerByUserId(x);
							if (Player !== undefined) {
								TokenEventer.FireClient(Player, "$secure-imit", a, b);
							} else {
								warn(
									`Tried to securely imit "${a}" to client id "${x}" but the Player could not be resolved in server.`,
								);
							}
						});
					}
					continue;
				}
				_REMOVE_FROM_SECURE_REPLICATION_TABLE(a as string);
				const [s, r] = pcall(() => {
					ReplicatorFolder.SetAttribute(a as string, b as AttributeValue);
				});
				if (!s) {
					const [_s, Encoded] = pcall(() => {
						return GetSerializer().Encode(b);
					});
					if (!_s) {
						warn(
							`Ignoring key: "${a}". The value could not be attributed. ERR01: ${r}\n\nERR02:${Encoded}`,
						);
						continue;
					}
					ReplicatorFolder.SetAttribute(a as string, `$_->{${Encoded}}`);
				}
				usedAttributes.push(a as string);
			}
			return usedAttributes;
		}
		// // optimize, since changing a,b will make client run change for a, then b. add attributes in bulk or something.
		// function setAttributes(targetLevelTable: t, append: string | undefined, usedAttributes?: string[]) {
		// 	let length = 0;
		// 	for (const [_, __] of pairs(targetLevelTable)) {
		// 		length++;
		// 	}
		// 	if (!usedAttributes) {
		// 		usedAttributes = [];
		// 	}
		// 	let index = 0;
		// 	const tablesToRunSetAttrubutesOnAfter: { object: object; key: string }[] = [];
		// 	for (const [a, b] of pairs(targetLevelTable)) {
		// 		index++;
		// if (securedTokenKeys !== undefined && securedTokenKeys[a]) {
		// 	const secured = securedTokenKeys[a];
		// 	if (secured === false) {
		// 		continue;
		// 	}
		// 	_ADD_TO_SECURE_REPLICATION_TABLE(a as string, {
		// 		value: b,
		// 		restrictedTo: secured === true ? [] : secured,
		// 	});
		// 	if (secured === true) {
		// 		TokenEventer.FireAllClients("$secure-imit", a, b);
		// 	} else {
		// 		secured.forEach((x) => {
		// 			const Player = game.GetService("Players").GetPlayerByUserId(x);
		// 			if (Player !== undefined) {
		// 				TokenEventer.FireClient(Player, "$secure-imit", a, b);
		// 			} else {
		// 				warn(
		// 					`Tried to securely imit "${a}" to client id "${x}" but the Player could not be resolved in server.`,
		// 				);
		// 			}
		// 		});
		// 	}
		// 	continue;
		// }
		// _REMOVE_FROM_SECURE_REPLICATION_TABLE(a as string);
		// 		const indexed_str = `${index}_${length}_`;
		// 		let key: string = append !== undefined ? append + `00101110` + (a as string) : (a as string);
		// 		if (typeIs(b, "table")) {
		// 			tablesToRunSetAttrubutesOnAfter.push({
		// 				object: b,
		// 				key: key,
		// 			});
		// 		} else {
		// 			key = `${indexed_str}${key}`;
		// 			if (key.size() > 100) {
		// 				warn(
		// 					`The key ${key} exceeds the 100 letter attribute treshold, it will be imitted securely instead.`,
		// 				);
		// 			} else {
		// 				usedAttributes.push(key);
		// 				let ub = b;
		// 				if (typeIs(b, "Instance")) {
		// 					keys_with_tracked_instance_values[key] = true;
		// 					let in_tracked = tracked_instance_values.get(b);
		// 					if (in_tracked === undefined) {
		// 						const uid = HttpService.GenerateGUID(true);
		// 						const r = {
		// 							count: 1,
		// 							guid: uid,
		// 							c: b.Destroying.Connect(() => {
		// 								tracked_instance_values.delete(b);
		// 							}),
		// 							k: key,
		// 						};
		// 						const objectValue = new Instance("ObjectValue");
		// 						objectValue.Name = uid;
		// 						objectValue.Value = b;
		// 						objectValue.Parent = instance_value_container();
		// 						tracked_instance_values.set(b, r);
		// 						in_tracked = r;
		// 					}
		// 					ub = `$instancevalue!:${in_tracked.guid}`;
		// 				} else {
		// 					// not an instance
		// 					if (keys_with_tracked_instance_values[key] === true) {
		// 						for (const [a, b] of tracked_instance_values) {
		// 							if (b.k === key) {
		// 								tracked_instance_values.delete(a);
		// 								break;
		// 							}
		// 						}
		// 						delete keys_with_tracked_instance_values[key];
		// 					}
		// 				}
		// 				ReplicatorFolder.SetAttribute(key, ub as AttributeValue);
		// 			}
		// 		}
		// 	}
		// 	tablesToRunSetAttrubutesOnAfter.forEach((x) => {
		// 		setAttributes(x.object as t, x.key, usedAttributes);
		// 	});
		// 	return usedAttributes;
		// }
		const initial = execSync(schema, {});
		let currentRes: object = deepCopyClone(initial as object);
		(this.Imitation as any) = initial;
		setAttributes(initial as t, undefined);
		this._dev._callImitate = (fallbackToPreviousOnFailure) => {
			return exec(schema, this.Imitation)
				.then((res) => {
					currentRes = deepCopyClone(res as object);
					const usedAttributes = setAttributes(res as t, undefined);
					ReplicatorFolder.GetAttributes().forEach((_, i) => {
						if (usedAttributes.indexOf(i) === -1) {
							ReplicatorFolder.SetAttribute(i, undefined);
						}
					});
				})
				.catch((err) => {
					if (fallbackToPreviousOnFailure) {
						this.Imitation = currentRes as RT;
					}
					warn(`[ ImitiationService ] => ${err}`);
				}) as unknown as Promise<RT>;
		};
		// currentRes = initial;
		// metatable.Bind(() => {

		// });
	}
}

let nIS: ImitationService;
if (!IsClient) {
	nIS = new ImitationService();
}

/**
 * Create a schema,
 * ### Schema must be wrapped in an object or dictionary.
 */
export function createSchema<T>(cb: (primitives: typeof PrimitivesForSchema) => T): T extends object ? T : never {
	return cb(PrimitivesForSchema) as never;
}
export { nIS as ImitationService };
