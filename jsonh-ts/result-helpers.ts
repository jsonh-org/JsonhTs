function valueOrThrow<T>(value: T | Error): T {
    if (value instanceof Error) {
        throw value;
    }
    return value;
}

export = {
    valueOrThrow,
};