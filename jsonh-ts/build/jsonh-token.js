"use strict";
const JsonTokenType = require("./json-token-type");
/**
 * A single JSONH token with a {@link JsonTokenType}.
 */
class JsonhToken {
    /**
     * The type of the token.
     */
    #jsonType;
    /**
     * The type of the token.
     */
    get jsonType() {
        return this.#jsonType;
    }
    /**
     * The value of the token, or an empty string.
     */
    #value;
    /**
     * The value of the token, or an empty string.
     */
    get value() {
        return this.#value;
    }
    /**
     * Constructs a single JSONH token.
     */
    constructor(jsonType, value = "") {
        this.#jsonType = jsonType;
        this.#value = value;
    }
}
module.exports = JsonhToken;
//# sourceMappingURL=jsonh-token.js.map