/* eslint-disable roblox-ts/no-private-identifier */

import { Pseudo, Servant } from "@mekstuff-rbxts/core";

declare global {
	namespace PHe {
		interface Pseudos {
			MultiProximityPrompt: MultiProximityPrompt;
		}
		interface CreateablePseudos {
			MultiProximityPrompt: MultiProximityPrompt;
		}
		interface CheckablePseudos {
			MultiProximityPrompt: MultiProximityPrompt;
		}
	}
}

export enum OptionsDisplayType {
	Radius,
	VertStack,
}

export class MultiProximityPrompt extends Pseudo {
	public Activated = false;
	public AutoActivation = true;
	public RootHiddenWhenActivated = true;
	public Options: MultiProximityPrompt[] | undefined = undefined;
	public OptionsOffset: Vector2 = new Vector2(0, 0);
	public OptionsDisplayType = OptionsDisplayType.Radius;
	private _rootParent: Instance | undefined = undefined;
	private _hidden = false;

	constructor(public RootPrompt?: ProximityPrompt | undefined) {
		super("MultiProximityPrompt");
		this.Name = this.ClassName;

		this.usePropertyEffect(() => {
			if (this.RootPrompt) {
				return this.usePropertyEffect(() => {
					if (this.RootHiddenWhenActivated) {
						if (this._hidden) {
							this.RootPrompt!.Enabled = false;
							return;
						}
						return this.usePropertyEffect(() => {
							this.RootPrompt!.Enabled = !this.Activated;
						}, ["Activated"]);
					}
				}, ["_hidden", "RootHiddenWhenActivated"]);
			}
		}, ["RootPrompt"]);

		this.usePropertyEffect(() => {
			if (this.RootPrompt) {
				const rootPromptServant = new Servant();
				rootPromptServant.Keep(
					this.RootPrompt.TriggerEnded.Connect(() => {
						if (!this.AutoActivation) {
							return;
						}
						if (this.Options && this.Options.size() > 0) {
							this.Activated = !this.Activated;
						}
					}),
				);
				this.useAssignReadonlyProperty("_rootParent", RootPrompt?.Parent);
				rootPromptServant.Keep(
					RootPrompt!.GetPropertyChangedSignal("Parent").Connect(() => {
						this.useAssignReadonlyProperty("_rootParent", RootPrompt?.Parent);
					}),
				);
			}
		}, ["RootPrompt"]);

		this.usePropertyEffect(() => {
			if (this.Activated) {
				return this.usePropertyEffect(() => {
					if (this.Options) {
						const optionsServant = new Servant();
						const optAngle = 360 / this.Options.size();
						this.Options.forEach((option, i) => {

							optionsServant.Keep(
								option.usePropertyEffect(() => {
									return this.usePropertyEffect(() => {
										if(this.OptionsDisplayType === OptionsDisplayType.Radius) {
											const xAng = math.cos(math.rad(i * optAngle));
											const yAng = math.sin(math.rad(i * optAngle));
											option.RootPrompt!.UIOffset = new Vector2(xAng, yAng).mul(this.OptionsOffset);
											return;
										};
										if(this.OptionsDisplayType === OptionsDisplayType.VertStack) {
											option.RootPrompt!.UIOffset = new Vector2(0, i * 10).mul(this.OptionsOffset)
										}
									}, ["OptionsOffset", "OptionsDisplayType"]);
								}, ["RootPrompt"]),
							);
							optionsServant.Keep(
								option.usePropertyEffect(() => {
									if (option.Activated) {
										this.Activated = false;
										this.useAssignReadonlyProperty("_hidden", true);
									}
								}, ["Activated"]),
							);
							optionsServant.Keep(
								option.usePropertyEffect(() => {
									return this.usePropertyEffect(() => {
										option.RootPrompt!.Parent = this._rootParent;
										return (destroying) => {
											if (!destroying) {
												return;
											}
											if (!option.RootPrompt) {
												return;
											}
											if (option.Activated) {
												return;
											}
											option.RootPrompt.Parent = undefined;
										};
									}, ["_rootParent"]);
								}, ["RootPrompt"]),
							);
						});
						return () => {
							optionsServant.Destroy();
						};
					}
				}, ["Options"]);
			}
		}, ["Activated"]);

		/*
		this.usePropertyEffect(() => {
			if (this.Options) {
				const optionsServant = new Servant();
				const optAngle = 360 / this.Options.size();
				this.Options.forEach((option, i) => {
					const xAng = math.cos(math.rad(i * optAngle));
					const yAng = math.sin(math.rad(i * optAngle));
					optionsServant.Keep(
						option.usePropertyEffect(() => {
							if (option.Activated) {
								this.Activated = false;
								this.useAssignReadonlyProperty("_hidden", true);
								return () => {
									print("no longer hidden");
									this.useAssignReadonlyProperty("_hidden", false);
								};
							}
						}, ["Activated"]),
					);
					optionsServant.Keep(
						this.usePropertyEffect(() => {
							if (this.Activated) {
								const SubPromptServant = new Servant();
								SubPromptServant.Keep(
									option.usePropertyEffect(() => {
										return this.usePropertyEffect(() => {
											option.RootPrompt!.UIOffset = new Vector2(xAng, yAng).mul(
												this.OptionsOffset,
											);
										}, ["OptionsOffset"]);
									}, ["RootPrompt"]),
								);
								SubPromptServant.Keep(
									option.usePropertyEffect(() => {
										if (option._setsRootUnactivatedWhenFocusLost) {
											const c = option.RootPrompt!.PromptHidden.Connect(() => {
												this.Activated = false;
												this.useAssignReadonlyProperty("_hidden", false);
											});
											return () => {
												c.Disconnect();
											};
										}
									}, ["_setsRootUnactivatedWhenFocusLost"]),
								);
								SubPromptServant.Keep(
									this.usePropertyEffect(() => {
										return option.usePropertyEffect(() => {
											if (option.RootPrompt) {
												option.RootPrompt.Parent = this._rootParent;
											}
											return (isDestroying) => {
												if (!isDestroying) {
													return;
												}
												if (option.RootPrompt) {
													option.RootPrompt.Parent = undefined;
												}
											};
										}, ["_rootParent"]);
									}, ["RootPrompt"]),
								);
								// return SubPromptServant;
							}
						}, ["Activated"]),
					);
				});
				return () => {
					optionsServant.Destroy();
				};
			}
		}, ["Options"]);
        */
		/*
		this.usePropertyEffect(() => {
			if (this.RootPrompt && this._hidden) {
				this.RootPrompt.Enabled = false;
				return;
			}
			if (this.RootPrompt && this.RootHiddenWhenActivated && this.Activated) {
				this.RootPrompt.Enabled = false;
				return () => {
					if (this.RootPrompt) {
						this.RootPrompt.Enabled = true;
					}
				};
			}
		}, ["RootHiddenWhenActivated", "Activated", "RootPrompt", "_hidden"]);
		this.usePropertyEffect(() => {
			if (this.RootPrompt && this.Activated) {
				const c = this.RootPrompt.PromptHidden.Connect(() => {
					if (!this.RootPrompt) {
						return;
					}
					if (this.RootPrompt.Enabled) {
						print("set activated false");
						this.Activated = false;
					}
				});
				return () => {
					c.Disconnect();
				};
			}
		}, ["RootPrompt", "Activated"]);
		this.usePropertyEffect(() => {
			if (this.RootPrompt) {
				const rootPromptServant = new Servant();
				rootPromptServant.Keep(
					this.RootPrompt.TriggerEnded.Connect(() => {
						if (this.Options && this.Options.size() > 0) {
							this.Activated = !this.Activated;
						}
					}),
				);
				this.useAssignReadonlyProperty("_rootParent", RootPrompt?.Parent);
				rootPromptServant.Keep(
					RootPrompt!.GetPropertyChangedSignal("Parent").Connect(() => {
						this.useAssignReadonlyProperty("_rootParent", RootPrompt?.Parent);
					}),
				);
				rootPromptServant.Keep(
					this.usePropertyEffect(() => {
						if (this.Activated) {
							const activatedServant = new Servant();
							activatedServant.Keep(
								this.usePropertyEffect(() => {
									if (this.Options !== undefined) {
										const [optionsServant] = activatedServant.Keep(new Servant());
										const optAngle = 360 / this.Options.size();
										this.Options.forEach((option, i) => {
											const xAng = math.cos(math.rad(i * optAngle));
											const yAng = math.sin(math.rad(i * optAngle));
											optionsServant.Keep(
												option.usePropertyEffect(() => {
													if (option.RootPrompt !== undefined) {
														const _s = new Servant();
														_s.Keep(
															option.RootPrompt.TriggerEnded.Connect(() => {
																if (option.Options && option.Options.size() > 0) {
																	this.useAssignReadonlyProperty("_hidden", true);
																	this.Activated = false;
																}
															}),
														);
														_s.Keep(
															option.usePropertyEffect(() => {
																if (option._setsRootUnactivatedWhenFocusLost === true) {
																	const [c] = _s.Keep(
																		option.RootPrompt!.PromptHidden.Connect(() => {
																			this.Activated = false;
																		}),
																	);
																	return () => {
																		c.Disconnect();
																	};
																}
															}, ["_setsRootUnactivatedWhenFocusLost"]),
														);
														_s.Keep(
															this.usePropertyEffect(() => {
																option.RootPrompt!.UIOffset = new Vector2(
																	xAng,
																	yAng,
																).mul(this.OptionsOffset);
															}, ["OptionsOffset"]),
														);
														_s.Keep(
															this.usePropertyEffect(() => {
																option.RootPrompt!.Parent = this._rootParent;
															}, ["_rootParent"]),
														);
														return () => {
															_s.Destroy();
														};
													}
												}, ["RootPrompt"]),
											);
										});
										return () => {
											optionsServant.Destroy();
										};
									}
								}, ["Options"]),
							);
							return () => {
								activatedServant.Destroy();
								this.Options?.forEach((option) => {
									if (option.RootPrompt) {
										option.RootPrompt.Parent = undefined;
									}
								});
							};
						}
					}, ["Activated"]),
				);
				return () => {
					rootPromptServant.Destroy();
					this.useAssignReadonlyProperty("_rootParent", RootPrompt?.Parent);
				};
			}
		}, ["RootPrompt"]);
        */
		this.useReferenceInstanceBehaviour();
	}
}
