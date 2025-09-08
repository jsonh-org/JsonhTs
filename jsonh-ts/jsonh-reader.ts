import JsonhReaderOptions = require("./jsonh-reader-options.js");
import TextReader = require("./text-reader.js");
import StringTextReader = require("./string-text-reader.js");
import JsonhToken = require("./jsonh-token.js");
import JsonTokenType = require("./json-token-type.js");

/**
 * A reader that reads JSONH tokens from a string.
 */
class JsonhReader {
    /**
     * The text reader to read characters from.
     */
    #textReader: TextReader;
    /**
     * The text reader to read characters from.
     */
    get textReader(): TextReader {
        return this.#textReader;
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
     * Characters that cannot be used unescaped in quoteless strings.
     */
    static readonly #reservedChars: ReadonlyArray<string> = ['\\', ',', ':', '[', ']', '{', '}', '/', '#', '"', '\''];
    /**
     * Characters that are considered newlines.
     */
    static readonly #newlineChars: ReadonlyArray<string> = ['\n', '\r', '\u2028', '\u2029'];
    /**
     * Characters that are considered whitespace.
     */
    static readonly #whitespaceChars: ReadonlyArray<string> = [
        '\u0020', '\u00A0', '\u1680', '\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005',
        '\u2006', '\u2007', '\u2008', '\u2009', '\u200A', '\u202F', '\u205F', '\u3000', '\u2028',
        '\u2029', '\u0009', '\u000A', '\u000B', '\u000C', '\u000D', '\u0085',
    ];

    /**
     * Constructs a reader that reads JSONH from a text reader.
     */
    constructor(textReader: TextReader, options: JsonhReaderOptions = new JsonhReaderOptions()) {
        this.#textReader = textReader;
        this.#options = options;
        this.#charCounter = 0;
    }
    /**
     * Constructs a reader that reads JSONH from a string.
     */
    static fromString(string: string, options: JsonhReaderOptions = new JsonhReaderOptions()): JsonhReader {
        return new JsonhReader(new StringTextReader(string), options);
    }

    /**
     * Parses a single element from a text reader.
     */
    static parseElementfromTextReader<T = unknown>(textReader: TextReader): T | Error {
        return new JsonhReader(textReader).parseElement<T>();
    }
    /**
     * Parses a single element from a string.
     */
    static parseElementFromString<T = unknown>(string: string): T | Error {
        return this.fromString(string).parseElement<T>();
    }

    /**
     * Parses a single element from the reader.
     */
    parseElement<T = unknown>(): T | Error {
        let currentNodes: unknown[] = [];
        let currentPropertyName: string | null = null;

        let submitNode = function(node: unknown): boolean {
            // Root value
            if (currentNodes.length === 0) {
                return true;
            }
            // Array item
            if (currentPropertyName === null) {
                (currentNodes.at(-1) as any[]).push(node);
                return false;
            }
            // Object property
            else {
                (currentNodes.at(-1) as any)[currentPropertyName] = node;
                currentPropertyName = null;
                return false;
            }
        };
        let startNode = function(node: unknown): void {
            submitNode(node);
            currentNodes.push(node);
        };

        for (let tokenResult of this.readElement()) {
            // Check error
            if (tokenResult instanceof Error) {
                return tokenResult;
            }

            switch (tokenResult.jsonType) {
                // Null
                case JsonTokenType.Null: {
                    let node: null = null;
                    if (submitNode(node)) {
                        return node as T;
                    }
                    break;
                }
                // True
                case JsonTokenType.True: {
                    let node: boolean = true;
                    if (submitNode(node)) {
                        return node as T;
                    }
                    break;
                }
                // False
                case JsonTokenType.False: {
                    let node: boolean = false;
                    if (submitNode(node)) {
                        return node as T;
                    }
                    break;
                }
                // String
                case JsonTokenType.String: {
                    let node: string = tokenResult.value;
                    if (submitNode(node)) {
                        return node as T;
                    }
                    break;
                }
                // Number
                case JsonTokenType.Number: {
                    // TODO
                    let node: number = 1337;
                    //let node: number = tokenResult.value;
                    if (submitNode(node)) {
                        return node as T;
                    }
                    break;
                }
                // Start Object
                case JsonTokenType.StartObject: {
                    let node: object = {};
                    startNode(node);
                    break;
                }
                // Start Array
                case JsonTokenType.StartArray: {
                    let node: any[] = [];
                    startNode(node);
                    break;
                }
                // End Object/Array
                case JsonTokenType.EndObject:
                case JsonTokenType.EndArray: {
                    // Nested node
                    if (currentNodes.length > 1) {
                        currentNodes.pop();
                    }
                    // Root node
                    else {
                        return currentNodes.at(-1) as T;
                    }
                    break;
                }
                // Property Name
                case JsonTokenType.PropertyName: {
                    currentPropertyName = tokenResult.value;
                    break;
                }
                // Comment
                case JsonTokenType.Comment: {
                    break;
                }
                // Not Implemented
                default: {
                    return new Error("Token type not implemented");
                }
            }
        }
        
        // End of input
        return new Error("Expected token, got end of input");
    }
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
    findPropertyValue(propertyName: string): boolean {
        let currentDepth: number = 0;

        for (let tokenResult of this.readElement()) {
            // Check error
            if (tokenResult instanceof Error) {
                return false;
            }

            switch (tokenResult.jsonType) {
                // Start structure
                case JsonTokenType.StartObject:
                case JsonTokenType.StartArray: {
                    currentDepth++;
                    break;
                }
                // End structure
                case JsonTokenType.EndObject:
                case JsonTokenType.EndArray: {
                    currentDepth--;
                    break;
                }
                // Property name
                case JsonTokenType.PropertyName: {
                    if (currentDepth === 1 && tokenResult.value === propertyName) {
                        // Path found
                        return true;
                    }
                    break;
                }
            }
        }

        // Path not found
        return false;
    }
    /**
     * Reads a single element from the reader.
     */
    *readElement(): Generator<JsonhToken | Error> {
        // Comments & whitespace
        for (let token of this.#readCommentsAndWhitespace()) {
            if (token instanceof Error) {
                yield token;
                return;
            }
            yield token;
        }

        // Peek result
        let next: string | null = this.#peek();
        if (next === null) {
            yield new Error("Expected token, got end of input");
            return;
        }

        // Object
        if (next === '{') {
            for (let token of this.#readObject()) {
                if (token instanceof Error) {
                    yield token;
                    return;
                }
                yield token;
            }
        }
        // Array
        else if (next === '[') {
            for (let token of this.#readArray()) {
                if (token instanceof Error) {
                    yield token;
                    return;
                }
                yield token;
            }
        }
        // Primitive value (null, true, false, string, number)
        else {
            let token: JsonhToken | Error = this.#readPrimitiveElement();
            if (token instanceof Error) {
                yield token;
                return;
            }

            // Detect braceless object from property name
            if (token.jsonType === JsonTokenType.String) {
                // Try read property name
                let propertyNameTokens: JsonhToken[] = [];
                for (let propertyNameToken of this.#readPropertyName(token.value)) {
                    // Possible braceless object
                    if (!(propertyNameToken instanceof Error)) {
                        propertyNameTokens.push(propertyNameToken);
                    }
                    // Primitive value (error reading property name)
                    else {
                        yield token;
                        for (let nonPropertyNameToken of propertyNameTokens) {
                            yield nonPropertyNameToken;
                        }
                        return;
                    }
                }
                // Braceless object
                for (let objectToken of this.#readBracelessObject(propertyNameTokens)) {
                    if (objectToken instanceof Error) {
                        yield objectToken;
                        return;
                    }
                    yield objectToken;
                }
            }
            // Primitive value
            else {
                yield token;
            }
        }
    }

    *#readObject(): Generator<JsonhToken | Error> {
        // Opening brace
        if (!this.#readOne('{')) {
            // Braceless object
            for (let token of this.#readBracelessObject()) {
                if (token instanceof Error) {
                    yield token;
                    return;
                }
                yield token;
            }
            return;
        }
        // Start object
        yield new JsonhToken(JsonTokenType.StartObject);

        while (true) {
            // Comments & whitespace
            for (let token of this.#readCommentsAndWhitespace()) {
                if (token instanceof Error) {
                    yield token;
                    return;
                }
                yield token;
            }

            let next: string | null = this.#peek();
            if (next === null) {
                // End of incomplete object
                if (this.#options.incompleteInputs) {
                    yield new JsonhToken(JsonTokenType.EndObject);
                    return;
                }
                // Missing closing brace
                yield new Error("Expected `}` to end object, got end of input");
                return;
            }

            // Closing brace
            if (next === '}') {
                // End of object
                this.#read();
                yield new JsonhToken(JsonTokenType.EndObject);
                return;
            }
            // Property
            else {
                for (let token of this.#readProperty()) {
                    if (token instanceof Error) {
                        yield token;
                        return;
                    }
                    yield token;
                }
            }
        }
    }
    *#readBracelessObject(propertyNameTokens: Iterable<JsonhToken> | null = null): Generator<JsonhToken | Error> {
        throw new Error("TODO" + propertyNameTokens);
    }
    *#readProperty(propertyNameTokens: Iterable<JsonhToken> | null = null): Generator<JsonhToken | Error> {
        // Property name
        if (propertyNameTokens !== null) {
            for (let token of propertyNameTokens) {
                yield token;
            }
        }
        else {
            for (let token of this.#readPropertyName()) {
                if (token instanceof Error) {
                    yield token;
                    return;
                }
                yield token;
            }
        }

        // Comments & whitespace
        for (let token of this.#readCommentsAndWhitespace()) {
            if (token instanceof Error) {
                yield token;
                return;
            }
            yield token;
        }

        // Property value
        for (let token of this.readElement()) {
            if (token instanceof Error) {
                yield token;
                return;
            }
            yield token;
        }

        // Comments & whitespace
        for (let token of this.#readCommentsAndWhitespace()) {
            if (token instanceof Error) {
                yield token;
                return;
            }
            yield token;
        }

        // Optional comma
        this.#readOne(',');
    }
    *#readPropertyName(string: string | null = null): Generator<JsonhToken | Error> {
        // String
        if (string === null) {
            let stringToken: JsonhToken | Error = this.#readString();
            if (stringToken instanceof Error) {
                yield stringToken;
                return;
            }
            string = stringToken.value;
        }

        // Comments & whitespace
        for (let token of this.#readCommentsAndWhitespace()) {
            if (token instanceof Error) {
                yield token;
                return;
            }
            yield token;
        }

        // Colon
        if (!this.#readOne(':')) {
            yield new Error("Expected `:` after property name in object");
            return;
        }

        // End of property name
        yield new JsonhToken(JsonTokenType.PropertyName, string);
    }
    *#readArray(): Generator<JsonhToken | Error> {
        // Opening bracket
        if (!this.#readOne('[')) {
            yield new Error("Expected `[` to start array");
            return;
        }
        // Start of array
        yield new JsonhToken(JsonTokenType.StartArray);

        while (true) {
            // Comments & whitespace
            for (let token of this.#readCommentsAndWhitespace()) {
                if (token instanceof Error) {
                    yield token;
                    return;
                }
                yield token;
            }

            let next: string | null = this.#peek();
            if (next === null) {
                // End of incomplete array
                if (this.#options.incompleteInputs) {
                    yield new JsonhToken(JsonTokenType.EndArray);
                    return;
                }
                // Missing closing bracket
                yield new Error("Expected `]` to end array, got end of input");
                return;
            }

            // Closing bracket
            if (next === ']') {
                // End of array
                this.#read();
                yield new JsonhToken(JsonTokenType.EndArray);
                return;
            }
            // Item
            else {
                for (let token of this.#readItem()) {
                    if (token instanceof Error) {
                        yield token;
                        return;
                    }
                    yield token;
                }
            }
        }
    }
    *#readItem(): Generator<JsonhToken | Error> {
        // Element
        for (let token of this.readElement()) {
            if (token instanceof Error) {
                yield token;
                return;
            }
            yield token;
        }

        // Comments & whitespace
        for (let token of this.#readCommentsAndWhitespace()) {
            if (token instanceof Error) {
                yield token;
                return;
            }
            yield token;
        }

        // Optional comma
        this.#readOne(',');
    }
    #readString(): JsonhToken | Error {
        // Start quote
        let startQuote: string | null = this.#readAny('"', '\'');
        if (startQuote === null) {
            return this.#readQuotelessString();
        }

        // Count multiple start quotes
        let startQuoteCounter: number = 1;
        while (this.#readOne(startQuote)) {
            startQuoteCounter++;
        }

        // Empty string
        if (startQuoteCounter === 2) {
            return new JsonhToken(JsonTokenType.String, "");
        }

        // Count multiple end quotes
        let endQuoteCounter: number = 0;

        // Read string
        let stringBuilder = "";

        while (true) {
            let next: string | null = this.#read();
            if (next === null) {
                return new Error("Expected end of string, got end of input");
            }

            // Partial end quote was actually part of string
            if (next !== startQuote) {
                stringBuilder += startQuote.repeat(endQuoteCounter);
                endQuoteCounter = 0;
            }

            // End quote
            if (next === startQuote) {
                endQuoteCounter++;
                if (endQuoteCounter === startQuoteCounter) {
                    break;
                }
            }
            // Escape sequence
            else if (next === '\\') {
                let escapeSequenceResult: string | Error = this.#readEscapeSequence();
                if (escapeSequenceResult instanceof Error) {
                    return escapeSequenceResult;
                }
                stringBuilder += escapeSequenceResult;
            }
            // Literal character
            else {
                stringBuilder += next;
            }
        }

        // Condition: skip remaining steps unless started with multiple quotes
        if (startQuoteCounter > 1) {
            // Pass 1: count leading whitespace -> newline
            let hasLeadingWhitespaceNewline: boolean = false;
            let leadingWhitespaceNewlineCounter: number = 0;
            for (let index: number = 0; index < stringBuilder.length; index++) {
                let next: string = stringBuilder.at(index)!;

                // Newline
                if (JsonhReader.#newlineChars.includes(next)) {
                    // Join CR LF
                    if (next === '\r' && index + 1 < stringBuilder.length && stringBuilder[index + 1] === '\n') {
                        index++;
                    }

                    hasLeadingWhitespaceNewline = true;
                    leadingWhitespaceNewlineCounter = index + 1;
                    break;
                }
                // Non-whitespace
                else if (!JsonhReader.#whitespaceChars.includes(next)) {
                    break;
                }
            }

            // Condition: skip remaining steps if pass 1 failed
            if (hasLeadingWhitespaceNewline) {
                // Pass 2: count trailing newline -> whitespace
                let hasTrailingNewlineWhitespace: boolean = false;
                let lastNewlineIndex: number = 0;
                let trailingWhitespaceCounter: number = 0;
                for (let index: number = 0; index < stringBuilder.length; index++) {
                    let next: string = stringBuilder.at(index)!;

                    // Newline
                    if (JsonhReader.#newlineChars.includes(next)) {
                        hasTrailingNewlineWhitespace = true;
                        lastNewlineIndex = index;
                        trailingWhitespaceCounter = 0;

                        // Join CR LF
                        if (next === '\r' && index + 1 < stringBuilder.length && stringBuilder[index + 1] === '\n') {
                            index++;
                        }
                    }
                    // Whitespace
                    else if (JsonhReader.#whitespaceChars.includes(next)) {
                        trailingWhitespaceCounter++;
                    }
                    // Non-whitespace
                    else {
                        hasTrailingNewlineWhitespace = false;
                        trailingWhitespaceCounter = 0;
                    }
                }

                // Condition: skip remaining steps if pass 2 failed
                if (hasTrailingNewlineWhitespace) {
                    // Pass 3: strip trailing newline -> whitespace
                    stringBuilder = JsonhReader.#removeRange(stringBuilder, lastNewlineIndex, stringBuilder.length - lastNewlineIndex);

                    // Pass 4: strip leading whitespace -> newline
                    stringBuilder = JsonhReader.#removeRange(stringBuilder, 0, leadingWhitespaceNewlineCounter);

                    // Condition: skip remaining steps if no trailing whitespace
                    if (trailingWhitespaceCounter > 0) {
                        // Pass 5: strip line-leading whitespace
                        let isLineLeadingWhitespace: boolean = true;
                        let lineLeadingWhitespaceCounter: number = 0;
                        for (let index: number = 0; index < stringBuilder.length; index++) {
                            let next: string = stringBuilder.at(index)!;

                            // Newline
                            if (JsonhReader.#newlineChars.includes(next)) {
                                isLineLeadingWhitespace = true;
                                lineLeadingWhitespaceCounter = 0;
                            }
                            // Whitespace
                            else if (JsonhReader.#whitespaceChars.includes(next)) {
                                if (isLineLeadingWhitespace) {
                                    // Increment line-leading whitespace
                                    lineLeadingWhitespaceCounter++;

                                    // Maximum line-leading whitespace reached
                                    if (lineLeadingWhitespaceCounter === trailingWhitespaceCounter) {
                                        // Remove line-leading whitespace
                                        stringBuilder = JsonhReader.#removeRange(stringBuilder, index + 1 - lineLeadingWhitespaceCounter, lineLeadingWhitespaceCounter);
                                        index -= lineLeadingWhitespaceCounter;
                                        // Exit line-leading whitespace
                                        isLineLeadingWhitespace = false;
                                    }
                                }
                            }
                            // Non-whitespace
                            else {
                                if (isLineLeadingWhitespace) {
                                    // Remove partial line-leading whitespace
                                    stringBuilder = JsonhReader.#removeRange(stringBuilder, index - lineLeadingWhitespaceCounter, lineLeadingWhitespaceCounter);
                                    index -= lineLeadingWhitespaceCounter;
                                    // Exit line-leading whitespace
                                    isLineLeadingWhitespace = false;
                                }
                            }
                        }
                    }
                }
            }
        }

        // End of string
        return new JsonhToken(JsonTokenType.String, stringBuilder);
    }
    #readQuotelessString(initialChars: string = ""): JsonhToken | Error {
        let isNamedLiteralPossible: boolean = true;

        // Read quoteless string
        let stringBuilder: string = initialChars;

        while (true) {
            // Peek char
            let next: string | null = this.#peek();
            if (next === null) {
                break;
            }

            // Escape sequence
            if (next === '\\') {
                this.#read();
                let escapeSequenceResult: string | Error = this.#readEscapeSequence();
                if (escapeSequenceResult instanceof Error) {
                    return escapeSequenceResult;
                }
                stringBuilder += escapeSequenceResult;
                isNamedLiteralPossible = false;
            }
            // End on reserved character
            else if (JsonhReader.#reservedChars.includes(next)) {
                break;
            }
            // End on newline
            else if (JsonhReader.#newlineChars.includes(next)) {
                break;
            }
            // Literal character
            else {
                this.#read();
                stringBuilder += next;
            }
        }

        // Ensure not empty
        if (stringBuilder.length === 0) {
            return new Error("Empty quoteless string");
        }

        // Trim whitespace
        stringBuilder = JsonhReader.#trimAny(stringBuilder, JsonhReader.#whitespaceChars);

        // Match named literal
        if (isNamedLiteralPossible) {
            if (stringBuilder === "null") {
                return new JsonhToken(JsonTokenType.Null);
            }
            else if (stringBuilder === "true") {
                return new JsonhToken(JsonTokenType.True);
            }
            else if (stringBuilder === "false") {
                return new JsonhToken(JsonTokenType.False);
            }
        }

        // End of quoteless string
        return new JsonhToken(JsonTokenType.String, stringBuilder);
    }
    #detectQuotelessString(): { foundQuotelessString: boolean, whitespaceChars: string } {
        // Read whitespace
        let whitespaceBuilder: string = "";

        while (true) {
            // Read char
            let next: string | null = this.#peek();
            if (next === null) {
                break;
            }

            // Newline
            if (JsonhReader.#newlineChars.includes(next)) {
                // Quoteless strings cannot contain unescaped newlines
                return {
                    foundQuotelessString: false,
                    whitespaceChars: whitespaceBuilder
                };
            }

            // End of whitespace
            if (!JsonhReader.#whitespaceChars.includes(next)) {
                break;
            }

            // Whitespace
            whitespaceBuilder += next;
            this.#read();
        }

        // Found quoteless string if found backslash or non-reserved char
        let nextChar: string | null = this.#peek();
        return {
            foundQuotelessString: nextChar !== null && (nextChar === '\\' || !JsonhReader.#reservedChars.includes(nextChar)),
            whitespaceChars: whitespaceBuilder
        };
    }
    #readNumber(): { numberToken: JsonhToken | Error, partialCharsRead: string } {
        // Read number
        let numberBuilder: string = "";

        // Read sign
        let sign: string | null = this.#readAny('-', '+');
        if (sign !== null) {
            numberBuilder += sign;
        }

        // Read base
        let baseDigits: string = "0123456789";
        let hasBaseSpecifier: boolean = false;
        if (this.#readOne('0')) {
            numberBuilder += '0';

            let hexBaseChar: string | null = this.#readAny('x', 'X');
            if (hexBaseChar !== null) {
                numberBuilder += hexBaseChar;
                baseDigits = "0123456789abcdef";
                hasBaseSpecifier = true;
            }
            else {
                let binaryBaseChar: string | null = this.#readAny('b', 'B');
                if (binaryBaseChar !== null) {
                    numberBuilder += binaryBaseChar;
                    baseDigits = "01";
                    hasBaseSpecifier = true;
                }
                else {
                    let octalBaseChar: string | null = this.#readAny('o', 'O');
                    if (octalBaseChar !== null) {
                        numberBuilder += octalBaseChar;
                        baseDigits = "01234567";
                        hasBaseSpecifier = true;
                    }
                }
            }
        }

        // Read main number
        let mainResult: { result: Error | null, numberNoExponent: string } = this.#readNumberNoExponent(baseDigits, hasBaseSpecifier);
        numberBuilder += mainResult.numberNoExponent;
        if (mainResult.result instanceof Error) {
            return { numberToken: mainResult.result, partialCharsRead: numberBuilder };
        }

        // Hexadecimal exponent
        if (numberBuilder.at(-1) === 'e' || numberBuilder.at(-1) === 'E') {
            // Read sign
            let exponentSign: string | null = this.#readAny('-', '+');
            if (exponentSign !== null) {
                numberBuilder += exponentSign;

                // Read exponent number
                let exponentResult: { result: Error | null, numberNoExponent: string } = this.#readNumberNoExponent(baseDigits, hasBaseSpecifier);
                numberBuilder += exponentResult.numberNoExponent;
                if (exponentResult.result instanceof Error) {
                    return { numberToken: exponentResult.result, partialCharsRead: numberBuilder };
                }
            }
        }
        // Exponent
        else {
            let exponentChar: string | null = this.#readAny('e', 'E');
            if (exponentChar !== null) {
                numberBuilder += exponentChar;

                // Read sign
                let exponentSign: string | null = this.#readAny('-', '+');
                if (exponentSign !== null) {
                    numberBuilder += exponentSign;
                }

                // Read exponent number
                let exponentResult: { result: Error | null, numberNoExponent: string } = this.#readNumberNoExponent(baseDigits, hasBaseSpecifier);
                numberBuilder += exponentResult.numberNoExponent;
                if (exponentResult.result instanceof Error) {
                    return { numberToken: exponentResult.result, partialCharsRead: numberBuilder };
                }
            }
        }

        // End of number
        return { numberToken: new JsonhToken(JsonTokenType.Number, numberBuilder), partialCharsRead: "" };
    }
    #readNumberNoExponent(baseDigits: string, hasBaseSpecifier: boolean): { result: Error | null, numberNoExponent: string } {
        let numberBuilder: string = "";

        // Leading underscore
        if (!hasBaseSpecifier && this.#peek() === '_') {
            return { result: new Error("Leading `_` in number"), numberNoExponent: numberBuilder };
        }

        let isFraction: boolean = false;
        let isEmpty: boolean = true;

        while (true) {
            // Peek char
            let next: string | null = this.#peek();
            if (next === null) {
                break;
            }

            // Digit
            if (baseDigits.includes(next.toLowerCase())) {
                this.#read();
                numberBuilder += next;
                isEmpty = false;
            }
            // Dot
            else if (next === '.') {
                this.#read();
                numberBuilder += next;
                isEmpty = false;

                // Duplicate dot
                if (isFraction) {
                    return { result: new Error("Duplicate `.` in number"), numberNoExponent: numberBuilder };
                }
                isFraction = true;
            }
            // Underscore
            else if (next === '_') {
                this.#read();
                numberBuilder += next;
                isEmpty = false;
            }
            // Other
            else {
                break;
            }
        }

        // Ensure not empty
        if (isEmpty) {
            return { result: new Error("Empty number"), numberNoExponent: numberBuilder };
        }

        // Ensure at least one digit
        if (!JsonhReader.#anyChar(numberBuilder, (char: string) => char === '.' || char === '-' || char === '+' || char === '_')) {
            return { result: new Error("Number must have at least one digit"), numberNoExponent: numberBuilder };
        }

        // Trailing underscore
        if (numberBuilder.endsWith('_')) {
            return { result: new Error("Trailing `_` in number"), numberNoExponent: numberBuilder };
        }

        // End of number
        return { result: null, numberNoExponent: numberBuilder };
    }
    #readNumberOrQuotelessString(): JsonhToken | Error {
        // Read number
        let number: { numberToken: Error | JsonhToken, partialCharsRead: string } = this.#readNumber();
        if (!(number.numberToken instanceof Error)) {
            // Try read quoteless string starting with number
            let detectQuotelessStringResult: { foundQuotelessString: boolean, whitespaceChars: string } = this.#detectQuotelessString();
            if (detectQuotelessStringResult.foundQuotelessString) {
                return this.#readQuotelessString(number.numberToken.value + detectQuotelessStringResult.whitespaceChars);
            }
            // Otherwise, accept number
            else {
                return number.numberToken;
            }
        }
        // Read quoteless string starting with malformed number
        else {
            return this.#readQuotelessString(number.partialCharsRead);
        }
    }
    #readPrimitiveElement(): JsonhToken | Error {
        // Peek char
        let next: string | null = this.#peek();
        if (next === null) {
            return new Error("Expected primitive element, got end of input");
        }

        // Number
        if (next.length === 1 && (next >= '0' && next <= '9') || (next === '-' || next === '+') || next === '.') {
            return this.#readNumberOrQuotelessString();
        }
        // String
        else if (next === '"' || next === '\'') {
            return this.#readString();
        }
        // Quoteless string (or named literal)
        else {
            return this.#readQuotelessString();
        }
    }
    *#readCommentsAndWhitespace(): Generator<JsonhToken | Error> {
        while (true) {
            // Whitespace
            this.#readWhitespace();

            // Peek char
            let next: string | null = this.#peek();
            if (next === null) {
                return;
            }

            // Comment
            if (next === '#' || next === '/') {
                yield this.#readComment();
            }
            // End of comments
            else {
                return;
            }
        }
    }
    #readComment(): JsonhToken | Error {
        let blockComment: boolean = false;

        // Hash-style comment
        if (this.#readOne('#')) {
        }
        else if (this.#readOne('/')) {
            // Line-style comment
            if (this.#readOne('/')) {
            }
            // Block-style comment
            else if (this.#readOne('*')) {
                blockComment = true;
            }
            else {
                return new Error("Unexpected `/`");
            }
        }
        else {
            return new Error("Unexpected character");
        }

        // Read comment
        let commentBuilder: string = "";

        while (true) {
            // Read char
            let next: string | null = this.#read();

            if (blockComment) {
                // Error
                if (next === null) {
                    return new Error("Expected end of block comment, got end of input");
                }
                // End of block comment
                if (next === '*' && this.#readOne('/')) {
                    return new JsonhToken(JsonTokenType.Comment, commentBuilder);
                }
            }
            else {
                // End of line comment
                if (next === null || JsonhReader.#newlineChars.includes(next)) {
                    return new JsonhToken(JsonTokenType.Comment, commentBuilder);
                }
            }

            // Comment char
            commentBuilder += next;
        }
    }
    #readWhitespace(): void {
        while (true) {
            // Peek char
            let next: string | null = this.#peek();
            if (!next) {
                return;
            }

            // Whitespace
            if (JsonhReader.#whitespaceChars.includes(next)) {
                this.#read();
            }
            // End of whitespace
            else {
                return;
            }
        }
    }
    #readHexSequence(length: number): number | Error {
        let hexChars: string = "";

        for (let index: number = 0; index < length; index++) {
            let next: string | null = this.#read();

            // Hex digit
            if (next !== null && ((next >= "0" && next <= "9") || (next >= "A" && next <= "F") || (next >= "a" && next <= "f"))) {
                hexChars += next;
            }
            // Unexpected char
            else {
                return new Error("Incorrect number of hexadecimal digits in unicode escape sequence");
            }
        }

        // Parse unicode character from hex digits
        return Number.parseInt(hexChars, 16);
    }
    #readEscapeSequence(): string | Error {
        let escapeChar: string | null = this.#read();
        if (escapeChar === null) {
            return new Error("Expected escape sequence, got end of input");
        }

        // Reverse solidus
        if (escapeChar === '\\') {
            return '\\';
        }
        // Backspace
        else if (escapeChar === 'b') {
            return '\b';
        }
        // Form feed
        else if (escapeChar === 'f') {
            return '\f';
        }
        // Newline
        else if (escapeChar === 'n') {
            return '\n';
        }
        // Carriage return
        else if (escapeChar === 'r') {
            return '\r';
        }
        // Tab
        else if (escapeChar === 't') {
            return '\t';
        }
        // Vertical tab
        else if (escapeChar === 'v') {
            return '\v';
        }
        // Null
        else if (escapeChar === '0') {
            return '\0';
        }
        // Alert
        else if (escapeChar === 'a') {
            return '\a';
        }
        // Escape
        else if (escapeChar === 'e') {
            return '\u001b';
        }
        // Unicode hex sequence
        else if (escapeChar === 'u') {
            let hexSequence: number | Error = this.#readHexSequence(4);
            if (hexSequence instanceof Error) {
                return hexSequence;
            }
            return String.fromCharCode(hexSequence);
        }
        // Short unicode hex sequence
        else if (escapeChar === 'x') {
            let hexSequence: number | Error = this.#readHexSequence(2);
            if (hexSequence instanceof Error) {
                return hexSequence;
            }
            return String.fromCharCode(hexSequence);
        }
        // Long unicode hex sequence
        else if (escapeChar === 'U') {
            let hexSequence: number | Error = this.#readHexSequence(8);
            if (hexSequence instanceof Error) {
                return hexSequence;
            }
            return String.fromCharCode(hexSequence);
        }
        // Escaped newline
        else if (JsonhReader.#newlineChars.includes(escapeChar)) {
            // Join CR LF
            if (escapeChar === '\r') {
                this.#readOne('\n');
            }
            return "";
        }
        // Other
        else {
            return escapeChar;
        }
    }
    #peek(): string | null {
        let next: string | null = this.#textReader.peek();
        if (next === null) {
            return null;
        }
        return next;
    }
    #read(): string | null {
        let next: string | null = this.#textReader.read();
        if (next === null) {
            return null;
        }
        this.#charCounter++;
        return next;
    }
    #readOne(option: string): boolean {
        if (this.#peek() === option) {
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

    static #removeRange(input: string, start: number, end: number): string {
        return input.slice(0, start) + input.slice(end);
    }
    static #trimAny(input: string, trimChars: ReadonlyArray<string>) {
        let start: number = 0;
        let end: number = input.length;

        while (start < end && trimChars.includes(input.at(start)!)) {
            start++;
        }

        while (end > start && trimChars.includes(input.at(end - 1)!)) {
            end--;
        }

        return input.slice(start, end);
    }
    static #anyChar(input: string, predicate: (char: string) => boolean): boolean {
        for (let char of input) {
            if (predicate(char)) {
                return true;
            }
        }
        return false;
    }
}

export = JsonhReader;