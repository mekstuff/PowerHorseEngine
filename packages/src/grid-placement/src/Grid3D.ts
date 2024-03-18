/* eslint-disable roblox-ts/no-private-identifier */
import { Pseudo, Servant } from "@mekstuff-rbxts/core";

declare global {
	namespace PHe {
		/** A list of pseudo classes*/
		interface Pseudos {
			Grid3D: Grid3D;
		}
		/**
		 * Types that can be checked with custom _typeIs.
		 */
		interface CheckablePseudos {
			Grid3D: Grid3D;
		}
	}
}
/**
 * A `Grid3D` enables the ability to place 3D items across a surface, Surface being the Parent of the `Grid3D`.
 */
export class Grid3D extends Pseudo {
	Unit: number | Vector3 = 2;
	NormalId: Enum.NormalId | Enum.NormalId[] = Enum.NormalId.GetEnumItems();
	/**
	 * Shows a Grid Texture on the `Surface`. ONLY if the `Surface` is a `BasePart`.
	 */
	ShowGrid = false;
	GetSurfaceBoundingBox(): LuaTuple<[CFrame, Vector3]> | undefined {
		if (this.Surface.IsA("BasePart")) {
			return $tuple(this.Surface.CFrame, this.Surface.Size);
		}
		if (this.Surface.IsA("Model")) {
			this.Surface.GetBoundingBox();
		}
	}
	public _isGridMember(Item: unknown): boolean {
		if (!this.Surface) {
			return false;
		}
		if (!typeIs(Item, "Instance")) {
			return false;
		}
		return Item === this.Surface || Item.IsDescendantOf(this.Surface);
	}
	constructor(public readonly Surface: Instance) {
		super("Grid3D");
		this.Name = this.ClassName;
		this.usePropertyEffect(() => {
			if (this.ShowGrid === true && this.Surface.IsA("BasePart")) {
				return this.usePropertyEffect(() => {
					const TexturesServant = new Servant();
					const Textures: Texture[] = [];
					(typeIs(this.NormalId, "EnumItem") ? [this.NormalId] : this.NormalId).forEach((normal) => {
						const [GridTexture] = TexturesServant.Keep(new Instance("Texture"));
						GridTexture.Face = normal;
						GridTexture.Texture = "rbxassetid://6372755229";
						GridTexture.Transparency = 0.1;
						GridTexture.Name = `${tostring(this)}-GridTexture`;
						Textures.push(GridTexture);
						GridTexture.Parent = this.Surface;
					});
					return this.usePropertyEffect(() => {
						const _unit = typeIs(this.Unit, "number") ? this.Unit : this.Unit.Magnitude; // TODO: Do NOT use the magnitude, we should use the NormalId to determine what axis to use.
						Textures.forEach((Texture) => {
							Texture.StudsPerTileU = _unit;
							Texture.StudsPerTileV = _unit;
						});
						return (Destroying) => {
							if (!Destroying) {
								return;
							}
							Textures.forEach((texture) => texture.Destroy());
							Textures.clear();
						};
					}, ["Unit"]);
				}, ["NormalId"]);
			}
		}, ["ShowGrid"]);
		this.usePropertyRender(() => {
			throw "You cannot assign a new Surface to a Grid3D after initialization.";
		}, ["Surface"]);
		this.useReferenceInstanceBehaviour();
	}
}
