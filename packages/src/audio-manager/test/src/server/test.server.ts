import AudioManager from "@mekstuff-rbxts/audio-manager";

const BackgroundMusic = AudioManager.CreateChannel("BackgroundMusic");
BackgroundMusic.AddAudio("Turkish", 1845872497);
BackgroundMusic.AddAudio("Egypt", 1840528161);
BackgroundMusic.AddAudio("Izmir", 1843210537);

BackgroundMusic.AudiosAllowedInParallel = 2;

// print(BackgroundMusic.GetAudio("Turkish"));

AudioManager.Parent = game.Workspace;
