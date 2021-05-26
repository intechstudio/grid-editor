const validate = function(value){

  this.value = value;

  this.valid = 1;

  this.min = function(mn){
    value <= mn ? this.valid = 0 : null;
    return this;
  }

  this.max = function(mx){
    value >= mx ? this.valid = 0 : null;
    return this;
  }

  this.result = function(){
    return this.valid
  }

}

export default validate;