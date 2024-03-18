import { Dialog, DialogHandler, DialogTree } from "@mekstuff-rbxts/dialog";

const DialogGui = game
	.GetService("Players")
	.LocalPlayer.WaitForChild("PlayerGui")
	.WaitForChild("DialogGui") as ScreenGui;
const DialogTemplate = DialogGui.WaitForChild("DialogTemplate") as Frame & {
	Options: Frame & {
		OptionTemplate: TextButton;
	};
	Body: TextLabel;
};

const Handler: DialogHandler<boolean> = (dialog, dialogServant, onOption) => {
	const VisualDialog = DialogTemplate.Clone();
	dialogServant.Keep(VisualDialog);
	dialogServant.Keep(
		dialog.usePropertyEffect(() => {
			VisualDialog.Body.Text = dialog.Text;
		}, ["Text"]),
	);
	VisualDialog.Name = "Visual Dialog + " + dialog.Name;
	VisualDialog.Visible = true;
	onOption((option, optionServant) => {
		const optionDisplay = VisualDialog.Options.OptionTemplate.Clone();
		optionDisplay.MouseButton1Click.Connect(() => {
			option.Select();
		});
		optionServant.Keep(optionDisplay);
		optionServant.Keep(
			option.usePropertyEffect(() => {
				optionDisplay.Text = option.Text;
			}, ["Text"]),
		);
		optionDisplay.Visible = true;
		optionDisplay.Parent = VisualDialog.Options;
	});
	VisualDialog.Parent = DialogGui;
};

DialogTemplate.Visible = false;

const Tree = new DialogTree<boolean>({
	root: {
		options: [
			{ key: "how-it-works", text: "How it works?" },
			{ key: "different-route", text: "Option A" },
		],
		text: "This is a example of what the dialog package is capable of!",
		handler: Handler,
	},
	["how-it-works"]: {
		text: "These dialogs are generated from a dialog tree, meaning any option in the list can hop to any part of the dialog tree by entering it's key!",
		options: [{ key: "yes-way", text: "No Way!" }],
		handler: Handler,
	},
	["yes-way"]: {
		text: "YES WAY! We can simply hop back to the start by setting the key of an option to be 'root'",
		options: [
			{ key: "root", text: "Back to root" },
			{ key: "how-it-works", text: "Back to last page" },
		],
		handler: Handler,
	},
	["different-route"]: {
		text: "We can hop to this different route easily by just setting the key of the option!!",
		options: [
			{ key: "root", text: "Take me home" },
			{ key: "yes-way", text: "NO WAY!!!!" },
		],
		handler: Handler,
	},
});

Tree.Start();
