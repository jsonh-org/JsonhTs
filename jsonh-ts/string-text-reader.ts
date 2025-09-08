import TextReader = require("./text-reader.js");

class StringTextReader extends TextReader {
    #string: string;
    #index: number;

    constructor(string: string) {
        super();
        this.#string = string;
        this.#index = 0;
    }

    override read(): string | null {
        if (this.#index >= this.#string.length) {
            return null;
        }
        return this.#string.at(this.#index++)!;
    }
    override peek(): string | null {
        if (this.#index >= this.#string.length) {
            return null;
        }
        return this.#string.at(this.#index)!;
    }
    override done(): boolean {
        return this.#index >= this.#string.length;
    }
    override readToEnd(): string {
        let currentIndex: number = this.#index;
        this.#index = this.#string.length;
        return this.#string.slice(currentIndex);
    }
}

export = StringTextReader;