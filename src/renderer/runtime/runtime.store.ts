import { writable } from "svelte/store";

//Template logger object: { type: "", message: "", classname: "" }
export const logger = writable();

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

    let arr: Array<{ info: string; value: string }> = [];
    list.forEach((c) => {
      // Extract from Locals block
      if (c.short == "l" && c.script !== "") {
        let _variable_array = c.script.split("=")[0];
        _variable_array = _variable_array.split("local")[1];
        _variable_array = _variable_array.split(",");
        _variable_array.forEach((val, i) => {
          arr.push({ info: `local - ${val.trim()}`, value: val.trim() });
        });
      }

      // Extract from Function block parameters
      if (c.short == "fst" && c.script !== "") {
        // Parse: "name = function(param1, param2, param3)"
        const match = c.script.match(/=\s*function\s*\((.*?)\)/);
        if (match && match[1].trim()) {
          const params = match[1].split(",");
          params.forEach((param) => {
            const trimmed = param.trim();
            if (trimmed) {
              arr.push({ info: `parameter - ${trimmed}`, value: trimmed });
            }
          });
        }
      }
    });
    return arr;
  }
}

export async function wss_send_message(message) {
  window.electron.websocket.transmit({ event: "message", data: message });
}
