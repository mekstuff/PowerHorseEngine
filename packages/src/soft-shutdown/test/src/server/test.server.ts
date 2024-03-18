import { SoftShutdown } from "@mekstuff-rbxts/soft-shutdown";

game.BindToClose(() => {
	SoftShutdown.ShutdownAsync(undefined, undefined, 1);
});

SoftShutdown.BindToEntry((Player) => {
	print(Player, "BindToEntry");
});
