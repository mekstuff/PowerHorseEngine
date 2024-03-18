/* eslint-disable roblox-ts/no-private-identifier */

// https://github.com/vazgriz/PID_Controller/blob/master/Assets/Scripts/PID_Controller.cs

declare global {
	namespace PHe {
		interface Pseudos {
			PseudoPID: PseudoPID;
		}
		interface CreateablePseudos {
			PseudoPID: PseudoPID;
		}
		interface CheckablePseudos {
			PseudoPID: PseudoPID;
		}
	}
}
import { Pseudo } from "@mekstuff-rbxts/core";

export enum DerivativeMeasurement {
	Velocity,
	ErrorRateOfChange,
}

export class PseudoPID extends Pseudo {
	public p = 0;
	public i = 0;
	public d = 0;

	public outputMin = -1;
	public outputMax = 1;

	public readonly velocity = 0;

	protected _valueLast = 0;
	protected _errorLast = 0;

	protected _integrationStored = 0;
	protected _integralSaturation = 0;

	public DerivativeMeasurement: DerivativeMeasurement = DerivativeMeasurement.Velocity;
	private _derivativeInitialized = false;

	public Update(deltaTime: number, currentValue: number, targetValue: number): number {
		assert(deltaTime !== undefined ?? deltaTime < 0, "invalid delta time");

		const err = targetValue - currentValue;

		const PTerm = this.p * err;

		this._integrationStored = math.clamp(
			this._integrationStored + err * deltaTime,
			-this._integralSaturation,
			this._integralSaturation,
		);

		const ITerm = this.i * this._integrationStored;

		const errorRateOfChange = (err - this._errorLast) / deltaTime;
		this._errorLast = err;

		const valueRateOfChange = (currentValue - this._valueLast) / deltaTime;
		this._valueLast = currentValue;
		this.useAssignReadonlyProperty("velocity", valueRateOfChange);

		let deriveMeasure = 0;

		if (this._derivativeInitialized) {
			if (this.DerivativeMeasurement === DerivativeMeasurement.Velocity) {
				deriveMeasure = -valueRateOfChange;
			} else {
				deriveMeasure = errorRateOfChange;
			}
		} else {
			this._derivativeInitialized = true;
		}

		const DTerm = this.d * deriveMeasure;

		const result = PTerm + ITerm + DTerm;

		return math.clamp(result, this.outputMin, this.outputMax);
	}

	public AngleDifference(a: number, b: number): number {
		return ((a - b + 540) % 360) - 180; //calculate modular difference, and remap to [-180, 180]
	}

	public UpdateAngle(deltaTime: number, currentAngle: number, targetAngle: number): number {
		assert(deltaTime !== undefined ?? deltaTime < 0, "invalid delta time");
		const err = this.AngleDifference(targetAngle, currentAngle);

		//calculate P term
		const PTerm = this.p * err;

		//calculate I term
		this._integrationStored = math.clamp(
			this._integrationStored + err * deltaTime,
			-this._integralSaturation,
			this._integralSaturation,
		);
		const ITerm = this.i * this._integrationStored;

		//calculate both D terms
		const errorRateOfChange = this.AngleDifference(err, this._errorLast) / deltaTime;
		this._errorLast = err;

		const valueRateOfChange = this.AngleDifference(currentAngle, this._valueLast) / deltaTime;
		this._valueLast = currentAngle;
		this.useAssignReadonlyProperty("velocity", valueRateOfChange);

		//choose D term to use
		let deriveMeasure = 0;

		if (this._derivativeInitialized) {
			if (this.DerivativeMeasurement === DerivativeMeasurement.Velocity) {
				deriveMeasure = -valueRateOfChange;
			} else {
				deriveMeasure = errorRateOfChange;
			}
		} else {
			this._derivativeInitialized = true;
		}

		const DTerm = this.d * deriveMeasure;

		const result = PTerm + ITerm + DTerm;

		return math.clamp(result, this.outputMin, this.outputMax);
	}

	constructor() {
		super("PseudoPID");
		this.Name = this.ClassName;
		this.useStrictProperties();
		this.useReferenceInstanceBehaviour();
	}
}
