export const parameter_parser = function(param){
  if(param !== "" && param !== undefined){

    let temp_param = [];
    let temp_array = Array.from(param);

    temp_array.forEach((p,i)=>{
      temp_param.push(p.charCodeAt(0))
    })

    let parameter;

    if (temp_param[0] < 91 && temp_param[0] > 64 ){
      parameter = String.fromCharCode(...temp_param);
    }else{
      parameter = parseInt("0x"+String.fromCharCode(...temp_param));    
    }

    return parameter
  }
}

export const check_for_matching_value = function (list, parameter, index) {
  let defined = list[index].find(item => item.value === parameter);
  defined ? defined = defined.info : null;
  return defined;
}
