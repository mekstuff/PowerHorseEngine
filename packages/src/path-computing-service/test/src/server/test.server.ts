import { ComputedPath, ComputedPathModifier } from "@mekstuff-rbxts/path-computing-service";

const Part0 = game.Workspace.FindFirstChild("Part0") as Part;
const Part1 = game.Workspace.FindFirstChild("Part1") as Part;

const Path = new ComputedPath(Part0.Position, Part1.Position, undefined, () => {});
Path.BlockedRaycastParams = new RaycastParams();
Path.BlockedRaycastParams.AddToFilter([
	game.Workspace.FindFirstChild("Part") as Part,
	Part0,
	Part1,
	Path.GetDebugVisualizationGizmosContainer(),
]);
Path.BlockedRaycastParams.FilterType = Enum.RaycastFilterType.Exclude;
Path.AgentParameters = {
	Costs: {
		Test: 10000,
	},
};
Path.DebugVisualization = true;

Path.Blocked.Connect((indx, itb) => {
	print("Path Blocked:", indx, itb);
});
Path.Unblocked.Connect((indx) => {
	print("Path Unblocked:", indx);
});

Path.Compute();
