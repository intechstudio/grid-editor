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

export const controlElementClipboard = writable([]);
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

  const findUpdateDestEvent = (_runtime, li) =>{
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

  function fetchOrLoadConfig (rt, ui, trigger, callback) {
    
    let pages = [];
    let config = [];
    let events = [];
    let elementNumbers = [];
    let stringname = "";
    let selectedNumber = "";
    let selectedEvent = "";

    rt.forEach(device => {
  
      if(device.dx == ui.brc.dx && device.dy == ui.brc.dy && ui.event.elementnumber !== -1){

        pages = device.pages;
        selectedNumber = ui.event.elementnumber;

        try {
          const pageIndex = device.pages.findIndex(x => x.pageNumber == ui.event.pagenumber);
          elementNumbers = device.pages[pageIndex].control_elements;
        } catch (error) {
          console.error(`Requested page ${ui.event.pagenumber} is not loaded, revert to page 0. -> _active_config`)
          elementNumbers = device.pages[0].control_elements;
          instructions.fetchPageCountFromGrid({brc: ui.brc});
        }

        try {
          const elementIndex = elementNumbers.findIndex(x => x.controlElementNumber == ui.event.elementnumber);
          events = elementNumbers[elementIndex].events;
        } catch (error) {
          console.error(`Requested events at elementIndex: ${elementIndex} not available, revert to events at 0 elem!`);
          events = elementNumbers[0].events;
        }
        

        // don't let selection of event, which is not on that control element
        let f_event = events.find(e => e.event.value == ui.event.eventtype);
        selectedEvent = f_event ? f_event : events[events.length - 1];    
        
        // init event check for hidden configs
        let initEvent = events.find(e => e.event.value == 0);
        
        // on switching between system and ui events, set proper eventtype for fetching config
        // f_event is undefined, if currently stored ui eventtype is not found on control element
        if(!f_event){
          ui.event.eventtype = events[events.length - 1].event.value;
        }

        if(selectedEvent.config.length){
          config = selectedEvent.config.trim();
        }

        const init_li = {
          brc: {
            dx: ui.brc.dx,
            dy: ui.brc.dy
          },
          event: {
            eventtype: 0,
            elementnumber: ui.event.elementnumber,
            pagenumber: ui.event.pagenumber
          }
        }

        if(initEvent.config.length){
          try {
            stringname = initEvent.config.split('--[[@sn]]')[1].split('--[[@')[0].split('?>')[0].trim().slice(9,-1); 
            runtime.hidden_update.addToControlElement(stringname, init_li);
          } catch (error) {
            console.error('init event sn read error')
            //stringname = '';
          }
        }

        if(!['GRID_REPORT', 'EDITOR_EXECUTE', 'EDITOR_BACKGROUND'].includes(initEvent.cfgStatus)){
          initEvent.cfgStatus = 'FETCHED';
          runtime.fetch.One(device, init_li, false, callback);
        }

        // ui elementnumber 255 (utility fetch) is handles in instructions.js
        if(!['GRID_REPORT', 'EDITOR_EXECUTE', 'EDITOR_BACKGROUND'].includes(selectedEvent.cfgStatus)){
          selectedEvent.cfgStatus = 'FETCHED';
          runtime.fetch.One(device, ui, trigger, callback);  
        }


      }
    });

    return {pages, config, events, elementNumbers, selectedEvent, selectedNumber, stringname};

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

    this.update_pages = function(descr){


      let sx = descr.brc_parameters.SX;
      let sy = descr.brc_parameters.SY;
      let pagecount = descr.class_parameters.PAGENUMBER;


      // this is called as many modules there are, because the pagecount fetch is global.
      // we should device which pagenumber is the meta
      _runtime.update((_runtime) => {
        _runtime.forEach((device)=>{
          // don't make pages if there are already same amount of pages...
          if(device.dx == sx && device.dy == sy && pagecount !== device.pages.length){
            for (let i = 0; i < pagecount - 1; i++) {
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

    this.control_element = function ({controlElementType, events}){

      const li = get(user_input);

      if(li.event.elementtype == controlElementType){
        events.forEach((ev) => {
          const operation = new _update();
          operation.status('EDITOR_BACKGROUND');
          operation.event({ELEMENTNUMBER: li.event.elementnumber, EVENTTYPE: ev.event.value, PAGENUMBER: li.event.pagenumber});
          operation.config({lua: ev.config});
          operation.sendToGrid();
          operation.trigger()
        });

        writeBuffer.add_last({
          commandCb: function(){
            writeBuffer.messages.set('overwrite done');                
            logger.set({type: 'success', mode: 0, classname: 'elementoverwrite', message: `Overwrite done!`});
          }
        });

      } else {
        logger.set({type: 'fail', mode: 0, classname: 'elementoverwrite', message: `Target element is different!`})
      }
      
      
    };

    this.page = function(array){

      const li = get(user_input);

      array.forEach((element) => {
        element.events.forEach((ev)=>{
          const operation = new _update();
          operation.status('EDITOR_BACKGROUND');
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
          let dest = findUpdateDestEvent(_runtime, li);
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
  
  function load_stringname(DATA){
    let stringname = '';

    // only for init
    if(DATA.CONFIG_REPORT.EVENTTYPE == 0){
    
      if(DATA.LUA.length){
        try {

          stringname = DATA.LUA.split('--[[@sn]]')[1].split('--[[@')[0].split('?>')[0].trim().slice(9,-1);
          
          const li = {
            event: {
              eventtype: 0,
              elementnumber: DATA.CONFIG_REPORT.ELEMENTNUMBER,
              pagenumber: DATA.CONFIG_REPORT.PAGENUMBER
            },
            brc: {
              dx: DATA.BRC.SX,
              dy: DATA.BRC.SY
            }
          }

          runtime.hidden_update.addToControlElement(stringname, li);

        } catch (error) {
          console.error('init event sn read error')
          //stringname = '';
        }
      }

    }
  }

  const _runtime_fetch = function() {

    const _default_li = get(user_input);

    // fetches only one element's selected event
    this.One = function(device, ui, trigger, callback){
      instructions.fetchConfigFromGrid({device: device, inputStore: ui, ui_trigger: trigger,callback: callback});
      return 1;
    }

    // get all hidden actions for init on module
    this.HiddenActions = function (){
      writeBuffer.add_first({
        commandCb: function(){
          logger.set({type: 'progress', mode: 0, classname: 'background', message: `Loading element names...`})
        }
      });

      const li = get(user_input);
      const rt = get(runtime);

      const device = rt.find(device => device.dx == li.brc.dx && device.dy == li.brc.dy);
      const pageIndex = device.pages.findIndex(x => x.pageNumber == li.event.pagenumber);
      const controlElements = device.pages[pageIndex].control_elements;

      const array = [];

      controlElements.forEach((controlElement) => {
        array.push({event: '0', elementnumber: controlElement.controlElementNumber})
      })

      array.forEach((elem, ind) => {
        li.event.eventtype = elem.event;
        li.event.elementnumber = elem.elementnumber;
        fetchOrLoadConfig(rt, li, false, load_stringname);
      })

      writeBuffer.add_last({
        commandCb: function(){
          logger.set({type: 'success', mode: 0, classname: 'background', message: `Complete!`});
        }
      });

      return this;
    }

    // fetches all event configs from a control element
    this.ControlElement = function (){

      writeBuffer.add_first({
        commandCb: function(){
          engine.set('DISABLED');
          logger.set({type: 'progress', mode: 0, classname: 'elementcopy', message: `Copy events from element...`})
        }
      });

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
        fetchOrLoadConfig(rt, li, false);
      })

      writeBuffer.add_last({
        commandCb: function(){
          writeBuffer.messages.set('ready for overwrite');                
          logger.set({type: 'success', mode: 0, classname: 'elementcopy', message: `Events are copied!`});
          engine.set('ENABLED');
        }
      });

      return {events, controlElementType}; // this is a reference for the control elements in question
    }

    // fetches all config from each action and event on current page + utility button
    this.FullPage = function(){

      writeBuffer.add_first({
        commandCb: function(){
          engine.set('DISABLED');
          logger.set({type: 'progress', mode: 0, classname: 'profilesave', message: `Preparing configs...`})
        }
      });

      const rt = get(runtime);

      let li = Object.assign({}, _default_li);

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
        fetchOrLoadConfig(rt, li, false);
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


  const _active_config = derived([user_input, _trigger_ui_change], ([ui, chng]) => {

    // whenever the UI changes, reset multiselect
    appMultiSelect.reset();

    // close advanced views
    actionPrefStore.reset();

    const rt = get(_runtime);

    const li = Object.create(ui);

    const {config, events, selectedEvent, selectedNumber, pages, elementNumbers, stringname } = fetchOrLoadConfig(rt, li, true);

    return {
      config: config,
      stringname: stringname,
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
  });

  
    

  const _hidden_update = function(){

    this.writeStringName = function(inputname){

      const stringname = inputname;

      const li = get(user_input);
      const rt = get(runtime);

      const device = rt.find(device => device.dx == li.brc.dx && device.dy == li.brc.dy);
      const pageIndex = device.pages.findIndex(x => x.pageNumber == li.event.pagenumber);
      const elementIndex = device.pages[pageIndex].control_elements.findIndex(x => x.controlElementNumber == li.event.elementnumber);

      const events = device.pages[pageIndex].control_elements[elementIndex].events;

      const i_event = events.find(x => x.event.value == '0');

      let configList = _utils.rawLuaToConfigList(i_event.config);

      let snPos = configList.indexOf('--[[@sn]]');

      // not found, add it
      if(snPos == -1){
        configList = ['--[[@sn]]','', ...configList];
        snPos = 0;
      } 

      configList[snPos+1] = `self.sn='${stringname}'`;

      let configs = '';
      for (let i = 0; i < configList.length; i+=2) {
        configs += (`${configList[i]}${configList[i+1]}`.trim())
      }

      if(configs){
        runtime.update.one().status('EDITOR_EXECUTE').event({ELEMENTNUMBER: li.event.elementnumber, EVENTTYPE: 0, PAGENUMBER: li.event.pagenumber}).config({lua: '<?lua ' + configs + ' ?>'}).sendToGrid();
      }

      this.addToControlElement(stringname, li);

    }

    this.addToControlElement = function(stringname, li){

      _runtime.update((rt)=>{
        rt.forEach((device)=>{
          if(device.dx == li.brc.dx && device.dy == li.brc.dy){
            const pageIndex = device.pages.findIndex(x => x.pageNumber == li.event.pagenumber);
            const elementIndex = device.pages[pageIndex].control_elements.findIndex(x => x.controlElementNumber == li.event.elementnumber);
            let controlElement = device.pages[pageIndex].control_elements[elementIndex];
            controlElement.controlElementName = stringname;
          }
        })
        return rt;
      })

      return this;
    }

  }

  return {
    set: _runtime.set,
    subscribe: _runtime.subscribe,
    active_config: _active_config.subscribe,
    hidden_update: new _hidden_update(),
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

      console.log(descr)

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
