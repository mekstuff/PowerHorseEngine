//Roact-hooked e.g
// import Roact from "@rbxts/roact";
// import { useEffect, useState, withHookDetection } from "@rbxts/roact-hooked";
// import { Pseudo } from "@mekstuff-rbxts/core";

// withHookDetection(Roact);

// const TestPseudoComponent = new (class extends Pseudo {
// 	TotalClicks = 0;

// 	constructor() {
// 		super("TestPseudoComponent");

// 		const UI = () => {
// 			const [TotalClicks, setTotalClicks] = this.useState("TotalClicks", useState);
// 			return (
// <screengui>
// 	<textbutton
// 		Position={UDim2.fromScale(0.5, 0.5)}
// 		AnchorPoint={new Vector2(0.5, 0.5)}
// 		Text={`Clicked ${TotalClicks} times.`}
// 		TextColor3={Color3.fromRGB(255, 255, 255)}
// 		BackgroundColor3={Color3.fromRGB(18, 18, 18)}
// 		AutomaticSize={Enum.AutomaticSize.XY}
// 		Event={{
// 			MouseButton1Down: () => {
// 				setTotalClicks((old: number) => {
// 					return old + 1;
// 				});
// 			},
// 		}}
// 	></textbutton>
// </screengui>
// 			);
// 		};
// 		Roact.mount(<UI />, this.GetRef());
// 		this.GetRef().Parent = game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui");
// 	}
// })();

// // // function TestRoactComponent() {
// // // 	const [TotalClicks, setTotalClicks] = TestPseudoComponent.useState("TotalClicks", useState);
// // // 	return (
// // // 		<screengui>
// // // 			<textbutton
// // // 				Position={UDim2.fromScale(0.5, 0.5)}
// // // 				AnchorPoint={new Vector2(0.5, 0.5)}
// // // 				Text={`Clicked ${TotalClicks} times.`}
// // // 				TextColor3={Color3.fromRGB(255, 255, 255)}
// // // 				BackgroundColor3={Color3.fromRGB(18, 18, 18)}
// // // 				AutomaticSize={Enum.AutomaticSize.XY}
// // // 				Event={{
// // // 					MouseButton1Down: () => {
// // // 						setTotalClicks((old: number) => {
// // // 							return old + 1;
// // // 						});
// // // 					},
// // // 				}}
// // // 			></textbutton>
// // // 		</screengui>
// // // 	);
// // // }

// // // Roact.mount(<TestRoactComponent />, game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui"));
