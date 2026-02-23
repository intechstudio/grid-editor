/*

Vitest for testing the local variable action block
### *** NOT *** Acceptable
- empty string
- `space in the name`
- `123`
- `num*2`
- `1hello`
- any non latin letters
- any string containing any Lua operators
- Especially test the ',' (comma) operator
- Any of the reserved lua keywords

  `and       break     do        else      elseif
     end       false     for       function  if
     in        local     nil       not       or
     repeat    return    then      true      until     while`

### Acceptable
Any string alphanumerical (latin) + '_' that does not start with a number

- `num`
- `variable2`
- `variable_name3`
- `_hiddenVar`


*/

import { describe, it, expect } from "vitest";

import { checkVariableName } from "../validators/local_validator.mjs";

describe("validator --[[@l]] / variable name", () => {
  it("should return FALSE if it contains any special characters", () => {
    expect(checkVariableName("my*Var")).toBe(false);
    expect(checkVariableName("my-Var")).toBe(false);
    expect(checkVariableName("my,")).toBe(false);
    expect(checkVariableName("myVar*2")).toBe(false);
  });

  it("should return FALSE if it starts with a number", () => {
    expect(checkVariableName("1variable")).toBe(false);
  });

  it("should return FALSE if it only contains numbers", () => {
    expect(checkVariableName("123")).toBe(false);
  });

  it("should return FALSE if it contains a space", () => {
    expect(checkVariableName("variable name")).toBe(false);
  });

  it("should return FALSE if it contains any non-latin character", () => {
    expect(checkVariableName("variableNém")).toBe(false);
  });

  it("should return FALSE for empty string", () => {
    expect(checkVariableName("")).toBe(false);
  });

  it("should return FALSE if it matches any of the reserved lua keywords", () => {
    expect(checkVariableName("and")).toBe(false);
    expect(checkVariableName("break")).toBe(false);
    expect(checkVariableName("do")).toBe(false);
    expect(checkVariableName("else")).toBe(false);
    expect(checkVariableName("elseif")).toBe(false);
    expect(checkVariableName("end")).toBe(false);
    expect(checkVariableName("false")).toBe(false);
    expect(checkVariableName("for")).toBe(false);
    expect(checkVariableName("function")).toBe(false);
    expect(checkVariableName("if")).toBe(false);
    expect(checkVariableName("in")).toBe(false);
    expect(checkVariableName("local")).toBe(false);
    expect(checkVariableName("nil")).toBe(false);
    expect(checkVariableName("not")).toBe(false);
    expect(checkVariableName("or")).toBe(false);
    expect(checkVariableName("repeat")).toBe(false);
    expect(checkVariableName("return")).toBe(false);
    expect(checkVariableName("then")).toBe(false);
    expect(checkVariableName("true")).toBe(false);
    expect(checkVariableName("until")).toBe(false);
    expect(checkVariableName("while")).toBe(false);
  });

  it("should return TRUE if it only part of it matches any of the reserved lua keywords", () => {
    expect(checkVariableName("and2")).toBe(true);
    expect(checkVariableName("do_a_break")).toBe(true);
    expect(checkVariableName("variable_else")).toBe(true);
  });

  it("should return TRUE if any decent variable name is given", () => {
    expect(checkVariableName("variableName")).toBe(true);
    expect(checkVariableName("VariableName2")).toBe(true);
    expect(checkVariableName("my_var")).toBe(true);
  });
});
