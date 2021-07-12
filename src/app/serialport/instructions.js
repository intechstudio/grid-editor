import { serialComm } from './serialport.store.js';

import grid from '../protocol/grid-protocol.js';

import { pParser } from '../protocol/_utils.js';
import { writeBuffer } from '../runtime/engine.store.js';
import { engine, logger, runtime } from '../runtime/runtime.store.js';

const instructions = {

  fetchConfigFromGrid: ({device, inputStore}) => {

    let enumber = undefined;

    // configurations on the 16th element, which is the utility button
    inputStore.event.elementnumber != 16 ? enumber = inputStore.event.elementnumber : enumber = 255;

    let buffer_element = {
      responseRequired: true,
      encodeParameters: [
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
        ]
      ],
      filter: {
        brc: { 
          'SX': device.dx, 
          'SY': device.dy,
        },
        'CONFIG_REPORT': {
          'PAGENUMBER': inputStore.event.pagenumber,
          'ELEMENTNUMBER': enumber,
          'EVENTTYPE': inputStore.event.eventtype
        },
        className: 'CONFIG_REPORT'
      },
      failCb: function(){
        //console.log('config fetch - fail')
      }, 
      successCb: function(){
        //console.log('config fetch - success')
      }
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
      { VERSIONMAJOR: pParser(grid.properties.VERSION.MAJOR) },
      { VERSIONMINOR: pParser(grid.properties.VERSION.MINOR) },
      { VERSIONPATCH: pParser(grid.properties.VERSION.PATCH) },
      { PAGENUMBER: pParser(event.pagenumber) },
      { ELEMENTNUMBER: pParser(enumber) },
      { EVENTTYPE: pParser(event.eventtype) },
      { ACTIONLENGTH: pParser(`${lua.trim()}`.length)},
      { ACTIONSTRING: `${lua.trim()}`}
    ]

    let buffer_element = {
      responseRequired: true,
      encodeParameters: [
        brc, 
        'LOCAL', 
        'CONFIG', 
        'EXECUTE',
        parameters
      ],
      filter: {
        brc: { 
          'SX': brc.dx, 
          'SY': brc.dy,
        },
        'CONFIG_ACKNOWLEDGE': {
          'LASTHEADER': null
        },
        className: 'CONFIG_ACKNOWLEDGE'
      },
      failCb: function(){
        //console.log('config execute - fail')
      }, 
      successCb: function(){
        //console.log('config execute - success')
      }
    }


    if(grid.properties.CONFIG_LENGTH <= parameters[7]['ACTIONSTRING'].length){
      logger.set({type: 'alert', mode: 0, classname: 'configlength', message: `Config is too long! ${parameters[7]['ACTIONSTRING'].length} characters`})
      return;
    }

    writeBuffer.add_first(buffer_element);

    return 1;
  },

  changeActivePage: ({li}) => {

    const {event, brc} = li;

    const parameters = [
      { PAGENUMBER: pParser(event.pagenumber) },
    ];

    let buffer_element = {
      encodeParameters: [
        '',
        'GLOBAL', 
        'PAGEACTIVE', 
        'EXECUTE', 
        parameters
      ],
      filter: { className: 'PAGEACTIVE' },
      failCb: function(){
        //console.log('change page - fail')
      }, 
      successCb: function(){
        //console.log('change page - success')
      }
    }

    writeBuffer.add_first(buffer_element);

    return 1;
  },

  fetchPageCountFromGrid: ({brc}) => {
   
    let buffer_element = {
      responseRequired: true,
      encodeParameters: [
        {
          dx: brc.dx, 
          dy: brc.dy, 
          rot: brc.rot
        },
        "LOCAL",
        "PAGECOUNT",
        "FETCH",
        ""
      ],
      filter: { 
        'PAGECOUNT': {
          'LASTHEADER': null
        },
        className: 'PAGECOUNT' 
      },
      failCb: function(){
        //console.log('fetch page count - fail')
      }, 
      successCb: function(){
        //console.log('fetch page count - success')
      }
    }

    writeBuffer.add_first(buffer_element);

    return 1;
  },

  sendPageStoreToGrid: () => {

    writeBuffer.add_first({
      commandCb: function(){
        engine.set('DISABLED');
        logger.set({type: 'progress', mode: 0, classname: 'pagestore', message: `Store configurations on page...`})
      }
    });

    let buffer_element = {
      responseRequired: true,
      encodeParameters: [
        '',
        'GLOBAL',
        'PAGESTORE',
        'EXECUTE',
        ''
      ],
      filter: { 
        'PAGESTORE_ACKNOWLEDGE': {
          'LASTHEADER': null,
        },
        className: 'PAGESTORE_ACKNOWLEDGE'
      },
      failCb: function(){
        logger.set({type: 'alert', mode: 0, classname: 'pagestore', message: `Retry page store...`})
        //console.log('page store execute - fail')
      }, 
      successCb: function(){
        engine.set('ENABLED');
        runtime.unsaved.set(0);
        logger.set({type: 'success', mode: 0, classname: 'pagestore', message: `Store complete!`})
        //console.log('page store execute - success')
      }
    }

    //engine.strict.store('store', serial, id);

    writeBuffer.add_first(buffer_element);

  },

  sendNVMEraseToGrid: () => {

    //engine.strict.store('erase', serial, id);

    writeBuffer.add_first({
      commandCb: function(){
        engine.set('DISABLED');
        logger.set({type: 'progress', mode: 0, classname: 'nvmerase', message: `Erasing all modules...`})
      }
    });

    let buffer_element = {
      responseRequired: true,
      responseTimeout: 8000,
      encodeParameters: [
        '',
        'GLOBAL',
        'NVMERASE',
        'EXECUTE',
        ''
      ],
      filter: { 
        'NVMERASE_ACKNOWLEDGE': {
          'LASTHEADER': null,
        },
        className: 'NVMERASE_ACKNOWLEDGE'
      },
      failCb: function(){
        logger.set({type: 'alert', mode: 0, classname: 'nvmerase', message: `Retry erase all modules...`});
        //console.log('NVM erase execute - fail')
      }, 
      successCb: function(){
        runtime.unsaved.set(0);
        runtime.erase();
        engine.set('ENABLED');
        logger.set({type: 'success', mode: 0, classname: 'nvmerase', message: `Erase complete!`});
        //console.log('NVM erase execute - success')
      }
    }

    writeBuffer.add_first(buffer_element);

  },

  sendPageDiscardToGrid: () => {

    writeBuffer.add_first({
      commandCb: function(){
        engine.set('DISABLED');
        logger.set({type: 'progress', mode: 0, classname: 'pagediscard', message: `Discarding configurations...`})
      }
    });

    let buffer_element = {
      responseRequired: true,
      filter: { 
        'PAGEDISCARD_ACKNOWLEDGE': {
          'LASTHEADER': null,
        },
        className: 'PAGEDISCARD_ACKNOWLEDGE'
      },
      encodeParameters: [
        '',
        'GLOBAL',
        'PAGEDISCARD',
        'EXECUTE',
        ''
      ],
      failCb: function(){
        logger.set({type: 'alert', mode: 0, classname: 'pagediscard', message: `Retry configuration discard...`})
        //console.log('page discard execute - fail')
      }, 
      successCb: function(){
        runtime.changes.throw().setToZero().trigger();  
        engine.set('ENABLED');
        logger.set({type: 'success', mode: 0, classname: 'pagediscard', message: `Discard complete!`});
        //console.log('page discard execute - success');
      }
    }

    writeBuffer.add_first(buffer_element);
    
  },

  sendPageClearToGrid: () => {

    writeBuffer.add_first({
      commandCb: function(){
        engine.set('DISABLED');
        logger.set({type: 'progress', mode: 0, classname: 'pageclear', message: `Clearing configurations from page...`})
      }
    });

    let buffer_element = {
      responseRequired: true,
      filter: { 
        'PAGECLEAR_ACKNOWLEDGE': {
          'LASTHEADER': null,
        },
        className: 'PAGECLEAR_ACKNOWLEDGE'
      },
      encodeParameters: [
        '',
        'GLOBAL',
        'PAGECLEAR',
        'EXECUTE',
        ''
      ],
      failCb: function(){
        logger.set({type: 'alert', mode: 0, classname: 'pageclear', message: `Retry clear page...`})
        //console.log('page clear execute - fail')
      }, 
      successCb: function(){
        runtime.changes.throw().setToZero().trigger(); 
        engine.set('ENABLED');
        logger.set({type: 'success', mode: 0, classname: 'pageclear', message: `Page clear complete!`})
        //console.log('page clear execute - success')
      }
    }

    writeBuffer.add_first(buffer_element);
    
  }

}

export default instructions;