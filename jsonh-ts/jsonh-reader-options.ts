import JsonhVersion = require("./jsonh-version.js");

/**
 * Options for a JsonhReader.
 */
class JsonhReaderOptions {
    /**
     * Specifies the major version of the JSONH specification to use.
     */
    version: JsonhVersion = JsonhVersion.Latest;
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
    parseSingleElement: boolean = false;
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
    maxDepth: number = 64;
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
    incompleteInputs: boolean = false;

    /**
     * Constructs options for a JsonhReader.
     */
    constructor(init?: Partial<JsonhReaderOptions>) {
        Object.assign(this, init);
    }

    /**
     * Returns whether version is greater than or equal to minimumVersion.
     */
    supportsVersion(minimumVersion: JsonhVersion): boolean {
        const latestVersion: JsonhVersion = JsonhVersion.V2;

        let optionsVersion = this.version === JsonhVersion.Latest ? latestVersion : this.version;
        let givenVersion = minimumVersion === JsonhVersion.Latest ? latestVersion : minimumVersion;

        return optionsVersion >= givenVersion;
    }
}

export = JsonhReaderOptions;