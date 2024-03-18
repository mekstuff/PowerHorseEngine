import { Serializer } from "@mekstuff-rbxts/serializer";

// const SerializedStr = `hszr0=t_/>/_{"hszr0=s_/>/_assets":"hszr0=t_/>/_{\"hszr0=n_/>/_1\":\"hszr0=t_/>/_{\\\"hszr0=s_/>/_cf\\\":\\\"hszr0=t_/>/_{\\\\\\\"hszr0=s_/>/_R00\\\\\\\":\\\\\\\"hszr0=n_/>/_1\\\\\\\",\\\\\\\"hszr0=s_/>/_z\\\\\\\":\\\\\\\"hszr0=n_/>/_-6.140167236328125\\\\\\\",\\\\\\\"hszr0=s_/>/_R11\\\\\\\":\\\\\\\"hszr0=n_/>/_1\\\\\\\",\\\\\\\"hszr0=s_/>/_R01\\\\\\\":\\\\\\\"hszr0=n_/>/_0\\\\\\\",\\\\\\\"hszr0=s_/>/_R12\\\\\\\":\\\\\\\"hszr0=n_/>/_0\\\\\\\",\\\\\\\"hszr0=s_/>/_R10\\\\\\\":\\\\\\\"hszr0=n_/>/_0\\\\\\\",\\\\\\\"hszr0=s_/>/_y\\\\\\\":\\\\\\\"hszr0=n_/>/_-27.717042922973633\\\\\\\",\\\\\\\"hszr0=s_/>/_R20\\\\\\\":\\\\\\\"hszr0=n_/>/_0\\\\\\\",\\\\\\\"hszr0=s_/>/_R02\\\\\\\":\\\\\\\"hszr0=n_/>/_0\\\\\\\",\\\\\\\"hszr0=s_/>/_x\\\\\\\":\\\\\\\"hszr0=n_/>/_-13.525558471679688\\\\\\\",\\\\\\\"hszr0=s_/>/_R21\\\\\\\":\\\\\\\"hszr0=n_/>/_0\\\\\\\",\\\\\\\"hszr0=s_/>/_R22\\\\\\\":\\\\\\\"hszr0=n_/>/_1\\\\\\\"}\\\",\\\"hszr0=s_/>/_category\\\":\\\"hszr0=s_/>/_Furniture\\\",\\\"hszr0=s_/>/_posyoffset\\\":\\\"hszr0=n_/>/_0\\\",\\\"hszr0=s_/>/_color\\\":\\\"hszr0=C3_/>/_0.9570364952087402,0.1475498378276825,0.11860762536525726\\\",\\\"hszr0=s_/>/_name\\\":\\\"hszr0=s_/>/_Bed\\\",\\\"hszr0=s_/>/_scale\\\":\\\"hszr0=n_/>/_1\\\"}\"}"}`;

const TestSerializer = new Serializer("hszr0");
const SpawnLocation = game.Workspace.FindFirstChild("SpawnLocation") as SpawnLocation;

const Encoded = TestSerializer.Encode({
	CF: SpawnLocation.CFrame,
});

const res = TestSerializer.Decode(Encoded) as unknown;

print(res);
SpawnLocation.CFrame = (res as { CF: CFrame }).CF;

/*
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
	table: { t: true, q: new Color3(255, 255, 255) },
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
*/
