"use strict";
function valueOrThrow(value) {
    if (value.isError) {
        throw value;
    }
    return value;
}
module.exports = {
    valueOrThrow,
};
//# sourceMappingURL=result-helpers.js.map