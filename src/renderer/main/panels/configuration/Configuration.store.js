import { get, writable, derived } from "svelte/store";

import {
  runtime,
  user_input,
  getDeviceName,
  eventType,
} from "../../../runtime/runtime.store";

//import { checkForbiddenIdentifiers } from "../../../runtime/monaco-helper";

import {
  getComponentInformation,
  config_components,
  init_config_block_library,
} from "../../../lib/_configs";

export let lastOpenedActionblocks = writable([]);

export function lastOpenedActionblocksInsert(short) {
  // Get the current value of lastOpenedActionblocks
  const currentList = get(lastOpenedActionblocks);

  // Update the store with the new value
  lastOpenedActionblocks.set([
    ...currentList.filter((e) => e !== short),
    short,
  ]);
}

export function lastOpenedActionblocksRemove(short) {
  // Get the current value of lastOpenedActionblocks
  const currentList = get(lastOpenedActionblocks);

  // Update the store with the new value
  lastOpenedActionblocks.set(currentList.filter((e) => e !== short));
}

import stringManipulation from "../../user-interface/_string-operations";
import * as luamin from "lua-format";

import grid from "../../../protocol/grid-protocol.js";
import { v4 as uuidv4 } from "uuid";

const luaminOptions = {
  RenameVariables: false, // Should it change the variable names? (L_1_, L_2_, ...)
  RenameGlobals: false, // Not safe, rename global variables? (G_1_, G_2_, ...) (only works if RenameVariables is set to true)
  SolveMath: false, // Solve math? (local a = 1 + 1 => local a = 2, etc.)
};

export class ConfigObject {
  constructor({ short, script }) {
    this.short = short;
    this.script = script;
    this.id = uuidv4();

    const init = async () => {
      if (config_components == []) {
        await init_config_block_library();
      }
    };
    init();

    let res = getComponentInformation({ short: short });

    //Backward compatibility
    if (typeof res === "undefined") {
      res = getComponentInformation({ short: "raw" });
    }

    this.information = structuredClone(res.information);
    this.indentation = 0;
    this.header = res.header;
    this.component = res.component;
    this.selected = false;
    this.toggled = false;
  }

  toRawLua() {
    return `--[[@${this.short}]] ${this.script}`;
  }

  makeCopy() {
    const copy = new ConfigObject({
      short: this.short,
      script: this.script,
    });
    copy.information = this.information;
    copy.component = this.component;
    copy.selected = this.selected;
    copy.toggled = this.toggled;
    copy.id = uuidv4();

    // Copy any additional properties that were added later
    for (const prop in this) {
      if (this.hasOwnProperty(prop) && !copy.hasOwnProperty(prop)) {
        copy[prop] = this[prop];
      }
    }

    return copy;
  }

  //Returns true if syntax is OK
  checkSyntax() {
    //If not a CodeBlock, and script contains if, add end to if.
    //If not done, it will always fail.
    //TODO: Rework composite blocks in a way, so this exception
    //does not occure.
    let code = this.script;
    if (this.short !== "cb") {
      if (code.startsWith("elseif")) {
        code = code.replace("elseif", "if");
      }
      if (code.startsWith("if") || code.startsWith("for")) {
        code += " end";
      }
      if (
        code.startsWith("else") ||
        code.startsWith("elseif") ||
        code.startsWith("end")
      ) {
        return true;
      }
      if (this.short === "raw") {
        return true;
      }
    }

    try {
      //Is this necessary?
      //checkForbiddenIdentifiers(code);
      const short_code = stringManipulation.shortify(code);
      const line_commented_code =
        stringManipulation.blockCommentToLineComment(short_code);

      var safe_code = String(
        stringManipulation.lineCommentToNoComment(line_commented_code)
      );
      luamin.Minify(safe_code, luaminOptions);
      return true;
    } catch (e) {
      return false;
    }
  }

  getSyntaxError() {
    try {
      //Is this necessary?
      //checkForbiddenIdentifiers(code);
      const short_code = stringManipulation.shortify(code);
      const line_commented_code =
        stringManipulation.blockCommentToLineComment(short_code);

      var safe_code = String(
        stringManipulation.lineCommentToNoComment(line_commented_code)
      );
      luamin.Minify(safe_code, luaminOptions);
      return "OK";
    } catch (e) {
      return e;
    }
  }
}

export class UnknownEventException extends Error {
  constructor(message) {
    super(message);
    this.name = "UnknownEventException";
  }
}

export class ConfigList extends Array {
  makeCopy() {
    const copy = new ConfigList();
    for (const config of this) {
      copy.push(config.makeCopy());
    }

    // Copy any additional properties that were added later
    for (const prop in this) {
      if (this.hasOwnProperty(prop) && !copy.hasOwnProperty(prop)) {
        copy[prop] = this[prop];
      }
    }

    return copy;
  }

  static setIndentation(list) {
    let indentation = 0;
    for (let i = 0; i < list.length; i++) {
      let config = list[i];

      if (config.information.type === "composite_open") {
        config.indentation = indentation++;
      } else if (config.information.type === "composite_close") {
        config.indentation = --indentation;
      } else if (config.information.type === "composite_part") {
        config.indentation = indentation - 1;
      } else {
        config.indentation = indentation;
      }
    }
  }

  static createFromTarget(target) {
    return new Promise(async (resolve) => {
      const event = await target.getEvent();
      const configScript = event.config;
      resolve(ConfigList.createFromActionString(configScript));
    });
  }

  static createFromActionString(string) {
    const config = new ConfigList();
    config.#Init(string);
    return config;
  }

  sendTo({ target }) {
    return new Promise((resolve) => {
      this.checkLength();
      const actionString = this.toConfigScript();

      runtime.update_event_configuration(
        target.device.dx,
        target.device.dy,
        target.page,
        target.element,
        target.eventType,
        actionString,
        "EDITOR_EXECUTE"
      );

      runtime.send_event_configuration_to_grid(
        target.device.dx,
        target.device.dy,
        target.page,
        target.element,
        target.eventType
      );

      resolve("Event sent to grid.");
    });
  }

  #Init(actionString) {
    //Parse actionString
    //TODO: do rawLuas format checking during parsing
    // get rid of new line, enter
    actionString = actionString.replace(/[\n\r]+/g, "");
    // get rid of more than 2 spaces
    actionString = actionString.replace(/\s{2,10}/g, " ");
    // remove lua opening and closing characters
    // this function is used for both parsing full config (long complete lua) and individiual actions lua
    if (actionString.startsWith("<?lua")) {
      actionString = actionString.split("<?lua")[1].split("?>")[0];
    }
    // split by meta comments
    let configList = actionString.split(/(--\[\[@+\w+\]\])/);

    configList = configList.slice(1);
    for (var i = 0; i < configList.length; i += 2) {
      const obj = new ConfigObject({
        //Extract short, e.g.: '--[[@gms]]' => 'gms'
        short: configList[i].match(/--\[\[@(.+?)\]\]/)?.[1],
        script: configList[i + 1].trim(),
      });
      super.push(obj);
    }
  }

  toConfigScript() {
    let lua = "";
    super.forEach((e) => (lua += e.toRawLua()));
    lua = "<?lua " + lua.replace(/(\r\n|\n|\r)/gm, "") + " ?>";
    return lua;
  }

  insert(atPosition, ...configs) {
    super.splice(atPosition, 0, ...configs);
  }

  remove(atPosition) {
    super.splice(atPosition, 1);
  }

  //Returns true if config syntax is OK
  checkSyntax() {
    for (const e of this) {
      if (!e.checkSyntax()) {
        return false;
      }
    }
    return true;
  }

  //Throws error if limit is reached
  checkLength() {
    const length = this.toConfigScript().length;
    if (length > grid.properties.CONFIG_LENGTH) {
      const target = ConfigTarget.getCurrent();
      throw {
        type: "lengthError",
        device: getDeviceName(target.device.dx, target.device.dy),
        x: target.device.dx,
        y: target.device.dy,
        element: { no: target.element },
        event: { no: target.eventType, type: eventType[target.eventType] },
        length: length,
      };
    }
  }
}

export class ConfigTarget {
  constructor({ device: { dx: dx, dy: dy }, page, element, eventType }) {
    const device = get(runtime).find((e) => e.dx == dx && e.dy == dy);
    if (typeof device === "undefined") {
      throw "Unknown device!";
    }

    this.device = { dx: dx, dy: dy };
    this.page = page;
    this.element = element;
    this.eventType = eventType;

    const controlElement = device.pages
      .at(page)
      .control_elements.find((e) => e.controlElementNumber == element);
    this.events = controlElement.events;
    this.elementType = controlElement.controlElementType;
  }

  static createFrom({ userInput }) {
    try {
      return new ConfigTarget({
        device: { dx: userInput.brc.dx, dy: userInput.brc.dy },
        page: userInput.event.pagenumber,
        element: userInput.event.elementnumber,
        eventType: userInput.event.eventtype,
      });
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }

  getEvent() {
    return new Promise(async (resolve, reject) => {
      const rt = get(runtime);
      const device = rt.find(
        (e) => e.dx == this.device.dx && e.dy == this.device.dy
      );
      const page = device.pages[this.page];
      const element = page.control_elements.find(
        (e) => e.controlElementNumber == this.element
      );
      let event = element.events.find((e) => e.event.value == this.eventType);

      const cfgstatus = event.cfgStatus;
      console.log(cfgstatus);
      if (
        cfgstatus != "GRID_REPORT" &&
        cfgstatus != "EDITOR_EXECUTE" &&
        cfgstatus != "EDITOR_BACKGROUND"
      ) {
        const ui = get(user_input);
        runtime.fetchOrLoadConfig(ui).then(() => resolve(event));
      } else {
        resolve(event);
      }
    });
  }

  static getCurrent() {
    const ui = get(user_input);
    try {
      const currentTarget = new ConfigTarget({
        device: { dx: ui.brc.dx, dy: ui.brc.dy },
        page: ui.event.pagenumber,
        element: ui.event.elementnumber,
        eventType: ui.event.eventtype,
      });

      return currentTarget;
    } catch (e) {
      console.error("ConfigTarget:", e);
      return undefined;
    }
  }
}

export const configManager = create_configuration_manager();

function create_configuration_manager() {
  let store = writable(new ConfigList());

  function createConfigListFrom(ui) {
    return new Promise((resolve) => {
      const target = ConfigTarget.createFrom({ userInput: ui });
      let list = new ConfigList();

      if (typeof target === "undefined") {
        resolve(list);
        return;
      }
      console.log(target);
      ConfigList.createFromTarget(target)
        .then((list) => resolve(list))
        .catch((e) => {
          if (e instanceof UnknownEventException) {
            const availableEvents = target.events.map((e) => e.event.value);
            const closestEvent = Math.min(
              ...availableEvents.map((e) => Number(e)).filter((e) => e > 0)
            );
            user_input.update((s) => {
              s.event.eventtype = String(closestEvent);
              return s;
            });
          } else {
            //Unknown error, display default
            throw `Configuration: ${e}`;
          }
        });
    });
  }

  user_input.subscribe((ui) => {
    createConfigListFrom(ui).then((list) => {
      store.update((store) => {
        store = list;
        return store;
      });
    });
  });

  function loadPreset({ x, y, element, preset }) {
    runtime.element_preset_load(x, y, element, preset);
    const ui = get(user_input);
    createConfigListFrom(ui).then((list) => {
      store.set(list);
    });
  }

  function loadProfile({ x, y, profile }) {
    runtime.whole_page_overwrite(x, y, profile);
    const ui = get(user_input);
    createConfigListFrom(ui).then((list) => {
      store.set(list);
    });
  }

  function update(func) {
    store.update(func);
    store.update((store) => {
      ConfigList.setIndentation(store);
      return store;
    });
  }

  function set(list) {
    store.set(list);
    store.update((store) => {
      ConfigList.setIndentation(store);
      return store;
    });
  }

  return {
    ...store,
    update: update,
    set: set,
    loadPreset: loadPreset,
    loadProfile: loadProfile,
  };
}
