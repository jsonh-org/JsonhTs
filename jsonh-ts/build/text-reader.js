"use strict";
/**
 * An abstraction for reading UTF-16 characters incrementally.
 */
class TextReader {
    /**
     * Returns all of the remaining characters.
     */
    readToEnd() {
        let result = "";
        while (true) {
            let next = this.peek();
            if (next === null) {
                break;
            }
            result += next;
        }
        return result;
    }
}
module.exports = TextReader;
//# sourceMappingURL=text-reader.js.map