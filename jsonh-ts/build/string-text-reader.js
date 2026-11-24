"use strict";
const TextReader = require("./text-reader.js");
/**
 * A text reader that reads UTF-16 characters from a string incrementally.
 */
class StringTextReader extends TextReader {
    #string;
    #index;
    /**
     * Constructs a text reader that reads characters from a string.
     */
    constructor(string) {
        super();
        this.#string = string;
        this.#index = 0;
    }
    /**
     * @inheritdoc
     */
    read() {
        if (this.#index >= this.#string.length) {
            return null;
        }
        return this.#string.at(this.#index++);
    }
    /**
     * @inheritdoc
     */
    peek() {
        if (this.#index >= this.#string.length) {
            return null;
        }
        return this.#string.at(this.#index);
    }
    /**
     * @inheritdoc
     */
    done() {
        return this.#index >= this.#string.length;
    }
    /**
     * @inheritdoc
     */
    readToEnd() {
        let currentIndex = this.#index;
        this.#index = this.#string.length;
        return this.#string.slice(currentIndex);
    }
}
module.exports = StringTextReader;
//# sourceMappingURL=string-text-reader.js.map