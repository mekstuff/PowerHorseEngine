/* eslint-disable roblox-ts/no-private-identifier */
import ValueResolver from "@mekstuff-rbxts/value-resolver";
import { Pseudo } from "@mekstuff-rbxts/core";

declare global {
	namespace PHe {
		interface Pseudos {
			Region: RegionClass;
		}
		interface CheckablePseudos {
			Region: RegionClass;
		}
	}
}

export class RegionOption extends Pseudo {
	public MaximumMagnitude: number | undefined = undefined;
	public RegionAxis: Vector3 = Vector3.one;
	/**
	 * A property that the developer can use to show if the region is active to have some reactive code.
	 */
	public RegionActive = false;
	constructor(
		public CFrame: CFrame | Instance,
		public Target: CFrame | Instance | { CFrame: CFrame; Size: Vector3 },
		public TargetSize?: Vector3,
		public CalculateAtCenter?: boolean,
	) {
		super("RegionOption");
		this.Name = this.ClassName;
		this.useReferenceInstanceBehaviour();
	}
}
class RegionClass extends Pseudo {
	public Enabled = true;
	public newOption(
		CFrame: CFrame | Instance,
		Target: CFrame | Instance | { CFrame: CFrame; Size: Vector3 },
		TargetSize?: Vector3,
	): RegionOption {
		return new RegionOption(CFrame, Target, TargetSize);
	}
	/**
	 * Returns whether the CFrame is within the Target
	 */
	public IsInRegion(RegionOption: RegionOption): boolean {
		let _targetInfo: { cf: CFrame; size: Vector3 } | undefined;
		if (typeIs(RegionOption.TargetSize, "Vector3")) {
			assert(
				typeIs(RegionOption.Target, "CFrame"),
				"The Target Of the RegionOption must be a CFrame if the TargetSize is defined!",
			);
			_targetInfo = {
				cf: RegionOption.Target,
				size: RegionOption.TargetSize,
			};
		} else {
			if (typeIs(RegionOption.Target, "table")) {
				const _t = RegionOption.Target as { [key: string]: unknown };
				assert(typeIs(_t.CFrame, "CFrame"), `Missing CFrame from RegionOption.Target table! ${RegionOption}`);
				assert(typeIs(_t.Size, "CFrame"), `Missing Size from RegionOption.Target table! ${RegionOption}`);
				_targetInfo = {
					cf: _t.CFrame as unknown as CFrame,
					size: _t.Size as unknown as Vector3,
				};
			} else {
				const [cf, size] = ValueResolver.GetBoundingBox(RegionOption.Target);
				_targetInfo = {
					cf,
					size,
				};
			}
		}
		assert(_targetInfo, `Could not resolve info for RegionOption target: ${RegionOption}`);

		const currentCF = ValueResolver.GetCFrameValue(RegionOption.CFrame);
		if (
			RegionOption.MaximumMagnitude !== undefined &&
			_targetInfo.cf.Position.sub(currentCF.Position).Magnitude > RegionOption.MaximumMagnitude
		) {
			return false;
		}
		const ToObjSpace = _targetInfo.cf.ToObjectSpace(currentCF);
		const _x = ToObjSpace.X + _targetInfo.size.X - _targetInfo.size.X * 0.5;
		const _y = ToObjSpace.Y + _targetInfo.size.Y - _targetInfo.size.Y * 0.5;
		const _z = ToObjSpace.Z + _targetInfo.size.Z - _targetInfo.size.Z * 0.5;

		const _xinb = _x > 0 && _x < _targetInfo.size.X;
		const _yinb = _y > 0 && _y < _targetInfo.size.Y;
		const _zinb = _z > 0 && _z < _targetInfo.size.Z;

		if (RegionOption.RegionAxis.X > 0 && _xinb === false) {
			return false;
		}
		if (RegionOption.RegionAxis.Y > 0 && _yinb === false) {
			return false;
		}
		if (RegionOption.RegionAxis.Z > 0 && _zinb === false) {
			return false;
		}
		return true;
	}
	constructor() {
		super("Region");
		this.Name = this.ClassName;
		this.usePropertyRender(() => {
			throw `The Name or Parent of a ${this} cannot be changed.`;
		}, ["Parent", "Name"]);
	}
}

const Region = new RegionClass();

export { Region };
