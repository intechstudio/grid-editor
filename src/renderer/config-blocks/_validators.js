export class Validator {
  #value;
  #result = true;
  constructor(value) {
    this.#value = value;
  }

  Result() {
    return this.#result;
  }

  Equals(x) {
    if (this.#result) this.#result = Number(this.#value) === x;
    return this;
  }

  NotEquals(x) {
    if (this.#result) this.#result = Number(this.#value) !== x;
    return this;
  }

  Less(x) {
    if (this.#result) this.#result = Number(this.#value) < x;
    return this;
  }

  LessEqual(x) {
    if (this.#result) this.#result = Number(this.#value) <= x;
    return this;
  }

  Greater(x) {
    if (this.#result) this.#result = Number(this.#value) > x;
    return this;
  }

  GreaterEqual(x) {
    if (this.#result) this.#result = Number(this.#value) >= x;
    return this;
  }

  Between(x, y) {
    if (this.#result) this.Greater(x).Less(y);
    return this;
  }

  InRange(x, y) {
    if (this.#result) this.GreaterEqual(x).LessEqual(y);
    return this;
  }

  NotEmpty() {
    if (this.#result) this.#result = String(this.#value) !== "";
    return this;
  }

  Empty() {
    if (this.#result) this.#result = String(this.#value) === "";
    return this;
  }

  Contains(arr) {
    if (this.#result) this.#result = arr.includes(this.#value);
    return this;
  }
}

const _v = {
  check: function (value = 0) {
    this.value = value;

    this.valid = 1;

    this.min = function (mn) {
      Number(this.value) <= mn - 1 ? (this.valid = 0) : null;
      return this;
    };

    this.max = function (mx) {
      Number(this.value) >= mx + 1 ? (this.valid = 0) : null;
      return this;
    };

    this.isLocal = function (arr) {
      if (this.valid == 0 && !arr.includes(this.value)) {
        this.valid = 0;
      } else {
        this.valid = 1;
      }
      return this;
    };

    this.result = function () {
      return this.valid;
    };
  },
};

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

export default _v;
