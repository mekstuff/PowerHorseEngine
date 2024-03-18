import { SoftShutdown } from "@mekstuff-rbxts/soft-shutdown";

const PlayerGui = game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;

SoftShutdown.BindToShutdown(() => {
	const GameShuttingDownGui = new Instance("ScreenGui");
	GameShuttingDownGui.IgnoreGuiInset = true;
	GameShuttingDownGui.DisplayOrder = 999;
	const t = new Instance("TextLabel");
	t.Size = UDim2.fromScale(1, 1);
	t.Text = "Game is updating...";
	t.Font = Enum.Font.FredokaOne;
	t.TextScaled = true;
	t.TextColor3 = Color3.fromRGB(240, 240, 240);
	t.BackgroundColor3 = Color3.fromRGB(235, 64, 52);
	t.Parent = GameShuttingDownGui;
	GameShuttingDownGui.Parent = PlayerGui;
});

SoftShutdown.BindToEntry(() => {
	const GameUpdatedGui = new Instance("ScreenGui");
	GameUpdatedGui.IgnoreGuiInset = true;
	GameUpdatedGui.DisplayOrder = 999;
	const t = new Instance("TextLabel");
	t.Size = UDim2.fromScale(1, 1);
	t.Text = "Game has updated!";
	t.Font = Enum.Font.FredokaOne;
	t.TextScaled = true;
	t.TextColor3 = Color3.fromRGB(240, 240, 240);
	t.BackgroundColor3 = Color3.fromRGB(94, 196, 230);
	t.Parent = GameUpdatedGui;
	GameUpdatedGui.Parent = PlayerGui;
	task.wait(4);
	GameUpdatedGui.Destroy();
});
