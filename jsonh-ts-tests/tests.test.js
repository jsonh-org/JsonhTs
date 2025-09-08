import { JsonhReader, JsonTokenType } from "../jsonh-ts/build/index.js"
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