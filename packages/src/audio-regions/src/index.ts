declare global {
	namespace PHe {
		interface Pseudos {
			AudioRegionsClass: AudioRegionsClass;
		}
		interface CheckablePseudos {
			AudioRegionsClass: AudioRegionsClass;
		}
	}
}

import { AudioManager } from "@mekstuff-rbxts/audio-manager";
import { Pseudo, Servant } from "@mekstuff-rbxts/core";
import { Collector } from "@mekstuff-rbxts/collector";
import ValueResolver from "@mekstuff-rbxts/value-resolver";

const RunService = game.GetService("RunService");
const FrameRender = RunService.IsClient() ? RunService.RenderStepped : RunService.Heartbeat;

class AudioRegionsClass extends Pseudo {
	public BindToRegion(
		RegionName: string,
		ManageAudioCallback: (
			Channel: PHe.Pseudos["AudioManagerChannel"],
			CurrentAudio: PHe.Pseudos["AudioManagerChannelAudio"] | undefined,
			Region: Instance,
		) => PHe.Pseudos["AudioManagerChannelAudio"] | number,
		Accuracy?: number,
		AudioChannel?: PHe.Pseudos["AudioManagerChannel"],
	): Servant {
		if (!RunService.IsClient()) {
			throw "You cannot BindToRegion on the server.";
		}
		const Player = game.GetService("Players").LocalPlayer;
		let Char = Player.Character ?? Player.CharacterAdded.Wait()[0];
		let _lastRegionAudio: PHe.Pseudos["AudioManagerChannelAudio"] | undefined;
		let _lastRegionAudioId: number | undefined;
		let _activeRegionsTotal = 0;
		let _regionsTotal = 0;
		const Channel = AudioChannel ?? AudioManager.CreateChannel(RegionName);
		const Binded = Collector.Bind(RegionName, (object, _s) => {
			const BindServant = new Servant();
			// _s.Keep(BindServant);
			_regionsTotal += 1;
			let IsInBounds = false;
			let _lastRootPosition: Vector3 | undefined;
			let _lastTargetPos: Vector3 | undefined;
			assert(typeIs(object, "Instance"), `Instance expected for AudioRegion, got ${typeOf(object)}`);
			let _lastCheck = tick();
			BindServant.Keep(
				FrameRender.Connect(() => {
					if (!Char) {
						return;
					}
					let objectSize: Vector3 | undefined;
					if (object.IsA("Model")) {
						const [_, s] = object.GetBoundingBox();
						objectSize = s;
					} else if (object.IsA("BasePart")) {
						objectSize = object.Size;
					}
					if (!objectSize) {
						throw `Could not resolve object size: ${object}`;
					}

					const Root = Char.FindFirstChild("HumanoidRootPart") as BasePart | undefined;
					if (!Root) {
						return;
					}
					const targetCF = ValueResolver.fromInstanceToCFrame(object);
					if (targetCF.Position === _lastTargetPos && Root.Position === _lastRootPosition) {
						return;
					}
					_lastRootPosition = Root.Position;
					_lastTargetPos = targetCF.Position;
					const magnitude = Root.Position.sub(targetCF.Position).Magnitude;
					if (magnitude > objectSize.Magnitude) {
						return;
					}
					if (tick() - _lastCheck > (Accuracy ?? 0.4)) {
						_lastCheck = tick();
						const Params = new OverlapParams();
						Params.FilterDescendantsInstances = [Char];
						Params.FilterType = Enum.RaycastFilterType.Include;
						Params.MaxParts = 1;
						const inBox = game.Workspace.GetPartBoundsInBox(targetCF, objectSize, Params);
						if (inBox.size() > 0) {
							if (!IsInBounds) {
								IsInBounds = true;
								let audio = ManageAudioCallback(Channel, _lastRegionAudio, object);
								if (typeIs(audio, "number")) {
									if (!_lastRegionAudio || _lastRegionAudioId !== audio) {
										_lastRegionAudioId = audio;
										audio = Channel.AddAudio(tostring(math.random()), audio);
									} else {
										audio = _lastRegionAudio;
									}
								} else {
									_lastRegionAudioId = undefined;
								}
								_lastRegionAudio = audio;
								audio.Play();
								_activeRegionsTotal += 1;
							}
						} else {
							if (IsInBounds) {
								IsInBounds = false;
								_activeRegionsTotal -= 1;
								if (_lastRegionAudio && _activeRegionsTotal <= 0) {
									_lastRegionAudio.Pause();
								}
							}
						}
					}
				}),
			);
			BindServant.useDestroying(() => {
				_regionsTotal -= 1;
				_activeRegionsTotal -= 1;
				if (IsInBounds && _lastRegionAudio) {
					_lastRegionAudio.Pause();
				}
				if (_regionsTotal === 0) {
					_lastRegionAudio?.Destroy();
				}
			});
			_s.useDestroying(() => {
				BindServant.Destroy();
			});
			return () => {
				BindServant.Destroy();
			};
		});
		Binded.Keep(
			Player.CharacterAdded.Connect((_nc) => {
				Char = _nc;
			}),
		);

		return Binded;
	}
	constructor() {
		super("AudioRegions");
	}
}

const AudioRegions = new AudioRegionsClass();

export { AudioRegions };
export default AudioRegions;
