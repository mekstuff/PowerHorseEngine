/* eslint-disable roblox-ts/no-private-identifier */

import { Pseudo } from "@mekstuff-rbxts/core";
import { Dialog, DialogHandler } from "./Dialog";
import { DialogOptionHandler } from "./DialogOption";

export class DialogTree<T = unknown> extends Pseudo<{ _dialogs: Dialog[]; _root: Dialog<T> }> {
	/**
	 * Starts at the `root` dialog.
	 */
	public Start(): Promise<void> {
		return this._dev._root.Start();
	}

	public GetRoot(): Dialog<T> {
		return this._dev._root;
	}

	constructor(Tree: {
		[key: string]: {
			text: string;
			handler: DialogHandler<T>;
			quit?: true;
			options?: { text?: string; key?: string; quit?: true; handler?: DialogOptionHandler }[];
		};
	}) {
		super("DialogTree");
		this._dev._dialogs = [];
		const DialogEntries: Record<string, Dialog<T>> = {};
		for (const [key, content] of pairs(Tree)) {
			if (DialogEntries[key]) {
				throw `The key "${key}" is already being used inside the dialog tree!`;
			}
			const newDialog = new Dialog<T>(
				content.handler ??
					function () {
						throw "You forgot to add a handler to your Dialog inside the DialogTree.";
					},
			);
			newDialog.Text = content.text;
			DialogEntries[key] = newDialog;
		}
		if (!DialogEntries["root"]) {
			throw `Missing "root" Dialog entry for DialogTree! ${tostring(this)}`;
		}
		this._dev._root = DialogEntries["root"];
		for (const [key, dialogEntry] of pairs(DialogEntries)) {
			const inTree = Tree[key];
			if (inTree.options) {
				inTree.options.forEach((opt) => {
					if (!opt.handler && !opt.quit) {
						assert(
							typeIs(opt.key, "string"),
							`string expected for dialog option key, got ${typeOf(opt.key)}`,
						);
						assert(
							typeIs(opt.text, "string"),
							`string expected for dialog option text, got ${typeOf(opt.key)}`,
						);
						assert(
							DialogEntries[opt.key],
							`The key "${opt.key}" was not found as a Dialog entry within the DialogTree!`,
						);
					}
					const option = dialogEntry.CreateOption(opt.text, opt.handler);
					if (opt.quit) {
						option.IsQuit = true;
					}
					if (opt.key !== undefined) {
						option.Dialog = DialogEntries[opt.key];
					}
				});
			}
		}
		this.useReferenceInstanceBehaviour();
	}
}
