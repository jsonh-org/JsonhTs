/**
 * The major versions of the JSONH specification.
 */
enum JsonhVersion {
    /**
     * Indicates that the latest version should be used (currently {@link V1}).
     */
    Latest = 0,
    /**
     * Version 1 of the specification, released 2025/03/19.
     */
    V1 = 1,
    /**
     * Version 2 of the specification, released 2025/11/19.
     */
    V2 = 2,
}

export = JsonhVersion;