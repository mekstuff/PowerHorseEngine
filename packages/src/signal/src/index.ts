/* eslint-disable roblox-ts/no-private-identifier */

// Signal implementation for PHe
declare global {
	namespace PHe {
		interface Pseudos {
			Signal: Signal;
		}
		interface CreateablePseudos {
			Signal: Signal;
		}
	}
}

import { Pseudo } from "@mekstuff-rbxts/core";
import QuentySignal from "@rbxts/signal";

export class Signal<params extends Callback = Callback> extends Pseudo {
	private Qsig: QuentySignal<Callback>;
	constructor() {
		super("Signal");
		this.Qsig = new QuentySignal<params>();
	}
	//
	public Connect(Callback: (...args: Parameters<params>) => ReturnType<params>): RBXScriptConnection {
		assert(typeIs(Callback, "function"), `Expected function as callback, got ${typeOf(Callback)}`);
		return this.Qsig.Connect(Callback);
	}
	//
	public ConnectParallel(Callback: (...args: Parameters<params>) => ReturnType<params>): RBXScriptConnection {
		assert(typeIs(Callback, "function"), `Expected function as callback, got ${typeOf(Callback)}`);
		return this.Qsig.ConnectParallel(Callback);
	}
	//
	public Once(Callback: (...args: Parameters<params>) => ReturnType<params>): RBXScriptConnection {
		assert(typeIs(Callback, "function"), `Expected function as callback, got ${typeOf(Callback)}`);
		return this.Qsig.Once(Callback);
	}
	//
	public Fire(...args: Parameters<params>) {
		return this.Qsig.Fire(...(args as unknown[]));
	}
	//
	public Wait(): LuaTuple<Parameters<params>> {
		return $tuple(...(this.Qsig.Wait() as unknown as Parameters<params>));
	}
}

/*
import { Pseudo } from "@mekstuff-rbxts/core";


export class Signal<params extends Callback = Callback> extends Pseudo {
	//
	private _arguments: Array<Parameters<params>> = [];
	//
	public Connect(Callback: (...args: Parameters<params>) => ReturnType<params>): RBXScriptConnection {
		assert(typeIs(Callback, "function"), `Expected function as callback, got ${typeOf(Callback)}`);
		return (this.GetRef() as BindableEvent).Event.Connect(() => {
			Callback(...(this._arguments as Parameters<params>));
		});
	}
	//
	public ConnectParallel(Callback: (...args: Parameters<params>) => ReturnType<params>): RBXScriptConnection {
		assert(typeIs(Callback, "function"), `Expected function as callback, got ${typeOf(Callback)}`);
		return (this.GetRef() as BindableEvent).Event.ConnectParallel(() => {
			Callback(...(this._arguments as Parameters<params>));
		});
	}
	//
	public Once(Callback: (...args: Parameters<params>) => ReturnType<params>): RBXScriptConnection {
		assert(typeIs(Callback, "function"), `Expected function as callback, got ${typeOf(Callback)}`);
		return (this.GetRef() as BindableEvent).Event.Once(() => {
			Callback(...(this._arguments as Parameters<params>));
		});
	}
	//
	public Fire(...args: Parameters<params>) {
		this._arguments = args;
		(this.GetRef() as BindableEvent).Fire(...(args as Parameters<params>));
	}

	/**@yields/
	public Wait(): LuaTuple<Parameters<params>> {
		(this.GetRef() as BindableEvent).Event.Wait();
		return $tuple(...(this._arguments as Parameters<params>));
	}

	constructor() {
		super("Signal", "BindableEvent");
	}
}
*/
