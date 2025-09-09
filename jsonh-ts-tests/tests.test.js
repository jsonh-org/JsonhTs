import { JsonhReader, JsonTokenType, JsonhNumberParser, valueOrThrow } from "../jsonh-ts/build/index.js"
import { expect, test } from 'vitest'

/*
    Read Tests
*/

test("BasicObjectTest", () => {
    let jsonh = `
{
    "a": "b"
}
`;
    let reader = JsonhReader.fromString(jsonh);
    let tokens = [... reader.readElement()];

    for (let token of tokens) {
        expect(token).not.toBeInstanceOf(Error);
    }
    expect(tokens[0].jsonType).toBe(JsonTokenType.StartObject);
    expect(tokens[1].jsonType).toBe(JsonTokenType.PropertyName);
    expect(tokens[1].value).toBe("a");
    expect(tokens[2].jsonType).toBe(JsonTokenType.String);
    expect(tokens[2].value).toBe("b");
    expect(tokens[3].jsonType).toBe(JsonTokenType.EndObject);
});

/*
    Parse Tests
*/

test("EscapeSequenceTest", () => {
    let jsonh = `
"\\U0001F47D and \\uD83D\\uDC7D"
`;
    let element = valueOrThrow(JsonhReader.parseElementFromString(jsonh));

    expect(element).toBe("👽 and 👽");
});

test("QuotelessEscapeSequenceTest", () => {
    let jsonh = `
\\U0001F47D and \\uD83D\\uDC7D
`;
    let element = valueOrThrow(JsonhReader.parseElementFromString(jsonh));

    expect(element).toBe("👽 and 👽");
});

test("MultiQuotedStringTest", () => {
    let jsonh = `
""""
  Hello! Here's a quote: ". Now a double quote: "". And a triple quote! """. Escape: \\\\\\U0001F47D.
 """"
`;
    let element = valueOrThrow(JsonhReader.parseElementFromString(jsonh));

    expect(element).toBe(" Hello! Here's a quote: \". Now a double quote: \"\". And a triple quote! \"\"\". Escape: \\👽.");
});

test("ArrayTest", () => {
    let jsonh = `
[
    1, 2,
    3
    4 5, 6
]
`;
    let element = valueOrThrow(JsonhReader.parseElementFromString(jsonh));

    expect(element.length).toBe(5);
    expect(element[0]).toBe(1);
    expect(element[1]).toBe(2);
    expect(element[2]).toBe(3);
    expect(element[3]).toBe("4 5");
    expect(element[4]).toBe(6);
});

test("NumberParserTest", () => {
    expect(Math.trunc(JsonhNumberParser.parse("1.2e3.4"))).toBe(3014);
});

test("BracelessObjectTest", () => {
    let jsonh = `
a: b
c : d
`;
    let element = valueOrThrow(JsonhReader.parseElementFromString(jsonh));

    expect(Object.keys(element).length).toBe(2);
    expect(element["a"]).toBe("b");
    expect(element["c"]).toBe("d");
});

test("CommentTest", () => {
    let jsonh = `
[
    1 # hash comment
        2 // line comment
        3 /* block comment */, 4
]
`;
    let element = valueOrThrow(JsonhReader.parseElementFromString(jsonh));

    expect(element.length).toBe(4);
    expect(element[0]).toBe(1);
    expect(element[1]).toBe(2);
    expect(element[2]).toBe(3);
    expect(element[3]).toBe(4);
});

/*
    Edge Case Tests
*/

test("QuotelessStringStartingWithKeywordTest", () => {
    let jsonh = `
[nulla, null b, null]
`;
    let element = valueOrThrow(JsonhReader.parseElementFromString(jsonh));

    expect(element.length).toBe(3);
    expect(element[0]).toBe("nulla");
    expect(element[1]).toBe("null b");
    expect(element[2]).toBe(null);
});

test("BracelessObjectWithInvalidValueTest", () => {
    let jsonh = `
a: {
`;
    expect(JsonhReader.parseElementFromString(jsonh)).toBeInstanceOf(Error);
});

test("NestedBracelessObjectTest", () => {
    let jsonh = `
[
    a: b
    c: d
]
`;
    expect(JsonhReader.parseElementFromString(jsonh)).toBeInstanceOf(Error);
});

test("QuotelessStringsLeadingTrailingWhitespaceTest", () => {
    let jsonh = `
[
    a b  , 
]
`;
    let element = valueOrThrow(JsonhReader.parseElementFromString(jsonh));

    expect(element.length).toBe(1);
    expect(element[0]).toBe("a b");
});

test("SpaceInQuotelessPropertyNameTest", () => {
    let jsonh = `
{
    a b: c d
}
`;
    let element = valueOrThrow(JsonhReader.parseElementFromString(jsonh));

    expect(Object.keys(element).length).toBe(1);
    expect(element["a b"]).toBe("c d");
});

test("QuotelessStringsEscapeTest", () => {
    let jsonh = `
a: \\"5
b: \\\\z
c: 5 \\\\
`;
    let element = valueOrThrow(JsonhReader.parseElementFromString(jsonh));

    expect(Object.keys(element).length).toBe(3);
    expect(element["a"]).toBe("\"5");
    expect(element["b"]).toBe("\\z");
    expect(element["c"]).toBe("5 \\");
});

test("MultiQuotedStringsNoLastNewlineWhitespaceTest", () => {
    let jsonh = `
"""
  hello world  """
`;
    let element = valueOrThrow(JsonhReader.parseElementFromString(jsonh));

    expect(element).toBe("\n  hello world  ");
});

test("MultiQuotedStringsNoFirstWhitespaceNewlineTest", () => {
    let jsonh = `
"""  hello world
  """
`;
    let element = valueOrThrow(JsonhReader.parseElementFromString(jsonh));

    expect(element).toBe("  hello world\n  ");
});

test("QuotelessStringsEscapedLeadingTrailingWhitespaceTest", () => {
    let jsonh = `
\nZ\ \r
`;
    let element = valueOrThrow(JsonhReader.parseElementFromString(jsonh));

    expect(element).toBe("Z");
});

test("HexNumberWithETest", () => {
    let jsonh = `
0x5e3
`;

    expect(valueOrThrow(JsonhReader.parseElementFromString(jsonh))).toBe(0x5e3);

    let jsonh2 = `
0x5e+3
`;

    expect(valueOrThrow(JsonhReader.parseElementFromString(jsonh2))).toBe(5000);
});

test("NumberWithRepeatedUnderscoresTest", () => {
    let jsonh = `
100__000
`;

    expect(valueOrThrow(JsonhReader.parseElementFromString(jsonh))).toBe(100_000);
});

test("NumberWithUnderscoreAfterBaseSpecifierTest", () => {
    let jsonh = `
0b_100
`;

    expect(valueOrThrow(JsonhReader.parseElementFromString(jsonh))).toBe(0b100);
});

test("NegativeNumberWithBaseSpecifierTest", () => {
    let jsonh = `
-0x5
`;

    expect(valueOrThrow(JsonhReader.parseElementFromString(jsonh))).toBe(-0x5);
});

test("NumberDotTest", () => {
    let jsonh = `
.
`;

    expect(valueOrThrow(JsonhReader.parseElementFromString(jsonh))).toBeTypeOf("string");
    expect(valueOrThrow(JsonhReader.parseElementFromString(jsonh))).toBe(".");

    let jsonh2 = `
-.
`;

    expect(valueOrThrow(JsonhReader.parseElementFromString(jsonh2))).toBeTypeOf("string");
    expect(valueOrThrow(JsonhReader.parseElementFromString(jsonh2))).toBe("-.");
});

test("DuplicatePropertyNameTest", () => {
    let jsonh = `
{
  a: 1,
  c: 2,
  a: 3,
}
`;

    expect(valueOrThrow(JsonhReader.parseElementFromString(jsonh))).toStrictEqual({
        a: 1,
        c: 2,
        a: 3,
    });
});

test("EmptyNumberTest", () => {
    let jsonh = `
0e
`;

    expect(valueOrThrow(JsonhReader.parseElementFromString(jsonh))).toBeTypeOf("string");
    expect(valueOrThrow(JsonhReader.parseElementFromString(jsonh))).toBe("0e");
});