/**
 * A value or an error.
 */
declare class Result<T = undefined, E extends Error = Error> {
    #private;
    /**
     * Constructs a successful or failed result from a value and an error.
     */
    private constructor();
    /**
     * Constructs a successful result from an optional value.
     */
    static fromValue<T>(value?: T | undefined): Result<T>;
    /**
     * Constructs a failed result from an error.
     */
    static fromError<T = undefined, E extends Error = Error>(error: E): Result<T, E>;
    /**
     * Returns whether this result is successful (has an optional value).
     */
    get isValue(): boolean;
    /**
     * Returns whether this result is failed (has an error).
     */
    get isError(): boolean;
    /**
     * Returns the value or throws an error.
     */
    get value(): T;
    /**
     * Changes the optional value or throws an error.
     */
    set value(value: T | undefined);
    /**
     * Returns the optional value or undefined.
     */
    get valueOrUndefined(): T | undefined;
    /**
     * Returns the error or throws an error.
     */
    get error(): E;
    /**
     * Returns the optional error or undefined.
     */
    get errorOrUndefined(): E | undefined;
}
export = Result;
//# sourceMappingURL=result.d.ts.map