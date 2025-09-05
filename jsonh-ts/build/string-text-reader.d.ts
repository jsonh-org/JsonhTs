import TextReader = require("./text-reader.js");
declare class StringTextReader implements TextReader {
    #private;
    constructor(string: string);
    read(): string | null;
    peek(): string | null;
    done(): boolean;
    readToEnd(): string;
}
export = StringTextReader;
//# sourceMappingURL=string-text-reader.d.ts.map