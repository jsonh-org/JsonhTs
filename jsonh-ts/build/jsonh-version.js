"use strict";
/**
 * The major versions of the JSONH specification.
 */
var JsonhVersion;
(function (JsonhVersion) {
    /**
     * Indicates that the latest version should be used (currently {@link V1}).
     */
    JsonhVersion[JsonhVersion["Latest"] = 0] = "Latest";
    /**
     * Version 1 of the specification, released 2025/03/19.
     */
    JsonhVersion[JsonhVersion["V1"] = 1] = "V1";
    /**
     * Version 2 of the specification, released 2025/11/19.
     */
    JsonhVersion[JsonhVersion["V2"] = 2] = "V2";
})(JsonhVersion || (JsonhVersion = {}));
module.exports = JsonhVersion;
//# sourceMappingURL=jsonh-version.js.map