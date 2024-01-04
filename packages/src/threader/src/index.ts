/**
 * For controlling a thread outside of it's "scope".
 *
 * Use the custom `typeIs` function from `mekstuff-rbxts/core` to check if object is a threader.
 * You should not use this as a stand alone library, You should install `mekstuff-rbxts/core` to access threader.
 */
export class threader {
	/**
	 * Track closed state
	 */
	private _closed = false;
	/**
	 * Returns `true` if the threader is closed, `false` if not.
	 */
	public isClosed(): boolean {
		return this._closed;
	}
	/**
	 * Closes the `threader`, setting `active` after closing will have no effect.
	 *
	 * Threaders are automatically closed after executing, use `tryClose` for attempting to `close` without any errors.
	 */
	public close() {
		if (this._closed === true) {
			throw "Threader already closed.";
		}
		this._closed = true;
	}
	/**
	 * Closes the treader if it is not already closed, returns `true` if closed, `false` otherwise.
	 */
	public tryClose(): boolean {
		if (!this.isClosed()) {
			this.close();
			return true;
		}
		return false;
	}
	/**
	 * @param active The active state of the threader. while active is set to `true`, the coroutine will begin executing,
	 * setting to `false` will end the coroutine.
	 * @param initiator The function the will be running on the `threader`
	 * @param [active=false] State of the `threader`, if `false`, the initiator function will stop executing if it were.
	 * if `true the initiator function will begin executing
	 * @param noAutoClose By default, threaders will automatically close after the initiator function is finished executing, use
	 * `noAutoClose` to override this behaviour.
	 */
	constructor(
		private readonly initiator: (t: threader) => void,
		public active: boolean = false,
		private noAutoClose?: boolean,
	) {
		const t = coroutine.create(() => {
			let previousActiveState = !this.active;
			let st: thread | undefined;
			const x = true;
			while (x) {
				if (this._closed === true) {
					if (st) {
						coroutine.close(st);
					}
					coroutine.yield();
				}
				if (this.active !== previousActiveState) {
					previousActiveState = this.active;
					if (this.active === true) {
						st = coroutine.create(() => {
							this.initiator(this);
							if (!this.noAutoClose) {
								this.tryClose();
							}
						});
						coroutine.resume(st);
					} else {
						if (st !== undefined) {
							coroutine.close(st);
						}
					}
				}
				task.wait();
			}
		});
		coroutine.resume(t);
	}
}

/**
 * Checks if object is a threader
 */
export function isThreader(object: unknown): object is threader {
	if (typeIs(object, "table")) {
		const c = object as { [key: string]: unknown };
		const [s, r] = pcall(() => {
			if (c._closed !== undefined && c.tryClose !== undefined) {
				return true;
			}
		});
		if (s === true && r === true) {
			return true;
		} else {
			return false;
		}
	}
	return false;
}
