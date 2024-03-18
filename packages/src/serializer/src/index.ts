/* eslint-disable roblox-ts/no-private-identifier */

import { Pseudo, Engine } from "@mekstuff-rbxts/core";

const HttpService = game.GetService("HttpService");
const RunService = game.GetService("RunService");

type EncodedData = string;

type EncodeOptions = {
	EncodeInstances?: boolean;
};
type DecodeOptions = {
	/**
	 * How long the Instance Decoder will yield for Instances that were initialized with a Parent that the realm cannot resolve
	 * e.g. If you `Encoded` an `Instance` on the `Server` but didn't `Parent` it or `Parented` it to `ServerScriptServices` and attempted
	 * to `Decode` on the `Client`, It will be considered a `NonGameDescendantInstance`.
	 *
	 * Defaults to `8`
	 */
	NonGameDescendantInstancesYieldTime?: number;
};

type _EN_DE_Coder = {
	Encode: (Data: any, EncodeOptions?: EncodeOptions) => EncodedData; //eslint-disable-line @typescript-eslint/no-explicit-any
	Decode: (Input: string, DecodeOptions?: DecodeOptions) => unknown;
};

type UnknownTable = { [key: string]: unknown };

function GetInstanceReferencesContainer(): Folder {
	const n = "@mekstuff-rbxts/serialize-ins_refs_container";
	const InRS = Engine.FetchReplicatedStorage().FindFirstChild(n);
	if (InRS) {
		return InRS as Folder;
	}
	const _new = new Instance("Folder");
	_new.Name = n;
	_new.Parent = Engine.FetchReplicatedStorage();
	return _new;
}

const PRIVATE_EN_DE_GLOBAL_SEPERATOR = "_/>/_";

/**
 * Serialize DataTypes.
 *
 * TODO: Properties that get defaulted can be excluded from the Encoded string to get smaller
 * Encoded string.
 */
export class Serializer<T = unknown> extends Pseudo {
	_EN_DE: Record<string, _EN_DE_Coder> = {
		string: {
			Encode: (str: string) => {
				if (str === "") {
					return `___blank$string___`;
				}
				return str;
			},
			Decode: (str) => {
				if (str === "___blank$string___") {
					return "";
				}
				return str;
			},
		},
		number: {
			Encode: (value: number) => {
				return tostring(value);
			},
			Decode: (value) => {
				return tonumber(value);
			},
		},
		boolean: {
			Encode: (boolState: boolean) => {
				if (boolState === true) {
					return "1";
				}
				return "0";
			},
			Decode: (boolState) => {
				if (boolState === "1") {
					return true;
				}
				return false;
			},
		},
		table: {
			Encode: (_table: UnknownTable, ...args) => {
				const t: UnknownTable = {};
				for (const [a, b] of pairs(_table)) {
					t[this.Encode(a as T, ...args) as string] = this.Encode(b as T, ...args) as never;
				}
				return HttpService.JSONEncode(t);
			},
			Decode: (str, ...args) => {
				const t: UnknownTable = {};
				const decoded = HttpService.JSONDecode(str as string);
				for (const [a, b] of pairs(decoded as UnknownTable)) {
					t[this.Decode(a as EncodedData, ...args) as string] = this.Decode(b as EncodedData, ...args);
				}
				return t;
			},
		},

		BrickColor: {
			Encode: (BrickColor: BrickColor) => {
				return `${BrickColor.r},${BrickColor.g},${BrickColor.b}`;
			},
			Decode: (str) => {
				const [r, g, b] = str.match("(.+),(.+),(.+)");
				return new BrickColor(r as number, g as number, b as number);
			},
		},
		CatalogSearchParams: {
			Encode: (CatalogSearchParams: CatalogSearchParams, ...args) => {
				return this._EN_DE.table.Encode(
					{
						AssetTypes: CatalogSearchParams.AssetTypes,
						BundleTypes: CatalogSearchParams.BundleTypes,
						CategoryFilter: CatalogSearchParams.CategoryFilter,
						CreatorName: CatalogSearchParams.CreatorName,
						IncludeOffSale: CatalogSearchParams.IncludeOffSale,
						MaxPrice: CatalogSearchParams.MaxPrice,
						MinPrice: CatalogSearchParams.MinPrice,
						SalesTypeFilter: CatalogSearchParams.SalesTypeFilter,
						SearchKeyword: CatalogSearchParams.SearchKeyword,
						SortAggregation: CatalogSearchParams.SortAggregation,
						SortType: CatalogSearchParams.SortType,
					} as T,
					...args,
				);
			},
			Decode: (str, ...args) => {
				const _CatalogSearchParams = new CatalogSearchParams() as unknown as UnknownTable;
				for (const [a, b] of pairs(this._EN_DE.table.Decode(str, ...args) as UnknownTable)) {
					_CatalogSearchParams[a] = b;
				}
				return _CatalogSearchParams;
			},
		},
		CFrame: {
			Encode: (CFrame: CFrame, ...args) => {
				const [x, y, z, R00, R01, R02, R10, R11, R12, R20, R21, R22] = CFrame.GetComponents();
				return this._EN_DE.table.Encode(
					{
						pos: new Vector3(x, y, z),
						vX: new Vector3(R00, R10, R20),
						vY: new Vector3(R01, R11, R21),
						// vZ: new Vector3(R02, R12, R22),
					},
					...args,
				);
			},
			Decode: (str, ...args) => {
				const _CFrame = this._EN_DE.table.Decode(str, ...args) as UnknownTable;
				return CFrame.fromMatrix(
					_CFrame.pos as Vector3,
					_CFrame.vX as Vector3,
					_CFrame.vY as Vector3,
					// _CFrame.vZ as Vector3,
				);
			},
		},
		Color3: {
			Encode: (Color3: Color3) => {
				return `${Color3.R},${Color3.G},${Color3.B}`;
			},
			Decode: (str) => {
				const [r, g, b] = str.match("([%d%.]+),([%d%.]+),([%d%.]+)");
				return new Color3(r as number, g as number, b as number);
			},
		},
		ColorSequence: {
			Encode: (ColorSequence: ColorSequence, ...args) => {
				return this._EN_DE.table.Encode(ColorSequence.Keypoints, ...args);
			},
			Decode: (str, ...args) => {
				return new ColorSequence(this._EN_DE.table.Decode(str, ...args) as ColorSequenceKeypoint[]);
			},
		},
		ColorSequenceKeypoint: {
			Encode: (ColorSequenceKeypoint: ColorSequenceKeypoint, ...args) => {
				return `${this._EN_DE.number.Encode(ColorSequenceKeypoint.Time, ...args)}|${this._EN_DE.Color3.Encode(
					ColorSequenceKeypoint.Value,
					...args,
				)}`;
			},
			Decode: (str, ...args) => {
				const [Time, Color3Text] = str.split("|");
				return new ColorSequenceKeypoint(
					this._EN_DE.number.Decode(Time, ...args) as number,
					this._EN_DE.Color3.Decode(Color3Text, ...args) as Color3,
				);
			},
		},
		DateTime: {
			Encode: (DateTime: DateTime, ...args) => {
				return this._EN_DE.number.Encode(DateTime.UnixTimestampMillis, ...args);
			},
			Decode: (str, ...args) => {
				return DateTime.fromUnixTimestampMillis(this._EN_DE.number.Decode(str, ...args) as number);
			},
		},
		Enum: {
			Encode: (Enum: Enum) => {
				return tostring(Enum);
			},
			Decode: (str) => {
				return Enum[str as never];
			},
		},
		EnumItem: {
			Encode: (EnumItem: EnumItem, ...args) => {
				return this._EN_DE.table.Encode(
					{
						Name: EnumItem.Name,
						Type: tostring(EnumItem.EnumType), // we do not need to serialize the actual EnumItem, just the name.
						Value: EnumItem.Value,
					},
					...args,
				);
			},
			Decode: (str, ...args) => {
				const Decoded = this._EN_DE.table.Decode(str, ...args) as UnknownTable;
				return ((Enum as UnknownTable)[Decoded.Type as never] as UnknownTable)[Decoded.Name as never];
			},
		},
		Font: {
			Encode: (Font: Font, ...args) => {
				return `${this._EN_DE.string.Encode(Font.Family, ...args)}|${this._EN_DE.EnumItem.Encode(
					Font.Weight,
					...args,
				)}|${this._EN_DE.EnumItem.Encode(Font.Style, ...args)}|${this._EN_DE.EnumItem.Encode(
					Font.Weight,
					...args,
				)}`;
			},
			Decode: (str, ...args) => {
				const [Family, Weight, Style, Bold] = str.split("|");
				return new Font(
					this._EN_DE.string.Decode(Family, ...args) as string,
					this._EN_DE.EnumItem.Decode(Weight, ...args) as Enum.FontWeight,
					this._EN_DE.EnumItem.Decode(Style, ...args) as Enum.FontStyle,
				);
			},
		},
		Instance: {
			Encode: (_Instance: Instance, EncodeOptions) => {
				const EncodeInstance = EncodeOptions?.EncodeInstances ?? undefined;
				if (EncodeInstance) {
					throw "Encoded Instances are not yet supported.";
				}
				let RefId: string | undefined;
				if (!EncodeInstance) {
					const HasReference = GetInstanceReferencesContainer()
						.GetChildren()
						.find((x) => {
							if (x.IsA("ObjectValue")) {
								if (x.Value === _Instance) {
									return true;
								}
							}
							return undefined;
						});
					if (HasReference) {
						RefId = HasReference.Name;
					} else {
						const Ref = new Instance("ObjectValue");
						RefId = HttpService.GenerateGUID();
						Ref.Name = RefId;
						Ref.Value = _Instance;
						Ref.Parent = GetInstanceReferencesContainer();
					}
				}
				return this._EN_DE.table.Encode(
					{
						R: RefId,
						E: EncodeInstance,
						RE: RunService.IsClient() ? "C" : "S",
						D: !EncodeInstance ? _Instance.IsDescendantOf(game) : undefined,
					},
					EncodeOptions,
				);
			},
			Decode: (str, DecodeOptions) => {
				const _Instance = this._EN_DE.table.Decode(str, DecodeOptions) as {
					R: string;
					E: boolean;
					RE: "S" | "C"; // S - Server | C - Client
					D: boolean | undefined;
				};
				if (_Instance.RE === "C" && RunService.IsServer()) {
					throw "You cannot Decode Instances from Client -> Server.";
				}
				if (_Instance.E) {
					// Encoded Instance, create it.
					throw "Encoded Instances are not yet supported.";
				} else {
					// Not encoded, so use "real"/"reference" Instance
					const RefId = _Instance.R;
					if (RefId === undefined) {
						print(_Instance);
						throw "The ReferenceId for the Instance was not set, It is needed of Instance Encoding is not enabled. Instance in question printed above ^^^";
					}
					const targetRef = GetInstanceReferencesContainer().FindFirstChild(RefId) as ObjectValue | undefined;
					if (!targetRef) {
						print(_Instance);
						throw `The ReferenceId "${RefId}" for the Instance is not valid. Instance in question printed above ^^^`;
					}
					if (targetRef.Value !== undefined) {
						return targetRef.Value;
					}
					const InSameRealm =
						(RunService.IsClient() && _Instance.RE === "C") ||
						(RunService.IsServer() && _Instance.RE === "S") ||
						false;
					if (InSameRealm) {
						throw `An encoded Instance of RefId "${RefId}" within the same realm could not be found, This should not happen.`;
					}
					if (!_Instance.D) {
						// Was not descendant of game, wait for it.
						let _break = false;
						let _t = 1;
						const C = targetRef.Changed.Connect(() => {
							_break = true;
						});
						const DO_NDIYT = DecodeOptions?.NonGameDescendantInstancesYieldTime ?? 8;
						while (_break === false && targetRef.Parent !== undefined) {
							if (_t > DO_NDIYT) {
								if (C) {
									C.Disconnect();
								}
								break;
							}
							if (_t === math.floor(DO_NDIYT / 2)) {
								warn(
									`Waited ${_t}/${DO_NDIYT}s for RefId "${RefId}" Value to resolve. Make sure that the Instance is accessible across the target realm.`,
								);
							}
							_t++;
							task.wait(1);
						}
						if (!targetRef.Value) {
							warn(
								`RefId "${RefId}" Value failed to resolve. Make sure that the Instance is accessible across the target realm.`,
							);
						}
						return targetRef.Value;
					} else {
						// was descendant of game, await replication
						targetRef.Changed.Wait();
						return targetRef.Value;
					}
				}
			},
		},
		NumberRange: {
			Encode: (NumberRange: NumberRange, ...args) => {
				return `${this._EN_DE.number.Encode(NumberRange.Min, ...args)},${this._EN_DE.number.Encode(
					NumberRange.Max,
					...args,
				)}`;
			},
			Decode: (str, ...args) => {
				const [Min, Max] = str.split(",");
				return new NumberRange(
					this._EN_DE.number.Decode(Min, ...args) as number,
					this._EN_DE.number.Decode(Max, ...args) as number,
				);
			},
		},
		NumberSequence: {
			Encode: (NumberSequence: NumberSequence, ...args) => {
				return this._EN_DE.table.Encode(NumberSequence.Keypoints, ...args);
			},
			Decode: (str, ...args) => {
				return new NumberSequence(this._EN_DE.table.Decode(str, ...args) as NumberSequenceKeypoint[]);
			},
		},
		NumberSequenceKeypoint: {
			Encode: (NumberSequenceKeypoint: NumberSequenceKeypoint, ...args) => {
				return `${this._EN_DE.number.Encode(NumberSequenceKeypoint.Time, ...args)}|${this._EN_DE.number.Encode(
					NumberSequenceKeypoint.Value,
					...args,
				)}|${this._EN_DE.number.Encode(NumberSequenceKeypoint.Envelope, ...args)}`;
			},
			Decode: (str, ...args) => {
				const [Time, ValueText, EnvelopeText] = str.split("|");
				return new NumberSequenceKeypoint(
					this._EN_DE.number.Decode(Time, ...args) as number,
					this._EN_DE.number.Decode(ValueText, ...args) as number,
					this._EN_DE.number.Decode(EnvelopeText, ...args) as number,
				);
			},
		},
		OverlapParams: {
			Encode: (OverlapParams: OverlapParams, ...args) => {
				return this._EN_DE.table.Encode(
					{
						FilterDescendantsInstances: OverlapParams.FilterDescendantsInstances,
						FilterType: OverlapParams.FilterType,
						MaxParts: OverlapParams.MaxParts,
						CollisionGroup: OverlapParams.CollisionGroup,
						RespectCanCollide: OverlapParams.RespectCanCollide,
						BruteForceAllSlow: OverlapParams.BruteForceAllSlow,
					} as T,
					...args,
				);
			},
			Decode: (str, ...args) => {
				const _OverlapParams = new OverlapParams() as unknown as UnknownTable;
				for (const [a, b] of pairs(this._EN_DE.table.Decode(str, ...args) as UnknownTable)) {
					_OverlapParams[a] = b;
				}
				return _OverlapParams;
			},
		},
		PathWaypoint: {
			Encode: (PathWaypoint: PathWaypoint, ...args) => {
				return this._EN_DE.table.Encode(
					{
						Position: PathWaypoint.Position,
						Action: PathWaypoint.Action,
						Label: PathWaypoint.Label,
					} as T,
					...args,
				);
			},
			Decode: (str, ...args) => {
				const _PathWaypoint = this._EN_DE.table.Decode(str, ...args) as UnknownTable;
				return new PathWaypoint(
					_PathWaypoint.Position as Vector3,
					_PathWaypoint.Action as Enum.PathWaypointAction,
					_PathWaypoint.Label as string,
				);
			},
		},
		PhysicalProperties: {
			Encode: (PhysicalProperties: PhysicalProperties, ...args) => {
				return this._EN_DE.table.Encode(
					{
						Density: PhysicalProperties.Density,
						Friction: PhysicalProperties.Friction,
						Elasticity: PhysicalProperties.Elasticity,
						FrictionWeight: PhysicalProperties.FrictionWeight,
						ElasticityWeight: PhysicalProperties.ElasticityWeight,
					} as T,
					...args,
				);
			},
			Decode: (str, ...args) => {
				const _PhysicalProperties = this._EN_DE.table.Decode(str, ...args) as UnknownTable;
				return new PhysicalProperties(
					_PhysicalProperties.Density as number,
					_PhysicalProperties.Friction as number,
					_PhysicalProperties.elasticity as number,
					_PhysicalProperties.frictionWeight as number,
					_PhysicalProperties.elasticityWeight as number,
				);
			},
		},
		RaycastParams: {
			Encode: (RaycastParams: RaycastParams, ...args) => {
				return this._EN_DE.table.Encode(
					{
						FilterDescendantsInstances: RaycastParams.FilterDescendantsInstances,
						FilterType: RaycastParams.FilterType,
						IgnoreWater: RaycastParams.IgnoreWater,
						CollisionGroup: RaycastParams.CollisionGroup,
						RespectCanCollide: RaycastParams.RespectCanCollide,
						BruteForceAllSlow: RaycastParams.BruteForceAllSlow,
					} as T,
					...args,
				);
			},
			Decode: (str, ...args) => {
				const _RaycastParams = new RaycastParams() as unknown as UnknownTable;
				for (const [a, b] of pairs(this._EN_DE.table.Decode(str, ...args) as UnknownTable)) {
					_RaycastParams[a] = b;
				}
				return _RaycastParams;
			},
		},
		TweenInfo: {
			Encode: (TweenInfo: TweenInfo, ...args) => {
				return this._EN_DE.table.Encode(
					{
						Time: TweenInfo.Time,
						EasingStyle: TweenInfo.EasingStyle,
						EasingDirection: TweenInfo.EasingDirection,
						RepeatCount: TweenInfo.RepeatCount,
						Reverses: TweenInfo.Reverses,
						DelayTime: TweenInfo.DelayTime,
					} as T,
					...args,
				);
			},
			Decode: (str, ...args) => {
				const _TweenInfo = this._EN_DE.table.Decode(str, ...args) as UnknownTable;
				return new TweenInfo(
					_TweenInfo.Time as number,
					_TweenInfo.EasingStyle as Enum.EasingStyle,
					_TweenInfo.EasingDirection as Enum.EasingDirection,
					_TweenInfo.RepeatCount as number,
					_TweenInfo.Reverses as boolean,
					_TweenInfo.DelayTime as number,
				);
			},
		},
		UDim: {
			Encode: (UDim: UDim, ...args) => {
				return `${this._EN_DE.number.Encode(UDim.Scale, ...args)},${this._EN_DE.number.Encode(
					UDim.Offset,
					...args,
				)}`;
			},
			Decode: (str, ...args) => {
				const [Scale, Offset] = str.split(",");
				return new UDim(
					this._EN_DE.number.Decode(Scale, ...args) as number,
					this._EN_DE.number.Decode(Offset, ...args) as number,
				);
			},
		},
		UDim2: {
			Encode: (UDim2: UDim2, ...args) => {
				return `${this._EN_DE.number.Encode(UDim2.X.Scale, ...args)},${this._EN_DE.number.Encode(
					UDim2.X.Offset,
					...args,
				)},${this._EN_DE.number.Encode(UDim2.Y.Scale, ...args)},${this._EN_DE.number.Encode(
					UDim2.Y.Offset,
					...args,
				)}`;
			},
			Decode: (str, ...args) => {
				const [XScale, XOffset, YScale, YOffset] = str.split(",");
				return new UDim2(
					this._EN_DE.number.Decode(XScale, ...args) as number,
					this._EN_DE.number.Decode(XOffset, ...args) as number,
					this._EN_DE.number.Decode(YScale, ...args) as number,
					this._EN_DE.number.Decode(YOffset, ...args) as number,
				);
			},
		},
		Vector2: {
			Encode: (Vector2: Vector2, ...args) => {
				return `${this._EN_DE.number.Encode(Vector2.X, ...args)},${this._EN_DE.number.Encode(
					Vector2.Y,
					...args,
				)}`;
			},
			Decode: (str, ...args) => {
				const [X, Y] = str.split(",");
				return new Vector2(
					this._EN_DE.number.Decode(X, ...args) as number,
					this._EN_DE.number.Decode(Y, ...args) as number,
				);
			},
		},
		Vector2int16: {
			Encode: (Vector2int16: Vector2int16, ...args) => {
				return `${this._EN_DE.number.Encode(Vector2int16.X, ...args)},${this._EN_DE.number.Encode(
					Vector2int16.Y,
					...args,
				)}`;
			},
			Decode: (str, ...args) => {
				const [X, Y] = str.split(",");
				return new Vector2int16(
					this._EN_DE.number.Decode(X, ...args) as number,
					this._EN_DE.number.Decode(Y, ...args) as number,
				);
			},
		},
		Vector3: {
			Encode: (Vector3: Vector3, ...args) => {
				return `${this._EN_DE.number.Encode(Vector3.X, ...args)},${this._EN_DE.number.Encode(
					Vector3.Y,
					...args,
				)},${this._EN_DE.number.Encode(Vector3.Z, ...args)}`;
			},
			Decode: (str, ...args) => {
				const [X, Y, Z] = str.split(",");
				return new Vector3(
					this._EN_DE.number.Decode(X, ...args) as number,
					this._EN_DE.number.Decode(Y, ...args) as number,
					this._EN_DE.number.Decode(Z, ...args) as number,
				);
			},
		},
		Vector3int16: {
			Encode: (Vector3int16: Vector3int16, ...args) => {
				return `${this._EN_DE.number.Encode(Vector3int16.X, ...args)},${this._EN_DE.number.Encode(
					Vector3int16.Y,
					...args,
				)},${this._EN_DE.number.Encode(Vector3int16.Z, ...args)}`;
			},
			Decode: (str, ...args) => {
				const [X, Y, Z] = str.split(",");
				return new Vector3int16(
					this._EN_DE.number.Decode(X, ...args) as number,
					this._EN_DE.number.Decode(Y, ...args) as number,
					this._EN_DE.number.Decode(Z, ...args) as number,
				);
			},
		},
	};
	private _Get_EN_DE(Type: string): _EN_DE_Coder {
		const encoder = this._EN_DE[Type];
		if (!encoder) {
			throw `No _EN_DE exists for type "${Type}"`;
		}
		return encoder;
	}
	private _EncoderShortenTypes: Record<string, string> = {
		string: "s",
		number: "n",
		boolean: "b",
		table: "t",
		BrickColor: "BC",
		CatalogSearchParams: "CSP",
		CFrame: "CF",
		Color3: "C3",
		ColorSequence: "CS",
		ColorSequenceKeypoint: "CSKp",
		DateTime: "DT",
		Enum: "E",
		EnumItem: "ET",
		Font: "F",
		Instance: "I",
		NumberRange: "NR",
		NumberSequence: "NS",
		NumberSequenceKeypoint: "NSKp",
		OverlapParams: "OlP",
		PathWaypoint: "PWp",
		PhysicalProperties: "PP",
		RaycastParams: "RcP",
		TweenInfo: "TI",
		UDim: "UD",
		UDim2: "UD2",
	};
	private _EncoderShortenTypes_Inverse: Record<string, string> = {};
	private _GetShortenEncoderType(Type: string) {
		const target = this._EncoderShortenTypes[Type];
		if (target !== undefined) {
			return target;
		}
		return Type;
	}
	private _GetDefaultEncoderType(ShortenEncoderType: string) {
		const target = this._EncoderShortenTypes_Inverse[ShortenEncoderType];
		if (target !== undefined) {
			return target;
		}
		return ShortenEncoderType;
	}
	/**
	 * Supported Datatypes:
	 * * string
	 * * number
	 * * boolean
	 * * table
	 * * BrickColor
	 * * CatalogSearchParams
	 * * CFrame
	 * * Color3
	 * * ColorSequence
	 * * ColorSequenceKeypoint
	 * * DateTime
	 * * Enum
	 * * EnumItem
	 * * Font
	 * * Instance
	 * * NumberRange
	 * * NumberSequence
	 * * NumberSequenceKeypoint
	 * * OverlapParams
	 * * PathWaypoint
	 * * PhysicalProperties
	 * * RaycastParams
	 * * TweenInfo
	 * * UDim
	 * * UDim2
	 */
	Encode(Data: T, Options?: EncodeOptions): EncodedData {
		return `${this._SerializerId.gsub("[^%w%s_]+", "")[0]}=${this._GetShortenEncoderType(
			typeOf(Data),
		)}${PRIVATE_EN_DE_GLOBAL_SEPERATOR}${this._Get_EN_DE(typeOf(Data)).Encode(Data, Options)}`;
	}
	Decode(EncodedData: EncodedData, Options?: DecodeOptions): T {
		const [EncodeHeading, Data] = EncodedData.match("^(.-)" + PRIVATE_EN_DE_GLOBAL_SEPERATOR + "(.+)");
		assert(typeIs(EncodeHeading, "string"), "Could not resolve the Encoded Heading from the Encoded data.");
		assert(typeIs(Data, "string"), "Could not resolve the Encoded Data.");
		const EncodedHeadingType = EncodeHeading.match(`${this._SerializerId.gsub("[^%w%s_]+", "")[0]}=(.+)`)[0]; // joins the serializer id with = to match the value. Also removes special characters from serializerId
		assert(
			typeIs(EncodedHeadingType, "string"),
			"Could not resolve the Type from the Encoded Heading. Make sure that the _SerializerId's are the same.",
		);

		return this._Get_EN_DE(this._GetDefaultEncoderType(EncodedHeadingType)).Decode(Data, Options) as T;
	}
	constructor(private _SerializerId: string) {
		super("Serializer");
		for (const [a, b] of pairs(this._EncoderShortenTypes)) {
			this._EncoderShortenTypes_Inverse[b] = a;
		}
	}
}
