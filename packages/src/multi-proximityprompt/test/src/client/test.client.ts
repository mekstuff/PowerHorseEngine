import { MultiProximityPrompt } from "@mekstuff-rbxts/multi-proximityprompt";

const SpawnLoc = game.GetService("Workspace").WaitForChild("SpawnLocation") as SpawnLocation;

const RootPrompt = new Instance("ProximityPrompt");
RootPrompt.ActionText = "RootPrompt";
RootPrompt.RequiresLineOfSight = false;
RootPrompt.Parent = SpawnLoc;
const SubPromptQ = new Instance("ProximityPrompt");
SubPromptQ.ActionText = "Sub Prompt Q";
SubPromptQ.KeyboardKeyCode = Enum.KeyCode.Q;
const SubPromptO = new Instance("ProximityPrompt");
SubPromptO.ActionText = "Sub Prompt O";
SubPromptO.KeyboardKeyCode = Enum.KeyCode.O;
const SubPromptR = new Instance("ProximityPrompt");
SubPromptR.ActionText = "Sub Prompt R";
SubPromptR.KeyboardKeyCode = Enum.KeyCode.R;
const SubPromptT = new Instance("ProximityPrompt");
SubPromptT.ActionText = "Sub Prompt T";
SubPromptT.KeyboardKeyCode = Enum.KeyCode.T;
const SubPromptY = new Instance("ProximityPrompt");
SubPromptY.ActionText = "Sub Prompt Y";
SubPromptY.KeyboardKeyCode = Enum.KeyCode.Y;
const SubPromptQuit = new Instance("ProximityPrompt");
SubPromptQuit.ActionText = "Sub Prompt Quit";
SubPromptQuit.KeyboardKeyCode = Enum.KeyCode.X;

const MultiPrompt = new MultiProximityPrompt(RootPrompt);
MultiPrompt.Options = [
	new MultiProximityPrompt(SubPromptQ),
	new MultiProximityPrompt(SubPromptO),
	new MultiProximityPrompt(SubPromptR),
	new MultiProximityPrompt(SubPromptT),
];
SubPromptQ.TriggerEnded.Connect(() => {
	MultiPrompt.Activated = false;
});
SubPromptO.TriggerEnded.Connect(() => {
	MultiPrompt.Activated = false;
});
SubPromptR.TriggerEnded.Connect(() => {
	MultiPrompt.Activated = false;
});
SubPromptT.TriggerEnded.Connect(() => {
	MultiPrompt.Activated = false;
});

MultiPrompt.Parent = game.Workspace;
