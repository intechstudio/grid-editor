import { get } from "svelte/store";
import { v4 as uuidv4 } from "uuid";

import mixpanel from "mixpanel-browser";
import {
  runtime,
  logger,
  appActionClipboard,
  user_input,
} from "../../../runtime/runtime.store";

import { getComponentInformation } from "../../../lib/_configs";

import stringManipulation from "../../user-interface/_string-operations";
import * as luamin from "lua-format";

import _utils from "../../../runtime/_utils.js";
import grid from "../../../protocol/grid-protocol.js";

const luaminOptions = {
  RenameVariables: false, // Should it change the variable names? (L_1_, L_2_, ...)
  RenameGlobals: false, // Not safe, rename global variables? (G_1_, G_2_, ...) (only works if RenameVariables is set to true)
  SolveMath: false, // Solve math? (local a = 1 + 1 => local a = 2, etc.)
};

export class ConfigObject {
  constructor({ short, script }) {
    this.id = uuidv4();
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
  }

  checkSyntax() {
    try {
      const code = this.script;
      checkForbiddenIdentifiers(code);
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
}

export class ConfigTarget {
  constructor({ device: { dx: dx, dy: dy }, page, element, eventType }) {
    this.device = { dx: dx, dy: dy };
    this.page = page;
    this.element = element;
    this.eventType = eventType;

    //Get events
    try {
      const device = get(runtime).find((e) => e.dx == dx && e.dy == dy);
      if (typeof device === "undefined") {
        throw "Unknown device!";
      }
      this.events = device.pages.at(page).control_elements.at(element).events;
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
