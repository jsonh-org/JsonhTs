import JsonTokenType = require("./json-token-type");
/**
 * A single JSONH token with a {@link JsonTokenType}.
 */
declare class JsonhToken {
    #private;
    /**
     * The type of the token.
     */
    get jsonType(): JsonTokenType;
    /**
     * The value of the token, or an empty string.
     */
    get value(): string;
    /**
     * Constructs a single JSONH token.
     */
    constructor(jsonType: JsonTokenType, value?: string);
}
export = JsonhToken;
//# sourceMappingURL=jsonh-token.d.ts.map