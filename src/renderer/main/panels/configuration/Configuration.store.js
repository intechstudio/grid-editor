import { get, writable } from "svelte/store";

import {
  runtime,
  user_input,
  getDeviceName,
} from "../../../runtime/runtime.store";
import { NumberToEventType } from "grid-protocol";

import {
  getComponentInformation,
  init_config_block_library,
} from "../../../lib/_configs";

import { grid, GridScript } from "grid-protocol";
import { v4 as uuidv4 } from "uuid";

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

    this.information = res.information;
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
    const code =
      this.information.syntaxPreprocessor?.generate(this.script) ?? this.script;
    return GridScript.checkSyntax(code);
  }

  getSyntaxError() {
    try {
      formatText(code);
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

  static createFromTarget(target) {
    return new Promise((resolve, reject) => {
      if (typeof target === "undefined") {
        reject("ConfigTarget is undefined");
        return;
      }

      target
        .getConfig()
        .then((script) => {
          //LOADED and SYNCED
          const list = ConfigList.createFromActionString(script);
          resolve(list);
        })
        .catch((e) => reject(e));
    });
  }

  static createFromActionString(string) {
    const config = new ConfigList();
    config.#Init(string);
    return config;
  }

  sendTo({ target }) {
    return new Promise((resolve, reject) => {
      this.checkLength();
      const actionString = this.toConfigScript();

      runtime
        .fetchOrLoadConfig({
          dx: target.device.dx,
          dy: target.device.dy,
          page: target.page,
          element: target.element,
          event: target.eventType,
        })
        .then((desc) => {
          runtime.update_event_configuration(
            target.device.dx,
            target.device.dy,
            target.page,
            target.element,
            target.eventType,
            actionString
          );

          runtime.send_event_configuration_to_grid(
            target.device.dx,
            target.device.dy,
            target.page,
            target.element,
            target.eventType
          );

          resolve("Event sent to grid.");
        })
        .catch((e) => reject(e));
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
    if (length > grid.getProperty("CONFIG_LENGTH")) {
      const target = ConfigTarget.getCurrent();
      throw {
        type: "lengthError",
        device: getDeviceName(target.device.dx, target.device.dy),
        x: target.device.dx,
        y: target.device.dy,
        element: { no: target.element },
        event: {
          no: target.eventType,
          type: NumberToEventType(target.eventType),
        },
        length: length,
      };
    }
  }
}

export class ConfigTarget {
  device = { dx: undefined, dy: undefined };
  page = undefined;
  element = undefined;
  eventType = undefined;
  events = undefined;
  elementType = undefined;

  static create({ device: { dx: dx, dy: dy }, page, element, eventType }) {
    const device = get(runtime).find((e) => e.dx == dx && e.dy == dy);

    if (typeof device === "undefined") {
      //console.warn(`Unknown device at (${dx},${dy})!`);
      return undefined;
    }

    try {
      const target = new ConfigTarget();
      target.device = { dx: dx, dy: dy };
      target.page = page;
      target.element = element;
      target.eventType = eventType;

      const controlElement = device.pages
        .at(page)
        .control_elements.find((e) => e.elementIndex == element);
      //console.log(device.pages.at(page).control_elements, element);
      target.events = controlElement.events;
      target.elementType = controlElement.type;
      return target;
    } catch (e) {
      console.warn(`Device was destroyed at (${dx},${dy})!`);
      return undefined;
    }
  }

  static createFrom({ userInput }) {
    return ConfigTarget.create({
      device: { dx: userInput.dx, dy: userInput.dy },
      page: userInput.pagenumber,
      element: userInput.elementnumber,
      eventType: userInput.eventtype,
    });
  }

  static getCurrent() {
    const ui = get(user_input);
    const currentTarget = ConfigTarget.create({
      device: { dx: ui.dx, dy: ui.dy },
      page: ui.pagenumber,
      element: ui.elementnumber,
      eventType: ui.eventtype,
    });

    return currentTarget;
  }

  watch() {
    return new ConfigTargetWatcher(this);
  }

  hasChanges() {
    for (const event of this.events) {
      if (event.config !== event.stored) {
        return true;
      }
    }
    return false;
  }

  getEvent() {
    const element = this.getElement();
    const event = element.events.find((e) => e.type == this.eventType);
    return event;
  }

  getElement() {
    const page = this.getPage();
    const element = page.control_elements.find(
      (element) => element.elementIndex == this.element
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
    return new Promise((resolve, reject) => {
      const event = this.getEvent();
      if (typeof event.config === "undefined") {
        runtime
          .fetchOrLoadConfig({
            dx: this.device.dx,
            dy: this.device.dy,
            page: this.page,
            element: this.element,
            event: this.eventType,
          })
          .then(() => {
            resolve(this.getEvent().config);
          })
          .catch((e) => reject(e));
      } else {
        resolve(event.config);
      }
    });
  }
}

//TODO: Format this out when changing to TS
/**
 * @type {import("svelte/store").Writable<ConfigList> & {
 *   update: (params: any) => void;
 *   set: (value: any) => void;
 *   unsubscribe: () => void;
 *   loadPreset: (any) => Promise<void>;
 *   loadProfile: (any) => Promise<void>;
 *   refresh: () => void;
 * }}
 */
export const configManager = create_configuration_manager();

function create_configuration_manager() {
  const internal = writable(new ConfigList());
  let unsubscribeUserInput;
  const loadAndInit = async () => {
    await init_config_block_library();
    unsubscribeUserInput = user_input.subscribe((ui) => {
      createConfigListFrom(ui)
        .then((list) => {
          setOverride(list);
        })
        .catch((e) => {
          console.warn(e);
          setOverride(new ConfigList());
        });
    });
  };

  loadAndInit();

  function createConfigListFrom(ui) {
    return new Promise((resolve, reject) => {
      const target = ConfigTarget.createFrom({ userInput: ui });
      ConfigList.createFromTarget(target)
        .then((list) => {
          resolve(list);
        })
        .catch((e) => {
          console.log(e);
          reject(e);
        });
    });
  }

  function loadPreset({ x, y, element, preset }) {
    return new Promise((resolve, reject) => {
      const ui = get(user_input);
      const { dx, dy, page, elementNumber } = {
        dx: x,
        dy: y,
        page: ui.pagenumber,
        elementNumber: element,
      };
      runtime
        .fetch_element_configuration_from_grid(dx, dy, page, elementNumber)
        .then((desc) => {
          runtime.element_preset_load(x, y, element, preset).then(() => {
            const ui = get(user_input);
            createConfigListFrom(ui).then((list) => {
              setOverride(list);
              resolve();
            });
          });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  function loadProfile({ x, y, profile }) {
    return new Promise((resolve, reject) => {
      const ui = get(user_input);
      runtime
        .fetch_page_configuration_from_grid({
          dx: x,
          dy: y,
          page: ui.pagenumber,
        })
        .then((desc) => {
          runtime
            .whole_page_overwrite(x, y, profile)
            .then(() => {
              const ui = get(user_input);
              createConfigListFrom(ui).then((list) => {
                setOverride(list);
                resolve();
              });
            })
            .catch((e) => reject(e));
        })
        .catch((e) => reject(e));
    });
  }

  function handleDataChange(list) {
    ConfigList.updateIndentation(list);
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

  async function refresh() {
    return new Promise((resolve, reject) => {
      const current = ConfigTarget.getCurrent();
      ConfigList.createFromTarget(current)
        .then((list) => {
          configManager.set(list);
          resolve();
        })
        .catch((e) => reject(e));
    });
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
    refresh: refresh,
  };
}
