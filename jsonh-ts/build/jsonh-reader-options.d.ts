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