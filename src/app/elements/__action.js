
import { GRID_PROTOCOL } from '../core/classes/GridProtocol.js';
import { _V } from './user-interface/advanced-input/string-manipulation.js';
const lua = require('luaparse');

const GRID = GRID_PROTOCOL;
GRID.initialize();
const LUA = GRID.PROTOCOL.LUA;

const _FUNCTIONS = [
  // code OPERATORS https://www.tutorialspoint.com/code/code_operators.htm
  {type: 'arithmetic_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], code: '\\*',  human:'*', }, 
  {type: 'arithmetic_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], code: '\\+',  human:'+', }, 
  {type: 'arithmetic_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], code: '\\-',  human:'-',}, 
  {type: 'arithmetic_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], code: '\\%',  human:'%', },
  {type: 'arithmetic_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], code: '\\/',  human:'/',},
  {type: 'arithmetic_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], code: '\\^',  human:'^', },

  {type: 'relational_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], code: '==',   human:'==' },
  {type: 'relational_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], code: '~=',   human:'~=' },
  {type: 'relational_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], code: '>',    human:'>' },
  {type: 'relational_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], code: '<',    human:'<' },
  {type: 'relational_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], code: '>=',   human:'>='},
  {type: 'relational_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], code: '<=',   human:'<=' },

  {type: 'logical_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'],  code: 'and',  human:'and'},
  {type: 'logical_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'],  code: 'or',   human:'or'},
  {type: 'logical_operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'],  code: 'not',  human:'not'},

]

export const FUNCTIONS = () => {
  console.log('called');
  let fnc = _FUNCTIONS;

  const objs = findItem(LUA);

  fnc = mapObjects(fnc, objs);
  console.log(fnc);
  return fnc;
}

function findItem (obj) {
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

function mapObjects (fnc, object){

  function mapper(arr, type){
    return arr = arr.map((e, i) => {
      return {type: type, ...e }
    })
  }

  for (const key in object) {

    if(key == 'B'){
      fnc = [...fnc, ...mapper(object[key], 'button')]
    }

    if(key == 'E'){
      fnc = [...fnc, ...mapper(object[key], 'encoder')]
    }

    if(key == 'G'){
      fnc = [...fnc, ...mapper(object[key], 'global')]
    }

    if(key == 'P'){
      fnc = [...fnc, ...mapper(object[key], 'potmeter')]
    }

  }

  return fnc;
}


export const GRID_ACTIONS = [
  // meta: --@ + code -> action identifier
  {code: 'locals', human: 'locals',        type: 'standard', desc: 'Local Definitions', component: 'LOCALS',    script: '',                 parameterNames: ['Local 1']},
  {code: 'gms',    human: 'midi_send',     type: 'standard', desc: 'MIDI',              component: 'MIDI',      script: 'midi_send(,,,)',   parameterNames: ['Channel', 'Command', 'Parameter 1', 'Parameter 2']},
  {code: 'glsp',   human: 'led_value',     type: 'standard', desc: 'LED Phase',         component: 'LEDPHASE',  script: 'led_value(,,)',    parameterNames: ['LED Number', 'Layer', 'Intensity']},
  {code: 'gsk',    human: 'keyboard_send', type: 'standard', desc: 'Macro',             component: 'MACRO',     script: 'keyboard_send()',  parameterNames: ['Keys']},
  
  {code: 'ecb',    human: 'code_block', type: 'standard', desc: 'Code Block', component: 'CODEBLOCK', script: 'print()'},

  {code: 'if',     human: 'if',      type: 'modifier', desc: 'If',       component: 'IF',      script: 'if (true)'},
  {code: 'elseif', human: 'elseif',  type: 'modifier', desc: 'Else If',  component: 'ELSEIF',  script: 'else if true'},
  {code: 'else',   human: 'else',    type: 'modifier', desc: 'Else',     component: 'ELSE'},
  {code: 'end',    human: 'end',     type: 'modifier', desc: 'End',      component: 'END'}
];

const _v = _V;
_v.initialize(FUNCTIONS());

function paramArray(num) {
  let arr = [];
  for (let i = 0; i < num; i++) {
    arr.push(i);
  }
  return arr;
}

export function luaParser(actions, comments){
  const code = actions;
  let parser = '';
  try {
    const _p = lua.parse(code);
    //const _p = parse(code);
    parser = 'ok';
  } catch (error) {
    console.log(error);
    parser = error.message;
  } 
  return parser;
}

export function rawParser(script){

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


  let actionArray = [];
  scriptParts.forEach((element,index) => {
    // TODO: if undefined find... revert to codeblock!
    actionArray = [...actionArray, {...GRID_ACTIONS.find(a => a.code == element.code), script: element.script, id: index}];
  });

  return actionArray;
}

// Helpers for actions // modifiers.

// this had to be moved out of locals function, as array refresh was killed by $ with scriptSegments..
export function localsToAction({script}){
  const text = script.split('local');
  let _script = [];
  text.forEach(element => {
    if(element !== ''){
      const _split = element.split('=');
      _script.push({variable: _split[0].trim(), value: _split[1].trim()});
    }
  });
  return _script;
}

export function scriptToAction({human, script, length}){

  // get the part after function name with parenthesis
  let _script = script.split(human)[1];
  // remove parenthesis
  _script = _script.slice(1, -1);
  // split by comma to make array
  _script = _script.split(',');

  return _script;

  /**
   * 
   * This part below has been used when we let expressions in input fields.
   * It handles unknown empty strings, undefined functions and variables badly.
   * Yet its an ok baseground for validators, as spltExprToArray is cool.
   * 
   */

  /*
  let actions = parameterNames.map(i => ""); // make empty array for right amount of input fields
  const splitExpr = _v.exprSplit(script);
  console.log('splitexpr...', splitExpr)
  const jsonArray = _v.splitExprToArray(splitExpr);
  console.log('jsonarray...',jsonArray);
  if(_v.isJson(jsonArray)){
    actions = JSON.parse(_v.splitExprToArray(splitExpr));
  } else {
    console.warn("Part of script is not a valid JSON, continue!")
  }
  return actions;
  */
}