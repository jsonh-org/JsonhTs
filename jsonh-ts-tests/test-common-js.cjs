const { JsonhReader } = require("../jsonh-ts/build/index.js");

let jsonh = `
{
    this is: awesome
}
`;
let element = JsonhReader.parseElementFromString(jsonh).value;

console.log(element);