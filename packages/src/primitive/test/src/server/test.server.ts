import { Primitives, execSync } from "@mekstuff-rbxts/primitive";

const v = Primitives.either(Primitives.type("Vector3int16", "Vector3"), Primitives.string());

execSync(v, 1 as never);
// execSync(t, [1, 2, 3, "lel"]);
