"use strict";
const JsonhVersion = require("./jsonh-version.js");
/**
 * Options for a JsonhReader.
 */
class JsonhReaderOptions {
    /**
     * Specifies the major version of the JSONH specification to use.
     */
    version = JsonhVersion.Latest;
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
    parseSingleElement = false;
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
    maxDepth = 64;
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
    incompleteInputs = false;
    /**
     * Constructs options for a JsonhReader.
     */
    constructor(init) {
        Object.assign(this, init);
    }
    /**
     * Returns whether version is greater than or equal to minimumVersion.
     */
    supportsVersion(minimumVersion) {
        const latestVersion = JsonhVersion.V2;
        let optionsVersion = this.version === JsonhVersion.Latest ? latestVersion : this.version;
        let givenVersion = minimumVersion === JsonhVersion.Latest ? latestVersion : minimumVersion;
        return optionsVersion >= givenVersion;
    }
}
module.exports = JsonhReaderOptions;
//# sourceMappingURL=jsonh-reader-options.js.map