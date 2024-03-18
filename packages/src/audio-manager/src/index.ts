/* eslint-disable roblox-ts/no-private-identifier */

import { Pseudo, Servant } from "@mekstuff-rbxts/core";
declare global {
	namespace PHe {
		/** A list of pseudo classes*/
		interface Pseudos {
			AudioManager: AudioManagerClass;
			AudioManagerChannel: AudioManagerChannel;
			AudioManagerChannelAudio: AudioManagerChannelAudio;
		}
		interface CheckablePseudos {
			AudioManager: AudioManagerClass;
			AudioManagerChannel: AudioManagerChannel;
			AudioManagerChannelAudio: AudioManagerChannelAudio;
		}
	}
}

const SoundService = game.GetService("SoundService");
const TweenService = game.GetService("TweenService");

const _ChannelCreated = new Instance("BindableEvent");
const _AudioCreated = new Instance("BindableEvent");

class AudioManagerChannelAudio extends Pseudo<{ SoundInstance: Sound }> {
	public RollOffMaxDistance = 10000;
	public RollOffMinDistance = 10;
	public RollOffMode = Enum.RollOffMode.InverseTapered;
	public Looped = false;
	public PlaybackRegionsEnabled = false;
	public PlaybackSpeed = 1;
	public Playing = false;
	public TimePosition = 0;
	public Volume = 1;
	public SoundGroup: SoundGroup | undefined = undefined;
	public LoopRegion: NumberRange = new NumberRange(0, 6000);

	public _audioVolume = this.Volume;
	public Decay: number | undefined = 0.6;
	/**
	 * This audio will play in parallel with the other audios of this channel, meaning it will not be considered by the AudiosInParallel value.
	 */
	public RespectsAudiosAllowedInParallel = true;
	public ParallelPriority = 1;
	public Play() {
		this.Playing = true;
	}
	public Pause() {
		this.Playing = false;
	}
	public Stop() {
		this.Playing = false;
		this._dev.SoundInstance.TimePosition = 0;
	}

	public Stopped: RBXScriptSignal;
	public Ended: RBXScriptSignal;

	constructor(AudioChannel: AudioManagerChannel, AudioName: string, AudioId: string | number) {
		super("AudioManagerChannelAudio");
		this.Name = `${this.ClassName}-${AudioName}`;
		this.Parent = AudioChannel;
		const SoundInstance = new Instance("Sound");
		SoundInstance.Name = tostring(this);
		SoundInstance.SoundId = typeIs(AudioId, "string") ? AudioId : `rbxassetid://${AudioId}`;
		SoundInstance.Parent = SoundService;

		this.Stopped = SoundInstance.Stopped;
		this.Ended = SoundInstance.Ended;
		this._dev.SoundInstance = SoundInstance;
		const updatelocalVolume = () => {
			this._audioVolume = this.Volume * AudioChannel._channelVolume;
		};
		this._dev._VolumeTracker = AudioChannel.usePropertyEffect(() => {
			updatelocalVolume();
		}, ["_channelVolume"]);
		this.usePropertyEffect(() => {
			updatelocalVolume();
		}, ["Volume"]);

		this.usePropertyEffect(() => {
			if (this.Looped === false) {
				const c = SoundInstance.Ended.Connect(() => {
					this.Playing = false;
				});
				return () => {
					c.Disconnect();
				};
			}
		}, ["Looped"]);

		this.useMappingEffect(
			[
				"RollOffMaxDistance",
				"RollOffMinDistance",
				"RollOffMode",
				"Looped",
				"PlaybackRegionsEnabled",
				"PlaybackSpeed",
				"TimePosition",
				"SoundGroup",
				"LoopRegion",
			],
			[SoundInstance],
		);

		this.usePropertyEffect(() => {
			if (this.Playing) {
				const PlayingServant = new Servant();
				PlayingServant.Keep(
					this.usePropertyEffect(() => {
						if (this.Decay === undefined || this.Decay === 0) {
							SoundInstance.Volume = this._audioVolume;
						} else {
							TweenService.Create(SoundInstance, new TweenInfo(this.Decay), {
								Volume: this._audioVolume,
							}).Play();
						}
					}, ["_audioVolume"]),
				);
				SoundInstance.Resume();
				return () => {
					PlayingServant.Destroy();
					if (this.Decay === undefined || this.Decay === 0) {
						SoundInstance.Pause();
					} else {
						const decayTween = TweenService.Create(SoundInstance, new TweenInfo(this.Decay), {
							Volume: 0,
						});
						decayTween.Completed.Connect((playbackState) => {
							if (playbackState === Enum.PlaybackState.Completed) {
								SoundInstance.Pause();
							}
							decayTween.Destroy();
						});
						decayTween.Play();
					}
				};
			}
		}, ["Playing"]);

		this.useReferenceInstanceBehaviour();
	}
}

class AudioManagerChannel extends Pseudo<{ _audios: Record<string, AudioManagerChannelAudio> }> {
	/**
	 * Master volume for the current channel.
	 */
	public Volume = 1;
	private _activeParallelTree: AudioManagerChannelAudio[] = [];
	private _playAudioRequests: string[] = [];
	/**
	 * How many audios can be playing in parallel in this channel.
	 */
	public AudiosAllowedInParallel = 4;
	public AudiosInParallelAreStopped = false;
	public _channelVolume = this.Volume;
	private _updateAudiosPlayingState(initiatior?: AudioManagerChannelAudio) {
		if (this._activeParallelTree.size() > this.AudiosAllowedInParallel) {
			let _lowestPriority: AudioManagerChannelAudio | undefined;
			this._activeParallelTree.forEach((aud) => {
				if (_lowestPriority) {
					if (aud.ParallelPriority < _lowestPriority.ParallelPriority) {
						_lowestPriority = aud;
					}
				} else {
					_lowestPriority = aud !== initiatior ? aud : undefined; // try not to set lowest priority to the initiator if any.
				}
			});
			_lowestPriority = _lowestPriority ?? initiatior; // set lowest priority to the initiator if any.
			if (_lowestPriority) {
				if (this.AudiosInParallelAreStopped) {
					_lowestPriority.Stop();
				} else {
					_lowestPriority.Pause();
				}
			}
		}
	}
	public GetAudio(AudioName: string): AudioManagerChannelAudio | undefined {
		return this._dev._audios[AudioName];
	}
	public WaitForAudio(AudioName: string): AudioManagerChannelAudio {
		const e = this.GetAudio(AudioName);
		if (e) {
			return e;
		}
		let _waitForTries = 1;
		const _waitFor = (): AudioManagerChannelAudio => {
			_waitForTries += 1;
			task.wait(_waitForTries / 10);
			if (_waitForTries === 8) {
				warn(`WaitForAudio "${AudioName}" from channel "${this.ChannelName}" may be a mistake.`);
			}
			_AudioCreated.Event.Wait();
			return this.GetAudio(AudioName) ?? _waitFor();
		};
		return _waitFor();
	}
	public AddAudio(AudioName: string, AudioId: number | string): AudioManagerChannelAudio {
		if (this._dev._audios[AudioName]) {
			this._dev._audios[AudioName].Destroy();
		}
		const audio = new AudioManagerChannelAudio(this, AudioName, AudioId);
		_AudioCreated.Fire(audio);
		audio.usePropertyEffect(() => {
			if (audio.Playing && audio.RespectsAudiosAllowedInParallel) {
				this._activeParallelTree.push(audio);
				this._updateAudiosPlayingState(audio);
				return () => {
					this._activeParallelTree.remove(this._activeParallelTree.indexOf(audio));
				};
			}
		}, ["Playing"]);
		audio.useDestroying(() => {
			delete this._dev._audios[AudioName];
		});
		this._dev._audios[AudioName] = audio;
		const _iof = this._playAudioRequests.indexOf(AudioName);
		if (_iof !== -1) {
			this._playAudioRequests.remove(_iof);
			audio.Play();
		}
		return audio;
	}
	public PlayAudio(AudioName: string) {
		if (this._dev._audios[AudioName]) {
			this._dev._audios[AudioName].Play();
		} else {
			this._playAudioRequests.push(AudioName);
		}
	}
	public PauseAudio(AudioName: string) {
		if (this._dev._audios[AudioName]) {
			this._dev._audios[AudioName].Pause();
		} else {
			this._playAudioRequests.remove(this._playAudioRequests.indexOf(AudioName));
		}
	}
	public StopAudio(AudioName: string) {
		if (this._dev._audios[AudioName]) {
			this._dev._audios[AudioName].Stop();
		} else {
			this._playAudioRequests.remove(this._playAudioRequests.indexOf(AudioName));
		}
	}
	constructor(_Manager: AudioManagerClass, private ChannelName: string) {
		super("AudioManagerChannel");
		this.Name = `${this.ClassName}-${ChannelName}`;
		this._dev._audios = {};
		const updatelocalVolume = () => {
			this._channelVolume = this.Volume * _Manager.Volume;
		};
		this._dev._VolumeTracker = _Manager.usePropertyEffect(() => {
			updatelocalVolume();
		}, ["Volume"]);
		this.usePropertyEffect(() => {
			updatelocalVolume();
		}, ["Volume"]);
		this.usePropertyRender(() => {
			this._updateAudiosPlayingState();
		}, ["AudiosAllowedInParallel"]);
		this.useReferenceInstanceBehaviour();
		this.Parent = _Manager;
	}
}

class AudioManagerClass extends Pseudo<{ _channels: Record<string, AudioManagerChannel> }> {
	/**
	 * Master volume of all channels.
	 */
	public Volume = 1;

	public CreateChannel(ChannelName: string): AudioManagerChannel {
		const chn = this._dev._channels[ChannelName];
		if (chn) {
			return chn;
		}
		const nc = new AudioManagerChannel(this, ChannelName);
		_ChannelCreated.Fire(nc);
		nc.useDestroying(() => {
			delete this._dev._channels[ChannelName];
		});
		this._dev._channels[ChannelName] = nc;
		return nc;
	}
	public GetChannel(ChannelName: string): AudioManagerChannel | undefined {
		return this._dev._channels[ChannelName];
	}
	public WaitForChannel(ChannelName: string): AudioManagerChannel {
		const e = this.GetChannel(ChannelName);
		if (e) {
			return e;
		}
		let _waitForTries = 1;
		const _waitFor = (): AudioManagerChannel => {
			_waitForTries += 1;
			task.wait(_waitForTries / 10);
			if (_waitForTries === 4) {
				warn(`WaitForChannel "${ChannelName}" may be a mistake.`);
			}
			_ChannelCreated.Event.Wait();
			return this.GetChannel(ChannelName) ?? _waitFor();
		};
		return _waitFor();
	}
	public GetAudio(ChannelName: string, AudioName: string): AudioManagerChannelAudio | undefined {
		const Channel = this.GetChannel(ChannelName);
		if (!Channel) {
			warn(`${ChannelName} did not exist when requesting ${ChannelName}/${AudioName}`);
			return;
		}
		const Audio = Channel.GetAudio(AudioName);
		if (!Audio) {
			warn(`${AudioName} did not exist when requesting ${ChannelName}/${AudioName}`);
		}
		return Audio;
	}
	public WaitForAudio(ChannelName: string, AudioName: string): AudioManagerChannelAudio {
		return this.WaitForChannel(ChannelName).WaitForAudio(AudioName);
	}
	public PlayAudio(ChannelName: string, AudioName: string) {
		const Channel = this.GetChannel(ChannelName);
		if (Channel) {
			Channel.PlayAudio(AudioName);
		}
	}
	public PauseAudio(ChannelName: string, AudioName: string) {
		const Channel = this.GetChannel(ChannelName);
		if (Channel) {
			Channel.PauseAudio(AudioName);
		}
	}
	public StopAudio(ChannelName: string, AudioName: string) {
		const Channel = this.GetChannel(ChannelName);
		if (Channel) {
			Channel.StopAudio(AudioName);
		}
	}

	public AudioCreated: RBXScriptSignal<(Audio: AudioManagerChannelAudio) => void> = _AudioCreated.Event;
	public ChannelCreated: RBXScriptSignal<(Channel: AudioManagerChannel) => void> = _ChannelCreated.Event;

	constructor() {
		super("AudioManager");
		this.Name = this.ClassName;
		this._dev._channels = {};
		this.useReferenceInstanceBehaviour();
	}
}

const AudioManager = new AudioManagerClass();

export { AudioManager };
export default AudioManager;
