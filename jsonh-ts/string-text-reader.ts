import TextReader = require("./text-reader.js");

/**
 * A text reader that reads UTF-16 characters from a string incrementally.
 */
class StringTextReader extends TextReader {
    #string: string;
    #index: number;

    /**
     * Constructs a text reader that reads characters from a string.
     */
    constructor(string: string) {
        super();
        this.#string = string;
        this.#index = 0;
    }

    /**
     * @inheritdoc
     */
    override read(): string | null {
        if (this.#index >= this.#string.length) {
            return null;
        }
        return this.#string.at(this.#index++)!;
    }
    /**
     * @inheritdoc
     */
    override peek(): string | null {
        if (this.#index >= this.#string.length) {
            return null;
        }
        return this.#string.at(this.#index)!;
    }
    /**
     * @inheritdoc
     */
    override done(): boolean {
        return this.#index >= this.#string.length;
    }
    /**
     * @inheritdoc
     */
    override readToEnd(): string {
        let currentIndex: number = this.#index;
        this.#index = this.#string.length;
        return this.#string.slice(currentIndex);
    }
}

export = StringTextReader;