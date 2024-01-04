/**
 * Converts a `CFrame` value to a `Vector3` value.
 */
export function fromCFrameToVector3(CF: CFrame): Vector3 {
	return CF.Position;
}

/**
 * Converts a `Vector3` value to a `CFrame` value.
 */
export function fromVector3ToCFrame(Vector: Vector3): CFrame {
	return new CFrame(Vector);
}

/**
 * Gets the `CFrame` of a `BasePart.
 */
export function fromBasePartToCFrame(BasePart: BasePart): CFrame {
	if (!typeIs(BasePart, "Instance")) {
		throw `Instance expected, got ${typeOf(BasePart)}`;
	}
	if (!BasePart.IsA("BasePart")) {
		throw `BasePart expected, got ${tostring(BasePart)}`;
	}
	return BasePart.CFrame;
}
/**
 * Gets the `Position` of a `BasePart`.
 */
export function fromBasePartToVector3(BasePart: BasePart): Vector3 {
	return fromCFrameToVector3(fromBasePartToCFrame(BasePart));
}

/**
 * Gets the `CFrame` value of the `PrimaryPart` of the model
 * @param acceptOnlyPrimaryPart If `false` it will use `BasePart` that is a descendant of the Model.
 */
export function fromModelToCFrame(Model: Model, acceptOnlyPrimaryPart?: boolean): CFrame {
	if (!typeIs(Model, "Instance")) {
		throw `Instance expected, got ${typeOf(Model)}`;
	}
	if (!Model.IsA("Model")) {
		throw `BasePart expected, got ${tostring(Model)}`;
	}
	let usePrimaryPart = Model.PrimaryPart;
	if (usePrimaryPart === undefined && acceptOnlyPrimaryPart !== true) {
		usePrimaryPart = Model.FindFirstChildWhichIsA("BasePart", true);
	}
	if (usePrimaryPart === undefined) {
		throw `Could not resolve a primary part for model: ${Model}. "acceptOnlyPrimaryPart? = ${acceptOnlyPrimaryPart}"`;
	}
	return fromBasePartToCFrame(usePrimaryPart);
}

/**
 * Gets the `Vector3` value of the `PrimaryPart` of the model.
 * @param acceptOnlyPrimaryPart If `false` it will use any `BasePart` that is a descendant of the Model.
 */
export function fromModelToVector3(Model: Model, acceptOnlyPrimaryPart?: boolean): Vector3 {
	return fromCFrameToVector3(fromModelToCFrame(Model, acceptOnlyPrimaryPart));
}

/**
 * Gets the `CFrame` value from an instance.
 */
export function fromInstanceToCFrame(instance: Instance): CFrame {
	if (!typeIs(instance, "Instance")) {
		throw `Instance expected, got ${typeOf(instance)}`;
	}
	if (instance.IsA("Model")) {
		return fromModelToCFrame(instance);
	} else if (instance.IsA("BasePart")) {
		return fromBasePartToCFrame(instance);
	} else if (instance.IsA("Accessory") || instance.IsA("Tool")) {
		const Handle = instance.FindFirstChild("Handle");
		if (Handle && Handle.IsA("BasePart")) {
			return fromBasePartToCFrame(Handle);
		}
	}
	const BasePart = instance.FindFirstChildWhichIsA("BasePart", true);
	if (BasePart) {
		warn(
			`"${instance.Name}" used is an unsupported instance for "fromInstanceToCFrame". "${instance.ClassName}" is not supported so a random BasePart found as descendant was used.`,
		);
		return fromBasePartToCFrame(BasePart);
	}
	throw `Unsupported instance provided: "${instance.ClassName}".`;
}

/**
 * Gets the `Vector3` value from an instance.
 */
export function fromInstanceToVector3(instance: Instance): Vector3 {
	return fromCFrameToVector3(fromInstanceToCFrame(instance));
}

export type GetCFrameValueInputTypes = CFrame | Vector3 | Instance;
/**
 * Resolves a `CFrame` value based on object input.
 */
export function GetCFrameValue(target: GetCFrameValueInputTypes): CFrame {
	if (typeIs(target, "Instance")) {
		return fromInstanceToCFrame(target);
	} else if (typeIs(target, "CFrame")) {
		return target;
	} else if (typeIs(target, "Vector3")) {
		return fromVector3ToCFrame(target);
	}
	return fromInstanceToCFrame(target); //throw error, ts return required.
}

export type GetVector3ValueInputTypes = CFrame | Vector3 | Instance;
/**
 * Resolves a `Vector3` value based on object input.
 */
export function GetVector3Value(target: GetVector3ValueInputTypes): Vector3 {
	return fromCFrameToVector3(GetCFrameValue(target));
}

const ValueResolver = {
	fromCFrameToVector3: (...args: Parameters<typeof fromCFrameToVector3>): ReturnType<typeof fromCFrameToVector3> => {
		return fromCFrameToVector3(...args);
	},
	fromVector3ToCFrame: (...args: Parameters<typeof fromVector3ToCFrame>): ReturnType<typeof fromVector3ToCFrame> => {
		return fromVector3ToCFrame(...args);
	},
	fromBasePartToVector3: (
		...args: Parameters<typeof fromBasePartToVector3>
	): ReturnType<typeof fromBasePartToVector3> => {
		return fromBasePartToVector3(...args);
	},
	fromModelToCFrame: (...args: Parameters<typeof fromModelToCFrame>): ReturnType<typeof fromModelToCFrame> => {
		return fromModelToCFrame(...args);
	},
	fromModelToVector3: (...args: Parameters<typeof fromModelToVector3>): ReturnType<typeof fromModelToVector3> => {
		return fromModelToVector3(...args);
	},
	fromInstanceToCFrame: (
		...args: Parameters<typeof fromInstanceToCFrame>
	): ReturnType<typeof fromInstanceToCFrame> => {
		return fromInstanceToCFrame(...args);
	},
	fromInstanceToVector3: (
		...args: Parameters<typeof fromInstanceToVector3>
	): ReturnType<typeof fromInstanceToVector3> => {
		return fromInstanceToVector3(...args);
	},
	GetCFrameValue: (...args: Parameters<typeof GetCFrameValue>): ReturnType<typeof GetCFrameValue> => {
		return GetCFrameValue(...args);
	},
	GetVector3Value: (...args: Parameters<typeof GetVector3Value>): ReturnType<typeof GetVector3Value> => {
		return GetVector3Value(...args);
	},
	promises: {
		fromCFrameToVector3: (
			...args: Parameters<typeof fromCFrameToVector3>
		): Promise<ReturnType<typeof fromCFrameToVector3>> => {
			return new Promise((resolve) => {
				resolve(fromCFrameToVector3(...args));
			});
		},
		fromVector3ToCFrame: (
			...args: Parameters<typeof fromVector3ToCFrame>
		): Promise<ReturnType<typeof fromVector3ToCFrame>> => {
			return new Promise((resolve) => {
				resolve(fromVector3ToCFrame(...args));
			});
		},
		fromBasePartToVector3: (
			...args: Parameters<typeof fromBasePartToVector3>
		): Promise<ReturnType<typeof fromBasePartToVector3>> => {
			return new Promise((resolve) => {
				resolve(fromBasePartToVector3(...args));
			});
		},
		fromModelToCFrame: (
			...args: Parameters<typeof fromModelToCFrame>
		): Promise<ReturnType<typeof fromModelToCFrame>> => {
			return new Promise((resolve) => {
				resolve(fromModelToCFrame(...args));
			});
		},
		fromModelToVector3: (
			...args: Parameters<typeof fromModelToVector3>
		): Promise<ReturnType<typeof fromModelToVector3>> => {
			return new Promise((resolve) => {
				resolve(fromModelToVector3(...args));
			});
		},
		fromInstanceToCFrame: (
			...args: Parameters<typeof fromInstanceToCFrame>
		): Promise<ReturnType<typeof fromInstanceToCFrame>> => {
			return new Promise((resolve) => {
				resolve(fromInstanceToCFrame(...args));
			});
		},
		fromInstanceToVector3: (
			...args: Parameters<typeof fromInstanceToVector3>
		): Promise<ReturnType<typeof fromInstanceToVector3>> => {
			return new Promise((resolve) => {
				resolve(fromInstanceToVector3(...args));
			});
		},
		GetCFrameValue: (...args: Parameters<typeof GetCFrameValue>): Promise<ReturnType<typeof GetCFrameValue>> => {
			return new Promise((resolve) => {
				resolve(GetCFrameValue(...args));
			});
		},
		GetVector3Value: (...args: Parameters<typeof GetVector3Value>): Promise<ReturnType<typeof GetVector3Value>> => {
			return new Promise((resolve) => {
				resolve(GetVector3Value(...args));
			});
		},
	},
};

export default ValueResolver;
