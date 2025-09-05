declare abstract class TextReader {
    /**
     * Returns the next character and increments the position, or returns null.
     */
    abstract read(): string | null;
    /**
     * Returns the next character, or returns null.
     */
    abstract peek(): string | null;
    /**
     * Returns whether the text reader is finished reading characters.
     */
    abstract done(): boolean;
    /**
     * Returns all of the remaining characters.
     */
    readToEnd(): string;
}
export = TextReader;
//# sourceMappingURL=text-reader.d.ts.map