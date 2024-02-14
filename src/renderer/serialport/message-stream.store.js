// Top level imports
import { writable, get } from "svelte/store";
import { writeBuffer } from "../runtime/engine.store";
import {
  runtime,
  user_input,
  wss_send_message,
  update_elementNameStore,
  update_elementPositionStore,
  update_elementPositionStore_fromPreview,
  update_ledColorStore,
} from "../runtime/runtime.store";
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

export const incoming_messages = writable([]);
export function add_datapoint(key, value) {
  incoming_messages.update((s) => {
    s.forEach((e) => (e.value = undefined));

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

function createMessageStream() {
  const _deliver_inbound = function (class_array) {
    if (class_array === undefined) {
      return;
    }

    class_array.forEach((class_descr, i) => {
      if (class_descr.class_name === "HEARTBEAT") {
        // check if it is online and if not then create a new module
        runtime.incoming_heartbeat_handler(class_descr);
      }

      if (class_descr.class_name === "PAGECOUNT") {
        // update page count, now not used because it is constant 4
      }

      if (class_descr.class_name === "DEBUGTEXT") {
        debug_monitor_store.update_debugtext(class_descr);
        const text = class_descr.class_parameters.TEXT;

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
          class_descr.element = luaNotOKMatch[1];
          class_descr.event = luaNotOKMatch[2];
          lua_error_store.update_lua_error("luanotok", class_descr);
        }
        //KB IS DISABLED
        else if (text == "KB IS DISABLED") {
          lua_error_store.update_lua_error("kbisdisabled", class_descr);
        } else if (text == "page change is disabled") {
          logger.set({
            type: "alert",
            classname: "pagechange",
            mode: 0,
            message: "Store your config before switching pages!",
          });
        }
      }

      if (class_descr.class_name === "WEBSOCKET") {
        wss_send_message(class_descr.class_parameters.TEXT);
      }

      if (class_descr.class_name === "LEDPREVIEW") {
        update_ledColorStore(class_descr);
      }

      if (class_descr.class_name === "MIDI") {
        midi_monitor_store.update_midi(class_descr);

        // websocket send data to package
        // ipcRenderer.send('websocket_tx', class_descr);
      }

      if (class_descr.class_name === "MIDISYSEX") {
        sysex_monitor_store.update_sysex(class_descr);
      }

      if (class_descr.class_name === "CONFIG") {
      }

      if (class_descr.class_name === "EVENT") {
        // update control element rotation
        update_elementPositionStore(class_descr);

        // update active element selection
        user_input.process_incoming_event_from_grid(class_descr);
      }

      if (class_descr.class_name === "EVENTPREVIEW") {
        //console.log("EVENTPREVIEW", class_descr.class_parameters["LENGTH"])

        update_elementPositionStore_fromPreview(class_descr);

        // update control element rotation
        //update_elementPositionStore(class_descr);

        // update active element selection
        //user_input.process_incoming_event_from_grid(class_descr);
      }

      if (
        class_descr.class_name === "ELEMENTNAME" &&
        class_descr.class_instr === "EXECUTE"
      ) {
        update_elementNameStore(class_descr);
      }

      if (
        class_descr.class_name === "PAGEACTIVE" &&
        class_descr.class_instr === "EXECUTE"
      ) {
        //console.log("PAGE");
        //runtime.change_page(class_descr.class_parameters.PAGENUMBER);
      }
      if (
        class_descr.class_name === "PAGEACTIVE" &&
        class_descr.class_instr === "REPORT"
      ) {
        const ui = get(user_input);
        //After page change set user_input so it does not get cleared from writebuffer
        if (ui.event === undefined) return; //TODO: check

        //return;
        if (ui.pagenumber !== class_descr.class_parameters.PAGENUMBER) {
          user_input.set({
            dx: ui.dx,
            dy: ui.dy,
            pagenumber: class_descr.class_parameters.PAGENUMBER,
            elementnumber: ui.elementnumber,
            eventtype: ui.eventtype,
          });
        }
      }

      writeBuffer.validate_incoming(class_descr);
    });
  };

  return {
    deliver_inbound: _deliver_inbound,
  };
}

export const messageStream = createMessageStream();
