/*export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

let a: Result<string> = { ok: true, value: "5" };*/

/*class Result<T = null> {
    #valueOrNull: T | null;
    #errorOrNull: Error | null;
    #isError: boolean;

    constructor(valueOrNull: T | null, errorOrNull: Error | null, isError: boolean) {
        this.#valueOrNull = valueOrNull;
        this.#errorOrNull = errorOrNull;
        this.#isError = isError;
    }

    success(valueOrNull: T | null = null): Result<T> {
        return new Result<T>(valueOrNull, null, false);
    }
    failure(error: Error = null): Result<T> {
        return new Result<T>(null, errorOrNull, false);
    }

    get isValue(): boolean {
        return !this.#isError;
    }
    get isError(): boolean {
        return this.#isError;
    }
}*/