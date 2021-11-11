import { serialComm } from './serialport.store.js';

import grid from '../protocol/grid-protocol.js';

import { pParser } from '../protocol/_utils.js';
import { writeBuffer } from '../runtime/engine.store.js';
import { engine, logger, runtime } from '../runtime/runtime.store.js';

const instructions = {

  fetchConfigFromGrid: (device, inputStore, callback) => {

    let enumber = undefined;

    // configurations on the 16th element, which is the utility button
    enumber = inputStore.event.elementnumber;

    let buffer_element = {

      descr: {
        brc_parameters: {
          DX: device.dx, DY: device.dy, ROT: device.rot
        },
        class_name: "CONFIG",
        class_instr: "FETCH",
        class_parameters: {
          VERSIONMAJOR: grid.properties.VERSION.MAJOR,
          VERSIONMINOR: grid.properties.VERSION.MINOR,
          VERSIONPATCH: grid.properties.VERSION.PATCH,
          PAGENUMBER: inputStore.event.pagenumber,
          ELEMENTNUMBER: enumber,
          EVENTTYPE: inputStore.event.eventtype,
          ACTIONLENGTH: 0
        }
      },
      responseRequired: true,
      filter: {
        brc_parameters: { 
          'SX': device.dx, 
          'SY': device.dy,
        },
        class_instr: 'REPORT',
        class_name: 'CONFIG',
        class_parameters: {
          'PAGENUMBER': inputStore.event.pagenumber,
          'ELEMENTNUMBER': enumber,
          'EVENTTYPE': inputStore.event.eventtype
        }
      },
      failCb: function(){
        //console.log('config fetch - fail')
      }, 
      successCb: function(descr){

        runtime.update.one().set_config_descriptor(descr);

        if(callback){
          console.log("CALLBACK")
          callback(descr);
        }
        
      }
    }


    writeBuffer.add_first(buffer_element);

    return 1;
  },

  sendConfigToGrid: (lua, li, callback) => {

    const {event, brc} = li;

    let buffer_element = {
      descr: {
        brc_parameters: {
          DX: brc.dx, DY: brc.dy, ROT: brc.rot
        },
        class_name: "CONFIG",
        class_instr: "EXECUTE",
        class_parameters: {
          VERSIONMAJOR: grid.properties.VERSION.MAJOR,
          VERSIONMINOR: grid.properties.VERSION.MINOR,
          VERSIONPATCH: grid.properties.VERSION.PATCH,
          PAGENUMBER:   event.pagenumber,
          ELEMENTNUMBER: event.elementnumber,
          EVENTTYPE:    event.eventtype,
          ACTIONLENGTH: lua.trim().length,
          ACTIONSTRING: lua.trim()
        }
      },
      responseRequired: true,
      filter: {
        brc_parameters: { 
          'SX': brc.dx, 
          'SY': brc.dy,
        },
        class_name: 'CONFIG',
        class_instr: 'ACKNOWLEDGE'
      },
      failCb: function(){
        //console.log('config execute - fail')
      }, 
      successCb: callback
    }

    if(grid.properties.CONFIG_LENGTH <= lua.trim().length){
      logger.set({type: 'alert', mode: 0, classname: 'configlength', message: `Config is too long! ${lua.trim().length} characters`})
      return;
    }

    writeBuffer.add_first(buffer_element);

    return 1;
  },

  changeActivePage: ({li}) => {

    const {event, brc} = li;

    let buffer_element = {
      descr: {

        brc_parameters: {
          DX: -127, DY: -127
        },
        class_name: "PAGEACTIVE",
        class_instr: "EXECUTE",
        class_parameters: {
          PAGENUMBER: event.pagenumber
        }
      }
      
      // no response required, so no fltr struct is defined
    }

    writeBuffer.add_first(buffer_element);

    return 1;
  },

  fetchPageCountFromGrid: ({brc}) => {
   
    let buffer_element = {
      descr: {
        brc_parameters: {
          DX: brc.dx, DY: brc.dy, ROT: brc.rot
        },
        class_name: "PAGECOUNT",
        class_instr: "FETCH",
        class_parameters: {}
      },
      responseRequired: true,
      filter: {
        class_name: 'PAGECOUNT',
        class_instr: 'REPORT' 
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

    engine.set('DISABLED');
    logger.set({type: 'progress', mode: 0, classname: 'pagestore', message: `Store configurations on page...`})

    let buffer_element = {
      descr: {
        brc_parameters: {
          DX: -127, DY: -127
        },
        class_name: "PAGESTORE",
        class_instr: "EXECUTE",
        class_parameters: {
        }
      },
      responseRequired: true,
      filter: { 
        class_name: 'PAGESTORE',
        class_instr: 'ACKNOWLEDGE',
        class_parameters: {
          'LASTHEADER': null,
        }
        
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

    engine.set('DISABLED');
    logger.set({type: 'progress', mode: 0, classname: 'nvmerase', message: `Erasing all modules...`})


    let buffer_element = {
      responseTimeout: 8000,
      descr: {
        brc_parameters: {
          DX: -127, DY: -127
        },
        class_name: "NVMERASE",
        class_instr: "EXECUTE",
        class_parameters: {
        }
      },
      responseRequired: true,
      filter: {
        class_name: 'NVMERASE',
        class_instr: 'ACKNOWLEDGE',
        class_parameters: {
          'LASTHEADER': null,
        }
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

  sendNVMDefragToGrid: () => {

    let buffer_element = {
      descr: {
        brc_parameters: {
          DX: -127, DY: -127
        },
        class_name: "NVMDEFRAG",
        class_instr: "EXECUTE",
        class_parameters: {
        }
      },
      responseRequired: true,
      filter: { 
        class_name: 'NVMDEFRAG',
        class_instr: 'ACKNOWLEDGE',
        class_parameters: {
          'LASTHEADER': null,
        }
      },
      failCb: function(){
        console.log('NVM defrag execute - fail')
      }, 
      successCb: function(){
        console.log('NVM defrag execute - success')
        //logger.set({type: 'success', mode: 0, classname: 'nvmdefrag', message: `NVM defrag complete!`});
      }
    }

    writeBuffer.add_first(buffer_element);

  },

  sendPageDiscardToGrid: () => {

    engine.set('DISABLED');
    logger.set({type: 'progress', mode: 0, classname: 'pagediscard', message: `Discarding configurations...`})

    let buffer_element = {
      descr: {
        brc_parameters: {
          DX: -127, DY: -127
        },
        class_name: "PAGEDISCARD",
        class_instr: "EXECUTE",
        class_parameters: {
        }
      },
      responseRequired: true,
      filter: { 
        'PAGEDISCARD_ACKNOWLEDGE': {
          'LASTHEADER': null,
        },
        class_name: 'PAGEDISCARD',
        class_instr: 'ACKNOWLEDGE',
        class_parameters: {
          'LASTHEADER': null,
        },
      },
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

    engine.set('DISABLED');
    logger.set({type: 'progress', mode: 0, classname: 'pageclear', message: `Clearing configurations from page...`})

    let buffer_element = {
      descr: {
        brc_parameters: {
          DX: -127, DY: -127
        },
        class_name: "PAGECLEAR",
        class_instr: "EXECUTE",
        class_parameters: {
        }
      },
      responseRequired: true,
      filter: { 
        class_name: 'PAGECLEAR',
        class_instr: 'ACKNOWLEDGE',
        class_parameters: {
          'LASTHEADER': null,
        },

      },
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