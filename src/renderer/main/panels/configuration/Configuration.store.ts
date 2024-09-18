import { get, writable, type Writable } from "svelte/store";

import {
  runtime,
  user_input,
  getDeviceName,
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
import * as ButtonStepElseIf from "../../../config-blocks/ButtonStep_ElseIf.svelte";
import { GridAction, GridEvent } from "../../../runtime/runtime";
import { ActionBlockInformation } from "../../../config-blocks/ActionBlockInformation";
import { SvelteComponent, tick } from "svelte";

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
  public runtimeRef: GridAction;
  public id: string;

  public information: ActionBlockInformation;
  public indentation: number;
  public step: number;
  public header: SvelteComponent;
  public component: SvelteComponent;
  public selected: boolean;
  public toggled: boolean;

  constructor({ short, script, name = undefined, runtimeRef }) {
    this.runtimeRef = runtimeRef;
    this.short = short;
    this.script = script;
    this.name = name;
    this.id = runtimeRef?.id;

    let res = getComponentInformation({ short: short });

    //Backward compatibility
    if (typeof res === "undefined") {
      res = getComponentInformation({ short: "raw" });
    }

    this.information = res.information;
    this.indentation = 0;
    this.step = 0;
    this.header = res.header;
    this.component = res.component;
    this.selected = false;
    this.toggled = false;
  }

  get short(): string {
    return this.runtimeRef.short;
  }

  set short(value: string) {
    this.runtimeRef.short = value;
  }

  get script(): string {
    return this.runtimeRef.script;
  }

  set script(value: string) {
    this.runtimeRef.script = value;
  }

  get name(): undefined | string {
    return this.runtimeRef.name;
  }

  set name(value: undefined | string) {
    this.runtimeRef.name = value;
  }

  toRawLua() {
    return `--[[@${this.short}${
      typeof this.name !== "undefined" &&
      this.name !== this.information.displayName
        ? "#" + this.name
        : ""
    }]] ${this.script}`;
  }

  //Returns true if syntax is OK
  checkSyntax() {
    const code =
      this.information.syntaxPreprocessor?.generate(this.script) ?? this.script;
    return GridScript.checkSyntax(code);
  }
}

export class ConfigList extends Array {
  static updateStep(list) {
    let stack = [];
    for (const config of list) {
      if (config.short === "bst0") {
        stack.push(0);
      }

      if (config.short === "bste") {
        stack.pop();
      }

      if (config.short === "bstn") {
        const step = ++stack[stack.length - 1];
        config.step = step;
        config.script = ButtonStepElseIf.information.defaultLua.replace(
          "N",
          String(step)
        );
      }
    }
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
        .getActions()
        .then((actions) => {
          //LOADED and SYNCED
          const list = ConfigList.createFromActions(actions);
          resolve(list);
        })
        .catch((e) => reject(e));
    });
  }

  static createFromActions(actions) {
    const config = new ConfigList();
    config.init(actions);
    return config;
  }

  sendTo({ target }): Promise<string> {
    return new Promise((resolve, reject) => {
      const res = this.checkLength();
      if (!res.value) {
        reject(res.detail);
        return;
      }

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
            this.map((e) => e.runtimeRef)
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

  private init(actions) {
    for (const action of actions) {
      const obj = new ConfigObject({
        short: action.short,
        script: action.script,
        name: action.name,
        runtimeRef: action,
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

  //Returns error if limit is reached
  checkLength() {
    const script = this.toConfigScript();
    const length = script.length;
    if (length >= grid.getProperty("CONFIG_LENGTH")) {
      const target = ConfigTarget.getCurrent();
      return {
        value: false,
        detail: {
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
        },
      };
    } else {
      return { value: true, detail: undefined };
    }
  }
}

export class ConfigTarget {
  public device: { dx: number; dy: number };
  public page: number;
  public element: number;
  public eventType: number;
  public events: GridEvent[];
  public elementType: ElementType;
  public runtimeRef: GridEvent;

  static create({ device: { dx: dx, dy: dy }, page, element, eventType }) {
    const device = runtime.modules.find((e) => e.dx == dx && e.dy == dy);

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
      target.events = controlElement.events;
      target.elementType = controlElement.type;
      target.runtimeRef = target.events.find(
        (e) => e.type === target.eventType
      );
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
      if (event.hasChanges()) {
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
    const device = runtime.modules.find(
      (e) => e.dx == this.device.dx && e.dy == this.device.dy
    );
    return device;
  }

  getActions() {
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

type ConfigManager = Writable<ConfigList> & {
  update: (params: any) => void;
  set: (value: any) => void;
  unsubscribe: () => void;
  loadPreset: (params: any) => Promise<void>;
  loadProfile: (params: any) => Promise<void>;
  refresh: () => void;
};

export const configManager = create_configuration_manager();

function create_configuration_manager(): ConfigManager {
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

  function loadPreset({ x, y, element, preset }): Promise<void> {
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
              createConfigListFrom(ui).then((list) => {
                setOverride(list);
                resolve();
              });
            }
          });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  function loadProfile({ x, y, profile }): Promise<void> {
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
    ConfigList.updateStep(list);
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

  async function refresh(): Promise<void> {
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
    },
    loadPreset: loadPreset,
    loadProfile: loadProfile,
    refresh: refresh,
  };
}
