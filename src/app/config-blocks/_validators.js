function validate (value) {
  
  _valid = 0;

  this.min = (mn) => {
    value >= mn ? this._valid = 1 : this._valid = 0;
    return this
  }

  this.max = (mx) => {
    value <= mx ? this._valid = 1 : this._valid = 0;
    return this
  }
  
  return {
    max: this.max,
    min: this.min,
  }
}

export default validate;