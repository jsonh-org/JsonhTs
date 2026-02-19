"use strict";
const Result = require("./result.js");
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
    static parse(jsonhNumber) {
        // Remove underscores
        jsonhNumber = jsonhNumber.replaceAll("_", "");
        let digits = jsonhNumber;
        // Get sign
        let sign = 1;
        if (digits.startsWith('-')) {
            sign = -1;
            digits = digits.slice(1);
        }
        else if (digits.startsWith('+')) {
            sign = 1;
            digits = digits.slice(1);
        }
        // Decimal
        let baseDigits = "0123456789";
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
        let number = this.#parseFractionalNumberWithExponent(digits, baseDigits);
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
    static #parseFractionalNumberWithExponent(digits, baseDigits) {
        // Find exponent
        let exponentIndex = -1;
        // Hexadecimal exponent
        if (baseDigits.includes('e')) {
            for (let index = 0; index < digits.length; index++) {
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
        let mantissaPart = digits.slice(0, exponentIndex);
        let exponentPart = digits.slice(exponentIndex + 1);
        // Parse mantissa and exponent
        let mantissa = this.#parseFractionalNumber(mantissaPart, baseDigits);
        if (mantissa.isError) {
            return mantissa;
        }
        let exponent = this.#parseFractionalNumber(exponentPart, baseDigits);
        if (exponent.isError) {
            return exponent;
        }
        // Multiply mantissa by 10 ^ exponent
        return Result.fromValue(mantissa.value * (10 ** exponent.value));
    }
    /**
     * Converts a fractional number (e.g. `123.45`) from the given base (e.g. `01234567`) to a base-10 real.
     */
    static #parseFractionalNumber(digits, baseDigits) {
        // Optimization for base-10 digits
        if (baseDigits === "0123456789") {
            return Result.fromValue(Number.parseFloat(digits));
        }
        // Find dot
        let dotIndex = digits.indexOf('.');
        // If no dot then normalize integer
        if (dotIndex < 0) {
            return this.#parseWholeNumber(digits, baseDigits);
        }
        // Get parts of number
        let wholePart = digits.slice(0, dotIndex);
        let fractionPart = digits.slice(dotIndex + 1);
        // Parse parts of number
        let whole = this.#parseWholeNumber(wholePart, baseDigits);
        if (whole.isError) {
            return whole;
        }
        let fraction = this.#parseWholeNumber(fractionPart, baseDigits);
        if (fraction.isError) {
            return fraction;
        }
        // Get fraction leading zeroes
        let fractionLeadingZeroes = "";
        for (let index = 0; index < fractionPart.length; index++) {
            let char = fractionPart.at(index);
            if (char === '0') {
                fractionLeadingZeroes += '0';
            }
            else {
                break;
            }
        }
        // Combine whole and fraction
        let whole_digits = whole.value.toString();
        let fraction_digits = fraction.value.toString();
        return Result.fromValue(Number.parseFloat(whole_digits + '.' + fractionLeadingZeroes + fraction_digits));
    }
    /**
     * Converts a whole number (e.g. `12345`) from the given base (e.g. `01234567`) to a base-10 integer.
     */
    static #parseWholeNumber(digits, baseDigits) {
        // Optimization for base-10 digits
        if (baseDigits === "0123456789") {
            return Result.fromValue(Number.parseInt(digits));
        }
        // Get sign
        let sign = 1;
        if (digits.startsWith('-')) {
            sign = -1;
            digits = digits.slice(1);
        }
        else if (digits.startsWith('+')) {
            sign = 1;
            digits = digits.slice(1);
        }
        // Add each column of digits
        let integer = 0;
        for (let index = 0; index < digits.length; index++) {
            // Get current digit
            let digitChar = digits.at(index);
            let digitInt = baseDigits.indexOf(digitChar.toLowerCase());
            // Ensure digit is valid
            if (digitInt < 0) {
                return Result.fromError(new Error(`Invalid digit: '${digitChar}'`));
            }
            // Get magnitude of current digit column
            let columnNumber = digits.length - 1 - index;
            let columnMagnitude = baseDigits.length ** columnNumber;
            // Add value of column
            integer += digitInt * columnMagnitude;
        }
        // Apply sign
        if (sign !== 1) {
            integer *= sign;
        }
        return Result.fromValue(integer);
    }
    static #indexOfAny(input, chars) {
        for (let i = 0; i < input.length; i++) {
            let char = input.at(i);
            if (chars.includes(char)) {
                return i;
            }
        }
        return -1;
    }
}
module.exports = JsonhNumberParser;
//# sourceMappingURL=jsonh-number-parser.js.map