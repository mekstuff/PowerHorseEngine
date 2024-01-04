const Players = game.GetService("Players");
const IsClient = Players.LocalPlayer ? true : undefined;

export type R15Character = Model & {
	Shirt?: Shirt;
	Pants?: Pants;
	BodyColors: BodyColors;
	Humanoid: { Animator: Animator } & Humanoid;
	Head: MeshPart & {
		Neck: Motor6D;
	};
	LeftFoot: MeshPart;
	LeftHand: MeshPart;
	LeftLowerArm: MeshPart;
	LeftUpperArm: MeshPart;
	LowerTorso: MeshPart;
	RightHand: MeshPart;
	RightLowerArm: MeshPart;
	RightLowerLeg: MeshPart;
	RightUpperArm: MeshPart;
	UpperTorso: MeshPart;
	HumanoidRootPart: MeshPart;
	Animate: (Script | LocalScript) & {
		PlayEmote: BindableFunction;
	};
};

const rigs = script.FindFirstChild("assets")?.FindFirstChild("rigs") as
	| (Folder & {
			["r15-block_rig"]: R15Character;
	  })
	| undefined;

const animate_client = script.FindFirstChild("assets")?.FindFirstChild("animate_client") as LocalScript;
const animate_server = script.FindFirstChild("assets")?.FindFirstChild("animate_server") as Script;

// Animate Scripts Values

function StringValueWithAnimations(
	StringValueName: string,
	Children: { [key: string]: string | { value: string; weight: number } },
) {
	const StringValue = new Instance("StringValue");
	StringValue.Name = StringValueName;
	for (const [a, b] of pairs(Children)) {
		const x = new Instance("Animation");
		x.AnimationId = typeIs(b, "string") ? b : b.value;
		if (typeIs(b, "table")) {
			const weight = new Instance("NumberValue");
			weight.Value = b.weight;
			weight.Name = "Weight";
		}
		x.Name = a as string;
		x.Parent = StringValue;
	}
	return StringValue;
}

function ApplyChildrenToAnimateScript(Parent: LocalScript | Script) {
	const SDP = new Instance("NumberValue");
	SDP.Name = "ScaleDampeningPercent";
	SDP.Value = 0.4;
	SDP.Parent = Parent;
	const PlayEmote = new Instance("BindableFunction");
	PlayEmote.Name = "PlayEmote";
	PlayEmote.Parent = Parent;
	StringValueWithAnimations("cheer", {
		CheerAnim: "http://www.roblox.com/asset/?id=507770677",
	}).Parent = Parent;
	StringValueWithAnimations("climb", {
		ClimbAnim: "http://www.roblox.com/asset/?id=507765644",
	}).Parent = Parent;
	StringValueWithAnimations("dance", {
		Animation1: { value: "http://www.roblox.com/asset/?id=507771019", weight: 10 },
		Animation2: { value: "http://www.roblox.com/asset/?id=507771955", weight: 10 },
		Animation3: { value: "http://www.roblox.com/asset/?id=507772104", weight: 10 },
	}).Parent = Parent;
	StringValueWithAnimations("dance2", {
		Animation1: { value: "http://www.roblox.com/asset/?id=507776043", weight: 10 },
		Animation2: { value: "http://www.roblox.com/asset/?id=507776720", weight: 10 },
		Animation3: { value: "http://www.roblox.com/asset/?id=507776879", weight: 10 },
	}).Parent = Parent;
	StringValueWithAnimations("dance3", {
		Animation1: { value: "http://www.roblox.com/asset/?id=507777268", weight: 10 },
		Animation2: { value: "http://www.roblox.com/asset/?id=507777451", weight: 10 },
		Animation3: { value: "http://www.roblox.com/asset/?id=507777623", weight: 10 },
	}).Parent = Parent;
	StringValueWithAnimations("fall", {
		FallAnim: "http://www.roblox.com/asset/?id=507767968",
	}).Parent = Parent;
	StringValueWithAnimations("fall", {
		FallAnim: "http://www.roblox.com/asset/?id=507767968",
	}).Parent = Parent;
	StringValueWithAnimations("idle", {
		Animation1: { value: "http://www.roblox.com/asset/?id=507766388", weight: 9 },
		Animation2: { value: "http://www.roblox.com/asset/?id=507766666", weight: 1 },
	}).Parent = Parent;
	StringValueWithAnimations("jump", {
		JumpAnim: "http://www.roblox.com/asset/?id=507765000",
	}).Parent = Parent;
	StringValueWithAnimations("laugh", {
		LaughAnim: "http://www.roblox.com/asset/?id=507770818",
	}).Parent = Parent;
	StringValueWithAnimations("mood", {
		MoodAnim: "http://www.roblox.com/asset/?id=7715096377",
	}).Parent = Parent;
	StringValueWithAnimations("point", {
		PointAnim: "http://www.roblox.com/asset/?id=507770453",
	}).Parent = Parent;
	StringValueWithAnimations("run", {
		RunAnim: "http://www.roblox.com/asset/?id=913376220",
	}).Parent = Parent;
	StringValueWithAnimations("sit", {
		SitAnim: "http://www.roblox.com/asset/?id=2506281703",
	}).Parent = Parent;
	StringValueWithAnimations("swim", {
		SwimAnim: "http://www.roblox.com/asset/?id=913384386",
	}).Parent = Parent;
	StringValueWithAnimations("swimidle", {
		SwimIdleAnim: "http://www.roblox.com/asset/?id=913389285",
	}).Parent = Parent;
	StringValueWithAnimations("toollungue", {
		ToolLungueAnim: "http://www.roblox.com/asset/?id=522638767",
	}).Parent = Parent;
	StringValueWithAnimations("toolnoneanim", {
		ToolNoneanimAnim: "http://www.roblox.com/asset/?id=507768375",
	}).Parent = Parent;
	StringValueWithAnimations("toolslash", {
		ToolSlashAim: "http://www.roblox.com/asset/?id=522635514",
	}).Parent = Parent;
	StringValueWithAnimations("walk", {
		WalkAnim: "http://www.roblox.com/asset/?id=913402848",
	}).Parent = Parent;
	StringValueWithAnimations("wave", {
		WaveAnim: "http://www.roblox.com/asset/?id=507770239",
	}).Parent = Parent;
}

ApplyChildrenToAnimateScript(animate_client);
ApplyChildrenToAnimateScript(animate_server);

function GetAnimateScript(): LocalScript | Script {
	const c = IsClient ? animate_client.Clone() : animate_server.Clone();
	c.Name = "Animate";
	return c;
}

/**
 * Creates a R15 character
 */
export function CreateR15Rig(usePlayerId?: number): R15Character {
	if (!rigs) {
		throw "Could not resolves rigs.";
	}
	const nr = rigs["r15-block_rig"].Clone();
	GetAnimateScript().Parent = nr;
	if (usePlayerId !== undefined) {
		try {
			const hd = Players.GetHumanoidDescriptionFromUserId(usePlayerId);
			nr.Parent = game.Workspace;
			ApplyDescriptionToRig(nr, hd);
			nr.Parent = undefined;
		} catch (err) {
			warn(`Failed to usePlayerId ${usePlayerId}. ${err}`);
		}
	}
	nr.Name = "";
	return nr;
}

/**
 * Gets the humanoid description from the user id and applies it to the humanoid
 * @param Description Can be a `HumanoidDescription` or the `UserId` of the target `HumanoidDescription`
 */
export function ApplyDescriptionToRig(Rig: Instance, Description: HumanoidDescription | number) {
	let useHumanoid: Humanoid | undefined;
	let useHumanoidDescription: HumanoidDescription | undefined;
	if (Rig.IsA("Model")) {
		useHumanoid = Rig.FindFirstChildWhichIsA("Humanoid", true);
	} else if (Rig.IsA("Humanoid")) {
		useHumanoid = Rig;
	}
	if (useHumanoid !== undefined && useHumanoid.IsA("Humanoid")) {
		if (typeIs(Description, "number")) {
			useHumanoidDescription = Players.GetHumanoidDescriptionFromUserId(Description);
		} else {
			useHumanoidDescription = Description;
		}
		if (useHumanoidDescription === undefined || !useHumanoidDescription.IsA("HumanoidDescription")) {
			throw `Unexpected object, expected HumanoidDescription, got ${useHumanoidDescription}.`;
		}
		useHumanoid.ApplyDescription(useHumanoidDescription);
	} else {
		throw `Unexpected object, expected Humanoid, got ${useHumanoid}.`;
	}
}
