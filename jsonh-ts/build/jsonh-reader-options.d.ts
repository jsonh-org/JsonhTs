import JsonhVersion = require("./jsonh-version.js");
/**
 * Options for a JsonhReader.
 */
declare class JsonhReaderOptions {
    /**
     * Specifies the major version of the JSONH specification to use.
     */
    version: JsonhVersion;
    /**
     * Enables/disables checks for exactly one element when parsing.
     *
     * ```
     * "cat"
     * "dog" // Error: Expected single element
     * ```
     *
     * This option does not apply when reading elements, only when parsing elements.
     */
    parseSingleElement: boolean;
    /**
     * Sets the maximum recursion depth allowed when reading JSONH.
     *
     * ```
     * // Max depth: 2
     * {
     *   a: {
     *     b: {
     *       // Error: Exceeded max depth
     *     }
     *   }
     * }
     * ```
     *
     * The default value is 64 to defend against DOS attacks.
     */
    maxDepth: number;
    /**
     * Enables/disables parsing unclosed inputs.
     *
     * ```
     * {
         "key": "val
     * ```
     *
     * This is potentially useful for large language models that stream responses.
     *
     * Only some tokens can be incomplete in this mode, so it should not be relied upon.
     */
    incompleteInputs: boolean;
    /**
     * Constructs options for a JsonhReader.
     */
    constructor(init?: Partial<JsonhReaderOptions>);
    /**
     * Returns whether version is greater than or equal to minimumVersion.
     */
    supportsVersion(minimumVersion: JsonhVersion): boolean;
}
export = JsonhReaderOptions;
//# sourceMappingURL=jsonh-reader-options.d.ts.map