/* eslint-disable roblox-ts/no-private-identifier */
import { Pseudo, Servant } from "@mekstuff-rbxts/core";

export function ArraySlice<T extends unknown[]>(array: T, sliceStart: number, sliceEnd?: number, isObject?: boolean): T {
	if(isObject) {
		const arr: defined[] = []; // eslint-disable-line
		for (let i = sliceStart; i < (sliceEnd ?? array.size()); i++) {
			if(!array[i]){
				break;
			}
			const element = array[i];
			arr.push(element as defined)
		}
		return arr as T;
	}
	const t = table as unknown as {unpack: (...args: unknown[]) => []};
	const nt = [t.unpack(array, sliceStart + 1, sliceEnd ? math.min(sliceEnd - 1, array.size()) : array.size())];
	return nt as unknown as T;
}

export const compareTo = (a: string, b: string): 0 | 1 | -1 => {
	return a === b ? 0 : a < b ? -1 : 1;
}
export const compareToStringMatch = (a: string, b: string): 0 | 1 | -1 => {
	const [f0, f1] = a.find(b);

	if(!f0 || (f1 || 0) < f0) {
		return compareTo(b, a);
	}
	const aToMatchLength = a.sub(f0, f1);
	return compareTo(aToMatchLength, b)
}

export const localeCompare = (target: string, compare: string): 0 | 1 | -1 => {
	if(target === target){
		return 0;
	}
	if(target < compare) {
		return -1;
	}
	return 1;
}

// A shallow clone of arr is created to compute this function
let recursiveBinarySearchArray = (arr: any[], x: any, compareFn: (a: unknown, b: unknown) => 0 | 1 | -1, start: number, _end: number, _lastRes?: number, results?: number[]): number[] => {
	if(!results){
		arr = table.clone(arr);
	}
	results = results ?? [];
	if(_lastRes && _lastRes <= 0) {
		return results;
	}
	const res = recursiveBinarySearch(arr, x, compareFn, _lastRes ? _lastRes + 1 : start, _end);
	if(res !== -1) {
		results.push(res);
		(arr as number[]).remove(res);
		return recursiveBinarySearchArray(arr, x, compareFn, start, _end, res - 2, results)
	}
	return results;
}

// A shallow clone of arr is created to compute this function
let BinarySearchLoopStringMatch = (arr: any[], x: any, compareFn: (a: unknown, b: unknown) => 0 | 1 | -1): number[] | undefined => {
	const m = BinarySearchLoop(arr, x, compareFn);
	if(m === -1) {
		print("no initial results")
		return undefined;
	};
	const f: number[] = [m];
	// search from found backwards
	let lf = false;
	let li = m;
	while(lf === false) {
		li = li - 1;
		const lx = (arr as defined[])[li] as number;
		if(!lx){
			lf = false;
			break;
		}
		const compare = compareFn(lx,x);
		if(compare !== 0) {
			lf = false;
			break;
		}
		f.push(li);
	}
	// search from found forwards
	let rf = false;
	let ri = m;
	while(rf === false) {
		ri = ri + 1;
		const rx = (arr as defined[])[ri] as number;
		if(!rx){
			rf = false;
			break;
		}
		const compare = compareFn(rx,x);
		if(compare !== 0) {
			lf = false;
			break;
		}
		f.push(ri);
	}
	return f;
}

let BinarySearchLoop = (arr: any[], x: any, compareFn: (a: unknown, b: unknown) => 0 | 1 | -1, start?: number, _end?: number): number => {
	let lowestIndex = start ?? 0;
	let highestIndex = _end ?? (arr as defined[]).size()-1;
	let middleIndex = 0;
	while(lowestIndex<=highestIndex){
		middleIndex = math.floor((lowestIndex+highestIndex)/2);
		if(compareFn((arr as string[])[middleIndex], x) > 0){
			lowestIndex = middleIndex + 1;
		}else if(compareFn((arr as string[])[middleIndex], x) < 0){
			highestIndex = middleIndex - 1;
		}else{
			break;
		}
	}
	if(lowestIndex > highestIndex){
		return -1
	}else{
		return middleIndex;
	}
}

let recursiveBinarySearch = (arr: any[], x: any, compareFn: (a: unknown, b: unknown) => 0 | 1 | -1, start: number, _end: number, subCompareFunc?: (a: unknown, b: unknown) => 0 | 1 | -1): number => {
	assert(typeIs(arr, "table"), `Array expected for recursiveBinarySearch first argument, got ${typeOf(arr)}`);
	assert(typeIs(compareFn, "function"), `Function expected for recursiveBinarySearch second argument, got ${typeOf(arr)}`);
	assert(typeIs(start, "number"), `number expected for recursiveBinarySearch third argument, got ${typeOf(arr)}`);
	assert(typeIs(_end, "number"), `number expected for recursiveBinarySearch fourth argument, got ${typeOf(arr)}`);
	subCompareFunc = subCompareFunc ?? ((a,b) => {
		if(typeOf(x) === "string") {
			return compareTo(a as string, b as string);
		};
		if(typeOf(x) === "number") {
			return a === b ? 0 : (a as number) < (b as number) ? -1 : 1
		}
		throw "subCompareFunc can only handle strings or numbers."
	})
	// Base Condition
	if (start > _end) return -1;

	// Find the middle index
	let mid = math.floor((start + _end) / 2);

	// Compare mid with given key x
	print(mid,x)
	const _compare = compareFn((arr as number[])[mid], x);
	if(_compare === 0) {
		return mid;
	};
	if(_compare > 0) {
		return recursiveBinarySearch(arr, x, compareFn, mid + 1, _end);
	}
	return recursiveBinarySearch(arr, x, compareFn, start, mid - 1);
	// if(compareFn((arr as number[])[mid as number], x)) {
	// 	return mid;
	// }
	// if (((arr as number[])[mid] as number) > (x as number)) {
	// 	print("not else");
	// 	return recursiveBinarySearch(arr, x, compareFn, mid + 1, _end);
	// } else {
	// 	print("else");
	// 	return recursiveBinarySearch(arr, x, compareFn, start, mid - 1);
	// }
}


export const BinarySearch = (content: unknown[], searchFilter: string, fetchContent: (input: unknown) => string, activeStatus?: boolean): number => {
	let l = 0;
	let r = content.size() - 1;
	while(l <= r){
		if(activeStatus === false) {
			break;
		}
		assert(typeIs(fetchContent, "function"), "You need to set a 'fetchContent' when binary searching.");
		// Calculating mid 
		let m = l + math.floor((r + l) / 2); 
		let res = localeCompare(searchFilter, fetchContent(content[m]));
		if(res === 0) {
			return m;
		}
		if(res < 0) {
			l = m - 1;
		} else {
			r = m + 1;
		}
		task.wait();
	}
	return -1;
}

export class LazyLoaderContent<T> extends Pseudo {
	public AllowValueSearch = true;
	public SearchKeywords: string[] | undefined = undefined;
	public AbsoluteSize: Vector2 = new Vector2();
	public AbsolutePosition: Vector2 = new Vector2();
	public readonly IsVisibleInScrollingFrame = false;
	public readonly IsVisibleFromSearch = false;
	public readonly SearchFilterMatch: string | number | undefined = undefined;
	public readonly SearchFilterKeywordMatch: number | undefined = undefined;

	public UseAbsolutePositionAndSizeOf(GuiObject: GuiObject): Servant {
		const s = new Servant();
		this.AbsolutePosition = GuiObject.AbsolutePosition;
		s.Keep(
			GuiObject.GetPropertyChangedSignal("AbsolutePosition").Connect(() => {
				this.AbsolutePosition = GuiObject.AbsolutePosition;
			}),
		);
		this.AbsoluteSize = GuiObject.AbsoluteSize;
		s.Keep(
			GuiObject.GetPropertyChangedSignal("AbsoluteSize").Connect(() => {
				this.AbsoluteSize = GuiObject.AbsoluteSize;
			}),
		);
		return s;
	}

	constructor(
		public Value: T,
		ContentServant: Servant,
		LazyLoader: LazyLoaderScroller<T>,
		public readonly WasCreatedByExternalSearch = false,
	) {
		super("LazyLoaderContent");
		const updateVisibleStatus = () => {
			if(LazyLoader.SearchBehavior === SearchBehavior.binary && WasCreatedByExternalSearch) {
				return;
			}
			if (this.AllowValueSearch && typeIs(this.Value, "string")) {
				const match = this.Value.lower().match(LazyLoader.SearchFilter.lower())[0];
				if (match !== undefined) {
					this.useAssignReadonlyProperty("SearchFilterKeywordMatch", undefined);
					this.useAssignReadonlyProperty("SearchFilterMatch", match);
					this.useAssignReadonlyProperty("IsVisibleFromSearch", true);
					return;
				}
			}
			if (this.SearchKeywords) {
				let i = 0;
				for (const keyword of this.SearchKeywords) {
					i++;
					const match = keyword.lower().match(LazyLoader.SearchFilter.lower())[0];
					if (match !== undefined) {
						this.useAssignReadonlyProperty("SearchFilterMatch", match);
						this.useAssignReadonlyProperty("IsVisibleFromSearch", true);
						this.useAssignReadonlyProperty("SearchFilterKeywordMatch", i);
						return;
					}
				}
			}
			this.useAssignReadonlyProperty("SearchFilterMatch", undefined);
			this.useAssignReadonlyProperty("SearchFilterKeywordMatch", undefined);
			this.useAssignReadonlyProperty("IsVisibleFromSearch", false);
		};
		ContentServant.Keep(
			LazyLoader.usePropertyRender(() => {
				updateVisibleStatus();
			}, ["SearchFilter"]),
		);
		this.usePropertyRender(() => {
			updateVisibleStatus();
		}, ["SearchKeywords", "AllowValueSearch"]);

		const updateInScrollingFrameStatus = () => {
			if (this.AbsoluteSize === Vector2.zero) {
				this.useAssignReadonlyProperty("IsVisibleInScrollingFrame", false);
				return;
			}
			if (LazyLoader.AbsoluteSize === Vector2.zero) {
				this.useAssignReadonlyProperty("IsVisibleInScrollingFrame", false);
				return;
			}
			const yCalcT = this.AbsolutePosition.Y + this.AbsoluteSize.Y - LazyLoader.AbsolutePosition.Y;
			const yCalcB = yCalcT - this.AbsoluteSize.Y - LazyLoader.AbsoluteSize.Y;
			const xCalcT = this.AbsolutePosition.X + this.AbsoluteSize.X - LazyLoader.AbsolutePosition.X;
			const xCalcB = xCalcT - this.AbsoluteSize.X - LazyLoader.AbsoluteSize.X;
			if (yCalcT > 0 && yCalcB < 0 && xCalcT > 0 && xCalcB < 0) {
				this.useAssignReadonlyProperty("IsVisibleInScrollingFrame", true);
			} else {
				this.useAssignReadonlyProperty("IsVisibleInScrollingFrame", false);
			}
		};
		ContentServant.Keep(
			LazyLoader.usePropertyRender(() => {
				updateInScrollingFrameStatus();
			}, ["CanvasPosition", "AbsoluteSize", "AbsolutePosition"]),
		);
		this.usePropertyRender(() => {
			updateInScrollingFrameStatus();
		}, ["AbsoluteSize", "AbsolutePosition"]);

		updateVisibleStatus();
		updateInScrollingFrameStatus();
		if(WasCreatedByExternalSearch) {
			ContentServant.Keep(
				LazyLoader.usePropertyEffect(() => {
					if(LazyLoader.SearchBehavior === SearchBehavior.binary && WasCreatedByExternalSearch) {
						this.useAssignReadonlyProperty("SearchFilterMatch", undefined);
						this.useAssignReadonlyProperty("SearchFilterKeywordMatch", undefined);
						this.useAssignReadonlyProperty("IsVisibleFromSearch", true);
					}
				}, ["SearchBehavior"])
			)
		}
	}
}


export enum SearchBehavior {
	none,
	bruteLinear,
	binary,
}

export class LazyLoaderScroller<T> extends Pseudo<{ _contentServants: Record<number, Servant> }> {
	public SearchFilter = "";
	public Range: NumberRange = new NumberRange(1, 10);
	public ExternalSearchBatchTotal = 30;
	public ExternalSearchMaxResults: number | undefined = undefined;
	public CanvasPosition: Vector2 = new Vector2();
	public AbsoluteSize: Vector2 = new Vector2();
	public AbsolutePosition: Vector2 = new Vector2();
	public AbsoluteCanvasSize: Vector2 = new Vector2();
	public SearchBehavior: SearchBehavior = SearchBehavior.none;
	public BinarySearchBehaviorProcessEntry: ((input: unknown) => string )| undefined = undefined;
	public readonly CurrentIndex = 0;
	public readonly IsFinished = false;
	public readonly ScrollerXAxisEnded = false;
	public readonly ScrollerAtYAxisEnd = false;
	public readonly ScrollerAtXAxisEnd = false;

	/**
	 * This callback will be called whenever the SearchFilter changes and the loader is about to make a fetch request for the content.
	 * Note that this only happens ONCE per default valid search. A default valid search is a string that is not `""`. However you can
	 * add more layers to valid searches here. Returning `false` will cause the request to not be made.
	 */
	public ProcessExternalSearchRequest: ((query: string) => boolean | undefined) | undefined = undefined;

	public UseScrollingFrameProps(GuiObject: ScrollingFrame): Servant {
		const s = new Servant();
		this.CanvasPosition = GuiObject.CanvasPosition;
		this.AbsolutePosition = GuiObject.AbsolutePosition;
		this.AbsoluteSize = GuiObject.AbsoluteSize;
		this.AbsoluteCanvasSize = GuiObject.AbsoluteCanvasSize;
		s.Keep(
			GuiObject.GetPropertyChangedSignal("CanvasPosition").Connect(() => {
				this.CanvasPosition = GuiObject.CanvasPosition;
			}),
		);
		s.Keep(
			GuiObject.GetPropertyChangedSignal("AbsoluteSize").Connect(() => {
				this.AbsoluteSize = GuiObject.AbsoluteSize;
			}),
		);
		s.Keep(
			GuiObject.GetPropertyChangedSignal("AbsolutePosition").Connect(() => {
				this.AbsolutePosition = GuiObject.AbsolutePosition;
			}),
		);
		s.Keep(
			GuiObject.GetPropertyChangedSignal("AbsoluteCanvasSize").Connect(() => {
				this.AbsoluteCanvasSize = GuiObject.AbsoluteCanvasSize;
			}),
		);
		return s;
	}

	public LoadAsync(TotalItems: number) {
		this.RunAsync(undefined, this.CurrentIndex + TotalItems);
	}

	public RunAsync(_start?: number, _end?: number) {
		_start = _start ?? this.CurrentIndex;
		_end = _end ?? this.Range.Max;
		const total = _end - _start;
		if (total < 1) {
			return;
		}
		const content = this.FetchContent(_start, _end);
		if (content.size() < _end - _start) {
			this.useAssignReadonlyProperty("IsFinished", true);
		} else {
			this.useAssignReadonlyProperty("IsFinished", false);
		}

		for (const x of content) {
			if (this._dev._contentServants[this.CurrentIndex]) {
				delete this._dev._contentServants[this.CurrentIndex];
			}
			const contentServant = new Servant();
			this._dev._contentServants[this.CurrentIndex] = contentServant;
			this.LoadContent(
				this.CurrentIndex,
				contentServant.Keep(new LazyLoaderContent(x, contentServant, this))[0],
				contentServant,
			);
			this.useAssignReadonlyProperty("CurrentIndex", this.CurrentIndex + 1);
		}
	}

	constructor(
		protected FetchContent: (_start: number, _end: number) => T[],
		protected LoadContent: (index: number, content: LazyLoaderContent<T>, contentServant: Servant) => void,
	) {
		super("LazyLoaderScroller");
		this._dev._contentServants = {};

		/*
		// Searching for items outside the current range
		this.usePropertyEffect(() => {
			if(this.SearchBehavior === SearchBehavior.bruteLinear) {
				let currExternalSearchServant: Servant | undefined;
				return this.usePropertyEffect(() => {
					if (this.SearchFilter !== "") {
						if (currExternalSearchServant !== undefined) {
							return; // do not make batch requests and create new items after the initial fetch from the first search.
						}
						if (this.ProcessExternalSearchRequest) {
							const pres = this.ProcessExternalSearchRequest(this.SearchFilter);
							if (pres === false) {
								return;
							}
						}
						const externalSearchServant = new Servant();
						currExternalSearchServant = externalSearchServant;
						externalSearchServant.Keep(() => {
							let content: defined[] = []; // eslint-disable-line
							const makeBatchQuery = (start: number, total: number) => {
								const fetchedItems = this.FetchContent(start, start + total);
								content = [...content, ...fetchedItems] as defined[];
								assert(
									this.ExternalSearchMaxResults !== 0,
									"You should not set ExternalSearchMaxResults to 0, instead use undefined!",
								);
								if (
									this.ExternalSearchMaxResults !== undefined &&
									(content as unknown[]).size() >= this.ExternalSearchMaxResults
								) {
									// hit external batch amount, stop recursive calls.
									return;
								}
								if (fetchedItems.size() === total) {
									// fetched all items in this batch meaning more items may still exists, make another batch query
									makeBatchQuery(start + total, total);
								}
							};
							makeBatchQuery(this.CurrentIndex + 1, this.ExternalSearchBatchTotal);
							content.forEach((item, index) => {
								const llc = new LazyLoaderContent(item, externalSearchServant, this as never, true);
								llc.AllowValueSearch = false;
								externalSearchServant.useDestroying(() => {
									llc.Destroy();
								});
								this.LoadContent(index, llc as never, externalSearchServant);
							});
						});
					} else {
						if (currExternalSearchServant) {
							currExternalSearchServant.Destroy();
							currExternalSearchServant = undefined;
						}
					}
				}, ["SearchFilter"]);
			} else {

				if(this.SearchBehavior === SearchBehavior.binary) {
					return this.usePropertyEffect(() => {
						const ExternalSearchServant = new Servant();
						let _active = true;
						if (this.SearchFilter !== "") {
							coroutine.wrap(() => {
								let start = 0;
								let ti = 0;
								const _allContent = this.FetchContent(this.CurrentIndex, math.huge) as defined[]; // add support to have search item be fetched as they scroll.
								const runSearch = () => {
									ti = ti + 1;
									if(ti >= 10) {
										return;
									}
									// assert(typeIs(this.BinarySearchBehaviorProcessEntry, "function"), "You need to set a 'fetchContent' when binary searching.");
									// const arr = [1,3,5,7,8,9]
									// const arr = ["a", "b", "c", "d", "e"]
									// const i = recursiveBinarySearch(_allContent, this.SearchFilter, (a, b) => {
									// 	// return (a as string).lower() < (b as string).lower()
									// 	return (tonumber(a) as number) < (tonumber(b) as number)
									// } , start, _allContent.size() - 1);
									// print(_allContent)
									// const listOfStrings: string[] = ["a","a","aab","b","c","d","g","h","k","z"];
									const locations = [
										"Aaaa|aaaa|Test",
										"Bbbb|bbbb|Test",
										"New Abbey|Ceredigion|United Kingdom",
										"New Albany|Indiana|United States",
										"New Albany|Kansas|United States",
										"New Albany|Mississippi|United States",
										"New Albany|Ohio|United States",
										"Zzzz|zzzz|Test"
										].sort((a,b) => a < b);
									const i = (BinarySearchLoopStringMatch(locations, this.SearchFilter, (a,b) => compareToStringMatch(a as string, b as string)));
									if(i) {
										i.forEach(x=>{
											print(x, locations[x])
										})
									}
									print(i)
										// print(listOfStrings)
									// listOfStrings.sort((a,b) => a < b)
									// print(listOfStrings)
									// const stringToFind = "z";
									// const v = BinarySearchLoopStringSplit(locations, this.SearchFilter, (a,b) => compareToStringMatch(a as string,b as string), start, listOfStrings.size());
									// print(v);
									// const is = (recursiveBinarySearch(_allContent, tostring(this.SearchFilter), (a, b) => {
									// 	return compareTo(a as string, b as string);
									// } , start, _allContent.size() - 1));
									// print(is);
									// const i = recursiveBinarySearch(_allContent, tonumber(this.SearchFilter), (a, b) => (a as number) === (b as number) , start, _allContent.size() - 1);
									// print(i, _allContent[i]);
									// const i = recursiveBinarySearch(_allContent, this.SearchFilter, (a, b) => (a as string).lower() > (b as string).lower() , start, _allContent.size() - 1);
									// const i = recursiveBinarySearch(_allContent, tonumber(this.SearchFilter), (a, b) => a === b , 0, arr.size() - 1);
									// print(i);
									// const i = BinarySearch(_allContent, tonumber(this.SearchFilter) as never, this.BinarySearchBehaviorProcessEntry, _active);
									// const i = binarySearch(_allContent as number[], tonumber(this.SearchFilter) as number);
									// if(i !== -1) {
									// 	const llc = new LazyLoaderContent(_allContent[i], ExternalSearchServant, this as never, true);
									// 	ExternalSearchServant.useDestroying(() => {
									// 		print("destroyed");
									// 		llc.Destroy();
									// 	});
									// 	this.LoadContent(i + 1, llc as never, ExternalSearchServant);
									// 	start = i + 1;
									// 	// runSearch();
									// } else {
									// 	print("done")
									// }
								}
								runSearch();
							})();
						}
						return () => {
							_active = false;
							ExternalSearchServant.Destroy();
						}
					}, ["SearchFilter"])
				}
			}
		}, ["SearchBehavior"])
		*/

		this.usePropertyEffect(() => {
			if (this.AbsoluteCanvasSize.Y !== 0 && this.AbsoluteSize.Y !== 0 && this.CanvasPosition.Y !== 0) {
				if (this.AbsoluteCanvasSize.Y - this.AbsoluteSize.Y - this.CanvasPosition.Y <= 0.1) {
					this.useAssignReadonlyProperty("ScrollerAtYAxisEnd", true);
				} else {
					this.useAssignReadonlyProperty("ScrollerAtYAxisEnd", false);
				}
			} else {
				this.useAssignReadonlyProperty("ScrollerAtYAxisEnd", false);
			}
			if (this.AbsoluteCanvasSize.X !== 0 && this.AbsoluteSize.X !== 0 && this.CanvasPosition.X !== 0) {
				if (this.AbsoluteCanvasSize.X - this.AbsoluteSize.X - this.CanvasPosition.X <= 0) {
					this.useAssignReadonlyProperty("ScrollerAtXAxisEnd", true);
				} else {
					this.useAssignReadonlyProperty("ScrollerAtXAxisEnd", false);
				}
			} else {
				this.useAssignReadonlyProperty("ScrollerAtXAxisEnd", false);
			}
		}, ["CanvasPosition", "AbsoluteCanvasSize", "AbsoluteSize"]);

		this.useReferenceInstanceBehaviour();
	}
}
