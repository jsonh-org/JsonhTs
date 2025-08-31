import { JsonhVersion } from "./jsonh-version"

/**
 * Options for a JsonhReader.
 */
class JsonhReaderOptions {
    /**
     * Specifies the major version of the JSONH specification to use.
     */
    version: JsonhVersion = JsonhVersion.Latest;
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
}

export { JsonhReaderOptions };