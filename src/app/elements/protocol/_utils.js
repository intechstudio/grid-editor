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
        array = [...array, ...mapper(object[key], 'button', ['button'])]
      }

      if(key == 'E'){
        array = [...array, ...mapper(object[key], 'encoder', ['encoder'])]
      }

      if(key == 'G'){
        array = [...array, ...mapper(object[key], 'global', ['encoder', 'button', 'potmeter'])]
      }

      if(key == 'P'){
        array = [...array, ...mapper(object[key], 'potmeter', ['potmeter'])]
      }

    }

    return array;
}

export function createNestedObject( base, names, value ) {
    // If a value is given, remove the last name and keep it for later:
    var lastName = arguments.length === 3 ? names.pop() : false;

    // Walk the hierarchy, creating new objects where needed.
    // If the lastName was removed, then the last object is not set yet:
    for( var i = 0; i < names.length; i++ ) {
        base = base[ names[i] ] = base[ names[i] ] || {};
    }

    // If a value was given, set it to the last name:
    if( lastName ) base = base[ lastName ] = value;

    // Return the last object in the hierarchy:
    return base;
};