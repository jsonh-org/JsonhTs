"use strict";
const TextReader = require("./text-reader.js");
class StringTextReader extends TextReader {
    #string;
    #index;
    constructor(string) {
        super();
        this.#string = string;
        this.#index = 0;
    }
    read() {
        if (this.#index >= this.#string.length) {
            return null;
        }
        return this.#string.at(this.#index++);
    }
    peek() {
        if (this.#index >= this.#string.length) {
            return null;
        }
        return this.#string.at(this.#index);
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