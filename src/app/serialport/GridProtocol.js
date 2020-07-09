import * as grid_protocol from '../../external/grid-protocol/grid_protocol.json';
import {GRID_CONTROLLER} from './GridController.js';

var global_id = 0;

var PROTOCOL = {};

export var GRID_PROTOCOL = {
  
  initialize: function(){

    let CONTROLLER = {};
    let CONST = {};
    let CLASSES = {};
    let BRC = {};
    let HEARTBEAT = {};
    let MIDIRELATIVE = {};
    let BANKACTIVE = {};
    let VERSION = {};

    for (const key in grid_protocol) {
      if(typeof grid_protocol[key] !== 'object'){

        // GRID MODULE HWCFGS
        if(key.startsWith('GRID_MODULE_')){
          let paramName = key.substr('GRID_MODULE_'.length);
          CONTROLLER[paramName] = +grid_protocol[key];
        }

        // GRID CONSTS
        if(key.startsWith('GRID_CONST')){
          let paramName = key.slice(11);
          let dec = parseInt(grid_protocol[key], 16); 
          CONST[paramName] = dec;
        } 

        // GRID VERSION
        if(key.startsWith('GRID_PROTOCOL_VERSION_')){
          const param = key.substr('GRID_PROTOCOL_VERSION_'.length);
          VERSION[param] = +grid_protocol[key];
        }

        // GRID BROADCAST 
        else if(key.startsWith('GRID_BRC_') && key['GRID_BRC_'.length] == key['GRID_BRC_'.length].toUpperCase()){    
          const param = key.substr('GRID_BRC_'.length).split('_');
          BRC[param[0]] = {offset: 0, length: 0};
        } 

        // GRID CLASS XXX CODES
        else if(key.startsWith('GRID_CLASS_') && key.slice(-4) == 'code'){
          CLASSES[key.slice('GRID_CLASS_'.length).slice(0,-5)] = +grid_protocol[key];
        }

        // GRID CLASS HEARTBEAT
        else if(key.startsWith('GRID_CLASS_HEARTBEAT_') && key['GRID_CLASS_HEARTBEAT_'.length] == key['GRID_CLASS_HEARTBEAT_'.length].toUpperCase()){
          const param = key.substr('GRID_CLASS_HEARTBEAT_'.length).split('_');
          HEARTBEAT[param[0]] = {offset: 0, length: 0};
        }

        // GRID CLASS MIDIRELATIVE
        else if(key.startsWith('GRID_CLASS_MIDIRELATIVE_') && key['GRID_CLASS_MIDIRELATIVE_'.length] == key['GRID_CLASS_MIDIRELATIVE_'.length].toUpperCase()){
          const param = key.substr('GRID_CLASS_MIDIRELATIVE_'.length).split('_');
          MIDIRELATIVE[param[0]] = {offset: 0, length: 0};
        }

        // GRID CLASS BANKACTICE
        else if(key.startsWith('GRID_CLASS_BANKACTIVE_') && key['GRID_CLASS_BANKACTIVE_'.length] == key['GRID_CLASS_BANKACTIVE_'.length].toUpperCase()){
          const param = key.substr('GRID_CLASS_BANKACTIVE_'.length).split('_');
          BANKACTIVE[param[0]] = {offset: 0, length: 0};
        }

      }
    } 

    for (const key in grid_protocol) {
      if(typeof grid_protocol[key] !== 'object'){
        if(key.startsWith('GRID_BRC_') && key['GRID_BRC_'.length] == key['GRID_BRC_'.length].toUpperCase()){
          const param = key.substr('GRID_BRC_'.length).split('_');
          BRC[param[0]][param[1]] = +grid_protocol[key];
        }
        if(key.startsWith('GRID_CLASS_HEARTBEAT_') && key['GRID_CLASS_HEARTBEAT_'.length] == key['GRID_CLASS_HEARTBEAT_'.length].toUpperCase()){
          const param = key.substr('GRID_CLASS_HEARTBEAT_'.length).split('_');
          HEARTBEAT[param[0]][param[1]] = +grid_protocol[key];
        }
        if(key.startsWith('GRID_CLASS_MIDIRELATIVE_') && key['GRID_CLASS_MIDIRELATIVE_'.length] == key['GRID_CLASS_MIDIRELATIVE_'.length].toUpperCase()){
          const param = key.substr('GRID_CLASS_MIDIRELATIVE_'.length).split('_');
          MIDIRELATIVE[param[0]][param[1]] = +grid_protocol[key];
        }
        if(key.startsWith('GRID_CLASS_BANKACTIVE_') && key['GRID_CLASS_BANKACTIVE_'.length] == key['GRID_CLASS_BANKACTIVE_'.length].toUpperCase()){
          const param = key.substr('GRID_CLASS_BANKACTIVE_'.length).split('_');
          BANKACTIVE[param[0]][param[1]] = +grid_protocol[key];
        }
      }
    }

    this.PROTOCOL = {
      CONST: CONST, 
      BRC: BRC , 
      CLASSES: CLASSES, 
      HEARTBEAT: HEARTBEAT, 
      MIDIRELATIVE: MIDIRELATIVE, 
      CONTROLLER: CONTROLLER, 
      BANKACTIVE: BANKACTIVE,
      VERSION: VERSION
    }
    
  },

  decode: function(serialData){
    /**
     * 
     * Slices serial data between STX 0x02 and ETX 0x03 for further processing by GRID_CLASS_XXX_code's.
     * 
     */
    var CLASSES = this.PROTOCOL.CLASSES;
    let _decoded = [];
    let class_name = '';
    let id = 0; 
    serialData.forEach((element,i) => {  
      // GRID_CONST_STX -> LENGTH:3 CLASS_code 0xYYY
      if(element == 2){ 
        class_name = parseInt("0x"+String.fromCharCode(serialData[i+1], serialData[i+2], serialData[i+3]));
        id = ""+ i +"";
        for (const param in CLASSES){
          if(CLASSES[param] == class_name){ 
            _decoded.push({id: id, class: param, offset: i});     
          }
        }
      }
      // GRID_CONST_ETX
      if(element == 3){
        let obj = _decoded.find(o => o.id === id);
        obj.length = i - obj.offset;
      }
    });
    
    return this.decode_by_class(serialData, _decoded);

  },

  decode_by_class: function(serialData, decoded){

    let DATA = {};

    DATA.BRC = this.decode_by_code(serialData, 'BRC');

    decoded.forEach((obj)=>{

      let array = serialData.slice(obj.offset, obj.length + obj.offset);

      if(obj.class == "HEARTBEAT"){
        DATA.HEARTBEAT = this.decode_by_code(array, obj.class);
        let moduleType = this.utility_moduleLookup(DATA.HEARTBEAT.HWCFG);
        DATA.CONTROLLER = GRID_CONTROLLER.create(DATA.BRC, moduleType, false)
      }
      if(obj.class == "MIDIRELATIVE"){
        DATA.MIDIRELATIVE = this.decode_by_code(array, obj.class);
      }
      if(obj.class == "BANKACTIVE"){
        DATA.BANKACTIVE = this.decode_by_code(array, obj.class)
      }
    });

    return DATA;
  },

  decode_by_code: function(serialData, classCode){
    var CLASS = this.PROTOCOL[classCode];
    var object = {}
    for (const param in CLASS) {
      let _value = serialData.slice(
        CLASS[param].offset, CLASS[param].length + CLASS[param].offset
      );    
      let value = parseInt("0x"+String.fromCharCode(..._value));   
      if(param == 'DX' || param == 'DY'){
        object[param] = value - 127;
      } else {
        object[param] = value;
      }
      
    }
    return object;
  },

  encode: function (msg){
    const PROTOCOL = this.PROTOCOL;

    const prepend = String.fromCharCode(PROTOCOL.CONST.SOH) + String.fromCharCode(PROTOCOL.CONST.BRC);

    let BRC_PARAMETERS = [
      this.utility_genId(), 127, 127, 255, 0
    ];

    let params = '';
    BRC_PARAMETERS.forEach(param => {
      params += param.toString(16).padStart(2, '0');
    })

    console.log(PROTOCOL.CLASSES['BANKACTIVE'].toString(16).padStart(2, '0'), String.fromCharCode(101), msg.detail.selectedBank.toString(16).padStart(2, '0') )
    
    const append = 
      String.fromCharCode(PROTOCOL.CONST.EOB) + 
      String.fromCharCode(PROTOCOL.CONST.STX) +
      PROTOCOL.CLASSES['BANKACTIVE'].toString(16).padStart(3, '0') +
      String.fromCharCode(102) +
      msg.detail.selectedBank.toString(16).padStart(2, '0') + 
      String.fromCharCode(PROTOCOL.CONST.ETX) + 
      String.fromCharCode(PROTOCOL.CONST.EOT);

    let message = prepend + params + append;

    console.log('len: ',message.length + 2);

    message = message.slice(0,2) + (message.length+2).toString(16).padStart(2, '0') + message.slice(2,);

    let checksum = [...message].map(a => a.charCodeAt(0)).reduce((a, b) => a ^ b).toString(16); 

    message = message + checksum;

    console.log(message);

    return message;
  },

  utility_genId: function() {
    if((global_id / 255) == 1){
      global_id = 0;
    }
    return global_id += 1;
  },
  
  utility_moduleLookup: function(hwcfg){
    var CONTROLLER = this.PROTOCOL.CONTROLLER;
    let type = '';
    for (const key in CONTROLLER) {
      if(CONTROLLER[key] == hwcfg)
        return type = key;
      }
  },
}