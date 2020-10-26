export const parameter_parser = function(param){
  let flag = true;
  for (var i = 0; i < param.length; i++) {
    if(param.charAt(i) == param.charAt(i).toUpperCase()){
      flag = false;
    }
  }
  let parameter;
  if(isNaN(parseInt(param))){
    parameter = param;  
  } else if(flag){
    parameter = parseInt(param)
  } else {
    parameter = param;
  }
  return parameter;
}

export const check_for_matching_value = function (list, parameter, index) {
  let defined = list[index].find(item => item.value === parameter);
  defined ? defined = defined.info : null;
  return defined;
}
