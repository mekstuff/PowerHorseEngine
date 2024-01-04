import Roact from "@rbxts/roact";
import DampedSpringHooks from "@mekstuff-rbxts/damped-spring-hooks";

const LocalPlayer = game.GetService("Players").LocalPlayer;
const PlayerGui = LocalPlayer.WaitForChild("PlayerGui");

const Colors = {
	Primary: Color3.fromRGB(66, 135, 245),
	Text: Color3.fromRGB(240, 240, 240),
};

const ButtonSpringTest = () => {
	const [ButtonHoveringSpring, setButtonHoveringSpring] = DampedSpringHooks.useDampedSpring(0, undefined, 39);
	const [ButtonClickedSpring, setButtonClickedSpring] = DampedSpringHooks.useDampedSpring(0, undefined, 60);
	print("button spring render");
	return (
		<screengui>
			<textbutton
				AnchorPoint={new Vector2(0.5, 0.5)}
				Position={UDim2.fromScale(0.5, 0.5)}
				Size={Roact.joinBindings({ ButtonHoveringSpring, ButtonClickedSpring }).map((springs) => {
					let X = 150;
					X -= springs.ButtonHoveringSpring * 10;
					X -= springs.ButtonClickedSpring * 15;
					return UDim2.fromOffset(X, 30);
				})}
				BackgroundColor3={Color3.fromRGB(21, 21, 21)}
				BackgroundTransparency={ButtonClickedSpring.map((v) => math.clamp(v, 0, 0.4))}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				AutoButtonColor={false}
				Text="Press Me"
				Event={{
					MouseEnter: () => {
						setButtonHoveringSpring({
							target: 1,
							dampingRatio: 1,
						});
					},
					MouseLeave: () => {
						setButtonHoveringSpring({
							target: 0,
							dampingRatio: 0.1,
						});
					},
					MouseButton1Down: () => {
						setButtonClickedSpring({
							target: 1,
							dampingRatio: 1,
						});
					},
					MouseButton1Up: () => {
						setButtonClickedSpring({
							target: 0,
							dampingRatio: 0.6,
						});
					},
				}}
			></textbutton>
		</screengui>
	);
};

// --------------------------
export const CartHealthBar = () => {
	const [Binding, setBinding] = DampedSpringHooks.useDampedSpring(math.random());
	Roact.useEffect(() => {
		let humanoidHealthConnection: RBXScriptConnection | undefined;
		const HandleCharacter = (Character: Model) => {
			if (humanoidHealthConnection && humanoidHealthConnection.Connected) {
				humanoidHealthConnection.Disconnect();
			}
			const Humanoid = Character.WaitForChild("Humanoid") as Humanoid;
			humanoidHealthConnection = Humanoid.GetPropertyChangedSignal("Health").Connect(() => {
				// setPlayerHealth(Humanoid.Health);
				setBinding(Humanoid.Health);
			});
		};
		HandleCharacter(LocalPlayer.Character || LocalPlayer.CharacterAdded.Wait()[0]);
		const characterAddedConnection = LocalPlayer.CharacterAdded.Connect((Character) => {
			HandleCharacter(Character);
		});
		return () => {
			characterAddedConnection.Disconnect();
			if (humanoidHealthConnection && humanoidHealthConnection.Connected) {
				humanoidHealthConnection.Disconnect();
			}
		};
	}, []);

	return (
		<frame
			AnchorPoint={new Vector2(0.5, 0)}
			Position={new UDim2(0.5, 0, 0, 20)}
			Size={new UDim2(1, -40, 0, 40)}
			BackgroundTransparency={0}
			BackgroundColor3={Colors.Text}
		>
			<uicorner />
			<uistroke Transparency={0.7} Thickness={10} Color={Colors.Primary} />
			<frame
				BackgroundColor3={Colors.Primary}
				Size={Binding.map((health) => {
					print(health);
					return UDim2.fromScale(health / 100, 1);
				})}
			>
				<uicorner />
			</frame>
		</frame>
	);
};

// const HealthBarTest = () => {
// 	const [Binding, setBinding] = DampedSpringHooks.useDampedSpring(0);
// 	const [HealthState, setHealthState] = Roact.useState(0);
// 	print("render");
// 	// const [PlayerHealth, setPlayerHealth] = DampedSpringHooks.useDampedSpring<number>(0);
// 	Roact.useEffect(() => {
// 		let humanoidHealthConnection: RBXScriptConnection | undefined;
// 		const HandleCharacter = (Character: Model) => {
// 			if (humanoidHealthConnection && humanoidHealthConnection.Connected) {
// 				humanoidHealthConnection.Disconnect();
// 			}
// 			const Humanoid = Character.WaitForChild("Humanoid") as Humanoid;
// 			humanoidHealthConnection = Humanoid.GetPropertyChangedSignal("Health").Connect(() => {
// 				// setPlayerHealth(Humanoid.Health);
// 				setBinding(Humanoid.Health);
// 				setHealthState(Humanoid.Health);
// 			});
// 		};
// 		HandleCharacter(LocalPlayer.Character || LocalPlayer.CharacterAdded.Wait()[0]);
// 		const characterAddedConnection = LocalPlayer.CharacterAdded.Connect((Character) => {
// 			HandleCharacter(Character);
// 		});
// 		return () => {
// 			characterAddedConnection.Disconnect();
// 			if (humanoidHealthConnection && humanoidHealthConnection.Connected) {
// 				humanoidHealthConnection.Disconnect();
// 			}
// 		};
// 	}, []);

// 	return (
// 		<frame
// 			AnchorPoint={new Vector2(0.5, 0)}
// 			Position={new UDim2(0.5, 0, 0, 20)}
// 			Size={new UDim2(1, -40, 0, 40)}
// 			BackgroundTransparency={0}
// 			BackgroundColor3={Colors.Text}
// 		>
// 			<textlabel
// 				ZIndex={2}
// 				Size={UDim2.fromScale(1, 1)}
// 				TextSize={16}
// 				Font={"GothamBold"}
// 				BackgroundTransparency={1}
// 				Text={Binding.map((x) => `HealthState: ${HealthState} || Binding: ${x}`)}
// 				// Text={`HealthState: ${HealthState} || Binding: ${Binding.map((x) => x)}`}
// 			></textlabel>
// 			<uicorner />
// 			<uistroke Transparency={0.7} Thickness={10} Color={Colors.Primary} />
// 			<frame
// 				BackgroundColor3={Colors.Primary}
// 				Size={Binding.map((health) => {
// 					print(health);
// 					return UDim2.fromScale(health / 100, 1);
// 				})}
// 				// Size={PlayerHealth.map((health) => {
// 				// 	print(health);
// 				// 	return UDim2.fromScale(0.5, 1);
// 				// })}
// 			>
// 				<uicorner />
// 			</frame>
// 		</frame>
// 	);
// };

const Test = () => {
	const [Tick, setTick] = Roact.useState(tick());

	Roact.useEffect(() => {
		game.GetService("RunService").RenderStepped.Connect(() => {
			setTick(tick());
		});
	}, []);

	return (
		<screengui>
			<CartHealthBar />
			<textlabel Text={`Tick: ${Tick}`}></textlabel>
		</screengui>
	);
};

// --------------------------

// Roact.mount(<ButtonSpringTest />, PlayerGui);
// Roact.mount(
// 	<screengui>
// 		<HealthBarTest />
// 	</screengui>,
// 	PlayerGui,
// );
Roact.mount(<Test />, LocalPlayer.WaitForChild("PlayerGui"));
