import TextReader = require("./text-reader.js");
/**
 * A text reader that reads UTF-16 characters from a string incrementally.
 */
declare class StringTextReader extends TextReader {
    #private;
    /**
     * Constructs a text reader that reads characters from a string.
     */
    constructor(string: string);
    /**
     * @inheritdoc
     */
    read(): string | null;
    /**
     * @inheritdoc
     */
    peek(): string | null;
    /**
     * @inheritdoc
     */
    done(): boolean;
    /**
     * @inheritdoc
     */
    readToEnd(): string;
}
export = StringTextReader;
//# sourceMappingURL=string-text-reader.d.ts.map