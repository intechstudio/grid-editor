import { get } from "svelte/store";

import {
  runtime,
  user_input,
  luadebug_store,
} from "../../../runtime/runtime.store";

//import { checkForbiddenIdentifiers } from "../../../runtime/monaco-helper";

import { getComponentInformation } from "../../../lib/_configs";

import stringManipulation from "../../user-interface/_string-operations";
import * as luamin from "lua-format";

import _utils from "../../../runtime/_utils.js";
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
    this.rawLua = `--[[@${short}]] ` + script;

    const res = getComponentInformation({ short: short });
    if (typeof res === "undefined") {
      throw "Config component information not found.";
    }

    this.information = res.information;
    this.component = res.component;
    this.selected = false;
    this.toggled = false;
    this.id = uuidv4();
  }

  checkSyntax() {
    //If not a CodeBlock, and script contains if, add end to if.
    //If not done, it will always fail.
    //TODO: Rework composite blocks in a way, so this exception
    //does not occure.
    let code = this.script;
    if (this.short !== "cb" && code.startsWith("if")) {
      code += " end";
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
      //console.log(code);
      //console.log(e);
      return false;
    }
  }
}

export class ConfigList extends Array {
  //Internal private list
  target = undefined;

  static createFrom(target) {
    if (!(target instanceof ConfigTarget)) {
      throw "Invalid target object. Expected an instance of ConfigTarget.";
    }

    this.target = target;

    try {
      const config = new ConfigList();
      config.target = target;
      config.#Init();
      return config;
    } catch (e) {
      console.error("ConfigList:", e);
      return undefined;
    }
  }

  sendTo({ target }) {
    return new Promise((resolve, reject) => {
      if (!(target instanceof ConfigTarget)) {
        reject(
          new Error(
            `Invalid target object (${target}). Expected an instance of ConfigTarget.`
          )
        );
      }

      if (!this.checkLength()) {
        reject(new Error("Length error!"));
      }

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

      luadebug_store.update_config(actionString);

      resolve("Event sent to grid.");
    });
  }

  #Init() {
    const rt = get(runtime);
    const device = rt.find(
      (e) => e.dx == this.target.device.dx && e.dy == this.target.device.dy
    );

    if (typeof device === "undefined") {
      throw "Unknown device!";
    }

    const page = device.pages.at(this.target.page);
    const element = page.control_elements.at(this.target.element);
    let event = element.events.find(
      (e) => e.event.value == this.target.eventType
    );
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
      super.push(
        new ConfigObject({
          //Extract short, e.g.: '--[[@gms]]' => 'gms'
          short: configList[i].match(/--\[\[@(.+?)\]\]/)?.[1],
          script: configList[i + 1].trim(),
        })
      );
    }
  }

  toConfigScript() {
    let lua = "";
    super.forEach((e) => (lua += e.rawLua));
    lua = "<?lua " + lua.replace(/(\r\n|\n|\r)/gm, "") + " ?>";
    return lua;
  }

  insert(config, atPosition) {
    if (!(config instanceof ConfigObject)) {
      throw "Invalid config object. Expected an instance of ConfigObject.";
    }
    super.splice(atPosition, 0, config);
  }

  push(config) {
    if (!(config instanceof ConfigObject)) {
      throw "Invalid config object. Expected an instance of ConfigObject.";
    }
    super.push(config);
  }

  remove(atPosition) {
    super.splice(atPosition, 1);
  }

  checkSyntax() {
    super.forEach((e) => {
      if (!e.checkSyntax()) {
        return false;
      }
    });
    return true;
  }

  checkLength() {
    return this.toConfigScript().length <= grid.properties.CONFIG_LENGTH;
  }

  // Override the slice() method to ensure custom properties are copied
  slice(...args) {
    const copy = super.slice(...args);
    copy.target = this.target;
    return copy;
  }

  // Override the concat() method to ensure custom properties are copied
  concat(...args) {
    const copy = super.concat(...args);
    copy.target = this.target;
    return copy;
  }

  // Override the splice() method to ensure custom properties are copied
  splice(start, deleteCount, ...items) {
    const copy = super.splice(start, deleteCount, ...items);
    copy.target = this.target;
    return copy;
  }

  //Use this insead of the spread (...) operator
  copy() {
    const copy = new ConfigList(...this);
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

      //TODO: is this a bug?
      if (element === 255) {
        this.element = device.pages.at(page).control_elements.length - 1;
      } else {
        this.element = element;
      }
      this.eventType = eventType;

      //Get events
      this.events = device.pages
        .at(this.page)
        .control_elements.at(this.element).events;
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
