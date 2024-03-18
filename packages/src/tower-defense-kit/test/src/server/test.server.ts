import { TDKScene } from "@mekstuff-rbxts/tower-defense-kit";

const Part0 = game.Workspace.WaitForChild("Part0") as Part;

const Scene = new TDKScene(Part0);

const unit1 = {
	unitName: "test-unit",
	unitPosition: Part0.Position,
};

Scene.AddUnit("unit1", unit1);

while (true) {
	task.wait(4);
	print("updating unit 1");
	unit1.unitPosition = Part0.Position.add(
		new Vector3(math.random(-20, 20), Part0.Size.Y * 0.5, math.random(-20, 20)),
	);
	Scene.UpdateUnit("unit1");
}
