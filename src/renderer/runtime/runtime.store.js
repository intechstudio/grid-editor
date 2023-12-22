import { writable, get, derived } from "svelte/store";

import grid from "../protocol/grid-protocol";
import instructions from "../serialport/instructions";
import { writeBuffer, sendHeartbeat } from "./engine.store";
import { selectedConfigStore } from "./config-helper.store";

import { Analytics } from "./analytics.js";

import { appSettings } from "./app-helper.store";

let lastPageActivator = "";

export const eventType = {
  0: "Init",
  1: "Potmeter",
  2: "Encoder",
  3: "Button",
  4: "Utility",
  5: "MIDI RX",
  6: "Timer",
};

const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};

// The controller which is added to runtime first, load a default config!

let selection_changed_timestamp = 0;

export const controlElementClipboard = writable(undefined);
export const appActionClipboard = writable([]);

export const elementPositionStore = writable({});
export const elementNameStore = writable({});
export const ledColorStore = writable({});

export function update_elementPositionStore(descr) {
  if (descr.class_parameters.EVENTTYPE == 3) {
    // button change must not be registered

    return;
  }

  let eps = get(elementPositionStore);

  if (eps[descr.brc_parameters.SX] === undefined) {
    eps[descr.brc_parameters.SX] = {};
  }
  if (eps[descr.brc_parameters.SX][descr.brc_parameters.SY] === undefined) {
    eps[descr.brc_parameters.SX][descr.brc_parameters.SY] = {};
  }
  if (
    eps[descr.brc_parameters.SX][descr.brc_parameters.SY][
      descr.class_parameters.ELEMENTNUMBER
    ] === undefined
  ) {
    eps[descr.brc_parameters.SX][descr.brc_parameters.SY][
      descr.class_parameters.ELEMENTNUMBER
    ] = -1;
  }

  eps[descr.brc_parameters.SX][descr.brc_parameters.SY][
    descr.class_parameters.ELEMENTNUMBER
  ] = descr.class_parameters.EVENTPARAM;

  //console.log("Pos", descr.class_parameters.EVENTPARAM)

  elementPositionStore.set(eps);
}

export function update_elementNameStore(descr) {
  let ens = get(elementNameStore);

  if (ens[descr.brc_parameters.SX] === undefined) {
    ens[descr.brc_parameters.SX] = {};
  }
  if (ens[descr.brc_parameters.SX][descr.brc_parameters.SY] === undefined) {
    ens[descr.brc_parameters.SX][descr.brc_parameters.SY] = {};
  }
  if (
    ens[descr.brc_parameters.SX][descr.brc_parameters.SY][
      descr.class_parameters.NUM
    ] === undefined
  ) {
    ens[descr.brc_parameters.SX][descr.brc_parameters.SY][
      descr.class_parameters.NUM
    ] = -1;
  }

  ens[descr.brc_parameters.SX][descr.brc_parameters.SY][
    descr.class_parameters.NUM
  ] = descr.class_parameters.NAME;

  elementNameStore.set(ens);
}

export function update_elementPositionStore_fromPreview(descr) {
  let eps = get(elementPositionStore);

  if (eps[descr.brc_parameters.SX] === undefined) {
    eps[descr.brc_parameters.SX] = {};
  }
  if (eps[descr.brc_parameters.SX][descr.brc_parameters.SY] === undefined) {
    eps[descr.brc_parameters.SX][descr.brc_parameters.SY] = {};
  }

  for (let i = 1; i < descr.class_parameters.LENGTH / 4; i++) {
    const num = parseInt(
      "0x" +
        String.fromCharCode(descr.raw[4 + i * 4 + 0]) +
        String.fromCharCode(descr.raw[4 + i * 4 + 1])
    );
    const val = parseInt(
      "0x" +
        String.fromCharCode(descr.raw[4 + i * 4 + 2]) +
        String.fromCharCode(descr.raw[4 + i * 4 + 3])
    );
    //console.log(num, val)

    if (
      eps[descr.brc_parameters.SX][descr.brc_parameters.SY][num] === undefined
    ) {
      eps[descr.brc_parameters.SX][descr.brc_parameters.SY][num] = -1;
    }

    eps[descr.brc_parameters.SX][descr.brc_parameters.SY][num] = val;

    elementPositionStore.set(eps);
  }
}

export function update_ledColorStore(descr) {
  for (let i = 0; i < descr.class_parameters.LENGTH / 8; i++) {
    const num = parseInt(
      "0x" +
        String.fromCharCode(descr.raw[8 + i * 8 + 0]) +
        String.fromCharCode(descr.raw[8 + i * 8 + 1])
    );
    const red = parseInt(
      "0x" +
        String.fromCharCode(descr.raw[8 + i * 8 + 2]) +
        String.fromCharCode(descr.raw[8 + i * 8 + 3])
    );
    const gre = parseInt(
      "0x" +
        String.fromCharCode(descr.raw[8 + i * 8 + 4]) +
        String.fromCharCode(descr.raw[8 + i * 8 + 5])
    );
    const blu = parseInt(
      "0x" +
        String.fromCharCode(descr.raw[8 + i * 8 + 6]) +
        String.fromCharCode(descr.raw[8 + i * 8 + 7])
    );

    //console.log(num, red, gre, blu)

    let lcs = get(ledColorStore);

    if (lcs[descr.brc_parameters.SX] === undefined) {
      lcs[descr.brc_parameters.SX] = {};
    }
    if (lcs[descr.brc_parameters.SX][descr.brc_parameters.SY] === undefined) {
      lcs[descr.brc_parameters.SX][descr.brc_parameters.SY] = {};
    }
    if (
      lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num] === undefined
    ) {
      lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num] = [0, 0, 0];
    }

    lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num][0] = red * 4;
    lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num][1] = gre * 4;
    lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num][2] = blu * 4;

    ledColorStore.set(lcs);
  }
}

//Template logger object: { type: "", message: "", classname: "" }
export const logger = writable();

function create_user_input() {
  const defaultValues = {
    brc: {
      dx: "0",
      dy: "0",
      rot: "0",
    },
    event: {
      pagenumber: 0,
      elementnumber: -1, // should be checked out if grid sends back array or not
      eventtype: 2,
      elementtype: "",
    },
  };

  const _event = writable({ ...defaultValues });

  function process_incoming_event_from_grid(descr) {
    // engine is disabled
    if (get(writeBuffer).length > 0) {
      return;
    }

    // Don't track physical interaction
    if (get(appSettings).changeOnEvent === "none") {
      return;
    }

    // modal block track physical interaction setting
    if (get(appSettings).modal !== "") {
      return;
    }

    // event is init, mapmode, midirx, timer
    if (
      descr.class_parameters.EVENTTYPE == 0 ||
      descr.class_parameters.EVENTTYPE == 4 ||
      descr.class_parameters.EVENTTYPE == 5 ||
      descr.class_parameters.EVENTTYPE == 6
    ) {
      return;
    }

    // system element
    if (descr.class_parameters.ELEMENTNUMBER == 255) {
      return;
    }

    const store = get(_event);

    // filter same control element had multiple interactions
    let elementDifferent =
      store.event.elementnumber != descr.class_parameters.ELEMENTNUMBER;
    let eventDifferent =
      store.event.eventtype != descr.class_parameters.EVENTTYPE;
    let sxDifferent = store.brc.dx != descr.brc_parameters.SX;
    let syDifferent = store.brc.dy != descr.brc_parameters.SY;

    if (
      (eventDifferent && get(appSettings).changeOnEvent === "event") ||
      elementDifferent ||
      sxDifferent ||
      syDifferent
    ) {
      let current_timestamp = Date.now();

      if (current_timestamp - 100 > selection_changed_timestamp) {
        selection_changed_timestamp = current_timestamp;
      } else {
        return;
      }

      //reset of config selecting
      selectedConfigStore.set({});

      _event.update((store) => {
        const rt = get(runtime);

        let device = rt.find(
          (device) =>
            device.dx == descr.brc_parameters.SX &&
            device.dy == descr.brc_parameters.SY
        );

        if (device === undefined) {
          return store;
        }

        if (get(appSettings).changeOnEvent === "element") {
          const incomingEventTypes = getElementEventTypes(
            descr.brc_parameters.SX,
            descr.brc_parameters.SY,
            descr.class_parameters.ELEMENTNUMBER
          );

          if (!incomingEventTypes.includes(store.event.eventtype)) {
            //Select closest event type if incoming device does not have the corrently selected event type
            const closestEvent = Math.min(
              ...incomingEventTypes.map((e) => Number(e)).filter((e) => e > 0)
            );
            store.event.eventtype = String(closestEvent);
          }
        } else if (get(appSettings).changeOnEvent === "event") {
          store.event.eventtype = descr.class_parameters.EVENTTYPE;
        }

        // lets find out what type of module this is....
        store.brc.dx = descr.brc_parameters.SX; // coming from source x, will send data back to destination x
        store.brc.dy = descr.brc_parameters.SY; // coming from source y, will send data back to destination y
        store.brc.rot = descr.brc_parameters.ROT;
        store.event.elementnumber = descr.class_parameters.ELEMENTNUMBER;

        let elementtype =
          grid.moduleElements[device.id.split("_")[0]][
            store.event.elementnumber
          ];

        store.event.elementtype = elementtype;

        return store;
      });
    } else {
      let current_timestamp = Date.now();
      selection_changed_timestamp = current_timestamp;
    }
  }

  function update_eventtype(value) {
    const eventtype = get(user_input).event.eventtype;
    if (eventtype != value) {
      _event.update((s) => {
        s.event.eventtype = value;
        return s;
      });
    }
  }

  function update_elementnumber(value) {
    const elementnumber = get(user_input).event.elementnumber;
    if (elementnumber != value) {
      _event.update((s) => {
        s.event.elementnumber = value;
        return s;
      });
    }
  }

  function module_destroy_handler(dx, dy) {
    // This is used to re-init local settings panel if a module is removed which values have been displayed
    const li = get(_event);

    if (dx == li.brc.dx && dy == li.brc.dy) {
      _event.set({ ...defaultValues });
    }
  }

  function reset() {
    _event.set({ ...defaultValues });
  }

  return {
    ..._event,
    subscribe: _event.subscribe,
    update: _event.update,
    process_incoming_event_from_grid: process_incoming_event_from_grid,
    update_eventtype: update_eventtype,
    update_elementnumber: update_elementnumber,
    module_destroy_handler: module_destroy_handler,
    reset: reset,
  };
}

export const user_input = create_user_input();

function create_runtime() {
  const _runtime = writable([]);

  const findUpdateDestEvent = (_runtime, dx, dy, page, element, event) => {
    let _event = undefined;
    // this elementnumber check refers to uninitialized UI...
    if (element !== -1) {
      _runtime.forEach((device) => {
        if (device.dx == dx && device.dy == dy) {
          try {
            const pageIndex = device.pages.findIndex(
              (x) => x.pageNumber == page
            );
            const elementIndex = device.pages[
              pageIndex
            ].control_elements.findIndex(
              (x) => x.controlElementNumber == element
            );
            _event = device.pages[pageIndex].control_elements[
              elementIndex
            ].events.find((e) => e.event.value == event);
          } catch (error) {
            console.error("Couldn't update in destination: ", li);
          }
        }
      });
    }
    return _event;
  };

  function fetchOrLoadConfig(dx, dy, page, element, event, callback) {
    //console.log("Fetch Or Load")

    const rt = get(runtime);

    const device = rt.find((device) => device.dx == dx && device.dy == dy);
    const pageIndex = device.pages.findIndex((x) => x.pageNumber == page);
    const elementIndex = device.pages[pageIndex].control_elements.findIndex(
      (x) => x.controlElementNumber == element
    );

    if (device.pages[pageIndex].control_elements[elementIndex] === undefined)
      return;

    const eventIndex = device.pages[pageIndex].control_elements[
      elementIndex
    ].events.findIndex((x) => x.event.value == event);

    //console.log(device, pageIndex, elementIndex, eventIndex)

    const cfgstatus =
      device.pages[pageIndex].control_elements[elementIndex].events[eventIndex]
        .cfgStatus;

    if (
      cfgstatus == "GRID_REPORT" ||
      cfgstatus == "EDITOR_EXECUTE" ||
      cfgstatus == "EDITOR_BACKGROUND"
    ) {
      // its loaded
      if (callback !== undefined) {
        callback();
      }
    } else {
      instructions.fetchConfigFromGrid(dx, dy, page, element, event, callback);
    }

    return;
  }

  function isFirmwareMismatch(currentFirmware, requiredFirmware) {
    // Extract major, minor, and patch versions from current and required firmware
    const {
      major: currentMajor,
      minor: currentMinor,
      patch: currentPatch,
    } = currentFirmware;
    const {
      major: requiredMajor,
      minor: requiredMinor,
      patch: requiredPatch,
    } = requiredFirmware;

    // Compare major versions
    if (currentMajor < requiredMajor) {
      return true; // Firmware mismatch if current major version is lower
    } else if (currentMajor > requiredMajor) {
      return false; // No firmware mismatch if current major version is higher
    }

    // Compare minor versions
    if (currentMinor < requiredMinor) {
      return true; // Firmware mismatch if current minor version is lower
    } else if (currentMinor > requiredMinor) {
      return false; // No firmware mismatch if current minor version is higher
    }

    // Compare patch versions
    if (currentPatch < requiredPatch) {
      return true; // Firmware mismatch if current patch version is lower
    } else {
      return false; // No firmware mismatch if current patch version is equal or higher
    }
  }

  function incoming_heartbeat_handler(descr) {
    try {
      const controller = this.create_module(
        descr.brc_parameters,
        descr.class_parameters,
        false
      );

      let firstConnection = false;
      const device = get(_runtime).find((device) => device.id == controller.id);
      if (device) {
        if (device.rot != controller.rot) {
          _runtime.update((rt) => {
            const index = rt.findIndex((device) => device.id == controller.id);
            rt[index].rot = controller.rot;
            return rt;
          });
        }

        if (device.portstate != controller.portstate) {
          _runtime.update((rt) => {
            const index = rt.findIndex((device) => device.id == controller.id);
            rt[index].portstate = controller.portstate;
            return rt;
          });
        }

        get(heartbeat).find((device) => device.id == controller.id).alive =
          Date.now();
      }
      // device not found, add it to runtime and get page count from grid
      else {
        // check if the firmware version of the newly connected device is acceptable
        console.log("Incoming Device");
        console.log("Architecture", controller.architecture);

        const as = get(appSettings);
        const firmware_required =
          controller.architecture === "esp32"
            ? as.firmware_esp32_required
            : as.firmware_d51_required;
        controller.fwMismatch = isFirmwareMismatch(
          controller.fwVersion,
          firmware_required
        );

        console.log(
          "Mismatch: ",
          controller.fwMismatch,
          "Firmware Version: ",
          controller.fwVersion
        );

        _runtime.update((devices) => {
          return [...devices, controller];
        });
        heartbeat.update((devices) => {
          return [...devices, { id: controller.id, alive: Date.now() }];
        });

        firstConnection = get(_runtime).length === 1;

        Analytics.track({
          event: "Connect Module",
          payload: {
            action: "Connect",
            controller: controller,
            moduleCount: get(runtime).length,
          },
          mandatory: false,
        });
      }

      if (firstConnection) {
        setDefaultSelectedElement(controller);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function setDefaultSelectedElement(controller) {
    user_input.update((ui) => {
      ui.brc.dx = controller.dx;
      ui.brc.dy = controller.dy;
      ui.event.elementnumber = 0;

      ui.event.elementtype =
        controller.pages[
          ui.event.pagenumber
        ].control_elements[0].controlElementType;
      ui.event.eventtype = 0;
      return ui;
    });
  }

  function erase_all() {
    _runtime.update((rt) => {
      rt.forEach((device) => {
        device.pages.forEach((page) => {
          page.control_elements.forEach((events) => {
            events.events.forEach((event) => {
              event.config = "";
              event.cfgStatus = "ERASED";
            });
          });
        });
      });
      return rt;
    });
  }

  function element_preset_load(x, y, element, preset) {
    return new Promise((resolve, reject) => {
      const li = get(user_input);
      let events = preset.configs.events;
      const callback = function () {
        resolve();
        logger.set({
          type: "success",
          mode: 0,
          classname: "elementoverwrite",
          message: `Overwrite done!`,
        });
      };

      events.forEach((ev, index) => {
        const page = li.event.pagenumber;
        const event = ev.event;

        _runtime.update((_runtime) => {
          let dest = findUpdateDestEvent(_runtime, x, y, page, element, event);
          if (dest) {
            dest.config = ev.config;
            dest.cfgStatus = "EDITOR_BACKGROUND";

            instructions.sendConfigToGrid(
              x,
              y,
              page,
              element,
              event,
              dest.config,
              index === events.length - 1 ? callback : undefined
            );
          }
          return _runtime;
        });
      });
    });
  }

  function whole_element_overwrite({ controlElementType, events }) {
    const li = get(user_input);

    if (li.event.elementtype == controlElementType) {
      events.forEach((ev, index) => {
        let callback;
        if (index === events.length - 1) {
          // last element
          callback = function () {
            logger.set({
              type: "success",
              mode: 0,
              classname: "elementoverwrite",
              message: `Overwrite done!`,
            });
            user_input.update((n) => n);
          };
        } else {
          callback = undefined;
        }

        let li = get(user_input);

        const dx = li.brc.dx;
        const dy = li.brc.dy;
        const page = li.event.pagenumber;
        const element = li.event.elementnumber;
        const event = ev.event.value;

        _runtime.update((_runtime) => {
          let dest = findUpdateDestEvent(
            _runtime,
            dx,
            dy,
            page,
            element,
            event
          );
          if (dest) {
            dest.config = ev.config;
            dest.cfgStatus = "EDITOR_BACKGROUND";

            instructions.sendConfigToGrid(
              dx,
              dy,
              page,
              element,
              event,
              dest.config,
              callback
            );
            // trigger change detection
          }
          return _runtime;
        });
      });
    } else {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "elementoverwrite",
        message: `Target element is different!`,
      });
    }
  }

  function whole_page_overwrite(x, y, array) {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "profileload",
      message: `Profile load started...`,
    });

    return new Promise((resolve, reject) => {
      // Reorder array to send system element first
      const index = array.findIndex((obj) => obj.controlElementNumber === 255);

      // Check if the object with id === 255 was found
      if (index !== -1) {
        // Remove the object at the found index
        const objectToMove = array.splice(index, 1)[0];

        // Add the object to the front of the array
        array.unshift(objectToMove);
      }

      let li = get(user_input);
      array.forEach((elem, elementIndex) => {
        elem.events.forEach((ev, eventIndex) => {
          li.event.pagenumber = li.event.pagenumber;
          li.event.elementnumber = elem.controlElementNumber;
          li.event.eventtype = ev.event;

          const page = li.event.pagenumber;
          const element = li.event.elementnumber;
          const event = li.event.eventtype;

          _runtime.update((_runtime) => {
            let dest = findUpdateDestEvent(
              _runtime,
              x,
              y,
              page,
              element,
              event
            );
            if (dest) {
              dest.config = ev.config.trim();
              dest.cfgStatus = "EDITOR_BACKGROUND";
            }
            return _runtime;
          });

          let callback;

          if (
            elementIndex === array.length - 1 &&
            eventIndex === elem.events.length - 1
          ) {
            // this is last element so we need to add the callback
            callback = function () {
              logger.set({
                type: "success",
                mode: 0,
                classname: "profileload",
                message: `Profile load complete!`,
              });
              resolve();
            };
          }

          instructions.sendConfigToGrid(
            x,
            y,
            page,
            element,
            event,
            ev.config,
            callback
          );
        });
      });
    });
  }

  function update_event_configuration(
    dx,
    dy,
    page,
    element,
    event,
    actionString,
    status
  ) {
    // config
    _runtime.update((_runtime) => {
      let dest = findUpdateDestEvent(_runtime, dx, dy, page, element, event);
      if (dest) {
        dest.config = actionString;
        dest.cfgStatus = status;
        if (typeof dest.stored === "undefined") {
          dest.stored = actionString;
        }
      }
      return _runtime;
    });
  }

  function send_event_configuration_to_grid(
    dx,
    dy,
    page,
    element,
    event,
    callback
  ) {
    let rt = get(_runtime);

    let dest = findUpdateDestEvent(rt, dx, dy, page, element, event);
    if (dest) {
      instructions.sendConfigToGrid(
        dx,
        dy,
        page,
        element,
        event,
        dest.config,
        callback
      );
    } else {
      console.error("DEST not found!");
    }
  }

  // whole element copy: fetches all event configs from a control element
  function fetch_element_configuration_from_grid(callback) {
    const ui = get(user_input);
    let { dx, dy, page, element, event } = {
      dx: ui.brc.dx,
      dy: ui.brc.dy,
      page: ui.event.pagenumber,
      element: ui.event.elementnumber,
      event: ui.event.eventtype,
    };

    const rt = get(runtime);

    const device = rt.find((device) => device.dx == dx && device.dy == dy);
    const pageIndex = device.pages.findIndex((x) => x.pageNumber == page);
    const elementIndex = device.pages[pageIndex].control_elements.findIndex(
      (x) => x.controlElementNumber == element
    );

    const events =
      device.pages[pageIndex].control_elements[elementIndex].events;
    const controlElementType =
      device.pages[pageIndex].control_elements[elementIndex].controlElementType;

    const array = [];

    events.forEach((e) => {
      array.push({
        event: e.event.value,
        elementnumber:
          device.pages[pageIndex].control_elements[elementIndex]
            .controlElementNumber,
      });
    });

    array.forEach((elem, ind) => {
      ui.event.eventtype = elem.event;
      ui.event.elementnumber = elem.elementnumber;
      event = ui.event.eventtype;
      element = ui.event.elementnumber;

      if (ind == array.length - 1 && callback !== undefined) {
        // this is last and callback is defined

        fetchOrLoadConfig(dx, dy, page, element, event, callback);
      } else {
        fetchOrLoadConfig(dx, dy, page, element, event);
      }
    });
  }

  function fetch_page_configuration_from_grid(callback) {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "profilesave",
      message: `Preparing configs...`,
    });

    console.log("FETCH");

    const rt = get(runtime);

    let ui = JSON.parse(JSON.stringify(get(user_input)));
    let { dx, dy, page, element, event } = {
      dx: ui.brc.dx,
      dy: ui.brc.dy,
      page: ui.event.pagenumber,
      element: ui.event.elementnumber,
      event: ui.event.eventtype,
    };

    let device = rt.find((device) => device.dx == dx && device.dy == dy);

    if (typeof device === "undefined") {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "profilesave",
        message: `No module selected`,
      });

      return;
    }

    const pageIndex = device.pages.findIndex((x) => x.pageNumber == page);
    const controlElements = device.pages[pageIndex].control_elements;

    const fetchArray = [];

    controlElements.forEach((controlElement) => {
      controlElement.events.forEach((elem) => {
        const cfgstatus = elem.cfgStatus;

        if (
          cfgstatus == "GRID_REPORT" ||
          cfgstatus == "EDITOR_EXECUTE" ||
          cfgstatus == "EDITOR_BACKGROUND"
        ) {
          //alreade loaded config
        } else {
          // put it into the fetchArray
          fetchArray.push({
            event: elem.event.value,
            elementtype: controlElement.controlElementType,
            elementnumber: controlElement.controlElementNumber,
          });
        }
      });
    });

    // clear the writeBuffer to make sure that there are no fetch operations that may interfere with the callback
    writeBuffer.clear();

    if (fetchArray.length === 0) {
      //nothing to do, let's do calback
      callback();
    } else {
      fetchArray.forEach((elem, ind) => {
        event = elem.event;
        element = elem.elementnumber;

        if (ind === fetchArray.length - 1) {
          // last element
          fetchOrLoadConfig(dx, dy, page, element, event, callback);
        } else {
          fetchOrLoadConfig(dx, dy, page, element, event);
        }
      });
    }
    return;
  }

  function clear_page_configuration() {
    const li = get(user_input);

    _runtime.update((_runtime) => {
      _runtime.forEach((device) => {
        device.pages[li.event.pagenumber].control_elements.forEach(
          (control_element) => {
            control_element.events.forEach((event) => {
              if (
                ["GRID_REPORT", "EDITOR_EXECUTE", "EDITOR_BACKGROUND"].includes(
                  event.cfgStatus
                )
              ) {
                event.config = "";
                event.cfgStatus = "NULL";
                event.stored = undefined;
              }
            });
          }
        );
      });
      return _runtime;
    });

    // epicly shitty workaround before implementing acknowledge state management
    setTimeout(() => {
      //do nothing just trigger change detection
      user_input.update((n) => n);
      return this;
    }, 150);
  }

  function create_page(moduleType, pageNumber) {
    moduleType = moduleType.substr(0, 4);

    let control_elements = [];

    let status = "INIT";

    try {
      const elementsArrayLength = grid.moduleElements[moduleType].length;

      // control elements
      for (let i = 0; i < elementsArrayLength; i++) {
        if (grid.moduleElements[moduleType][i]) {
          let events = [];
          for (
            let j = 0;
            j < grid.elementEvents[grid.moduleElements[moduleType][i]].length;
            j++
          ) {
            events.push({
              event: grid.elementEvents[grid.moduleElements[moduleType][i]][j],
              config: "",
              cfgStatus: "NULL",
              stored: undefined,
            });
          }
          control_elements[i] = {
            events: events,
            controlElementNumber: i,
            controlElementType: grid.moduleElements[moduleType][i],
            controlElementName: "",
          };
        }
      }

      control_elements = control_elements.filter((x) => x); // filter null or invalid items!

      return { status, pageNumber: pageNumber, control_elements };
    } catch (error) {
      console.error("Error while creating page for ", moduleType, error);
    }
  }

  function create_module(header_param, heartbeat_class_param) {
    let moduleType = grid.module_type_from_hwcfg(heartbeat_class_param.HWCFG);

    // generic check, code below if works only if all parameters are provided
    if (
      header_param === undefined ||
      moduleType === undefined ||
      heartbeat_class_param === undefined
    ) {
      console.log(
        heartbeat_class_param.HWCFG,
        "ERROR",
        header_param,
        moduleType,
        heartbeat_class_param
      );
      throw "Error creating new module.";
    }
    moduleType = moduleType.substr(0, 4);

    return {
      // implement the module id rep / req
      architecture: grid.module_architecture_from_hwcfg(
        heartbeat_class_param.HWCFG
      ),
      portstate: heartbeat_class_param.PORTSTATE,
      id: moduleType + "_" + "dx:" + header_param.SX + ";dy:" + header_param.SY,
      dx: header_param.SX,
      dy: header_param.SY,
      rot: header_param.ROT,
      fwVersion: {
        major: heartbeat_class_param.VMAJOR,
        minor: heartbeat_class_param.VMINOR,
        patch: heartbeat_class_param.VPATCH,
      },
      fwMismatch: false,
      alive: Date.now(),
      map: {
        top: { dx: header_param.SX, dy: header_param.SY + 1 },
        right: { dx: header_param.SX + 1, dy: header_param.SY },
        bot: { dx: header_param.SX, dy: header_param.SY - 1 },
        left: { dx: header_param.SX - 1, dy: header_param.SY },
      },
      pages: [
        this.create_page(moduleType, 0),
        this.create_page(moduleType, 1),
        this.create_page(moduleType, 2),
        this.create_page(moduleType, 3),
      ],
    };
  }

  function destroy_module(dx, dy) {
    // remove the destroyed device from runtime

    const removed = get(_runtime).find((g) => g.dx == dx && g.dy == dy);

    _runtime.update((rt) => {
      const index = rt.indexOf(removed);
      rt.splice(index, 1);
      return rt;
    });

    user_input.module_destroy_handler(dx, dy);
    writeBuffer.module_destroy_handler(dx, dy);

    // reset rendering helper stores

    try {
      elementPositionStore.update((eps) => {
        eps[dx][dy] = undefined;
        return eps;
      });

      elementNameStore.update((ens) => {
        ens[dx][dy] = undefined;
        return ens;
      });

      ledColorStore.update((lcs) => {
        lcs[dx][dy] = undefined;
        return lcs;
      });

      const rt = get(_runtime);
      if (rt.length > 0) {
        const selectedElementsModule = {
          dx: get(user_input).brc.dx,
          dy: get(user_input).brc.dy,
        };
        if (
          selectedElementsModule.dx == removed.dx &&
          selectedElementsModule.dy == removed.dy
        ) {
          setDefaultSelectedElement(rt[0]);
        }
      }
    } catch (error) {}

    Analytics.track({
      event: "Disconnect Module",
      payload: {
        action: "Disconnect",
        moduleCount: get(runtime).length,
      },
      mandatory: false,
    });
  }

  function reset() {
    _runtime.set([]);

    user_input.reset();
    writeBuffer.clear();
  }

  function change_page(new_page_number) {
    if (get(writeBuffer).length > 0) {
      return;
    }

    let li = get(user_input);

    // only update pagenumber if it differs from the runtime pagenumber
    if (li.event.pagenumber !== new_page_number) {
      // clean up the writebuffer if pagenumber changes!
      writeBuffer.clear();

      instructions.changeActivePage(new_page_number);
    }
  }

  function unsavedChangesCount() {
    let count = 0;
    get(_runtime).forEach((e) => {
      e.pages.forEach((e) => {
        e.control_elements.forEach((e) => {
          e.events.forEach((e) => {
            if (
              e.cfgStatus !== "NULL" &&
              e.cfgStatus !== "ERASED" &&
              typeof e.stored !== "undefined" &&
              e.stored !== e.config
            ) {
              count += 1;
            }
          });
        });
      });
    });
    return count;
  }

  function storePage(index) {
    instructions.sendPageStoreToGrid();
    _runtime.update((store) => {
      store.forEach((device) => {
        device.pages
          .find((e) => e.pageNumber == index)
          ?.control_elements.forEach((element) => {
            element.events.forEach((event) => {
              if (
                event.cfgStatus !== "NULL" &&
                event.cfgStatus !== "ERASED" &&
                event.stored !== event.config
              ) {
                event.stored = event.config;
              }
            });
          });
      });
      return store;
    });
  }

  function clearPage(index) {
    instructions.sendPageClearToGrid();
  }

  function discardPage(index) {
    instructions.sendPageDiscardToGrid();
  }

  return {
    reset: reset,
    subscribe: _runtime.subscribe,

    element_preset_load: element_preset_load,
    whole_element_overwrite: whole_element_overwrite,
    whole_page_overwrite: whole_page_overwrite,

    update_event_configuration: update_event_configuration,
    send_event_configuration_to_grid: send_event_configuration_to_grid,

    fetch_element_configuration_from_grid:
      fetch_element_configuration_from_grid,
    fetch_page_configuration_from_grid: fetch_page_configuration_from_grid,

    incoming_heartbeat_handler: incoming_heartbeat_handler,

    clear_page_configuration: clear_page_configuration,

    create_page: create_page,
    create_module: create_module,
    destroy_module: destroy_module,

    change_page: change_page,

    erase: erase_all,
    fetchOrLoadConfig: fetchOrLoadConfig,
    unsavedChangesCount: unsavedChangesCount,
    storePage: storePage,
    discardPage: discardPage,
    clearPage: clearPage,
  };
}

export const runtime = create_runtime();

//Retrieves device name from coordinates of the device
export function getDeviceName(x, y) {
  const rt = get(runtime);
  const currentModule = rt.find((device) => device.dx == x && device.dy == y);
  return currentModule?.id.slice(0, 4);
}

export function getElementEventTypes(x, y, elementNumber) {
  const rt = get(runtime);
  const currentModule = rt.find((device) => device.dx == x && device.dy == y);
  const element = currentModule.pages[0].control_elements.find(
    (e) => e.controlElementNumber == elementNumber
  );

  return element.events.map((e) => e.event.value);
}

function createEngine() {
  const _engine = writable("ENABLED");

  return {
    ..._engine,
  };
}

export const engine = createEngine();

export const heartbeat = writable([]);

const heartbeat_editor_ms = 300;
const heartbeat_grid_ms = 300;

const grid_heartbeat_interval_handler = async function () {
  let rt = get(runtime);

  rt.forEach((device, i) => {
    const alive = get(heartbeat).find((e) => e.id == device.id).alive;
    if (Date.now() - alive > heartbeat_grid_ms * 3) {
      // TIMEOUT! let's remove the device
      runtime.destroy_module(device.dx, device.dy);
      heartbeat.update((heartbeat) => {
        return heartbeat.filter((e) => e.id !== device.id);
      });
    }
  });
};

setIntervalAsync(grid_heartbeat_interval_handler, heartbeat_grid_ms);

const editor_heartbeat_interval_handler = async function () {
  let type = 255;

  if (runtime.unsavedChangesCount() != 0 || get(appSettings).modal !== "") {
    type = 254;
  }

  if (get(runtime).length > 0) {
    sendHeartbeat(type);
  } else {
    writeBuffer.clear();
  }
};

setIntervalAsync(editor_heartbeat_interval_handler, heartbeat_editor_ms);

export class LocalDefinitions {
  static getFrom({ configs, index }) {
    const config = configs[index];
    let n = index - 1;
    let list = [];
    let indentation = config.indentation;
    while (n >= 0) {
      if (configs[n].indentation <= indentation) {
        list.push(configs[n]);
        if (configs[n].indentation != indentation) {
          indentation = configs[n].indentation;
        }
      }
      --n;
    }

    let arr = [];
    list.forEach((c) => {
      if (c.short == "l" && c.script !== "") {
        let _variable_array = c.script.split("=")[0];
        _variable_array = _variable_array.split("local")[1];
        _variable_array = _variable_array.split(",");
        _variable_array.forEach((val, i) => {
          arr.push({ info: `local - ${val.trim()}`, value: val.trim() });
        });
      }
    });
    return arr;
  }
}

export async function wss_send_message(message) {
  window.electron.websocket.transmit({ event: "message", data: message });
}

console.log("reached end of runtime");
