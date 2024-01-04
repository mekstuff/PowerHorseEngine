const USE_ATTR_IDENTIFIER = "$>-->useAttr=true<--<$";

export type TokenEventerEventType = "$initialize" | "$secure-imit" | "$destroy" | "$send";
export type ClientTokenImitEventType = "$set" | "$disconnect";

// export type TokenEventerArgs<et extends TokenEventerEventType> =

/**
 * Returns the name and if token id is a wild card. e.g `hello` => "hello", false | `hello/*` => "hello", true
 */
const FormatTokenId = (TokenId: string): { TokenName: string; TokenIsWildCard: boolean; TokenValue: string } => {
	const s = TokenId.split("/");
	let name: string = TokenId;
	let isWildCard = false;
	let wildCardValue: string | undefined;
	if (s.size() === 2) {
		name = s[0];
		isWildCard = true;
		wildCardValue = s[1];
	}
	return {
		TokenName: name,
		TokenIsWildCard: isWildCard,
		TokenValue: isWildCard ? wildCardValue ?? name : name,
	};
};

export { USE_ATTR_IDENTIFIER, FormatTokenId };
