interface proxy {
	[key: string]: unknown;
	Value: unknown;
	default: unknown;
}

const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface IFormatMethods {
	/**
	 * @chainable
	 */
	fromUnixStamp: (this: typeof FormatMethods, is12Hour?: boolean) => IFormatMethods;

	/**
	 * Requires to be converted `fromUnixStamp` first
	 *
	 * Ends the chain
	 */
	toTimeFormat: (this: typeof FormatMethods) => unknown;

	/**
	 * Requires to be converted `fromUnixStamp` first
	 *
	 * Warning: Will `End()` the chain
	 */
	toDateFormat: (
		this: typeof FormatMethods,
		useString?: boolean,
		shortenStrings?: boolean | number,
		indicateDayAsNumber?: boolean,
	) => string;

	/**
	 * Converts `1000` => `1,000`, `1000000000` => `1,000,000,000` etc.
	 *
	 * @chainable
	 */
	toNumberCommas: (this: typeof FormatMethods) => IFormatMethods;

	/**
	 * Converts `1000` => `1k`, `1000000000` => `1M` etc.
	 *
	 * @chainable
	 */
	toNumberAbbreviation: (this: typeof FormatMethods, ...ignores: string[]) => IFormatMethods;

	/**
	 * Converts strings into objects
	 *
	 * e.g
	 * ```ts
	 *	format("Vector3.new(0,1,0)").fromStrToObj() => Vector3
	 *	format("Instance.new('Part')").fromStrToObj() => Part Instance
	 * ```
	 */
	fromStrToObj: (this: typeof FormatMethods) => unknown;

	/**
	 * Ends the chain and returns the actual value instead of the metatable.
	 */
	End: (this: typeof FormatMethods) => unknown;
}

type IStringToObjectHandler = (x: string) => unknown;

const _fromStrToObjectHandlers: IStringToObjectHandler[] = [
	//Vector3
	(x) => {
		const vecs = x.match("Vector3%.new%((.+),(.+),(.+)%)");
		const v1 = tonumber(vecs[0]);
		const v2 = tonumber(vecs[1]);
		const v3 = tonumber(vecs[2]);
		print(v1 !== undefined, v1, v2, v3);
		if (v1 !== undefined && v2 !== undefined && v3 !== undefined) {
			print("NICE!");
			return new Vector3(v1, v2, v3);
		}
	},
	//Vector2
	(x) => {
		const vecs = x.match("Vector2%.new%((.+),(.+)%)");
		const v1 = tonumber(vecs[0]);
		const v2 = tonumber(vecs[1]);
		if (v1 !== undefined && v2 !== undefined) {
			return new Vector2(v1, v2);
		}
	},
	//Instance
	(x) => {
		const ins = x.match("Instance%.new%((.+),*(.*)%)");
		const instanceStr = ins[0];
		// const parent = ins[1]; can't parent to string lol.
		if (instanceStr !== undefined) {
			return new Instance(instanceStr as keyof CreatableInstances);
		}
	},
	//number
	(x) => {
		const tn = tonumber(x);
		return tn;
	},
];

const FormatMethods: IFormatMethods = {
	fromUnixStamp(is12Hour?: boolean) {
		const _self = this as unknown as proxy;
		const timeStamp = _self.default;
		if (typeIs(timeStamp, "number")) {
			const date = os.date("*t", timeStamp);
			if (is12Hour) {
				date.hour = math.floor(date.hour % 12);
			}
			_self._fromUnixStamp = date;
			_self.Value = date;
			return this;
		} else {
			throw `Time stamp was expected to be a number, got ${typeOf(timeStamp)}`;
		}
	},

	toTimeFormat() {
		const _self = this as unknown as proxy;

		assert(_self._fromUnixStamp, "Requires need to call `fromUnixStamp` first before using `toTimeFormat`");
		const Stamp = _self._fromUnixStamp as Required<DateTable>;

		_self.Value = string.format("%02d:%02d:%02d", Stamp.hour, Stamp.min, Stamp.sec);
		return this.End();
	},

	toDateFormat(useString?: boolean, shortenStrings?: boolean | number, indicateDayAsNumber?: boolean) {
		if (shortenStrings === true) {
			shortenStrings = 3;
		}
		if (!useString && shortenStrings) {
			shortenStrings = undefined;
			warn("useString boolean must be tru to shorten strings.");
		}
		const _self = this as unknown as proxy;
		assert(_self._fromUnixStamp, "Requires need to call `fromUnixStamp` first before using `toDateFormat`");

		const Stamp = _self._fromUnixStamp as Required<DateTable>;
		const year_ = Stamp.year;
		const day_ = Stamp.day;
		let overrideday;
		let wday_: number | string = Stamp.wday;
		let month_: number | string = Stamp.month;

		if (useString) {
			if (typeIs(shortenStrings, "number")) {
				wday_ = string.sub(weekdays[wday_], 1, shortenStrings);
				month_ = string.sub(months[month_], 1, shortenStrings);
			} else {
				wday_ = weekdays[wday_];
				month_ = weekdays[month_];
			}
		}
		if (indicateDayAsNumber) {
			overrideday = "31st";
		}

		return (
			(useString && string.format("%s, %s %s", month_, (overrideday && overrideday) || wday_, year_)) ||
			string.format("%s/%s/%s", month_, wday_, year_)
		);
	},

	toNumberCommas() {
		const _self = this as unknown as proxy;
		const str = tostring(_self.Value);
		const v = str
			.reverse()
			.gsub("...", "%0,", math.floor((str.size() - 1) / 3))[0]
			.reverse();
		_self.Value = v;
		return this;
	},

	toNumberAbbreviation(...ignores: string[]) {
		const _self = this as unknown as proxy;
		const abvs = ["K", "M", "B", "T", "QA", "QI", "SX", "SP", "OC"];
		if (typeIs(_self.Value, "number")) {
			const s = tostring(math.floor(_self.Value));
			let res = "0";
			if (s.size() < 4) {
				res = tostring(_self.Value);
			} else {
				const val = string.sub(s, 1, ((s.size() - 1) % 3) + 1);
				const abvVal = math.floor((s.size() - 1) / 3) - 1;
				const abv = (abvs[abvVal] !== undefined && abvs[abvVal]) || "?";
				if (ignores.find((e) => e === abv) !== undefined) {
					res = tostring(_self.Value);
				} else {
					res = tostring(val) + abv;
				}
				_self.Value = res;
			}
		} else {
			throw `Value is expected to be a number, got ${typeOf(_self.Value)}`;
		}
		return this;
	},

	fromStrToObj() {
		const _self = this as unknown as proxy;
		if (typeIs(_self.Value, "string")) {
			for (let i = 0; i < _fromStrToObjectHandlers.size(); i++) {
				const res = _fromStrToObjectHandlers[i](_self.Value);
				if (res !== undefined) {
					return res;
				}
			}
		} else {
			throw `Value expected to be a string, got ${typeOf(_self.Value)}`;
		}
		warn(`Could not resolve object from string for "${_self.Value}"`);
	},

	End() {
		const _self = this as unknown as proxy;
		const val = _self.Value;
		setmetatable(this, {});
		return val;
	},
};

function format(...args: unknown[]) {
	const t = {};

	const proxy: proxy = {
		Value: args[0],
		Values: args,
		default: args[0],
	};

	return setmetatable(t, {
		__newindex: (_, k: unknown, v: unknown) => {
			proxy[k as string] = v;
		},
		__tostring: () => {
			return tostring(proxy.Value);
		},
		__index: (_, k) => {
			const methods = FormatMethods as unknown as Map<string, () => void>;
			if (typeIs(k, "string")) {
				const tmethod = methods.get(k);
				if (tmethod) {
					return tmethod;
				} else {
					return proxy[k];
				}
			}
			throw `	Expected string, got ${typeOf(k)}`;
		},
	}) as IFormatMethods;
}

/**
 * Resolve the url string
 * @example
 * ```ts
 * host: "roblox.com",
 * subdomain: "catalog",
 * path: ["some","path"]
 * params: {some: "params"}
 * ```
 */
export function toUrl(args: {
	/**
	 * @example
	 * host: "roblox.com",
	 */
	host: string;
	/**
	 * @example
	 * subdomain: "catalog",
	 */
	subdomain?: string | string[];
	/**
	 * @example
	 * path: ["some", "path"]
	 */
	path?: string | string[];
	/**
	 * @example
	 * params: {some: "params"}
	 */
	params?: Record<string, unknown>;
	/**
	 * Defaults to `https`
	 */
	protocol?: "http" | "https";
}): string {
	args.protocol = args.protocol ?? "https";
	let url = args.host;
	if (args.subdomain !== undefined) {
		if (typeIs(args.subdomain, "table")) {
			url = args.subdomain.join(".") + "." + url;
		} else {
			url = args.subdomain + "." + url;
		}
	} else {
		url = "www." + url;
	}
	if (args.path !== undefined) {
		url += "/";
		if (typeIs(args.path, "table")) {
			url += args.path.join("/");
		} else {
			url += args.path;
		}
	}
	if (args.params !== undefined) {
		const p: string[] = [];
		for (const [k, v] of pairs(args.params)) {
			p.push(`${tostring(k)}=${tostring(v)}`);
		}
		url = url + "?" + p.join("&");
	}
	return args.protocol + "://" + url;
}

export { format };
export default format;
