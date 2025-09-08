import TextReader = require("./text-reader.js");

class StringTextReader implements TextReader {
    #string: string;
    #index: number;

    constructor(string: string) {
        this.#string = string;
        this.#index = 0;
    }

    read(): string | null {
        if (this.#index >= this.#string.length) {
            return null;
        }
        return this.#string.at(this.#index++)!;
    }
    peek(): string | null {
        if (this.#index >= this.#string.length) {
            return null;
        }
        return this.#string.at(this.#index)!;
    }
    done(): boolean {
        return this.#index >= this.#string.length;
    }
    readToEnd(): string {
        let currentIndex: number = this.#index;
        this.#index = this.#string.length;
        return this.#string.slice(currentIndex);
    }
}

export = StringTextReader;