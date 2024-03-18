/* eslint-disable roblox-ts/no-private-identifier */
import { Engine, Pseudo, Servant, typeIs } from "@mekstuff-rbxts/core";
import { Grid3D } from "./Grid3D";
import { usePropertyEffectCallback } from "@mekstuff-rbxts/core/out/Pseudo";
import ValueResolver, { GetCFrameValueInputTypes } from "@mekstuff-rbxts/value-resolver";

declare global {
	namespace PHe {
		/** A list of pseudo classes*/
		interface Pseudos {
			Placer3D: Placer3D;
		}
		/**
		 * Types that can be checked with custom _typeIs.
		 */
		interface CheckablePseudos {
			Placer3D: Placer3D;
		}
	}
}

const UserInputService = game.GetService("UserInputService");
const ContextActionService = game.GetService("ContextActionService");

export const Placer3DResultsNormalBehavior = {
	/**
	 *
	 */
	none: "none",
	/**
	 * The resulting CFrame will be calculated where the "top" surface will always be the upVector.
	 */
	fromMatrixTop: "fromMatrixTop",
	/**
	 * The resulting CFrame will be calculated where the "front" surface will always be the lookVector.
	 */
	lookAt: "lookAt",
	/**
	 * The results CFrame will be calculated where while on any surface other than the bottom or top it will be treated as
	 * "lookAt", bottom and top will be treated as "fromMatrixTop"
	 */
	surfaceWall: "surfaceWall",
};

export type PlacementType = "FollowMouse" | "custom";
export type AutoRotate = boolean | Enum.KeyCode | [Enum.KeyCode];
export type Offset = CFrame | Vector3 | undefined;
export type GridUnit = number | Vector3 | undefined;
export type GridNormalId = Enum.NormalId | Enum.NormalId[] | undefined;

export type DefinedPlacer3DResults = {
	readonly Normal: Vector3;
	readonly Position: Vector3;
	readonly Instance: Instance;
};
/**
 * A `Placer3D` enables the ability to place 3D items across a `Grid3D`
 *
 * Note that a `Placer3D` has `Enabled` set to `false` by default.
 */
export class Placer3D extends Pseudo {
	/**
	 * Utilities to aid in using a `Placer3D` object.
	 */
	public utils = {
		GetAreBoundsSufficient(x: boolean, z: boolean, normal: Enum.NormalId): boolean {
			if (normal === Enum.NormalId.Top || normal === Enum.NormalId.Bottom) {
				return x && z;
			}
			if (normal === Enum.NormalId.Left || normal === Enum.NormalId.Right) {
				return x;
			}
			if (normal === Enum.NormalId.Front || normal === Enum.NormalId.Back) {
				return z;
			}
			return false;
		},
		/**
		 * Cast a ray from the screen using `Camera.ScreenPointToRay`.
		 */
		RaycastFromMouse: (
			x: number,
			y: number,
			length = 500,
			RaycastParams?: RaycastParams,
		): RaycastResult | undefined => {
			const Camera = game.Workspace.CurrentCamera;
			if (!Camera) {
				warn(`No CurrentCamera available for ${this.ClassName}.${this.PlacementType}`);
				return;
			}
			const UnitCameraRay = Camera.ScreenPointToRay(x, y);
			return game.Workspace.Raycast(UnitCameraRay.Origin, UnitCameraRay.Direction.mul(length), RaycastParams);
		},

		SetResultsCFrame: (ObjectCF: GetCFrameValueInputTypes): void => {
			this.useAssignReadonlyProperty("_cf", ValueResolver.GetCFrameValue(ObjectCF));
		},
	};

	/**
	 * Enables/Disables the `Placer3D`.
	 */
	public Enabled = true;
	/**
	 * Creates a visual represenation block using the Size and CFrame of the `Placer3D`.
	 */
	public DebugVisualizer = false;
	/**
	 * `Placer3DResultsNormalBehavior` Enum like object for `ResultsNormalBehavior` property. This is also exported
	 * by the `Placer3D` module.
	 */
	public Placer3DResultsNormalBehavior = Placer3DResultsNormalBehavior;
	/**
	 * How the `Placer3D` will react to the current `Normal` from the `Results`.
	 *
	 * Access `Placer3DResultsNormalBehavior` by importing the exported object or using `this.Placer3DResultsNormalBehavior`.
	 *
	 * @default none
	 */
	public ResultsNormalBehavior = Placer3DResultsNormalBehavior.none;
	/**
	 * How the Results are resolved.
	 *
	 * `FollowMouse`- Will follow the users mouse.
	 * `custom` - Custom placement type.
	 */
	public PlacementType: PlacementType = "FollowMouse";
	/**
	 * The RaycastParams used by the "FollowMouse" PlacementType.
	 */
	public RaycastParams: RaycastParams | undefined = undefined;
	/**
	 * The Size of the `Placer3D`.
	 */
	public Size = new Vector3(1, 1, 1);
	/**
	 * The `RaycastResults` of the `Placer3D`, The Placer only uses the `readonly Normal: Vector3`, `readonly Position: Vector3` and `readonly Instance: Instance`
	 * of the Results. From here is where the CFrame and CFrame raw is calculated/
	 */
	public Results: RaycastResult | DefinedPlacer3DResults | undefined = undefined;
	/**
	 * The Rotation of the `Placer3D`, Will affect the `CFrame`, not the `CFrameRaw`.
	 *
	 * Note the rotation is calculated with `fromEulerAnglesXYZ` and radians are expected, not degrees.
	 */
	public Rotation = new Vector3(0, 0, 0);
	/**
	 * By default, the "edges" of the `Placer3D` determines whether it `CanPlace` within a Grid, setting this to through will instead use the `center`
	 * of the `Placer3D`.
	 */
	public BoundsAreCalculatedAtMass = false;
	/**
	 * Automatically updates the rotation with keybind.
	 *
	 * If `true`, `Enum.KeyCode.R` will be used.
	 */
	public AutoRotate: AutoRotate = false;
	/**
	 * The angle at which the `AutoRotate` rotates by.
	 *
	 * This value will be applied in radians.
	 */
	public AutoRotateAngle = 45;
	/**
	 * The Axis that the `AutoRotate` rotates on, Defaults to `Vector3.yAxis`.
	 *
	 * The Unit of the vector is used.
	 */
	public AutoRotateAxis: Vector3 = Vector3.yAxis;
	/**
	 * This offset will be applied to the `CFrameRaw` and `CFrame`
	 */
	public Offset: Offset = undefined;
	/**
	 * Whether or not the `CFrame` will use the `Offset` value
	 */
	public CFrameUsesOffset = true;

	public ResetRotationOnSurfaceChange = false;

	/***/
	public preCFrame?: (cf: CFrame) => CFrame | undefined = undefined;

	/**
	 * The current CFrame if any.
	 */
	public readonly CFrame: CFrame | undefined = undefined;
	private readonly _cf: CFrame | undefined = undefined;
	/**
	 * The current CFrame if any, Excluding the `Rotation` and the Size offset considered.
	 *~/
	public readonly CFrameRaw: CFrame | undefined = undefined;
	*/
	/**
	 * The current active `Grid3D` that the `Placer3D` is on.
	 */
	public readonly ActiveGrid: Grid3D | undefined = undefined;
	/**
	 * The current NormalId/Face that the `Placer3D` is on the `Grid3D`.
	 */
	public readonly ActiveGridNormalId: Enum.NormalId | undefined = undefined;
	/**
	 * Whether or not relative to the `ActiveGrid`, is the `Placer3D` X bounds within the Grids X bounds.
	 *
	 * `BoundsAreCalculatedAtMass` is considered for this value.
	 */
	public readonly IsInXBounds = false;
	/**
	 * Whether or not relative to the `ActiveGrid`, is the `Placer3D` Y bounds within the Grids Y bounds.
	 *
	 * `BoundsAreCalculatedAtMass` is considered for this value.
	 */
	public readonly IsInYBounds = false;
	/**
	 * Whether or not relative to the `ActiveGrid`, is the `Placer3D` Z bounds within the Grids Z bounds.
	 *
	 * `BoundsAreCalculatedAtMass` is considered for this value.
	 */
	public readonly IsInZBounds = false;

	/**
	 * Whether or not the Placer3D is within the bounding box defined by `SetBoundingBox`.
	 *
	 * `BoundsAreCalculatedAtMass` is considered for this value.
	 */
	public readonly IsInBoundingBox = false;

	/**
	 * Whether or not the Placer3D is within the bounding box defined by `SetBoundingBox` on the X axis.
	 *
	 * `BoundsAreCalculatedAtMass` is considered for this value.
	 */
	public readonly IsInBoundingBoxX = false;
	/**
	 * Whether or not the Placer3D is within the bounding box defined by `SetBoundingBox` on the Y axis.
	 *
	 * `BoundsAreCalculatedAtMass` is considered for this value.
	 */
	public readonly IsInBoundingBoxY = false;
	/**
	 * Whether or not the Placer3D is within the bounding box defined by `SetBoundingBox` on the Z axis.
	 *
	 * `BoundsAreCalculatedAtMass` is considered for this value.
	 */
	public readonly IsInBoundingBoxZ = false;

	/**
	 * Enable/Disable the detection of `CanPlace`.
	 */
	public AutoCanPlace = false;
	/**
	 * Whether or not the item can be placed at the current `CFrame`,
	 * On the current `Grid3D`.
	 *
	 * This value ** DOES NOT ** check whether they're overlapping objects.
	 */
	public readonly CanPlace = false;

	/**
	 * By default the Placer will use the `Unit` of the current grid it's on, Setting this value
	 * will use always use this `GridUnit` over the current grid it's on value.
	 */
	public GridUnit: GridUnit = undefined;
	/**
	 * By default the Placer will use the `NormalId` of the current grid it's on, Setting this value
	 * will always use this `GridNormalId` over the current grid it's on value.
	 */
	public GridNormalId: GridNormalId = undefined;

	/**
	 * Used by SetBoundingBox
	 */
	private _BoundToBoundingBox: { cf: CFrame; size: Vector3 } | undefined = undefined;
	/**
	 * Callback will be called whenever the `Results` change.
	 *
	 * Similar to using the `usePropertyEffect` of the Results.
	 */
	useResults(callback: (Results: this["Results"]) => ReturnType<usePropertyEffectCallback>) {
		return this.usePropertyEffect(() => {
			return callback(this.Results);
		}, ["Results"]);
	}
	/**
	 * Callback will be called whenever the `CFrame` change.
	 *
	 * Similar to using the `usePropertyEffect` of the CFrame.
	 */
	useCFrame(callback: (CF: this["CFrame"]) => ReturnType<usePropertyEffectCallback>): Servant {
		return this.usePropertyEffect(() => {
			return callback(this.CFrame);
		}, ["CFrame"]);
	}

	/**
	 * This method will trigger the `Results` render. Causing the CFrame to be updated.
	 */
	_RenderResults() {
		this.useSetNewIndexAssignment("Results", this.Results, true);
	}
	/**
	 * This method will trigger the `_cf` render. Causing the _cf logics to be executed.
	 *
	 * This may be needed in cases where you change the rotation of the Placer3D, as the Results are only rendered
	 * when needed (when the mouse moves for e.g.)
	 */
	_RenderCF() {
		this.useSetNewIndexAssignment("_cf", this._cf, true);
	}

	/**
	 * This will bound the placers CF to the given bounding box
	 */
	public SetBoundingBox(): void;
	public SetBoundingBox(BoundingBox: BasePart): void;
	public SetBoundingBox(BoundingBox: Model): void;
	public SetBoundingBox(BoundingBox: CFrame, BoundingBoxSize: Vector3): void;
	public SetBoundingBox(BoundingBoxCF?: CFrame | Model | BasePart, BoundingBoxSize?: Vector3): void {
		if (!BoundingBoxCF) {
			this._BoundToBoundingBox = undefined;
		}
		let cf: CFrame | undefined;
		let size: Vector3 | undefined;
		if (typeIs(BoundingBoxCF, "CFrame") && typeIs(BoundingBoxSize, "Vector3")) {
			cf = BoundingBoxCF;
			size = BoundingBoxSize;
		} else if (typeIs(BoundingBoxCF, "Instance")) {
			if (BoundingBoxCF.IsA("Model")) {
				const [a, b] = BoundingBoxCF.GetBoundingBox();
				cf = a;
				size = b;
			} else if (BoundingBoxCF.IsA("BasePart")) {
				cf = BoundingBoxCF.CFrame;
				size = BoundingBoxCF.Size;
			}
		}
		if (cf === undefined || size === undefined) {
			throw `The CFrame and Size could not be resolved from your SetBoundingBox call, CFrame must be either a BasePart, Model or CFrame while Size should be a Vector3 only if CFrame is a CFrame, Got CFrame: ${typeOf(
				BoundingBoxCF,
			)} and Size: ${typeOf(BoundingBoxSize)}`;
		}
		this._BoundToBoundingBox = {
			cf: cf,
			size: size,
		};
	}

	public GetBoundingBox(): LuaTuple<[CFrame, Vector3]> | undefined {
		if (this._BoundToBoundingBox) {
			return $tuple(this._BoundToBoundingBox.cf, this._BoundToBoundingBox.size);
		}
		return undefined;
	}

	/**
	 * This method assumes the `this.CFrame` is not `undefined`.
	 *
	 * @param CFrame Use a specified `CFrame` instead of `this.CFrame`.
	 */
	private GetRelativeSize(CFrame?: CFrame): Vector3 {
		const [_, __, ___, R00, R01, R02, R10, R11, R12, R20, R21, R22] = (CFrame ?? this.CFrame!).GetComponents();
		const wsx = math.abs(R00) * this.Size.X + math.abs(R01) * this.Size.Y + math.abs(R02) * this.Size.Z;
		const wsy = math.abs(R10) * this.Size.X + math.abs(R11) * this.Size.Y + math.abs(R12) * this.Size.Z;
		const wsz = math.abs(R20) * this.Size.X + math.abs(R21) * this.Size.Y + math.abs(R22) * this.Size.Z;
		return new Vector3(wsx, wsy, wsz);
	}

	private _GetBoundsObjectSpace(cf: CFrame, objectSpace: CFrame): Vector3 {
		let relativeSize: Vector3 | undefined;
		const getRelativeSize = (): Vector3 => {
			if (relativeSize) {
				return relativeSize;
			}
			relativeSize = this.GetRelativeSize(cf);
			return relativeSize;
		};

		const _x = math.abs(objectSpace.Position.X) + (this.BoundsAreCalculatedAtMass ? 0 : getRelativeSize().X * 0.5);
		const _y = math.abs(objectSpace.Position.Y) + (this.BoundsAreCalculatedAtMass ? 0 : getRelativeSize().Y * 0.5);
		const _z = math.abs(objectSpace.Position.Z) + (this.BoundsAreCalculatedAtMass ? 0 : getRelativeSize().Z * 0.5);
		return new Vector3(_x, _y, _z);
	}
	/**
	 * @param Grid The Grid(s) that the `Placer3D` can be placed on.
	 */
	constructor(public Grid: Grid3D | Grid3D[] | undefined = undefined) {
		super("Placer3D");
		if (game.GetService("RunService").IsServer()) {
			throw "A Placer3D can only be created on the client, instead create a `ServerPlacer3D`.";
		}
		this.Name = this.ClassName;

		this.usePropertyRelationBinding(["AutoRotateAngle", "AutoRotateAxis"], "AutoRotate", true);

		// updating CFrame based on _cf (this allows rotation and offset without having any results)
		this.usePropertyEffect(() => {
			if (this._cf === undefined) {
				this.useAssignReadonlyProperty("CFrame", undefined);
				return;
			}
			let nscf = this._cf;
			// Rotation
			nscf = nscf.mul(CFrame.fromEulerAnglesXYZ(this.Rotation.X, this.Rotation.Y, this.Rotation.Z));
			// Offset
			if (this.CFrameUsesOffset && this.Offset !== undefined) {
				const offsetCF = typeIs(this.Offset, "CFrame") ? this.Offset : new CFrame(this.Offset);
				nscf = nscf.mul(offsetCF);
			}
			// preCFrame
			if (this.preCFrame) {
				const _r = this.preCFrame(nscf);
				assert(typeIs(_r, "CFrame") || typeIs(_r, "nil"), "preCFrame callback must return a CFrame or nil");
				nscf = _r ?? (nscf as CFrame);
			}
			this.useAssignReadonlyProperty("CFrame", nscf);
		}, ["_cf", "Rotation", "CFrameUsesOffset", "Offset"]);

		// updating IsInBoundingBox
		// Bounds (SetBoundingBox, not Grid3D surface bounds)
		this.usePropertyEffect(() => {
			if (this._BoundToBoundingBox) {
				return this.usePropertyEffect(() => {
					if (this.CFrame) {
						const BoundsObjectSpace = this._GetBoundsObjectSpace(
							this.CFrame,
							this._BoundToBoundingBox!.cf.ToObjectSpace(this.CFrame),
						);
						const x = BoundsObjectSpace.X < this._BoundToBoundingBox!.size.X * 0.5;
						const y = BoundsObjectSpace.Y < this._BoundToBoundingBox!.size.Y * 0.5;
						const z = BoundsObjectSpace.Z < this._BoundToBoundingBox!.size.Z * 0.5;
						this.useAssignReadonlyProperty("IsInBoundingBox", x && y && z);
						this.useAssignReadonlyProperty("IsInBoundingBoxX", x);
						this.useAssignReadonlyProperty("IsInBoundingBoxY", y);
						this.useAssignReadonlyProperty("IsInBoundingBoxZ", z);
					} else {
						this.useAssignReadonlyProperty("IsInBoundingBox", false);
						this.useAssignReadonlyProperty("IsInBoundingBoxX", false);
						this.useAssignReadonlyProperty("IsInBoundingBoxY", false);
						this.useAssignReadonlyProperty("IsInBoundingBoxZ", false);
					}
				}, ["CFrame"]);
			} else {
				this.useAssignReadonlyProperty("IsInBoundingBox", false);
				this.useAssignReadonlyProperty("IsInBoundingBoxX", false);
				this.useAssignReadonlyProperty("IsInBoundingBoxY", false);
				this.useAssignReadonlyProperty("IsInBoundingBoxZ", false);
			}
		}, ["_BoundToBoundingBox"]);

		// Surface change reset rotation
		this.usePropertyEffect(() => {
			if (this.ResetRotationOnSurfaceChange) {
				return this.usePropertyRender(() => {
					this.Rotation = Vector3.zero;
				}, ["ActiveGridNormalId"]);
			}
		}, ["ResetRotationOnSurfaceChange"]);

		// Can Place
		this.usePropertyEffect(() => {
			if (this.AutoCanPlace) {
				return this.usePropertyEffect(() => {
					if (!this.CFrame || !this.ActiveGrid || !this.ActiveGridNormalId) {
						this.useAssignReadonlyProperty("CanPlace", false);
						return;
					}
					const GetNormalIdMatch = (
						input: Enum.NormalId,
						check: Enum.NormalId | Enum.NormalId[],
					): boolean => {
						if (typeIs(check, "EnumItem")) {
							return check === input;
						}
						for (const nid of check) {
							if (nid === input) {
								return true;
							}
						}
						return false;
					};
					let TargetGridNormalIds: Enum.NormalId | Enum.NormalId[];
					if (this.GridNormalId) {
						// This Placer specifies its own normal id
						TargetGridNormalIds = this.GridNormalId;
					} else {
						// Use the normal id of the current grid;
						TargetGridNormalIds = this.ActiveGrid.NormalId;
					}

					if (!GetNormalIdMatch(this.ActiveGridNormalId, TargetGridNormalIds)) {
						// Incorrect normal id
						this.useAssignReadonlyProperty("CanPlace", false);
						return;
					}

					const [GridBoundingBoxCF, GridBoundingBoxSize] = this.ActiveGrid.GetSurfaceBoundingBox()!;

					const BoundsObjectSpace = this._GetBoundsObjectSpace(
						this.CFrame,
						GridBoundingBoxCF.ToObjectSpace(this.CFrame),
					);
					const _x = BoundsObjectSpace.X;
					const _y = BoundsObjectSpace.Y;
					const _z = BoundsObjectSpace.Z;

					let _isInXBounds = false;
					let _isInYBounds = false;
					let _isInZBounds = false;

					if (
						this.ActiveGridNormalId === Enum.NormalId.Top ||
						this.ActiveGridNormalId === Enum.NormalId.Bottom
					) {
						// Only consider the x and z factor when on the top/bottom of a surface, the Y will be considered in bounds by default.
						_isInXBounds = _x < GridBoundingBoxSize.X * 0.5;
						_isInZBounds = _z < GridBoundingBoxSize.Z * 0.5;
						_isInYBounds = true;
					}
					if (
						this.ActiveGridNormalId === Enum.NormalId.Front ||
						this.ActiveGridNormalId === Enum.NormalId.Back
					) {
						// Only consider the x and y factor when on the front/back of a surface, the Z will be considered in bounds by default.
						_isInXBounds = _x < GridBoundingBoxSize.X * 0.5;
						_isInYBounds = _y < GridBoundingBoxSize.Y * 0.5;
						_isInZBounds = true;
					}

					if (
						this.ActiveGridNormalId === Enum.NormalId.Left ||
						this.ActiveGridNormalId === Enum.NormalId.Right
					) {
						// Only consider the z and y factor when on the front/back of a surface, the X will be considered in bounds by default.
						_isInZBounds = _z < GridBoundingBoxSize.Z * 0.5;
						_isInYBounds = _y < GridBoundingBoxSize.Y * 0.5;
						_isInXBounds = true;
					}

					this.useAssignReadonlyProperty("IsInXBounds", _isInXBounds);
					this.useAssignReadonlyProperty("IsInYBounds", _isInYBounds);
					this.useAssignReadonlyProperty("IsInZBounds", _isInZBounds);

					if (!_isInXBounds || !_isInYBounds || !_isInZBounds) {
						this.useAssignReadonlyProperty("CanPlace", false);
						return;
					}
					this.useAssignReadonlyProperty("CanPlace", true);
				}, ["ActiveGrid", "ActiveGridNormalId", "GridNormalId", "CFrame", "Size", "BoundsAreCalculatedAtMass"]);
			}
		}, ["AutoCanPlace"]);

		this.usePropertyEffect(() => {
			let Keybinds: Enum.KeyCode[] | undefined;
			if (this.AutoRotate === false) {
				return;
			}
			if (this.AutoRotate === true) {
				Keybinds = [Enum.KeyCode.R];
			} else if (typeIs(this.AutoRotate, "EnumItem")) {
				Keybinds = [this.AutoRotate];
			} else if (typeIs(this.AutoRotate, "table")) {
				Keybinds = this.AutoRotate;
			}
			if (!Keybinds) {
				throw `Could not resolve keybinds for for AutoRotate: ${this.AutoRotate}`;
			}
			const actionName = `${this._id}_autoRotate`;
			ContextActionService.BindAction(
				actionName,
				(_, InputState) => {
					if (InputState === Enum.UserInputState.Begin) {
						if (this.AutoRotateAxis === Vector3.zero) {
							return;
						}
						this.Rotation = this.Rotation.add(
							this.AutoRotateAxis.Unit.mul(math.rad(this.AutoRotateAngle % 360)),
						);
						this._RenderCF();
					}
				},
				false,
				...Keybinds,
			);
			return () => {
				ContextActionService.UnbindAction(actionName);
			};
		}, ["AutoRotate"]);

		this.usePropertyEffect(() => {
			if (this.Results) {
				let targetGrid: Grid3D | undefined;
				if (this.Grid) {
					if (typeIs(this.Grid, "Grid3D")) {
						targetGrid = this.Grid._isGridMember(this.Results.Instance) ? this.Grid : undefined;
					} else {
						for (const griditem of this.Grid) {
							if (griditem._isGridMember(this.Results.Instance)) {
								targetGrid = griditem;
								break;
							}
						}
					}
				}
				if (targetGrid) {
					this.useAssignReadonlyProperty("ActiveGrid", targetGrid);
				} else {
					this.useAssignReadonlyProperty("ActiveGrid", undefined);
				}

				if (this.Results.Instance) {
					let _gotNormal = false;
					for (const normal of Enum.NormalId.GetEnumItems()) {
						const cf = ValueResolver.fromInstanceToCFrame(this.Results.Instance);
						if (cf.VectorToWorldSpace(Vector3.FromNormalId(normal)).Dot(this.Results.Normal) > 1 - 0.001) {
							this.useAssignReadonlyProperty("ActiveGridNormalId", normal);
							_gotNormal = true;
							break;
						}
					}
					if (!_gotNormal) {
						this.useAssignReadonlyProperty("ActiveGridNormalId", undefined);
					}
				} else {
					this.useAssignReadonlyProperty("ActiveGridNormalId", undefined);
				}
				const TargetGridUnit = this.GridUnit ?? (targetGrid ? targetGrid.Unit : this.GridUnit) ?? 0;

				/**
				 * @param axis - 0 (x) 1 (y) 2 (z)
				 */
				const roundAxisToUnit = (input: number, axis: 0 | 1 | 2): number => {
					const _targetGridUnit = typeIs(TargetGridUnit, "number")
						? TargetGridUnit
						: axis === 0
						? TargetGridUnit.X
						: axis === 1
						? TargetGridUnit.Y
						: TargetGridUnit.Z;

					return _targetGridUnit !== 0 ? math.floor(input / _targetGridUnit) * _targetGridUnit : input;
				};

				let cf: CFrame;

				const _lookAtCF = (): CFrame => {
					return new CFrame(this.Results!.Position, this.Results!.Position.add(this.Results!.Normal));
				};
				const _noneCF = (): CFrame => {
					return new CFrame(this.Results!.Position);
				};
				const _fromMatrixTopCF = (): CFrame => {
					const ydp = Vector3.yAxis.Dot(this.Results!.Normal);
					const ycp = Vector3.yAxis.Cross(this.Results!.Normal);
					return CFrame.fromMatrix(
						this.Results!.Position,
						math.abs(ydp) === 1 ? Vector3.xAxis : ycp,
						this.Results!.Normal,
					);
				};

				let OFFSET_SIZE_RESULTSBEHAVIOR_TO_FOLLOW: (typeof this)["ResultsNormalBehavior"] =
					this.ResultsNormalBehavior;
				if (this.ResultsNormalBehavior === Placer3DResultsNormalBehavior.fromMatrixTop) {
					cf = _fromMatrixTopCF();
				} else if (this.ResultsNormalBehavior === Placer3DResultsNormalBehavior.lookAt) {
					cf = _lookAtCF();
				} else if (this.ResultsNormalBehavior === Placer3DResultsNormalBehavior.surfaceWall) {
					if (
						this.ActiveGridNormalId === Enum.NormalId.Top ||
						this.ActiveGridNormalId === Enum.NormalId.Bottom
					) {
						cf = _fromMatrixTopCF();
						OFFSET_SIZE_RESULTSBEHAVIOR_TO_FOLLOW = Placer3DResultsNormalBehavior.fromMatrixTop;
					} else {
						cf = _lookAtCF();
						OFFSET_SIZE_RESULTSBEHAVIOR_TO_FOLLOW = Placer3DResultsNormalBehavior.lookAt;
					}
				} else {
					cf = _noneCF();
				}

				const vec3abs = (inputVector3: Vector3): Vector3 => {
					return new Vector3(math.abs(inputVector3.X), math.abs(inputVector3.Y), math.abs(inputVector3.Z));
				};
				const vec3sign = (inputVector3: Vector3): Vector3 => {
					return new Vector3(math.sign(inputVector3.X), math.sign(inputVector3.Y), math.sign(inputVector3.Z));
				};

				const cp = this.Results.Normal.Cross(cf.Position.Unit);
				const cpSign = vec3sign(cp);
				const cpAbsSign = vec3abs(cpSign);

				// Grid "snapping"
				const _pos = new Vector3(roundAxisToUnit(cf.X, 0), roundAxisToUnit(cf.Y, 1), roundAxisToUnit(cf.Z, 2));

				let nscf = new CFrame(
					new Vector3(
						cpAbsSign.X === 0 ? cf.X : _pos.X,
						cpAbsSign.Y === 0 ? cf.Y : _pos.Y,
						cpAbsSign.Z === 0 ? cf.Z : _pos.Z,
					),
				).mul(cf.Rotation);

				// Apply the offset size
				if (OFFSET_SIZE_RESULTSBEHAVIOR_TO_FOLLOW === Placer3DResultsNormalBehavior.fromMatrixTop) {
					// UpVector
					nscf = nscf.ToWorldSpace(new CFrame(0, this.Size.Y * 0.5, 0));
				} else if (OFFSET_SIZE_RESULTSBEHAVIOR_TO_FOLLOW === Placer3DResultsNormalBehavior.lookAt) {
					// LookVector
					nscf = nscf.ToWorldSpace(new CFrame(0, 0, -this.Size.Z * 0.5));
				} else if (OFFSET_SIZE_RESULTSBEHAVIOR_TO_FOLLOW === Placer3DResultsNormalBehavior.none) {
					// Surface Normal
					nscf = nscf.ToWorldSpace(new CFrame(this.Results.Normal.mul(this.Size.mul(0.5))));
				}

				this.useAssignReadonlyProperty("_cf", nscf);
			} else {
				this.useAssignReadonlyProperty("_cf", undefined);
				this.useAssignReadonlyProperty("ActiveGrid", undefined);
			}
		}, ["Results"]);

		this.usePropertyEffect(() => {
			if (this.Enabled) {
				const PlacementServant = new Servant();

				const PlacementTypeUPE = this.usePropertyEffect(() => {
					const [acitvePlacementTypeServant] = PlacementServant.Keep(new Servant());
					// ⌄⌄⌄ FOLLOW MOUSE ⌄⌄⌄
					if (this.PlacementType === "FollowMouse") {
						acitvePlacementTypeServant.Keep(
							UserInputService.InputChanged.Connect((InputObject) => {
								if (InputObject.UserInputType === Enum.UserInputType.MouseMovement) {
									this.Results = this.utils.RaycastFromMouse(
										InputObject.Position.X,
										InputObject.Position.Y,
										undefined,
										this.RaycastParams,
									);
								}
							}),
						);
						return () => {
							acitvePlacementTypeServant.Destroy();
							this.Results = undefined;
						};
					}
					// ^^^ FOLLOW MOUSE ^^^
				}, ["PlacementType"]);

				return () => {
					PlacementServant.Destroy();
					PlacementTypeUPE.Destroy();
				};
			}
		}, ["Grid", "Enabled"]);

		this.usePropertyEffect(() => {
			if (this.DebugVisualizer) {
				const DebugVisual = new Instance("Part");
				DebugVisual.Name = "DebugVisualizer";
				DebugVisual.CanCollide = false;
				DebugVisual.CanQuery = false;
				DebugVisual.CanTouch = false;
				DebugVisual.Anchored = true;
				DebugVisual.Transparency = 0.4;
				DebugVisual.Name = `${tostring(this)}DebugVisualizer.`;
				const ue = this.usePropertyEffect(() => {
					DebugVisual.CFrame = this.CFrame ?? CFrame.identity;
					DebugVisual.Size = this.Size;
				}, ["CFrame"]);
				DebugVisual.Parent = Engine.FetchWorkspaceStorage();
				return () => {
					ue.Destroy();
					DebugVisual.Destroy();
				};
			}
		}, ["DebugVisualizer"]);

		this.useReferenceInstanceBehaviour();
	}
}
