import { Serializer } from "@mekstuff-rbxts/serializer";

const TestSerializer = new Serializer("123");

const EventTest = new Instance("RemoteEvent");
EventTest.Name = "EventTest";
EventTest.Parent = game.Workspace;

const p = new Instance("Part");
p.Name = "MyAwesomePart";
p.Parent = game.Workspace;
const initTime = tick();
const Encoded = TestSerializer.Encode({
	string: "Hello",
	number: 69,
	boolean: false,
	table: { t: true },
	BrickColor: new BrickColor("Buttermilk"),
	CatalogSearchParams: new CatalogSearchParams(),
	CFrame: new CFrame(10, 40, 15),
	Color3: new Color3(25, 100, 90),
	ColorSequence: new ColorSequence([
		new ColorSequenceKeypoint(0, new Color3(0, 0, 0)),
		new ColorSequenceKeypoint(1, new Color3(1, 1, 1)),
	]),
	ColorSequenceKeypoint: new ColorSequenceKeypoint(0.5, Color3.fromRGB(0, 255, 255)),
	DateTime: DateTime.now(),
	Enum: Enum.AccessModifierType,
	EnumItem: Enum.AccessModifierType.Allow,
	Font: new Font("rbxasset://fonts/families/AmaticSC.json", Enum.FontWeight.Bold),
	Instance: p,
	NumberRange: new NumberRange(1, 3),
	NumberSequence: new NumberSequence([new NumberSequenceKeypoint(0, 1, 3), new NumberSequenceKeypoint(1, 2)]),
	NumberSequenceKeypoint: new NumberSequenceKeypoint(0.5, 1),
	OverlapParams: new OverlapParams(),
	PathWaypoint: new PathWaypoint(),
	PhysicalProperties: new PhysicalProperties(Enum.Material.Air),
	RaycastParams: new RaycastParams(),
	TweenInfo: new TweenInfo(),
	UDim: new UDim(1),
	UDim2: new UDim2(1, 10, 10, 40),
	Vector2: new Vector2(1, 1),
	Vector2int16: new Vector2int16(1, 1),
	Vector3: new Vector3(1, 1, 3),
	Vector3int16: new Vector3int16(1, 1, 3),
});
game.GetService("Players").PlayerAdded.Connect((player) => {
	EventTest.FireClient(player, Encoded);
});
print(Encoded.size(), tick() - initTime);
