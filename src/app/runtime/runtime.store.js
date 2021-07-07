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

  function grid_update({brc, event}){
    if(event.EVENTTYPE !== 12){
      const store = get(_event);
      if(store.event.elementnumber !== event.ELEMENTNUMBER || store.event.eventtype !== event.EVENTTYPE) {
        _event.update((store)=>{
          store.brc.dx = brc.SX; // coming from source x, will send data back to destination x
          store.brc.dy = brc.SY; // coming from source y, will send data back to destination y
          store.brc.rot = brc.ROT;
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
    grid_update: grid_update,
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
          const enumber = li.event.elementnumber == 255 ? 16 : li.event.elementnumber;
          try {
            _event = device.pages[li.event.pagenumber].control_elements[enumber].events.find(e => e.event.value == li.event.eventtype);
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
        selectedNumber = ui.event.elementnumber == 255 ? 16 : ui.event.elementnumber;

        try {
          elementNumbers = device.pages[ui.event.pagenumber].control_elements;
        } catch (error) {
          console.error(`Requested page ${ui.event.pagenumber} is not loaded, revert to page 0. -> _active_config`)
          elementNumbers = device.pages[0].control_elements;
          instructions.fetchPageCountFromGrid({brc: ui.brc});
        }

        events = elementNumbers[selectedNumber].events;

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
              device.pages = [...device.pages, grid.device.createPage(device.id, 'GRID_REPORT')];
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

      array.forEach((element,index) => {
        element.forEach((ev)=>{
          const operation = new _update();
          operation.status('EDITOR_PROFILE_LOAD');
          operation.event({ELEMENTNUMBER: index, EVENTTYPE: ev.event, PAGENUMBER: li.event.pagenumber});
          operation.config({lua: ev.config});
          operation.sendToGrid();
        })
      })

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

      engine.disable();

      logger.set({type: 'progress', mode: 0, classname: 'pagesave', message: `Preparing configs...`})

      const rt = get(runtime);

      let li = Object.assign({}, _li);

      const { elements, events } = get(_active_config);

      const array = [];

      events.options.forEach(event => {
        elements.options.forEach(elementnumber => {
          array.push({event: event.value, elementnumber});
        })
      })

      array.forEach((elem, ind) => {
        li.event.eventtype = elem.event;
        li.event.elementnumber = elem.elementnumber;
        fetchOrLoadConfig(rt, li);
      })

      writeBuffer.add_last({
        responseRequired: true,
        commandCb: function(){
          writeBuffer.messages.set('ready to save');                
          logger.set({type: 'success', mode: 0, classname: 'pagesave', message: `Ready to save!`});
          engine.enable();
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
        options: elementNumbers.map((n,i) => i)
      },
      pages: {
        selected: ui.event.pagenumber,
        options: pages.map((n,i) => i)
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
    erase: erase_all(),
    unsaved: _unsaved_changes,
  }
}

export const runtime = create_runtime();


function createEngine(){

  let deadline = undefined;
  
  const _strict_command = writable({});

  const _engine = writable([]);

  const _engine_state = derived(_engine, $e => $e.map(val => val.state === 'ENABLED').includes(false) ? 'DISABLED' : 'ENABLED');

  // Glitch is probably buggy with multiple modules
  function glitch(id){
    const rnd = Math.random() * 10;
    if(rnd > 5){
      return -1
    } else {
      return id
    }
  }

  function update_engine(responseSource, state){
    _engine.update(store => {
      let device = store.find(d => d.device == responseSource);
      device.state = state;
      return store;
    });
  }

  function sync(){
    deadline = setTimeout(()=>{
      check();
    },5000)
  }

  function check(){
    const strict = get(_strict_command);
    const { serial } = grid.translate.encode('','GLOBAL', `CONFIG${strict.type.toUpperCase()}`,'CHECK','');
    serialComm.write(serial);
  }

  function resend(serial){
    serialComm.write(serial);
  }

  function disable_all(){

    let state = [];

    const devices = get(_runtime_modules);

    devices.forEach(device => {
      state.push({device: device, state: 'DISABLED'})
    })
  
    _engine.set(state);

  }

  const _strict = function(){

    // initiated from editor
    this.store = function(type, serial, id){ // type equals partly classname

      const devices = get(_runtime_modules);     
      
      let state = [];

      devices.forEach(device => {
        state.push({device: device, state: 'DISABLED'})
      })
    
      _engine.set(state);

      logger.set({type: 'progress', mode: 1, classname: 'strict', message: `${type} in progress...`})

      _strict_command.set({connected: devices, type: type, serial: serial, id: id, debug_id: id});        

      sync();
    }

    // on response from grid
    this.compare = function({brc, lastheader}){

      const strict = get(_strict_command);

      let success = false;

      const responseSource = strict.connected.find(d => d.sx == brc.SX && d.sy == brc.SY);

      if(responseSource){

        if(strict.id == lastheader){
          success = true; // lastheader matches!
          clearTimeout(deadline); // THIS IS ONLY TRIGGERED ONCE, NOT FOR ALL MODULE INFO...
          update_engine(responseSource, 'ENABLED');
          logger.set({type: 'success', mode: 1, classname: 'strict', message: `${strict.type} complete!`});
          runtime.update.one().trigger();
        }

        if(!success){
          update_engine(responseSource, 'RESEND');
          resend(strict.serial);
          logger.set({type: 'alert', mode: 1, classname: 'strict', message: `Resending ${strict.type} command...`})

          // DEBUG
          // _strict_command.update(v => {v.id = v.debug_id; return v});
        }

      }

    }

  }

  return {
    subscribe: _engine.subscribe,
    state: _engine_state,
    enable: () => {
      _engine.set([]);
    },
    disable: disable_all,
    strict: new _strict(),
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
        if(c.short == 'l'){
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
