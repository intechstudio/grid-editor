const lua = require('luaparse');

export function luaParser({config}){
  let parser = '';
  try {
    lua.parse(config);
    parser = 'ok';
  } catch (error) {
    console.log(error);
    parser = error.message;
  } 
  return parser;
}


export function rawLuaScriptToConfigList({script}){

  // splt by meta comments
  let scriptParts = script.split('--@');

  // filter empty elements
  scriptParts = scriptParts.filter(function(el){ return el != ""});

  // get the action name
  const regexp = /^([^\s]+)|([^\s].*)+/g; // pay attention to multiline or single line flag! "m"
  
  // make an array of action names and script parts
  scriptParts = scriptParts.map((element) => {
    let obj = {code: '', script: ''};

    let arr= [];
    let testy;
    while ((testy = regexp.exec(element)) !== null) {
      arr.push(testy[0])
    }
    
    obj.code = arr[0];
    obj.script = arr[1];
    
    return obj;
  });


  let configArray = [];
  scriptParts.forEach((element,index) => {
    // TODO: if undefined find... revert to codeblock!
    configArray = [...configArray, {script: element.script, id: index}];
  });

  return configArray;
}

export function localsToConfig({script}){
  // this had to be moved out of locals function, as array refresh was killed by $ with scriptSegments..
  const text = script.split('local');
  let config = [];
  text.forEach(element => {
    if(element !== ''){
      const _split = element.split('=');
      config.push({variable: _split[0].trim(), value: _split[1].trim()});
    }
  });
  return config;
}

export function scriptToConfig({script, human}){

  // get the part after function name with parenthesis
  let config = script.split(human)[1];
  // remove parenthesis
  config = config.slice(1, -1);
  // split by comma to make array
  config = config.split(',');

  return config;
}

export function configToScript ({human = '', array = []}){
  let code = human; // prepend with type
  const _unformatted = JSON.stringify(array);
  [..._unformatted].forEach(e => {
    if(e == '['){ code += '(' }
    else if(e == ']') { code += ')'}
    else if(e == "\"") { /* no return */ }
    else { code += e }
  })
  return code;
}

export function isJson (str){
  try {
      JSON.parse(str);
  } catch (e) {
      return false;
  }
  return true;
}

export function isLua (script){
  try {
      lua.parse(script);
  } catch (err) {
      return false
  }
  return true;
}