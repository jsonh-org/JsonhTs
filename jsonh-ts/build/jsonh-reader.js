"use strict";
var _a;
const JsonhReaderOptions = require("./jsonh-reader-options.js");
const TextReader = require("./text-reader.js");
const StringTextReader = require("./string-text-reader.js");
const JsonhToken = require("./jsonh-token.js");
const JsonTokenType = require("./json-token-type.js");
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
        this.#textReader = textReader;
        this.#options = options;
        this.#charCounter = 0;
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
            if (node === null) {
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
            if (tokenResult instanceof Error) {
                return tokenResult;
            }
            switch (tokenResult.jsonType) {
                // Null
                case JsonTokenType.Null: {
                    let node = null;
                    if (submitNode(node)) {
                        return node;
                    }
                    break;
                }
                // True
                case JsonTokenType.True: {
                    let node = true;
                    if (submitNode(node)) {
                        return node;
                    }
                    break;
                }
                // False
                case JsonTokenType.False: {
                    let node = false;
                    if (submitNode(node)) {
                        return node;
                    }
                    break;
                }
                // String
                case JsonTokenType.String: {
                    let node = tokenResult.value;
                    if (submitNode(node)) {
                        return node;
                    }
                    break;
                }
                // Number
                case JsonTokenType.Number: {
                    // TODO
                    let node = 1337;
                    //let node: number = tokenResult.value;
                    if (submitNode(node)) {
                        return node;
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
                        return currentNodes.at(-1);
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
    findPropertyValue(propertyName) {
        let currentDepth = 0;
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
                    if (currentDepth == 1 && tokenResult.value == propertyName) {
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
            if (token instanceof Error) {
                yield token;
                return;
            }
            yield token;
        }
        // Peek result
        let next = this.#peek();
        if (next === null) {
            yield new Error("Expected token, got end of input");
            return;
        }
        // Object
        if (next == '{') {
            for (let token of this.#readObject()) {
                if (token instanceof Error) {
                    yield token;
                    return;
                }
                yield token;
            }
        }
        // Array
        else if (next == '[') {
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
            let token = this.#readPrimitiveElement();
            if (token instanceof Error) {
                yield token;
                return;
            }
            // Detect braceless object from property name
            if (token.jsonType == JsonTokenType.String) {
                // Try read property name
                let propertyNameTokens = [];
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
    *#readObject() {
        throw new Error("TODO");
    }
    *#readBracelessObject(propertyNameTokens = null) {
        throw new Error("TODO" + propertyNameTokens);
    }
    *#readArray() {
        throw new Error("TODO");
    }
    *#readPropertyName(string) {
        throw new Error("TODO" + string);
    }
    #readPrimitiveElement() {
        throw new Error("TODO");
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
                return new Error("Unexpected `/`");
            }
        }
        else {
            return new Error("Unexpected character");
        }
        // Read comment
        let commentBuilder = "";
        while (true) {
            // Read char
            let next = this.#read();
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
                if (next === null || _a.#newlineChars.includes(next)) {
                    return new JsonhToken(JsonTokenType.Comment, commentBuilder);
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
            if (!next) {
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
        if (this.#peek() == option) {
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
}
_a = JsonhReader;
module.exports = JsonhReader;
//# sourceMappingURL=jsonh-reader.js.map