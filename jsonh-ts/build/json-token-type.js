"use strict";
/**
 * The types of tokens that make up a JSON document.
 */
var JsonTokenType;
(function (JsonTokenType) {
    /**
     * Indicates that there is no value (not to be confused with {@link Null}).
     */
    JsonTokenType[JsonTokenType["None"] = 0] = "None";
    /**
     * The start of an object.
     *
     * Example: `{`
     */
    JsonTokenType[JsonTokenType["StartObject"] = 1] = "StartObject";
    /**
     * The end of an object.
     *
     * Example: `}`
     */
    JsonTokenType[JsonTokenType["EndObject"] = 2] = "EndObject";
    /**
     * The start of an array.
     *
     * Example: `[`
     */
    JsonTokenType[JsonTokenType["StartArray"] = 3] = "StartArray";
    /**
     * The end of an array.
     *
     * Example: `]`
     */
    JsonTokenType[JsonTokenType["EndArray"] = 4] = "EndArray";
    /**
     * A property name in an object.
     *
     * Example: `"key":`
     */
    JsonTokenType[JsonTokenType["PropertyName"] = 5] = "PropertyName";
    /**
     * A comment.
     *
     * Example: `// comment`
     */
    JsonTokenType[JsonTokenType["Comment"] = 6] = "Comment";
    /**
     * A string.
     *
     * Example: `"value"`
     */
    JsonTokenType[JsonTokenType["String"] = 7] = "String";
    /**
     * A number.
     *
     * Example: `10`
     */
    JsonTokenType[JsonTokenType["Number"] = 8] = "Number";
    /**
     * A true boolean.
     *
     * Example: `true`
     */
    JsonTokenType[JsonTokenType["True"] = 9] = "True";
    /**
     * A false boolean.
     *
     * Example: `false`
     */
    JsonTokenType[JsonTokenType["False"] = 10] = "False";
    /**
     * A null value.
     *
     * Example: `null`
     */
    JsonTokenType[JsonTokenType["Null"] = 11] = "Null";
})(JsonTokenType || (JsonTokenType = {}));
module.exports = JsonTokenType;
//# sourceMappingURL=json-token-type.js.map