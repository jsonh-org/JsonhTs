"use strict";
/**
 * A value or an error.
 */
class Result {
    /**
     * The optional value if successful.
     */
    #value;
    /**
     * The error if unsuccessful.
     */
    #error;
    /**
     * Constructs a successful or failed result from a value and an error.
     */
    constructor(value, error) {
        this.#value = value;
        this.#error = error;
    }
    /**
     * Constructs a successful result from an optional value.
     */
    static fromValue(value = undefined) {
        return new Result(value, undefined);
    }
    /**
     * Constructs a failed result from an error.
     */
    static fromError(error) {
        return new Result(undefined, error);
    }
    /**
     * Returns whether this result is successful (has an optional value).
     */
    get isValue() {
        return this.#error === undefined;
    }
    /**
     * Returns whether this result is failed (has an error).
     */
    get isError() {
        return this.#error !== undefined;
    }
    /**
     * Returns the value or throws an error.
     */
    get value() {
        if (this.#error !== undefined) {
            throw new Error(`Result was error: \"${this.#error.message}\"`);
        }
        if (this.#value === undefined) {
            throw new Error("Result was not error but had no value");
        }
        return this.#value;
    }
    /**
     * Changes the optional value or throws an error.
     */
    set value(value) {
        if (this.#error !== undefined) {
            throw new Error(`Result was error: \"${this.#error.message}\"`);
        }
        this.#value = value;
    }
    /**
     * Returns the optional value or undefined.
     */
    get valueOrUndefined() {
        if (this.#error !== undefined) {
            return undefined;
        }
        return this.#value;
    }
    /**
     * Returns the error or throws an error.
     */
    get error() {
        if (this.#error === undefined) {
            throw new Error("Result was value");
        }
        return this.#error;
    }
    /**
     * Returns the optional error or undefined.
     */
    get errorOrUndefined() {
        if (this.#error === undefined) {
            return undefined;
        }
        return this.#error;
    }
}
module.exports = Result;
//# sourceMappingURL=result.js.map