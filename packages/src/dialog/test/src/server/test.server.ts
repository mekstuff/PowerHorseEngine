new Promise<string>((re) => {
	re(
		new Promise<string>((resolve) => {
			task.wait(1);
			print("___");
			resolve("here");
		}),
	);
}).finally((...args) => {
	print(...args);
});
