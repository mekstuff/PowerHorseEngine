declare global {
	namespace PHe {
		interface Pseudos {
			Collector: Collector;
		}
	}
}

import { Pseudo, GetPseudoFromObject } from "@mekstuff-rbxts/core";
import { Servant } from "@mekstuff-rbxts/servant";

const CollectionService = game.GetService("CollectionService");

/**If target is a pseudo then it gets the pseudo*/
const GetObject = (Target: Instance): Instance | Pseudo => {
	if (Target.FindFirstChild("_pseudoid")) {
		return GetPseudoFromObject(Target) as Pseudo;
	}
	return Target;
};
/**If target is a pseudo then returns the ref instance*/
const GetInstance = (Target: Instance | Pseudo): Instance => {
	if (typeIs(Target, "Instance")) {
		return Target;
	}
	return Target.GetRef();
};

/***/
class Collector extends Pseudo {
	/**
	 * Gets all items with the tag
	 */
	public GetTagged(TagName: string): (Instance | Pseudo)[] {
		const Tagged: (Instance | Pseudo)[] = [];
		const AllTagged = CollectionService.GetTagged(TagName);
		AllTagged.forEach((instance) => {
			Tagged.push(GetInstance(instance));
		});
		return Tagged;
	}
	/**
	 * Add collection service tag to Instance/Pseudo
	 */
	public Tag(instance: Instance | Pseudo | undefined, TagName: string) {
		if (instance === undefined) {
			error(`Instance | Pseudo expected, got undefined`);
		}
		CollectionService.AddTag(GetInstance(instance), TagName);
	}
	/**
	 * Remove collection service tag from Instance/Pseudo
	 */
	public RemoveTag(instance: Instance | Pseudo, TagName: string) {
		CollectionService.RemoveTag(GetInstance(instance), TagName);
	}
	/**
	 * Bind to a collection service tag
	 */
	public Bind(TagName: string, Callback: (Object: Instance | Pseudo, BindServant: Servant) => unknown): Servant {
		const cleanups = new Map<Instance, () => void>();
		const BindServant = new Servant();
		const ExecuteCallback = (_obj: Instance) => {
			const oldcleanup = cleanups.get(_obj);
			if (oldcleanup) {
				oldcleanup();
				cleanups.delete(_obj);
			}
			const cleanupret = Callback(GetObject(_obj), BindServant);
			if (typeIs(cleanupret, "function")) {
				cleanups.set(_obj, cleanupret);
			}
		};
		const Tagged = CollectionService.GetTagged(TagName);
		Tagged.forEach((e) => {
			ExecuteCallback(e);
		});
		BindServant.Keep(
			CollectionService.GetInstanceAddedSignal(TagName).Connect((instance) => {
				ExecuteCallback(instance);
			}),
		);
		BindServant.Keep(
			CollectionService.GetInstanceRemovedSignal(TagName).Connect((instance) => {
				const cleaner = cleanups.get(instance);
				if (cleaner) {
					cleaner();
					cleanups.delete(instance);
				}
			}),
		);
		return BindServant;
	}
	constructor() {
		super("Collector");
	}
}

const COLLECTOR = new Collector();
export default COLLECTOR;

export { COLLECTOR as Collector };
