import { JsonhReader } from "../jsonh-ts/build/index.js";

let jsonh: string = `
{
    this is: awesome
}
`;
let element: string = JsonhReader.parseElementFromString<string>(jsonh).value;

console.log(element);