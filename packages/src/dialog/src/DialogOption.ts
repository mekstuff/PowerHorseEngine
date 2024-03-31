/* eslint-disable roblox-ts/no-private-identifier */
import { Pseudo, Servant } from "@mekstuff-rbxts/core";
import { Dialog as DialogItem } from "./Dialog";

export type DialogOptionHandler = (Dialog: DialogItem, Option: DialogOption) => void;

export class DialogOption extends Pseudo {
	/**
	 * The Text of the DialogOption.
	 */
	public Text = "";
	public Dialog: DialogItem<any> | undefined = undefined; //eslint-disable-line
	/**
	 * If the disabled, `Select()` will not work.
	 */
	public Enabled = true;
	/**
	 * This will quit the dialog if selected
	 */
	public IsQuit = false;
	/**
	 * Internal property that should not be manipulated. could cause stack overflow if changed incorrectly.
	 */
	private _select = false;
	/**
	 * Internal method that is used by the `Dialog` class.
	 *
	 * You should not be calling this directly!
	 *
	 * @hidden
	 * @deprecated
	 */
	public SetActive(Dialog: DialogItem<any>, Selected: () => void, resolver: Callback): Servant { //eslint-disable-line
		if (this._handler) {
			this._handler(Dialog, this);
		}
		const ActiveServant = new Servant();
		ActiveServant.Keep(
			this.usePropertyEffect(() => {
				if (this._select === true) {
					ActiveServant.Destroy();
					Selected();
					if (this.IsQuit) {
						Dialog.Quit();
						resolver(".quit");
						return;
					}
					if (this.Dialog) {
						resolver(this.Dialog.Start(Dialog));
					}
				}
			}, ["_select"]),
		);
		ActiveServant.Keep(
			this.Destroying.Connect(() => {
				ActiveServant.Destroy();
			}),
		);
		return ActiveServant;
	}
	/**
	 * Selects the DialogOption
	 */
	public Select() {
		if (!this.Enabled) {
			return;
		}
		this._select = true;
		task.wait(0.1);
		this._select = false;
	}
	/**
	 * @param handler This handler will be used to create this option instead of the `Dialog`.
	 */
	constructor(public _handler?: DialogOptionHandler) {
		super("DialogOption");
		this.Name = this.ClassName;
		this.useReferenceInstanceBehaviour();
	}
}
