import { writable, get, derived } from 'svelte/store';
import grid from '../protocol/grid-protocol';
import instructions from '../serialport/instructions';
import _utils from './_utils';

export const appActionClipboard = writable();
export const conditionalConfigPlacement = writable();
export const appMultiSelect = writable({multiselect: false, selection: []});

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
      eventtype: 2
    }
  }

  const _event = writable({...defaultValues})

  function update({brc, event}){
    if(event.EVENTTYPE !== 12){
      const store = get(_event);
      if(store.event.elementnumber !== event.ELEMENTNUMBER || store.event.eventtype !== event.EVENTTYPE ) {
        _event.update((store)=>{
          store.brc.dx = brc.DX;
          store.brc.dy = brc.DY;
          store.brc.rot = brc.ROT
          if(event.ELEMENTNUMBER !== 255){
            store.event.eventtype = event.EVENTTYPE;
            store.event.elementnumber = event.ELEMENTNUMBER;   
          }      
          return store;
        });
      }
    }
  }

  function update_eventtype(value){
    _event.update(s => {s.event.eventtype = value; return s});
  }

  function update_elementnumber(value){
    _event.update(s => {s.event.elementnumber = value; return s});
  }

  function update_pagenumber(value){
    _event.update(s => {s.event.pagenumber = value; return s});

    instructions.changeActivePage({li: get(_event)});

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
    update: update,
    update_eventtype: update_eventtype,
    update_elementnumber: update_elementnumber,
    update_pagenumber: update_pagenumber,
    reset: reset_disconnected
  }
}

export const user_input = create_user_input();

function create_runtime () {

  const _unsaved_changes = writable(0);

  const _trigger_ui_change = writable(0);

  const _runtime = writable([]);

  const findUpdateDestination = (_runtime, li) =>{
    let _event;
    _runtime.forEach((device) => {
      if(device.dx == li.brc.dx && device.dy == li.brc.dy){
        _event = device.pages[li.event.pagenumber].control_elements[li.event.elementnumber].events.find(e => e.event.value == li.event.eventtype);
      }
    });
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
          instructions.fetchPageCountFromGrid({controller});
        }
        return _runtime;
      });
    }

    this.update_pages = function({brc, pagenumber}){
      _runtime.update(_runtime => {
        _runtime.forEach((device)=>{
          if(device.dx == brc.DX && device.dy == brc.DY){
            for (let i = 0; i < pagenumber - 1; i++) {
              device.pages = [...device.pages, grid.device.createPage(device.id)];
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
    let cfgStatus = 'BACKGROUND';

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

  const _active_config = derived([user_input, _trigger_ui_change], ([ui, chng]) => {

    const rt = get(_runtime);

    let pages = [];

    let config = [];
    let events = [];
    let elementNumbers = [];
    let selectedNumber = "";
    let selectedEvent = "";

    rt.forEach(device => {
  
      if(device.dx == ui.brc.dx && device.dy == ui.brc.dy){

        pages = device.pages;
      
        selectedNumber = ui.event.elementnumber;
        elementNumbers = device.pages[ui.event.pagenumber].control_elements;

        events = elementNumbers[selectedNumber].events;
        selectedEvent = events.find(e => e.event.value == ui.event.eventtype);

        
        if(selectedEvent.config.length){
          config = selectedEvent.config.trim();
          console.info('Config is available!');
        } else {
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

  return {
    set: _runtime.set,
    subscribe: _runtime.subscribe,
    update: new _runtime_update(),
    device: new _device_update(),
    active_config: _active_config.subscribe,
    unsaved: _unsaved_changes,
  }
}

function createDebug(){
  const store = writable({enabled: true, data: []});

  return {
    ...store,
    update_debugtext: (debugtext) => {
      store.update(d => {
        if(d.enabled){
          if(d.data.length >= 15){
            d.data.shift()
          }
          d.data = [...d.data, debugtext];
        }
        return d;
      })
    }
  }
}

export const debug = createDebug();

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
      let locals = [];
      configs.forEach(c => {
        if(c.short == 'l'){
          let arr = [];
          const text = c.script.split('local');
          text.forEach(element => {
            if(element !== ''){
              const _split = element.split('=');
              arr.push({value: _split[0].trim(), info: _split[0].trim()});
            }
          });
          locals.push(...arr);
        }
      });
      store.set(locals);
    }
  }
}

export const localDefinitions = createLocalDefinitions();

function createDropStore () {
  
  const store = writable([]);

  return {
    ...store,
    update: (configs) => {
      let disabled_blocks = [];
      let if_block = false;
      configs.forEach((a,index) => {
        // check if it's and if block
        if(a.component.name == 'If'){
          if_block = true;
        }
    
        // don't add +1 id in the array (end)
        if(if_block && a.component.name !== 'End'){
          disabled_blocks.push(index);
        }
        
        // this is the last, as END has to be disabled too!
        if (a.component.name == 'End'){
          if_block = false;
        }
      });

      store.set(disabled_blocks);

    }
  }
}

export const dropStore = createDropStore();