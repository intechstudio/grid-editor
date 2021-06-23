export function returnDeepestObjects (obj){
    var found = {};                
    let parent = '';

    function _find(obj, d) {       
        for (var key in obj) {     
            if(d == 0){
              parent = key;
              found[parent] = [];
            }
            
            if (typeof obj[key] === 'object') { 
                _find(obj[key], d + 1);
            } else{
          
            if(found[parent].indexOf(obj) == -1){
              found[parent].push(obj)
            }
          }
        }
    }
    _find(obj, 0);                 

    return found;
}

export function mapObjectsToArray (array, object){

    function mapper(baseArray, type, allowed){
      return baseArray = baseArray.map((e, i) => {
        return {type: type, allowed: allowed, ...e }
      })
    }

    for (const key in object) {

      if(key == 'B'){
        array = [...array, ...mapper(object[key], 'button', ['3'])]
      }

      if(key == 'E'){
        array = [...array, ...mapper(object[key], 'encoder', ['2'])]
      }

      if(key == 'G'){
        array = [...array, ...mapper(object[key], 'global', ['2', '3', '1'])]
      }

      if(key == 'P'){
        array = [...array, ...mapper(object[key], 'potmeter', ['1'])]
      }

      if(key == "KW"){
        array = [...array, ...mapper(object[key], 'keyword', ['1','2','3'])]
      }

    }

    return array;
}

export function createNestedObject( base, names, value ) {

    // to avoid array property overwriting
    let _names = [...names]; 

    // If a value is given, remove the last name and keep it for later:
    var lastName = arguments.length === 3 ? _names.pop() : false;

    // Walk the hierarchy, creating new objects where needed.
    // If the lastName was removed, then the last object is not set yet:
    for( var i = 0; i < _names.length; i++ ) {
        base = base[ _names[i] ] = base[ _names[i] ] || {};
    }

    // If a value was given, set it to the last name:
    if( lastName ) base = base[ lastName ] = value;


    // Return the last object in the hierarchy:
    return base;
};

export const pParser = function(param){
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

    return parameter
  }
}