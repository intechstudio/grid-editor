import { writable, get, derived } from 'svelte/store';
import stringManipulation from '../main/user-interface/_string-operations';
import { actionPrefStore } from '../main/_stores/app-helper.store';
import grid from '../protocol/grid-protocol';
import instructions from '../serialport/instructions';
import { serialComm } from '../serialport/serialport.store';
import { writeBuffer } from './engine.store';
import _utils from './_utils';

export const appActionClipboard = writable([]);
export const conditionalConfigPlacement = writable();

function createLogger(){
  const _log_store = writable({type:'', message: '', classname: ''});
  const _trigger = writable(0);

  function set_log(value){
    _log_store.set(value);
    _trigger.update(n => n + 1);
  }

  const _log = derived([_trigger],([$t])=> {
    return {...get(_log_store), n: $t}
  });

  return{
    set: set_log,
    subscribe: _log.subscribe
  }
}

export const logger = createLogger();

function createMultiSelect(){

  const default_values = {multiselect: false, selection: [], enabled: false, all_selected: false};

  const store = writable(default_values);

  return {
    ...store,
    reset: () => {
      store.update(s => {
        s.multiselect = false; 
        s.all_selected = false;
        s.selection = []; 
        s.enabled = false;
        return s;
      })
    }
  }

}

export const appMultiSelect = createMultiSelect();

function create_user_input () {

  const defaultValues = { 
    brc: {
      dx: "0",
      dy: "0",
      rot: "0"
    },
    event: {
      pagenumber: 0,
      elementnumber: -1, // should be checked out if grid sends back array or not
      eventtype: 2,
    }
  }

  const _event = writable({...defaultValues});
  
  const _param = writable([]);

  const _active_input = derived([_event, _param], ([$e, $p]) => { 

    return {
      selected: $e,
      eventparams: $p
    }

  });

  function update_eventparam({brc, event}){
    // update more than one user input eventparam for cool ui tweaks!
    _param.update((s)=>{
      s = [brc, event];
      return s;
    })
  }

  function getIdFromRuntimeByBrc(brc){
    try {
      const rt = get(runtime);
      const moduleByBrc = rt.find(x => x.dx == brc.SX && x.dy == brc.SY);
      return moduleByBrc.id.substr(0,4);
    } catch (error) {
      console.error('Sorry, module ID is not extracted!')
      return "undefined";
    }
  }

  function process_incoming_from_grid({brc, event}){
    if(event.EVENTTYPE !== 12){
      const store = get(_event);
      if(store.event.elementnumber !== event.ELEMENTNUMBER || store.event.eventtype !== event.EVENTTYPE) {
        _event.update((store)=>{
          store.brc.dx = brc.SX; // coming from source x, will send data back to destination x
          store.brc.dy = brc.SY; // coming from source y, will send data back to destination y
          store.brc.rot = brc.ROT;
          store.id = getIdFromRuntimeByBrc(brc);
          if(event.ELEMENTNUMBER !== 255){
            store.event.eventtype = event.EVENTTYPE;
            store.event.elementnumber = event.ELEMENTNUMBER;       
          }      
          return store;
        });
      }
    }
  }

  const _update = function(){

    this.pagenumber = function(value){
      const store = get(_event);

      // only update pagenumber if it differs from the runtime pagenumber
      if(store.event.pagenumber !== value){ 

        _event.update(s => {s.event.pagenumber = value; return s});

        // clean up the writebuffer if pagenumber changes!
        writeBuffer.clean_up.all();

      }

      return this;
    }

    this.sendToGrid = function(){
      instructions.changeActivePage({li: get(_event)});
      return this;
    }

  }

  function update_eventtype(value){
    _event.update(s => {s.event.eventtype = value; return s});
  }

  function update_elementnumber(value){
    _event.update(s => {s.event.elementnumber = value; return s});
  }

  function reset_disconnected(removed = 'reset'){
    // This is used to re-init local settings panel if a module is removed which values have been displayed
    const current = get(_event);

    if(removed.dx == current.brc.dx && removed.dy == current.brc.dy){
      _event.set({...defaultValues})
    }

    if(removed == 'reset'){
      _event.set({...defaultValues});
    }
  }

  return {
    ..._event,
    subscribe: _event.subscribe,
    update: _event.update,
    process_incoming_from_grid: process_incoming_from_grid,
    update_eventtype: update_eventtype,
    update_elementnumber: update_elementnumber,
    update_pagenumber: new _update(),
    update_eventparam: update_eventparam,
    active_input: _active_input.subscribe,
    reset: reset_disconnected
  }
}

export const user_input = create_user_input();

function create_runtime () {

  const _unsaved_changes = writable(0);

  const _trigger_ui_change = writable(0);

  const _runtime = writable([]);

  const findUpdateDestination = (_runtime, li) =>{
    let _event = undefined;
    // this elementnumber check refers to uninitialized UI...
    if(li.event.elementnumber !== -1){
      _runtime.forEach((device) => {
        if(device.dx == li.brc.dx && device.dy == li.brc.dy){
          try {
            const pageIndex = device.pages.findIndex(x => x.pageNumber == li.event.pagenumber);
            const elementIndex = device.pages[pageIndex].control_elements.findIndex(x => x.controlElementNumber == li.event.elementnumber);
            _event = device.pages[pageIndex].control_elements[elementIndex].events.find(e => e.event.value == li.event.eventtype);
          } catch (error) {    
            console.error('Couldn\'t update in destination: ', li)
          }
        }
      });
    }
    return _event;
  }

  const fetchOrLoadConfig = (rt, ui) => {
    
    let pages = [];

    let config = [];
    let events = [];
    let elementNumbers = [];
    let selectedNumber = "";
    let selectedEvent = "";

    rt.forEach(device => {
  
      if(device.dx == ui.brc.dx && device.dy == ui.brc.dy && ui.event.elementnumber !== -1){

        pages = device.pages;
        selectedNumber = ui.event.elementnumber;

        const pageIndex = device.pages.findIndex(x => x.pageNumber == ui.event.pagenumber);

        try {
          elementNumbers = device.pages[pageIndex].control_elements;
        } catch (error) {
          console.error(`Requested page ${ui.event.pagenumber} is not loaded, revert to page 0. -> _active_config`)
          elementNumbers = device.pages[0].control_elements;
          instructions.fetchPageCountFromGrid({brc: ui.brc});
        }

        const elementIndex = elementNumbers.findIndex(x => x.controlElementNumber == ui.event.elementnumber);

        events = elementNumbers[elementIndex].events;

        // don't let selection of event, which is not on that control element
        let f_event = events.find(e => e.event.value == ui.event.eventtype);
        selectedEvent = f_event ? f_event : events[events.length - 1];     
        
        // on switching between system and ui events, set proper eventtype for fetching config
        // f_event is undefined, if currently stored ui eventtype is not found on control element
        if(!f_event){
          ui.event.eventtype = events[events.length - 1].event.value;
        }

        if(selectedEvent.config.length){
          config = selectedEvent.config.trim();
          //console.log('CONFIG TO RETURN', config)
        }
        
        // ui elementnumber 255 (utility fetch) is handles in instructions.js
        if(!['GRID_REPORT', 'EDITOR_EXECUTE', 'EDITOR_BACKGROUND'].includes(selectedEvent.cfgStatus)){
          selectedEvent.cfgStatus = 'FETCHED';
          runtime.fetch.One(device, ui);  
        }
      }
    });

    return {pages, config, events, elementNumbers, selectedEvent, selectedNumber};

  }

  const _device_update = function(){

    this.is_online = function(controller){
      _runtime.update((_runtime) => {
        let online = false;
        _runtime.forEach(device => {
          // device is online, update the uptime
          if(device.id == controller.id){
            online = true;
            device.rot = controller.rot; // UPDATE ROTATION, AS NEIGHTBOUR MODULE REMEMBERS INVALID ROT!
            device.alive = Date.now();
          }
        });
        // device not found, add it to runtime and get page count from grid
        if(!online){
          _runtime.push(controller);
          instructions.fetchPageCountFromGrid({brc: controller});
        }
        return _runtime;
      });
    }

    this.update_pages = function({brc, pagenumber}){
      // this is called as many modules there are, because the pagecount fetch is global.
      // we should device which pagenumber is the meta
      _runtime.update(_runtime => {
        _runtime.forEach((device)=>{
          // don't make pages if there are already same amount of pages...
          if(device.dx == brc.SX && device.dy == brc.SY && pagenumber !== device.pages.length){
            for (let i = 0; i < pagenumber - 1; i++) {
              device.pages = [...device.pages, grid.device.createPage(device.id, 'GRID_REPORT', i+1)];
            }
          }
        })
        return _runtime;
      })
    }
  }

  function erase_all(){

    _runtime.update(rt => {
      rt.forEach(device => {
        device.pages.forEach(page => {
          page.control_elements.forEach(events => {
            events.events.forEach(event => {
              event.config = '';
              event.cfgStatus = 'ERASED'
            })
          })
        })
      });
      return rt;
    })

  }

  const _runtime_update = function() {

    this.batch = function(array){

      const li = get(user_input);

      array.forEach((element) => {
        element.events.forEach((ev)=>{
          const operation = new _update();
          operation.status('EDITOR_PROFILE_LOAD');
          operation.event({ELEMENTNUMBER: element.controlElementNumber, EVENTTYPE: ev.event, PAGENUMBER: li.event.pagenumber});
          operation.config({lua: ev.config});
          operation.sendToGrid();
        });
      });

    };

    this.one = function(){

      const operation = new _update();

      return {
        status: operation.status,
        event: operation.event,
        config: operation.config,
        sendToGrid: operation.sendToGrid,
        trigger: operation.trigger
      };
    }

    const _update = function(){
    
      let li = get(user_input);
      let code = '';
      let cfgStatus = 'EDITOR_BACKGROUND';

      this.status = function(status) {
        cfgStatus = status;
        return this;
      };

      this.event = function(evt){
        li.event.eventtype = evt.EVENTTYPE;
        li.event.pagenumber = evt.PAGENUMBER;
        li.event.elementnumber = evt.ELEMENTNUMBER;
        return this;
      };

      this.config = function({lua}) {
        code = lua;
        _runtime.update(_runtime => {
          let dest = findUpdateDestination(_runtime, li);
          if (dest) {
            dest.config = lua.trim();
            dest.cfgStatus = cfgStatus;
          }    
          return _runtime;
        })
        return this;
      };

      this.sendToGrid = function(){
        _unsaved_changes.update(n => n + 1);
        console.log(code);
        instructions.sendConfigToGrid({lua: code, li: li});
        return this;
      };

      this.trigger = function(){
        _trigger_ui_change.update(n => n + 1);
        return this;
      };

    }

  }
  
  const _runtime_fetch = function() {

    const _li = get(user_input);

    this.One = function(device, ui){
      instructions.fetchConfigFromGrid({device: device, inputStore: ui});
      return this;
    }

    // fetches all config from each action and event on current page + utility button
    this.Many = function(){

      writeBuffer.add_first({
        commandCb: function(){
          engine.set('DISABLED');
          logger.set({type: 'progress', mode: 0, classname: 'profilesave', message: `Preparing configs...`})
        }
      });

      const rt = get(runtime);

      let li = Object.assign({}, _li);

      const { elements, events } = get(_active_config);

      const array = [];

      events.options.forEach(event => {
        elements.options.forEach(elementnumber => {
          array.push({event: event.value, elementnumber});
        });
      });

      array.forEach((elem, ind) => {
        li.event.eventtype = elem.event;
        li.event.elementnumber = elem.elementnumber;
        fetchOrLoadConfig(rt, li);
      })

      writeBuffer.add_last({
        //responseRequired: true,
        commandCb: function(){
          writeBuffer.messages.set('ready to save');                
          logger.set({type: 'progress', mode: 0, classname: 'profilesave', message: `Ready to save profile!`});
          engine.set('ENABLED');
        }
      });
     
      return this;
    }

  }

  const _runtime_changes = function() {

    const li = get(user_input);

    this.setToZero = function(){
      _unsaved_changes.set(0);
      return this;
    }

    this.throw = function(){
      _runtime.update(_runtime => {
        _runtime.forEach((device)=>{
          device.pages[li.event.pagenumber].control_elements.forEach(control_element =>{
            control_element.events.forEach((event)=>{
              if(['GRID_REPORT', 'EDITOR_EXECUTE', 'EDITOR_BACKGROUND'].includes(event.cfgStatus)){
                event.config = '';
                event.cfgStatus = 'NULL';
              }
            })
          })
        });
        return _runtime;
      })
      return this
    }

    this.trigger = function(){
      // epicly shitty workaround before implementing acknowledge state management
      setTimeout(()=>{
        _trigger_ui_change.update(n => n + 1);
        return this;
      }, 150)
    }

  }

  // this is used to refresh the user interface in the active right panel
  // also used for config management, copy paste etc

  const _active_config = derived([user_input, _trigger_ui_change], ([ui, chng]) => {

    // whenever the UI changes, reset multiselect
    appMultiSelect.reset();

    // close advanced views
    actionPrefStore.reset();

    const rt = get(_runtime);

    const {config, events, selectedEvent, selectedNumber, pages, elementNumbers } = fetchOrLoadConfig(rt, ui);

    return {
      config: config, 
      events: {
        selected: selectedEvent.event,
        options: events.map(e => e.event)
      }, 
      elements: {
        selected: selectedNumber,
        options: elementNumbers.map((n) => n.controlElementNumber)
      },
      pages: {
        selected: ui.event.pagenumber,
        options: pages.map((n) => n.pageNumber)
      }
    }
  })

  return {
    set: _runtime.set,
    subscribe: _runtime.subscribe,
    active_config: _active_config.subscribe,
    update: new _runtime_update(),
    fetch: new _runtime_fetch(),
    device: new _device_update(),
    changes: new _runtime_changes(),
    erase: erase_all,
    unsaved: _unsaved_changes,
  }
}

export const runtime = create_runtime();


function createEngine(){
  
  const _engine = writable('ENABLED');

  return {
    ..._engine
  }

}

export const engine = createEngine();

function createDebug(){
  const store = writable({config: '', enabled: true, data: []});

  return {
    ...store,
    update_config: (value) => {
      store.update(s => {s.config = value; return s})
    },
    update_debugtext: ({brc,text}) => {
      store.update(d => {
        if(d.enabled){
          if(d.data.length >= 15){
            d.data.shift()
          }
          d.data = [...d.data, `[${brc.SX},${brc.SY}] ${text}`];
        }
        return d;
      })
    }
  }
}


function createMidiMonitor(){

  const store = writable([]);

  return {
    ...store,
    update_midi: ({brc,midi}) => {
      store.update(s => {
        if(s.length >= 30){
          s.shift()
        };

        midi.sx = brc.SX;
        midi.sy = brc.SY;

        s = [...s, midi];
        return s;
      })
    }
  }
}

export const midi_monitor_store = createMidiMonitor();

export const debug_store = createDebug();

export const heartbeat = writable({
  editor: 300,
  grid: 300
})



function createLocalDefinitions(){
  
  const store = writable();

  return {
    ...store,
    update: (configs) => {

      let arr = [];

      configs.forEach((c) => {
        if(c.short == 'l' && c.script !== ''){
          let _variable_array = c.script.split('=')[0];
          _variable_array = _variable_array.split('local')[1];
          _variable_array = _variable_array.split(',');
          _variable_array.forEach((val,i) => {
            arr.push({info: `local - ${val.trim()}`, value:  val.trim()});
          });
        }
      });

      store.set(arr);
    }
  }
}

export const localDefinitions = createLocalDefinitions();

export const _runtime_modules = derived(runtime, $rt => {
  let arr = [];
  $rt.forEach(device => {
    arr.push({device: device.id, sx: device.dx, sy: device.dy});
  })
  return arr;
});
