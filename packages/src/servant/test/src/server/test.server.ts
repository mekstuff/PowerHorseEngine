import { threader, Pseudo } from "@mekstuff-rbxts/core";
import { Servant, sp } from "@mekstuff-rbxts/servant";

class TestClass extends Pseudo<{
	x: 1;
}> {
	constructor() {
		super("Test");
	}
}

const servant = new Servant();
const [s2] = servant.Keep(new Servant());

// servant.Keep(new TestClass());
const [Part] = s2.Keep(new Instance("Part"));
Part.Parent = game.Workspace;
Part.Name = "LOL";

task.wait(4);
servant.Destroy();
