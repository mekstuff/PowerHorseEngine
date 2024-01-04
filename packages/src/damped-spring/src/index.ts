/* eslint-disable roblox-ts/no-private-identifier */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Pseudo, Servant, typeIs } from "@mekstuff-rbxts/core";
import { Signal } from "@mekstuff-rbxts/signal";

const _DEFAULTS = {
	DampedSpring_dampingRatio: 0.4,
	DampedSpring_angularFrequency: 15,
	AnimatorClass_SpringInactiveLifetime: 60, //time that a spring has to be inactive before it's destroyed, checked within the _getSpring method.
};

declare global {
	namespace PHe {
		/** A list of pseudo classes*/
		interface Pseudos {
			DampedSpring: DampedSpring;
			DampedSpringAnimator: DampedSpringAnimatorClass;
			DampedSpringAnimation: DampedSpringAnimation;
			DampedSpringRef: DampedSpringRef;
		}
		interface CreateablePseudos {
			DampedSpring: DampedSpring;
			DampedSpringRef: DampedSpringRef;
		}
		interface CheckablePseudos {
			DampedSpring: DampedSpring;
			DampedSpringAnim: DampedSpringAnimatorClass;
			DampedSpringRef: DampedSpringRef;
		}
	}
}

/**
 * Default values for RefHandlers, default support is for `number`.
 */
const __AnimatorClass_RefHandlers__default__ = {
	get: (initialValue: any, targetValue: any, initialVelocities?: unknown[]): DampedSpringRef[] => {
		return [
			new DampedSpringRef(initialValue, (initialVelocities ? initialVelocities[0] : undefined) ?? 0, targetValue),
		];
	},
	set: (target: { [key: string]: any }, ref: DampedSpringRef, prop: string) => {
		target[prop] = ref.value;
	},
	_velocity_int: (refs: DampedSpringRef[]) => {
		return refs[0].velocity;
	},
	_def_initial_velocity: 0,
};

/**
 * Handlers for supported ref value types for the `AnimatorClass`.
 */
const AnimatorClass_RefHandlers: Record<
	string,
	{
		/**
		 * This function is called whenever the prop is being initialized, it is essentially the setup function
		 *
		 * for e.g. if you wish to use a `UDim2` value, since they cannot be multiplied, you
		 * will need to use 2 `Vector2` values for example, you will then return an array of `DampedSpringRefs`
		 * In this case, you will need to return 4 Vector2 values, 2 that are binded to the current value and the other
		 * two binded to the target value.
		 */
		get: (initialValue: any, targetValue: any, initialVelocities?: unknown[]) => DampedSpringRef[];
		/**
		 * This function is called whenever the prop is expected to be updated (whenever the `DampedSpringRef` returned from the `get` function is updated.)
		 *
		 * Like the example explained in the `get` function, you will then need to "deconstruct" the 2 vector2 values that are used as the "current value"
		 * and convert them into a valid UDim2 value. You will then apply that new value to the target. target being the item that is being animated.
		 */
		set: (target: { [key: string]: any }, ref: DampedSpringRef, prop: string, index: number) => void;
		/**
		 * Expected to return an `integer` that correctly displays the current velocity. As the velocity will be directly linked to the type of ref, e.g.
		 * `Vector3` value will result in a `Vector3` velocity, so to convert to an int, you will use the velocities Magnitude.
		 */
		_velocity_int: (refs: DampedSpringRef[]) => number;
		/**
		 * A default initial velocity, for e.g. since `Vector3s` can only added,subtracted,multiplied,etc. by other `Vector3s`. The velocity is expected to be a
		 * `Vector3` as well.
		 */
		_def_initial_velocity?: unknown;
	}
> = {
	number: __AnimatorClass_RefHandlers__default__,
	Vector2: {
		_def_initial_velocity: Vector2.zero,
		_velocity_int: (refs) => {
			return (refs[0].velocity as Vector2).Magnitude;
		},
		set: __AnimatorClass_RefHandlers__default__.set,
		get: __AnimatorClass_RefHandlers__default__.get,
	},
	Vector3: {
		_def_initial_velocity: Vector3.zero,
		_velocity_int: (refs) => {
			return (refs[0].velocity as Vector3).Magnitude;
		},
		set: __AnimatorClass_RefHandlers__default__.set,
		get: __AnimatorClass_RefHandlers__default__.get,
	},
	Color3: {
		_velocity_int: (refs) => {
			return (refs[0].velocity as Vector3).Magnitude;
		},
		set: (target: { [key: string]: Color3 }, ref, prop) => {
			const refValue = ref.value as Vector3;
			target[prop] = new Color3(refValue.X, refValue.Y, refValue.Z);
		},
		get: (initialvalue: Color3, targetvalue: Color3, initialVelocities) => {
			// store Color3s in a Vector3 value
			const Vec3 = new Vector3(initialvalue.R, initialvalue.G, initialvalue.B);
			const TargetVec3 = new Vector3(targetvalue.R, targetvalue.G, targetvalue.B);
			return [
				new DampedSpringRef(
					Vec3,
					(initialVelocities ? initialVelocities[0] : undefined) ?? Vector3.zero,
					TargetVec3,
				),
			];
		},
	},
	UDim: {
		_velocity_int: (refs) => {
			return (refs[0].velocity as Vector2).Magnitude;
		},
		set: (target: { [key: string]: UDim }, ref, prop) => {
			target[prop] = new UDim((ref.value as Vector2).X, (ref.value as Vector2).Y);
		},
		get: (initialvalue: UDim, targetvalue: UDim, initialVelocities) => {
			// store UDims in a Vector2 value
			const Vec2 = new Vector2(initialvalue.Scale, initialvalue.Offset);
			const TargetVec2 = new Vector2(targetvalue.Scale, targetvalue.Offset);
			return [
				new DampedSpringRef(
					Vec2,
					(initialVelocities ? initialVelocities[0] : undefined) ?? Vector2.zero,
					TargetVec2,
				),
			];
		},
	},
	UDim2: {
		_velocity_int: (refs) => {
			return (refs[0].velocity as Vector2).Magnitude;
		},
		set: (target: { [key: string]: UDim2 }, ref, prop, index) => {
			if (index === 0) {
				// X
				const refValue = ref.value as Vector2;
				target[prop] = new UDim2(refValue.X, refValue.Y, target[prop].Y.Scale, target[prop].Y.Offset);
			} else {
				// Y
				const refValue = ref.value as Vector2;
				target[prop] = new UDim2(target[prop].X.Scale, target[prop].X.Offset, refValue.X, refValue.Y);
			}
		},
		get: (initialvalue: UDim2, targetvalue: UDim2, initialVelocities) => {
			// store UDim2 in 2 Vector2 values
			const X = new Vector2(initialvalue.X.Scale, initialvalue.X.Offset);
			const Y = new Vector2(initialvalue.Y.Scale, initialvalue.Y.Offset);
			const tX = new Vector2(targetvalue.X.Scale, targetvalue.X.Offset);
			const tY = new Vector2(targetvalue.Y.Scale, targetvalue.Y.Offset);
			return [
				new DampedSpringRef(X, (initialVelocities ? initialVelocities[0] : undefined) ?? Vector2.zero, tX),
				new DampedSpringRef(Y, (initialVelocities ? initialVelocities[1] : undefined) ?? Vector2.zero, tY),
			];
		},
	},
	CFrame: {
		_velocity_int: (refs) => {
			return (refs[0].velocity as Vector3).Magnitude + (refs[1].velocity as Vector3).Magnitude;
		},
		get: (initialValue: CFrame, targetValue: CFrame, initialVelocities) => {
			// use two vector3's for CFrame, Position & Rotation. [0] = Position, [1] = Rotation
			const [x, y, z] = initialValue.Rotation.ToOrientation();
			const [xx, yy, zz] = targetValue.Rotation.ToOrientation();
			const initialorientation = new Vector3(x, y, z);
			const targetorientation = new Vector3(xx, yy, zz);
			return [
				new DampedSpringRef(
					initialValue.Position,
					(initialVelocities ? initialVelocities[0] : undefined) ?? Vector3.zero,
					targetValue.Position,
				),
				new DampedSpringRef(
					initialorientation,
					(initialVelocities ? initialVelocities[1] : undefined) ?? Vector3.zero,
					targetorientation,
				),
			];
		},
		set: (target, ref, prop, index) => {
			if (index === 0) {
				const rotation = target[prop].Rotation as CFrame;
				const refValue = ref.value as Vector3;
				const components = rotation.GetComponents();
				target[prop] = new CFrame(
					refValue.X,
					refValue.Y,
					refValue.Z,
					components[3],
					components[4],
					components[5],
					components[6],
					components[7],
					components[8],
					components[9],
					components[10],
					components[11],
				);
			} else {
				const pos = target[prop].Position as Vector3;
				const refValue = ref.value as Vector3;
				const components = CFrame.fromOrientation(refValue.X, refValue.Y, refValue.Z).GetComponents();
				target[prop] = new CFrame(
					pos.X,
					pos.Y,
					pos.Z,
					components[3],
					components[4],
					components[5],
					components[6],
					components[7],
					components[8],
					components[9],
					components[10],
					components[11],
				);
			}
		},
	},
};

const GetAnimatorClass_RefHandlers = (Type: string): (typeof AnimatorClass_RefHandlers)[string] => {
	const _t = AnimatorClass_RefHandlers[Type];
	if (_t) {
		return _t;
	}
	throw `Unhandled ref _type "${typeOf(Type)}"`;
};

/**
 * `DampedSpringAnimation` are stored as:
 * the key/index being the Instance/Pseudo they animate.
 * the value being an array of `DampedSpringAnimation` that animate the specified key/index.
 *
 * This makes for quicker search for other `DampedSpringAnimation` which are animating the same object
 * to get if they're animating a specific property, we will need to check within the `DampedSpringAnimation` _dev._refs
 */
const DampedSpringAnimationIndex: Map<Instance | Pseudo, DampedSpringAnimation[]> = new Map();
/**
 * Adds the `DampedSpringAnimation` to the `Target` within the `DampedSpringAnimationIndex`. Creates Target map if doesn't exists.
 */
function AddToDampedSpringAnimationIndex(Target: Instance | Pseudo, DampedSpringAnimation: DampedSpringAnimation) {
	let _t = DampedSpringAnimationIndex.get(Target);
	if (!_t) {
		_t = [];
		DampedSpringAnimationIndex.set(Target, _t);
	} else {
		if (_t.indexOf(DampedSpringAnimation) !== -1) {
			return;
		}
	}
	_t.push(DampedSpringAnimation);
}
/**
 * Removes the `DampedSpringAnimation` from the `Target` within the `DampedSpringAnimationIndex`. Deletes the Target if empty.
 */
function RemoveDampedSpringFromAnimationIndex(Target: Instance | Pseudo, DampedSpringAnimation: DampedSpringAnimation) {
	const _t = DampedSpringAnimationIndex.get(Target);
	if (!_t) {
		return;
	}
	const indx = _t.indexOf(DampedSpringAnimation);
	_t.remove(indx);
	if (_t.size() <= 0) {
		DampedSpringAnimationIndex.delete(Target);
	}
}

/**
 * This is Pseudo class that is used to reference a `DampedSpringAnimation`. it is created only by the [DampedSpringAnimatorClass.animate](./DampedSpringAnimatorClass#animate) method
 * and is `Destroyed` directly after the animation is completed.
 */
class DampedSpringAnimation extends Pseudo<{
	_refs: Record<string, DampedSpringRef[]>;
}> {
	Name = "DampedSpringAnimation";
	Play() {
		this.Playing = true;
	}
	Stop() {
		this.Playing = false;
	}
	/**
	 * Fired whenever the Animation has completed playing
	 * The "finished" param is `true` when the spring has settled with no interuption by another animation and `false` if it were interupted by another animation.
	 */
	Completed: Signal<(finished: boolean) => void> = new Signal();
	Playing = true;

	/**
	 * Calls the `.get` method of the RefHandler based on the type of the initialValue
	 */
	private _getpropsrefs(
		initialValue: unknown,
		targetValue: unknown,
		initialVelocities?: unknown[],
	): DampedSpringRef[] {
		const _t = AnimatorClass_RefHandlers[typeOf(initialValue)];
		if (_t) {
			const r = _t.get(initialValue, targetValue, initialVelocities);
			return r;
		}
		throw `Unhandled ref _type "${typeOf(initialValue)}"`;
	}
	/**
	 * Called by other Animators when they take over a property.
	 */
	public _cleanupIfAllAnimationsOverriden() {
		let _s = 0;
		for (const [_, __] of pairs(this._dev._refs)) {
			_s++;
			break;
		}
		if (_s === 0) {
			this.Destroy();
		}
	}
	constructor(
		_AnimatorClass: DampedSpringAnimatorClass,
		_target: Instance | Pseudo,
		_properties: Record<string, unknown>,
		_spring: DampedSpring,
	) {
		super("DampedSpringAnimation");
		this._dev._completedSignal = this.Completed;
		this._dev._refs = {};

		AddToDampedSpringAnimationIndex(_target, this);
		let total_refs = 0;
		let total_refs_completed = -1; // we set to -1 since we will compare if total_refs === total_refs_completed when this is destroyed.
		// -1 is changed to 0 when the first ref is completed and incremented however.
		// TODO: listen for when _target is destroyed so we can remove aswell.
		_target.Destroying.Connect(() => {
			this.Destroy();
			DampedSpringAnimationIndex.delete(_target); // although every animation with this _target will receive this event
			// and destroy itself, which will intern remove it from the index which will ultimately remove the reference of this
			// _target in the index, we just delete it here so the computations of `RemoveDampedSpringFromAnimationIndex are skipped.
		});
		this.useDestroying(() => {
			if (total_refs !== total_refs_completed) {
				this.Completed.Fire(false);
			}
			RemoveDampedSpringFromAnimationIndex(_target, this);
		}, true);
		const allrefs: Record<string, DampedSpringRef[]> = {};

		const target = _target as { [key: string]: any };
		let _velocities_from_old_ref: unknown[] | undefined;
		// TODO: Optimize, since only one animator can control a property of a target at a time, maybe we can explicitly define what animation is handling what props, maybe not.
		for (const [propName, propValue] of pairs(_properties)) {
			const targetAnimationsInIndx = DampedSpringAnimationIndex.get(_target);
			if (targetAnimationsInIndx) {
				for (const AnimationInIndex of targetAnimationsInIndx) {
					if (AnimationInIndex === this) {
						continue;
					}
					const isAnimatingProp = AnimationInIndex._dev._refs[propName];
					if (isAnimatingProp) {
						_velocities_from_old_ref = [];
						isAnimatingProp.forEach((externalref) => {
							(_velocities_from_old_ref as any[]).push(externalref.velocity);
							externalref.Destroy();
						});
						delete AnimationInIndex._dev._refs[propName];
						AnimationInIndex._cleanupIfAllAnimationsOverriden();
						break; // we can break out the loop since only a single animation should be animating the prop. for optimization sake we can probably move this out of an array.
					}
				}
			}
			const oldref = this._dev._refs[propName];
			if (oldref) {
				// _velocities_from_old_ref can also be set from the existing "external" damped spring that previously handled the prop. so check if set first.
				// this is in cases where the anim runs itself again, which as of now, does not happen.
				if (_velocities_from_old_ref === undefined) {
					_velocities_from_old_ref = oldref.map((x) => x.velocity);
				}
				// delete the oldref, destroying all connectors etc.
				oldref.forEach((x) => x.Destroy());
				delete this._dev._refs[propName];
			}
			const propsrefs = this._getpropsrefs(
				target[propName],
				propValue,
				_velocities_from_old_ref ?? [
					GetAnimatorClass_RefHandlers(typeOf(target[propName]))._def_initial_velocity,
				],
			);
			allrefs[propName] = propsrefs;
			total_refs = total_refs + 1;
		}
		for (const [propName, Refs] of pairs(allrefs)) {
			const targetRefHandler = GetAnimatorClass_RefHandlers(typeOf(target[propName]));
			this._dev._refs[propName] = [];
			Refs.forEach((ref, index) => {
				this._dev._refs[propName].push(ref);
				// Have refs listen for updates
				ref._dev._DampedSpringAnimationUpdater = ref.updated(() => {
					targetRefHandler.set(target, ref, propName, index);
				});
				// update ref on frame
				const _handlerFramer = (dt: number) => {
					_spring.update(dt, ref);
					const velocity_int = GetAnimatorClass_RefHandlers(typeOf(ref.velocity))._velocity_int(Refs);
					if (math.abs(velocity_int) < epsilon) {
						_AnimatorClass.rmframe(_handlerFramer);
						if (total_refs_completed === -1) {
							total_refs_completed = 0;
						}
						total_refs_completed = total_refs_completed + 1;
						if (total_refs_completed === total_refs) {
							// all ref animations completed, so consider the entire animation done.
							this.Completed.Fire(true);
						}
						ref.value = ref.target; // set ref value to be the target
						targetRefHandler.set(target, ref, propName, index); // finally update the target object property to get the target value.
						ref.Destroy();
					}
				};
				// when ref is destroyed remove the frame update function.
				ref.useDestroying(() => {
					_AnimatorClass.rmframe(_handlerFramer);
				}, true);
				// initiate update on frame.
				_AnimatorClass.frame(_handlerFramer);
			});
		}
	}
}

/**
 * This Class is responsible for creating animations using [DampedSprings](./DampedSprings) and [DampedSpringsRef](./DampedSpringsRef)
 */
class DampedSpringAnimatorClass extends Pseudo<{
	activeDampedSprings: Record<string, DampedSpring>; // we store spring in _dev so they're cleaned up with the `DampedSpringAnimatorClass`
	activeFrames: ((deltaTime: number) => void)[];
	evf?: RBXScriptConnection;
}> {
	/**
	 * Gets a `DampedSpring` based on the dpr-DampingRatio and agf-AngularFrequency.
	 *
	 * It reuses similar springs with the same dpr & agf if possible. Springs are cached for a set period amount of time, whenever
	 * this method is called is when that chache is cleaned if neccessary.
	 */
	private _getDampedSpring(dpr: number, agf: number): DampedSpring {
		const id = `_${dpr}-${agf}`;
		// cleanup any old damped springs that were initialized/updated long ago.
		for (const [_id, _spring] of pairs(this._dev.activeDampedSprings)) {
			if (_id === id) {
				continue; // if id is the same id, ignore, use cache.
			}
			const diff = tick() - (_spring._dev._AnimatorClassinitiationTick as number);
			if (diff >= _DEFAULTS.AnimatorClass_SpringInactiveLifetime) {
				_spring.Destroy();
				delete this._dev.activeDampedSprings[id];
			}
		}
		const exists = this._dev.activeDampedSprings[id];
		if (exists) {
			exists._dev._AnimatorClassinitiationTick = tick();
			return exists;
		}
		const spring = new DampedSpring();
		spring._dev._AnimatorClassinitiationTick = tick();
		spring.angularFrequency = agf;
		spring.dampingRatio = dpr;
		this._dev.activeDampedSprings[id] = spring;
		spring.useDestroying(() => {
			// whenever we destroy the spring, update the spring active time to current tick
			spring._dev._AnimatorClassinitiationTick = tick();
		});
		return spring;
	}
	/**
	 * Add a function to be called on each frame.
	 * @param callback The callback to be called on each frame.
	 */
	frame(callback: (deltaTime: number) => void) {
		this._dev.activeFrames.push(callback);
		if (!this._dev.evf) {
			const RunService = game.GetService("RunService");
			this._dev.evf = (RunService.IsClient() ? RunService.RenderStepped : RunService.Heartbeat).Connect((dt) => {
				this._dev.activeFrames.forEach((x) => x(dt));
			});
		}
	}
	/**
	 * Remove a function from being called on each frame.
	 * @param callback The callback to be removed.
	 */
	rmframe(callback: Callback) {
		this._dev.activeFrames.remove(this._dev.activeFrames.indexOf(callback));
		if (this._dev.activeFrames.size() === 0 && this._dev.evf) {
			this._dev.evf.Disconnect();
			delete this._dev.evf;
		}
	}

	/**
	 * Creates a [DampedSpringAnimation](./DampedSpringAnimation) and "animates" the `properties` provided of the `target`
	 *
	 * @param target The Instance/Pseudo to animate.
	 * @param properties The properties of the Instance/Pseudo to animate.
	 * @param springInfo The info of the `DampedSpring` that will be used to animate.
	 */
	animate(
		target: Instance | Pseudo,
		properties: Record<string, unknown>,
		springInfo?: {
			dampingRatio?: number;
			angularFrequency?: number;
		},
	): DampedSpringAnimation {
		const spring = this._getDampedSpring(
			springInfo?.dampingRatio ?? _DEFAULTS.DampedSpring_dampingRatio,
			springInfo?.angularFrequency ?? _DEFAULTS.DampedSpring_angularFrequency,
		);
		return new DampedSpringAnimation(this, target, properties, spring);
	}
	constructor() {
		super("DampedSpringAnimator");
		this._dev.activeDampedSprings = {};
		this._dev.activeFrames = [];
	}
}

export const DampedSpringAnimator = new DampedSpringAnimatorClass();

/**
 *The `DampedSpringRef` class is a Pseudo object that a [DampedSpring](./dampedspring) consumes.
 */
export class DampedSpringRef<T = any> extends Pseudo<{
	_updatedcbs: Servant[];
}> {
	updated(callback: Callback): Servant {
		const s = new Servant();
		s._dev._DampedSpringUpdatedCallback = callback;
		this._dev._updatedcbs.push(s);
		s.useDestroying(() => {
			this._dev._updatedcbs.remove(this._dev._updatedcbs.indexOf(s));
		});
		return s;
	}
	/**
	 * @param value The value of the Ref
	 * @param target The target that the value is trying to get to.
	 * @param velocity The current velocity.
	 *
	 * The [DampedSpring](./dampedspring) automatically updates the `value` and the `velocity`, hence why it is considered a `reference`.
	 */
	constructor(public value: T, public velocity: T, public target: T) {
		super("DampedSpringRef");
		this._dev._updatedcbs = [];
	}
}

/**
 * A Pseudo class that enables "spring" like behaviour with damped harmonic motion.
 */
export class DampedSpring<T = any> extends Pseudo {
	angularFrequency = _DEFAULTS.DampedSpring_angularFrequency;
	dampingRatio = _DEFAULTS.DampedSpring_dampingRatio;
	/**
	 * Note that this `DampedSpringRef` is not binded to the `DampedSpring`. this is similar to doing `new DampedSpringRef(...)`
	 * Only thing that's "binded" is the generic argument
	 */
	ref(value: T, velocity: T, target: T): DampedSpringRef<T> {
		return new DampedSpringRef(value, velocity, target);
	}
	/**
	 * Updates the `ref` based on the `deltaTime`
	 *
	 * @example
	 * ```ts
	 * const MySpring = new DampedSpring();
	 * const Ref = MySpring.ref(0,0,1)  // Creates a ref with the value 0, initial velocity of 0 and the target of 1
	 *
	 * game.GetService("RunService").RenderStepped.Connect(deltaTime=>{
	 * 	MySpring.update(deltaTime, Ref);
	 * 	print(Ref.value, Ref.velocity)
	 * })
	 * ```
	 */
	update(deltaTime: number, ref: DampedSpringRef<T>) {
		const calc = CalcDampedSpringMotionParams(deltaTime, this.angularFrequency, this.dampingRatio);
		const oldPos = (ref.value as number) - (ref.target as number);
		const oldVel = ref.velocity;
		const np = oldPos * calc.m_posPosCoef + (oldVel as number) * calc.m_posVelCoef + (ref.target as number);
		const nv = oldPos * calc.m_velPosCoef + (oldVel as number) * calc.m_velVelCoef;
		ref.value = np as T;
		ref.velocity = nv as T;
		ref._dev._updatedcbs.forEach((s) => {
			if (typeIs(s._dev._DampedSpringUpdatedCallback, "function")) {
				s._dev._DampedSpringUpdatedCallback();
			}
		});
	}
	constructor() {
		super("DampedSpring");
		this.useReferenceInstanceBehaviour();
		this.Name = this.ClassName;
	}
}

/******************************************************************************
  Copyright (c) 2008-2012 Ryan Juckett
  http://www.ryanjuckett.com/
 
  This software is provided 'as-is', without any express or implied
  warranty. In no event will the authors be held liable for any damages
  arising from the use of this software.
 
  Permission is granted to anyone to use this software for any purpose,
  including commercial applications, and to alter it and redistribute it
  freely, subject to the following restrictions:
 
  1. The origin of this software must not be misrepresented; you must not
     claim that you wrote the original software. If you use this software
     in a product, an acknowledgment in the product documentation would be
     appreciated but is not required.
 
  2. Altered source versions must be plainly marked as such, and must not be
     misrepresented as being the original software.
 
  3. This notice may not be removed or altered from any source
     distribution.
******************************************************************************/
type pOutParams = {
	m_posPosCoef: number;
	m_posVelCoef: number;
	m_velPosCoef: number;
	m_velVelCoef: number;
};
const epsilon = 0.0001;
function CalcDampedSpringMotionParams(deltaTime: number, angularFrequency: number, dampingRatio: number): pOutParams {
	// force values into legal range
	if (dampingRatio < 0.0) dampingRatio = 0.0;
	if (angularFrequency < 0.0) angularFrequency = 0.0;

	// if there is no angular frequency, the spring will not move and we can
	// return identity
	if (angularFrequency < epsilon) {
		return {
			m_posPosCoef: 1.0,
			m_posVelCoef: 0.0,
			m_velPosCoef: 0.0,
			m_velVelCoef: 1.0,
		};
	}

	let v: pOutParams;

	if (dampingRatio > 1 + epsilon) {
		// over-damped
		const za = -angularFrequency * dampingRatio;
		const zb = angularFrequency * math.sqrt(dampingRatio * dampingRatio - 1.0);
		const z1 = za - zb;
		const z2 = za + zb;

		const e1 = math.exp(z1 * deltaTime);
		const e2 = math.exp(z2 * deltaTime);

		const invTwoZb = 1.0 / (2.0 * zb); // = 1 / (z2 - z1)

		const e1_Over_TwoZb = e1 * invTwoZb;
		const e2_Over_TwoZb = e2 * invTwoZb;

		const z1e1_Over_TwoZb = z1 * e1_Over_TwoZb;
		const z2e2_Over_TwoZb = z2 * e2_Over_TwoZb;

		v = {
			m_posPosCoef: e1_Over_TwoZb * z2 - z2e2_Over_TwoZb + e2,
			m_posVelCoef: -e1_Over_TwoZb + e2_Over_TwoZb,

			m_velPosCoef: (z1e1_Over_TwoZb - z2e2_Over_TwoZb + e2) * z2,
			m_velVelCoef: -z1e1_Over_TwoZb + z2e2_Over_TwoZb,
		};
	} else if (dampingRatio < 1.0 - epsilon) {
		// under-damped
		const omegaZeta = angularFrequency * dampingRatio;
		const alpha = angularFrequency * math.sqrt(1.0 - dampingRatio * dampingRatio);

		const expTerm = math.exp(-omegaZeta * deltaTime);
		const cosTerm = math.cos(alpha * deltaTime);
		const sinTerm = math.sin(alpha * deltaTime);

		const invAlpha = 1.0 / alpha;

		const expSin = expTerm * sinTerm;
		const expCos = expTerm * cosTerm;
		const expOmegaZetaSin_Over_Alpha = expTerm * omegaZeta * sinTerm * invAlpha;

		v = {
			m_posPosCoef: expCos + expOmegaZetaSin_Over_Alpha,
			m_posVelCoef: expSin * invAlpha,

			m_velPosCoef: -expSin * alpha - omegaZeta * expOmegaZetaSin_Over_Alpha,
			m_velVelCoef: expCos - expOmegaZetaSin_Over_Alpha,
		};
	} else {
		// critically damped
		const expTerm = math.exp(-angularFrequency * deltaTime);
		const timeExp = deltaTime * expTerm;
		const timeExpFreq = timeExp * angularFrequency;
		v = {
			m_posPosCoef: timeExpFreq + expTerm,
			m_posVelCoef: timeExp,

			m_velPosCoef: -angularFrequency * timeExpFreq,
			m_velVelCoef: -timeExpFreq + expTerm,
		};
	}
	return v;
}
