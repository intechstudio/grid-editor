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
