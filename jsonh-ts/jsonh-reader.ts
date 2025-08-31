import { JsonhReaderOptions } from "./jsonh-reader-options.js";

/**
 * A reader that reads JSONH tokens from a string.
 */
class JsonhReader {
    /**
     * The string to read characters from.
     */
    #string: string;
    /**
     * The string to read characters from.
     */
    get string(): string {
        return this.#string;
    }
    /**
     * The index in the string to read characters from.
     */
    #index: number;
    /**
     * The index in the string to read characters from.
     */
    get index(): number {
        return this.#index;
    }
    /**
     * The options to use when reading JSONH.
     */
    #options: JsonhReaderOptions;
    /**
     * The options to use when reading JSONH.
     */
    get options(): JsonhReaderOptions {
        return this.#options;
    }
    /**
     * The number of characters read from {@link string}.
     */
    #charCounter: number;
    /**
     * The number of characters read from {@link string}.
     */
    get charCounter(): number {
        return this.#charCounter;
    }

    /**
     * Constructs a reader that reads JSONH from a string.
     */
    constructor(string: string, options: JsonhReaderOptions = new JsonhReaderOptions()) {
        this.#string = string;
        this.#index = 0;
        this.#options = options;
        this.#charCounter = 0;
    }

    #peek(): string | null {
        if (this.index >= this.string.length) {
            return null;
        }
        return this.string.charAt(this.index);
    }
    #read(): string | null {
        if (this.index + 1 >= this.string.length) {
            return null;
        }
        this.#index++;
        return this.string.charAt(this.index);
    }
    #readOne(option: string): boolean {
        if (this.#peek() == option) {
            return true;
        }
        return false;
    }
    #readAny(...options: ReadonlyArray<string>): string | null {
        // Peek char
        let next: string | null = this.#peek();
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

export { JsonhReader };