import { get, Writable, writable } from "svelte/store";

import {
  runtime,
  user_input,
  getDeviceName,
  ElementEvent,
  ControlElement,
  Page,
  Module,
  ConfigurationList,
} from "../../../runtime/runtime.store";
import {
  ElementType,
  EventType,
  NumberToEventType,
} from "@intechstudio/grid-protocol";

import {
  getComponentInformation,
  init_config_block_library,
} from "../../../lib/_configs";

import { grid, GridScript } from "@intechstudio/grid-protocol";
import { v4 as uuidv4 } from "uuid";
import { ActionBlockInformation } from "../../../config-blocks/ActionBlockInformation";
import { SvelteComponent } from "svelte";

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
  public id: string;
  public short: string;
  public script: string;
  public information: ActionBlockInformation;
  public indentation: Number;
  public component: SvelteComponent;
  public header: SvelteComponent;
  public selected: boolean;
  public toggled: boolean;

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

  //Returns true if syntax is OK
  checkSyntax() {
    const code =
      this.information.syntaxPreprocessor?.generate(this.script) ?? this.script;
    return GridScript.checkSyntax(code);
  }
}

export class ConfigList extends Array {
  static updateIndentation(list: ConfigList) {
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

  static createFromTarget(target: ConfigTarget) {
    return new Promise((resolve, reject) => {
      if (typeof target === "undefined") {
        reject("ConfigTarget is undefined");
        return;
      }

      target
        .getConfig()
        .then((script: string) => {
          //LOADED and SYNCED
          const list = ConfigList.createFromActionString(script);
          resolve(list);
        })
        .catch((e) => reject(e));
    });
  }

  static createFromActionString(string: string) {
    const config = new ConfigList();
    config.Init(string);
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

  private Init(actionString: string) {
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
  public device = { dx: undefined, dy: undefined };
  public page;
  public element;
  public eventType: number;
  public events: ElementEvent[];
  public elementType: ElementType;
  public id: string;

  static create({ device: { dx: dx, dy: dy }, page, element, eventType }) {
    const device = runtime.getModule(dx, dy);

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
      target.id = uuidv4();

      const controlElements = device.getPage(page).getElement(element);
      target.events = controlElements.getEvents();
      target.elementType = controlElements.getType();
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

  hasChanges() {
    for (const event of this.events) {
      if (event.getConfigs() !== event.getStored()) {
        return true;
      }
    }
    return false;
  }

  getEvent(): ElementEvent {
    const element = this.getElement();
    return element.getEvent(this.eventType);
  }

  getElement(): ControlElement {
    const page = this.getPage();
    return page.getElement(this.element);
  }

  getPage(): Page {
    const device = this.getDevice();
    return device.getPage(this.page);
  }

  getDevice(): Module {
    return runtime.getModule(this.device.dx, this.device.dy);
  }

  getConfig() {
    return new Promise<ConfigurationList>((resolve, reject) => {
      const event = this.getEvent();
      if (typeof event.getConfigs() === "undefined") {
        runtime
          .fetchOrLoadConfig({
            dx: this.device.dx,
            dy: this.device.dy,
            page: this.page,
            element: this.element,
            event: this.eventType,
          })
          .then((script: string) => {
            resolve(script);
          })
          .catch((e) => reject(e));
      } else {
        resolve(event.getConfigs());
      }
    });
  }
}

interface ConfigManger extends Writable<ConfigManagerNode> {
  update: (params: any) => void;
  set: (value: any) => void;
  loadPreset: (...arg: any) => Promise<boolean>;
  loadProfile: (...arg: any) => Promise<boolean>;
  refresh: () => void;
  getConfigPath: (id: string) => ConfigPath | undefined;
  getContainingTarget: (configId: string) => ConfigTarget | undefined;
  getContainingList: (configId: string) => ConfigList | undefined;
}

type ConfigPath = {
  dx: Number;
  dy: Number;
  page: Number;
  element: Number;
  event: Number;
  index: Number;
};

type ConfigManagerNode = { target: ConfigTarget; configs: ConfigList };

export const configManager: ConfigManger = create_configuration_manager();

function create_configuration_manager(): ConfigManger {
  const internal: Writable<ConfigManagerNode> = writable(undefined);
  const buffer = writable(new Map());
  const loadAndInit = async () => {
    await init_config_block_library();
    user_input.subscribe((ui) => {
      console.log(ui);
      createConfigListFrom(ui)
        .then((list: ConfigList) => {
          setOverride({
            target: ConfigTarget.createFrom({ userInput: ui }),
            configs: list,
          });
        })
        .catch((e) => {
          console.warn(e);
          setOverride(undefined);
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

  function loadPreset({ x, y, element, preset }): Promise<boolean> {
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
            if (ui.dx === x && ui.dy === y && ui.elementnumber === element) {
              createConfigListFrom(ui).then((list: ConfigList) => {
                setOverride({
                  target: ConfigTarget.createFrom({ userInput: ui }),
                  configs: list,
                });

                resolve(true);
              });
            }
          });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  function loadProfile({ x, y, profile }): Promise<boolean> {
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
              createConfigListFrom(ui).then((list: ConfigList) => {
                setOverride({
                  target: ConfigTarget.createFrom({ userInput: ui }),
                  configs: list,
                });
                resolve(true);
              });
            })
            .catch((e) => reject(e));
        })
        .catch((e) => reject(e));
    });
  }

  function handleDataChange(target: ConfigTarget, configs: ConfigList) {
    ConfigList.updateIndentation(configs);
  }

  function updateOverride(func) {
    internal.update((store) => {
      store.configs = func(store.configs);
      handleDataChange(store.target, store.configs);
      return store;
    });
  }

  function setOverride(value: ConfigManagerNode) {
    const [target, configs] = [value?.target, value?.configs];
    if (typeof configs === "undefined" || typeof target === "undefined") {
      return;
    }

    handleDataChange(target, configs);
    const key = [
      target.device.dx,
      target.device.dy,
      target.page,
      target.element,
      target.eventType,
    ].join("_");

    const cashed: ConfigManagerNode = get(buffer).get(key);
    if (typeof cashed !== "undefined") {
      cashed.configs = configs;
      internal.set(cashed);
    } else {
      buffer.update((store) => {
        const node = { target: target, configs: configs };
        store.set(key, node);
        internal.set(node);
        return store;
      });
    }
  }

  async function refresh() {
    return new Promise((resolve, reject) => {
      const current = ConfigTarget.getCurrent();
      ConfigList.createFromTarget(current)
        .then((list) => {
          configManager.set({ target: current, configs: list });
          resolve(true);
        })
        .catch((e) => reject(e));
    });
  }

  function getConfigPath(configId: string) {
    for (const node of Array.from(get(buffer).values())) {
      const index = node.configs.findIndex((e) => e.id === configId);
      if (index !== -1) {
        return {
          dx: node.target.device.dx,
          dy: node.target.device.dy,
          page: node.target.page,
          element: node.target.element,
          event: node.target.eventType,
          index: index,
        };
      }
    }
    return undefined;
  }

  function getContainingTarget(configId: string) {
    for (const node of Array.from(get(buffer).values())) {
      const index = node.configs.findIndex((e) => e.id === configId);
      if (index !== -1) {
        return node.target;
      }
    }
    return undefined;
  }

  function getContainingList(configId: string) {
    for (const node of Array.from(get(buffer).values())) {
      const index = node.configs.findIndex((e) => e.id === configId);
      if (index !== -1) {
        return node.configs;
      }
    }
    return undefined;
  }

  return {
    ...internal,
    update: updateOverride,
    set: setOverride,
    loadPreset: loadPreset,
    loadProfile: loadProfile,
    refresh: refresh,
    getConfigPath: getConfigPath,
    getContainingTarget: getContainingTarget,
    getContainingList: getContainingList,
  };
}
