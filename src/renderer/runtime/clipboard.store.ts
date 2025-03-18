import {
  writable,
  type Readable,
  type Writable,
  Subscriber,
  Unsubscriber,
  Updater,
} from "svelte/store";
import { ActionData, ElementData, GridAction, GridElement } from "./runtime";
import { logger } from "./runtime.store";

export enum ClipboardKey {
  ELEMENT,
  ACTION_BLOCKS,
}

export interface ClipboardData {
  key: ClipboardKey;
  payload: ActionData[] | ElementData;
}

export enum ClipboardOperationType {
  COPY_ACTIONS,
  COPY_ELEMENT,
}

export interface ClipboardOperationResult {
  value: boolean;
  text: string;
  type: ClipboardOperationType;
}

export interface CopyActionsResult extends ClipboardOperationResult {}
export interface CopyElementResult extends ClipboardOperationResult {}

export class ApplicationClipboard implements Readable<ClipboardData> {
  protected _internal: Writable<ClipboardData> = writable();
  constructor(value?: ClipboardData) {
    this.set(value);
  }

  public subscribe(
    run: Subscriber<ClipboardData>,
    invalidate?: (value?: ClipboardData) => void
  ): Unsubscriber {
    return this._internal.subscribe(run, invalidate);
  }

  private set(value: ClipboardData) {
    this._internal.set(value);
  }

  private update(updater: Updater<ClipboardData>) {
    this._internal.update(updater);
  }

  public async copyElement(element: GridElement): Promise<CopyElementResult> {
    try {
      if (!element.isLoaded()) {
        await element.load();
      }
    } catch (e) {
      return Promise.reject({
        value: false,
        text: "Clipboard: Error during loading element!",
        type: ClipboardOperationType.COPY_ELEMENT,
      });
    }

    this.set({
      key: ClipboardKey.ELEMENT,
      payload: element.data,
    });

    return Promise.resolve({
      value: true,
      text: "OK",
      type: ClipboardOperationType.COPY_ELEMENT,
    });
  }

  public async copyActions(
    ...actions: GridAction[]
  ): Promise<CopyActionsResult> {
    appClipboard.set({
      key: ClipboardKey.ACTION_BLOCKS,
      payload: actions.map((e) => e.data),
    });

    return Promise.resolve({
      value: true,
      text: "OK",
      type: ClipboardOperationType.COPY_ACTIONS,
    });
  }
}

export const appClipboard = new ApplicationClipboard();
