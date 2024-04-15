/* eslint-disable roblox-ts/no-private-identifier */

import { Pseudo } from "@mekstuff-rbxts/core";

const TestOne = new (class Test1 extends Pseudo {
    Property1 = false;
    constructor(){
        super("Test1");
    }
})();
const TestTwo = new (class Test2 extends Pseudo {
    Property2 = true;
    constructor(){
        super("Test2");
    }
})();

TestOne.GetRef().Parent = game.Workspace;
TestTwo.GetRef().Parent = game.Workspace;

const combined = TestOne.useCombinePropertyEffects((e) => {
    print("combined update", e)
    if(TestOne.Property1 === true && TestTwo.Property2 === true) {
        combined.Destroy();
        print("cleanup")
    }
    return (...args) => {
        print("Combined cleanup: ", ...args)
    }
}, TestOne.usePropertyEffectCombine(() => {
    // print("test one updated")
    return (...args) => {
        print("test one cleanup: ", ...args)
    }
}, ["Property1"]), TestTwo.usePropertyEffectCombine(() => {
    // print("test two updated")
}, ["Property2"])
);