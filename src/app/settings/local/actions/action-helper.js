export const parameter_parser = function(param){
  if(param !== "" && param !== undefined){

    let temp_param = [];
    let temp_array = Array.from(param.toString());

    temp_array.forEach((p,i)=>{
      temp_param.push(p.charCodeAt(0))
    })


    let parameter;

    if (temp_param[0] < 91 && temp_param[0] > 64 ){
      parameter = String.fromCharCode(...temp_param);
    }else{
      // length may be changeable in the future, as padding depends on the specific parameter type
      parameter = parseInt(param).toString(16).padStart(2,'0');
    }

    console.log(parameter);
    return parameter
  }
}

export const check_for_matching_value = function (list, parameter, index) {
  let defined = list[index].find(item => item.value == parameter);
  defined ? defined = defined.info : null;
  return defined;
}