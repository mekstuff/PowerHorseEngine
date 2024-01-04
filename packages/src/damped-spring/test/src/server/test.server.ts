import { Pseudo } from "@mekstuff-rbxts/core";
import { DampedSpringAnimator } from "@mekstuff-rbxts/damped-spring";

class SpringValueState<T> extends Pseudo {
	constructor(public value: T) {
		super("SpringValueState");
	}
}

task.wait(2);
const n = new SpringValueState(0);
n.usePropertyEffect(() => {
	print(n.value);
}, ["value"]);
DampedSpringAnimator.animate(
	n,
	{
		value: 1,
	},
	{ dampingRatio: 1 },
).Completed.Connect((f) => {
	DampedSpringAnimator.animate(n, {
		value: 0,
	});
});
// const TweenService = game.GetService("TweenService");
// const Attachment = new Instance("Attachment", game.Workspace.FindFirstChild("SpawnLocation") as BasePart);
// Attachment.Parent = game.Workspace;

// const Value = new Instance("Color3Value");
// // Value.Value = 0;
// Value.Parent = game.Workspace;

// task.wait(2);
// const v = DampedSpringAnimator.animate(Value, {
// 	Value: Color3.fromRGB(255, 255, 255),
// 	// Value: new CFrame(0, 10, 0),
// });
// task.wait(0.1);
// print("new animate");
// DampedSpringAnimator.animate(Value, {
// 	Value: Color3.fromRGB(0, 0, 0),
// 	// Value: new CFrame(0, 3, 0),
// });
