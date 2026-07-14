import {
  grid,
  Architecture,
  ElementType,
  ModuleType,
  GridScript,
  NumberToEventType,
} from "@intechstudio/grid-protocol";
import {
  writable,
  get,
  type Writable,
  type Subscriber,
  type Unsubscriber,
  type Updater,
} from "svelte/store";
import { GridInstruction } from "../serialport/instructions";
import { Analytics } from "./analytics.js";
import { appSettings } from "./app-helper.store";
import { add_datapoint } from "../serialport/message-stream.store.js";
import { logger } from "./runtime.store";
import { v4 as uuidv4 } from "uuid";
import { getComponentInformation } from "../lib/_config-registry";
import { appClipboard, ClipboardKey } from "./clipboard.store";
import { type ActionBlockInformation } from "../config-blocks/ActionBlockInformation";
import { Runtime } from "./string-table";
import { Grid } from "../lib/_utils";
import { type GridConnection } from "../serialport/serialport";
import { GridRuntimeManager } from "./runtime-manager.store";
import { user_input } from "./user-input.store";
import { type ProfileCloudTypes } from "../main/panels/profileCloud/ProfileCloud";
import { type LuaValue } from "../serialport/evaluate-parser";
import {
  writeFileContent,
  invalidateLuaModule,
  createDir,
  pageNumberToFolderPath,
} from "../main/panels/FileManager/FileManager";

class NodeData {
  id?: Grid.UUID;
  parent?: RuntimeNode<unknown>;
}

export namespace ProfileCloudLoad {
  export enum State {
    READY = "ready",
    BUSY = "busy",
    LOADED = "loaded",
    ERROR = "error",
  }

  export interface Status {
    step: State;
    phase?: "files" | "config";
    message?: string;
    error?: string;
    total?: number;
    completed?: number;
    fileChunkCurrent?: number;
    fileChunkTotal?: number;
  }
}

export enum GridNodeState {
  NOT_LOADED,
  FETCHING,
  SYNCED,
  UNSYNCED,
}

export enum ConfigurationType {
  PROFILE = "profile",
  PRESET = "preset",
  SNIPPET = "snippet",
}

export class GridProfileData {
  public presets: GridPresetData[] = [];
  public files: { name: string; content: string }[] | undefined = undefined;
  public description: string;
  public id: string;
  public readonly type = ConfigurationType.PROFILE;

  static createFromCloudData(cloudProfile: ProfileCloudTypes.ProfileData) {
    const data = cloudProfile.configs;
    const profile = new GridProfileData();

    for (const [index, type] of Object.entries(
      grid.get_module_element_list(cloudProfile.type),
    )) {
      if (typeof type === "undefined") {
        continue;
      }
      const events = data.find(
        (e: any) => e.controlElementNumber === Number(index),
      ).events;
      const preset = new GridPresetData(type, Number(index), events);
      profile.presets.push(preset);
    }

    if (cloudProfile.files?.length > 0) {
      profile.files = cloudProfile.files;
    }

    profile.description = cloudProfile.description;
    profile.id = cloudProfile.id;
    return profile;
  }
}

export class GridPresetData {
  public element: GridElement;
  public description: string;
  public id: string;
  public readonly type = ConfigurationType.PRESET;

  constructor(
    type: ElementType,
    index: number,
    array: ProfileCloudTypes.EventData[],
  ) {
    const element = new GridElement(undefined, new ElementData(index, type));
    for (const data of array) {
      const type = Number(data.event);
      const event = element.findEvent(type);
      if (typeof event === "undefined") {
        // Event not found. Possible malformed profile but more likely depricated event (MIDIRX on system)
        continue;
      }
      const actions = GridAction.parse(data.config);
      event.push(...actions);
    }
    this.element = element;
  }

  public isCompatible(type: ElementType) {
    return grid.is_element_compatible_with(this.element.type, type);
  }

  static createFromCloudData(cloudPreset: ProfileCloudTypes.PresetData) {
    const preset = new GridPresetData(
      cloudPreset.type,
      -1,
      cloudPreset.configs.events,
    );
    preset.description = cloudPreset.description;
    preset.id = cloudPreset.id;
    return preset;
  }
}

export class GridSnippetData {
  public actions: GridAction[];
  public description: string;
  public id: string;
  public readonly type = ConfigurationType.SNIPPET;

  constructor(array: ProfileCloudTypes.EventData) {
    this.actions = GridAction.parse(array);
  }

  static createFromCloudData(cloudPreset: ProfileCloudTypes.SnippetData) {
    const snippet = new GridSnippetData(cloudPreset.configs);
    snippet.description = cloudPreset.description;
    snippet.id = cloudPreset.id;
    return snippet;
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
  LOAD_SNIPPET,
  OVERWRITE_EVENT,
  INSERT_ACTIONS,
  REPLACE_ACTION,
}

export interface GridOperationResult {
  value: boolean;
  text: string;
  type: GridOperationType;
}

export interface PasteActionsResult extends GridOperationResult {
  info: EventInfo;
  pasted: GridAction[];
}
export interface DiscardElementResult extends GridOperationResult {}
export interface OverwriteElementResult extends GridOperationResult {}
export interface UpdateActionResult extends GridOperationResult {
  info: EventInfo;
}
export interface MergeActionsToCodeResult extends GridOperationResult {
  info: EventInfo;
  merged: GridAction;
}
export interface RemoveActionsResult extends GridOperationResult {
  removed: Array<{ index: number; action: GridAction }>;
}
export interface CutActionsResult extends GridOperationResult {}
export interface ResetElementResult extends GridOperationResult {}
export interface SendToGridResult extends GridOperationResult {}
export interface PresetLoadResult extends GridOperationResult {}
export interface ProfileLoadResult extends GridOperationResult {}
export interface SnippetLoadResult extends GridOperationResult {}
export interface OverwriteEventResult extends GridOperationResult {}
export interface InsertActionsResult extends GridOperationResult {
  info: EventInfo;
}
export interface ReplaceActionsResult extends GridOperationResult {
  info: EventInfo;
}

abstract class RuntimeNode<T extends NodeData> implements Writable<T> {
  protected _internal: Writable<T>;
  private static _batchActive = false;

  public static batch<R>(fn: () => R): R {
    RuntimeNode._batchActive = true;
    try {
      return fn();
    } finally {
      RuntimeNode._batchActive = false;
    }
  }

  public subscribe(
    run: Subscriber<T>,
    invalidate?: (value?: T) => void,
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

  constructor(parent: RuntimeNode<unknown>, value?: T) {
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

  public get parent(): RuntimeNode<unknown> {
    return this.getField("parent");
  }

  protected set parent(value: RuntimeNode<unknown>) {
    this.setField("parent", value);
  }

  public get id() {
    return this.getField("id");
  }

  protected set id(value: Grid.UUID) {
    this.setField("id", value);
  }

  protected notify() {
    this._internal.update((s) => s);
  }

  protected notifyParent() {
    if (RuntimeNode._batchActive) return;
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
  public synced: string;
  public invalid: boolean;
  public toggled: boolean;
  public element: HTMLElement;

  constructor(short: string, script: string, name?: string) {
    super();
    this.short = short;
    this.script = script;
    this.name = name;
    this.synced = script;
    this.invalid = false;
    this.toggled = false;
    this.element = null;
  }

  public toLua() {
    return `--[[@${this.short}${
      typeof this.name !== "undefined" ? `#${this.name}` : ""
    }]] ${this.script}`;
  }

  public isValid() {
    const code =
      this.information.syntaxPreprocessor?.generate(this.script) ?? this.script;
    return GridScript.checkSyntax(code) && !this.invalid;
  }

  public getTourIndex(): number | undefined {
    const part = this.name?.split(".")[0];
    const index = Number(part);
    return Number.isFinite(index) ? index : undefined;
  }

  public isTourStep() {
    return this.getTourIndex() !== undefined;
  }

  public get information() {
    let result = GridAction.getInformation(this.short);
    return result;
  }

  public get indentation() {
    const event = this.parent as GridEvent;
    if (typeof event === "undefined") {
      return 0;
    }

    let indentation = 0;
    for (let i = 0; i < event.config.length; ++i) {
      let action = event.config[i];
      if (action.id === this.id) {
        if (
          ["composite_part", "composite_close"].includes(
            action.information.type,
          )
        ) {
          indentation -= 1;
          break;
        } else {
          break;
        }
      }

      if (action.information.type === "composite_open") {
        ++indentation;
      } else if (action.information.type === "composite_close") {
        --indentation;
      }
    }
    return Math.max(indentation, 0);
  }
}

export class GridAction extends RuntimeNode<ActionData> {
  constructor(parent: GridEvent, data?: ActionData) {
    super(parent, data);
  }

  static parse(script: Grid.LuaScript) {
    const result: GridAction[] = [];

    let actionString = script.replace(/\s{2,10}/g, " ");

    // Strip legacy <?lua ... ?> framing from old cloud data
    const framingMatch = actionString.match(/^<\?lua\s(.*)\s\?>$/s);
    if (framingMatch) {
      actionString = framingMatch[1];
    }

    const matches = [
      ...actionString.matchAll(/--\[\[@(.*?)\]\]\s*(.*?)(?=(--\[\[@|$))/gs),
    ];

    for (const [, meta, code] of matches) {
      const split = meta.split(/#(.*)/);
      const data = new ActionData(
        split[0], // Short name, e.g. 'gms'
        code.trim(), // Action code body
        split.length > 1 ? split[1] : undefined, // Optional long name
      );
      const obj = new GridAction(undefined, data);
      result.push(obj);
    }

    return result;
  }

  public isTourStep() {
    return this.data.isTourStep();
  }

  public getTourIndex() {
    return this.data.getTourIndex();
  }

  static getInformation(short: string): ActionBlockInformation {
    const result = getComponentInformation(short);
    return result.information as ActionBlockInformation;
  }

  public toLua() {
    return this.data.toLua();
  }

  public isValid() {
    return this.data.isValid();
  }

  public sendToGrid(): Promise<SendToGridResult> {
    const event = this.parent as GridEvent;
    return event.sendToGrid();
  }

  public async updateData(data: ActionData): Promise<UpdateActionResult> {
    const parent = this.parent as GridEvent;
    const diff = data.toLua().length - this.data.toLua().length;

    if (!Grid.isBracketClosed(data.script)) {
      return Promise.reject({
        value: false,
        text: Runtime.ErrorText.UNCLOSED_PARENTHESIS,
        type: GridOperationType.UPDATE_ACTION,
        info: (this.parent as GridEvent)?.getInfo(),
      });
    }

    if (parent.getAvailableChars() - diff < 0) {
      this.notify(); //TODO: Refactor this out
      this.notifyParent(); //TODO: Refactor this out
      return Promise.reject({
        value: false,
        text: Runtime.ErrorText.LENGTH_ERROR,
        type: GridOperationType.UPDATE_ACTION,
        info: (this.parent as GridEvent)?.getInfo(),
      });
    }

    this.script = data.script;
    this.short = data.short;
    this.name = data.name;
    this.invalid = data.invalid;

    if (!this.isValid()) {
      return Promise.reject({
        value: false,
        text: Runtime.ErrorText.SYNTAX_ERROR,
        type: GridOperationType.UPDATE_ACTION,
        info: (this.parent as GridEvent)?.getInfo(),
      });
    } else {
      this.synced = data.script;
    }

    return Promise.resolve({
      value: true,
      text: "OK",
      type: GridOperationType.UPDATE_ACTION,
      info: (this.parent as GridEvent)?.getInfo(),
    });
  }

  // Getters
  public get invalid() {
    return this.data.invalid;
  }

  public get synced() {
    return this.data.synced;
  }

  public get indentation() {
    return this.data.indentation;
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

  public get toggled() {
    return this.getField("toggled");
  }

  public get element() {
    return this.getField("element");
  }

  // Setters
  public set element(value: HTMLElement) {
    this.setField("element", value);
  }

  public set toggled(value: boolean) {
    this.setField("toggled", value);
  }

  public set invalid(value: boolean) {
    this.setField("invalid", value);
  }

  public set synced(value: string) {
    this.setField("synced", value);
  }

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

export type EventInfo = {
  event: { name: string; value: number };
  element: { type: string; index: number };
  page: number;
  module: { type: string; dx: number; dy: number };
};

export class EventData extends NodeData {
  public config: Array<GridAction>;
  public type: number;
  public stored: Grid.LuaScript;
  public state: GridNodeState;

  constructor(type: number) {
    super();
    this.type = type;
    this.config = [];
    this.stored = "";
    this.state = GridNodeState.NOT_LOADED;
  }

  public hasChanges(): boolean {
    /*
    if (!this.isLoaded()) {
      return false;
    }*/

    return this.stored !== this.toLua();
  }

  public getName(): string {
    return Grid.toFirstCase(NumberToEventType(this.type));
  }

  public toLua(): string {
    return `${this.config.map((e) => e.toLua()).join("")}`;
  }

  public getAvailableChars(): number {
    return Grid.Protocol.maxScriptLength - this.toLua().length - 1;
  }

  public isStored() {
    if (!this.isLoaded()) {
      return true;
    }
    return this.stored === this.toLua();
  }

  public isValid() {
    for (const action of this.config) {
      if (!action.isValid()) {
        return false;
      }
    }
    return true;
  }

  public isLoaded() {
    return (
      [GridNodeState.NOT_LOADED, GridNodeState.FETCHING].includes(
        this.state,
      ) === false
    );
  }

  public getInfo(): EventInfo {
    const element = this.parent as GridElement;
    const page = element?.parent as GridPage;
    const module = page?.parent as GridModule;
    return {
      event: { name: NumberToEventType(this.type), value: this.type },
      element: { type: element?.type, index: element?.elementIndex },
      page: page?.pageNumber,
      module: { type: module?.type, dx: module?.dx, dy: module?.dy },
    };
  }

  public getTourTargets() {
    return this.config.filter((e) => e.isTourStep());
  }
}

export class GridEvent extends RuntimeNode<EventData> {
  constructor(parent: GridElement, data?: EventData) {
    super(parent, data);
  }

  public async loadSnippet(
    snippet: GridSnippetData,
    index: number,
  ): Promise<SnippetLoadResult> {
    try {
      await this.insert(index, ...snippet.actions);
      await this.sendToGrid();
      return Promise.resolve({
        value: true,
        text: "OK",
        type: GridOperationType.LOAD_SNIPPET,
      });
    } catch (e) {
      return Promise.reject({
        value: false,
        text: e.text,
        type: GridOperationType.LOAD_SNIPPET,
      });
    }
  }

  public getTourTargets() {
    return get(this._internal).getTourTargets();
  }

  public getInfo() {
    return this.data.getInfo();
  }

  public getName() {
    return this.data.getName();
  }

  public async replace(
    a: GridAction,
    b: GridAction,
  ): Promise<ReplaceActionsResult> {
    const index = this.config.findIndex((e) => e.id === a.id);
    try {
      this.remove(a);
      await this.insert(index, b);
      return Promise.resolve({
        value: true,
        text: "OK",
        type: GridOperationType.REPLACE_ACTION,
        info: this.getInfo(),
      });
    } catch (e) {
      await this.insert(index, a); //Fallback to original value
      return Promise.reject({
        value: false,
        text: Runtime.ErrorText.LENGTH_ERROR,
        type: GridOperationType.REPLACE_ACTION,
        info: this.getInfo(),
      });
    }
  }

  public swap(a: GridAction, b: GridAction) {
    const indexA = this.config.findIndex((e) => e.id === a.id);
    const indexB = this.config.findIndex((e) => e.id === b.id);

    if (indexA === -1 || indexB === -1) {
      console.error("One or both items not found in config");
      return;
    }

    const newConfig = [...this.config];
    newConfig[indexA] = b;
    newConfig[indexB] = a;

    this.config = newConfig;
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

    const removed: Array<{ index: number; action: GridAction }> = [];
    for (const action of actions) {
      const index = this.config.findIndex((e) => e.id === action.id);
      removed.push({ index: index, action: action });
      this.config = [
        ...this.config.slice(0, index),
        ...this.config.slice(index + 1),
      ];
    }

    return Promise.resolve({
      value: true,
      text: "OK",
      type: GridOperationType.REMOVE_ACTION,
      removed: removed,
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
        info: this.getInfo(),
      });
    }

    const script = actions.map((e) => e.toLua()).join("");
    const lengthAfter = this.getAvailableChars() - script.length;
    if (lengthAfter >= 0) {
      // Create a new array reference to trigger Svelte reactivity
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
        info: this.getInfo(),
      });
    } else {
      return Promise.reject({
        value: false,
        text: Runtime.ErrorText.LENGTH_ERROR,
        type: GridOperationType.INSERT_ACTIONS,
        info: this.getInfo(),
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
        info: this.getInfo(),
      });
    }

    if (clipboard?.key !== ClipboardKey.ACTION_BLOCKS) {
      return Promise.reject({
        value: false,
        text: `Invalid clipboard type ${clipboard?.key}`,
        type: GridOperationType.PASTE_ACTION,
        info: this.getInfo(),
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
      },
    );

    try {
      await this.insert(index, ...actions);
      return Promise.resolve({
        value: true,
        text: "OK",
        type: GridOperationType.PASTE_ACTION,
        info: this.getInfo(),
        pasted: actions,
      });
    } catch (e) {
      return Promise.reject({
        value: false,
        text: Runtime.ErrorText.LENGTH_ERROR,
        type: GridOperationType.PASTE_ACTION,
        info: this.getInfo(),
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
    if (!this.isLoaded()) {
      return Promise.resolve({
        value: true,
        text: "Nothing to sync, not loaded yet.",
        type: GridOperationType.SEND_EVENT_TO_GRID,
      });
    }

    if (!this.isValid()) {
      return Promise.resolve({
        value: true,
        text: "Nothing to sync, event has invalid actions.",
        type: GridOperationType.SEND_EVENT_TO_GRID,
      });
    }

    const element = this.parent as GridElement;
    const page = element.parent as GridPage;
    const module = page.parent as GridModule;
    const runtime = module.parent as GridRuntime;

    try {
      const script = GridScript.compressScript(this.toLua());
      const simulate = module.architecture === Architecture.VIRTUAL;
      const instruction = new GridInstruction.SendConfig(
        module.dx,
        module.dy,
        page.pageNumber,
        element.elementIndex,
        this.type,
        script,
        simulate,
      );
      await instruction.executeOn(runtime.connection);
      return Promise.resolve({
        value: true,
        text: "OK",
        type: GridOperationType.SEND_EVENT_TO_GRID,
      });
    } catch (e) {
      const text =
        e?.text || e?.message || (typeof e === "string" ? e : undefined);
      return Promise.reject({
        value: false,
        text,
        type: GridOperationType.SEND_EVENT_TO_GRID,
      });
    }
  }

  public isValid() {
    return this.data.isValid();
  }

  public isLoaded() {
    return this.data.isLoaded();
  }

  public toLua() {
    return this.data.toLua();
  }

  public getAvailableChars() {
    return this.data.getAvailableChars();
  }

  public hasChanges() {
    return this.data.hasChanges();
  }

  public isStored() {
    return this.data.isStored();
  }

  public store() {
    this.stored = this.toLua();
  }

  public clear() {
    for (const action of this.config) {
      this.remove(action);
    }
  }

  public unload() {
    this.clear();
    this.state = GridNodeState.NOT_LOADED;
    this.stored = "";
  }

  public async merge(
    ...actions: GridAction[]
  ): Promise<MergeActionsToCodeResult> {
    if (!actions.every((e) => this.config.includes(e))) {
      return Promise.reject({
        value: false,
        text: "Detached action!",
        type: GridOperationType.MERGE_ACTIONS_TO_CODE,
        info: this.getInfo(),
      });
    }

    //Sort to be merged actions by their index
    actions.sort(
      (a, b) =>
        this.config.findIndex((e) => e.id === a.id) -
        this.config.findIndex((e) => e.id === b.id),
    );

    const codeBlock = new GridAction(
      undefined,
      new ActionData("cb", actions.map((action) => action.script).join(" ")),
    );

    if (!codeBlock.isValid()) {
      return Promise.reject({
        value: false,
        text: Runtime.ErrorText.SYNTAX_ERROR,
        type: GridOperationType.MERGE_ACTIONS_TO_CODE,
        info: this.getInfo(),
      });
    }

    const index = this.config.findIndex((e) => e.id === actions[0].id);
    this.remove(...actions).then(async (res) => {
      try {
        await this.insert(index, codeBlock);
      } catch (e) {
        for (const obj of res.removed.sort((e) => e.index)) {
          const parent = obj.action.parent as GridEvent;
          parent.insert(obj.index, obj.action);
        }
        return Promise.reject({
          value: false,
          text: Runtime.ErrorText.LENGTH_ERROR,
          type: GridOperationType.MERGE_ACTIONS_TO_CODE,
          info: this.getInfo(),
        });
      }
    });

    return Promise.resolve({
      value: true,
      text: "OK",
      type: GridOperationType.MERGE_ACTIONS_TO_CODE,
      info: this.getInfo(),
      merged: codeBlock,
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

    const copy = data.config.map(
      (e) =>
        new GridAction(undefined, new ActionData(e.short, e.script, e.name)),
    );

    RuntimeNode.batch(() => {
      copy.forEach((a) => ((a as any).parent = this));
      this.update((data) => {
        data.config = copy;
        data.state = GridNodeState.SYNCED;
        return data;
      });
    });
    this.notify();

    return Promise.resolve({
      value: false,
      text: "OK",
      type: GridOperationType.OVERWRITE_ELEMENT,
    });
  }

  public async load(): Promise<void> {
    if (this.isLoaded() || this.state === GridNodeState.FETCHING) {
      return Promise.resolve();
    }

    this.state = GridNodeState.FETCHING;
    const element = this.parent as GridElement;
    const page = element.parent as GridPage;
    const module = page.parent as GridModule;
    const runtime = module.parent as GridRuntime;

    try {
      const simulate = module.architecture === Architecture.VIRTUAL;
      const instruction = new GridInstruction.FetchConfig(
        module.dx,
        module.dy,
        page.pageNumber,
        element.elementIndex,
        this.type,
        simulate,
      );

      const descr = await instruction.executeOn(runtime.connection);

      const script = descr.class_parameters.ACTIONSTRING;
      this.push(...GridAction.parse(script));

      this.store();
      this.state = GridNodeState.SYNCED;
      return Promise.resolve();
    } catch (e) {
      this.unload();
      return Promise.reject(e);
    }
  }

  // Getters
  public get state() {
    return this.getField("state");
  }

  public get config() {
    return this.getField("config");
  }

  public get type() {
    return this.getField("type");
  }

  public get stored() {
    return this.getField("stored");
  }

  // Setters
  private set state(value: GridNodeState) {
    this.setField("state", value);
  }

  private set config(value: Array<GridAction>) {
    this.setField("config", value);
  }

  private set type(value: number) {
    this.setField("type", value);
  }

  private set stored(value: string) {
    this.setField("stored", value);
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

  public getTourTargets() {
    return this.events.flatMap((e) => e.getTourTargets());
  }

  public isValid() {
    for (const event of this.events) {
      if (!event.isValid()) {
        return false;
      }
    }
    return true;
  }

  public hasChanges() {
    return this.events.some((e) => e.hasChanges());
  }

  public isCompatible(type: ElementType) {
    return grid.is_element_compatible_with(type, this.type);
  }
}

export type ElementInfo = {
  dx: number;
  dy: number;
  page: number;
  element: number;
  type: ElementType;
};

export class GridElement extends RuntimeNode<ElementData> {
  constructor(parent: GridPage, data?: ElementData) {
    super(parent, data);

    this.events = [];
    const elementEvents = grid.get_element_events(data.type);
    for (const event of elementEvents) {
      this.events.push(new GridEvent(this, new EventData(Number(event.value))));
    }
  }

  public getTourTargets() {
    return get(this._internal).getTourTargets();
  }

  public resetName() {
    const page = this.parent as GridPage;
    const module = page.parent as GridModule;

    this.name = undefined;
    if (this.elementIndex === 255) {
      return; // do not request name for system element
    }
    module.execConfigImmediate(`ele[${this.elementIndex}]:gen()`);
  }

  public isPresetLoaded(preset: GridPresetData) {
    for (const event of preset.element.events) {
      const found = this.events.find((e) => e.type === event.type);
      if (!found) {
        return false;
      }

      const left = found.toLua();
      const right = event.toLua();

      if (left !== right) {
        return false;
      }
    }
    return true;
  }

  public getHumanName() {
    const page = this.parent as GridPage;
    return `Element ${
      this.elementIndex < 255
        ? this.elementIndex
        : page.control_elements.length - 1
    } (${this.type[0].toUpperCase() + this.type.slice(1).toLowerCase()})`;
  }

  public getInfo(): ElementInfo {
    const page = this.parent as GridPage;
    const module = page.parent as GridModule;
    return {
      dx: module.dx,
      dy: module.dy,
      page: page.pageNumber,
      element: this.elementIndex,
      type: this.type,
    };
  }

  public async discardChanges(): Promise<DiscardElementResult> {
    try {
      for (const event of this.events) {
        if (!event.hasChanges()) continue;
        const stored = GridAction.parse(event.stored);
        event.clear();
        event.push(...stored);
        await event.sendToGrid();
      }
      this.resetName();
    } catch (e) {
      return Promise.reject({
        value: false,
        text: e.text,
        type: GridOperationType.DISCARD_ELEMENT,
      });
    }

    return Promise.resolve({
      value: true,
      text: "OK",
      type: GridOperationType.DISCARD_ELEMENT,
    });
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
    if (!this.isCompatible(data.type)) {
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
      if (typeof newEvent === "undefined") {
        continue;
      }
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

  public async loadPreset(
    preset: GridPresetData,
    setStatus?: (status: ProfileCloudLoad.Status) => void,
  ): Promise<PresetLoadResult> {
    let completed = 0;
    const total = this.events.length;
    setStatus?.({ step: ProfileCloudLoad.State.BUSY, total, completed });

    try {
      await this.overwrite(preset.element.data);
      for (const event of this.events) {
        await event.sendToGrid();
        ++completed;
        setStatus?.({ step: ProfileCloudLoad.State.BUSY, total, completed });
      }

      setStatus?.({
        step: ProfileCloudLoad.State.LOADED,
        total,
        completed: total,
      });
      return Promise.resolve({
        value: true,
        text: "OK",
        type: GridOperationType.LOAD_PRESET,
      });
    } catch (e) {
      setStatus?.({ step: ProfileCloudLoad.State.ERROR });
      return Promise.reject({
        value: false,
        text: e.text,
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
    this.resetName();
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

  public unload() {
    for (const event of this.events) {
      event.unload();
    }
    this.resetName();
  }

  public isValid() {
    return this.data.isValid();
  }

  public async load(): Promise<void> {
    try {
      for (const event of this.events) {
        await event.load();
      }

      const setup = this.findEvent(0);
      const action = setup.actionAt(0);
      if (action?.short === "sn") {
        const regex = /self:gen\("([^"]*)"\)/;
        const name = action.script.match(regex)[1];
        this.name = name;
      }

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
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

export class PageData extends NodeData {
  pageNumber: number;
  control_elements: Array<GridElement> = [];

  constructor(index: number) {
    super();
    this.pageNumber = index;
  }

  public getTourTargets() {
    return this.control_elements.flatMap((e) => e.getTourTargets());
  }

  public isValid() {
    for (const element of this.control_elements) {
      if (!element.isValid()) {
        return false;
      }
    }
    return true;
  }
}

export type PageInfo = {
  dx: number;
  dy: number;
  page: number;
};

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
        new GridElement(this, new ElementData(Number(index), element)),
      );
    }
  }

  public getTourTargets() {
    return get(this._internal).getTourTargets();
  }

  public isProfileLoaded(profile: GridProfileData) {
    for (const preset of profile.presets) {
      const found = this.control_elements.find(
        (e) => e.elementIndex === preset.element.elementIndex,
      );
      if (!found) {
        return false;
      }

      if (!found.isPresetLoaded(preset)) {
        return false;
      }
    }
    return true;
  }

  public isValid() {
    return this.data.isValid();
  }

  public getInfo(): PageInfo {
    const module = this.parent as GridModule;
    return {
      dx: module.dx,
      dy: module.dy,
      page: this.pageNumber,
    };
  }

  public async sendProfile(
    profile: GridProfileData,
    setStatus?: (status: ProfileCloudLoad.Status) => void,
  ): Promise<ProfileLoadResult> {
    try {
      const total = profile.presets.reduce((acc, preset) => {
        return acc + preset.element.events.length;
      }, 0);

      setStatus?.({
        step: ProfileCloudLoad.State.BUSY,
        phase: "config",
        total,
        completed: 0,
      });
      await this.load();

      const presets = profile.presets;

      // Reorder array to send system element first
      const index = presets.findIndex(
        (obj) => obj.element.elementIndex === 255,
      );

      if (index !== -1) {
        const objectToMove = presets.splice(index, 1)[0];
        presets.unshift(objectToMove);
      }

      let completed = 0;
      const module = this.parent as GridModule;
      const isVirtual = module?.architecture === Architecture.VIRTUAL;

      for (const preset of presets) {
        const element = this.findElement(preset.element.elementIndex);
        await element.overwrite(preset.element.data);

        for (const event of element.events) {
          await event.sendToGrid();
          if (isVirtual) {
            await new Promise((r) => setTimeout(r, 0));
          }
          ++completed;
          setStatus?.({
            step: ProfileCloudLoad.State.BUSY,
            phase: "config",
            total,
            completed,
          });
        }
      }

      setStatus?.({
        step: ProfileCloudLoad.State.LOADED,
        phase: "config",
        total,
        completed: total,
      });
      return {
        value: true,
        text: "OK",
        type: GridOperationType.LOAD_PROFILE,
      };
    } catch (error) {
      setStatus?.({ step: ProfileCloudLoad.State.ERROR, phase: "config" });
      return Promise.reject({
        value: false,
        text: error instanceof Error ? error.message : String(error),
        type: GridOperationType.LOAD_PROFILE,
      });
    }
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

  public unload() {
    for (const element of this.control_elements) {
      element.unload();
    }
  }

  public isLoaded() {
    return this.control_elements.every((e) => e.isLoaded());
  }

  public async load() {
    const promises: Array<Promise<void>> = [];
    for (const element of this.control_elements) {
      promises.push(element.load());
    }
    return Promise.all(promises);
  }

  public resetToDefaults() {
    RuntimeNode.batch(() => {
      for (const element of this.control_elements) {
        const defaultEvents = grid.get_element_events(element.type);
        for (const event of element.events) {
          const defaultEvent = defaultEvents.find(
            (e) => Number(e.value) === event.type,
          );
          if (!defaultEvent) continue;

          const script = defaultEvent.defaultConfig.startsWith("<?lua ")
            ? defaultEvent.defaultConfig.slice(
                6,
                defaultEvent.defaultConfig.lastIndexOf(" ?>"),
              )
            : defaultEvent.defaultConfig;

          const actions = GridAction.parse(script);
          actions.forEach((a) => ((a as any).parent = event));
          const lua = actions.map((a) => a.toLua()).join("");

          event.update((data) => {
            data.config = actions;
            data.stored = lua;
            data.state = GridNodeState.SYNCED;
            return data;
          });
        }
      }
    });
    this.notify();
  }

  public async sendFiles(
    files: { name: string; content: string }[],
    setStatus?: (status: ProfileCloudLoad.Status) => void,
  ): Promise<void> {
    if (!files?.length) return;
    const module = this.parent as GridModule;
    const folderPath = pageNumberToFolderPath(this.pageNumber);
    const dir = folderPath.slice(0, -1);
    await createDir(dir, module).catch((err) => {
      console.log("Directory?", err);
    });
    const total = files.length;
    let completed = 0;
    setStatus?.({
      step: ProfileCloudLoad.State.BUSY,
      phase: "files",
      total,
      completed,
      message: "Uploading files...",
    });
    for (const file of files) {
      const path = `${folderPath}${file.name}`;
      try {
        await writeFileContent(
          path,
          file.content,
          module,
          200,
          (chunkCurrent, chunkTotal) => {
            setStatus?.({
              step: ProfileCloudLoad.State.BUSY,
              phase: "files",
              total,
              completed,
              fileChunkCurrent: chunkCurrent,
              fileChunkTotal: chunkTotal,
              message: `Uploading files...`,
            });
          },
        );
        ++completed;
        setStatus?.({
          step: ProfileCloudLoad.State.BUSY,
          phase: "files",
          total,
          completed,
          fileChunkCurrent: undefined,
          fileChunkTotal: undefined,
          message: `Uploading files... (${completed}/${total})`,
        });
      } catch (e) {
        logger.set({
          type: "fail",
          mode: 0,
          classname: "operationerror",
          message: `File upload failed for ${file.name}: ${
            e instanceof Error ? e.message : String(e)
          }`,
        });
        throw e;
      }
    }
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

export class ModuleData extends NodeData {
  public pages: Array<GridPage>;

  constructor(
    public architecture: Architecture,
    public portstate: any,
    public dx: number,
    public dy: number,
    public rot: number,
    public fwVersion: FirmwareVersion,
    public type: ModuleType,
    public fwMismatch: boolean,
    public map: DirectionMap,
    public revision: string,
    public hwcfg: number,
    public memorystat: number,
  ) {
    super();
    this.pages = [];
  }

  public getTourTargets() {
    return this.pages.flatMap((e) => e.getTourTargets());
  }

  public isValid() {
    for (const page of this.pages) {
      if (!page.isValid()) {
        return false;
      }
    }
    return true;
  }
}

export type ModuleInfo = {
  dx: number;
  dy: number;
  type: ModuleType;
};

export class GridModule extends RuntimeNode<ModuleData> {
  constructor(parent: GridRuntime, data?: ModuleData) {
    super(parent, data);
    this.pages = [
      new GridPage(this, this.type, new PageData(0)),
      new GridPage(this, this.type, new PageData(1)),
      new GridPage(this, this.type, new PageData(2)),
      new GridPage(this, this.type, new PageData(3)),
    ];
  }

  public getTourTargets() {
    return get(this._internal).getTourTargets();
  }

  public isValid() {
    return this.data.isValid();
  }

  public getInfo(): ModuleInfo {
    return {
      dx: this.dx,
      dy: this.dy,
      type: this.type,
    };
  }

  public requestEventReport() {
    const runtime = this.parent as GridRuntime;
    const instruction = new GridInstruction.FetchEventpreview(
      this.dx,
      this.dy,
      runtime.virtual,
    );

    instruction.executeOn(runtime.connection).catch((e) => {
      console.warn(e);
    });
  }

  public requestLedReport() {
    const runtime = this.parent as GridRuntime;
    const instruction = new GridInstruction.FetchLedpreview(
      this.dx,
      this.dy,
      runtime.virtual,
    );

    instruction.executeOn(runtime.connection).catch((e) => {
      console.warn(e);
    });
  }

  public requestNameReport() {
    const runtime = this.parent as GridRuntime;
    const instruction = new GridInstruction.FetchNamepreview(
      this.dx,
      this.dy,
      runtime.virtual,
    );

    instruction.executeOn(runtime.connection).catch((e) => {
      console.warn(e);
    });
  }

  public execConfigImmediate(script: string) {
    const runtime = this.parent as GridRuntime;
    const instruction = new GridInstruction.SendConfigImmediate(
      this.dx,
      this.dy,
      GridScript.compressScript(script),
      runtime.virtual,
    );

    instruction.executeOn(runtime.connection).catch((e) => {
      console.warn(e);
    });
  }

  public execLUAImmediateAndEvalaute(
    code: string,
    compress = true,
  ): Promise<LuaValue[]> {
    const runtime = this.parent as GridRuntime;
    const instruction = new GridInstruction.SendLuaImmediateAndEvaluate(
      this.dx,
      this.dy,
      code,
      compress,
      runtime.virtual,
    );
    return instruction.executeOn(runtime.connection);
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
        }),
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

  get memorystat() {
    return this.getField("memorystat");
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

  get revision() {
    return this.getField("revision");
  }

  get hwcfg() {
    return this.getField("hwcfg");
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

  set memorystat(value: any) {
    this.setField("memorystat", value);
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

export class RuntimeData extends NodeData {
  public modules: Array<GridModule>;
  public rotation: Grid.Rotation;
  public layoutOffset: { x: number; y: number };

  constructor() {
    super();
    this.modules = [];
    this.rotation = Grid.Rotation.R0;
    this.layoutOffset = { x: 0, y: 0 };
  }

  public isValid() {
    for (const module of this.modules) {
      if (!module.isValid()) {
        return false;
      }
    }
    return true;
  }

  public countX() {
    const xs = this.modules.map((m) => m.dx);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    return maxX - minX + 1;
  }

  public countY() {
    const ys = this.modules.map((m) => m.dy);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return maxY - minY + 1;
  }
}

export class GridRuntime extends RuntimeNode<RuntimeData> {
  public connection: GridConnection;
  public readonly virtual: boolean;
  private aliveModules: Writable<Array<{ id: Grid.UUID; last: number }>>;
  public elementPositionStore: Writable<any> = writable({});
  public ledColorStore: Writable<any> = writable({});
  private _pendingHeartbeats = new Map<
    string,
    { rot: number; portstate: any; memorystat: any }
  >();
  private _heartbeatRafPending = false;

  constructor(
    connection: GridConnection = undefined,
    virtual: boolean = false,
  ) {
    super(undefined, new RuntimeData());
    this.connection = connection;
    this.virtual = virtual;
    this.aliveModules = writable([]);
  }

  private _flushHeartbeats() {
    this._heartbeatRafPending = false;
    for (const [id, updates] of this._pendingHeartbeats) {
      const module = this.modules.find((m) => m.id === id);
      if (!module) continue;
      if (module.rot !== updates.rot) module.rot = updates.rot;
      if (module.portstate !== updates.portstate)
        module.portstate = updates.portstate;
      if (module.memorystat !== updates.memorystat)
        module.memorystat = updates.memorystat;
    }
    this._pendingHeartbeats.clear();
  }

  private _stageHeartbeat(
    module: GridModule,
    rot: number,
    portstate: any,
    memorystat: any,
  ) {
    this._pendingHeartbeats.set(module.id, { rot, portstate, memorystat });
    if (!this._heartbeatRafPending) {
      this._heartbeatRafPending = true;
      requestAnimationFrame(() => this._flushHeartbeats());
    }
  }

  public countX() {
    return this.data.countX();
  }

  public countY() {
    return this.data.countY();
  }

  public isValid() {
    return this.data.isValid();
  }

  // Getters
  get modules() {
    return this.getField("modules");
  }

  get rotation() {
    return this.getField("rotation");
  }

  get layoutOffset() {
    return this.getField("layoutOffset");
  }

  // Setters
  set modules(value: Array<GridModule>) {
    this.setField("modules", value);
  }

  set rotation(value: Grid.Rotation) {
    this.setField("rotation", value);
  }

  set layoutOffset(value: { x: number; y: number }) {
    this.setField("layoutOffset", value);
  }

  findEvent(
    dx: number,
    dy: number,
    page: number,
    element: number,
    event: number,
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
      const [sx, sy] = [descr.brc_parameters.SX, descr.brc_parameters.SY];

      const module = this.findModule(sx, sy);
      if (module) {
        this.aliveModules.update((store) => {
          const obj = store.find((e) => e.id === module.id);
          const lastDate = obj.last;
          const newDate = Date.now();
          obj.last = newDate;

          if (get(appSettings).persistent.heartbeatDebugEnabled) {
            const key1 = `Hearbeat (${module.dx}, ${module.dy})`;
            add_datapoint(key1, newDate - lastDate);
          }
          return store;
        });

        this._stageHeartbeat(
          module,
          descr.brc_parameters.ROT,
          descr.class_parameters.PORTSTATE,
          descr.class_parameters.GCCOUNT,
        );
      }
      // device not found, add it to runtime and get page count from grid
      else {
        const controller = RuntimeNode.batch(() =>
          this.create_module(
            descr.brc_parameters,
            descr.class_parameters,
            false,
          ),
        );
        // check if the firmware version of the newly connected device is acceptable
        console.log(
          "Incoming Device:",
          `${controller.dx} ${controller.dy} ${controller.type} (${controller.architecture})`,
        );

        const as = get(appSettings);
        const firmware_required =
          controller.architecture === "esp32"
            ? as.firmware_esp32_required
            : as.firmware_d51_required;
        controller.fwMismatch = this.isFirmwareMismatch(
          controller.fwVersion,
          firmware_required,
        );

        console.log(
          "Mismatch: ",
          controller.fwMismatch,
          "Firmware Version: ",
          controller.fwVersion,
        );

        this.modules = [...this.modules, controller];
        this.aliveModules.update((s) => {
          s.push({ id: controller.id, last: Date.now() });
          return s;
        });

        controller.requestLedReport();
        controller.requestNameReport();
        controller.requestEventReport();

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
    } catch (error) {
      console.warn(error);
    }
  }

  public async change_page(new_page_number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.unsavedChangesCount() != 0) {
        reject(Runtime.ErrorText.PAGE_CHANGE_DISABLED);
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

      const instruction = new GridInstruction.ChangePage(
        new_page_number,
        this.virtual,
      );
      instruction
        .executeOn(this.connection)
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
      const instruction = new GridInstruction.StorePage(this.virtual);
      instruction
        .executeOn(this.connection)
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
    return new Promise((resolve, reject) => {
      const instruction = new GridInstruction.ClearPage(this.virtual);
      instruction
        .executeOn(this.connection)
        .then(() => {
          for (const module of this.modules) {
            const page = module.findPage(index);
            page.resetToDefaults();
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
      const instruction = new GridInstruction.DiscardPage(this.virtual);
      instruction
        .executeOn(this.connection)
        .then(() => {
          for (const module of this.modules) {
            const page = module.findPage(index);
            page.unload();
            const ui = get(user_input);
            const event = this.findEvent(
              ui.dx,
              ui.dy,
              ui.pagenumber,
              ui.elementnumber,
              ui.eventtype,
            );
            event.load().then(() => resolve());
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
    const moduleInfo = grid
      .module_hwcfgs()
      .reverse()
      .find((e) => e.type === type);
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
      true,
    );

    this.connection.buffer.simulator.createModule(dx, dy, moduleInfo.type);

    this.modules = [...this.modules, controller];
  }

  create_module(header_param, heartbeat_class_param, virtual = false) {
    const hwcfg = Number(heartbeat_class_param.HWCFG);
    const moduleType = grid.module_type_from_hwcfg(hwcfg);
    const hwcfgEntry = grid
      .module_hwcfgs()
      .find((e) => Number(e.hwcfg) === hwcfg);

    if (
      header_param === undefined ||
      moduleType === undefined ||
      heartbeat_class_param === undefined ||
      hwcfgEntry === undefined
    ) {
      console.warn(
        hwcfg,
        "ERROR",
        header_param,
        moduleType,
        heartbeat_class_param,
      );
      throw "Error creating new module.";
    }

    const revision: string = hwcfgEntry.revision;

    return new GridModule(
      this,
      new ModuleData(
        // implement the module id rep / req
        virtual
          ? Architecture.VIRTUAL
          : grid.module_architecture_from_hwcfg(hwcfg),
        heartbeat_class_param.PORTSTATE,
        header_param.SX,
        header_param.SY,
        header_param.ROT,
        {
          major: heartbeat_class_param.VMAJOR,
          minor: heartbeat_class_param.VMINOR,
          patch: heartbeat_class_param.VPATCH,
        },
        ModuleType[moduleType as keyof typeof ModuleType],
        false,
        {
          top: { dx: header_param.SX, dy: header_param.SY + 1 },
          right: { dx: header_param.SX + 1, dy: header_param.SY },
          bot: { dx: header_param.SX, dy: header_param.SY - 1 },
          left: { dx: header_param.SX - 1, dy: header_param.SY },
        },
        revision,
        hwcfg,
      ),
    );
  }

  public isAlive(device: GridModule) {
    const last =
      get(this.aliveModules).find((e) => e.id === device.id)?.last ??
      Date.now();

    // Allow less strict elapsedTimeLimit while writeBuffer is busy!
    const elapsedTimeLimit =
      get(this.connection.buffer).array.length > 0
        ? GridRuntimeManager.heartbeat_grid_ms * 6
        : GridRuntimeManager.heartbeat_grid_ms * 3;
    const elapsedTime = Date.now() - last;

    return last && elapsedTime <= elapsedTimeLimit;
  }

  destroy_module(dx, dy) {
    user_input.module_destroy_handler(dx, dy);
    // remove the destroyed device from runtime
    const removed = this.findModule(dx, dy);
    this.modules = this.modules.filter((e) => e.id !== removed.id);

    this.aliveModules.update((s) => {
      const index = s.findIndex((e) => e.id === removed.id);
      s.splice(index, 1);
      return s;
    });

    if (this.modules.length === 0) {
      this.layoutOffset = { x: 0, y: 0 };
    }

    if (removed.architecture === Architecture.VIRTUAL) {
      this.connection.buffer.simulator.destroyModule(dx, dy);
    } else {
      this.connection.buffer.module_destroy_handler(dx, dy);
    }

    // reset rendering helper stores

    try {
      this.elementPositionStore.update((eps) => {
        eps[dx][dy] = undefined;
        return eps;
      });

      this.ledColorStore.update((lcs) => {
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
