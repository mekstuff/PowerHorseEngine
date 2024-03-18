import { ArraySlice, LazyLoaderScroller } from "@mekstuff-rbxts/lazy-loader-scroller";

const UI = new Instance("ScreenGui");

const ScrollBarContent = new Instance("TextLabel");
ScrollBarContent.Text = "Content";
ScrollBarContent.Font = Enum.Font.GothamBold;
ScrollBarContent.TextScaled = true;
ScrollBarContent.BackgroundColor3 = Color3.fromRGB(255, 255, 255);

const ScrollingFrame = new Instance("ScrollingFrame");
ScrollingFrame.AnchorPoint = new Vector2(0.5, 0.5);
ScrollingFrame.Size = UDim2.fromOffset(300, 300);
ScrollingFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y;
ScrollingFrame.CanvasSize = new UDim2(0, 0, 0, 0);
ScrollingFrame.ScrollBarThickness = 10;
ScrollingFrame.Position = UDim2.fromScale(0.5, 0.5);
ScrollingFrame.Parent = UI;

const UILayout = new Instance("UIGridLayout");
UILayout.SortOrder = Enum.SortOrder.LayoutOrder;
UILayout.CellSize = new UDim2(0, 50, 0, 50);
UILayout.Parent = ScrollingFrame;

const FakeData: string[] = [];
for (let i = 0; i < 100; i++) {
	FakeData.push(tostring(i));
}

const LazyLoader = new LazyLoaderScroller<string>(
	(Start, End) => {
		return ArraySlice(FakeData, Start, End);
	},
	(index, content, servant) => {
		const [t] = servant.Keep(new Instance("TextLabel"));
		content.UseAbsolutePositionAndSizeOf(t);
		content.SearchKeywords = [tostring(index)];
		t.LayoutOrder = index;
		t.Text = content.Value;
		t.Visible = true;
		content.usePropertyEffect(() => {
			t.Visible = content.IsVisibleFromSearch;
			if (content.IsVisibleFromSearch) {
				return content.usePropertyEffect(() => {
					if (content.IsVisibleInScrollingFrame) {
						t.Name = "~shown~";
					} else {
						t.Name = "~hidden~";
					}
				}, ["IsVisibleInScrollingFrame"]);
			}
		}, ["IsVisibleFromSearch"]);
		t.Parent = ScrollingFrame;
	},
);

LazyLoader.ProcessExternalSearchRequest = (query) => {
	print(query);
	if (query.size() < 3) {
		return false;
	}
	return true;
};

LazyLoader.usePropertyEffect(() => {
	if (LazyLoader.ScrollerAtYAxisEnd) {
		if (!LazyLoader.IsFinished) {
			LazyLoader.LoadAsync(50);
		} else {
			print(LazyLoader._dev);
			LazyLoader.Destroy();
			print(LazyLoader._dev);
		}
	}
}, ["ScrollerAtYAxisEnd"]);

LazyLoader.UseScrollingFrameProps(ScrollingFrame);
LazyLoader.LoadAsync(50);
LazyLoader.Parent = game.Workspace;
UI.Parent = game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui");
