import { get } from "svelte/store";

import {
  runtime,
  user_input,
  luadebug_store,
  getDeviceName,
  eventType,
} from "../../../runtime/runtime.store";

//import { checkForbiddenIdentifiers } from "../../../runtime/monaco-helper";

import {
  getComponentInformation,
  config_components,
  init_config_block_library,
} from "../../../lib/_configs";

import stringManipulation from "../../user-interface/_string-operations";
import * as luamin from "lua-format";

import grid from "../../../protocol/grid-protocol.js";

const luaminOptions = {
  RenameVariables: false, // Should it change the variable names? (L_1_, L_2_, ...)
  RenameGlobals: false, // Not safe, rename global variables? (G_1_, G_2_, ...) (only works if RenameVariables is set to true)
  SolveMath: false, // Solve math? (local a = 1 + 1 => local a = 2, etc.)
};

export class ConfigObject {
  constructor({ parent, short, script }) {
    if (!(parent instanceof ConfigList) && typeof parent !== "undefined") {
      throw "Invalid parent object. Expected an instance of ConfigList.";
    }

    this.parent = parent;
    this.short = short;
    this.script = script;

    (async () => {
      if (config_components == []) {
        await init_config_block_library();
      }
    })();

    const res = getComponentInformation({ short: short });
    if (typeof res === "undefined") {
      throw `Config component information not found (${short}).`;
    }

    this.information = res.information;
    this.component = res.component;
    this.selected = false;
    this.toggled = false;
  }

  toRawLua() {
    return `--[[@${this.short}]] ${this.script}`;
  }

  makeCopy() {
    const copy = new ConfigObject({
      parent: this.parent,
      short: this.short,
      script: this.script,
    });
    copy.information = this.information;
    copy.component = this.component;
    copy.selected = this.selected;
    copy.toggled = this.toggled;
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
      if (code.startsWith("if")) {
        code += " end";
      }
    }

    try {
      //Is this necessary?
      //checkForbiddenIdentifiers(code);
      const short_code = stringManipulation.shortify(code);
      const line_commented_code =
        stringManipulation.blockCommentToLineComment(short_code);

      var safe_code = String(
        stringManipulation.lineCommentToNoComment(line_commented_code),
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
        stringManipulation.lineCommentToNoComment(line_commented_code),
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
  //Internal private list
  target = undefined;

  makeCopy() {
    const copy = new ConfigList();
    for (const config of this) {
      copy.push(config);
    }
    copy.target = this.target;
    return copy;
  }

  static createFrom(target) {
    if (!(target instanceof ConfigTarget)) {
      throw "Invalid target object. Expected an instance of ConfigTarget.";
    }

    this.target = target;

    const config = new ConfigList();
    config.target = target;
    config.#Init();
    return config;
  }

  sendTo({ target }) {
    return new Promise((resolve, reject) => {
      if (!(target instanceof ConfigTarget)) {
        reject(
          new Error(
            `Invalid target object (${target}). Expected an instance of ConfigTarget.`,
          ),
        );
      }

      if (!this.checkLength()) {
        throw {
          type: "lengthError",
          device: getDeviceName(target.device.dx, target.device.dy),
          x: target.device.dx,
          y: target.device.dy,
          element: { no: target.element },
          event: { no: target.eventType, type: eventType[target.eventType] },
        };
      }

      /*
      if (!this.checkSyntax()) {
        throw {
          type: "syntaxError",
          device: getDeviceName(target.device.dx, target.device.dy),
          x: target.device.dx,
          y: target.device.dy,
          element: { no: target.element },
          event: { no: target.eventType, type: eventType[target.eventType] },
        };
      }
      */

      const actionString = this.toConfigScript();

      runtime.update_event_configuration(
        target.device.dx,
        target.device.dy,
        target.page,
        target.element,
        target.eventType,
        actionString,
        "EDITOR_EXECUTE",
      );

      runtime.send_event_configuration_to_grid(
        target.device.dx,
        target.device.dy,
        target.page,
        target.element,
        target.eventType,
      );

      //TODO: Refactor this out
      luadebug_store.update_config(actionString);

      resolve("Event sent to grid.");
    });
  }

  #Init() {
    const rt = get(runtime);
    const device = rt.find(
      (e) => e.dx == this.target.device.dx && e.dy == this.target.device.dy,
    );

    if (typeof device === "undefined") {
      throw "Unknown device!";
    }

    const page = device.pages[this.target.page];

    const element = page.control_elements.find(
      (e) => e.controlElementNumber == this.target.element,
    );

    let event = element.events.find(
      (e) => e.event.value == this.target.eventType,
    );

    if (typeof event === "undefined") {
      throw new UnknownEventException(
        `Event type ${this.target.eventType} does not exist under control element ${this.target.element}`,
      );
    }

    const cfgstatus = event.cfgStatus;
    if (
      cfgstatus != "GRID_REPORT" &&
      cfgstatus != "EDITOR_EXECUTE" &&
      cfgstatus != "EDITOR_BACKGROUND"
    ) {
      const ui = get(user_input);
      const callback = () => user_input.update((n) => n);
      runtime.fetchOrLoadConfig(ui, callback);
    }

    let configScript = event.config;

    //Parse configScript
    //TODO: do rawLuas format checking during parsing

    // get rid of new line, enter
    configScript = configScript.replace(/[\n\r]+/g, "");
    // get rid of more than 2 spaces
    configScript = configScript.replace(/\s{2,10}/g, " ");
    // remove lua opening and closing characters
    // this function is used for both parsing full config (long complete lua) and individiual actions lua
    if (configScript.startsWith("<?lua")) {
      configScript = configScript.split("<?lua")[1].split("?>")[0];
    }
    // split by meta comments
    let configList = configScript.split(/(--\[\[@+[a-z]+\]\])/);
    configList = configList.slice(1);
    for (var i = 0; i < configList.length; i += 2) {
      const obj = new ConfigObject({
        parent: this,
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

  insert(config, atPosition) {
    if (!(config instanceof ConfigObject)) {
      throw "Invalid config object. Expected an instance of ConfigObject.";
    }
    //Make a deep copy
    const copy = config.makeCopy();
    copy.parent = this;
    super.splice(atPosition, 0, copy);
  }

  push(config) {
    if (!(config instanceof ConfigObject)) {
      throw "Invalid config object. Expected an instance of ConfigObject.";
    }
    //Make a deep copy
    const copy = config.makeCopy();
    copy.parent = this;
    super.push(copy);
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

  //Returns true if config limit is NOT reached
  checkLength() {
    return this.toConfigScript().length <= grid.properties.CONFIG_LENGTH;
  }

  // Override the slice() method to ensure custom properties are copied
  slice(...args) {
    const copy = super.slice(...args);
    for (const obj of copy) {
      obj.parent = copy;
    }
    copy.target = this.target;
    return copy;
  }

  // Override the concat() method to ensure custom properties are copied
  concat(...args) {
    const copy = super.concat(...args);
    for (const obj of copy) {
      obj.parent = copy;
    }
    copy.target = this.target;
    return copy;
  }

  // Override the splice() method to ensure custom properties are copied
  splice(start, deleteCount, ...items) {
    const copy = super.splice(start, deleteCount, ...items);
    for (const obj of copy) {
      obj.parent = copy;
    }
    copy.target = this.target;
    return copy;
  }
}

export class ConfigTarget {
  constructor({ device: { dx: dx, dy: dy }, page, element, eventType }) {
    try {
      const device = get(runtime).find((e) => e.dx == dx && e.dy == dy);
      if (typeof device === "undefined") {
        throw "Unknown device!";
      }

      this.device = { dx: dx, dy: dy };
      this.page = page;
      this.element = element;
      this.eventType = eventType;

      this.events = device.pages
        .at(page)
        .control_elements.find((e) => e.controlElementNumber == element).events;
    } catch (e) {
      console.error(`ConfigTarget: ${e}`);
    }
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
