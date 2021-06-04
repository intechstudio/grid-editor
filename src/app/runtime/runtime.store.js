import { writable, get, derived } from 'svelte/store';
import stringManipulation from '../main/user-interface/_string-operations';
import { actionPrefStore } from '../main/_stores/app-helper.store';
import grid from '../protocol/grid-protocol';
import instructions from '../serialport/instructions';
import _utils from './_utils';

export const appActionClipboard = writable([]);
export const conditionalConfigPlacement = writable();

function createLogger(){
  const _log_store = writable('');
  const _trigger = writable(0);

  function set_log(value){
    _log_store.set(value);
    _trigger.update(n => n + 1);
  }

  const _log = derived([_log_store, _trigger],([$s, $t])=> {
    return {message: $s, n: $t}
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
          try {
            _event = device.pages[li.event.pagenumber].control_elements[li.event.elementnumber].events.find(e => e.event.value == li.event.eventtype);
          } catch (error) {    
            console.error('Couldn\'t update in destination: ', li)
          }
        }
      });
    }
    return _event;
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

  

  const _runtime_update = function() {
    
    const li = get(user_input);
    let code = '';
    let cfgStatus = 'EDITOR_BACKGROUND';

    this.status = function(status) {
      cfgStatus = status;
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

  const _runtime_unsaved = function() {

    const li = get(user_input);

    this.setToZero = function(){
      _unsaved_changes.set(0);
      return this;
    }

    this.throw = function(){
      _runtime.update(_runtime => {
        _runtime.forEach((device)=>{
          console.log(device.pages[li.event.pagenumber].control_elements);
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
  const _active_config = derived([user_input, _trigger_ui_change], ([ui, chng]) => {

    // whenever the UI changes, disable multiselect
    appMultiSelect.reset();

    actionPrefStore.reset();

    const rt = get(_runtime);

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

        try {
          elementNumbers = device.pages[ui.event.pagenumber].control_elements;
        } catch (error) {
          console.error(`Requested page ${ui.event.pagenumber} is not loaded, revert to page 0. -> _active_config`)
          elementNumbers = device.pages[0].control_elements;
          console.info(`Fetch pages from grid!`);
          instructions.fetchPageCountFromGrid({brc: ui.brc});
        }

        events = elementNumbers[selectedNumber].events;

        // don't let selection of event, which is not on that control element
        let f_event = events.find(e => e.event.value == ui.event.eventtype);
        selectedEvent = f_event ? f_event : events[events.length - 1];        

        if(selectedEvent.config.length){
          config = selectedEvent.config.trim();
          console.info('Config is available!');
        }
        
        if(!['GRID_REPORT', 'EDITOR_EXECUTE', 'EDITOR_BACKGROUND'].includes(selectedEvent.cfgStatus)){
          selectedEvent.cfgStatus = 'FETCHED';
          instructions.fetchConfigFromGrid({device: device, inputStore: ui});     
          console.info('Config Fetched!');
        }

      }
    });

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

  // this is used for copy and select_all in config management.
  // previously active_config was used, but we are updating the runtime without direct UI changes.
  // we need to fetch active lua from the runtime itself, instead of the UI builder _active_config store.
  const _active_lua = derived([_runtime, user_input], ([rt, ui]) => {

    let config = undefined;

    rt.forEach((device)=>{
      if(device.dx == ui.brc.dx && device.dy == ui.brc.dy && ui.event.elementnumber !== -1){

        let elementNumbers = [];

        try {
          elementNumbers = device.pages[ui.event.pagenumber].control_elements;
        } catch (error) {
          console.error(`Requested page ${ui.event.pagenumber} is not loaded, revert to page 0. -> _active_lua`)
          elementNumbers = device.pages[0].control_elements;
        }

        let events = elementNumbers[ui.event.elementnumber].events;

        // don't let selection of event, which is not on that control element
        let f_event = events.find(e => e.event.value == ui.event.eventtype);
        let selectedEvent = f_event ? f_event : events[events.length - 1];        

        if(selectedEvent.config.length){
          config = selectedEvent.config.trim();
        }
      }
    })

    return config;
  })

  return {
    set: _runtime.set,
    subscribe: _runtime.subscribe,
    update: new _runtime_update(),
    device: new _device_update(),
    unsave: new _runtime_unsaved(),
    active_config: _active_config.subscribe,
    unsaved: _unsaved_changes,
    active_lua: _active_lua.subscribe
  }
}

function createDebug(){
  const store = writable({config: '',enabled: true, data: []});

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

export const runtime = create_runtime();

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
            arr.push({info: val.trim(), value:  val.trim()});
          });
        }
      });

      store.set(arr);
    }
  }
}

export const localDefinitions = createLocalDefinitions();