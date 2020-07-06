import * as grid_protocol from '../../external/grid-protocol/grid_protocol.json';
import {GRID_CONTROLLER} from './GridController.js';

export var GRID_PROTOCOL = {

  LOOKUP_TABLE: {},

  initialize: function() {

    let GRID_CONST = [];
    let GRID_OTHER = [];
    let GRID_SOH_BRC_PARAMETERS = [];
    let GRID_STX_SYS_HEARTBEAT_PARAMETER = [];
    let GRID_MIDI_PARAMETERS = {}
    let GRID_CLASSES = {};
    let GRID_MODULE_TYPES = {};

    for (const key in grid_protocol) {
      if(typeof grid_protocol[key] !== 'object'){

        let _key = {};

        // GRID CONSTS
        if(grid_protocol[key].startsWith('0x')){
          let dec = parseInt(grid_protocol[key], 16); 
          _key[key] = dec;
          GRID_CONST.push(_key)
        } 

        // GRID SOH BROADCAST 
        else if(key.startsWith('GRID_SOH_BRC')){    
          let paramName = key.substr(30,);
          GRID_SOH_BRC_PARAMETERS[paramName] = {length: 0,offset: 0};
        } 

        else if(key.startsWith('GRID_PARAMETER_MIDI')){
          let paramName = key.substr(20,);
          GRID_MIDI_PARAMETERS[paramName] = grid_protocol[key]
        }

        // MODULE LOOKUP
        else if(key.startsWith('GRID_MODULE')){
          let paramName = key.substr(12,);
          _key[paramName] = +grid_protocol[key]
          GRID_MODULE_TYPES[paramName] = +grid_protocol[key];
        }

        // heartbeat hwcfg
        else if(key.startsWith('GRID_STX_SYS_HEARTBEAT_PARAMETERS')){
          GRID_STX_SYS_HEARTBEAT_PARAMETER['HWCFG'] = {length: 0, offset: 0};
        }

        // stx classes
        else if(key.startsWith('GRID_CLASS')){
          GRID_CLASSES[key] =  +grid_protocol[key];
        }
      }
    } 

    for (const key in grid_protocol) {
      if(typeof grid_protocol[key] !== 'object'){
        if(key.startsWith('GRID_SOH_BRC_PARAMETER_OFFSET')){
          let paramName = key.substr(30,);
          GRID_SOH_BRC_PARAMETERS[paramName].offset = +grid_protocol[key];
        }
        if(key.startsWith('GRID_SOH_BRC_PARAMETER_LENGTH')){
          let paramName = key.substr(30,);
          GRID_SOH_BRC_PARAMETERS[paramName].length = +grid_protocol[key];
        }
        if(key.startsWith('GRID_STX_SYS_HEARTBEAT_PARAMETER_OFFSET_HWCFG')){
          GRID_STX_SYS_HEARTBEAT_PARAMETER.HWCFG.offset = +grid_protocol[key];
        }
        if(key.startsWith('GRID_STX_SYS_HEARTBEAT_PARAMETER_LENGTH_HWCFG')){
          GRID_STX_SYS_HEARTBEAT_PARAMETER.HWCFG.length = +grid_protocol[key];
        }
      }
    }

    this.LOOKUP_TABLE.GRID_CONST = GRID_CONST;
    this.LOOKUP_TABLE.GRID_OTHER = GRID_OTHER;
    this.LOOKUP_TABLE.GRID_CLASSES = GRID_CLASSES;
    this.LOOKUP_TABLE.GRID_SOH_BRC_PARAMETERS = GRID_SOH_BRC_PARAMETERS;
    this.LOOKUP_TABLE.GRID_STX_SYS_HEARTBEAT_PARAMETER = GRID_STX_SYS_HEARTBEAT_PARAMETER;
    this.LOOKUP_TABLE.GRID_MODULE_TYPES = GRID_MODULE_TYPES;
    this.LOOKUP_TABLE.GRID_MIDI_PARAMETERS = GRID_MIDI_PARAMETERS;

    console.log(this.LOOKUP_TABLE);

    return GRID_PROTOCOL;
  },

  header: function(serialData){

    var LOOKUP_TABLE = this.LOOKUP_TABLE.GRID_SOH_BRC_PARAMETERS;

    var header = {}

    for (const param in LOOKUP_TABLE) {

      let _value = serialData.slice(
        LOOKUP_TABLE[param].offset, LOOKUP_TABLE[param].length + LOOKUP_TABLE[param].offset
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

  decode: function(serialData){

    var LOOKUP_TABLE = this.LOOKUP_TABLE.GRID_CLASSES;

    let _decoded = [];
    let class_name = '';
    let id = 0;
    
    serialData.forEach((element,i) => {  

      // GRID_CONST_STX
      if(element == 2){ 
        class_name = parseInt("0x"+String.fromCharCode(serialData[i+1], serialData[i+2]));
        id = ""+ i +"";
        for (const param in LOOKUP_TABLE){
          if(LOOKUP_TABLE[param] == class_name){
            _decoded.push({id: id, class: param, offset: i + 3});     
          }
        }
      }

      // GRID_CONST_ETX
      if(element == 3){
        let obj = _decoded.find(o => o.id === id);
        obj.length = i - obj.offset;
      }

    });

    return _decoded;

  },

  getCommand: function(serialData){

    let value = parseInt("0x"+String.fromCharCode(serialData[0], serialData[1]));

    return value
  },

  midi_decoder: function(serialData){
   
    // GRID_COMMAND_MIDI_EVENTPACKET = 100

    let COMMAND = parseInt("0x"+String.fromCharCode(serialData[0], serialData[1]));

    let MIDI = [];

    if(COMMAND == 100){
      let key = {};
      for (let i = 2; i < (serialData.length); i += 2) {
        MIDI.push(parseInt("0x"+String.fromCharCode(serialData[i], serialData[i+1])));
      }
    }

    return MIDI;
  },

  sys_decoder: function(serialData){
    let header = this.header(serialData);
    let heartbeat = this.heartbeat(serialData);
    let moduleType = this.moduleLookup(heartbeat.HWCFG);

    return GRID_CONTROLLER.create(header, moduleType, false)   
  },

  heartbeat: function(serialData){

    let STX_OFFSET = serialData.indexOf(2);
      
    var LOOKUP_TABLE = this.LOOKUP_TABLE.GRID_STX_SYS_HEARTBEAT_PARAMETER;

    var heartbeat = {}

    for (const param in LOOKUP_TABLE) {

      let _value = serialData.slice(
        LOOKUP_TABLE[param].offset + STX_OFFSET, LOOKUP_TABLE[param].length + LOOKUP_TABLE[param].offset + STX_OFFSET
      );    

      let value = parseInt("0x"+String.fromCharCode(..._value));

      heartbeat[param] = value

    }

    return heartbeat
  },

  moduleLookup: function(hwcfg){

    var LOOKUP_TABLE = this.LOOKUP_TABLE.GRID_MODULE_TYPES;

    let type = '';

    for (const key in LOOKUP_TABLE) {
      if(LOOKUP_TABLE[key] == hwcfg)
        return type = key;
      }
  }
  

}