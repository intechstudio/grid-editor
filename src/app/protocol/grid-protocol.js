import * as grid_protocol from '../../external/grid-protocol/grid_protocol_nightly.json';

import { createNestedObject, returnDeepestObjects, mapObjectsToArray } from './_utils.js';
import { editor_lua_properties } from './editor-properties.js';
import { sendDataToClient } from '../debug/tower.js';


// global id for serial message generation
let global_id = 0;


// helper functions
const utility_genId  = () => {
  if((global_id / 255) == 1){
    global_id = 0;
  }
  return global_id += 1;
}

const moduleLookup = (hwcfg) => {
  var HWCFG = grid.properties.HWCFG;
  let type = '';
  for (const key in HWCFG) {
    if(HWCFG[key] == hwcfg){
      return type = key;
    }
  }
}

const param2lower = (parameters) => {
  let obj = {}
  for (const key in parameters) {
    const _key = key.toLowerCase();
    obj[_key] = parameters[key]
  }
  return obj;
}

const convert_header_to_grid = (MODULE_INFO, DESTINATION) => {

  // convert editor runtime module info to grid brc parameters

  let DX = 0;
  let DY = 0;
  let SX = 0;
  let SY = 0;
  let ROT = 0;

  if(MODULE_INFO !== ''){
    if(DESTINATION == 'LOCAL'){
      DX = +MODULE_INFO.dx + 127;
      DY = +MODULE_INFO.dy + 127;
      SX = 0; // +MODULE_INFO.sx + 127
      SY = 0; // +MODULE_INFO.sy + 127;
      ROT = MODULE_INFO.rot;
    }
  }
  return {ROT, DX, DY, SX, SY};
}

// control element event assignment table.
const CEEAT = { 

  undef: {
    desc: 'UNDEFINED',
    value: '-1',
    key: 'UNDEFINED'
  },

  init: {
    desc: 'init',
    value: '0',
    key: 'INIT'
  },

  potmeter: {
    desc: 'potmeter',
    value: '1',
    key: 'AC'
  },

  encoder: {
    desc: 'encoder',
    value: '2',
    key: 'EC'
  },

  button: {
    desc: 'button',
    value: '3',
    key: 'BC'
  },

  map: {
    desc: 'utility',
    value: '4',
    key: 'MAP'
  },

  midirx: {
    desc: 'midi rx',
    value: '5',
    key: 'MIDIRX'
  },

  timer: {
    desc: 'timer',
    value: '6',
    key: 'TIMER'
  }

}

// default module elements at specific positions
let moduleElements = {
  PO16: [
    'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer',
    'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer',
    'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer',
    'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer',
  ],
  PBF4: [
    'potentiometer', 'potentiometer', 'potentiometer', 'potentiometer',
    'fader', 'fader', 'fader', 'fader', 
    'button', 'button', 'button', 'button', 
  ],
  BU16: [
    'button','button','button','button',
    'button','button','button','button',
    'button','button','button','button',
    'button','button','button','button',
  ],
  EN16: [
    'encoder', 'encoder', 'encoder', 'encoder',
    'encoder', 'encoder', 'encoder', 'encoder',
    'encoder', 'encoder', 'encoder', 'encoder',
    'encoder', 'encoder', 'encoder', 'encoder'        
  ]
}

// add utility (system events) control element or map mode at 255 
moduleElements['BU16'][255] = 'utility';
moduleElements['EN16'][255] = 'utility';
moduleElements['PBF4'][255] = 'utility';
moduleElements['PO16'][255] = 'utility';

// elementEvents based on control element type and the CEEA table
const elementEvents = {
  button: [ CEEAT.init, CEEAT.button, CEEAT.timer ],
  potentiometer: [ CEEAT.init, CEEAT.potmeter, CEEAT.timer ],
  fader: [ CEEAT.init, CEEAT.potmeter,CEEAT.timer ],
  blank: [ CEEAT.undef ],
  encoder: [CEEAT.init, CEEAT.button, CEEAT.encoder, CEEAT.timer ],
  utility: [CEEAT.init, CEEAT.map, CEEAT.midirx, CEEAT.timer]
}

const grid = {
  
  properties: (function (){

    let HWCFG = {};
    let CONST = {};
    let INSTR = {};
    let CLASSES = {};
    let EVENTS = {};
    let LUA = {};
    let BRC = {};  
    let VERSION = {};
    let PARAMETERS = {};
    let HEARTBEAT_INTERVAL = 0;
    let CONFIG_LENGTH = 0;

    for (const key in grid_protocol) {
      if(typeof grid_protocol[key] !== 'object'){

        // GRID MODULE HWCFGS
        if(key.startsWith('GRID_MODULE_')){
          let paramName = key.substr('GRID_MODULE_'.length);
          HWCFG[paramName] = +grid_protocol[key];
        }

        // GRID HEARTBEAT INTERVAL
        if(key == 'GRID_PARAMETER_HEARTBEAT_interval'){
          HEARTBEAT_INTERVAL = +grid_protocol[key];
        }

        if(key == 'GRID_PARAMETER_ACTIONSTRING_maxlength'){
          CONFIG_LENGTH = +grid_protocol[key];
        }

        // GRID INSTRUCTIONS
        if(key.startsWith('GRID_INSTR')){
          let paramName = key.slice(11).slice(0,-5);
          let dec = parseInt(grid_protocol[key], 16); 
          INSTR[paramName] = dec;
        }
        
        // GRID CONSTS TO CONSTRUCT SERIAL DATA
        if(key.startsWith('GRID_CONST')){
          let paramName = key.slice(11);
          let dec = parseInt(grid_protocol[key], 16); 
          CONST[paramName] = dec;
        }       

        // GRID TEMPLATE PARAMETERS
        if(key.startsWith('GRID_PARAMETER_TEMPLATEINDEX_')){
          const param = key.substr('GRID_PARAMETER_TEMPLATEINDEX_'.length).slice(0,-5);
          PARAMETERS[param] = grid_protocol[key];
        }

        // GRID PROTOCOL VERSION
        if(key.startsWith('GRID_PROTOCOL_VERSION_')){
          const param = key.substr('GRID_PROTOCOL_VERSION_'.length);
          VERSION[param] = +grid_protocol[key];
        }       

        // GRID BRC
        if(key.startsWith('GRID_BRC_')){
          let paramSet = key.split('_');
          let value = grid_protocol[key];
          if(paramSet[paramSet.length-1] !== "frame"){
            createNestedObject( BRC, paramSet.slice(2,), value )
          }
        }

        // GRID EVENT TYPES
        if(key.startsWith('GRID_EVENT')){
          let paramSet = key.split('_');
          EVENTS[paramSet[2]] = grid_protocol[key];
        }

        // GRID LUA PROPERTIES
        if(key.startsWith('GRID_LUA_FNC_') && !/_ACTION_/gm.test(key) && !/_LIST_/gm.test(key)){
          let paramSet = key.split('_');
          let value = grid_protocol[key];
          createNestedObject( LUA, paramSet.slice(3,), value )
        }

        // GRID LUA KEYWORDS
        if(key.startsWith('GRID_LUA_KW_')){
          let paramSet = key.split('_');
          let value = grid_protocol[key];
          createNestedObject( LUA, paramSet.slice(2,), value )
        }

        // GRID CLASSES
        if(key.startsWith('GRID_CLASS_')){
          let paramSet = key.split('_');
          let value = grid_protocol[key];
          if(paramSet[paramSet.length-1] !== "frame"){ // not sure why fram is unsupported...
            createNestedObject( CLASSES, paramSet.slice(2,), value);
          }
        }
      }
    }



    return {
      BRC: BRC , 
      LUA: extendLua(LUA),
      CLASSES: CLASSES, 
      HWCFG: HWCFG, 
      EVENTS: EVENTS,
      CONST: CONST,
      INSTR: INSTR,
      VERSION: VERSION,
      PARAMETERS: PARAMETERS,
      HEARTBEAT_INTERVAL: HEARTBEAT_INTERVAL,
      CONFIG_LENGTH: CONFIG_LENGTH,
      SESSION: Math.floor(Math.random()*255).toString(16).padStart(2, '0')
    }

    function extendLua(propObject){
      const deepObjects = returnDeepestObjects(propObject);
      const array = mapObjectsToArray(editor_lua_properties, deepObjects);
      return array;
    }



  }()),

  translate: {

    encode: function (HEADER, DESTINATION, CLASS_NAME, INSTR_CODE, PARAMETERS){

      function encode_class_parameters(PARAMETERS, INFO){
        let _parameters = [];
        if(PARAMETERS !== ''){
          PARAMETERS.forEach(CLASS => {     
            for (const key in CLASS) {
              let param = [];
              if(key == 'ACTIONSTRING'){
                for (let index = 0; index < CLASS[key].length; index++) {
                  param[index] = CLASS[key].charCodeAt(index);
                }
              } else {
                let p = CLASS[key].toString(16).padStart(INFO[key].length,'0');
                for (let i = 0; i < INFO[key].length; i++) {
                  param[i] = p.charCodeAt(i)            
                }
              } 
              _parameters = [..._parameters, ...param];
            }
          })
        }
        return _parameters;
      }

      const BRC = convert_header_to_grid(HEADER, DESTINATION);
  
      const PROTOCOL = grid.properties;
  
      const prepend = [PROTOCOL.CONST.SOH, PROTOCOL.CONST.BRC];

      const ID = utility_genId()
      
      let BRC_PARAMETERS = [
        {ID: ID}, 
        {SESSION: PROTOCOL.SESSION}, // ON PROTOCOL INIT, THIS IS GENERATED!
        {SX: 0},
        {SY: 0},
        {DX: BRC.DX}, 
        {DY: BRC.DY}, 
        {ROT: BRC.ROT},
        {MSGAGE: 0}
      ];
  
      BRC_PARAMETERS = encode_class_parameters(BRC_PARAMETERS, PROTOCOL['BRC']);
  
      let command = '';  
      
      // should build a generic error handler!
      let CLASS = '';
      try {
        CLASS = PROTOCOL.CLASSES[CLASS_NAME].code.slice(2,)
      } catch (error) {
        console.error(`Cannot find CLASS code: ${CLASS_NAME} in protocol!`);
      }

      command = [
        PROTOCOL.CONST.STX,
        ...[CLASS.charCodeAt(0), CLASS.charCodeAt(1), CLASS.charCodeAt(2)],
        PROTOCOL.INSTR[INSTR_CODE].toString(16).charCodeAt(0),
        ...encode_class_parameters(PARAMETERS, PROTOCOL.CLASSES[CLASS_NAME]),
        PROTOCOL.CONST.ETX
      ]
       
      const append = [
        PROTOCOL.CONST.EOB,
        ...command ,
        PROTOCOL.CONST.EOT
      ]
  
      let message = prepend.concat(BRC_PARAMETERS, append);
  
      // maybe 4
      let length = (message.length+2).toString(16).padStart(4,'0');
      length = [length.charCodeAt(0), length.charCodeAt(1), length.charCodeAt(2), length.charCodeAt(3)]
      message = [...message.slice(0,2), ...length, ...message.slice(2,)];
  
      let checksum = [...message].reduce((a, b) => a ^ b).toString(16).padStart(2,'0');
  
      message = [...message, checksum.charCodeAt(0), checksum.charCodeAt(1)];
  
      return {serial: message, id: ID}; // return id for checking communication issues
    },

    encode_debugger: function (brc, command){

      const PROTOCOL = grid.properties;
  
      const prepend = String.fromCharCode(PROTOCOL.CONST.SOH) + String.fromCharCode(PROTOCOL.CONST.BRC);
  
      const ID = utility_genId()
      
      let BRC_PARAMETERS = [
        ID, 
        PROTOCOL.SESSION, // ON PROTOCOL INIT, THIS IS GENERATED!
        0,
        0,
        +brc.dx, 
        +brc.dy, 
        0,
        0
      ];

      let params = '';
      BRC_PARAMETERS.forEach(param => {
        params += param.toString(16).padStart(2, '0');
      })
       
      const append = 
        String.fromCharCode(PROTOCOL.CONST.EOB) + 
        command +
        String.fromCharCode(PROTOCOL.CONST.EOT);
  
      let message = prepend.concat(params, append);
  
      message = message.slice(0,2) + (message.length+2).toString(16).padStart(4, '0') + message.slice(2,);
  
      let checksum = [...message].map(a => a.charCodeAt(0)).reduce((a, b) => a ^ b).toString(16); 
  
      message = message + checksum;
  
      return message;
    },
  
    decode: function(data){

      function check_checksum(data){

        let first_section = data.slice(0,-2);

        let last_two_char = data.slice(-2);

        last_two_char[0] = String.fromCharCode(last_two_char[0]);
        last_two_char[1] = String.fromCharCode(last_two_char[1]);

        let str = last_two_char[0] + last_two_char[1];

        let cross_math = 0;

        first_section.forEach(e => { cross_math ^= e});

        cross_math = cross_math % 256;

        cross_math = parseInt(cross_math).toString(16).padStart(2,'0');

        let bool = cross_math === str;

        if(!bool){
          console.error('Checksum mismatch!', cross_math, str)
        }

        return bool;
      }

      function prepare_serial_data(data) {

        let temp_array = Array.from(data);
        let array = [];

        for (let index = 0; index < temp_array.length; index+=2) {
          array.push((temp_array[index] + '' + temp_array[index+1])) 
        }

        let _array = [];

        array.forEach((element, i) => {
          _array[i] = parseInt('0x'+element);
        });   

        // websocket debug info to client
        sendDataToClient('input', _array);

        return _array;
      }

      function build_decoder(mode, array, id, data, index){
        const CLASSES = grid.properties.CLASSES;
        const INSTR = grid.properties.INSTR;
        
        // CLASS BUILD
        let class_name = '';
        if(data.length > 3 && mode == 'config'){
          class_name = parseInt("0x"+String.fromCharCode(data[index+1], data[index+2], data[index+3]));
        }
    
        if(mode == 'main' && !(data[index] == 2 && data[index+1] == 48 && data[index+2] == 3)){      
          class_name = parseInt("0x"+String.fromCharCode(data[index+1], data[index+2], data[index+3]));
        }
    
        // INSTR DETECTION
        let instr = parseInt('0x'+String.fromCharCode(data[index+4]));
    
        let rawFlag = true;
        for (const key in INSTR){
          if(INSTR[key] == instr){ 
            instr = key;
          }
        }       

        //console.log(class_name)
    
        for (const key in CLASSES){
          if(parseInt(CLASSES[key].code, 16) == class_name){ 
            array.push({id: id, class: key, offset: index, instr: instr});  
            rawFlag = false;   
          }
        }    
    
        if(rawFlag){
          array.push({id: id, class: "RAW", offset: index, instr: instr}); 
        }
          
        return array;
      }

      function decode_by_code(serialData, classCode){

        // BRC AND CLASSES ARE IN DIFFERENT HIERARCHY
        const CLASS = classCode == 'BRC' ? grid.properties.BRC : grid.properties.CLASSES[classCode];
        
        let object = {}

        for (const param in CLASS) {
          // offset and length are numbers, handle them accordingly!
          let _value = serialData.slice(
            +CLASS[param].offset, +CLASS[param].length + +CLASS[param].offset
          );    
          let value;
          
          if (_value[0] < 91 && _value[0] > 64 ){
            value = String.fromCharCode(..._value);
          }else{
            value = parseInt("0x"+String.fromCharCode(..._value));    
          }
           
          if(param == 'DX' || param == 'DY' || param == 'SX' || param == 'SY' ){
            object[param] = value - 127;
          } else {
            object[param] = value;
          }
        }

        return object;
        
      }

      function decode_by_class(serialData, decoded){

        let DATA = {};
    
        DATA.BRC = decode_by_code(serialData, 'BRC');
    
        // grid protocol specific parsing and data manipulation

        decoded.forEach((obj)=>{

          let array = serialData.slice(+obj.offset, +obj.length + +obj.offset);
                 

          if(obj.class == "EVENT"){

            if(DATA.EVENT){
              DATA.EVENT = [...DATA.EVENT, decode_by_code(array, obj.class)];
            } else {
              DATA.EVENT = [decode_by_code(array, obj.class)]
            }

            if(DATA.EVENT[DATA.EVENT.length-1].EVENTTYPE == 1){
              DATA.EVENTPARAM = DATA.EVENT;
            }
          }
                
          if(obj.class == "HEARTBEAT"){
            if(!(DATA.BRC.SX == -127 && DATA.BRC.SY == -127)){
              DATA.HEARTBEAT = decode_by_code(array, obj.class);
            }
          }

          if(obj.class == "PAGEACTIVE"){
            DATA.PAGEACTIVE = decode_by_code(array, obj.class);
          }

          if(obj.class == "PAGECOUNT"){
            DATA.PAGECOUNT = decode_by_code(array, obj.class);
          }

          if(obj.class == "DEBUGTEXT"){

            const arr = array.slice(5,);

            DATA.DEBUGTEXT = String.fromCharCode(...arr);

            if(DATA.DEBUGTEXT.includes('page change is disabled')){
              DATA.LOG = {type: 'alert', classname: 'pagechange', message: 'Store your config before switching pages!'}
            }

/*          if(DATA.DEBUGTEXT.includes('store complete')){
              DATA.LOG = {type: 'success', message: 'Store complete!'}
            }

            if(DATA.DEBUGTEXT.includes('clear complete')){
              DATA.LOG = {type: 'success', message: 'Clear complete!'}
            }
 */
          }

          if(obj.class == "MIDI"){
            DATA.MIDI = decode_by_code(array, obj.class);
            DATA.MIDI.INSTR = obj.instr;
          }

          if(obj.class == "PAGESTORE"){
            if(obj.instr == "ACKNOWLEDGE"){
              DATA.PAGESTORE_ACKNOWLEDGE = decode_by_code(array, obj.class);
            }
          }

          if(obj.class == "PAGECLEAR"){
            if(obj.instr == "ACKNOWLEDGE"){
              DATA.PAGECLEAR_ACKNOWLEDGE = decode_by_code(array, obj.class);
            }
          }

          if(obj.class == "PAGEDISCARD"){
            if(obj.instr == "ACKNOWLEDGE"){
              DATA.PAGEDISCARD_ACKNOWLEDGE = decode_by_code(array, obj.class);
            }
          }

          if(obj.class == "NVMERASE"){
            if(obj.instr == "ACKNOWLEDGE"){
              DATA.NVMERASE_ACKNOWLEDGE = decode_by_code(array, obj.class);
            }
          }

          if(obj.class == "CONFIG"){

            // if config report is not coming in after a fetch -> check
            // if check return with different id, refetch and restart the sync

            if(obj.instr == "REPORT"){
              try {
                DATA.CONFIG_REPORT = decode_by_code(array, obj.class);
                DATA.LUA = '<?lua' + String.fromCharCode.apply(String, serialData).split('<?lua')[1].split('?>')[0] + '?>'
              } catch (error) {
                console.error("Probably an 'expr' in CONFIG REPORT!");
              }
            }

            if(obj.instr == "ACKNOWLEDGE"){
              DATA.CONFIG_ACKNOWLEDGE = decode_by_code(array, obj.class);
            }

            if(obj.instr == "NACKNOWLEDGE"){
              DATA.CONFIG_NACKNOWLEDGE = decode_by_code(array, obj.class);
            }

          }    
        });

    
        return DATA;
      }
   
      let _decoded = [];
      let id = 0; 

      let serialData = prepare_serial_data(data);

      if(check_checksum(serialData)){

        serialData.forEach((element,i) => {  
      
          // GRID_CONST_STX -> LENGTH:3 CLASS_code 0xYYY
          if(element == 2){ 
            id = ""+ i +"";
            _decoded = build_decoder('main', _decoded, id, serialData, i);    
          }
    
          // GRID_CONST_ETX
          if(element == 3){
            let obj = _decoded.find(o => o.id === id);
            if(obj !== undefined){
              obj.length = i - obj.offset;
            }
          }
        });

        return decode_by_class(serialData, _decoded)

      } else {
        
        return false;

      }
      
    }
  },

  device: {
  
    createPage: function(moduleType, pageStatus = 'INIT', pageNumber = 0){

        moduleType = moduleType.substr(0,4);
      
        let control_elements = [];

        let status = pageStatus;

        try {

          const elementsArrayLength = moduleElements[moduleType].length;

           // control elements
          for (let i = 0; i < elementsArrayLength; i++) {
            if(moduleElements[moduleType][i]){
              let events = [];
              for (let j=0; j < elementEvents[moduleElements[moduleType][i]].length; j++) {
                events.push({        
                  event: elementEvents[moduleElements[moduleType][i]][j], 
                  config: "",
                  cfgStatus: "NULL"
                })
              }
              control_elements[i] = {events: events, controlElementNumber: i, controlElementType: moduleElements[moduleType][i]};
            }
          }

          control_elements = control_elements.filter(x => x); // filter null or invalid items!

          return {status, pageNumber: pageNumber, control_elements};
          
        } catch (error) {
          
          console.error('Error while creating page for ', moduleType, error)

        }
        
    },

    make: function(header, heartbeat, virtual){

      let moduleType = moduleLookup(heartbeat.HWCFG);

      let controller = {
        // implement the module id rep / req
        id: "",
        dx: "",
        dy: "",
        fwVersion: {
          major: "",
          minor: "",
          patch: ""
        },
        alive: Date.now(),
        virtual: "",
        map: {
          top: {dx: "", dy: "",},
          right: {dx: "", dy: ""},
          bot: {dx: "", dy: ""},
          left: {dx: "", dy: ""},
        },
        rot: "",
        isConnectedByUsb: "",
        isLanding: "",
        pages: [], // consider naming to "local"
        global: {}
      }

      // generic check, code below if works only if all parameters are provided
      if(header !== undefined && moduleType !== undefined && heartbeat !== undefined){
        
        header = param2lower(header);

        moduleType = moduleType.substr(0,4);

        controller = {
          // implement the module id rep / req
          id: moduleType + '_' + 'dx:' + header.sx + ';dy:' + header.sy,
          dx: header.sx,
          dy: header.sy,
          rot: header.rot,
          fwVersion: {
            major: heartbeat.VMAJOR,
            minor: heartbeat.VMINOR,
            patch: heartbeat.VPATCH,
          },
          alive: Date.now(),
          virtual: virtual,
          map: {
            top: {dx: header.sx, dy: header.sy+1},
            right: {dx: header.sx+1, dy: header.sy},
            bot: {dx: header.sx, dy: header.sy-1},
            left: {dx: header.sx-1, dy: header.sy},
          },
          isConnectedByUsb: (header.sx == 0 && header.sy == 0) ? true : false,
          isLanding: false,
          pages: [this.createPage(moduleType)],
          global: {  
            bankColors: [[255,0,0],[255,0,0],[255,0,0],[255,0,0]],
            bankEnabled: [true,true,true,true],
            cfgStatus: virtual ? 'not_expected' : 'ok'
          }
        }
        
      }

      
      return controller;
  
    }

  }
}

console.log(grid.properties)

export default grid;