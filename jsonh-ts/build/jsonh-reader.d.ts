import { JsonhReaderOptions } from "./jsonh-reader-options";
/**
 * A reader that reads JSONH tokens from a string.
 */
declare class JsonhReader {
    #private;
    /**
     * The string to read characters from.
     */
    get string(): string;
    /**
     * The index in the string to read characters from.
     */
    get index(): number;
    /**
     * The options to use when reading JSONH.
     */
    get options(): JsonhReaderOptions;
    /**
     * The number of characters read from {@link string}.
     */
    get charCounter(): number;
    /**
     * Constructs a reader that reads JSONH from a string.
     */
    constructor(string: string, options?: JsonhReaderOptions);
}
export { JsonhReader };
//# sourceMappingURL=jsonh-reader.d.ts.map