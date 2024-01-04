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

  static updateIndentation(list) {
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

  static async createFromTarget(target) {
    return new Promise(async (resolve, reject) => {
      if (typeof target === "undefined") {
        reject("ConfigTarget is undefined");
        return;
      }

      const script = target.getConfig();

      if (typeof script !== "undefined") {
        resolve(ConfigList.createFromActionString(script));
      } else {
        await new Promise(async (resolve, reject) => {
          runtime.fetchOrLoadConfig(
            {
              dx: target.device.dx,
              dy: target.device.dy,
              page: target.page,
              element: target.element,
              event: target.eventType,
            },
            resolve
          );
        }).then(() => {
          const script = target.getConfig();
          resolve(ConfigList.createFromActionString(script));
        });
      }
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

      const callback = () => {
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
      };
      runtime.fetchOrLoadConfig(
        {
          dx: target.device.dx,
          dy: target.device.dy,
          page: target.page,
          element: target.element,
          event: target.eventType,
        },
        callback
      );
    });
  }

  #Init(actionString) {
    //Parse actionString
    //TODO: do rawLuas format checking during parsing

    let configList = [];
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
    configList = actionString.split(/(--\[\[@+\w+\]\])/);

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
        device: { dx: userInput.dx, dy: userInput.dy },
        page: userInput.pagenumber,
        element: userInput.elementnumber,
        eventType: userInput.eventtype,
      });
    } catch (e) {
      return undefined;
    }
  }

  getEvent() {
    const element = this.getElement();
    const event = element.events.find((e) => e.type == this.eventType);
    return event;
  }

  getElement() {
    const page = this.getPage();
    const element = page.control_elements.find(
      (e) => e.controlElementNumber == this.element
    );
    return element;
  }

  getPage() {
    const device = this.getDevice();
    const page = device.pages[this.page];
    return page;
  }

  getDevice() {
    const rt = get(runtime);
    const device = rt.find(
      (e) => e.dx == this.device.dx && e.dy == this.device.dy
    );
    return device;
  }

  getConfig() {
    const event = this.getEvent();
    const res = event.config;
    return res;
  }

  static getCurrent() {
    const ui = get(user_input);
    try {
      const currentTarget = new ConfigTarget({
        device: { dx: ui.dx, dy: ui.dy },
        page: ui.pagenumber,
        element: ui.elementnumber,
        eventType: ui.eventtype,
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
  const internal = writable(new ConfigList());
  const unsubscribeUserInput = user_input.subscribe((ui) => {
    createConfigListFrom(ui)
      .then((list) => {
        setOverride(list);
      })
      .catch((e) => {
        console.error(e);
        setOverride(new ConfigList());
      });
  });

  async function createConfigListFrom(ui) {
    return new Promise(async (resolve, reject) => {
      const target = ConfigTarget.createFrom({ userInput: ui });
      await ConfigList.createFromTarget(target)
        .then((list) => {
          resolve(list);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  function loadPreset({ x, y, element, preset }) {
    return new Promise((resolve, reject) => {
      const callback = () => {
        runtime.element_preset_load(x, y, element, preset).then(() => {
          const ui = get(user_input);
          const list = createConfigListFrom(ui);
          setOverride(list);
          resolve();
        });
      };

      const ui = get(user_input);
      const { dx, dy, page, elementNumber } = {
        dx: x,
        dy: y,
        page: ui.pagenumber,
        elementNumber: element,
      };
      runtime.fetch_element_configuration_from_grid(
        dx,
        dy,
        page,
        elementNumber,
        callback
      );
    });
  }

  function loadProfile({ x, y, profile }) {
    return new Promise((resolve) => {
      const callback = () => {
        runtime.whole_page_overwrite(x, y, profile).then(() => {
          const ui = get(user_input);
          const list = createConfigListFrom(ui);
          setOverride(list);
          resolve();
        });
      };
      runtime.fetch_page_configuration_from_grid(callback);
    });
  }

  function handleDataChange() {
    ConfigList.updateIndentation(internal);
  }

  function updateOverride(func) {
    internal.update((store) => {
      store = func(store);
      handleDataChange(store);
      return store;
    });
  }

  function setOverride(obj) {
    handleDataChange(obj);
    internal.set(obj);
  }

  return {
    ...internal,
    update: updateOverride,
    set: setOverride,
    unsubscribe: () => {
      unsubscribeUserInput();
      internal.unsubscribe();
    },
    loadPreset: loadPreset,
    loadProfile: loadProfile,
  };
}
