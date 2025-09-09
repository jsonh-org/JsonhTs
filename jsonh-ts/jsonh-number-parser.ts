/**
 * Methods for parsing JSONH numbers.
 * 
 * Unlike `JsonhReader.readElement()`, minimal validation is done here. Ensure the input is valid.
 */
class JsonhNumberParser {
    /**
     * Converts a JSONH number to a base-10 real.
     * For example:
     * 
     * ```
     * Input: +5.2e3.0
     * Output: 5200
     * ```
     */
    static parse(jsonhNumber: string): number | Error {
        // Remove underscores
        jsonhNumber = jsonhNumber.replaceAll("_", "");
        let digits: string = jsonhNumber;

        // Get sign
        let sign: number = 1;
        if (digits.startsWith('-')) {
            sign = -1;
            digits = digits.slice(1);
        }
        else if (digits.startsWith('+')) {
            sign = 1;
            digits = digits.slice(1);
        }

        // Decimal
        let baseDigits: string = "0123456789";
        // Hexadecimal
        if (digits.startsWith("0x") || digits.startsWith("0X")) {
            baseDigits = "0123456789abcdef";
            digits = digits.slice(2);
        }
        // Binary
        else if (digits.startsWith("0b") || digits.startsWith("0B")) {
            baseDigits = "01";
            digits = digits.slice(2);
        }
        // Octal
        else if (digits.startsWith("0o") || digits.startsWith("0O")) {
            baseDigits = "01234567";
            digits = digits.slice(2);
        }

        // Parse number with base digits
        let number: number | Error = this.#parseFractionalNumberWithExponent(digits, baseDigits);
        if (number instanceof Error) {
            return number;
        }

        // Apply sign
        if (sign !== 1) {
            number *= sign;
        }
        return number;
    }

    /**
     * Converts a fractional number with an exponent (e.g. `12.3e4.5`) from the given base (e.g. `01234567`) to a base-10 real.
     */
    static #parseFractionalNumberWithExponent(digits: string, baseDigits: string): number | Error {
        // Find exponent
        let exponentIndex: number = -1;
        // Hexadecimal exponent
        if (baseDigits.includes('e')) {
            for (let index: number = 0; index < digits.length; index++) {
                if (digits.at(index) !== 'e' && digits.at(index) !== 'E') {
                    continue;
                }
                if (index + 1 >= digits.length || (digits.at(index + 1) !== '+' && digits.at(index + 1) !== '-')) {
                    continue;
                }
                exponentIndex = index;
                break;
            }
        }
        // Exponent
        else {
            exponentIndex = this.#indexOfAny(digits, ['e', 'E']);
        }

        // If no exponent then parse real
        if (exponentIndex < 0) {
            return this.#parseFractionalNumber(digits, baseDigits);
        }

        // Get mantissa and exponent
        let mantissaPart: string = digits.slice(0, exponentIndex);
        let exponentPart: string = digits.slice(exponentIndex + 1);

        // Parse mantissa and exponent
        let mantissa: number | Error = this.#parseFractionalNumber(mantissaPart, baseDigits);
        if (mantissa instanceof Error) {
            return mantissa;
        }
        let exponent: number | Error = this.#parseFractionalNumber(exponentPart, baseDigits);
        if (exponent instanceof Error) {
            return exponent;
        }

        // Multiply mantissa by 10 ^ exponent
        return mantissa * (10 ** exponent);
    }
    /**
     * Converts a fractional number (e.g. `123.45`) from the given base (e.g. `01234567`) to a base-10 real.
     */
    static #parseFractionalNumber(digits: string, baseDigits: string): number | Error {
        // Find dot
        let dotIndex: number = digits.indexOf('.');
        // If no dot then normalize integer
        if (dotIndex < 0) {
            return this.#parseWholeNumber(digits, baseDigits);
        }

        // Get parts of number
        let wholePart: string = digits.slice(0, dotIndex);
        let fractionalPart: string = digits.slice(dotIndex + 1);

        // Parse parts of number
        let whole: number | Error = this.#parseWholeNumber(wholePart, baseDigits);
        if (whole instanceof Error) {
            return whole;
        }
        let fraction: number | Error = this.#parseWholeNumber(fractionalPart, baseDigits);
        if (fraction instanceof Error) {
            return fraction;
        }

        // Combine whole and fraction
        return Number.parseFloat(whole + '.' + fraction);
    }
    /**
     * Converts a whole number (e.g. `12345`) from the given base (e.g. `01234567`) to a base-10 integer.
     */
    static #parseWholeNumber(digits: string, baseDigits: string): number | Error {
        // Get sign
        let sign: number = 1;
        if (digits.startsWith('-')) {
            sign = -1;
            digits = digits.slice(1);
        }
        else if (digits.startsWith('+')) {
            sign = 1;
            digits = digits.slice(1);
        }

        // Add each column of digits
        let integer: number = 0;
        for (let index: number = 0; index < digits.length; index++) {
            // Get current digit
            let digitChar: string = digits.at(index)!;
            let digitInt: number = baseDigits.indexOf(digitChar.toLowerCase());

            // Ensure digit is valid
            if (digitInt < 0) {
                return new Error(`Invalid digit: '${digitChar}'`);
            }

            // Get magnitude of current digit column
            let columnNumber: number = digits.length - 1 - index;
            let columnMagnitude: number = baseDigits.length ** columnNumber;

            // Add value of column
            integer += digitInt * columnMagnitude;
        }

        // Apply sign
        if (sign !== 1) {
            integer *= sign;
        }
        return integer;
    }
    static #indexOfAny(input: string, chars: ReadonlyArray<string>): number {
        for (let i: number = 0; i < input.length; i++) {
            let char: string = input.at(i)!;
            if (chars.includes(char)) {
                return i;
            }
        }
        return -1;
    }
}

export = JsonhNumberParser;