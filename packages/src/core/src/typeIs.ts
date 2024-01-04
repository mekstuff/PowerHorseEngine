import { isThreader } from "@mekstuff-rbxts/threader";

//custom typeIs
export function _typeIs<T extends keyof PHe.CheckablePseudoInstanceTypes>(
	Object: unknown,
	Type: T,
): Object is PHe.CheckablePseudoInstanceTypes[T] {
	const [s, r] = pcall(() => {
		if (typeOf(Object) === "table") {
			if (Type === "threader" && isThreader(Object)) {
				return true;
			}
			const sv = Object as PHe.Pseudos["Pseudo"];
			if (sv === undefined) {
				return false;
			}
			if (sv._dev && sv._id) {
				return sv.IsA(Type as keyof PHe.Pseudos);
			}
		}
		return false;
	});
	if (s === true) {
		if (r === true) {
			return r;
		}
	} else {
		warn(
			`An error occurred while running custom typeIs, Will fall back to default typeIs. "${r}"`,
			debug.traceback(),
		);
	}
	return typeIs(Object, Type as keyof CheckableTypes);
}
