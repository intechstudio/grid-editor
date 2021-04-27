import { _V } from './user-interface/advanced-input/string-manipulation.js';
const lua = require('luaparse');

export const FUNCTIONS = [
  {type: 'function', allowed: ['encoder', 'potentiometer', 'button', 'fader'], blacklist: ['CODEBLOCK'], desc:'if', value: 'if', parameters: paramArray(3)},
  {type: 'function', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'abs', value: 'abs', parameters: paramArray(1)},
  {type: 'function', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'sqrt', value: 'sqrt', parameters: paramArray(1)},
  {type: 'function', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'sin', value: 'sin', parameters: paramArray(1)},
  {type: 'function', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'cos', value: 'cos', parameters: paramArray(1)},

  {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'*', value: '\\*'}, 
  {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'+', value: '\\+'}, 
  {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'-', value: '\\-'}, 
  {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'(', value: '\\('},
  {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:')', value: '\\)'}, 
  {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'%', value: '\\%'},
  {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'/', value: '\\/'},
  {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'==', value: '\\=='},
  {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'!=', value: '\\=='},
  {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'>=', value: '\\=='},

  {type: 'setter', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'setDefaultBankColor', value: 'bank_set_default_color', parameters: paramArray(5)},
  {type: 'setter', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'setActiveBank', value: 'bank_set_active', parameters: paramArray(1)},

  {type: 'setter', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'setElementDefaultNumber', value: 'set_element_default_number', parameters: paramArray(2)},
  {type: 'setter', allowed: ['encoder'], desc: 'setEncoderVelocityParameters', value: 'set_encoder_velocity_parameters', parameters: paramArray(3)},

  {type: 'getter', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'getAbsoluteValue', value: 'get_absolute_value', parameters: paramArray(2)} ,
  {type: 'getter', allowed: ['encoder'], desc: 'getRelativeChange', value: 'get_relative_change', parameters: paramArray(1)},

  {type: 'action', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'midi', value: 'ms', parameters: paramArray(4)},
  {type: 'action', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'ledColor', value: 'lsc', parameters: paramArray(5)},
  {type: 'action', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'ledPhase', value: 'lsp', parameters: paramArray(3)},
  {type: 'action', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'ledMode', value: 'lsm', parameters: paramArray(2)},
  {type: 'action', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'keyboardMacro', value: 'kms', parameters: paramArray(6)},
  {type: 'action', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'keyboardChange', value: 'kcs', parameters: paramArray(2)},

  {type: 'variable', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'elapsedTime', value: 'elapsed_time'},
  {type: 'variable', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'activeBank', value: 'active_bank'},
  {type: 'variable', allowed: ['encoder'], desc: 'relativeChange', value: 'relative_change'},
  {type: 'variable', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'absoluteValue', value: 'absolute_value'}
]

export const GRID_ACTIONS = [
  // meta: --@ + code -> action identifier
  {meta: 'ms', type: 'standard', desc: 'MIDI', component: 'MIDI', baseFunction: 'midi_send', script: 'ms("","","","")', parameters: paramArray(4)},
  {meta: 'lsp', type: 'standard', desc: 'LED Phase', component: 'LEDPHASE', baseFunction: 'led_set_phase', script: 'lsp("","","","")', parameters: paramArray(3)},
  {meta: 'kms', type: 'standard', desc: 'Macro', component: 'MACRO', baseFunction: 'keyboard_macro_send', script: 'kms("","","","")', parameters: paramArray(6)},
  {meta: 'kcs', type: 'standard', desc: 'Keyboard', component: 'KEYBOARD', baseFunction: 'keyboard_change_send',script: 'kcs("","","","")', parameters: paramArray(6)},
  {meta: 'cb', type: 'standard', desc: 'Code Block', component: 'CODEBLOCK', parameters: []},
  {meta: 'if', type: 'modifier', desc: 'If', component: 'IF',  baseFunction: 'if', script: 'if true'},
  {meta: 'then', type: 'modifier', desc: 'Then', component: 'THEN', baseFunction: 'then', script: 'then'},
  {meta: 'elseif', type: 'modifier', desc: 'Else If', component: 'ELSEIF',  baseFunction: 'elseif'},
  {meta: 'else', type: 'modifier', desc: 'Else', component: 'ELSE',  baseFunction: 'else'},
  {meta: 'end', type: 'modifier', desc: 'End', component: 'END', baseFunction: 'end', script: 'end'}
];

const _v = _V;
_v.initialize(FUNCTIONS);

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
    
    obj.meta = arr[0];
    obj.script = arr[1];
    
    return obj;
  });


  let actionArray = [];
  scriptParts.forEach((element,index) => {
    // TODO: if undefined find... revert to codeblock!
    actionArray = [...actionArray, {...GRID_ACTIONS.find(a => a.meta == element.meta), script: element.script, id: index}];
  });

  console.log('scriptParts', actionArray);

  return actionArray;
}

// Helpers for actions // modifiers.

export function scriptToAction({script, inputLabels}){
  let actions = inputLabels.map(i => ''); // make empty array for right amount of input fields
  const splitExpr = _v.exprSplit(script);
  const jsonArray = _v.splitExprToArray(splitExpr);
  if(_v.isJson(jsonArray)){
    actions = JSON.parse(_v.splitExprToArray(splitExpr));
  } else {
    console.error('error with json, continue.')
  }
  return actions;
}