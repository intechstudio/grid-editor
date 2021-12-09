import { writable, get, derived } from 'svelte/store';
import { appSettings } from '../main/_stores/app-helper.store';
import grid from '../protocol/grid-protocol';
import instructions from '../serialport/instructions';
import { writeBuffer } from './engine.store';
import _utils from './_utils';


const activeWindow = require('active-win');




let lastPageActivator = "";  


async function detectActiveWindow(){

  if (get(appSettings).persistant.pageActivatorEnabled !== true){
    return;
  }

  try{

    if (get(appSettings).intervalPause) return;

    let result = (await activeWindow());

    if (result === undefined){
      result = {owner: {name: "Unknown!"}, title: "Invalid title!"}
    }

    if (get(appSettings).intervalPause) return;
    if (get(unsaved_changes) !== 0) return;
    

    appSettings.update(s => {s.activeWindowResult = result; return s;});
    
  


    if (get(appSettings).persistant.pageActivatorEnabled !== true){

      return;
    }

    if (lastPageActivator === result.owner.name){
      return;
    }

    let criteria = [
                    get(appSettings).persistant.pageActivatorCriteria_0,
                    get(appSettings).persistant.pageActivatorCriteria_1,
                    get(appSettings).persistant.pageActivatorCriteria_2,
                    get(appSettings).persistant.pageActivatorCriteria_3];

    for (let i=0; i<4; i++){

      if (criteria[i] === result.owner.name){
        lastPageActivator = result.owner.name;

        runtime.change_page(i);
        return;
      }

    }

    // default to page 0 if not found
    lastPageActivator = result.owner.name;
    runtime.change_page(0);


  }
  catch(e){
    console.error("detectActiveWindow failed")
  }

}

const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};

const setIntervalAsyncActiveWindow = (fn) => {
  fn().then(() => {
    let interval = get(appSettings).persistant.pageActivatorInterval;
    setTimeout(() => setIntervalAsyncActiveWindow(fn), interval);
  });
};

setIntervalAsyncActiveWindow(detectActiveWindow);

// The controller which is added to runtime first, load a default config!
let first_connection = true;

let selection_changed_timestamp = 0;

export const controlElementClipboard = writable([]);
export const appActionClipboard = writable([]);
export const conditionalConfigPlacement = writable();

export const elementPositionStore = writable({});
export const ledColorStore = writable({});

export function update_elementPositionStore(descr){
    
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
}

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



//debug monitor lua section
function create_luadebug_store(){
  const store = writable({config: '', enabled: true, data: []});

  return {
    ...store,
    update_config: (value) => {
      store.update(s => {s.config = value; return s})
    }
  }
}

export const luadebug_store = create_luadebug_store();





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
        const rt = get(runtime);

        store.id = rt.find(device => device.dx == descr.brc_parameters.SX && device.dy == descr.brc_parameters.SY).id
    
        console.log(store.id)
        // lets find out what type of module this is....
        store.brc.dx = descr.brc_parameters.SX; // coming from source x, will send data back to destination x
        store.brc.dy = descr.brc_parameters.SY; // coming from source y, will send data back to destination y
        store.brc.rot = descr.brc_parameters.ROT;
      
        store.event.eventtype = descr.class_parameters.EVENTTYPE;
        store.event.elementnumber = descr.class_parameters.ELEMENTNUMBER;   

        let elementtype = grid.moduleElements[store.id.split("_")[0]][store.event.elementnumber]  
        store.event.elementtype = elementtype;

        return store;
      });
    }
    else{

      let current_timestamp = Date.now();
      selection_changed_timestamp = current_timestamp;
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

  function module_destroy_handler(dx, dy){
    // This is used to re-init local settings panel if a module is removed which values have been displayed
    const li = get(_event);

    if(dx == li.brc.dx && dy == li.brc.dy){
      _event.set({...defaultValues})
    }

  }


  function reset(){

    _event.set({...defaultValues})
    
  }

  return {
    ..._event,
    subscribe: _event.subscribe,
    update: _event.update,
    process_incoming_from_grid: process_incoming_from_grid,
    update_eventtype: update_eventtype,
    update_elementnumber: update_elementnumber,
    module_destroy_handler: module_destroy_handler,
    reset: reset
  }
}

export const user_input = create_user_input();


export const unsaved_changes = writable(0);

function create_runtime () {

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

      instructions.fetchConfigFromGrid(dx, dy, page, element, event, callback);
    }

    return;

  }

  

  function incoming_heartbeat_handler(descr){

    

    let controller = this.create_module(descr.brc_parameters, descr.class_parameters, false);

    if (controller === undefined){
      return;
    }

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

  function whole_element_overwrite({controlElementType, events}){

    const li = get(user_input);

    if(li.event.elementtype == controlElementType){
      events.forEach((ev, index) => {

        let callback;
        if (index === events.length-1){ // last element
          callback = function(){               
            logger.set({type: 'success', mode: 0, classname: 'elementoverwrite', message: `Overwrite done!`});
            user_input.update(n => n);
          };
        }
        else{
          callback = undefined;
        }

        let li = get(user_input);

        const dx = li.brc.dx;
        const dy = li.brc.dy;
        const page =  li.event.pagenumber;
        const element = li.event.elementnumber;
        const event = ev.event.value;

        _runtime.update(_runtime => {
          let dest = findUpdateDestEvent(_runtime, dx, dy, page, element, event);
          if (dest) {
            dest.config = ev.config;
            dest.cfgStatus = 'EDITOR_BACKGROUND';          
            
            console.log("CONFIG:", dest.config);

            instructions.sendConfigToGrid( dx, dy, page, element, event, dest.config, callback);
            // trigger change detection
            
          }    
          return _runtime;
        })



      });

    } else {
      logger.set({type: 'fail', mode: 0, classname: 'elementoverwrite', message: `Target element is different!`})
    }
    
  }


  function whole_page_overwrite(array){


    engine.set('DISABLED');
    logger.set({type: 'progress', mode: 0, classname: 'profileload', message: `Profile load started...`})
  


    array.forEach((elem, elementIndex) => {

      
      elem.events.forEach((ev, eventIndex)=>{

        let li = get(user_input);

        li.event.pagenumber = li.event.pagenumber;
        li.event.elementnumber = elem.controlElementNumber;
        li.event.eventtype = ev.event;

        const dx = li.brc.dx;
        const dy = li.brc.dy;
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

        if (elementIndex === array.length-1 && eventIndex === elem.events.length-1){
          // this is last element so we need to add the callback
          callback = function(){
            engine.set('ENABLED');
            logger.set({type: 'success', mode: 0, classname: 'profileload', message: `Profile load complete!`});
            // trigger change detection
            user_input.update(n => n);
          };
        }

        instructions.sendConfigToGrid( dx, dy, page, element, event, ev.config, callback);

      });
    });
    
  }  

  function update_event_configuration(dx, dy, page, element, event, actionstring, status) { 

    // config
    _runtime.update(_runtime => {
  
      let dest = findUpdateDestEvent(_runtime, dx, dy, page, element, event);
      if (dest) {
        dest.config = actionstring;
        dest.cfgStatus = status;
      }    
      return _runtime;
    })

  }
  function send_event_configuration_to_grid(dx, dy, page, element, event, callback){
        
    let rt = get(_runtime);

    let dest = findUpdateDestEvent(rt, dx, dy, page, element, event);
    if (dest) {
      instructions.sendConfigToGrid( dx, dy, page, element, event, dest.config, callback);
    } 
    else{
      console.error("DEST not found!")
    } 

  }


  // whole element copy: fetches all event configs from a control element
  function fetch_element_configuration_from_grid(callback){

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

      if (ind == array.length-1 && callback !== undefined){ // this is last and callback is defined

        fetchOrLoadConfig(li, callback);
      }
      else{
        fetchOrLoadConfig(li);
      }
      
    })

  }

  function fetch_page_configuration_from_grid(callback){

    engine.set('DISABLED');
    logger.set({type: 'progress', mode: 0, classname: 'profilesave', message: `Preparing configs...`})

    const rt = get(runtime);

    let li = Object.assign({}, get(user_input));

    const device = rt.find(device => device.dx == li.brc.dx && device.dy == li.brc.dy);
    const pageIndex = device.pages.findIndex(x => x.pageNumber == li.event.pagenumber);
    const controlElements = device.pages[pageIndex].control_elements;

    const fetchArray = [];

    controlElements.forEach((controlElement) => {
      controlElement.events.forEach((elem) => {


        const cfgstatus = elem.cfgStatus;

        if (cfgstatus == 'GRID_REPORT' || cfgstatus == 'EDITOR_EXECUTE' || cfgstatus == 'EDITOR_BACKGROUND' ){
          //alreade loaded config
        }
        else{
          // put it into the fetchArray
          fetchArray.push({event: elem.event.value, elementnumber: controlElement.controlElementNumber})
        }

      })
    })
    
    // clear the writeBuffer to make sure that there are no fetch operations that may interfere with the callback
    writeBuffer.clear();

    if (fetchArray.length === 0){

      //nothing to do, let's do calback
      callback();

    }
    else{

      fetchArray.forEach((elem, ind) => {

        li.event.eventtype = elem.event;
        li.event.elementnumber = elem.elementnumber;
  
        if (ind === fetchArray.length-1){ // last element
  
          fetchOrLoadConfig(li, callback);
        }
        else{
  
          fetchOrLoadConfig(li);
        }
      });
    }
       
    return;
  }

  function clear_page_configuration(){

    const li = get(user_input);

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

    unsaved_changes.set(0);

    // epicly shitty workaround before implementing acknowledge state management
    setTimeout(()=>{
      //do nothing just trigger change detection
      user_input.update(n => n);
      return this;
    }, 150);

  }


  function create_page(moduleType, pageNumber){

    moduleType = moduleType.substr(0,4);
  
    let control_elements = [];

    let status = 'INIT';

    try {

      const elementsArrayLength = grid.moduleElements[moduleType].length;

       // control elements
      for (let i = 0; i < elementsArrayLength; i++) {
        if(grid.moduleElements[moduleType][i]){
          let events = [];
          for (let j=0; j < grid.elementEvents[grid.moduleElements[moduleType][i]].length; j++) {
            events.push({        
              event: grid.elementEvents[grid.moduleElements[moduleType][i]][j], 
              config: "",
              cfgStatus: "NULL"
            })
          }
          control_elements[i] = {events: events, controlElementNumber: i, controlElementType: grid.moduleElements[moduleType][i], controlElementName: ''};
        }
      }

      control_elements = control_elements.filter(x => x); // filter null or invalid items!

      return {status, pageNumber: pageNumber, control_elements};
      
    } catch (error) {
      
      console.error('Error while creating page for ', moduleType, error)

    }
    
  } 

  function create_module(header, heartbeat){

    let moduleType = grid.module_type_from_hwcfg(heartbeat.HWCFG);

    let controller = undefined;

    // generic check, code below if works only if all parameters are provided
    if(header !== undefined && moduleType !== undefined && heartbeat !== undefined){

      moduleType = moduleType.substr(0,4);

      controller = {
        // implement the module id rep / req
        id: moduleType + '_' + 'dx:' + header.SX + ';dy:' + header.SY,
        dx: header.SX,
        dy: header.SY,
        rot: header.ROT,
        fwVersion: {
          major: heartbeat.VMAJOR,
          minor: heartbeat.VMINOR,
          patch: heartbeat.VPATCH,
        },
        alive: Date.now(),
        map: {
          top:    {dx: header.SX,   dy: header.SY+1 },
          right:  {dx: header.SX+1, dy: header.SY   },
          bot:    {dx: header.SX,   dy: header.SY-1 },
          left:   {dx: header.SX-1, dy: header.SY   },
        },
        pages: [this.create_page(moduleType,0), this.create_page(moduleType,1), this.create_page(moduleType,2), this.create_page(moduleType,3)],

      }
      
    }
    
    return controller;

  }


  function destroy_module(dx, dy){

    // remove the destroyed device from runtime
    _runtime.update(rt => {
      return rt.filter(g => (g.dx != dx || g.dy != dy));
    });

    user_input.module_destroy_handler(dx, dy);
    writeBuffer.module_destroy_handler(dx, dy);
    
  }

  function reset(){

    _runtime.set([]);

    user_input.reset();
    unsaved_changes.set(0);
    writeBuffer.clear();
  }

  function change_page(new_page_number){

    if(get(engine) !== 'ENABLED'){
      return;
    }

    let li = get(user_input);

    // only update pagenumber if it differs from the runtime pagenumber
    if(li.event.pagenumber !== new_page_number){ 


      // clean up the writebuffer if pagenumber changes!
      writeBuffer.clear();

      instructions.changeActivePage(new_page_number);

      //After page change set user_input so it does not get cleared from writebuffer
      li.event.pagenumber = new_page_number;

      user_input.set(li);


    }
 

  }


  return {
    reset: reset,
    subscribe: _runtime.subscribe,

    whole_element_overwrite: whole_element_overwrite,
    whole_page_overwrite: whole_page_overwrite,

    update_event_configuration: update_event_configuration,
    send_event_configuration_to_grid: send_event_configuration_to_grid,

    fetch_element_configuration_from_grid: fetch_element_configuration_from_grid,
    fetch_page_configuration_from_grid: fetch_page_configuration_from_grid,

    incoming_heartbeat_handler: incoming_heartbeat_handler,

    clear_page_configuration: clear_page_configuration,

    create_page: create_page,
    create_module: create_module,
    destroy_module: destroy_module,

    change_page: change_page,

    erase: erase_all,
    fetchOrLoadConfig: fetchOrLoadConfig
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


export const heartbeat = writable({
  editor: 300,
  grid: 300
})


const grid_heartbeat_interval_handler = async function(){

  let rt = get(runtime);

  rt.forEach((device, i) => {

    if ((Date.now() - device.alive) > get(heartbeat).grid * 3){
      // TIMEOUT! let's remove the device
      runtime.destroy_module(device.dx, device.dy);

    }
  });

}

setIntervalAsync(grid_heartbeat_interval_handler, get(heartbeat).grid);



const editor_heartbeat_interval_handler = async function(){ 
  
  let type = 255
  if(get(unsaved_changes) != 0){
    type = 254
  }

  instructions.sendEditorHeartbeat_immediate(type);

}

setIntervalAsync(editor_heartbeat_interval_handler, get(heartbeat).editor);



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

