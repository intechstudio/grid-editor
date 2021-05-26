const validate = (value) => {
  this.valid = 0;
  this.value = value;

  this.min = (mn) => {
    value >= mn ? valid = 1 : valid = 0;
  }

  this.max = (mx) => {
    value <= mx ? valid = 1 : valid = 0;
  }
  
  return {
    max,
    min,
    valid
  }
}

export default validate;