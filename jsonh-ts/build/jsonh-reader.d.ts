import JsonhReaderOptions = require("./jsonh-reader-options.js");
import TextReader = require("./text-reader.js");
import JsonhToken = require("./jsonh-token.js");
import Result = require("./result.js");
/**
 * A reader that reads JSONH tokens from a string.
 */
declare class JsonhReader {
    #private;
    /**
     * The text reader to read characters from.
     */
    get textReader(): TextReader;
    /**
     * The options to use when reading JSONH.
     */
    get options(): JsonhReaderOptions;
    /**
     * The number of characters read from {@link string}.
     */
    get charCounter(): number;
    /**
     * Constructs a reader that reads JSONH from a text reader.
     */
    private constructor();
    /**
     * Constructs a reader that reads JSONH from a text reader.
     */
    static fromTextReader(textReader: TextReader, options?: JsonhReaderOptions): JsonhReader;
    /**
     * Constructs a reader that reads JSONH from a string.
     */
    static fromString(string: string, options?: JsonhReaderOptions): JsonhReader;
    /**
     * Parses a single element from a text reader.
     */
    static parseElementfromTextReader<T = unknown>(textReader: TextReader, options?: JsonhReaderOptions): Result<T>;
    /**
     * Parses a single element from a string.
     */
    static parseElementFromString<T = unknown>(string: string, options?: JsonhReaderOptions): Result<T>;
    /**
     * Parses a single element from the reader.
     */
    parseElement<T = unknown>(): Result<T>;
    /**
     * Tries to find the given property name in the reader.
     * For example, to find `c`:
     * ```
     * // Original position
     * {
     *   "a": "1",
     *   "b": {
     *     "c": "2"
     *   },
     *   "c": // Final position
     *        "3"
     *  }
     * ```
     */
    findPropertyValue(propertyName: string): boolean;
    /**
     * Reads a single element from the reader.
     */
    readElement(): Generator<Result<JsonhToken>>;
}
export = JsonhReader;
//# sourceMappingURL=jsonh-reader.d.ts.map