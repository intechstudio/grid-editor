import { writable, get } from "svelte/store";

import mixpanel from "mixpanel-browser";
import {
  runtime,
  logger,
  luadebug_store,
  appMultiSelect,
  appActionClipboard,
  user_input,
} from "../../../runtime/runtime.store";

import * as luamin from "lua-format";

import _utils from "../../../runtime/_utils.js";
import grid from "../../../protocol/grid-protocol.js";

const luaminOptions = {
  RenameVariables: false, // Should it change the variable names? (L_1_, L_2_, ...)
  RenameGlobals: false, // Not safe, rename global variables? (G_1_, G_2_, ...) (only works if RenameVariables is set to true)
  SolveMath: false, // Solve math? (local a = 1 + 1 => local a = 2, etc.)
};

function get_configs() {
  let configs = "";
  const unsubscribe = luadebug_store.subscribe((data) => {
    let arr = [];
    const tmp = new ConfigList(data.config);
    for (let i = 0; i < configs.length; i += 2) {
      arr.push(`${configs[i]}${configs[i + 1]}`.trim());
    }
    configs = arr;
  });
  unsubscribe();
  return configs;
}

export class ConfigObject {
  constructor({ short, script }) {
    this.short = short;
    this.script = script;
    this.rawLua = `--[[@${short}]] ` + script;
  }
}

export class ConfigList {
  constructor(rawLua) {
    // get rid of new line, enter
    rawLua = rawLua.replace(/[\n\r]+/g, "");
    // get rid of more than 2 spaces
    rawLua = rawLua.replace(/\s{2,10}/g, " ");

    // remove lua opening and closing characters
    // this function is used for both parsing full config (long complete lua) and individiual actions lua
    if (rawLua.startsWith("<?lua")) {
      rawLua = rawLua.split("<?lua")[1].split("?>")[0];
    }

    // splt by meta comments
    let configList = rawLua.split(/(--\[\[@+[a-z]+\]\])/);

    // filter "*space*" with regex or empty string
    // configList = configList.filter(function(el){ return !el.match(/(^\s+$)|(^$)/)});

    configList = configList.slice(1);

    console.log(configList);
  }

  toRawLua() {
    let lua = "";
    this.#list.forEach((e) => (lua += e.rawLua));
    lua = "<?lua " + lua.replace(/(\r\n|\n|\r)/gm, "") + " ?>";
    return Promise.resolve(lua);
  }

  #list = [];
  add(config, atIndex = undefined) {
    if (!(config instanceof ConfigObject)) {
      return Promise.reject(
        new Error(
          "Invalid config object. Expected an instance of ConfigObject."
        )
      );
    }
    if (typeof atIndex === "undefined") {
      this.#list.push(config);
    } else {
      this.#list.splice(atIndex, 0, config);
    }
    return Promise.resolve(this);
  }

  remove(start, length = 1) {
    this.#list.splice(start, length);
    return Promise.resolve(this);
  }

  checkSyntax() {
    const code = this.toRawLua();
    try {
      const short_code = stringManipulation.shortify(code);
      const line_commented_code =
        stringManipulation.blockCommentToLineComment(short_code);

      var safe_code = String(
        stringManipulation.lineCommentToNoComment(line_commented_code)
      );
      luamin.Minify(safe_code, luaminOptions);
      return Promise.resolve(this);
    } catch (e) {
      return Promise.reject(new Error("Syntax Error: " + e));
    }
  }

  checkLength() {
    if (this.length() > grid.properties.CONFIG_LENGTH) {
      return Promise.reject(
        new Error("Config length exceeds the maximum limit.")
      );
    }
    return Promise.resolve(this);
  }
}

export class ConfigManager {
  #list = [];
  constructor() {}

  reorder(configs, drag_target, drop_target, isMultiDrag) {
    let grabbed = [];
    drag_target.forEach((id) => {
      grabbed.push(configs.find((act) => id === act.id));
    });
    const cutIndex = configs.indexOf(grabbed.at(0));
    const cutLength = grabbed.length;

    let pasteIndex = Number(drop_target) + 1;
    // correction for multidrag
    if (pasteIndex > cutIndex) {
      pasteIndex = pasteIndex - drag_target.length;
    }

    //Remove grabbed
    configs.splice(cutIndex, cutLength);
    //Add grabbed to index
    configs.splice(pasteIndex, 0, ...grabbed);

    const li = get(user_input);
    const dx = li.brc.dx;
    const dy = li.brc.dy;
    const page = li.event.pagenumber;
    const element = li.event.elementnumber;
    const event = li.event.eventtype;
    const actionString = _utils.configMerge({ config: configs });

    runtime.update_event_configuration(
      dx,
      dy,
      page,
      element,
      event,
      actionString,
      "EDITOR_EXECUTE"
    );
    runtime.send_event_configuration_to_grid(dx, dy, page, element, event);

    // trigger change detection
    user_input.update((n) => n);
  }

  select_all() {
    const configs = get_configs();
    appMultiSelect.update((s) => {
      s.all_selected = !s.all_selected;
      s.selection = configs.map((v) => s.all_selected);
      return s;
    });
  }

  copy(isCut = false) {
    const selection = get(appMultiSelect).selection;

    const configs = get_configs();

    let clipboard = [];

    selection.forEach((elem, index) => {
      if (elem) {
        clipboard.push(configs[index]);
      }
    });

    appActionClipboard.set(clipboard);

    if (isCut === false) {
      mixpanel.track("Config Action", { click: "Copy" });
    }
  }

  paste() {
    if (get(appActionClipboard).length) {
      const configs = [...get_configs(), ...get(appActionClipboard)];

      const li = get(user_input);

      const dx = li.brc.dx;
      const dy = li.brc.dy;
      const page = li.event.pagenumber;
      const element = li.event.elementnumber;
      const event = li.event.eventtype;
      const actionString = _utils.configsToActionString(configs);

      runtime
        .check_action_string_length(actionString)
        .then(() => {
          runtime.update_event_configuration(
            dx,
            dy,
            page,
            element,
            event,
            actionString,
            "EDITOR_EXECUTE"
          );
          runtime.send_event_configuration_to_grid(
            dx,
            dy,
            page,
            element,
            event
          );

          // trigger change detection
          user_input.update((n) => n);
        })
        .catch((error) => {
          logger.set({
            type: "fail",
            mode: 0,
            classname: "check_action_string_length_error",
            message: `Config length is too long, shorten your code or delete actions!`,
          });
        });

      mixpanel.track("Config Action", { click: "Paste" });
    }
  }

  converttocodeblocky() {
    const selection = get(appMultiSelect).selection;
    const configs = get_configs();

    // EDIT

    let edited = [];

    let i = 0;
    let j = 0;
    for (; i < configs.length; ) {
      if (selection[i] !== true) {
        edited.push(configs[i]);
        j++;
      } else {
        // edit these
        if (i > 0 && selection[i - 1] == true) {
          const [first, ...rest] = configs[i].split("]]");
          edited[j - 1] += rest.join("]]");
        } else {
          const [first, ...rest] = configs[i].split("]]");
          edited.push("--[[@cb]]" + rest.join("]]"));
          j++;
        }
      }

      i++;
    }

    // check if resulting codesections are valid

    let error_count = 0;

    for (let v = 0; v < edited.length; v++) {
      if (selection[v] == true) {
        try {
          const minified_code = luamin.Minify(edited[v], luaminOptions);
        } catch (error) {
          error_count++;
        }
      }
    }

    if (error_count) {
      console.log("Merge Rejected");
      logger.set({
        type: "alert",
        mode: 0,
        classname: "configuration",
        message: `Code Merge Rejected`,
      });
      return;
    }

    const li = get(user_input);

    const dx = li.brc.dx;
    const dy = li.brc.dy;
    const page = li.event.pagenumber;
    const element = li.event.elementnumber;
    const event = li.event.eventtype;
    const actionString = _utils.configsToActionString(edited);

    runtime
      .check_action_string_length(actionString)
      .then(() => {
        runtime.update_event_configuration(
          dx,
          dy,
          page,
          element,
          event,
          actionString,
          "EDITOR_EXECUTE"
        );
        runtime.send_event_configuration_to_grid(dx, dy, page, element, event);

        // trigger change detection
        user_input.update((n) => n);
      })
      .catch((error) => {
        logger.set({
          type: "fail",
          mode: 0,
          classname: "check_action_string_length_error",
          message: `Config length is too long, shorten your code or delete actions!`,
        });
      });
  }

  add(newConfig, index) {
    const configs = [...get_configs()];

    if (typeof newConfig === "undefined") {
      console.log("NO CONFIG PASSED");
      return configs;
    }

    configs.splice(index, 0, newConfig);
    const actionString = _utils.configsToActionString(configs);

    runtime
      .check_action_string_length(actionString)
      .then(() => {
        const li = get(user_input);
        const dx = li.brc.dx;
        const dy = li.brc.dy;
        const page = li.event.pagenumber;
        const element = li.event.elementnumber;
        const event = li.event.eventtype;

        runtime.update_event_configuration(
          dx,
          dy,
          page,
          element,
          event,
          actionString,
          "EDITOR_EXECUTE"
        );
        runtime.send_event_configuration_to_grid(dx, dy, page, element, event);

        // trigger change detection
        user_input.update((n) => n);
      })
      .catch((error) => {
        logger.set({
          type: "fail",
          mode: 0,
          classname: "check_action_string_length_error",
          message: `Config length is too long, shorten your code or delete actions!`,
        });
      });
  }

  cut() {
    mixpanel.track("Config Action", { click: "Cut" });
    this.copy(true);
    this.remove();
  }

  remove() {
    const selection = get(appMultiSelect).selection;

    if (selection.length) {
      const configs = [...get_configs()];

      let filtered = [];

      for (let i = 0; i < configs.length; i++) {
        if (selection[i] !== true) {
          filtered.push(configs[i]);
        } else {
          // dont return
        }
      }

      const li = get(user_input);

      const dx = li.brc.dx;
      const dy = li.brc.dy;
      const page = li.event.pagenumber;
      const element = li.event.elementnumber;
      const event = li.event.eventtype;
      const actionString = _utils.configsToActionString(filtered);

      runtime
        .check_action_string_length(actionString)
        .then(() => {
          runtime.update_event_configuration(
            dx,
            dy,
            page,
            element,
            event,
            actionString,
            "EDITOR_EXECUTE"
          );
          runtime.send_event_configuration_to_grid(
            dx,
            dy,
            page,
            element,
            event
          );

          // trigger change detection
          user_input.update((n) => n);
        })
        .catch((error) => {
          logger.set({
            type: "fail",
            mode: 0,
            classname: "check_action_string_length_error",
            message: `Config length is too long, shorten your code or delete actions!`,
          });
        });

      mixpanel.track("Config Action", { click: "Remove" });
    }
  }
}

function createDropStore() {
  const store = writable([]);

  return {
    ...store,
    update: (configs) => {
      let disabled_blocks = [];
      let if_block = false;
      configs.forEach((a, index) => {
        try {
          // check if it's and if block
          if (a.information.name.endsWith("_If")) {
            if_block = true;
          }

          // don't add +1 id in the array (end)
          if (if_block && !a.information.name.endsWith("_End")) {
            disabled_blocks.push(index);
          }

          // this is the last, as END has to be disabled too!
          if (a.information.name.endsWith("_End")) {
            if_block = false;
          }
        } catch (e) {
          console.log(e);
        }
      });

      store.set(disabled_blocks);
    },
  };
}

export const dropStore = createDropStore();
