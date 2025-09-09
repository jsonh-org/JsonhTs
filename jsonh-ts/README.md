<img src="https://github.com/jsonh-org/Jsonh/blob/main/IconUpscaled.png?raw=true" width=180>

[![NPM](https://img.shields.io/npm/v/jsonh-ts.svg)](https://www.npmjs.com/package/jsonh-ts)

**JSON for Humans.**

JSON is great. Until you miss that trailing comma... or want to use comments. What about multiline strings?
JSONH provides a much more elegant way to write JSON that's designed for humans rather than machines.

Since JSONH is compatible with JSON, any JSONH syntax can be represented with equivalent JSON.

## JsonhTs

JsonhTs is a parser implementation of [JSONH v1](https://github.com/jsonh-org/Jsonh) for TypeScript/JavaScript.

## Example

```jsonh
{
    // use #, // or /**/ comments
    
    // quotes are optional
    keys: without quotes,

    // commas are optional
    isn\'t: {
        that: cool? # yes
    }

    // use multiline strings
    haiku: '''
        Let me die in spring
          beneath the cherry blossoms
            while the moon is full.
        '''
    
    // compatible with JSON5
    key: 0xDEADCAFE

    // or use JSON
    "old school": 1337
}
```

## Usage

Everything you need is contained within `JsonhReader`:

```
npm install jsonh-ts
```

```ts
// TypeScript

import { JsonhReader } from "jsonh-ts";

let jsonh: string = `
{
    this is: awesome
}
`;
let element: string = JsonhReader.parseElementFromString<string>(jsonh).value;
```

```js
// JavaScript

const { JsonhReader } = require("jsonh-ts");

let jsonh = `
{
    this is: awesome
}
`;
let element = JsonhReader.parseElementFromString(jsonh).value;
```

## Dependencies

- ES2022
- [vitest-dev/vitest](https://github.com/vitest-dev/vitest) (v3.2.4)

## Limitations

In comparison to [JsonhCs](https://github.com/jsonh-org/JsonhCs), this TypeScript implementation has some limitations.

### Fixed-size numbers

Numbers are parsed as `number`.
In general, these are 64-bit and have a range of about 9 quintillion and a precision of about 15 decimal places.