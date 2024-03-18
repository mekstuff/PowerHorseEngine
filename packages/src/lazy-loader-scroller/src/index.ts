/* eslint-disable roblox-ts/no-private-identifier */
import { Pseudo, Servant } from "@mekstuff-rbxts/core";

export function ArraySlice<T extends unknown[]>(array: T, sliceStart: number, sliceEnd?: number): T {
	const arr: any[] = []; // eslint-disable-line
	for (let i = sliceStart; i < (sliceEnd ?? array.size()); i++) {
		const element = array[i];
		arr.push(element);
	}
	return arr as T;
}

class LazyLoaderContent<T> extends Pseudo {
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
	}
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

		// Searching for items outside the current range
		let currExternalSearchServant: Servant | undefined;
		this.usePropertyEffect(() => {
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
					let content: any[] = []; // eslint-disable-line
					const makeBatchQuery = (start: number, total: number) => {
						const fetchedItems = this.FetchContent(start, start + total);
						content = [...content, ...fetchedItems];
						assert(
							this.ExternalSearchMaxResults !== 0,
							"You should not set ExternalSearchMaxResults to 0, instead use undefined!",
						);
						if (
							this.ExternalSearchMaxResults !== undefined &&
							content.size() >= this.ExternalSearchMaxResults
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
						const llc = new LazyLoaderContent(item, externalSearchServant, this, true);
						externalSearchServant.useDestroying(() => {
							llc.Destroy();
						});
						this.LoadContent(index, llc, externalSearchServant);
					});
				});
			} else {
				if (currExternalSearchServant) {
					currExternalSearchServant.Destroy();
					currExternalSearchServant = undefined;
				}
			}
		}, ["SearchFilter"]);

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
