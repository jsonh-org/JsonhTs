"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonhReaderOptions = void 0;
const jsonh_version_js_1 = require("./jsonh-version.js");
/**
 * Options for a JsonhReader.
 */
class JsonhReaderOptions {
    /**
     * Specifies the major version of the JSONH specification to use.
     */
    version = jsonh_version_js_1.JsonhVersion.Latest;
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
}
exports.JsonhReaderOptions = JsonhReaderOptions;
//# sourceMappingURL=jsonh-reader-options.js.map