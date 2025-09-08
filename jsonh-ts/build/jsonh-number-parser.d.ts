/**
 * Methods for parsing JSONH numbers.
 *
 * Unlike `JsonhReader.readElement()`, minimal validation is done here. Ensure the input is valid.
 */
declare class JsonhNumberParser {
    #private;
    /**
     * Converts a JSONH number to a base-10 real.
     * For example:
     *
     * ```
     * Input: +5.2e3.0
     * Output: 5200
     * ```
     */
    static parse(jsonhNumber: string): number | Error;
}
export = JsonhNumberParser;
//# sourceMappingURL=jsonh-number-parser.d.ts.map