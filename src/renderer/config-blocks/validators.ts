import { GridScript } from "@intechstudio/grid-protocol";

export class Validator {
  private result: boolean;

  constructor(private value: any) {
    this.result = true;
  }

  public isLuaValue() {
    if (this.result)
      this.result = GridScript.checkSyntax(`variable=(${this.value})`);
    return this;
  }

  public isLuaVariable() {
    if (this.result)
      this.result = GridScript.checkSyntax(`${this.value}=value`);
    return this;
  }

  public Result() {
    return this.result;
  }

  public Equals(x: number) {
    if (this.result) this.result = Number(this.value) === x;
    return this;
  }

  public NotEquals(x: number) {
    if (this.result) this.result = Number(this.value) !== x;
    return this;
  }

  public Less(x: number) {
    if (this.result) this.result = Number(this.value) < x;
    return this;
  }

  public LessEqual(x: number) {
    if (this.result) this.result = Number(this.value) <= x;
    return this;
  }

  public Greater(x: number) {
    if (this.result) this.result = Number(this.value) > x;
    return this;
  }

  public GreaterEqual(x: number) {
    if (this.result) this.result = Number(this.value) >= x;
    return this;
  }

  public Between(x: number, y: number) {
    if (this.result) this.Greater(x).Less(y);
    return this;
  }

  public InRange(x: number, y: number) {
    if (this.result) this.GreaterEqual(x).LessEqual(y);
    return this;
  }

  public NotEmpty() {
    if (this.result) this.result = String(this.value) !== "";
    return this;
  }

  public Empty() {
    if (this.result) this.result = String(this.value) === "";
    return this;
  }
}

export const parenthesis = function (expression) {
  let stack = [];
  let current;
  const matchLookup = {
    "(": ")",
    "[": "]",
    "{": "}",
  };
  for (let i = 0; i < expression.length; i++) {
    current = expression[i]; //easier than writing it over and over

    if (current === "(" || current === "[" || current === "{") {
      stack.push(current);
    } else if (current === ")" || current === "]" || current === "}") {
      const lastBracket = stack.pop();

      if (matchLookup[lastBracket] !== current) {
        //if the stack is empty, .pop() returns undefined, so this expression is still correct

        return false; //terminate immediately - no need to continue scanning the string
      }
    }
  }
  return stack.length === 0; //any elements mean brackets left open
};
