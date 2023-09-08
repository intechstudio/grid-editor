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

    this.information = structuredClone(res.information);

    //Information override for Encoder type events
    if (this.short === "eprlrei") {
      if (this.script.includes("64")) {
        this.information.blockTitle = "Just Rotate Left";
        this.information.blockIcon = `
      <svg width="100%" height="100%" viewBox="0 0 445 338" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M362.457 89.786C324.915 49.1659 274.185 25.0518 219.158 26.4863C156.42 28.1218 100.934 62.6639 65.3276 116.012L100.43 130.565L24.3675 188.44L12.0516 93.9256L49.754 109.556C87.8056 50.9138 148.732 11.8089 218.724 9.98434C279.12 8.40988 334.291 34.9308 374.659 78.6088C399.329 105.302 418.516 138.435 430.113 175.622L432.571 183.505L416.735 188.399L414.277 180.517C403.384 145.587 385.408 114.619 362.457 89.786Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0516 93.9256L49.754 109.556C87.8056 50.9138 148.732 11.8089 218.724 9.98434C279.12 8.40988 334.291 34.9308 374.659 78.6088C398.978 104.922 417.97 137.494 429.614 174.038C429.782 174.566 429.948 175.094 430.113 175.622L432.57 183.499L432.571 183.505L416.735 188.399L416.734 188.395L414.277 180.517C403.384 145.587 385.408 114.619 362.457 89.786C324.915 49.1659 274.185 25.0518 219.158 26.4863C159.744 28.0351 106.836 59.0953 71.1543 107.692C69.1576 110.411 67.2146 113.185 65.3276 116.012L100.43 130.565L24.3675 188.44L12.0516 93.9256ZM80.5998 111.607L120.166 128.011L16.7456 206.703L0 78.1928L46.054 97.2856C85.8604 40.111 147.546 1.91866 218.465 0.0698728C282.057 -1.58788 339.88 26.3655 381.943 71.8773C407.644 99.686 427.56 134.122 439.582 172.67L445 190.045L410.212 200.796L404.809 183.47C394.341 149.902 377.093 120.235 355.173 96.5177C319.328 57.7331 271.251 35.0497 219.416 36.4009C164.264 37.8387 114.674 66.2797 80.5998 111.607Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M222.312 307.456C271.609 307.456 311.573 267.492 311.573 218.194C311.573 168.897 271.609 128.933 222.312 128.933C173.014 128.933 133.05 168.897 133.05 218.194C133.05 267.492 173.014 307.456 222.312 307.456ZM222.312 337.209C288.042 337.209 341.327 283.924 341.327 218.194C341.327 152.464 288.042 99.1792 222.312 99.1792C156.581 99.1792 103.296 152.464 103.296 218.194C103.296 283.924 156.581 337.209 222.312 337.209Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0516 93.9256L49.754 109.556C87.8056 50.9138 148.732 11.8089 218.724 9.98434C279.12 8.40988 334.291 34.9308 374.659 78.6088C398.978 104.922 417.97 137.494 429.614 174.038C429.782 174.566 429.948 175.094 430.113 175.622L432.57 183.499L432.571 183.505L416.735 188.399L416.734 188.395L414.277 180.517C403.384 145.587 385.408 114.619 362.457 89.786C324.915 49.1659 274.185 25.0518 219.158 26.4863C159.744 28.0351 106.836 59.0953 71.1543 107.692C69.1576 110.411 67.2146 113.185 65.3276 116.012L100.43 130.565L24.3675 188.44L12.0516 93.9256ZM80.5998 111.607L120.166 128.011L16.7456 206.703L0 78.1928L46.054 97.2856C85.8604 40.111 147.546 1.91866 218.465 0.0698728C282.057 -1.58788 339.88 26.3655 381.943 71.8773C407.644 99.686 427.56 134.122 439.582 172.67L445 190.045L410.212 200.796L404.809 183.47C394.341 149.902 377.093 120.235 355.173 96.5177C319.328 57.7331 271.251 35.0497 219.416 36.4009C164.264 37.8387 114.674 66.2797 80.5998 111.607Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M222.312 307.456C271.609 307.456 311.573 267.492 311.573 218.194C311.573 168.897 271.609 128.933 222.312 128.933C173.014 128.933 133.05 168.897 133.05 218.194C133.05 267.492 173.014 307.456 222.312 307.456ZM222.312 337.209C288.042 337.209 341.327 283.924 341.327 218.194C341.327 152.464 288.042 99.1792 222.312 99.1792C156.581 99.1792 103.296 152.464 103.296 218.194C103.296 283.924 156.581 337.209 222.312 337.209Z" fill="black"/>
      </svg>
      `;
      } else {
        this.information.blockTitle = "Push & Rotate Right";
        this.information.blockIcon = `
      <svg width="100%" height="100%" viewBox="0 0 445 338" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M82.5432 89.786C120.085 49.1659 170.815 25.0519 225.842 26.4864C288.58 28.1219 344.065 62.6639 379.672 116.012L344.57 130.565L420.632 188.44L432.948 93.9256L395.246 109.556C357.194 50.9138 296.268 11.809 226.276 9.98439C165.88 8.40993 110.709 34.9308 70.3406 78.6089C45.6706 105.302 26.4834 138.435 14.8866 175.622L12.4284 183.505L28.2647 188.4L30.7229 180.517C41.6156 145.588 59.5922 114.619 82.5432 89.786Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M432.948 93.9256L395.246 109.556C357.194 50.9139 296.268 11.809 226.276 9.98442C165.88 8.40996 110.709 34.9309 70.3406 78.6089C46.0213 104.922 27.0302 137.494 15.3859 174.038C15.2179 174.566 15.0515 175.094 14.8866 175.622L12.4303 183.499L12.4284 183.505L28.2646 188.4L28.266 188.395L30.7228 180.517C41.6155 145.588 59.5921 114.619 82.5431 89.7861C120.085 49.166 170.814 25.0519 225.842 26.4864C285.255 28.0352 338.164 59.0953 373.846 107.692C375.842 110.411 377.785 113.185 379.672 116.013L344.57 130.565L420.632 188.441L432.948 93.9256ZM364.4 111.607L324.834 128.011L428.254 206.703L445 78.1928L398.946 97.2856C359.14 40.111 297.454 1.91866 226.535 0.0698728C162.943 -1.58788 105.12 26.3655 63.057 71.8773C37.3556 99.686 17.4397 134.122 5.41835 172.67L9.5058e-07 190.045L34.7876 200.796L40.191 183.47C50.6592 149.902 67.907 120.235 89.8267 96.5177C125.672 57.7331 173.749 35.0497 225.584 36.4009C280.736 37.8387 330.326 66.2797 364.4 111.607Z" fill="black"/>
        <path d="M341.703 218.194C341.703 283.924 288.419 337.209 222.688 337.209C156.958 337.209 103.673 283.924 103.673 218.194C103.673 152.464 156.958 99.1792 222.688 99.1792C288.419 99.1792 341.703 152.464 341.703 218.194Z" fill="black"/>
      </svg>
      `;
      }
    }
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
      copy.push(config.makeCopy());
    }

    copy.target = this.target;

    // Copy any additional properties that were added later
    for (const prop in this) {
      if (this.hasOwnProperty(prop) && !copy.hasOwnProperty(prop)) {
        copy[prop] = this[prop];
      }
    }

    return copy;
  }

  static getIndentationMap(list) {
    if (list.length === 0) {
      return [];
    }

    let indentationMap = [];
    let indentation = 0;
    for (let i = 0; i < list.length; ++i) {
      //If
      if (list[i].information.name.endsWith("_If")) {
        ++indentation;
      }

      if (list[i].information.rendering === "modifier") {
        indentationMap.push(indentation - 1);
      } else {
        indentationMap.push(indentation);
      }

      //End
      if (list[i].information.name.endsWith("_End")) {
        --indentation;
      }
    }
    return indentationMap;
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
