/**
 * A value or an error.
 */
class Result<T = undefined, E extends Error = Error> {
    /**
     * The optional value if successful.
     */
    #value: T | undefined;
    /**
     * The error if unsuccessful.
     */
    #error: E | undefined;

    /**
     * Constructs a successful or failed result from a value and an error.
     */
    private constructor(value: T | undefined, error: E | undefined) {
        this.#value = value;
        this.#error = error;
    }
    /**
     * Constructs a successful result from an optional value.
     */
    static fromValue<T>(value: T | undefined = undefined): Result<T> {
        return new Result<T>(value, undefined);
    }
    /**
     * Constructs a failed result from an error.
     */
    static fromError<T = undefined, E extends Error = Error>(error: E): Result<T, E> {
        return new Result<T, E>(undefined, error);
    }

    /**
     * Returns whether this result is successful (has an optional value).
     */
    get isValue(): boolean {
        return this.#error === undefined;
    }
    /**
     * Returns whether this result is failed (has an error).
     */
    get isError(): boolean {
        return this.#error !== undefined;
    }

    /**
     * Returns the value or throws an error.
     */
    get value(): T {
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
    set value(value: T | undefined) {
        if (this.#error !== undefined) {
            throw new Error(`Result was error: \"${this.#error.message}\"`);
        }
        this.#value = value;
    }
    /**
     * Returns the optional value or undefined.
     */
    get valueOrUndefined(): T | undefined {
        if (this.#error !== undefined) {
            return undefined;
        }
        return this.#value;
    }
    /**
     * Returns the error or throws an error.
     */
    get error(): E {
        if (this.#error === undefined) {
            throw new Error("Result was value");
        }
        return this.#error;
    }
    /**
     * Returns the optional error or undefined.
     */
    get errorOrUndefined(): E | undefined {
        if (this.#error === undefined) {
            return undefined;
        }
        return this.#error;
    }
}

export = Result;