// Top level imports
import { writable, get } from "svelte/store";
import { appSettings } from "../runtime/app-helper.store";
import { wss_send_message } from "../runtime/runtime.store";
import {
  debug_monitor_store,
  lua_error_store,
} from "../main/panels/DebugMonitor/DebugMonitor.store";
import {
  midi_monitor_store,
  sysex_monitor_store,
} from "../main/panels/MidiMonitor/MidiMonitor.store";
import { logger } from "../runtime/runtime.store";

import { PolyLineGraphData } from "../main/user-interface/PolyLineGraph.js";
import { WriteBuffer } from "../runtime/engine.store.js";
import { GridRuntime } from "../runtime/runtime.js";
import { user_input } from "../runtime/user-input.store";
import { runtime_manager } from "../runtime/runtime-manager.store.js";
import { Runtime } from "../runtime/string-table.js";

export const incoming_messages = writable([]);
export function add_datapoint(key, value) {
  incoming_messages.update((s) => {
    s.forEach((e) => e.value == undefined);

    const message = new PolyLineGraphData({
      type: key,
      value: value,
    });

    const element = s.find((e) => e.type === message.type);
    if (typeof element === "undefined") {
      s.push(message);
    } else {
      element.value = message.value;
    }

    return s;
  });
}

export function get_datapoint_last(key) {
  const store = get(incoming_messages).find((e, i) => e.type == key);
  return store?.value;
}

export class MessageStream {
  private _buffer: WriteBuffer;
  public runtime: GridRuntime;

  constructor(buffer: WriteBuffer) {
    this._buffer = buffer;
  }

  public bind(runtime: GridRuntime) {
    this.runtime = runtime;
  }

  private update_elementPositionStore(descr) {
    if (descr.class_parameters.EVENTTYPE == 3) {
      // button change must not be registered

      return;
    }

    let eps = get(this.runtime.elementPositionStore);

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
    ] = [
      descr.class_parameters.EVENTPARAM1,
      descr.class_parameters.EVENTPARAM2,
    ];

    this.runtime.elementPositionStore.set(eps);
  }

  private update_element_name(descr) {
    const [dx, dy, element, name] = [
      Number(descr.brc_parameters.SX),
      Number(descr.brc_parameters.SY),
      Number(descr.class_parameters.NUM),
      String(descr.class_parameters.NAME),
    ];

    this.runtime.modules
      .find((e) => e.dx === dx && e.dy === dy)
      .pages.forEach(
        (e) =>
          (e.control_elements.find((e) => e.elementIndex === element).name =
            name.length > 0 ? name : undefined),
      );
  }

  private update_elementPositionStore_fromPreview(descr) {
    let eps = get(this.runtime.elementPositionStore);

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
          String.fromCharCode(descr.raw[4 + i * 4 + 1]),
      );
      const val = parseInt(
        "0x" +
          String.fromCharCode(descr.raw[4 + i * 4 + 2]) +
          String.fromCharCode(descr.raw[4 + i * 4 + 3]),
      );

      if (
        eps[descr.brc_parameters.SX][descr.brc_parameters.SY][num] === undefined
      ) {
        eps[descr.brc_parameters.SX][descr.brc_parameters.SY][num] = -1;
      }

      eps[descr.brc_parameters.SX][descr.brc_parameters.SY][num] = val;

      this.runtime.elementPositionStore.set(eps);
    }
  }

  private update_ledColorStore(descr) {
    for (let i = 0; i < descr.class_parameters.LENGTH / 8; i++) {
      const num = parseInt(
        "0x" +
          String.fromCharCode(descr.raw[8 + i * 8 + 0]) +
          String.fromCharCode(descr.raw[8 + i * 8 + 1]),
      );
      const red = parseInt(
        "0x" +
          String.fromCharCode(descr.raw[8 + i * 8 + 2]) +
          String.fromCharCode(descr.raw[8 + i * 8 + 3]),
      );
      const gre = parseInt(
        "0x" +
          String.fromCharCode(descr.raw[8 + i * 8 + 4]) +
          String.fromCharCode(descr.raw[8 + i * 8 + 5]),
      );
      const blu = parseInt(
        "0x" +
          String.fromCharCode(descr.raw[8 + i * 8 + 6]) +
          String.fromCharCode(descr.raw[8 + i * 8 + 7]),
      );

      let lcs = get(this.runtime.ledColorStore);

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

      this.runtime.ledColorStore.set(lcs);
    }
  }

  public deliver_inbound(class_array: any) {
    if (class_array === undefined) {
      return;
    }

    if (!this.runtime) {
      return;
    }

    class_array.forEach((class_descr, i) => {
      if (i == 0 && get(appSettings).persistent.messageIdDebugEnabled) {
        const brc_parameters = class_array[0].brc_parameters;

        const key1 = `ID (${brc_parameters.SX}, ${brc_parameters.SY})`;
        const key2 = key1 + " diff";

        let last = get_datapoint_last(key1);
        if (typeof last == "undefined") {
          last = 0;
        }

        if (last > brc_parameters.ID) {
          last -= 256;
        }

        get_datapoint_last(key1);

        add_datapoint(key1, brc_parameters.ID);

        add_datapoint(key2, brc_parameters.ID - last);
      }

      if (class_descr.class_name === "HEARTBEAT") {
        // check if it is online and if not then create a new module
        this.runtime.incoming_heartbeat_handler(class_descr);
      }

      if (class_descr.class_name === "PAGECOUNT") {
        // update page count, now not used because it is constant 4
      }

      if (class_descr.class_name === "DEBUGTEXT") {
        try {
          const decoded = atob(class_descr.class_parameters.TEXT);
          console.log(decoded);
          class_descr.class_parameters.TEXT = decoded;
        } catch (e) {
          console.warn("Invalid Base64 string:", e); // Error decoding Base64: InvalidCharacterError: Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.
        }

        debug_monitor_store.update_debugtext(class_descr);
        const text = class_descr.class_parameters.TEXT;
        const [sx, sy] = [
          class_descr.brc_parameters.SX,
          class_descr.brc_parameters.SY,
        ];
        const device = this.runtime.findModule(sx, sy);

        //LUA not OK
        const regex = /EL:\s*(\d+(?:\.\d+)?)\s*EV:\s*(\d+(?:\.\d+)?)/;
        const luaNotOKMatch = regex.exec(text);

        // Remove the trailing period
        const jsonString = text.replace(/\.$/, "");

        try {
          const jsonObject = JSON.parse(jsonString);
          for (const key in jsonObject) {
            if (jsonObject.hasOwnProperty(key)) {
              const value = jsonObject[key];
              add_datapoint(key, value);
            }
          }
        } catch (e) {
          //Do nothing
        }

        //LUA not OK
        if (luaNotOKMatch) {
          class_descr.element = Number(luaNotOKMatch[1]);
          class_descr.event = Number(luaNotOKMatch[2]);

          lua_error_store.update_lua_error("luanotok", class_descr, device);
        }
        //KB IS DISABLED
        else if (text == "KB IS DISABLED") {
          lua_error_store.update_lua_error("kbisdisabled", class_descr, device);
        } else if (text == "page change is disabled") {
          logger.set({
            type: "alert",
            classname: "pagechange",
            mode: 0,
            message: Runtime.ErrorText.PAGE_CHANGE_DISABLED,
          });
        }
      }

      if (class_descr.class_name === "WEBSOCKET") {
        wss_send_message(class_descr.class_parameters.TEXT);
      }

      if (class_descr.class_name === "PACKAGE") {
        // package_send("package-name", {"elem": 0, "xy": "0;0"}, 2.123, 2, "mic_volume")
        window.packageManagerPort?.postMessage({
          type: "send-to-package",
          message: class_descr.class_parameters.TEXT,
        });
      }

      if (class_descr.class_name === "LEDPREVIEW") {
        this.update_ledColorStore(class_descr);
      }

      if (class_descr.class_name === "MIDI") {
        const [sx, sy] = [
          class_descr.brc_parameters.SX,
          class_descr.brc_parameters.SY,
        ];
        const device = this.runtime.findModule(sx, sy);
        midi_monitor_store.update_midi(class_descr, device);

        // websocket send data to package
        // ipcRenderer.send('websocket_tx', class_descr);
      }

      if (class_descr.class_name === "MIDISYSEX") {
        const [sx, sy] = [
          class_descr.brc_parameters.SX,
          class_descr.brc_parameters.SY,
        ];
        const device = this.runtime.findModule(sx, sy);
        sysex_monitor_store.update_sysex(class_descr, device);
      }

      if (class_descr.class_name === "CONFIG") {
      }

      if (class_descr.class_name === "EVENT") {
        // update control element rotation
        this.update_elementPositionStore(class_descr);

        const active = get(runtime_manager).active.runtime;
        // engine is enabled
        if (
          get(this._buffer).length === 0 &&
          this.runtime.id === get(active).id
        ) {
          // update active element selection
          user_input.process_incoming_event_from_grid(class_descr);
        }
      }

      if (class_descr.class_name === "EVENTPREVIEW") {
        this.update_elementPositionStore_fromPreview(class_descr);

        // update control element rotation
        //update_elementPositionStore(class_descr);

        // update active element selection
        //user_input.process_incoming_event_from_grid(class_descr);
      }

      if (
        class_descr.class_name === "ELEMENTNAME" &&
        class_descr.class_instr === "EXECUTE"
      ) {
        this.update_element_name(class_descr);
      }

      if (
        class_descr.class_name === "PAGEACTIVE" &&
        class_descr.class_instr === "EXECUTE"
      ) {
        //runtime.change_page(class_descr.class_parameters.PAGENUMBER);
      }
      if (
        class_descr.class_name === "PAGEACTIVE" &&
        class_descr.class_instr === "REPORT"
      ) {
        const ui = get(user_input);
        const active = get(runtime_manager).active.runtime;
        if (
          ui.pagenumber !== class_descr.class_parameters.PAGENUMBER &&
          this.runtime.id === get(active).id
        ) {
          user_input.set({
            dx: ui.dx,
            dy: ui.dy,
            pagenumber: class_descr.class_parameters.PAGENUMBER,
            elementnumber: ui.elementnumber,
            eventtype: ui.eventtype,
          });
        }
      }

      this._buffer.validate_incoming(class_descr);
    });
  }
}
