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
        classParameters: {
          'ELEMENTNUMBER': enumber,
          'EVENTTYPE': inputStore.event.eventtype,
          'PAGENUMBER': inputStore.event.pagenumber
        }, 
        brc: { 
          'SX': device.dx, 
          'SY': device.dy,
          'ROT': Math.abs(device.rot)
        },
        instr: 'REPORT',
        className: 'CONFIG'
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
      { ACTIONLENGTH: pParser(`<?lua ${lua.trim()} ?>`.length)},
      { ACTIONSTRING: `<?lua ${lua.trim()} ?>`}
    ]

    const {serial, id} = grid.translate.encode(brc, 'LOCAL', 'CONFIG', 'EXECUTE', parameters)

    let buffer_element = {
      responseRequired: true,
      serial: serial,
      filter: {
        id: id, 
        classParameters: {
          'ELEMENTNUMBER': enumber,
          'EVENTTYPE': event.eventtype,
          'PAGENUMBER': event.pagenumber
        }, 
        brc: { 
          'SX': brc.dx, 
          'SY': brc.dy,
          'ROT': Math.abs(brc.rot)
        },
        instr: 'EXECUTE',
        className: 'CONFIG'
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
      responseRequired: true,
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

  sendStoreToGrid: () => {
    const { serial, id } = grid.translate.encode('','GLOBAL',`CONFIGSTORE`,'EXECUTE','');
    let buffer_element = {
      serial: serial,
      responseRequired: true,
      filter: { className: 'CONFIGSTORE' },
      failCb: function(){console.log('store execute - fail')}, 
      successCb: function(){console.log('store execute - success')}
    }
    engine.strict.store('store', serial, id);
    writeBuffer.add_first(buffer_element);
    writeBuffer.add_last({successCb: function(){
      runtime.unsaved.set(0);
    }})
  },

  sendEraseToGrid: () => {
    const {serial, id} = grid.translate.encode('','GLOBAL','CONFIGERASE','EXECUTE','');
    engine.strict.store('erase', serial, id);
    let buffer_element = {
      responseRequired: true,
      responseTimeout: 8000,
      filter: { className: 'CONFIGERASE' },
      serial: serial,
      failCb: function(){console.log('erase execute - fail')}, 
      successCb: function(){console.log('erase execute - success')}
    }
    writeBuffer.add_first(buffer_element);
    writeBuffer.add_last({successCb: function(){
      runtime.unsaved.set(0);
      runtime.erase();
    }})
  },

  sendDiscardToGrid: () => {
    const { serial, id } = grid.translate.encode('','GLOBAL','CONFIGDISCARD','EXECUTE','');
    let buffer_element = {
      responseRequired: true,
      filter: { className: 'CONFIGDISCARD' },
      serial: serial,
      failCb: function(){console.log('discard execute - fail')}, 
      successCb: function(){console.log('discard execute - success')}
    }
    writeBuffer.add_first(buffer_element);
    writeBuffer.add_last({successCb: function(){
      runtime.changes.throw().setToZero().trigger();  
    }})
    
  }

}

export default instructions;