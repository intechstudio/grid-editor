/*

Mocha/Chai for testing the local variable action block 
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

import { expect } from "chai";

import { checkVariableName } from "../src/renderer/validators/local_validator.mjs";

describe("validator --[[@l]] / variable name", () => {
  it("should return FALSE if it contains any special characters", () => {
    expect(checkVariableName("my*Var")).to.be.false;
    expect(checkVariableName("my-Var")).to.be.false;
    expect(checkVariableName("my,")).to.be.false;
    expect(checkVariableName("myVar*2")).to.be.false;
  });

  it("should return FALSE if it starts with a number", () => {
    expect(checkVariableName("1variable")).to.be.false;
  });

  it("should return FALSE if it only contains numbers", () => {
    expect(checkVariableName("123")).to.be.false;
  });

  it("should return FALSE if it contains a space", () => {
    expect(checkVariableName("variable name")).to.be.false;
  });

  it("should return FALSE if it contains any non-latin character", () => {
    expect(checkVariableName("variableNém")).to.be.false;
  });

  it("should return FALSE for empty string", () => {
    expect(checkVariableName("")).to.be.false;
  });

  it("should return FALSE if it matches any of the reserved lua keywords", () => {
    expect(checkVariableName("and")).to.be.false;
    expect(checkVariableName("break")).to.be.false;
    expect(checkVariableName("do")).to.be.false;
    expect(checkVariableName("else")).to.be.false;
    expect(checkVariableName("elseif")).to.be.false;
    expect(checkVariableName("end")).to.be.false;
    expect(checkVariableName("false")).to.be.false;
    expect(checkVariableName("for")).to.be.false;
    expect(checkVariableName("function")).to.be.false;
    expect(checkVariableName("if")).to.be.false;
    expect(checkVariableName("in")).to.be.false;
    expect(checkVariableName("local")).to.be.false;
    expect(checkVariableName("nil")).to.be.false;
    expect(checkVariableName("not")).to.be.false;
    expect(checkVariableName("or")).to.be.false;
    expect(checkVariableName("repeat")).to.be.false;
    expect(checkVariableName("return")).to.be.false;
    expect(checkVariableName("then")).to.be.false;
    expect(checkVariableName("true")).to.be.false;
    expect(checkVariableName("until")).to.be.false;
    expect(checkVariableName("while")).to.be.false;
  });

  it("should return TRUE if it only part of it matches any of the reserved lua keywords", () => {
    expect(checkVariableName("and2")).to.be.true;
    expect(checkVariableName("do_a_break")).to.be.true;
    expect(checkVariableName("variable_else")).to.be.true;
  });

  it("should return TRUE if any decent variable name is given", () => {
    expect(checkVariableName("variableName")).to.be.true;
    expect(checkVariableName("VariableName2")).to.be.true;
    expect(checkVariableName("my_var")).to.be.true;
  });
});
