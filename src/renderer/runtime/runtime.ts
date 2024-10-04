import {
  grid,
  Architecture,
  ElementType,
  ModuleType,
  GridScript,
  EventType,
} from "@intechstudio/grid-protocol";
import {
  writable,
  get,
  Writable,
  Subscriber,
  Unsubscriber,
  Updater,
} from "svelte/store";
import { instructions } from "../serialport/instructions";
import { writeBuffer } from "./engine.store";
import { createVirtualModule, virtual_runtime } from "./virtual-engine";
import { Analytics } from "./analytics.js";
import { appSettings } from "./app-helper.store";
import { add_datapoint } from "../serialport/message-stream.store.js";
import {
  elementPositionStore,
  ledColorStore,
  logger,
  user_input,
} from "./runtime.store";
import { v4 as uuidv4 } from "uuid";
import { getComponentInformation } from "../lib/_configs";
import * as CodeBlock from "../config-blocks/CodeBlock.svelte";
import { appClipboard, ClipboardKey } from "./clipboard.store";

type UUID = string;
type LuaScript = string;
type RawEventData = any;
class NodeData {
  id?: UUID;
  parent?: RuntimeNode<any>;
}

export const aliveModules: Writable<Array<{ id: UUID; last: number }>> =
  writable([]);

export class GridProfileData {
  public presets: GridPresetData[] = [];

  static createFromCloudData(cloudProfile: any) {
    const data = cloudProfile.configs;
    const profile = new GridProfileData();
    for (const [index, type] of Object.entries(
      grid.get_module_element_list(cloudProfile.type)
    )) {
      if (typeof type === "undefined") {
        continue;
      }

      const events = data.find(
        (e: any) => e.controlElementNumber === Number(index)
      ).events;
      const preset = new GridPresetData(type, Number(index), events);
      profile.presets.push(preset);
    }
    return profile;
  }
}
export class GridPresetData {
  public element: GridElement;

  constructor(type: ElementType, index: number, array: RawEventData[]) {
    const element = new GridElement(undefined, new ElementData(index, type));
    for (const data of array) {
      const type = Number(data.event);
      const event = element.findEvent(type);
      const actions = GridAction.parse(data.config);
      event.push(...actions);
    }
    this.element = element;
  }

  static createFromCloudData(cloudPreset: any) {
    return new GridPresetData(cloudPreset.type, -1, cloudPreset.configs.events);
  }
}

export enum GridOperationType {
  PASTE_ACTION,
  CUT_ACTION,
  DISCARD_ELEMENT,
  UPDATE_ACTION,
  OVERWRITE_ELEMENT,
  REMOVE_ACTION,
  MERGE_ACTIONS_TO_CODE,
  RESET_ELEMENT,
  SEND_EVENT_TO_GRID,
  LOAD_PRESET,
  LOAD_PROFILE,
  OVERWRITE_EVENT,
  INSERT_ACTIONS,
  REPLACE_ACTION,
}

export interface GridOperationResult {
  value: boolean;
  text: string;
  type: GridOperationType;
}

export interface PasteActionsResult extends GridOperationResult {}
export interface DiscardElementResult extends GridOperationResult {}
export interface OverwriteElementResult extends GridOperationResult {}
export interface UpdateActionResult extends GridOperationResult {}
export interface MergeActionsToCodeResult extends GridOperationResult {}
export interface RemoveActionsResult extends GridOperationResult {}
export interface CutActionsResult extends GridOperationResult {}
export interface ResetElementResult extends GridOperationResult {}
export interface SendToGridResult extends GridOperationResult {}
export interface PresetLoadResult extends GridOperationResult {}
export interface ProfileLoadResult extends GridOperationResult {}
export interface OverwriteEventResult extends GridOperationResult {}
export interface InsertActionsResult extends GridOperationResult {}
export interface ReplaceActionsResult extends GridOperationResult {}

abstract class RuntimeNode<T extends NodeData> implements Writable<T> {
  protected _internal: Writable<T>;

  public subscribe(
    run: Subscriber<T>,
    invalidate?: (value?: T) => void
  ): Unsubscriber {
    return this._internal.subscribe(run, invalidate);
  }

  public set(value: T) {
    this._internal.set(value);
    this.notifyParent();
  }

  public update(updater: Updater<T>) {
    this._internal.update(updater);
    this.notifyParent();
  }

  constructor(parent: RuntimeNode<any>, value?: T) {
    value.parent = parent;
    value.id = uuidv4();
    this._internal = writable(value);
  }

  public get data() {
    return get(this._internal);
  }

  protected set data(value: T) {
    this._internal.set(value);
    this.notifyParent();
  }

  public get parent(): RuntimeNode<any> {
    return this.getField("parent");
  }

  protected set parent(value: RuntimeNode<any>) {
    this.setField("parent", value);
  }

  public get id() {
    return this.getField("id");
  }

  protected set id(value: UUID) {
    this.setField("id", value);
  }

  protected notify() {
    this._internal.update((s) => s);
  }

  protected notifyParent() {
    if (!this.parent) {
      return;
    }

    this.parent.notify();
    this.parent.notifyParent();
  }

  // Generalized getter
  protected getField<K extends keyof T>(key: K): T[K] {
    const data = get(this._internal);
    return data[key];
  }

  // Generalized setter
  protected setField<K extends keyof T>(key: K, value: T[K]) {
    const currentValue = this.getField(key);

    // Do nothing if the value has not changed
    if (currentValue === value) {
      return;
    }

    // Proceed with the update if the value has changed
    this.update((store) => {
      store[key] = value;
      return store;
    });

    this.notifyParent();
  }
}

export class ActionData extends NodeData {
  public short: string;
  public script: string;
  public name?: string;

  constructor(short: string, script: string, name?: string) {
    super();
    this.short = short;
    this.script = script;
    this.name = name;
  }

  public toLua() {
    return `--[[@${this.short}${
      typeof this.name !== "undefined" ? `#${this.name}` : ""
    }]] ${this.script}`;
  }

  public checkSyntax() {
    const code =
      this.information.syntaxPreprocessor?.generate(this.script) ?? this.script;
    return GridScript.checkSyntax(code);
  }

  public get information() {
    let result = GridAction.getInformation(this.short);
    //Backward compatibility
    if (typeof result === "undefined") {
      result = GridAction.getInformation("raw");
    }
    return result;
  }
}

export class GridAction extends RuntimeNode<ActionData> {
  constructor(parent: GridEvent, data?: ActionData) {
    super(parent, data);
  }

  static parse(script: LuaScript) {
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

      const data = new ActionData(
        //Extract short + name, e.g.: '--[[@gms#name]]' => 'gms'
        split[0],
        configList[i + 1].trim(),
        split.length > 1 ? split[1] : undefined
      );
      const obj = new GridAction(undefined, data);
      result.push(obj);
    }

    return result;
  }

  static getInformation(short: string) {
    const result = getComponentInformation({ short: short });
    return result.information;
  }

  public toLua() {
    return this.data.toLua();
  }

  public checkSyntax() {
    return this.data.checkSyntax();
  }

  public sendToGrid(): Promise<SendToGridResult> {
    const event = this.parent as GridEvent;
    return event.sendToGrid();
  }

  public async overwride(data: ActionData): Promise<UpdateActionResult> {
    this.script = data.script;
    this.short = data.short;
    this.name = data.name;
    return Promise.resolve({
      value: true,
      text: "OK",
      type: GridOperationType.UPDATE_ACTION,
    });
  }

  // Getters
  public get indentation() {
    let indentation = 0;
    const event = this.parent as GridEvent;
    for (let i = 0; i < event.config.length; ++i) {
      let action = event.config[i];

      if (action.id === this.id) {
        if (action.information.type === "composite_part") {
          return indentation - 1;
        } else {
          return indentation;
        }
      }

      if (action.information.type === "composite_open") {
        ++indentation;
      } else if (action.information.type === "composite_close") {
        --indentation;
      }
    }
  }

  public get information() {
    return this.getField("information");
  }

  public get script() {
    return this.getField("script");
  }

  public get short() {
    return this.getField("short");
  }

  public get name() {
    return this.getField("name");
  }

  // Setters
  private set script(value: string) {
    this.setField("script", value);
  }

  private set short(value: string) {
    this.setField("short", value);
  }

  private set name(value: string) {
    this.setField("name", value);
  }
}

export class EventData extends NodeData {
  public config: Array<GridAction>;
  public type: number;
  public stored: LuaScript;
  public loaded: boolean;

  constructor(type: number) {
    super();
    this.type = type;
    this.config = [];
    this.loaded = false;
    this.stored = undefined;
  }

  public hasChanges(): boolean {
    if (this.isStored()) {
      return false;
    }
    return this.stored !== this.toLua();
  }

  public toLua(): string {
    return `<?lua ${this.config
      .map((e) => e.toLua())
      .join("")
      .replace(/(\r\n|\n|\r)/gm, "")} ?>`;
  }

  public isStored() {
    if (!this.isLoaded()) {
      return true;
    }

    return this.stored === this.toLua();
  }

  public store() {
    this.stored = this.toLua();
  }

  public clear() {
    for (const action of this.config) {
      (action as any).parent = undefined;
    }

    this.config = [];
    //this.loaded = false;
    //this.stored = undefined;
  }

  public checkSyntax() {
    for (const action of this.config) {
      if (!action.checkSyntax()) {
        return false;
      }
    }
    return true;
  }

  public checkLength() {
    const script = this.toLua();
    return script.length < grid.getProperty("CONFIG_LENGTH");
  }

  public isLoaded() {
    return this.loaded;
  }
}

export class GridEvent extends RuntimeNode<EventData> {
  constructor(parent: GridElement, data?: EventData) {
    super(parent, data);
  }

  public replace(a: GridAction, b: GridAction): Promise<ReplaceActionsResult> {
    const index = this.config.findIndex((e) => e.id === a.id);
    try {
      this.remove(a);
      this.insert(index, b);
      return Promise.resolve({
        value: true,
        text: "OK",
        type: GridOperationType.REPLACE_ACTION,
      });
    } catch (e) {
      this.insert(index, a); //Fallback to original value
      return Promise.reject({
        value: false,
        text: `Replace failed! Reason: ${e}`,
        type: GridOperationType.REPLACE_ACTION,
      });
    }
  }

  public remove(...actions: GridAction[]): Promise<RemoveActionsResult> {
    for (const action of actions) {
      const index = this.config.findIndex((e) => e.id === action.id);
      if (index === -1) {
        return Promise.reject({
          value: false,
          text: `Remove failed! Action with id of ${action.id} is not found.`,
          type: GridOperationType.REMOVE_ACTION,
        });
      }
    }

    for (const action of actions) {
      (action as any).parent = undefined;
      const index = this.config.findIndex((e) => e.id === action.id);

      this.config = [
        ...this.config.slice(0, index),
        ...this.config.slice(index + 1),
      ];
    }

    return Promise.resolve({
      value: true,
      text: "OK",
      type: GridOperationType.REMOVE_ACTION,
    });
  }

  public insert(
    index: number,
    ...actions: GridAction[]
  ): Promise<InsertActionsResult> {
    if (index < 0 || index > this.config.length) {
      return Promise.reject({
        value: false,
        text: `Add failed! Invalid index: ${index}.`,
        type: GridOperationType.INSERT_ACTIONS,
      });
    }

    try {
      this.config = [
        ...this.config.slice(0, index),
        ...actions,
        ...this.config.slice(index),
      ];
      actions.forEach((e) => ((e as any).parent = this));
      return Promise.resolve({
        value: true,
        text: "OK",
        type: GridOperationType.INSERT_ACTIONS,
      });
    } catch (e) {
      return Promise.reject({
        value: false,
        text: `Insert failed! Reason: ${e}`,
        type: GridOperationType.INSERT_ACTIONS,
      });
    }
  }

  public async pasteFromClipboard(index?: number): Promise<PasteActionsResult> {
    const clipboard = get(appClipboard);

    if (typeof clipboard === "undefined") {
      return Promise.reject({
        value: false,
        text: `Nothing to paste, clipboard is empty`,
        type: GridOperationType.PASTE_ACTION,
      });
    }

    if (clipboard?.key !== ClipboardKey.ACTION_BLOCKS) {
      return Promise.reject({
        value: false,
        text: `Invalid clipboard type ${clipboard?.key}`,
        type: GridOperationType.PASTE_ACTION,
      });
    }

    if (!this.isLoaded()) {
      await this.load();
    }

    if (typeof index === "undefined") {
      index = this.config.length;
    }

    const actions = (get(appClipboard).payload as GridAction[]).map(
      (e: ActionData) => {
        const data = new ActionData(e.short, e.script, e.name);
        return new GridAction(undefined, data);
      }
    );

    try {
      this.insert(index, ...actions);
      return Promise.resolve({
        value: true,
        text: "OK",
        type: GridOperationType.PASTE_ACTION,
      });
    } catch (e) {
      Promise.reject({
        value: false,
        text: "Config limit reached",
        type: GridOperationType.PASTE_ACTION,
      });
    }
  }

  public push(...actions: GridAction[]): Promise<InsertActionsResult> {
    return this.insert(this.config.length, ...actions);
  }

  public actionAt(index: number) {
    return this.config.at(index);
  }

  public async sendToGrid(): Promise<SendToGridResult> {
    if (!this.checkLength()) {
      Promise.reject({
        value: false,
        text: "Length Error",
        type: GridOperationType.SEND_EVENT_TO_GRID,
      });
      return;
    }

    if (!this.isLoaded()) {
      Promise.resolve({
        value: true,
        text: "Nothing to sync, not loaded yet.",
        type: GridOperationType.SEND_EVENT_TO_GRID,
      });
    }

    const element = this.parent as GridElement;
    const page = element.parent as GridPage;
    const module = page.parent as GridModule;

    try {
      await instructions.sendConfigToGrid(
        module.dx,
        module.dy,
        page.pageNumber,
        element.elementIndex,
        this.type,
        this.toLua()
      );
      Promise.resolve({
        value: true,
        text: "OK",
        type: GridOperationType.SEND_EVENT_TO_GRID,
      });
    } catch (e) {
      Promise.reject({
        value: false,
        text: e,
        type: GridOperationType.SEND_EVENT_TO_GRID,
      });
    }
  }

  public checkSyntax() {
    return this.data.checkSyntax();
  }

  public checkLength() {
    return this.data.checkLength();
  }

  public isLoaded() {
    return this.data.isLoaded();
  }

  public toLua() {
    return this.data.toLua();
  }

  public hasChanges() {
    return this.data.hasChanges();
  }

  public isStored() {
    return this.data.isStored();
  }

  public store() {
    this.data.store();
  }

  public clear() {
    this.data.clear();
  }

  public async merge(
    ...actions: GridAction[]
  ): Promise<MergeActionsToCodeResult> {
    if (!actions.every((e) => this.config.includes(e))) {
      return Promise.reject({
        value: false,
        text: "Detached action!",
        type: GridOperationType.MERGE_ACTIONS_TO_CODE,
      });
    }

    //Sort to be merged actions by their index
    actions.sort(
      (a, b) =>
        this.config.findIndex((e) => e.id === a.id) -
        this.config.findIndex((e) => e.id === b.id)
    );

    const codeBlock = new GridAction(
      undefined,
      new ActionData(
        CodeBlock.information.short,
        actions.map((action) => action.script).join("\n")
      )
    );

    if (!codeBlock.checkSyntax()) {
      return Promise.reject({
        value: false,
        text: "Action(s) with syntax error(s) can not be merged!",
        type: GridOperationType.MERGE_ACTIONS_TO_CODE,
      });
    }

    const index = this.config.findIndex((e) => e.id === actions[0].id);
    this.insert(index, codeBlock);
    actions.forEach((e) => this.remove(e));

    return Promise.resolve({
      value: true,
      text: "OK",
      type: GridOperationType.MERGE_ACTIONS_TO_CODE,
    });
  }

  public async overwrite(data: EventData): Promise<OverwriteEventResult> {
    if (this.type !== data.type) {
      return Promise.reject({
        value: false,
        text: `Incompatible event types of ${data.type} and ${this.type}!`,
        type: GridOperationType.OVERWRITE_EVENT,
      });
    }

    try {
      await this.load();
    } catch (e) {
      return Promise.reject({
        value: false,
        text: "Error loading event!",
        type: GridOperationType.OVERWRITE_EVENT,
      });
    }

    this.clear();
    const copy = data.config.map(
      (e) =>
        new GridAction(undefined, new ActionData(e.short, e.script, e.name))
    );
    this.push(...copy);

    return Promise.resolve({
      value: false,
      text: "OK",
      type: GridOperationType.OVERWRITE_ELEMENT,
    });
  }

  public async load(): Promise<void> {
    if (this.isLoaded()) {
      return Promise.resolve();
    }

    const element = this.parent as GridElement;
    const page = element.parent as GridPage;
    const module = page.parent as GridModule;

    instructions
      .fetchConfigFromGrid(
        module.dx,
        module.dy,
        page.pageNumber,
        element.elementIndex,
        this.type
      )
      .then((descr) => {
        const script = descr.class_parameters.ACTIONSTRING;
        const actions = GridAction.parse(script);
        this.push(...actions);
        this.store();
        this.loaded = true;
        return Promise.resolve();
      })
      .catch((e) => {
        return Promise.reject(e);
      });
  }

  // Getters
  public get config() {
    return this.getField("config");
  }

  public get type() {
    return this.getField("type");
  }

  public get stored() {
    return this.getField("stored");
  }

  public get loaded() {
    return this.getField("loaded");
  }

  // Setters
  private set config(value: Array<GridAction>) {
    const temp = this.config;
    this.setField("config", value);
    if (!this.checkLength()) {
      value.forEach((e: GridAction) => {
        this.remove(e);
      });
      this.setField("config", temp);
      throw "Config limit reached! Event value was reset.";
    }
  }

  private set type(value: number) {
    this.setField("type", value);
  }

  private set stored(value: string) {
    this.setField("stored", value);
  }

  private set loaded(value: boolean) {
    this.setField("loaded", value);
  }
}

export class ElementData extends NodeData {
  public elementIndex: number;
  public events: Array<GridEvent>;
  public name: string | undefined;
  public type: ElementType;

  constructor(elementIndex: number, type: ElementType, name?: string) {
    super();
    this.elementIndex = elementIndex;
    this.type = type;
    this.name = name;
  }

  public hasChanges() {
    return this.events.some((e) => e.hasChanges());
  }

  public isCompatible(type: ElementType) {
    return grid.is_element_compatible_with(type, this.type);
  }
}

export class GridElement extends RuntimeNode<ElementData> {
  constructor(parent: GridPage, data?: ElementData) {
    super(parent, data);

    this.events = [];
    const elementEvents = grid.get_element_events(data.type);
    for (const event of elementEvents) {
      this.events.push(new GridEvent(this, new EventData(Number(event.value))));
    }
  }

  public async discardChanges(): Promise<DiscardElementResult> {
    const promises: Promise<SendToGridResult>[] = [];
    for (const event of this.events) {
      if (event.isStored()) continue;
      const stored = GridAction.parse(event.stored);
      event.clear();
      event.push(...stored);
      const promise = event.sendToGrid();
      promises.push(promise);
    }

    try {
      await Promise.all(promises);
      return Promise.resolve({
        value: true,
        text: "OK",
        type: GridOperationType.DISCARD_ELEMENT,
      });
    } catch (e) {
      return Promise.reject({
        value: false,
        text: e,
        type: GridOperationType.DISCARD_ELEMENT,
      });
    }
  }

  public async sendToGrid(): Promise<SendToGridResult[]> {
    const promises: Promise<SendToGridResult>[] = [];
    for (const event of this.events) {
      const promise = event.sendToGrid();
      promises.push(promise);
    }
    return Promise.all(promises);
  }

  public async overwrite(data: ElementData): Promise<OverwriteElementResult> {
    if (this.type !== data.type) {
      return Promise.reject({
        value: false,
        text: `Incompatible element types of ${data.type} and ${this.type}!`,
        type: GridOperationType.OVERWRITE_ELEMENT,
      });
    }

    try {
      await this.load();
    } catch (e) {
      return Promise.reject({
        value: false,
        text: "Error loading element!",
        type: GridOperationType.OVERWRITE_ELEMENT,
      });
    }

    for (const event of this.events) {
      const newEvent = data.events.find((e) => e.type === event.type);
      event.overwrite(newEvent);
    }

    return Promise.resolve({
      value: false,
      text: "OK",
      type: GridOperationType.OVERWRITE_ELEMENT,
    });
  }

  public hasChanges() {
    return this.data.hasChanges();
  }

  public isCompatible(type: ElementType) {
    return this.data.isCompatible(type);
  }

  public async loadPreset(preset: GridPresetData): Promise<PresetLoadResult> {
    try {
      await this.overwrite(preset.element.data);
      return Promise.resolve({
        value: true,
        text: "OK",
        type: GridOperationType.LOAD_PRESET,
      });
    } catch (e) {
      return Promise.reject({
        value: false,
        text: "e",
        type: GridOperationType.LOAD_PRESET,
      });
    }
  }

  findEvent(type: number) {
    const events = this.events;
    return events.find((event) => event.type === type);
  }

  public resetDefault(): Promise<ResetElementResult> {
    const temp = grid
      .get_element_events(this.type)
      .map((e) => Object({ type: e.value, default: e.defaultConfig }));
    for (const event of this.events) {
      const defaultScript = temp.find((e) => e.type === event.type).default;
      const defaultActions = GridAction.parse(defaultScript);
      event.clear();
      event.push(...defaultActions);
    }
    return Promise.resolve({
      value: true,
      text: "OK",
      type: GridOperationType.RESET_ELEMENT,
    });
  }

  public clear() {
    for (const event of this.events) {
      event.clear();
    }
  }

  public store() {
    for (const event of this.events) {
      event.store();
    }
  }

  public isLoaded() {
    return this.events.every((e) => e.isLoaded());
  }

  public async load() {
    const promises: Array<Promise<GridAction[]>> = [];
    for (const event of this.events) {
      promises.push(event.load());
    }
    Promise.all(promises);
  }

  // Getters
  get elementIndex() {
    return this.getField("elementIndex");
  }

  get events() {
    return this.getField("events");
  }

  get name() {
    return this.getField("name");
  }

  get type() {
    return this.getField("type");
  }

  // Setters
  private set elementIndex(value: number) {
    this.setField("elementIndex", value);
  }

  private set events(value: Array<GridEvent>) {
    this.setField("events", value);
  }

  set name(value: string) {
    this.setField("name", value);
  }

  set type(value: ElementType) {
    this.setField("type", value);
  }
}

export interface PageData extends NodeData {
  pageNumber: number;
  control_elements?: Array<GridElement>;
}

export class GridPage extends RuntimeNode<PageData> {
  constructor(parent: GridModule, type: ModuleType, data?: PageData) {
    super(parent, data);
    this.control_elements = [];
    const moduleElements = grid.get_module_element_list(type);
    for (const [index, element] of Object.entries(moduleElements)) {
      if (typeof element === "undefined") {
        continue;
      }

      this.control_elements.push(
        new GridElement(this, new ElementData(Number(index), element))
      );
    }
  }

  public async loadProfile(
    profile: GridProfileData
  ): Promise<ProfileLoadResult> {
    await this.load();

    const presets = profile.presets;
    // Reorder array to send system element first
    const index = presets.findIndex((obj) => obj.element.elementIndex === 255);

    // Check if the object with id === 255 was found
    if (index !== -1) {
      // Remove the object at the found index
      const objectToMove = presets.splice(index, 1)[0];

      // Add the object to the front of the array
      presets.unshift(objectToMove);
    }

    //PROFILE LOAD
    for (const preset of presets) {
      const element = this.findElement(preset.element.elementIndex);
      element.loadPreset(preset);
    }
    return Promise.resolve({
      value: true,
      text: "OK",
      type: GridOperationType.LOAD_PROFILE,
    });
  }

  findElement(index: number) {
    const elements = this.control_elements;
    return elements.find((element) => element.elementIndex === index);
  }

  public clear() {
    for (const element of this.control_elements) {
      element.clear();
    }
  }

  public store() {
    for (const element of this.control_elements) {
      element.store();
    }
  }

  public async load() {
    const promises: Array<Promise<void>> = [];
    for (const element of this.control_elements) {
      promises.push(
        new Promise((resolve) => {
          element.load().then(() => resolve());
        })
      );
    }
    Promise.all(promises);
  }

  // Getters
  get pageNumber() {
    return this.getField("pageNumber");
  }

  get control_elements() {
    return this.getField("control_elements");
  }

  // Setters
  private set pageNumber(value: number) {
    this.setField("pageNumber", value);
  }

  private set control_elements(value: Array<GridElement>) {
    this.setField("control_elements", value);
  }
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

export interface ModuleData extends NodeData {
  architecture: Architecture;
  dx: number;
  dy: number;
  fwMismatch: boolean;
  fwVersion: FirmwareVersion;
  map: DirectionMap;
  portstate: any;
  rot: number;
  type: ModuleType;
  pages?: Array<GridPage>;
}

export class GridModule extends RuntimeNode<ModuleData> {
  constructor(parent: GridRuntime, data?: ModuleData) {
    super(parent, data);
    this.pages = [
      new GridPage(this, this.type, { pageNumber: 0 }),
      new GridPage(this, this.type, { pageNumber: 1 }),
      new GridPage(this, this.type, { pageNumber: 2 }),
      new GridPage(this, this.type, { pageNumber: 3 }),
    ];
  }

  findPage(index: number) {
    const pages = this.pages;
    return pages.find((page) => page.pageNumber === index);
  }

  async load() {
    const promises: Array<Promise<void>> = [];
    for (const page of this.pages) {
      promises.push(
        new Promise((resolve) => {
          page.load().then(() => resolve());
        })
      );
    }
    Promise.all(promises);
  }

  // Getters
  get architecture() {
    return this.getField("architecture");
  }

  get dx() {
    return this.getField("dx");
  }

  get dy() {
    return this.getField("dy");
  }

  get fwMismatch() {
    return this.getField("fwMismatch");
  }

  get fwVersion() {
    return this.getField("fwVersion");
  }

  get map() {
    return this.getField("map");
  }

  get portstate() {
    return this.getField("portstate");
  }

  get rot() {
    return this.getField("rot");
  }

  get type() {
    return this.getField("type");
  }

  get pages() {
    return this.getField("pages");
  }

  // Setters
  set architecture(value: Architecture) {
    this.setField("architecture", value);
  }

  set dx(value: number) {
    this.setField("dx", value);
  }

  set dy(value: number) {
    this.setField("dy", value);
  }

  set fwMismatch(value: boolean) {
    this.setField("fwMismatch", value);
  }

  set fwVersion(value: FirmwareVersion) {
    this.setField("fwVersion", value);
  }

  set map(value: DirectionMap) {
    this.setField("map", value);
  }

  set portstate(value: any) {
    this.setField("portstate", value);
  }

  set rot(value: number) {
    this.setField("rot", value);
  }

  set type(value: ModuleType) {
    this.setField("type", value);
  }

  set pages(value: Array<GridPage>) {
    this.setField("pages", value);
  }
}

export interface RuntimeData extends NodeData {
  modules: Array<GridModule>;
}

export class GridRuntime extends RuntimeNode<RuntimeData> {
  constructor() {
    super(undefined, { modules: [] });
  }

  get modules() {
    return this.getField("modules");
  }

  // Setters
  set modules(value: Array<GridModule>) {
    this.setField("modules", value);
  }

  findEvent(
    dx: number,
    dy: number,
    page: number,
    element: number,
    event: number
  ) {
    return this.findModule(dx, dy)
      ?.findPage(page)
      ?.findElement(element)
      ?.findEvent(event);
  }

  findElement(dx: number, dy: number, page: number, element: number) {
    return this.findModule(dx, dy)?.findPage(page)?.findElement(element);
  }

  findPage(dx: number, dy: number, page: number) {
    return this.findModule(dx, dy)?.findPage(page);
  }

  findModule(dx: number, dy: number) {
    const modules = this.modules;
    return modules.find((module) => module.dx === dx && module.dy === dy);
  }

  isFirmwareMismatch(currentFirmware, requiredFirmware) {
    // Extract major, minor, and patch versions from current and required firmware
    const {
      major: currentMajor,
      minor: currentMinor,
      patch: currentPatch,
    } = currentFirmware;
    const {
      major: requiredMajor,
      minor: requiredMinor,
      patch: requiredPatch,
    } = requiredFirmware;

    // Compare major versions
    if (currentMajor < requiredMajor) {
      return true; // Firmware mismatch if current major version is lower
    } else if (currentMajor > requiredMajor) {
      return false; // No firmware mismatch if current major version is higher
    }

    // Compare minor versions
    if (currentMinor < requiredMinor) {
      return true; // Firmware mismatch if current minor version is lower
    } else if (currentMinor > requiredMinor) {
      return false; // No firmware mismatch if current minor version is higher
    }

    // Compare patch versions
    if (currentPatch < requiredPatch) {
      return true; // Firmware mismatch if current patch version is lower
    } else {
      return false; // No firmware mismatch if current patch version is equal or higher
    }
  }

  incoming_heartbeat_handler(descr) {
    try {
      for (const module of this.modules) {
        if (module.architecture === "virtual") {
          this.destroy_module(module.dx, module.dy);
        }
      }

      const [sx, sy] = [descr.brc_parameters.SX, descr.brc_parameters.SY];

      let firstConnection = false;
      const module = this.findModule(sx, sy);
      if (module) {
        if (module.rot != descr.brc_parameters.ROT) {
          module.rot = descr.brc_parameters.ROT;
        }

        if (module.portstate != descr.class_parameters.PORTSTATE) {
          module.portstate = descr.class_parameters.PORTSTATE;
        }

        aliveModules.update((s) => {
          const index = s.findIndex((e) => e.id === module.id);
          const lastDate = s[index].last;
          const newDate = Date.now();
          s[index].last = newDate;

          if (get(appSettings).persistent.heartbeatDebugEnabled) {
            const key1 = `Hearbeat (${module.dx}, ${module.dy})`;
            add_datapoint(key1, newDate - lastDate);
          }
          return s;
        });
      }
      // device not found, add it to runtime and get page count from grid
      else {
        const controller = this.create_module(
          descr.brc_parameters,
          descr.class_parameters,
          false
        );
        // check if the firmware version of the newly connected device is acceptable
        console.log("Incoming Device");
        console.log("Architecture", controller.architecture);

        const as = get(appSettings);
        const firmware_required =
          controller.architecture === "esp32"
            ? as.firmware_esp32_required
            : as.firmware_d51_required;
        controller.fwMismatch = this.isFirmwareMismatch(
          controller.fwVersion,
          firmware_required
        );

        console.log(
          "Mismatch: ",
          controller.fwMismatch,
          "Firmware Version: ",
          controller.fwVersion
        );

        this.modules = [...this.modules, controller];
        aliveModules.update((s) => {
          s.push({ id: controller.id, last: Date.now() });
          return s;
        });

        firstConnection = this.modules.length === 1;

        Analytics.track({
          event: "Connect Module",
          payload: {
            action: "Connect",
            controller: controller,
            moduleCount: this.modules.length,
          },
          mandatory: false,
        });
      }

      if (firstConnection) {
        this.setDefaultSelectedElement();
      }
    } catch (error) {
      console.warn(error);
    }
  }

  setDefaultSelectedElement() {
    user_input.set({
      dx: this.modules[0].dx,
      dy: this.modules[0].dy,
      pagenumber: 0,
      elementnumber: 0,
      eventtype: 2,
    });
  }

  public async change_page(new_page_number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (get(writeBuffer).length > 0) {
        reject("Wait before all operations are finished.");
        return;
      }

      if (this.unsavedChangesCount() != 0) {
        reject("Store your changes before changin pages!");
        return;
      }

      let ui = get(user_input);

      // only update pagenumber if it differs from the runtime pagenumber
      if (ui.pagenumber === new_page_number) {
        resolve();
        return;
      }
      // clean up the writebuffer if pagenumber changes!
      // writeBuffer.clear();

      instructions
        .changeActivePage(new_page_number)
        .then(() => {
          const ui = get(user_input);
          user_input.set({
            dx: ui.dx,
            dy: ui.dy,
            pagenumber: new_page_number,
            elementnumber: ui.elementnumber,
            eventtype: ui.eventtype,
          });
          resolve();
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  public unsavedChangesCount() {
    let count = 0;
    this.modules.forEach((e) => {
      e.pages.forEach((e) => {
        e.control_elements.forEach((e) => {
          e.events.forEach((e) => {
            if (e.hasChanges()) {
              count += 1;
            }
          });
        });
      });
    });
    return count;
  }

  public async storePage(index: number) {
    return new Promise((resolve, reject) => {
      instructions
        .sendPageStoreToGrid()
        .then((res) => {
          for (const module of this.modules) {
            const page = module.findPage(index);
            page.store();
          }
          resolve(res);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  public async clearPage(index: number): Promise<void> {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "pageclear",
      message: `Clearing configurations from page...`,
    });
    return new Promise((resolve, reject) => {
      instructions
        .sendPageClearToGrid()
        .then(() => {
          for (const module of this.modules) {
            const page = module.findPage(index);
            page.clear();
          }
          resolve();
        })
        .catch((e) => {
          console.warn(e);
          reject(e);
        });
    });
  }

  public async discardPage(index: number): Promise<void> {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "pagediscard",
      message: `Discarding configurations...`,
    });
    return new Promise((resolve, reject) => {
      instructions
        .sendPageDiscardToGrid()
        .then(() => {
          for (const module of this.modules) {
            const page = module.findPage(index);
            page.clear();
          }
          resolve();
        })
        .catch((e) => {
          console.warn(e);
          reject(e);
        });
    });
  }

  addVirtualModule({ dx, dy, type }) {
    const moduleInfo = grid.module_hwcfgs().findLast((e) => e.type === type);
    const controller = this.create_module(
      {
        DX: dx,
        DY: dy,
        SX: dx,
        SY: dy,
      },
      {
        HWCFG: moduleInfo.hwcfg,
      },
      true
    );

    createVirtualModule(dx, dy, moduleInfo.type);

    this.modules = [...this.modules, controller];
    this.setDefaultSelectedElement();
  }

  create_module(header_param, heartbeat_class_param, virtual = false) {
    const moduleType = grid
      .module_type_from_hwcfg(Number(heartbeat_class_param.HWCFG))
      ?.substring(0, 4);

    // generic check, code below if works only if all parameters are provided
    if (
      header_param === undefined ||
      moduleType === undefined ||
      heartbeat_class_param === undefined
    ) {
      console.log(
        heartbeat_class_param.HWCFG,
        "ERROR",
        header_param,
        moduleType,
        heartbeat_class_param
      );
      throw "Error creating new module.";
    }

    return new GridModule(this, {
      // implement the module id rep / req
      architecture: virtual
        ? Architecture.VIRTUAL
        : grid.module_architecture_from_hwcfg(heartbeat_class_param.HWCFG),
      portstate: heartbeat_class_param.PORTSTATE,
      dx: header_param.SX,
      dy: header_param.SY,
      rot: header_param.ROT,
      fwVersion: {
        major: heartbeat_class_param.VMAJOR,
        minor: heartbeat_class_param.VMINOR,
        patch: heartbeat_class_param.VPATCH,
      },
      type: ModuleType[moduleType as keyof typeof ModuleType],
      fwMismatch: false,
      alive: Date.now(),
      map: {
        top: { dx: header_param.SX, dy: header_param.SY + 1 },
        right: { dx: header_param.SX + 1, dy: header_param.SY },
        bot: { dx: header_param.SX, dy: header_param.SY - 1 },
        left: { dx: header_param.SX - 1, dy: header_param.SY },
      },
    });
  }

  destroy_module(dx, dy) {
    console.log("DESTORY", dx, dy);
    // remove the destroyed device from runtime
    const removed = this.modules.find((e) => e.dx == dx && e.dy == dy);
    this.modules = this.modules.filter((e) => e.dx !== dx && e.dy !== dy);

    aliveModules.update((s) => {
      const index = s.findIndex((e) => e.id === removed.id);
      s.splice(index, 1);
      return s;
    });

    if (this.modules.length === 0) {
      appSettings.update((s) => {
        s.gridLayoutShift = { x: 0, y: 0 };
        return s;
      });
    }

    user_input.module_destroy_handler(dx, dy);
    if (removed.architecture === "virtual") {
      virtual_runtime.destroyModule(dx, dy);
    } else {
      writeBuffer.module_destroy_handler(dx, dy);
    }

    // reset rendering helper stores

    try {
      elementPositionStore.update((eps) => {
        eps[dx][dy] = undefined;
        return eps;
      });

      ledColorStore.update((lcs) => {
        lcs[dx][dy] = undefined;
        return lcs;
      });
    } catch (error) {}

    Analytics.track({
      event: "Disconnect Module",
      payload: {
        action: "Disconnect",
        moduleCount: this.modules.length,
      },
      mandatory: false,
    });
  }
}
