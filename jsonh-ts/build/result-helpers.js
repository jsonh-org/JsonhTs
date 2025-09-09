"use strict";
function valueOrThrow(value) {
    if (value instanceof Error) {
        throw value;
    }
    return value;
}
module.exports = {
    valueOrThrow,
};
//# sourceMappingURL=result-helpers.js.map