import { Region, RegionOption } from "@mekstuff-rbxts/region";

const Part0 = game.Workspace.FindFirstChild("Part0") as BasePart;
const Part1 = game.Workspace.FindFirstChild("Part1") as BasePart;

const Option = new RegionOption(Part0, Part1);
Option.Parent = game.Workspace;
game.GetService("RunService").Heartbeat.Connect(() => {
	Option.RegionActive = Region.IsInRegion(Option);
});
