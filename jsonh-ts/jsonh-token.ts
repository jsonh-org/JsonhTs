import JsonTokenType = require("./json-token-type");

/**
 * A single JSONH token with a {@link JsonTokenType}.
 */
class JsonhToken {
    /**
     * The type of the token.
     */
    #jsonType: JsonTokenType;
    /**
     * The type of the token.
     */
    get jsonType(): JsonTokenType {
        return this.#jsonType;
    }
    /**
     * The value of the token, or an empty string.
     */
    #value: string;
    /**
     * The value of the token, or an empty string.
     */
    get value(): string {
        return this.#value;
    }

    /**
     * Constructs a single JSONH token.
     */
    constructor(jsonType: JsonTokenType, value: string) {
        this.#jsonType = jsonType;
        this.#value = value;
    }
}

export = JsonhToken;