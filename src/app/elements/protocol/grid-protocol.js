import { createNestedObject, returnDeepestObjects, mapObjectsToArray } from './_utils.js';
import { editor_lua_properties } from './editor-properties.js';
import * as grid_protocol from '../../../external/grid-protocol/grid_protocol_nightly.json';

import { readable } from 'svelte/store';

const grid = {
  
  properties: (function (){

    let HWCFG = {};
    let CONST = {};
    let INSTR = {};
    let CLASSES = {};
    let LUA = {};
    let BRC = {};  
    let VERSION = {};
    let PARAMETERS = {};
    let HEARTBEAT_INTERVAL = 0;
    let PROTOCOL = {};

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

        // GRID BROADCAST PARAMETERS
        if(key.startsWith('GRID_BRC_') && key['GRID_BRC_'.length] == key['GRID_BRC_'.length].toUpperCase()){    
          const param = key.substr('GRID_BRC_'.length).split('_');
          BRC[param[0]] = {offset: 0, length: 0};
        } 

        // GRID CLASS XXX CODES
        if(key.startsWith('GRID_CLASS_') && key.slice(-4) == 'code'){
          CLASSES[key.slice('GRID_CLASS_'.length).slice(0,-5)] = +grid_protocol[key];
        }

        // GRID LUA PROPERTIES
        if(key.startsWith('GRID_LUA_')){
          let paramSet = key.split('_');
          let value = grid_protocol[key];
          createNestedObject( LUA, paramSet.slice(3,), value )
        }

        // LEGACY GRID CLASS CONSTRUCTION
        let param = '';
        if(key.startsWith('GRID_CLASS_')){
          param = key.split('_')[2];
          if(param[0] == param[0].toUpperCase()){
            if (!PROTOCOL.hasOwnProperty(param)) {
              PROTOCOL[param] = {};
            }
          }
        }

      }
    } 

    return {
      ...PROTOCOL,
      BRC: BRC , 
      LUA: extendLua(LUA),
      CLASSES: CLASSES, 
      HWCFG: HWCFG, 
      CONST: CONST,
      INSTR: INSTR,
      VERSION: VERSION,
      PARAMETERS: PARAMETERS,
      HEARTBEAT_INTERVAL: HEARTBEAT_INTERVAL,
      AGE: Math.floor(Math.random()*255).toString(16).padStart(2, '0')
    }

    function extendLua(propObject){
      const deepObjects = returnDeepestObjects(propObject);
      const array = mapObjectsToArray(editor_lua_properties, deepObjects);
      return array;
    }
  }()),

  translate: {
    encode: function(){
      return 'decode not implemented';
    },
  
    decode: function(){
      return 'encode not implemented';
    },
  },

  device: {
    make: function(){
      return 'controller creation not implemented';
    }
  }

}

export default grid;