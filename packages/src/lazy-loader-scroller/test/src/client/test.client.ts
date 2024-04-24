import { ArraySlice, LazyLoaderScroller, SearchBehavior } from "@mekstuff-rbxts/lazy-loader-scroller";

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

// const FakeData: string[] = ["A", "B", "aBc", "ABC", "abc", "ABCD"];
const FakeData: string[] = ["TUV", "a", "b", "abc", "abcefg", "abcd", "abcde", "AB", "qrs"]; // a, abc, abcd, abcde, abcefg, b
FakeData.sort((a,b) => a.lower() < b.lower());
// print(FakeData);

// const listOfStrings: string[] = ["a","b","c","d","g","h","k","z"];
const listOfStrings = [
	"Aaaa|aaaa|Test",
	"Bbbb|bbbb|Test",
	"New Abbey|Ceredigion|United Kingdom",
	"New Albany|Indiana|United States",
	"New Albany|Kansas|United States",
	"New Albany|Mississippi|United States",
	"New Albany|Ohio|United States",
	"Zzzz|zzzz|Test"
	].sort((a,b) => a < b);
const stringToFind = "Zzzz|zzzz|Test";
let lowestIndex = 0;
let highestIndex = listOfStrings.size()-1;
let middleIndex = 0;

const compareTo = (a: string, b: string): 0 | 1 | -1 => {
	return a === b ? 0 : a < b ? -1 : 1;
}

while(lowestIndex<=highestIndex){
	middleIndex = math.floor((lowestIndex+highestIndex)/2);

	if(compareTo(stringToFind, listOfStrings[middleIndex]) > 0){
		lowestIndex = middleIndex+1;
	}else if(compareTo(stringToFind, listOfStrings[middleIndex]) < 0){
		highestIndex = middleIndex - 1;
	}else{
		break;
	}
	task.wait();
}//end of while
if(lowestIndex > highestIndex){
	print("not found");
}else{
	print("found at " + middleIndex, listOfStrings[middleIndex]);
}

// const FakeData: number[] = [1,1,1,1,1,2,4,5,5,5,5,6,7,9,3,8,10,12,11,5,34,25];
// for (let i = 0; i < 1000; i++) {
// 	FakeData.push((i));
// }
// FakeData.sort((a,b) => a < b);
// print(FakeData);

const LazyLoader = new LazyLoaderScroller<string>(
	(Start, End) => {
		const v = ArraySlice(FakeData, Start, End);
		// print(v);
		return v;
	},
	(index, content, servant) => {
		const [t] = servant.Keep(new Instance("TextLabel"));
		content.UseAbsolutePositionAndSizeOf(t);
		// content.SearchKeywords = [tostring(index)];
		t.LayoutOrder = index;
		t.Text = tostring(content.Value);
		t.Visible = true;
		content.usePropertyEffect(() => {
			t.Visible = content.IsVisibleFromSearch;
			print(index, content.IsVisibleFromSearch)
			if (content.IsVisibleFromSearch) {
				print(index, content.IsVisibleFromSearch)
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

// LazyLoader.ProcessExternalSearchRequest = (query) => {
// 	print(query);
// 	if (query.size() < 3) {
// 		return false;
// 	}
// 	return true;
// };

// LazyLoader.usePropertyEffect(() => {
// 	if (LazyLoader.ScrollerAtYAxisEnd) {
// 		if (!LazyLoader.IsFinished) {
// 			LazyLoader.LoadAsync(50);
// 		} else {
// 			print(LazyLoader._dev);
// 			LazyLoader.Destroy();
// 			print(LazyLoader._dev);
// 		}
// 	}
// }, ["ScrollerAtYAxisEnd"]);

// LazyLoader.BinarySearchBehaviorProcessEntry = (x) => {
// 	return x as string;
// }
// LazyLoader.UseScrollingFrameProps(ScrollingFrame);
// // LazyLoader.LoadAsync(1);
LazyLoader.Parent = game.Workspace;
// UI.Parent = game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui");
