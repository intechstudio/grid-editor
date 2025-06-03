import { writable } from "svelte/store";
import { NumberToEventType } from "@intechstudio/grid-protocol";

function createDebugMonitor(maxLength: number) {
  const store = writable([]);
  let freeze = false;

  return {
    ...store,
    freeze: () => {
      freeze = true;
    },
    unfreeze: () => {
      freeze = false;
    },
    update_debugtext: (descr) => {
      let sx = descr.brc_parameters.SX;
      let sy = descr.brc_parameters.SY;
      let text = descr.class_parameters.TEXT;

      try {
        const decoded = atob(text);
        console.log(decoded);
        text = decoded;
      } catch (e) {
        console.warn("Invalid Base64 string:", e); // Error decoding Base64: InvalidCharacterError: Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.
      }

      store.update((d) => {
        if (d.length >= maxLength) {
          d.shift();
        }
        d = [...d, `[${sx},${sy}] ${text.includes("\n") ? "\n" : ""}${text}`];

        return d;
      });
    },
  };
}

export let inbound_data_rate_points = writable("");
export let outbound_data_rate_points = writable("");

export const inbound_data_rate_history = writable([]);
export const outbound_data_rate_history = writable([]);

function createDebugLowlevel(maxLength: number) {
  const store = writable([]);
  let freeze = false;
  let inbound_data_rate = 0;
  let outbound_data_rate = 0;

  let graph_interval = 500;

  const graph_step = function () {
    let in_rate_kbps = inbound_data_rate / graph_interval;
    let out_rate_kbps = outbound_data_rate / graph_interval;
    inbound_data_rate = 0;
    outbound_data_rate = 0;

    inbound_data_rate_history.update((d) => {
      if (d.length >= maxLength) {
        d.shift();
      }
      d = [...d, in_rate_kbps];

      let inbound = "";
      for (let i = 0; i < d.length; i++) {
        inbound += (i * 3).toString() + "," + (50 - d[i] * 2).toString() + " ";
      }

      inbound_data_rate_points.update((d) => {
        d = inbound;
        return d;
      });

      return d;
    });
    outbound_data_rate_history.update((d) => {
      if (d.length >= 30) {
        d.shift();
      }
      d = [...d, out_rate_kbps];

      let outbound = "";
      for (let i = 0; i < d.length; i++) {
        outbound += (i * 3).toString() + "," + (50 - d[i] * 2).toString() + " ";
      }

      outbound_data_rate_points.update((d) => {
        d = outbound;
        return d;
      });

      return d;
    });

    setTimeout(() => {
      graph_step();
    }, graph_interval);
  };

  graph_step();

  return {
    ...store,
    freeze: () => {
      freeze = true;
    },
    unfreeze: () => {
      freeze = false;
    },
    push_inbound: (arr) => {
      inbound_data_rate += arr.length;
      store.update((d) => {
        if (freeze == false) {
          const obj = { data: arr, direction: "IN" };

          if (d.length >= 15) {
            d.pop();
          }
          d = [obj, ...d];
        }
        return d;
      });
    },
    push_outbound: (arr) => {
      outbound_data_rate += arr.length;

      store.update((d) => {
        if (freeze == false) {
          let obj = { data: arr, direction: "OUT" };

          if (d.length >= 15) {
            d.pop();
          }
          d = [obj, ...d];
        }
        return d;
      });
    },
  };
}

function createLuaError() {
  const store = writable([]);
  let disabled = false;

  return {
    ...store,
    update_lua_error: (type, descr, device) => {
      store.update((d) => {
        if (!disabled) {
          let sx = descr.brc_parameters.SX;
          let sy = descr.brc_parameters.SY;

          switch (type) {
            case "luanotok":
              if (d.length >= 15) {
                d.shift();
              }
              d = [
                ...d,
                {
                  type: "luanotok",
                  device: device.type,
                  x: sx,
                  y: sy,
                  element: { no: descr.element },
                  event: {
                    no: descr.event,
                    type: NumberToEventType(descr.event),
                  },
                },
              ];
              break;
            case "kbisdisabled":
              if (d.length >= 15) {
                d.shift();
              }
              d = [
                ...d,
                {
                  type: "kbisdisabled",
                  device: device.type.type,
                  x: sx,
                  y: sy,
                },
              ];
              break;
          }
        }
        return d;
      });
    },
    disableMessages: (value) => (disabled = value),
  };
}

export const debug_monitor_store = createDebugMonitor(128);
export const debug_lowlevel_store = createDebugLowlevel(128);
export const lua_error_store = createLuaError();
