import { writable, get, derived } from 'svelte/store';
import stringManipulation from '../main/user-interface/_string-operations';
import { actionPrefStore, appSettings } from '../main/_stores/app-helper.store';
import grid from '../protocol/grid-protocol';
import instructions from '../serialport/instructions';
import { serialComm } from '../serialport/serialport.store';
import { writeBuffer } from './engine.store';
import _utils from './_utils';



// The controller which is added to runtime first, load a default config!
let first_connection = true;

let selection_changed_timestamp = 0;

export const controlElementClipboard = writable([]);
export const appActionClipboard = writable([]);
export const conditionalConfigPlacement = writable();

export const elementPositionStore = writable({});
export const ledColorStore = writable({});

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

  const default_values = {multiselect: false, selection: [], all_selected: false};

  const store = writable(default_values);

  return {
    ...store,
    reset: () => {
      store.update(s => {
        s.multiselect = false; 
        s.all_selected = false;
        s.selection = []; 
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

  function update_eventparam(descr){
    
    let eps = get(elementPositionStore);  

    if (eps[descr.brc_parameters.SX] === undefined){
      eps[descr.brc_parameters.SX] = {};
    }
    if (eps[descr.brc_parameters.SX][descr.brc_parameters.SY] === undefined){
      eps[descr.brc_parameters.SX][descr.brc_parameters.SY] = {};
    }
    if (eps[descr.brc_parameters.SX][descr.brc_parameters.SY][descr.class_parameters.ELEMENTNUMBER] === undefined){
      eps[descr.brc_parameters.SX][descr.brc_parameters.SY][descr.class_parameters.ELEMENTNUMBER] = -1;
    }

    eps[descr.brc_parameters.SX][descr.brc_parameters.SY][descr.class_parameters.ELEMENTNUMBER] = descr.class_parameters.EVENTPARAM;
 
    elementPositionStore.set(eps);

    // mocking led color values

    let lcs = get(ledColorStore);
    if (lcs[descr.brc_parameters.SX] === undefined){
      lcs[descr.brc_parameters.SX] = {};
    }
    if (lcs[descr.brc_parameters.SX][descr.brc_parameters.SY] === undefined){
      lcs[descr.brc_parameters.SX][descr.brc_parameters.SY] = {};
    }
    if (lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][descr.class_parameters.ELEMENTNUMBER] === undefined){
      lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][descr.class_parameters.ELEMENTNUMBER] = [0,0,0];
    }

    lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][descr.class_parameters.ELEMENTNUMBER][0] = 0.1*eps[descr.brc_parameters.SX][descr.brc_parameters.SY][descr.class_parameters.ELEMENTNUMBER]*2;
    lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][descr.class_parameters.ELEMENTNUMBER][1] = 0.4*eps[descr.brc_parameters.SX][descr.brc_parameters.SY][descr.class_parameters.ELEMENTNUMBER]*2;
    lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][descr.class_parameters.ELEMENTNUMBER][2] = 0.8*eps[descr.brc_parameters.SX][descr.brc_parameters.SY][descr.class_parameters.ELEMENTNUMBER]*2;

    ledColorStore.set(lcs);

    // old implementation

    _param.update((s)=>{
      s = [descr.brc_parameters, descr.class_parameters];
      return s;
    })
  }



  function process_incoming_from_grid(descr){

    // engine is disabled
    if ( get(engine) === "DISABLED"){
      return;
    }

    // track physical interaction
    if (!get(appSettings).changeOnContact){
      return;
    }


    // event is init, mapmode, midirx, timer
    if (descr.class_parameters.EVENTTYPE == 0 || descr.class_parameters.EVENTTYPE == 4 || descr.class_parameters.EVENTTYPE == 5 || descr.class_parameters.EVENTTYPE == 6 ){
      return;
    }

    // system element
    if(descr.class_parameters.ELEMENTNUMBER == 255){
      return; 
    }
    const store = get(_event);
    
    // filter same control element had multiple interactions
    let elementDifferent = (store.event.elementnumber != descr.class_parameters.ELEMENTNUMBER);
    let eventDifferent = (store.event.eventtype != descr.class_parameters.EVENTTYPE);
    let sxDifferent = (store.brc.dx != descr.brc_parameters.SX);
    let syDifferent = (store.brc.dy != descr.brc_parameters.SY);

    if(eventDifferent || elementDifferent || sxDifferent || syDifferent) {

      let current_timestamp = Date.now();

      if (current_timestamp-100>selection_changed_timestamp){
        selection_changed_timestamp = current_timestamp;
      }
      else{
        return;
      }

      _event.update((store) => {

        // lets find out what type of module this is....
        store.brc.dx = descr.brc_parameters.SX; // coming from source x, will send data back to destination x
        store.brc.dy = descr.brc_parameters.SY; // coming from source y, will send data back to destination y
        store.brc.rot = descr.brc_parameters.ROT;
        
        store.event.elementtype = descr.class_parameters.ELEMENTTYPE;
        store.event.eventtype = descr.class_parameters.EVENTTYPE;
        store.event.elementnumber = descr.class_parameters.ELEMENTNUMBER;       
        
        return store;
      });
    }
    else{

      let current_timestamp = Date.now();
      //console.log(current_timestamp - selection_changed_timestamp);
      selection_changed_timestamp = current_timestamp;
    }
  
  }

  const _update = function(){

    this.change_page = function(new_page_number){

      if(get(engine) !== 'ENABLED'){
        return this;
      }

      const store = get(_event);

      // only update pagenumber if it differs from the runtime pagenumber
      if(store.event.pagenumber !== new_page_number){ 

        _event.update(s => {s.event.pagenumber = new_page_number; return s});

        // clean up the writebuffer if pagenumber changes!
        writeBuffer.clean_up.all();

        instructions.changeActivePage(new_page_number);

      }

      return this;
    }

  }

  function update_eventtype(value){
    const eventtype = get(user_input).event.eventtype;
    if(eventtype != value){
      _event.update(s => {s.event.eventtype = value; return s});
    }
  }

  function update_elementnumber(value){
    const elementnumber = get(user_input).event.elementnumber;
    if(elementnumber != value){
      _event.update(s => {s.event.elementnumber = value; return s});
    }
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

  const findUpdateDestEvent = (_runtime, dx, dy, page, element, event) =>{

    let _event = undefined;
    // this elementnumber check refers to uninitialized UI...
    if(element !== -1){
      _runtime.forEach((device) => {
        if(device.dx == dx && device.dy == dy){
          try {
            const pageIndex = device.pages.findIndex(x => x.pageNumber == page);
            const elementIndex = device.pages[pageIndex].control_elements.findIndex(x => x.controlElementNumber == element);
            _event = device.pages[pageIndex].control_elements[elementIndex].events.find(e => e.event.value == event);
          } catch (error) {    
            console.error('Couldn\'t update in destination: ', li)
          }
        }
      });
    }
    return _event;
  }

  function fetchOrLoadConfig (ui, callback) {
    

    const rt = get(runtime);

    const device = rt.find(device => device.dx == ui.brc.dx && device.dy == ui.brc.dy)
    const pageIndex = device.pages.findIndex(x => x.pageNumber == ui.event.pagenumber);
    const elementIndex = device.pages[pageIndex].control_elements.findIndex(x => x.controlElementNumber == ui.event.elementnumber);
    const eventIndex = device.pages[pageIndex].control_elements[elementIndex].events.findIndex(x => x.event.value == ui.event.eventtype);


    const cfgstatus = device.pages[pageIndex].control_elements[elementIndex].events[eventIndex].cfgStatus;

    if (cfgstatus == 'GRID_REPORT' || cfgstatus == 'EDITOR_EXECUTE' || cfgstatus == 'EDITOR_BACKGROUND' ){
      // its loaded
      if (callback !== undefined){
        callback();
      }

    }
    else{
      // fetch
      const dx = ui.brc.dx;
      const dy = ui.brc.dy;
      const page =  ui.event.pagenumber;
      const element = ui.event.elementnumber;
      const event = ui.event.eventtype;

      console.log("fetchOrLoad")
      instructions.fetchConfigFromGrid(dx, dy, page, element, event, callback);
    }

    return;

  }

  

  const _device_update = function(){

    this.heartbeat_incoming_handler = function(descr){

      let controller = grid.device.make(descr.brc_parameters, descr.class_parameters, false);

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
          // this is not working because it fetches all and blocks ui
          instructions.fetchPageCountFromGrid({brc: controller});
          if(first_connection){
            user_input.update((ui)=>{
              ui.id = controller.id;
              ui.dx = controller.dx;
              ui.dy = controller.dy;
              ui.event.elementnumber = 0;
              ui.event.eventtype = 0;
              return ui;
            });
            first_connection = false;
          }
        }
        return _runtime;
      });
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

    // whole element overwrite
    this.control_element = function ({controlElementType, events}){

      const li = get(user_input);

      if(li.event.elementtype == controlElementType){
        events.forEach((ev, index) => {

          let callback;
          if (index === events.length-1){ // last element
            callback = function(){               
              logger.set({type: 'success', mode: 0, classname: 'elementoverwrite', message: `Overwrite done!`});
            };
          }
          else{
            callback = undefined;
          }


          let li = get(user_input);

          li.event.pagenumber = li.event.pagenumber;
          li.event.elementnumber = li.event.elementnumber;
          li.event.eventtype = ev.event.value;

          const dx = li.brc.dx;
          const dy = li.brc.dx;
          const page =  li.event.pagenumber;
          const element = li.event.elementnumber;
          const event = li.event.eventtype;

          _runtime.update(_runtime => {
            let dest = findUpdateDestEvent(_runtime, dx, dy, page, element, event);
            if (dest) {
              dest.config = ev.config.trim();
              dest.cfgStatus = 'EDITOR_BACKGROUND';
            }    
            return _runtime;
          })

          const lua = ev.config;
          instructions.sendConfigToGrid(lua, li, callback);
          runtime.update.one().trigger();

        });

      } else {
        logger.set({type: 'fail', mode: 0, classname: 'elementoverwrite', message: `Target element is different!`})
      }
      
      
    };

    this.page = function(array){


      engine.set('DISABLED');
      logger.set({type: 'progress', mode: 0, classname: 'profileload', message: `Profile load started...`})

      array.forEach((element, elementIndex) => {

        element.events.forEach((ev, eventIndex)=>{

          // ============ const operation = new _update();
          let li = get(user_input);

          li.event.pagenumber = li.event.pagenumber;
          li.event.elementnumber = element.controlElementNumber;
          li.event.eventtype = ev.event;

          const dx = li.brc.dx;
          const dy = li.brc.dx;
          const page =  li.event.pagenumber;
          const element = li.event.elementnumber;
          const event = li.event.eventtype;

          _runtime.update(_runtime => {
            let dest = findUpdateDestEvent(_runtime, dx, dy, page, element, event);
            if (dest) {
              dest.config = ev.config.trim();
              dest.cfgStatus = 'EDITOR_BACKGROUND';
            }    
            return _runtime;
          })

          let callback;

          if (elementIndex === array.length-1 && eventIndex === element.events.length-1){
            // this is last element so we need to add the callback
            callback = function(){
              engine.set('ENABLED');
              logger.set({type: 'success', mode: 0, classname: 'profileload', message: `Profile load complete!`});
              runtime.update.one().trigger();
            };
          }

          const lua = ev.config;
          instructions.sendConfigToGrid(lua, li, callback);

        });
      });

    };

    this.one = function(){

      const operation = new _update();

      return {
        set_configuration: operation.set_configuration,
        send_configuration_to_grid: operation.send_configuration_to_grid,
        trigger: operation.trigger
      };
    }

    const _update = function(){

      this.set_configuration = function(dx, dy, page, element, event, actionstring, status) {

        // config
        _runtime.update(_runtime => {
          

          let dest = findUpdateDestEvent(_runtime, dx, dy, page, element, event);
          if (dest) {
            dest.config = actionstring;
            dest.cfgStatus = status;
          }    
          return _runtime;
        })
        return this;
      };

      this.send_configuration_to_grid = function(dx, dy, page, element, event, callback){
        
        let rt = get(_runtime);

        let dest = findUpdateDestEvent(rt, dx, dy, page, element, event);
        if (dest) {
          instructions.sendConfigToGrid( dx, dy, page, element, event, dest.config, callback);
        } 
        else{
          console.error("DEST not found!")
        } 
        
        return this;
      };

      this.trigger = function(){
        _trigger_ui_change.update(n => n + 1);
        return this;
      };

    }

  }
  


  const _runtime_fetch = function() {

    // whole element copy: fetches all event configs from a control element
    this.ControlElement = function (){

      engine.set('DISABLED');
      logger.set({type: 'progress', mode: 0, classname: 'elementcopy', message: `Copy events from element...`})
      

      const li = get(user_input);
      const rt = get(runtime);

      const device = rt.find(device => device.dx == li.brc.dx && device.dy == li.brc.dy);
      const pageIndex = device.pages.findIndex(x => x.pageNumber == li.event.pagenumber);
      const elementIndex = device.pages[pageIndex].control_elements.findIndex(x => x.controlElementNumber == li.event.elementnumber);

      const events = device.pages[pageIndex].control_elements[elementIndex].events;
      const controlElementType = device.pages[pageIndex].control_elements[elementIndex].controlElementType;

      const array = [];

      events.forEach(e => {
        array.push({event: e.event.value, elementnumber: device.pages[pageIndex].control_elements[elementIndex].controlElementNumber})
      })

      array.forEach((elem, ind) => {
        li.event.eventtype = elem.event;
        li.event.elementnumber = elem.elementnumber;

        console.log("WholeElement", li);

        if (ind == array.length-1){ // is this the last?

          let callback = function(){            
            logger.set({type: 'success', mode: 0, classname: 'elementcopy', message: `Events are copied!`});
            engine.set('ENABLED');
            controlElementClipboard.set({controlElementType, events});
            console.log("WHOLE ELEMENT COPY", controlElementType, events);
          };


          fetchOrLoadConfig(li, callback);
        }
        else{
          fetchOrLoadConfig(li);
        }
        
      })

      return {events, controlElementType}; // this is a reference for the control elements in question
    }

    // fetches all config from each action and event on current page + utility button
    this.FullPage = function(callback){

      engine.set('DISABLED');
      logger.set({type: 'progress', mode: 0, classname: 'profilesave', message: `Preparing configs...`})

      const rt = get(runtime);

      let li = Object.assign({}, get(user_input));

      const device = rt.find(device => device.dx == li.brc.dx && device.dy == li.brc.dy);
      const pageIndex = device.pages.findIndex(x => x.pageNumber == li.event.pagenumber);
      const controlElements = device.pages[pageIndex].control_elements;

      const array = [];

      controlElements.forEach((controlElement) => {
        controlElement.events.forEach((elem) => {
          array.push({event: elem.event.value, elementnumber: controlElement.controlElementNumber})
        })
      })


      array.forEach((elem, ind) => {

        li.event.eventtype = elem.event;
        li.event.elementnumber = elem.elementnumber;

        if (ind === array.length-1){ // last element

          fetchOrLoadConfig(li, callback);
        }
        else{
          fetchOrLoadConfig(li);
        }


      })
     
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


  const _active_config = derived([user_input, _trigger_ui_change], ([ui, chng]) => {

    // whenever the UI changes, reset multiselect
    appMultiSelect.reset();

    // close advanced views
    actionPrefStore.reset();

    const rt = get(_runtime);


    // fetch or load config now inline
    
    let config = [];
    let selectedEvent = "";


    const device = rt.find(device => device.dx == ui.brc.dx && device.dy == ui.brc.dy)

    if (device === undefined){
      return;
    }


    const pageIndex = device.pages.findIndex(x => x.pageNumber == ui.event.pagenumber);
    const elementIndex = device.pages[pageIndex].control_elements.findIndex(x => x.controlElementNumber == ui.event.elementnumber);
    const eventIndex = device.pages[pageIndex].control_elements[elementIndex].events.findIndex(x => x.event.value == ui.event.eventtype);


    selectedEvent = device.pages[pageIndex].control_elements[elementIndex].events[eventIndex];

    if(selectedEvent.config.length){
      config = selectedEvent.config.trim();
    }

    const cfgstatus = device.pages[pageIndex].control_elements[elementIndex].events[eventIndex].cfgStatus;

    if (cfgstatus == 'GRID_REPORT' || cfgstatus == 'EDITOR_EXECUTE' || cfgstatus == 'EDITOR_BACKGROUND' ){
      // its loaded
    }
    else{
      // fetch      
      selectedEvent.cfgStatus = 'FETCHED';

      const callback = function(){
        
        runtime.update.one().trigger();

      }

      const dx = ui.brc.dx;
      const dy = ui.brc.dy;
      const page =  ui.event.pagenumber;
      const element = ui.event.elementnumber;
      const event = ui.event.eventtype;

      instructions.fetchConfigFromGrid(dx, dy, page, element, event, callback);

    }



    return {
      config: config,
      stringname: "",
      events: {
        selected: selectedEvent.event,
        options: device.pages[pageIndex].control_elements[elementIndex].events.map(e => e.event)
      }, 
      elements: {
        selected: ui.event.elementnumber,
        options: device.pages[pageIndex].control_elements.map((n) => n.controlElementNumber)
      },
      pages: {
        selected: ui.event.pagenumber,
        options: device.pages.map((n) => n.pageNumber)
      }
    }
  });

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
    update_debugtext: (descr) => {

      let sx = descr.brc_parameters.SX;
      let sy = descr.brc_parameters.SY;
      let text = descr.class_parameters.TEXT;


      store.update(d => {
        if(d.enabled){
          if(d.data.length >= 15){
            d.data.shift()
          }
          d.data = [...d.data, `[${sy},${sx}] ${text}`];
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
    update_midi: (descr) => {

      store.update(s => {
        if(s.length >= 30){
          s.shift()
        };

        s = [...s, descr];
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

// Main serial intervals

let rt = get(runtime);

let grid_heartbeat_interval;
function gridHeartbeat(){ 
  const interval = get(heartbeat).grid;
  grid_heartbeat_interval = setInterval(()=>{
    let _removed = rt.find(g => (Date.now() - g.alive > (heartbeat.grid * 2)) && !g.virtual);
    let _processgrid = rt.map(g => {
      if(Date.now() - g.alive > (heartbeat.grid *2) && !g.virtual){
        g.alive = 'dead';
      }
      return g;
    })
    let _usedgrid = _processgrid.filter(g => g.alive !== 'dead');

    if(_removed !== undefined && _usedgrid.length !== undefined){    
      // re-initialize configuration panel, if the module has been removed which had it's settings opened.
      user_input.reset(_removed);
      runtime.set(_usedgrid); 
      writeBuffer.clean_up.one(_removed);
    }

  }, interval)
}

let editor_heartbeat_interval;
function editorHeartbeat(){ 

  const interval = get(heartbeat).editor;
  
  editor_heartbeat_interval = setInterval(()=>{

      let type = 255
      if(get(runtime.unsaved) != 0){
        type = 254
      }

      const retval = grid.translate.encode_suku(
        {
          brc_parameters:
            {DX: -127, DY: -127}, // GLOBAL
          class_name: "HEARTBEAT",
          class_instr: "EXECUTE",
          class_parameters: 
            {
              TYPE: type,
              HWCFG: 255,
              VMAJOR: get(appSettings).version.major,
              VMINOR: get(appSettings).version.minor,
              VPATCH: get(appSettings).version.patch,
            }
        }
      );

      serialComm.write(retval.serial);
      
  }, interval);

}


editorHeartbeat();
gridHeartbeat();  




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
