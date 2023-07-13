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
        const regex = /EL:\s*(\d+(?:\.\d+)?)\s*EV:\s*(\d+(?:\.\d+)?)/;
        const match = regex.exec(text);
        //LUA not OK
        if (match) {
          class_descr.element = match[1];
          class_descr.event = match[2];
          lua_error_store.update_lua_error("luanotok", class_descr);
        }
        //KB IS DISABLED
        else if (text == "KB IS DISABLED") {
          lua_error_store.update_lua_error("kbisdisabled", class_descr);
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

        // websocket send data to plugin
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
        //After page change set user_input so it does not get cleared from writebuffer
        if (get(user_input).event === undefined) return;

        //return;
        if (
          get(user_input).event.pagenumber !==
          class_descr.class_parameters.PAGENUMBER
        ) {
          user_input.update((s) => {
            s.event.pagenumber = class_descr.class_parameters.PAGENUMBER;
            return s;
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
