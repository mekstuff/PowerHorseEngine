import { Serializer } from "@mekstuff-rbxts/serializer";

const EventTest = game.Workspace.WaitForChild("EventTest") as RemoteEvent;

EventTest.OnClientEvent.Connect((encoded) => {
	print(new Serializer("123").Decode(encoded));
});
