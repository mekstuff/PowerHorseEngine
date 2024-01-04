/* eslint-disable roblox-ts/no-private-identifier */

import { DampedSpringAnimator } from "@mekstuff-rbxts/damped-spring";

const UIS = game.GetService("UserInputService");

const ScreenGui = new Instance("ScreenGui");

const BackgroundFrame = new Instance("Frame");
BackgroundFrame.Size = UDim2.fromScale(1, 1);
BackgroundFrame.BackgroundTransparency = 0;
BackgroundFrame.BackgroundColor3 = Color3.fromRGB(255, 255, 255);
BackgroundFrame.Parent = ScreenGui;

const MoveFrame = new Instance("Frame");
MoveFrame.Size = UDim2.fromOffset(24, 24);
MoveFrame.BackgroundTransparency = 0;
MoveFrame.BackgroundColor3 = Color3.fromRGB(21, 21, 21);
MoveFrame.Parent = BackgroundFrame;

const Button = new Instance("TextButton");
Button.Size = UDim2.fromOffset(80, 24);
Button.AnchorPoint = new Vector2(0.5, 0.5);
Button.Position = UDim2.fromScale(0.5, 0.5);
Button.BackgroundTransparency = 0;
Button.Font = Enum.Font.GothamBold;
Button.TextSize = 20;
Button.TextColor3 = BackgroundFrame.BackgroundColor3;
Button.BackgroundColor3 = MoveFrame.BackgroundColor3;
Button.BackgroundTransparency = 0.5;
Button.BackgroundColor3 = Color3.fromRGB(21, 21, 21);
Button.AutoButtonColor = false;
Button.Parent = BackgroundFrame;

Button.MouseButton1Down.Connect(() => {
	DampedSpringAnimator.animate(
		Button,
		{
			Size: UDim2.fromOffset(70, 20),
		},
		{ angularFrequency: 30 },
	);
});
Button.MouseButton1Up.Connect(() => {
	DampedSpringAnimator.animate(
		Button,
		{
			Size: UDim2.fromOffset(80, 24),
		},
		{ angularFrequency: 30 },
	);
});
Button.MouseEnter.Connect(() => {
	DampedSpringAnimator.animate(
		Button,
		{
			Size: UDim2.fromOffset(70, 20),
			BackgroundTransparency: 0,
			Rotation: 10,
		},
		{ angularFrequency: 30, dampingRatio: 1 },
	);
});
Button.MouseLeave.Connect(() => {
	DampedSpringAnimator.animate(
		Button,
		{
			Size: UDim2.fromOffset(80, 24),
			BackgroundTransparency: 0.5,
			Rotation: 0,
		},
		{ angularFrequency: 30, dampingRatio: 1 },
	);
});

UIS.InputChanged.Connect((input) => {
	if (input.UserInputType === Enum.UserInputType.MouseMovement) {
		DampedSpringAnimator.animate(
			MoveFrame,
			{
				Position: UDim2.fromOffset(input.Position.X + 20, input.Position.Y + 20),
				BackgroundColor3: BrickColor.random().Color,
				BackgroundTransparency: math.random(4, 8) / 10,
			},
			{ dampingRatio: math.random(5, 9) / 10 },
		);
	}
});

ScreenGui.Parent = game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui");

// const Button = game.Workspace.FindFirstChild("Button") as Model & {
// 	Press: BasePart;
// 	Base: BasePart;
// };

// const GetPressedPosition = () => {
// 	return Button.Base.Position;
// };
// const GetNotPressedPosition = () => {
// 	return Button.Base.CFrame.PointToWorldSpace(new Vector3(0, 0.5, 0));
// };

// Button.GetAttributeChangedSignal("Clicked").Connect(() => {
// 	if (Button.GetAttribute("Clicked") === true) {
// 		DampedSpringAnimator.animate(
// 			Button.Press,
// 			{
// 				Position: GetPressedPosition(),
// 			},
// 			{
// 				dampingRatio: 0.9,
// 				angularFrequency: 60,
// 			},
// 		);
// 	} else {
// 		const anim = DampedSpringAnimator.animate(
// 			Button.Press,
// 			{
// 				Position: GetNotPressedPosition(),
// 			},
// 			{
// 				dampingRatio: 0.1,
// 				angularFrequency: 30,
// 			},
// 		);
// 	}
// });
// Button.SetAttribute("Clicked", true);
