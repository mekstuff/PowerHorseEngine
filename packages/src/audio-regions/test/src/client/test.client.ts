import { AudioManager } from "@mekstuff-rbxts/audio-manager";
import { AudioRegions } from "@mekstuff-rbxts/audio-regions";

const AmbientSounds = AudioManager.CreateChannel("Ambients");
AmbientSounds.AudiosAllowedInParallel = 1;

const SafeHavens = AudioRegions.BindToRegion(
	"SafeHaven",
	() => {
		return 1845252747;
	},
	0.4,
	AmbientSounds,
);
AudioRegions.BindToRegion(
	"NotSafeHaven",
	() => {
		return 9043216761;
	},
	0.4,
	AmbientSounds,
);

task.wait(3.5);
print("removing");
SafeHavens.Destroy();
// AudioRegions.BindToRegion("AudioRegion", (channel, currAudio, region) => {
// 	if (currAudio !== undefined) {
// 		return currAudio;
// 	}
// 	const audio = channel.AddAudio("RegionAudio", 1842627030);
// 	return audio;
// });
