/* eslint-disable roblox-ts/no-private-identifier */

import { Servant, ServantPromise, ServantTrackableItem } from "./Servant";
import { Pseudo, GetPseudoById, GetPseudoFromObject, Reactive, reactivePseudo } from "./Pseudo";
import { _typeIs } from "./typeIs";
import { threader, isThreader } from "@mekstuff-rbxts/threader";
import { DEBUGGER } from "./DEBUG";
import { Engine } from "./Engine";

export { Pseudo, Servant, ServantPromise, ServantTrackableItem, threader, Reactive };

declare global {
	namespace PHe {
		/** A list of pseudo classes*/
		interface Pseudos {
			Pseudo: Pseudo;
			Servant: Servant;
			reactivePseudo: reactivePseudo;
		}
		/**Classes that should be able to be created with `new` constructor*/
		interface CreateablePseudos {}
		/**
		 * Types that can be checked with custom _typeIs.
		 */
		interface CheckablePseudos {
			Pseudo: Pseudo;
			Servant: Servant;
			reactivePseudo: reactivePseudo;
			threader: threader;
		}
		/**
		 * Types that can be checked with custom _typeIs, including `CheckableTypes` for luau.
		 */
		type CheckablePseudoInstanceTypes = CheckablePseudos & CheckableTypes;
	}
}

export { Engine, _typeIs as typeIs, DEBUGGER, GetPseudoById, GetPseudoFromObject, isThreader };
