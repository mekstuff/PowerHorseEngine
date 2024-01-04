import { threader } from "@mekstuff-rbxts/threader";

const x = new threader(
	(t) => {
		for (let index = 0; index <= 4; index++) {
			print("in initiator", index);
			task.wait(0.1);
		}
	},
	true,
	true,
);

task.wait(1.4);
print("active=false");
x.active = false;
task.wait(1);
print("active=true");
x.active = true;
