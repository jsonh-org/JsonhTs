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
            if (node === null) {
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

        for (let tokenResult of this.#readElement()) {
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

    *#readElement(): Generator<JsonhToken | Error> {
        // TODO
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

export = JsonhReader;