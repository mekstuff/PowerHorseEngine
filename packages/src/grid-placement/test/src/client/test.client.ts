import { Grid3D } from "@mekstuff-rbxts/grid-placement";
import { Placer3D } from "../Placer3D";

const TestPlacer = game.Workspace.WaitForChild("TestPlacer") as Part;

// const Couch = game.Workspace.WaitForChild("Couch") as Model & {
// 	Main: BasePart;
// };

const Placer = new Placer3D();
// Placer.GridUnit = 2;
Placer.AutoRotate = true;
Placer.Size = TestPlacer.Size;
Placer.PlacementType = "FollowMouse";
Placer.RaycastParams = new RaycastParams();
Placer.RaycastParams.FilterDescendantsInstances = [TestPlacer];
Placer.RaycastParams.FilterType = Enum.RaycastFilterType.Exclude;
Placer.ResetRotationOnSurfaceChange = true;
Placer.ResultsNormalBehavior = Placer.Placer3DResultsNormalBehavior.surfaceWall;

Placer.useCFrame((cf) => {
	if (cf) {
		TestPlacer.PivotTo(cf);
		// game.GetService("TweenService")
		// 	.Create(TestPlacer, new TweenInfo(0.1), {
		// 		CFrame: cf,
		// 	})
		// 	.Play();
	}
});

Placer.Offset = new CFrame(0, 10, 0).mul(CFrame.Angles(0, math.rad(48.437), 0));
Placer.utils.SetResultsCFrame(TestPlacer);

// Placer.Results = Placer.utils.GetInitialResults(Couch);
Placer.Parent = TestPlacer;
