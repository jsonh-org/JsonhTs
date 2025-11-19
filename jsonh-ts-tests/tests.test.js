import { JsonhReader, JsonTokenType, JsonhNumberParser, JsonhReaderOptions, JsonhVersion } from "../jsonh-ts/build/index.js"
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
        expect(token.isError).toBe(false);
    }
    expect(tokens[0].value.jsonType).toBe(JsonTokenType.StartObject);
    expect(tokens[1].value.jsonType).toBe(JsonTokenType.PropertyName);
    expect(tokens[1].value.value).toBe("a");
    expect(tokens[2].value.jsonType).toBe(JsonTokenType.String);
    expect(tokens[2].value.value).toBe("b");
    expect(tokens[3].value.jsonType).toBe(JsonTokenType.EndObject);
});

/*
    Parse Tests
*/

test("EscapeSequenceTest", () => {
    let jsonh = `
"\\U0001F47D and \\uD83D\\uDC7D"
`;
    let element = JsonhReader.parseElementFromString(jsonh).value;

    expect(element).toBe("👽 and 👽");
});

test("QuotelessEscapeSequenceTest", () => {
    let jsonh = `
\\U0001F47D and \\uD83D\\uDC7D
`;
    let element = JsonhReader.parseElementFromString(jsonh).value;

    expect(element).toBe("👽 and 👽");
});

test("MultiQuotedStringTest", () => {
    let jsonh = `
""""
  Hello! Here's a quote: ". Now a double quote: "". And a triple quote! """. Escape: \\\\\\U0001F47D.
 """"
`;
    let element = JsonhReader.parseElementFromString(jsonh).value;

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
    let element = JsonhReader.parseElementFromString(jsonh).value;

    expect(element.length).toBe(5);
    expect(element[0]).toBe(1);
    expect(element[1]).toBe(2);
    expect(element[2]).toBe(3);
    expect(element[3]).toBe("4 5");
    expect(element[4]).toBe(6);
});

test("NumberParserTest", () => {
    expect(Math.trunc(JsonhNumberParser.parse("1.2e3.4").value)).toBe(3014);
});

test("BracelessObjectTest", () => {
    let jsonh = `
a: b
c : d
`;
    let element = JsonhReader.parseElementFromString(jsonh).value;

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
    let element = JsonhReader.parseElementFromString(jsonh).value;

    expect(element.length).toBe(4);
    expect(element[0]).toBe(1);
    expect(element[1]).toBe(2);
    expect(element[2]).toBe(3);
    expect(element[3]).toBe(4);
});

test("VerbatimStringTest", () => {
    let jsonh = `
{
    a\\\\: b\\\\
    @c\\\\: @d\\\\
    @e\\\\: f\\\\
}
`;
    let element = JsonhReader.parseElementFromString(jsonh).value;

    expect(Object.keys(element).length).toBe(3);
    expect(element["a\\"]).toBe("b\\");
    expect(element["c\\\\"]).toBe("d\\\\");
    expect(element["e\\\\"]).toBe("f\\");

    let element2 = JsonhReader.parseElementFromString(jsonh, new JsonhReaderOptions({
        version: JsonhVersion.V1,
    })).value;
    expect(Object.keys(element2).length).toBe(3);
    expect(element2["a\\"]).toBe("b\\");
    expect(element2["@c\\"]).toBe("@d\\");
    expect(element2["@e\\"]).toBe("f\\");

    let jsonh2 = `
@"a\\\\": @'''b\\\\'''
`;
    let element3 = JsonhReader.parseElementFromString(jsonh2).value;

    expect(Object.keys(element3).length).toBe(1);
    expect(element3["a\\\\"]).toBe("b\\\\");
});

/*
    Edge Case Tests
*/

test("QuotelessStringStartingWithKeywordTest", () => {
    let jsonh = `
[nulla, null b, null, @null]
`;
    let element = JsonhReader.parseElementFromString(jsonh).value;

    expect(element.length).toBe(4);
    expect(element[0]).toBe("nulla");
    expect(element[1]).toBe("null b");
    expect(element[2]).toBe(null);
    expect(element[3]).toBe("null");
});

test("BracelessObjectWithInvalidValueTest", () => {
    let jsonh = `
a: {
`;
    expect(JsonhReader.parseElementFromString(jsonh).isError).toBe(true);
});

test("NestedBracelessObjectTest", () => {
    let jsonh = `
[
    a: b
    c: d
]
`;
    expect(JsonhReader.parseElementFromString(jsonh).isError).toBe(true);
});

test("QuotelessStringsLeadingTrailingWhitespaceTest", () => {
    let jsonh = `
[
    a b  , 
]
`;
    let element = JsonhReader.parseElementFromString(jsonh).value;

    expect(element.length).toBe(1);
    expect(element[0]).toBe("a b");
});

test("SpaceInQuotelessPropertyNameTest", () => {
    let jsonh = `
{
    a b: c d
}
`;
    let element = JsonhReader.parseElementFromString(jsonh).value;

    expect(Object.keys(element).length).toBe(1);
    expect(element["a b"]).toBe("c d");
});

test("QuotelessStringsEscapeTest", () => {
    let jsonh = `
a: \\"5
b: \\\\z
c: 5 \\\\
`;
    let element = JsonhReader.parseElementFromString(jsonh).value;

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
    let element = JsonhReader.parseElementFromString(jsonh).value;

    expect(element).toBe("\n  hello world  ");
});

test("MultiQuotedStringsNoFirstWhitespaceNewlineTest", () => {
    let jsonh = `
"""  hello world
  """
`;
    let element = JsonhReader.parseElementFromString(jsonh).value;

    expect(element).toBe("  hello world\n  ");
});

test("QuotelessStringsEscapedLeadingTrailingWhitespaceTest", () => {
    let jsonh = `
\nZ\ \r
`;
    let element = JsonhReader.parseElementFromString(jsonh).value;

    expect(element).toBe("Z");
});

test("HexNumberWithETest", () => {
    let jsonh = `
0x5e3
`;

    expect(JsonhReader.parseElementFromString(jsonh).value).toBe(0x5e3);

    let jsonh2 = `
0x5e+3
`;

    expect(JsonhReader.parseElementFromString(jsonh2).value).toBe(5000);
});

test("NumberWithRepeatedUnderscoresTest", () => {
    let jsonh = `
100__000
`;

    expect(JsonhReader.parseElementFromString(jsonh).value).toBe(100_000);
});

test("NumberWithUnderscoreAfterBaseSpecifierTest", () => {
    let jsonh = `
0b_100
`;

    expect(JsonhReader.parseElementFromString(jsonh).value).toBe(0b100);
});

test("NegativeNumberWithBaseSpecifierTest", () => {
    let jsonh = `
-0x5
`;

    expect(JsonhReader.parseElementFromString(jsonh).value).toBe(-0x5);
});

test("NumberDotTest", () => {
    let jsonh = `
.
`;

    expect(JsonhReader.parseElementFromString(jsonh).value).toBeTypeOf("string");
    expect(JsonhReader.parseElementFromString(jsonh).value).toBe(".");

    let jsonh2 = `
-.
`;

    expect(JsonhReader.parseElementFromString(jsonh2).value).toBeTypeOf("string");
    expect(JsonhReader.parseElementFromString(jsonh2).value).toBe("-.");
});

test("DuplicatePropertyNameTest", () => {
    let jsonh = `
{
  a: 1,
  c: 2,
  a: 3,
}
`;

    expect(JsonhReader.parseElementFromString(jsonh).value).toStrictEqual({
        a: 1,
        c: 2,
        a: 3,
    });
});

test("EmptyNumberTest", () => {
    let jsonh = `
0e
`;

    expect(JsonhReader.parseElementFromString(jsonh).value).toBeTypeOf("string");
    expect(JsonhReader.parseElementFromString(jsonh).value).toBe("0e");
});

test("LeadingZeroWithExponentTest", () => {
    let jsonh = `
[0e4, 0xe, 0xEe+2]
`;

    expect(JsonhReader.parseElementFromString(jsonh).value).toStrictEqual([0e4, 0xe, 1400]);

    let jsonh2 = `
[e+2, 0xe+2, 0oe+2, 0be+2]
`;

    expect(JsonhReader.parseElementFromString(jsonh2).value).toStrictEqual(["e+2", "0xe+2", "0oe+2", "0be+2"]);

    let jsonh3 = `
[0x0e+, 0b0e+_1]
`;

    expect(JsonhReader.parseElementFromString(jsonh3).value).toStrictEqual(["0x0e+", "0b0e+_1"]);
});