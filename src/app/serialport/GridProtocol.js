import * as grid_protocol from '../../external/grid-protocol/grid_protocol.json';

export var GRID = {

  table: {},

  create: function() {

    let GRID_CONST = [];
    let GRID_OTHER = [];
    let GRID_BROADCAST_HEADER_PARAMETERS = [];
    
    let parameter = {}

    for (const key in grid_protocol) {
      if(typeof grid_protocol[key] !== 'object'){

        let _key = {};

        if(grid_protocol[key].startsWith('0x')){
          let dec = parseInt(grid_protocol[key], 16); 
          _key[key] = dec;
          GRID_CONST.push(_key)
        } 

        else if(key.startsWith('GRID_LENGTH_BROADCAST_HEADER_PARAMETER') || key.startsWith('GRID_OFFSET_BROADCAST_HEADER_PARAMETER')){    
          let paramName = key.substr(39,);
          GRID_BROADCAST_HEADER_PARAMETERS[paramName] = {length: 0,offset: 0} 
        } 

        else {
          _key[key] = grid_protocol[key];
          GRID_OTHER.push(_key);
        }
      }
    } 

    for (const key in grid_protocol) {
      if(typeof grid_protocol[key] !== 'object'){
        if(key.startsWith('GRID_LENGTH_BROADCAST_HEADER_PARAMETER')){
          let paramName = key.substr(39,);
          console.log(paramName, grid_protocol[key]);
          GRID_BROADCAST_HEADER_PARAMETERS[paramName].length = +grid_protocol[key];
        }
        if(key.startsWith('GRID_OFFSET_BROADCAST_HEADER_PARAMETER')){
          let paramName = key.substr(39,);
          
          GRID_BROADCAST_HEADER_PARAMETERS[paramName].offset = +grid_protocol[key];
        }
      }
    }

    this.table.GRID_CONST = GRID_CONST;
    this.table.GRID_OTHER = GRID_OTHER;
    this.table.GRID_BROADCAST_HEADER_PARAMETERS = GRID_BROADCAST_HEADER_PARAMETERS;

    console.log(this.table);

    return GRID;
  },

  heartbeat: function(serialData){

    var table = this.table.GRID_BROADCAST_HEADER_PARAMETERS;

    var heartbeat = {}

    for (const param in table) {

      let _value = serialData.slice(
        table[param].offset, table[param].length + table[param].offset
      );    

      let value = parseInt("0x"+String.fromCharCode(..._value));
      
      if(param == 'DX' || param == 'DY'){
        heartbeat[param] = value - 127;
      } else {
        heartbeat[param] = value;
      }
    }

    console.log(heartbeat);

  },

  decode: function(parameter){
    
  }


}