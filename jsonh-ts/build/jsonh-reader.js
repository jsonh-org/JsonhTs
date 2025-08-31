"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonhReader = void 0;
const jsonh_reader_options_js_1 = require("./jsonh-reader-options.js");
/**
 * A reader that reads JSONH tokens from a string.
 */
class JsonhReader {
    /**
     * The string to read characters from.
     */
    #string;
    /**
     * The string to read characters from.
     */
    get string() {
        return this.#string;
    }
    /**
     * The index in the string to read characters from.
     */
    #index;
    /**
     * The index in the string to read characters from.
     */
    get index() {
        return this.#index;
    }
    /**
     * The options to use when reading JSONH.
     */
    #options;
    /**
     * The options to use when reading JSONH.
     */
    get options() {
        return this.#options;
    }
    /**
     * The number of characters read from {@link string}.
     */
    #charCounter;
    /**
     * The number of characters read from {@link string}.
     */
    get charCounter() {
        return this.#charCounter;
    }
    /**
     * Constructs a reader that reads JSONH from a string.
     */
    constructor(string, options = new jsonh_reader_options_js_1.JsonhReaderOptions()) {
        this.#string = string;
        this.#index = 0;
        this.#options = options;
        this.#charCounter = 0;
    }
    #peek() {
        if (this.index >= this.string.length) {
            return null;
        }
        return this.string.charAt(this.index);
    }
    #read() {
        if (this.index + 1 >= this.string.length) {
            return null;
        }
        this.#index++;
        return this.string.charAt(this.index);
    }
    #readOne(option) {
        if (this.#peek() == option) {
            return true;
        }
        return false;
    }
    #readAny(...options) {
        // Peek char
        let next = this.#peek();
        if (next === null) {
            return null;
        }
        // Match option
        if (!options.includes(next)) {
            return null;
        }
        // Option matched
        this.#read();
        return next;
    }
}
exports.JsonhReader = JsonhReader;
//# sourceMappingURL=jsonh-reader.js.map