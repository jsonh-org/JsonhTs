"use strict";
const TextReader = require("./text-reader.js");
class StringTextReader {
    #string;
    #index;
    constructor(string) {
        this.#string = string;
        this.#index = 0;
    }
    read() {
        if (this.#index >= this.#string.length) {
            return null;
        }
        return this.#string.charAt(this.#index++);
    }
    peek() {
        if (this.#index >= this.#string.length) {
            return null;
        }
        return this.#string.charAt(this.#index);
    }
    done() {
        return this.#index >= this.#string.length;
    }
    readToEnd() {
        let currentIndex = this.#index;
        this.#index = this.#string.length;
        return this.#string.slice(currentIndex);
    }
}
module.exports = StringTextReader;
//# sourceMappingURL=string-text-reader.js.map