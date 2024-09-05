import { Architecture, ElementType } from "@intechstudio/grid-protocol";
import {
  writable,
  get,
  Writable,
  Subscriber,
  Unsubscriber,
  Updater,
} from "svelte/store";

abstract class RuntimeNode<T> implements Writable<T> {
  protected _internal: Writable<T>;
  private _parent: RuntimeNode<any>;

  subscribe(
    run: Subscriber<T>,
    invalidate?: (value?: T) => void
  ): Unsubscriber {
    return this._internal.subscribe(run, invalidate);
  }

  set(value: T) {
    this._internal.set(value);
    this.notifyParent();
  }

  update(updater: Updater<T>) {
    this._internal.update(updater);
    this.notifyParent();
  }

  constructor(parent: RuntimeNode<any>, value?: T) {
    this._parent = parent;
    this._internal = writable(value);
  }

  get parent(): RuntimeNode<any> {
    return this._parent;
  }

  protected notify() {
    //console.log("ME NOTIFIED:", this);
    this._internal.update((s) => s);
    this.notifyParent();
  }

  protected syncWithGrid() {
    console.log("SYNCING");
  }

  protected notifyParent() {
    if (!this._parent) {
      return;
    }

    console.log("NOTIFY", this._parent);
    this._parent.notify();
  }

  // Generalized getter
  protected getField<K extends keyof T>(key: K): T[K] {
    const data = get(this._internal);
    return data[key];
  }

  // Generalized setter
  protected setField<K extends keyof T>(key: K, value: T[K]) {
    this.update((store) => {
      store[key] = value;
      return store;
    });
    this.notifyParent();
  }
}

export type ActionData = {
  short: string;
  script: string;
  name: string;
};

export class GridAction extends RuntimeNode<ActionData> {
  constructor(parent: GridEvent, data?: ActionData) {
    super(parent, data);
  }

  // Getters
  get script() {
    return this.getField("script");
  }

  get short() {
    return this.getField("short");
  }

  get name() {
    return this.getField("name");
  }

  // Setters
  set script(value: string) {
    this.setField("script", value);
  }

  set short(value: string) {
    this.setField("short", value);
  }

  set name(value: string) {
    this.setField("name", value);
  }

  toLua() {
    const namePostfix = typeof this.name !== "undefined" ? `#${this.name}` : "";
    return `--[[@${this.short}${namePostfix}]] ${this.script}`;
  }
}

export type EventData = {
  config: Array<GridAction>;
  stored: Array<GridAction[]>;
  type: number;
};

export class GridEvent extends RuntimeNode<ActionData> {
  constructor(parent: GridEvent, data?: ActionData) {
    super(parent, data);
  }

  // Getters

  // Setters
}

export type ElementData = {
  elementIndex: number;
  events: Array<GridEvent>;
  name: string;
  type: ElementType;
};

export class GridElement extends RuntimeNode<ElementData> {
  constructor(parent: GridEvent, data?: ElementData) {
    super(parent, data);
  }

  // Getters

  // Setters
}

export type PageData = {
  pageNumber: number;
  control_elements: Array<GridElement>;
};

export class GridPage extends RuntimeNode<PageData> {
  constructor(parent: GridModule, data?: PageData) {
    super(parent, data);
  }

  // Getters

  // Setters
}

type FirmwareVersion = {
  major: number | undefined;
  minor: number | undefined;
  patch: number | undefined;
};

type Direction = {
  dx: number;
  dy: number;
};

type DirectionMap = {
  bot: Direction;
  left: Direction;
  right: Direction;
  top: Direction;
};

export type ModuleData = {
  alive: number;
  architecture: Architecture;
  dx: number;
  dy: number;
  fwMismatch: boolean;
  fwVersion: FirmwareVersion;
  gridX: number;
  gridY: number;
  id: string;
  map: DirectionMap;
  portstate: any;
  rot: number;
  type: string;
  pages: Array<GridPage>;
};

export class GridModule extends RuntimeNode<ModuleData> {
  constructor(parent: GridRuntime, data?: ModuleData) {
    super(parent, data);
  }

  // Getters

  // Setters
}

export class GridRuntime extends RuntimeNode<void> {
  constructor() {
    super(undefined, undefined);
  }

  // Getters

  // Setters
}

//TODO: helper function to refactor out
export function createActionsFromString(script: string) {
  const result: GridAction[] = [];
  let configList: string[] = [];
  let actionString = script;
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
  configList = actionString.split(/(--\[\[@\w+(?:#|\w|\s)*\]\])/);

  configList = configList.slice(1);
  for (var i = 0; i < configList.length; i += 2) {
    const split = configList[i]
      .match(/--\[\[@(.*)\]\]/)
      ?.at(1)
      .split(/#(.*)/);
    const obj = new GridAction(undefined, {
      //Extract short + name, e.g.: '--[[@gms#name]]' => 'gms'
      short: split[0],
      script: configList[i + 1].trim(),
      name: split.length > 1 ? split[1] : undefined,
    });
    result.push(obj);
  }

  return result;
}
