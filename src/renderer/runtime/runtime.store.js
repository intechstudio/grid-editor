import { writable, get, derived } from "svelte/store";

import { grid } from "grid-protocol";
import { instructions } from "../serialport/instructions";
import { writeBuffer, sendHeartbeat } from "./engine.store";
import { createVirtualModule } from "./virtual-engine.ts";
import { VirtualModuleHWCFG } from "./virtual-engine.ts";
import { virtual_runtime } from "./virtual-engine.ts";

import { Analytics } from "./analytics.js";

import { appSettings } from "./app-helper.store";

import { add_datapoint } from "../serialport/message-stream.store.js";
import { modal } from "../main/modals/modal.store";
import { ProtectedStore } from "./smart-store.store.ts";
import { elementNameStore } from "./element-name.store";

let lastPageActivator = "";

const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};

// The controller which is added to runtime first, load a default config!

let selection_changed_timestamp = 0;

export const elementPositionStore = writable({});
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
  ] = [descr.class_parameters.EVENTPARAM1, descr.class_parameters.EVENTPARAM2];

  //console.log("Pos", descr.class_parameters.EVENTPARAM)

  elementPositionStore.set(eps);
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
    dx: undefined,
    dy: undefined,
    pagenumber: undefined,
    elementnumber: undefined,
    eventtype: undefined,
  };

  const store = new ProtectedStore(defaultValues);

  function setOverride({ dx, dy, pagenumber, elementnumber, eventtype }) {
    for (const [key, value] of Object.entries({
      dx,
      dy,
      pagenumber,
      elementnumber,
      eventtype,
    })) {
      if (typeof value === "undefined") {
        store.set({
          ...defaultValues,
        });
        return;
      }
      if (typeof value !== "number") {
        throw `($user_input store): ${key} (${value}) is not the type of Number.`;
      }
    }

    const events = getElementEventTypes(dx, dy, elementnumber);
    const closestEvent = get_closest_event(events, eventtype);

    store.set({
      dx: dx,
      dy: dy,
      pagenumber: pagenumber,
      elementnumber: elementnumber,
      eventtype: closestEvent,
    });
  }

  function get_closest_event(events, event) {
    if (events.map((e) => Number(e)).includes(Number(event))) {
      return event;
    }

    //Select closest event type if incoming device does not have the corrently selected event type
    const closestEvent = Math.min(
      ...events.map((e) => Number(e)).filter((e) => e > 0)
    );
    return closestEvent;
  }

  function process_incoming_event_from_grid(descr) {
    // engine is disabled
    if (get(writeBuffer).length > 0) {
      return;
    }

    // modal block track physical interaction setting
    if (typeof get(modal) !== "undefined") {
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

    const ui = get(store);

    // filter same control element had multiple interactions
    let elementDifferent =
      ui.elementnumber != descr.class_parameters.ELEMENTNUMBER;
    let eventDifferent = ui.eventtype != descr.class_parameters.EVENTTYPE;
    let sxDifferent = ui.dx != descr.brc_parameters.SX;
    let syDifferent = ui.dy != descr.brc_parameters.SY;

    if (eventDifferent || elementDifferent || sxDifferent || syDifferent) {
      //Filtering out clashing events of control elements
      //Example: multiple fader movenet at the same time
      if (Date.now() < selection_changed_timestamp + 100) {
        return;
      }

      let eventtype;
      switch (get(appSettings).persistent.changeOnEvent) {
        case "element": {
          const incomingEventTypes = getElementEventTypes(
            descr.brc_parameters.SX,
            descr.brc_parameters.SY,
            descr.class_parameters.ELEMENTNUMBER
          );
          const current = ui.eventtype;
          eventtype = get_closest_event(incomingEventTypes, current);
          if (!elementDifferent) {
            return;
          }
          break;
        }
        case "none": {
          return;
        }
        case "event":
        default: {
          eventtype = descr.class_parameters.EVENTTYPE;
        }
      }
      store.set({
        dx: descr.brc_parameters.SX,
        dy: descr.brc_parameters.SY,
        pagenumber: ui.pagenumber,
        elementnumber: descr.class_parameters.ELEMENTNUMBER,
        eventtype: eventtype,
      });
    }
    selection_changed_timestamp = Date.now();
  }

  function module_destroy_handler(dx, dy) {
    // This is used to re-init local settings panel if a module is removed which values have been displayed
    const ui = get(store);
    const rt = get(runtime);

    if (dx == ui.dx && dy == ui.dy) {
      if (get(runtime).length > 0) {
        //Set user input to an EXISTING module
        //(0,0) module is not guaranteed to exist when unplugging all modules once
        //NOTE: Hardcoding (0,0) may break user_input
        setOverride({
          dx: rt[0].dx,
          dy: rt[0].dy,
          pagenumber: ui.pagenumber,
          elementnumber: 0,
          eventtype: ui.eventtype,
        });
      } else {
        setOverride({
          ...defaultValues,
        });
      }
    }
  }

  return {
    ...store,
    set: setOverride,
    process_incoming_event_from_grid: process_incoming_event_from_grid,
    module_destroy_handler: module_destroy_handler,
  };
}

export const user_input = create_user_input();

function create_runtime() {
  const _runtime = new ProtectedStore([]);

  const findUpdateDestEvent = (_runtime, dx, dy, page, element, event) => {
    let _event = undefined;
    // this elementnumber check refers to uninitialized UI...
    if (element !== -1) {
      _runtime.forEach((device) => {
        if (device.dx == dx && device.dy == dy) {
          const pageIndex = device.pages.findIndex((x) => x.pageNumber == page);
          const elementIndex = device.pages[
            pageIndex
          ].control_elements.findIndex((x) => x.elementIndex == element);
          _event = device.pages[pageIndex].control_elements[
            elementIndex
          ].events.find((e) => e.type == event);
        }
      });
    }
    return _event;
  };

  function fetchOrLoadConfig({ dx, dy, page, element, event }) {
    return new Promise((resolve, reject) => {
      const _device = get(runtime).find(
        (device) => device.dx == dx && device.dy == dy
      );
      const _page = _device.pages.find((e) => e.pageNumber == page);
      const _element = _page.control_elements.find(
        (e) => e.elementIndex == element
      );
      const _event = _element.events.find((e) => e.type == event);

      if (typeof _event.config !== "undefined") {
        resolve();
      } else {
        instructions
          .fetchConfigFromGrid(dx, dy, page, element, event)
          .then((descr) => {
            const dx = descr.brc_parameters.SX;
            const dy = descr.brc_parameters.SY;
            const page = descr.class_parameters.PAGENUMBER;
            const element = descr.class_parameters.ELEMENTNUMBER;
            const event = descr.class_parameters.EVENTTYPE;
            const actionstring = descr.class_parameters.ACTIONSTRING;

            update_event_configuration(
              dx,
              dy,
              page,
              element,
              event,
              actionstring
            );

            resolve();
          })
          .catch((e) => reject(e));
      }
    });
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
      for (const device of get(_runtime)) {
        if (device.architecture === "virtual") {
          destroy_module(device.dx, device.dy);
        }
      }
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

        const lastDate = get(heartbeat).find(
          (device) => device.id == controller.id
        )?.alive;
        if (lastDate) {
          let newDate = Date.now();

          heartbeat.update((store) => {
            const device = store.find((device) => device.id == controller.id);
            if (device) {
              device.alive = newDate;
            }
            return store;
          });

          //console.log(newDate - lastDate)
          if (get(appSettings).persistent.heartbeatDebugEnabled) {
            const key1 = `Hearbeat (${controller.dx}, ${controller.dy})`;

            add_datapoint(key1, newDate - lastDate);
          }
        }
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
        setDefaultSelectedElement();
      }
    } catch (error) {
      console.warn(error);
    }
  }

  function setDefaultSelectedElement() {
    const rt = get(runtime);
    user_input.set({
      dx: rt[0].dx,
      dy: rt[0].dy,
      pagenumber: 0,
      elementnumber: 0,
      eventtype: 2,
    });
  }

  function erase_all() {
    _runtime.update((rt) => {
      rt.forEach((device) => {
        device.pages.forEach((page) => {
          page.control_elements.forEach((events) => {
            events.events.forEach((event) => {
              event.config = undefined;
              event.stored = undefined;
            });
          });
        });
      });
      return rt;
    });
  }

  function element_preset_load(x, y, element, preset) {
    return new Promise((resolve, reject) => {
      const ui = get(user_input);
      let events = preset.configs.events;
      const promises = [];
      events.forEach((e) => {
        const page = ui.pagenumber;
        const event = e.event;

        _runtime.update((_runtime) => {
          let dest = findUpdateDestEvent(_runtime, x, y, page, element, event);
          if (typeof dest !== "undefined") {
            dest.config = e.config;
            const promise = instructions.sendConfigToGrid(
              x,
              y,
              page,
              element,
              event,
              e.config
            );

            promises.push(promise);
          }
          return _runtime;
        });
      });
      Promise.all(promises)
        .then(() => {
          resolve();
          logger.set({
            type: "success",
            mode: 0,
            classname: "elementoverwrite",
            message: `Overwrite done!`,
          });
        })
        .catch((e) => reject(e));
    });
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
      const index = array.findIndex((obj) => obj.elementIndex === 255);

      // Check if the object with id === 255 was found
      if (index !== -1) {
        // Remove the object at the found index
        const objectToMove = array.splice(index, 1)[0];

        // Add the object to the front of the array
        array.unshift(objectToMove);
      }

      let ui = structuredClone(get(user_input));
      const promises = [];
      array.forEach((elem) => {
        elem.events.forEach((ev) => {
          ui.elementnumber = elem.controlElementNumber;
          ui.eventtype = ev.event;

          const page = ui.pagenumber;
          const element = ui.elementnumber;
          const event = ui.eventtype;

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
            }
            return _runtime;
          });

          const promise = instructions.sendConfigToGrid(
            x,
            y,
            page,
            element,
            event,
            ev.config
          );

          promises.push(promise);
        });
      });
      Promise.all(promises)
        .then((desc) => {
          logger.set({
            type: "success",
            mode: 0,
            classname: "profileload",
            message: `Profile load complete!`,
          });
          resolve();
        })
        .catch((e) => reject(e));
    });
  }

  function update_event_configuration(
    dx,
    dy,
    page,
    element,
    event,
    actionString
  ) {
    // config
    _runtime.update((_runtime) => {
      let dest = findUpdateDestEvent(_runtime, dx, dy, page, element, event);
      if (dest) {
        dest.config = actionString;
        if (typeof dest.stored === "undefined") {
          dest.stored = actionString;
        }
      }
      return _runtime;
    });
  }

  function send_event_configuration_to_grid(dx, dy, page, element, event) {
    return new Promise((resolve, reject) => {
      let rt = get(_runtime);

      let dest = findUpdateDestEvent(rt, dx, dy, page, element, event);
      if (dest) {
        instructions
          .sendConfigToGrid(dx, dy, page, element, event, dest.config)
          .then((desc) => {
            resolve();
          })
          .catch((e) => reject(e));
      } else {
        reject("DEST not found!");
      }
    });
  }

  // whole element copy: fetches all event configs from a control element
  function fetch_element_configuration_from_grid(
    dx,
    dy,
    pageNumber,
    elementNumber
  ) {
    const rt = get(runtime);
    const device = rt.find((device) => device.dx == dx && device.dy == dy);
    const page = device.pages.find((x) => x.pageNumber == pageNumber);
    const element = page.control_elements.find(
      (x) => x.elementIndex == elementNumber
    );
    const events = element.events;

    const promises = events.map((e) => {
      const eventType = e.type;
      const dest = {
        dx: dx,
        dy: dy,
        page: pageNumber,
        element: elementNumber,
        event: eventType,
      };
      const promise = fetchOrLoadConfig(dest);
      return promise;
    });

    return Promise.all(promises);
  }

  function fetch_page_configuration_from_grid({ dx, dy, page }) {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "profilesave",
      message: `Preparing configs...`,
    });

    const rt = get(runtime);

    let device = rt.find((device) => device.dx == dx && device.dy == dy);

    if (typeof device === "undefined") {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "profilesave",
        message: `No module selected`,
      });

      return Promise.reject(`No module selected`);
    }

    const pageIndex = device.pages.findIndex((x) => x.pageNumber == page);
    const controlElements = device.pages[pageIndex].control_elements;

    const fetchArray = [];

    controlElements.forEach((controlElement) => {
      controlElement.events.forEach((e) => {
        if (typeof e.config === "undefined") {
          // put it into the fetchArray
          fetchArray.push({
            event: e.type,
            elementIndex: controlElement.elementIndex,
          });
        }
      });
    });

    // clear the writeBuffer to make sure that there are no fetch operations that may interfere with the callback
    // writeBuffer.clear();

    if (fetchArray.length === 0) {
      //nothing to do, let's do calback
      return Promise.resolve();
    }

    const promises = fetchArray.map((e) => {
      const promise = fetchOrLoadConfig({
        dx: dx,
        dy: dy,
        page: page,
        element: e.elementIndex,
        event: e.event,
      });
      return promise;
    });

    return Promise.all(promises);
  }

  function clear_page_configuration(index) {
    _runtime.update((_runtime) => {
      _runtime.forEach((device) => {
        device.pages[index].control_elements.forEach((control_element) => {
          control_element.events.forEach((event) => {
            event.config = undefined;
            event.stored = undefined;
          });
        });
      });
      return _runtime;
    });
  }

  function create_page(moduleType, pageNumber) {
    moduleType = moduleType.substr(0, 4);

    let control_elements = [];

    let status = "INIT";

    try {
      const moduleElements = grid.get_module_element_list(moduleType);

      for (const [index, element] of moduleElements.entries()) {
        if (typeof element === "undefined") {
          continue;
        }
        let events = [];
        const elementEvents = grid.get_element_events(element);
        for (const event of elementEvents) {
          events.push({
            type: Number(event.value),
            config: undefined,
            stored: undefined,
          });
        }
        control_elements.push({
          events: events,
          elementIndex: index,
          type: element,
          name: "",
        });
      }

      control_elements = control_elements.filter((x) => x); // filter null or invalid items!

      return { status, pageNumber: pageNumber, control_elements };
    } catch (error) {
      console.warn("Error while creating page for ", moduleType, error);
    }
  }

  function create_module(header_param, heartbeat_class_param, virtual = false) {
    let moduleType = grid.module_type_from_hwcfg(
      Number(heartbeat_class_param.HWCFG)
    );

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
      architecture: virtual
        ? "virtual"
        : grid.module_architecture_from_hwcfg(heartbeat_class_param.HWCFG),
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
    const removed = get(_runtime).find((e) => e.dx == dx && e.dy == dy);

    _runtime.update((rt) => {
      const index = rt.findIndex((e) => e.dx === dx && e.dy === dy);
      rt.splice(index, 1);
      return rt;
    });

    if (get(_runtime).length === 0) {
      appSettings.update((s) => {
        s.gridLayoutShift = { x: 0, y: 0 };
        return s;
      });
    }

    user_input.module_destroy_handler(dx, dy);
    if (removed.architecture === "virtual") {
      virtual_runtime.destroyModule(dx, dy);
    } else {
      writeBuffer.module_destroy_handler(dx, dy);
    }

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

  function change_page(new_page_number) {
    return new Promise((resolve, reject) => {
      if (get(writeBuffer).length > 0) {
        reject("Wait before all operations are finished.");
        return;
      }

      if (unsavedChangesCount() != 0) {
        reject("Store your changes before changin pages!");
        return;
      }

      let ui = get(user_input);

      // only update pagenumber if it differs from the runtime pagenumber
      if (ui.pagenumber === new_page_number) {
        resolve();
        return;
      }
      // clean up the writebuffer if pagenumber changes!
      // writeBuffer.clear();

      instructions
        .changeActivePage(new_page_number)
        .then(() => {
          const ui = get(user_input);
          user_input.set({
            dx: ui.dx,
            dy: ui.dy,
            pagenumber: new_page_number,
            elementnumber: ui.elementnumber,
            eventtype: ui.eventtype,
          });
          resolve();
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  function unsavedChangesCount() {
    let count = 0;
    get(_runtime).forEach((e) => {
      e.pages.forEach((e) => {
        e.control_elements.forEach((e) => {
          e.events.forEach((e) => {
            if (typeof e.stored !== "undefined" && e.stored !== e.config) {
              count += 1;
            }
          });
        });
      });
    });
    return count;
  }

  async function storePage(index) {
    return new Promise((resolve, reject) => {
      instructions
        .sendPageStoreToGrid()
        .then((res) => {
          _runtime.update((store) => {
            store.forEach((device) => {
              device.pages
                .find((e) => e.pageNumber == index)
                ?.control_elements.forEach((element) => {
                  element.events.forEach((event) => {
                    if (event.stored !== event.config) {
                      event.stored = event.config;
                    }
                  });
                });
            });
            return store;
          });
          resolve(res);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  function clearPage(index) {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "pageclear",
      message: `Clearing configurations from page...`,
    });
    return new Promise((resolve, reject) => {
      instructions
        .sendPageClearToGrid()
        .then(() => {
          clear_page_configuration(index);
          resolve();
        })
        .catch((e) => {
          console.warn(e);
          reject(e);
        });
    });
  }

  function discardPage(index) {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "pagediscard",
      message: `Discarding configurations...`,
    });
    return new Promise((resolve, reject) => {
      instructions
        .sendPageDiscardToGrid(index)
        .then(() => {
          clear_page_configuration(index);
          resolve();
        })
        .catch((e) => {
          console.warn(e);
          reject(e);
        });
    });
  }

  function addVirtualModule({ dx, dy, type }) {
    const module = VirtualModuleHWCFG[type];
    const controller = this.create_module(
      {
        DX: dx,
        DY: dy,
        SX: dx,
        SY: dy,
      },
      {
        HWCFG: module.hwcfg,
      },
      true
    );

    createVirtualModule(dx, dy, module.type);

    _runtime.update((devices) => {
      return [...devices, controller];
    });
    setDefaultSelectedElement();
  }

  return {
    subscribe: _runtime.subscribe,

    element_preset_load: element_preset_load,
    whole_page_overwrite: whole_page_overwrite,

    update_event_configuration: update_event_configuration,
    send_event_configuration_to_grid: send_event_configuration_to_grid,

    fetch_element_configuration_from_grid:
      fetch_element_configuration_from_grid,
    fetch_page_configuration_from_grid: fetch_page_configuration_from_grid,

    incoming_heartbeat_handler: incoming_heartbeat_handler,

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
    addVirtualModule: addVirtualModule,
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

  if (typeof currentModule === "undefined") {
    console.warn(`Module does not exist on (${x}, ${y})`);
    return undefined;
  }
  const element = currentModule.pages[0].control_elements.find(
    (e) => e.elementIndex == elementNumber
  );

  if (typeof element === "undefined") {
    console.warn(
      `Control element ${elementNumber} does not exist on (${x}, ${y})`
    );
    return undefined;
  }

  return element.events.map((e) => e.type);
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
const heartbeat_grid_ms = 250;

const grid_heartbeat_interval_handler = async function () {
  let rt = get(runtime);

  rt.forEach((device, i) => {
    if (device.architecture === "virtual") {
      return;
    }

    const alive = get(heartbeat).find((e) => e.id == device.id)?.alive;

    // Allow less strict elapsedTimeLimit while writeBuffer is busy!
    const elapsedTimeLimit =
      get(writeBuffer).length > 0
        ? heartbeat_grid_ms * 6
        : heartbeat_grid_ms * 3;
    const elapsedTime = Date.now() - alive;

    if (!alive || elapsedTime > elapsedTimeLimit) {
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

  if (runtime.unsavedChangesCount() != 0 || typeof get(modal) !== "undefined") {
    type = 254;
  }

  if (
    get(runtime).length > 0 &&
    get(runtime).filter((e) => e.architecture === "virtual").length === 0
  ) {
    sendHeartbeat(type);
  } else {
    //writeBuffer.clear();
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
