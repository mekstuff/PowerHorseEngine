/* eslint-disable roblox-ts/no-private-identifier */
import { Pseudo } from "@mekstuff-rbxts/core";

export default class SpringValueState<T> extends Pseudo {
	constructor(public value: T) {
		super("SpringValueState");
	}
}
