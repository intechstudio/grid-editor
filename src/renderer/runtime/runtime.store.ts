import { writable, get } from "svelte/store";
import { writeBuffer, sendHeartbeat } from "./engine.store";
import { appSettings } from "./app-helper.store";
import { modal } from "../main/modals/modal.store";
import { ProtectedStore } from "./smart-store.store";
import { GridRuntime } from "./runtime";

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

export function update_element_name(descr) {
  const [dx, dy, element, name] = [
    Number(descr.brc_parameters.SX),
    Number(descr.brc_parameters.SY),
    Number(descr.class_parameters.NUM),
    String(descr.class_parameters.NAME),
  ];

  runtime.modules
    .find((e) => e.dx === dx && e.dy === dy)
    .pages.forEach(
      (e) =>
        (e.control_elements.find((e) => e.elementIndex === element).name =
          name.length > 0 ? name : undefined)
    );
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

    return closestEvent !== Infinity ? closestEvent : 0;
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

    if (dx == ui.dx && dy == ui.dy) {
      if (runtime.modules.length > 0) {
        //Set user input to an EXISTING module
        //(0,0) module is not guaranteed to exist when unplugging all modules once
        //NOTE: Hardcoding (0,0) may break user_input
        setOverride({
          dx: runtime.modules[0].dx,
          dy: runtime.modules[0].dy,
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

export const runtime = new GridRuntime();

//Retrieves device name from coordinates of the device
export function getDeviceName(x, y) {
  const currentModule = runtime.modules.find(
    (device) => device.dx == x && device.dy == y
  );
  return currentModule?.id.slice(0, 4);
}

export function getElementEventTypes(x, y, elementNumber) {
  const currentModule = runtime.modules.find(
    (device) => device.dx == x && device.dy == y
  );

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

const heartbeat_editor_ms = 300;
const heartbeat_grid_ms = 250;

const grid_heartbeat_interval_handler = async function () {
  runtime.modules.forEach((device, i) => {
    if (device.architecture === "virtual") {
      return;
    }

    const alive = device.alive;

    // Allow less strict elapsedTimeLimit while writeBuffer is busy!
    const elapsedTimeLimit =
      get(writeBuffer).length > 0
        ? heartbeat_grid_ms * 6
        : heartbeat_grid_ms * 3;
    const elapsedTime = Date.now() - alive;

    if (!alive || elapsedTime > elapsedTimeLimit) {
      // TIMEOUT! let's remove the device
      runtime.destroy_module(device.dx, device.dy);
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
    runtime.modules.length > 0 &&
    runtime.modules.filter((e) => e.architecture === "virtual").length === 0
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
    let indentation = config?.indentation;
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
