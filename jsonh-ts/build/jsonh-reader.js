"use strict";
var _a;
const JsonhReaderOptions = require("./jsonh-reader-options.js");
const TextReader = require("./text-reader.js");
const StringTextReader = require("./string-text-reader.js");
const JsonhToken = require("./jsonh-token.js");
const JsonTokenType = require("./json-token-type.js");
const JsonhNumberParser = require("./jsonh-number-parser.js");
const Result = require("./result.js");
/**
 * A reader that reads JSONH tokens from a string.
 */
class JsonhReader {
    /**
     * The text reader to read characters from.
     */
    #textReader;
    /**
     * The text reader to read characters from.
     */
    get textReader() {
        return this.#textReader;
    }
    /**
     * The options to use when reading JSONH.
     */
    #options;
    /**
     * The options to use when reading JSONH.
     */
    get options() {
        return this.#options;
    }
    /**
     * The number of characters read from {@link string}.
     */
    #charCounter;
    /**
     * The number of characters read from {@link string}.
     */
    get charCounter() {
        return this.#charCounter;
    }
    /**
     * Characters that cannot be used unescaped in quoteless strings.
     */
    static #reservedChars = ['\\', ',', ':', '[', ']', '{', '}', '/', '#', '"', '\''];
    /**
     * Characters that are considered newlines.
     */
    static #newlineChars = ['\n', '\r', '\u2028', '\u2029'];
    /**
     * Characters that are considered whitespace.
     */
    static #whitespaceChars = [
        '\u0020', '\u00A0', '\u1680', '\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005',
        '\u2006', '\u2007', '\u2008', '\u2009', '\u200A', '\u202F', '\u205F', '\u3000', '\u2028',
        '\u2029', '\u0009', '\u000A', '\u000B', '\u000C', '\u000D', '\u0085',
    ];
    /**
     * Constructs a reader that reads JSONH from a text reader.
     */
    constructor(textReader, options = new JsonhReaderOptions()) {
        if (typeof textReader === "string") {
            throw new Error("Do not pass a string to new JsonhReader(). Use JsonhReader.fromString().");
        }
        this.#textReader = textReader;
        this.#options = options;
        this.#charCounter = 0;
    }
    /**
     * Constructs a reader that reads JSONH from a text reader.
     */
    static fromTextReader(textReader, options = new JsonhReaderOptions()) {
        return new _a(textReader, options);
    }
    /**
     * Constructs a reader that reads JSONH from a string.
     */
    static fromString(string, options = new JsonhReaderOptions()) {
        return new _a(new StringTextReader(string), options);
    }
    /**
     * Parses a single element from a text reader.
     */
    static parseElementfromTextReader(textReader) {
        return new _a(textReader).parseElement();
    }
    /**
     * Parses a single element from a string.
     */
    static parseElementFromString(string) {
        return this.fromString(string).parseElement();
    }
    /**
     * Parses a single element from the reader.
     */
    parseElement() {
        let currentNodes = [];
        let currentPropertyName = null;
        let submitNode = function (node) {
            // Root value
            if (currentNodes.length === 0) {
                return true;
            }
            // Array item
            if (currentPropertyName === null) {
                currentNodes.at(-1).push(node);
                return false;
            }
            // Object property
            else {
                currentNodes.at(-1)[currentPropertyName] = node;
                currentPropertyName = null;
                return false;
            }
        };
        let startNode = function (node) {
            submitNode(node);
            currentNodes.push(node);
        };
        for (let tokenResult of this.readElement()) {
            // Check error
            if (tokenResult.isError) {
                return Result.fromError(tokenResult.error);
            }
            switch (tokenResult.value.jsonType) {
                // Null
                case JsonTokenType.Null: {
                    let node = null;
                    if (submitNode(node)) {
                        return Result.fromValue(node);
                    }
                    break;
                }
                // True
                case JsonTokenType.True: {
                    let node = true;
                    if (submitNode(node)) {
                        return Result.fromValue(node);
                    }
                    break;
                }
                // False
                case JsonTokenType.False: {
                    let node = false;
                    if (submitNode(node)) {
                        return Result.fromValue(node);
                    }
                    break;
                }
                // String
                case JsonTokenType.String: {
                    let node = tokenResult.value.value;
                    if (submitNode(node)) {
                        return Result.fromValue(node);
                    }
                    break;
                }
                // Number
                case JsonTokenType.Number: {
                    // TODO
                    let result = JsonhNumberParser.parse(tokenResult.value.value);
                    if (result.isError) {
                        return Result.fromError(result.error);
                    }
                    let node = result.value;
                    if (submitNode(node)) {
                        return Result.fromValue(node);
                    }
                    break;
                }
                // Start Object
                case JsonTokenType.StartObject: {
                    let node = {};
                    startNode(node);
                    break;
                }
                // Start Array
                case JsonTokenType.StartArray: {
                    let node = [];
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
                        return Result.fromValue(currentNodes.at(-1));
                    }
                    break;
                }
                // Property Name
                case JsonTokenType.PropertyName: {
                    currentPropertyName = tokenResult.value.value;
                    break;
                }
                // Comment
                case JsonTokenType.Comment: {
                    break;
                }
                // Not Implemented
                default: {
                    return Result.fromError(new Error("Token type not implemented"));
                }
            }
        }
        // End of input
        return Result.fromError(new Error("Expected token, got end of input"));
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
    findPropertyValue(propertyName) {
        let currentDepth = 0;
        for (let tokenResult of this.readElement()) {
            // Check error
            if (tokenResult.isError) {
                return false;
            }
            switch (tokenResult.value.jsonType) {
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
                    if (currentDepth === 1 && tokenResult.value.value === propertyName) {
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
    *readElement() {
        // Comments & whitespace
        for (let token of this.#readCommentsAndWhitespace()) {
            if (token.isError) {
                yield token;
                return;
            }
            yield token;
        }
        // Peek result
        let next = this.#peek();
        if (next === null) {
            yield Result.fromError(new Error("Expected token, got end of input"));
            return;
        }
        // Object
        if (next === '{') {
            for (let token of this.#readObject()) {
                if (token.isError) {
                    yield token;
                    return;
                }
                yield token;
            }
        }
        // Array
        else if (next === '[') {
            for (let token of this.#readArray()) {
                if (token.isError) {
                    yield token;
                    return;
                }
                yield token;
            }
        }
        // Primitive value (null, true, false, string, number)
        else {
            let token = this.#readPrimitiveElement();
            if (token.isError) {
                yield token;
                return;
            }
            // Detect braceless object from property name
            if (token.value.jsonType === JsonTokenType.String) {
                // Try read property name
                let propertyNameTokens = [];
                for (let propertyNameToken of this.#readPropertyName(token.value.value)) {
                    // Possible braceless object
                    if (!propertyNameToken.isError) {
                        propertyNameTokens.push(propertyNameToken.value);
                    }
                    // Primitive value (error reading property name)
                    else {
                        yield token;
                        for (let nonPropertyNameToken of propertyNameTokens) {
                            yield Result.fromValue(nonPropertyNameToken);
                        }
                        return;
                    }
                }
                // Braceless object
                for (let objectToken of this.#readBracelessObject(propertyNameTokens)) {
                    if (objectToken.isError) {
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
    *#readObject() {
        // Opening brace
        if (!this.#readOne('{')) {
            // Braceless object
            for (let token of this.#readBracelessObject()) {
                if (token.isError) {
                    yield token;
                    return;
                }
                yield token;
            }
            return;
        }
        // Start object
        yield Result.fromValue(new JsonhToken(JsonTokenType.StartObject));
        while (true) {
            // Comments & whitespace
            for (let token of this.#readCommentsAndWhitespace()) {
                if (token.isError) {
                    yield token;
                    return;
                }
                yield token;
            }
            let next = this.#peek();
            if (next === null) {
                // End of incomplete object
                if (this.#options.incompleteInputs) {
                    yield Result.fromValue(new JsonhToken(JsonTokenType.EndObject));
                    return;
                }
                // Missing closing brace
                yield Result.fromError(new Error("Expected `}` to end object, got end of input"));
                return;
            }
            // Closing brace
            if (next === '}') {
                // End of object
                this.#read();
                yield Result.fromValue(new JsonhToken(JsonTokenType.EndObject));
                return;
            }
            // Property
            else {
                for (let token of this.#readProperty()) {
                    if (token.isError) {
                        yield token;
                        return;
                    }
                    yield token;
                }
            }
        }
    }
    *#readBracelessObject(propertyNameTokens = null) {
        // Start of object
        yield Result.fromValue(new JsonhToken(JsonTokenType.StartObject));
        // Initial tokens
        if (propertyNameTokens !== null) {
            for (let initialToken of this.#readProperty(propertyNameTokens)) {
                if (initialToken.isError) {
                    yield initialToken;
                    return;
                }
                yield initialToken;
            }
        }
        while (true) {
            // Comments & whitespace
            for (let token of this.#readCommentsAndWhitespace()) {
                if (token.isError) {
                    yield token;
                    return;
                }
                yield token;
            }
            if (this.#peek() === null) {
                // End of braceless object
                yield Result.fromValue(new JsonhToken(JsonTokenType.EndObject));
                return;
            }
            // Property
            for (let token of this.#readProperty()) {
                if (token.isError) {
                    yield token;
                    return;
                }
                yield token;
            }
        }
    }
    *#readProperty(propertyNameTokens = null) {
        // Property name
        if (propertyNameTokens !== null) {
            for (let token of propertyNameTokens) {
                yield Result.fromValue(token);
            }
        }
        else {
            for (let token of this.#readPropertyName()) {
                if (token.isError) {
                    yield token;
                    return;
                }
                yield token;
            }
        }
        // Comments & whitespace
        for (let token of this.#readCommentsAndWhitespace()) {
            if (token.isError) {
                yield token;
                return;
            }
            yield token;
        }
        // Property value
        for (let token of this.readElement()) {
            if (token.isError) {
                yield token;
                return;
            }
            yield token;
        }
        // Comments & whitespace
        for (let token of this.#readCommentsAndWhitespace()) {
            if (token.isError) {
                yield token;
                return;
            }
            yield token;
        }
        // Optional comma
        this.#readOne(',');
    }
    *#readPropertyName(string = null) {
        // String
        if (string === null) {
            let stringToken = this.#readString();
            if (stringToken.isError) {
                yield stringToken;
                return;
            }
            string = stringToken.value.value;
        }
        // Comments & whitespace
        for (let token of this.#readCommentsAndWhitespace()) {
            if (token.isError) {
                yield token;
                return;
            }
            yield token;
        }
        // Colon
        if (!this.#readOne(':')) {
            yield Result.fromError(new Error("Expected `:` after property name in object"));
            return;
        }
        // End of property name
        yield Result.fromValue(new JsonhToken(JsonTokenType.PropertyName, string));
    }
    *#readArray() {
        // Opening bracket
        if (!this.#readOne('[')) {
            yield Result.fromError(new Error("Expected `[` to start array"));
            return;
        }
        // Start of array
        yield Result.fromValue(new JsonhToken(JsonTokenType.StartArray));
        while (true) {
            // Comments & whitespace
            for (let token of this.#readCommentsAndWhitespace()) {
                if (token.isError) {
                    yield token;
                    return;
                }
                yield token;
            }
            let next = this.#peek();
            if (next === null) {
                // End of incomplete array
                if (this.#options.incompleteInputs) {
                    yield Result.fromValue(new JsonhToken(JsonTokenType.EndArray));
                    return;
                }
                // Missing closing bracket
                yield Result.fromError(new Error("Expected `]` to end array, got end of input"));
                return;
            }
            // Closing bracket
            if (next === ']') {
                // End of array
                this.#read();
                yield Result.fromValue(new JsonhToken(JsonTokenType.EndArray));
                return;
            }
            // Item
            else {
                for (let token of this.#readItem()) {
                    if (token.isError) {
                        yield token;
                        return;
                    }
                    yield token;
                }
            }
        }
    }
    *#readItem() {
        // Element
        for (let token of this.readElement()) {
            if (token.isError) {
                yield token;
                return;
            }
            yield token;
        }
        // Comments & whitespace
        for (let token of this.#readCommentsAndWhitespace()) {
            if (token.isError) {
                yield token;
                return;
            }
            yield token;
        }
        // Optional comma
        this.#readOne(',');
    }
    #readString() {
        // Start quote
        let startQuote = this.#readAny('"', '\'');
        if (startQuote === null) {
            return this.#readQuotelessString();
        }
        // Count multiple start quotes
        let startQuoteCounter = 1;
        while (this.#readOne(startQuote)) {
            startQuoteCounter++;
        }
        // Empty string
        if (startQuoteCounter === 2) {
            return Result.fromValue(new JsonhToken(JsonTokenType.String, ""));
        }
        // Count multiple end quotes
        let endQuoteCounter = 0;
        // Read string
        let stringBuilder = "";
        while (true) {
            let next = this.#read();
            if (next === null) {
                return Result.fromError(new Error("Expected end of string, got end of input"));
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
                let escapeSequenceResult = this.#readEscapeSequence();
                if (escapeSequenceResult.isError) {
                    return Result.fromError(escapeSequenceResult.error);
                }
                stringBuilder += escapeSequenceResult.value;
            }
            // Literal character
            else {
                stringBuilder += next;
            }
        }
        // Condition: skip remaining steps unless started with multiple quotes
        if (startQuoteCounter > 1) {
            // Pass 1: count leading whitespace -> newline
            let hasLeadingWhitespaceNewline = false;
            let leadingWhitespaceNewlineCounter = 0;
            for (let index = 0; index < stringBuilder.length; index++) {
                let next = stringBuilder.at(index);
                // Newline
                if (_a.#newlineChars.includes(next)) {
                    // Join CR LF
                    if (next === '\r' && index + 1 < stringBuilder.length && stringBuilder[index + 1] === '\n') {
                        index++;
                    }
                    hasLeadingWhitespaceNewline = true;
                    leadingWhitespaceNewlineCounter = index + 1;
                    break;
                }
                // Non-whitespace
                else if (!_a.#whitespaceChars.includes(next)) {
                    break;
                }
            }
            // Condition: skip remaining steps if pass 1 failed
            if (hasLeadingWhitespaceNewline) {
                // Pass 2: count trailing newline -> whitespace
                let hasTrailingNewlineWhitespace = false;
                let lastNewlineIndex = 0;
                let trailingWhitespaceCounter = 0;
                for (let index = 0; index < stringBuilder.length; index++) {
                    let next = stringBuilder.at(index);
                    // Newline
                    if (_a.#newlineChars.includes(next)) {
                        hasTrailingNewlineWhitespace = true;
                        lastNewlineIndex = index;
                        trailingWhitespaceCounter = 0;
                        // Join CR LF
                        if (next === '\r' && index + 1 < stringBuilder.length && stringBuilder[index + 1] === '\n') {
                            index++;
                        }
                    }
                    // Whitespace
                    else if (_a.#whitespaceChars.includes(next)) {
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
                    stringBuilder = _a.#removeRange(stringBuilder, lastNewlineIndex, stringBuilder.length - lastNewlineIndex);
                    // Pass 4: strip leading whitespace -> newline
                    stringBuilder = _a.#removeRange(stringBuilder, 0, leadingWhitespaceNewlineCounter);
                    // Condition: skip remaining steps if no trailing whitespace
                    if (trailingWhitespaceCounter > 0) {
                        // Pass 5: strip line-leading whitespace
                        let isLineLeadingWhitespace = true;
                        let lineLeadingWhitespaceCounter = 0;
                        for (let index = 0; index < stringBuilder.length; index++) {
                            let next = stringBuilder.at(index);
                            // Newline
                            if (_a.#newlineChars.includes(next)) {
                                isLineLeadingWhitespace = true;
                                lineLeadingWhitespaceCounter = 0;
                            }
                            // Whitespace
                            else if (_a.#whitespaceChars.includes(next)) {
                                if (isLineLeadingWhitespace) {
                                    // Increment line-leading whitespace
                                    lineLeadingWhitespaceCounter++;
                                    // Maximum line-leading whitespace reached
                                    if (lineLeadingWhitespaceCounter === trailingWhitespaceCounter) {
                                        // Remove line-leading whitespace
                                        stringBuilder = _a.#removeRange(stringBuilder, index + 1 - lineLeadingWhitespaceCounter, lineLeadingWhitespaceCounter);
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
                                    stringBuilder = _a.#removeRange(stringBuilder, index - lineLeadingWhitespaceCounter, lineLeadingWhitespaceCounter);
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
        return Result.fromValue(new JsonhToken(JsonTokenType.String, stringBuilder));
    }
    #readQuotelessString(initialChars = "") {
        let isNamedLiteralPossible = true;
        // Read quoteless string
        let stringBuilder = initialChars;
        while (true) {
            // Peek char
            let next = this.#peek();
            if (next === null) {
                break;
            }
            // Escape sequence
            if (next === '\\') {
                this.#read();
                let escapeSequenceResult = this.#readEscapeSequence();
                if (escapeSequenceResult.isError) {
                    return Result.fromError(escapeSequenceResult.error);
                }
                stringBuilder += escapeSequenceResult.value;
                isNamedLiteralPossible = false;
            }
            // End on reserved character
            else if (_a.#reservedChars.includes(next)) {
                break;
            }
            // End on newline
            else if (_a.#newlineChars.includes(next)) {
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
            return Result.fromError(new Error("Empty quoteless string"));
        }
        // Trim whitespace
        stringBuilder = _a.#trimAny(stringBuilder, _a.#whitespaceChars);
        // Match named literal
        if (isNamedLiteralPossible) {
            if (stringBuilder === "null") {
                return Result.fromValue(new JsonhToken(JsonTokenType.Null));
            }
            else if (stringBuilder === "true") {
                return Result.fromValue(new JsonhToken(JsonTokenType.True));
            }
            else if (stringBuilder === "false") {
                return Result.fromValue(new JsonhToken(JsonTokenType.False));
            }
        }
        // End of quoteless string
        return Result.fromValue(new JsonhToken(JsonTokenType.String, stringBuilder));
    }
    #detectQuotelessString() {
        // Read whitespace
        let whitespaceBuilder = "";
        while (true) {
            // Read char
            let next = this.#peek();
            if (next === null) {
                break;
            }
            // Newline
            if (_a.#newlineChars.includes(next)) {
                // Quoteless strings cannot contain unescaped newlines
                return {
                    foundQuotelessString: false,
                    whitespaceChars: whitespaceBuilder
                };
            }
            // End of whitespace
            if (!_a.#whitespaceChars.includes(next)) {
                break;
            }
            // Whitespace
            whitespaceBuilder += next;
            this.#read();
        }
        // Found quoteless string if found backslash or non-reserved char
        let nextChar = this.#peek();
        return {
            foundQuotelessString: nextChar !== null && (nextChar === '\\' || !_a.#reservedChars.includes(nextChar)),
            whitespaceChars: whitespaceBuilder
        };
    }
    #readNumber() {
        // Read number
        let numberBuilder = "";
        // Read sign
        let sign = this.#readAny('-', '+');
        if (sign !== null) {
            numberBuilder += sign;
        }
        // Read base
        let baseDigits = "0123456789";
        let hasBaseSpecifier = false;
        if (this.#readOne('0')) {
            numberBuilder += '0';
            let hexBaseChar = this.#readAny('x', 'X');
            if (hexBaseChar !== null) {
                numberBuilder += hexBaseChar;
                baseDigits = "0123456789abcdef";
                hasBaseSpecifier = true;
            }
            else {
                let binaryBaseChar = this.#readAny('b', 'B');
                if (binaryBaseChar !== null) {
                    numberBuilder += binaryBaseChar;
                    baseDigits = "01";
                    hasBaseSpecifier = true;
                }
                else {
                    let octalBaseChar = this.#readAny('o', 'O');
                    if (octalBaseChar !== null) {
                        numberBuilder += octalBaseChar;
                        baseDigits = "01234567";
                        hasBaseSpecifier = true;
                    }
                }
            }
        }
        // Read main number
        let mainResult = this.#readNumberNoExponent(baseDigits, hasBaseSpecifier);
        numberBuilder += mainResult.numberNoExponent;
        if (mainResult.result.isError) {
            return { numberToken: Result.fromError(mainResult.result.error), partialCharsRead: numberBuilder };
        }
        // Hexadecimal exponent
        if (numberBuilder.at(-1) === 'e' || numberBuilder.at(-1) === 'E') {
            // Read sign
            let exponentSign = this.#readAny('-', '+');
            if (exponentSign !== null) {
                numberBuilder += exponentSign;
                // Read exponent number
                let exponentResult = this.#readNumberNoExponent(baseDigits, hasBaseSpecifier);
                numberBuilder += exponentResult.numberNoExponent;
                if (exponentResult.result.isError) {
                    return { numberToken: Result.fromError(exponentResult.result.error), partialCharsRead: numberBuilder };
                }
            }
        }
        // Exponent
        else {
            let exponentChar = this.#readAny('e', 'E');
            if (exponentChar !== null) {
                numberBuilder += exponentChar;
                // Read sign
                let exponentSign = this.#readAny('-', '+');
                if (exponentSign !== null) {
                    numberBuilder += exponentSign;
                }
                // Read exponent number
                let exponentResult = this.#readNumberNoExponent(baseDigits, hasBaseSpecifier);
                numberBuilder += exponentResult.numberNoExponent;
                if (exponentResult.result.isError) {
                    return { numberToken: Result.fromError(exponentResult.result.error), partialCharsRead: numberBuilder };
                }
            }
        }
        // End of number
        return { numberToken: Result.fromValue(new JsonhToken(JsonTokenType.Number, numberBuilder)), partialCharsRead: "" };
    }
    #readNumberNoExponent(baseDigits, hasBaseSpecifier) {
        let numberBuilder = "";
        // Leading underscore
        if (!hasBaseSpecifier && this.#peek() === '_') {
            return { result: Result.fromError(new Error("Leading `_` in number")), numberNoExponent: numberBuilder };
        }
        let isFraction = false;
        let isEmpty = true;
        while (true) {
            // Peek char
            let next = this.#peek();
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
                    return { result: Result.fromError(new Error("Duplicate `.` in number")), numberNoExponent: numberBuilder };
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
            return { result: Result.fromError(new Error("Empty number")), numberNoExponent: numberBuilder };
        }
        // Ensure at least one digit
        if (!_a.#containsAnyExcept(numberBuilder, ['.', '-', '+', '_'])) {
            return { result: Result.fromError(new Error("Number must have at least one digit")), numberNoExponent: numberBuilder };
        }
        // Trailing underscore
        if (numberBuilder.endsWith('_')) {
            return { result: Result.fromError(new Error("Trailing `_` in number")), numberNoExponent: numberBuilder };
        }
        // End of number
        return { result: Result.fromValue(), numberNoExponent: numberBuilder };
    }
    #readNumberOrQuotelessString() {
        // Read number
        let number = this.#readNumber();
        if (!number.numberToken.isError) {
            // Try read quoteless string starting with number
            let detectQuotelessStringResult = this.#detectQuotelessString();
            if (detectQuotelessStringResult.foundQuotelessString) {
                return this.#readQuotelessString(number.numberToken.value.value + detectQuotelessStringResult.whitespaceChars);
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
    #readPrimitiveElement() {
        // Peek char
        let next = this.#peek();
        if (next === null) {
            return Result.fromError(new Error("Expected primitive element, got end of input"));
        }
        // Number
        if (next.length === 1 && ((next >= '0' && next <= '9') || (next === '-' || next === '+') || next === '.')) {
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
    *#readCommentsAndWhitespace() {
        while (true) {
            // Whitespace
            this.#readWhitespace();
            // Peek char
            let next = this.#peek();
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
    #readComment() {
        let blockComment = false;
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
                return Result.fromError(new Error("Unexpected `/`"));
            }
        }
        else {
            return Result.fromError(new Error("Unexpected character"));
        }
        // Read comment
        let commentBuilder = "";
        while (true) {
            // Read char
            let next = this.#read();
            if (blockComment) {
                // Error
                if (next === null) {
                    return Result.fromError(new Error("Expected end of block comment, got end of input"));
                }
                // End of block comment
                if (next === '*' && this.#readOne('/')) {
                    return Result.fromValue(new JsonhToken(JsonTokenType.Comment, commentBuilder));
                }
            }
            else {
                // End of line comment
                if (next === null || _a.#newlineChars.includes(next)) {
                    return Result.fromValue(new JsonhToken(JsonTokenType.Comment, commentBuilder));
                }
            }
            // Comment char
            commentBuilder += next;
        }
    }
    #readWhitespace() {
        while (true) {
            // Peek char
            let next = this.#peek();
            if (next === null) {
                return;
            }
            // Whitespace
            if (_a.#whitespaceChars.includes(next)) {
                this.#read();
            }
            // End of whitespace
            else {
                return;
            }
        }
    }
    #readHexSequence(length) {
        let hexChars = "";
        for (let index = 0; index < length; index++) {
            let next = this.#read();
            // Hex digit
            if (next !== null && ((next >= "0" && next <= "9") || (next >= "A" && next <= "F") || (next >= "a" && next <= "f"))) {
                hexChars += next;
            }
            // Unexpected char
            else {
                return Result.fromError(new Error("Incorrect number of hexadecimal digits in unicode escape sequence"));
            }
        }
        // Parse unicode character from hex digits
        return Result.fromValue(Number.parseInt(hexChars, 16));
    }
    #readEscapeSequence() {
        let escapeChar = this.#read();
        if (escapeChar === null) {
            return Result.fromError(new Error("Expected escape sequence, got end of input"));
        }
        // Reverse solidus
        if (escapeChar === '\\') {
            return Result.fromValue('\\');
        }
        // Backspace
        else if (escapeChar === 'b') {
            return Result.fromValue('\b');
        }
        // Form feed
        else if (escapeChar === 'f') {
            return Result.fromValue('\f');
        }
        // Newline
        else if (escapeChar === 'n') {
            return Result.fromValue('\n');
        }
        // Carriage return
        else if (escapeChar === 'r') {
            return Result.fromValue('\r');
        }
        // Tab
        else if (escapeChar === 't') {
            return Result.fromValue('\t');
        }
        // Vertical tab
        else if (escapeChar === 'v') {
            return Result.fromValue('\v');
        }
        // Null
        else if (escapeChar === '0') {
            return Result.fromValue('\0');
        }
        // Alert
        else if (escapeChar === 'a') {
            return Result.fromValue('\a');
        }
        // Escape
        else if (escapeChar === 'e') {
            return Result.fromValue('\u001b');
        }
        // Unicode hex sequence
        else if (escapeChar === 'u') {
            let hexSequence = this.#readHexSequence(4);
            if (hexSequence.isError) {
                return Result.fromError(hexSequence.error);
            }
            return Result.fromValue(String.fromCodePoint(hexSequence.value));
        }
        // Short unicode hex sequence
        else if (escapeChar === 'x') {
            let hexSequence = this.#readHexSequence(2);
            if (hexSequence.isError) {
                return Result.fromError(hexSequence.error);
            }
            return Result.fromValue(String.fromCodePoint(hexSequence.value));
        }
        // Long unicode hex sequence
        else if (escapeChar === 'U') {
            let hexSequence = this.#readHexSequence(8);
            if (hexSequence.isError) {
                return Result.fromError(hexSequence.error);
            }
            return Result.fromValue(String.fromCodePoint(hexSequence.value));
        }
        // Escaped newline
        else if (_a.#newlineChars.includes(escapeChar)) {
            // Join CR LF
            if (escapeChar === '\r') {
                this.#readOne('\n');
            }
            return Result.fromValue("");
        }
        // Other
        else {
            return Result.fromValue(escapeChar);
        }
    }
    #peek() {
        let next = this.#textReader.peek();
        if (next === null) {
            return null;
        }
        return next;
    }
    #read() {
        let next = this.#textReader.read();
        if (next === null) {
            return null;
        }
        this.#charCounter++;
        return next;
    }
    #readOne(option) {
        if (this.#peek() === option) {
            this.#read();
            return true;
        }
        return false;
    }
    #readAny(...options) {
        // Peek char
        let next = this.#peek();
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
    static #removeRange(input, start, count) {
        return input.slice(0, start) + input.slice(start + count);
    }
    static #trimAny(input, trimChars) {
        let start = 0;
        let end = input.length;
        while (start < end && trimChars.includes(input.at(start))) {
            start++;
        }
        while (end > start && trimChars.includes(input.at(end - 1))) {
            end--;
        }
        return input.slice(start, end);
    }
    static #containsAnyExcept(input, allowed) {
        for (let char of input) {
            if (!allowed.includes(char)) {
                return true;
            }
        }
        return false;
    }
}
_a = JsonhReader;
module.exports = JsonhReader;
//# sourceMappingURL=jsonh-reader.js.map