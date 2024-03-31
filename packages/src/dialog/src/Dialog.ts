/* eslint-disable roblox-ts/no-private-identifier */

import { Pseudo, Servant } from "@mekstuff-rbxts/core";
import { DialogOption, DialogOptionHandler } from "./DialogOption";

export type DialogHandler<T = unknown> = (
	dialog: Dialog<T>,
	handlerServant: Servant,
	onOption: (handler: (option: DialogOption, optionServant: Servant) => void) => void,
) => void;

export class Dialog<T = unknown> extends Pseudo<{
	_options: DialogOption[];
	_var: T;
	_startServant?: Servant;
	_parentStarted?: Dialog<T>;
}> {
	/**
	 * Readonly value that displays whether the Dialog is active.
	 */
	public readonly Active = false;
	/**
	 * The Text of the Dialog.
	 */
	public Text = "";

	/**
	 * Sets the Var of the dialog, by default it will set it the the Root dialog.
	 */
	public SetVar(VarValue: T, notRootVar?: boolean) {
		if (notRootVar) {
			this._dev._var = VarValue;
		}
		this.GetRoot()._dev._var = VarValue;
	}
	public GetVar(notRootVar?: boolean): T {
		return (notRootVar ? this._dev._var : this.GetRoot()._dev._var) as T;
	}
	/**
	 * Ends the Dialog
	 */
	public Quit() {
		if (this._dev._startServant) {
			this._dev._startServant.Destroy();
			delete this._dev._startServant;
		}
	}

	public GetRoot(): Dialog<T> {
		if (!this._dev._parentStarted) {
			return this;
		}
		return this._dev._parentStarted.GetRoot();
	}

	/**
	 * Starts the Dialog and triggers a "chain" like reaction with all options and their respective dialogs.
	 */
	public Start(_parentStarted?: Dialog<T>): Promise<void> {
		if (this._dev._startServant) {
			this._dev._startServant.Destroy();
			delete this._dev._startServant;
		}
		this._dev._parentStarted = _parentStarted;
		return new Promise<void>((resolve) => {
			const StartServant = new Servant();
			this._dev._startServant = StartServant;
			this.useAssignReadonlyProperty("Active", true);
			let _onOptionHandler: Callback | undefined;
			const onOption = (callback: unknown) => {
				assert(
					typeIs(callback, "function"),
					`onOption handler expected to be a function, got ${typeOf(callback)}`,
				);
				_onOptionHandler = callback;
			};
			this._dialogHandler(this, StartServant, onOption);
			const _setactiveServants: Servant[] = [];
			this._dev._options.forEach((option) => {
				assert(typeIs(_onOptionHandler, "function"), `onOption callback handler missing for dialog.`);
				const activeServant = option.SetActive(
					this,
					() => {
						this.useAssignReadonlyProperty("Active", false);
						_setactiveServants.forEach((activeServant) => {
							activeServant.Destroy();
						});
						StartServant.Destroy();
						// resolve();
					},
					resolve,
				);
				_setactiveServants.push(activeServant);
				if (!option._handler) {
					_onOptionHandler(option, activeServant);
				}
			});
		}).catch((err) => {
			warn(`An error occurred during dialog execution | ${tostring(this)} | ${err}`);
		});
	}
	/**
	 * Creates an option for this Dialog.
	 */
	public CreateOption(OptionText?: string, OptionHandler?: DialogOptionHandler): DialogOption {
		const Option = new DialogOption(OptionHandler);
		if (OptionText !== undefined) {
			Option.Text = OptionText;
		}
		this._dev._options.push(Option);
		Option.useDestroying(() => {
			this._dev._options.remove(this._dev._options.indexOf(Option));
		});
		return Option;
	}
	/**
	 * @param _dialogHandler The handler for this Dialog.
	 * The first param is the Dialog itself
	 *
	 * The second param is a Servant that should be used in your handler. This Servant is Destroyed whenever
	 * the dialog is no longer active and/or gets destroyed.
	 *
	 * The third param should be a handler function for handling the Options of the Dialog.
	 */
	constructor(private _dialogHandler: DialogHandler<T>) {
		super("Dialog");
		if (game.GetService("RunService").IsServer()) {
			throw "You can only create Dialogs on the client!";
		}
		this._dev._options = [];
		this.Name = this.ClassName;
		this.useReferenceInstanceBehaviour();
	}
}
