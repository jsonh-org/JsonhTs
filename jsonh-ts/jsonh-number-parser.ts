import Result = require("./result.js");

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
    static parse(jsonhNumber: string): Result<number> {
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
        let number: Result<number> = this.#parseFractionalNumberWithExponent(digits, baseDigits);
        if (number.isError) {
            return number;
        }

        // Apply sign
        if (sign !== 1) {
            number.value *= sign;
        }
        return number;
    }

    /**
     * Converts a fractional number with an exponent (e.g. `12.3e4.5`) from the given base (e.g. `01234567`) to a base-10 real.
     */
    static #parseFractionalNumberWithExponent(digits: string, baseDigits: string): Result<number> {
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
        let mantissa: Result<number> = this.#parseFractionalNumber(mantissaPart, baseDigits);
        if (mantissa.isError) {
            return mantissa;
        }
        let exponent: Result<number> = this.#parseFractionalNumber(exponentPart, baseDigits);
        if (exponent.isError) {
            return exponent;
        }

        // Multiply mantissa by 10 ^ exponent
        return Result.fromValue(mantissa.value * (10 ** exponent.value));
    }
    /**
     * Converts a fractional number (e.g. `123.45`) from the given base (e.g. `01234567`) to a base-10 real.
     */
    static #parseFractionalNumber(digits: string, baseDigits: string): Result<number> {
        // Optimization for base-10 digits
        if (baseDigits === "0123456789") {
            return Result.fromValue(Number.parseFloat(digits));
        }

        // Find dot
        let dotIndex: number = digits.indexOf('.');
        // If no dot then normalize integer
        if (dotIndex < 0) {
            return this.#parseWholeNumber(digits, baseDigits);
        }

        // Get parts of number
        let wholePart: string = digits.slice(0, dotIndex);
        let fractionPart: string = digits.slice(dotIndex + 1);

        // Parse parts of number
        let whole: Result<number> = this.#parseWholeNumber(wholePart, baseDigits);
        if (whole.isError) {
            return whole;
        }
        let fraction: Result<number> = this.#parseWholeNumber(fractionPart, baseDigits);
        if (fraction.isError) {
            return fraction;
        }

        // Get fraction leading zeroes
        let fractionLeadingZeroes: string = "";
        for (let index: number = 0; index < fractionPart.length; index++) {
            let char: string = fractionPart.at(index)!;
            if (char === '0') {
                fractionLeadingZeroes += '0';
            }
            else {
                break;
            }
        }

        // Combine whole and fraction
        let whole_digits: String = whole.value.toString();
        let fraction_digits: String = fraction.value.toString();
        return Result.fromValue(Number.parseFloat(whole_digits + '.' + fractionLeadingZeroes + fraction_digits));
    }
    /**
     * Converts a whole number (e.g. `12345`) from the given base (e.g. `01234567`) to a base-10 integer.
     */
    static #parseWholeNumber(digits: string, baseDigits: string): Result<number> {
        // Optimization for base-10 digits
        if (baseDigits === "0123456789") {
            return Result.fromValue(Number.parseInt(digits));
        }

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
                return Result.fromError(new Error(`Invalid digit: '${digitChar}'`));
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
        return Result.fromValue(integer);
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