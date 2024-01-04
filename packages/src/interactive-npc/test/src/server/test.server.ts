import { InteractiveNPC } from "@mekstuff-rbxts/interactive-npc";

const NPC = new InteractiveNPC();

NPC.GetTaskScheduler().atNext({
	task: () => {
		return true;
	},
});
