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

        // GRID BROADCAST 
        else if(key.startsWith('GRID_BRC_') && key['GRID_BRC_'.length] == key['GRID_BRC_'.length].toUpperCase()){    
          const param = key.substr('GRID_BRC_'.length).split('_');
          BRC[param[0]] = {offset: 0, length: 0};
        } 

        // GRID CLASS XXX CODES
        else if(key.startsWith('GRID_CLASS_') && key.slice(-4) == 'code'){
          CLASSES[key.slice('GRID_CLASS_'.length)] = +grid_protocol[key];
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
      }
    }

    this.PROTOCOL = {CONST: CONST, BRC: BRC , CLASSES: CLASSES, HEARTBEAT: HEARTBEAT, MIDIRELATIVE: MIDIRELATIVE, CONTROLLER: CONTROLLER}
    
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

    DATA.HEADER = this.decode_header(serialData);

    decoded.forEach((obj)=>{

      let array = serialData.slice(obj.offset, obj.length + obj.offset);

      if(obj.class == "HEARTBEAT_code"){

        DATA.HEARTBEAT = this.decode_heartbeat(array);
        let moduleType = this.moduleLookup(DATA.HEARTBEAT.HWCFG);
        DATA.CONTROLLER = GRID_CONTROLLER.create(DATA.HEADER, moduleType, false)

      }

      if(obj.class == "MIDIRELATIVE_code"){

        DATA.MIDI = this.decode_midi(array);
       
      }

      
    });

    return DATA;

  },

  decode_heartbeat: function(serialData){
    var HEARTBEAT = this.PROTOCOL.HEARTBEAT;
    var heartbeat = {}
    for (const param in HEARTBEAT) {
      let _value = serialData.slice(
        HEARTBEAT[param].offset, HEARTBEAT[param].length + HEARTBEAT[param].offset
      );    
      let value = parseInt("0x"+String.fromCharCode(..._value));
      heartbeat[param] = value
    }
    return heartbeat
  },

  decode_header: function(serialData){
    var BRC = this.PROTOCOL.BRC;
    var header = {}
    for (const param in BRC) {
      let _value = serialData.slice(
        BRC[param].offset, BRC[param].length + BRC[param].offset
      );    
      let value = parseInt("0x"+String.fromCharCode(..._value));   
      if(param == 'DX' || param == 'DY'){
        header[param] = value - 127;
      } else {
        header[param] = value;
      }
    }
    return header;
  },

  decode_midi: function(serialData){

    var MIDIRELATIVE = this.PROTOCOL.MIDIRELATIVE;
    var midi = {}
    for (const param in MIDIRELATIVE) {
      let _value = serialData.slice(
        MIDIRELATIVE[param].offset, MIDIRELATIVE[param].length + MIDIRELATIVE[param].offset
      );    
      let value = parseInt("0x"+String.fromCharCode(..._value));   
      midi[param] = value;
    }

    return midi;
  },

  moduleLookup: function(hwcfg){
    var CONTROLLER = this.PROTOCOL.CONTROLLER;
    let type = '';
    for (const key in CONTROLLER) {
      if(CONTROLLER[key] == hwcfg)
        return type = key;
      }
  },
}

  /*

  

  sys_decoder: function(serialData){
    let header = this.header(serialData);
    let heartbeat = this.heartbeat(serialData);
    let moduleType = this.moduleLookup(heartbeat.HWCFG);
    return GRID_CONTROLLER.create(header, moduleType, false)   
  },
  

  

  ENCODE_HEADER: function (msg){
      const TABLE = this.LOOKUP_TABLE;

      const GRID_BRC = this.LOOKUP_TABLE.GRID_SOH_BRC_PARAMETERS;

      let LENGTH = 0;
      for (const key in GRID_BRC) {
        LENGTH += GRID_BRC[key].length;       
      }

      const prepend = String.fromCharCode(TABLE.GRID_CONST.SOH) + String.fromCharCode(TABLE.GRID_CONST.BRC);

      let BRC_PARAMETERS = [
        this.genId(), 0, 0, 255, 0, TABLE.GRID_PROTOCOL_VERSION.MAJOR, TABLE.GRID_PROTOCOL_VERSION.MINOR, TABLE.GRID_PROTOCOL_VERSION.PATCH
      ];

      let params = '';
      BRC_PARAMETERS.forEach(param => {
        params += param.toString(16).padStart(2, '0');
      })
      
      const append = 
        String.fromCharCode(TABLE.GRID_CONST.EOB) + 
        //String.fromCharCode(TABLE.GRID_CONST.STX) + 
        msg + 
        //String.fromCharCode(TABLE.GRID_CONST.ETX) + 
        String.fromCharCode(TABLE.GRID_CONST.EOT);

      let message = prepend + params + append;

      console.log('len: ',message.length + 2);

      message = message.slice(0,2) + (message.length+2).toString(16).padStart(2, '0') + message.slice(2,);

      let checksum = [...message].map(a => a.charCodeAt(0)).reduce((a, b) => a ^ b).toString(16);

      console.log(checksum);

      message = message + checksum;

      return message;
  },

  genId: function() {
    if((global_id / 255) == 1){
      global_id = 0;
    }
    return global_id += 1;
  }



*/
