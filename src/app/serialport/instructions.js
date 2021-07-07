import { serialComm } from './serialport.store.js';

import grid from '../protocol/grid-protocol.js';

import { pParser } from '../protocol/_utils.js';
import { writeBuffer } from '../runtime/engine.store.js';
import { engine, runtime } from '../runtime/runtime.store.js';

const instructions = {

  fetchConfigFromGrid: ({device, inputStore}) => {

    let enumber = undefined;

    // configurations on the 16th element, which is the utility button
    inputStore.event.elementnumber != 16 ? enumber = inputStore.event.elementnumber : enumber = 255;

    const {serial, id} = grid.translate.encode(
      { 
        dx: device.dx, 
        dy: device.dy,
        rot: device.rot
      },
      "LOCAL",
      "CONFIG",
      "FETCH",
      [
        { VERSIONMAJOR: pParser(grid.properties.VERSION.MAJOR) },
        { VERSIONMINOR: pParser(grid.properties.VERSION.MINOR) },
        { VERSIONPATCH: pParser(grid.properties.VERSION.PATCH) },
        { PAGENUMBER: pParser(inputStore.event.pagenumber)}, 
        { ELEMENTNUMBER: pParser(enumber)}, 
        { EVENTTYPE: pParser(inputStore.event.eventtype)}, 
        { ACTIONLENGTH: pParser(0)},
      ],
    );

    let buffer_element = {
      responseRequired: true,
      serial: serial,
      filter: {
        id: id, 
        brc: { 
          'SX': device.dx, 
          'SY': device.dy,
          'ROT': Math.abs(device.rot)
        },
        'CONFIG_REPORT': {
          'EVENTTYPE': inputStore.event.eventtype,
          'ELEMENTNUMBER': enumber,
          'PAGENUMBER': inputStore.event.pagenumber
        },
        className: 'CONFIG_REPORT'
      },
      failCb: function(){console.log('config fetch - fail')}, 
      successCb: function(){console.log('config fetch - success')}
    }

    writeBuffer.add_first(buffer_element);

    return 1;
  },

  sendConfigToGrid: ({lua, li}) => {

    const {event, brc} = li;

    let enumber = undefined;

    // configurations on the 16th element, which is the utility button
    event.elementnumber != 16 ? enumber = event.elementnumber : enumber = 255;

    const parameters = [
      { VERSIONMAJOR: pParser(grid.properties.VERSION.MINOR) },
      { VERSIONMINOR: pParser(grid.properties.VERSION.MINOR) },
      { VERSIONPATCH: pParser(grid.properties.VERSION.PATCH) },
      { PAGENUMBER: pParser(event.pagenumber) },
      { ELEMENTNUMBER: pParser(enumber) },
      { EVENTTYPE: pParser(event.eventtype) },
      { ACTIONLENGTH: pParser(`${lua.trim()}`.length)},
      { ACTIONSTRING: `${lua.trim()}`}
    ]

    const {serial, id} = grid.translate.encode(brc, 'LOCAL', 'CONFIG', 'EXECUTE', parameters)

    let buffer_element = {
      responseRequired: true,
      serial: serial,
      filter: {
        brc: { 
          'SX': brc.dx, 
          'SY': brc.dy,
          'ROT': Math.abs(brc.rot)
        },
        'CONFIG_ACKNOWLEDGE': {
          'LASTHEADER': id,
        },
        className: 'CONFIG_ACKNOWLEDGE'
      },
      failCb: function(){console.log('config execute - fail')}, 
      successCb: function(){console.log('config execute - success')}
    }

    writeBuffer.add_first(buffer_element);

    return 1;
  },

  changeActivePage: ({li}) => {

    const {event, brc} = li;

    const parameters = [
      { PAGENUMBER: pParser(event.pagenumber) },
    ]

    const {serial, id}  = grid.translate.encode(brc, 'GLOBAL', 'PAGEACTIVE', 'EXECUTE', parameters)

    let buffer_element = {
      //responseRequired: true,
      serial: serial,
      filter: { className: 'PAGEACTIVE' },
      failCb: function(){console.log('change page - fail')}, 
      successCb: function(){console.log('change page - success')}
    }

    writeBuffer.add_first(buffer_element);

    return 1;
  },

  fetchPageCountFromGrid: ({brc}) => {

    const {serial, id} = grid.translate.encode(
      {dx: brc.dx, dy: brc.dy, rot: brc.rot},
      "GLOBAL",
      "PAGECOUNT",
      "FETCH",
      ""
    );
    
    let buffer_element = {
      responseRequired: true,
      serial: serial,
      filter: { className: 'PAGECOUNT' },
      failCb: function(){console.log('fetch page count - fail')}, 
      successCb: function(){console.log('fetch page count - success')}
    }

    writeBuffer.add_first(buffer_element);

    return 1;
  },

  sendPageStoreToGrid: () => {
    const { serial, id } = grid.translate.encode('','GLOBAL',`PAGESTORE`,'EXECUTE','');
    let buffer_element = {
      serial: serial,
      responseRequired: true,
      filter: { 
        'PAGESTORE_ACKNOWLEDGE': {
          'LASTHEADER': id,
        },
        className: 'PAGESTORE_ACKNOWLEDGE'
      },
      failCb: function(){console.log('page store execute - fail')}, 
      successCb: function(){console.log('page store execute - success')}
    }
    engine.strict.store('store', serial, id);
    writeBuffer.add_first(buffer_element);
    writeBuffer.add_last({successCb: function(){
      runtime.unsaved.set(0);
    }})
  },

  sendNVMEraseToGrid: () => {
    const {serial, id} = grid.translate.encode('','GLOBAL','NVMERASE','EXECUTE','');
    engine.strict.store('erase', serial, id);
    let buffer_element = {
      responseRequired: true,
      responseTimeout: 8000,
      filter: { 
        'NVMERASE_ACKNOWLEDGE': {
          'LASTHEADER': id,
        },
        className: 'NVMERASE_ACKNOWLEDGE'
      },
      serial: serial,
      failCb: function(){console.log('NVM erase execute - fail')}, 
      successCb: function(){console.log('NVM erase execute - success')}
    }
    writeBuffer.add_first(buffer_element);
    writeBuffer.add_last({successCb: function(){
      runtime.unsaved.set(0);
      runtime.erase();
    }})
  },

  sendPageDiscardToGrid: () => {
    const { serial, id } = grid.translate.encode('','GLOBAL','PAGEDISCARD','EXECUTE','');
    let buffer_element = {
      responseRequired: true,
      filter: { 
        'PAGEDISCARD_ACKNOWLEDGE': {
          'LASTHEADER': id,
        },
        className: 'PAGEDISCARD_ACKNOWLEDGE'
      },
      serial: serial,
      failCb: function(){console.log('page discard execute - fail')}, 
      successCb: function(){console.log('page discard execute - success')}
    }
    writeBuffer.add_first(buffer_element);
    writeBuffer.add_last({successCb: function(){
      runtime.changes.throw().setToZero().trigger();  
    }})
    
  },

  sendPageClearToGrid: () => {
    const { serial, id } = grid.translate.encode('','GLOBAL','PAGECLEAR','EXECUTE','');
    let buffer_element = {
      responseRequired: true,
      filter: { 
        'PAGECLEAR_ACKNOWLEDGE': {
          'LASTHEADER': id,
        },
        className: 'PAGECLEAR_ACKNOWLEDGE'
      },
      serial: serial,
      failCb: function(){console.log('page clear execute - fail')}, 
      successCb: function(){console.log('page clear execute - success')}
    }
    writeBuffer.add_first(buffer_element);
    writeBuffer.add_last({successCb: function(){
      runtime.changes.throw().setToZero().trigger();  
    }})
    
  }

}

export default instructions;