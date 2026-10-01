import {
  get,
  type Unsubscriber,
  type Updater,
  writable,
  type Writable,
} from "svelte/store";
import { Modal, modalManager } from "../main/modals/modal.store";
import { appSettings } from "./app-helper.store";
import { runtime_manager } from "./runtime-manager.store";
import { Grid } from "../lib/_utils";
import { selected_actions } from "./selected-actions.store";
import { GridElement, GridEvent, GridModule, GridPage } from "./runtime";

export type UserInputValue = {
  dx: number;
  dy: number;
  pagenumber: number;
  elementnumber: number;
  eventtype: number;
};

export class UserInput implements Writable<UserInputValue> {
  static readonly defaultValue: UserInputValue = {
    dx: 0,
    dy: 0,
    pagenumber: 0,
    elementnumber: 0,
    eventtype: 2,
  };

  private _internal: Writable<UserInputValue>;
  private _changed_timestamp = 0;
  private _pendingValue: UserInputValue | null = null;
  private _rafPending = false;

  constructor() {
    this._internal = writable(UserInput.defaultValue);
  }

  public async displayEvent(value: GridEvent) {
    const element = value.parent as GridElement;
    const page = element.parent as GridPage;
    const module = page.parent as GridModule;
    this.set({
      dx: module.dx,
      dy: module.dy,
      pagenumber: page.pageNumber,
      elementnumber: element.elementIndex,
      eventtype: value.type,
    });

    // Wait for next re-render
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
  }

  // Subscribe to the entire object
  public subscribe(
    run: Subscriber<UserInputValue>,
    invalidate?: (value?: UserInputValue) => void,
  ): Unsubscriber {
    const runtime = get(runtime_manager).active.runtime;
    const value = get(this._internal);

    const element = runtime.findElement(
      value.dx,
      value.dy,
      value.pagenumber,
      value.elementnumber,
    );

    if (typeof element !== "undefined") {
      const event = element.findEvent(value.eventtype);

      if (typeof event === "undefined") {
        const closestEvent = Grid.getClosestEvent(
          element.events.map((e) => e.type),
          value.eventtype,
        );
        this.set({
          dx: value.dx,
          dy: value.dy,
          pagenumber: value.pagenumber,
          elementnumber: value.elementnumber,
          eventtype: closestEvent,
        });
      }
    } else {
      this.set(UserInput.defaultValue);
    }

    return this._internal.subscribe(run, invalidate);
  }

  // Set the entire object
  public set(value: UserInputValue) {
    this._internal.set(value);
    selected_actions.set([]);
  }

  // Update the object with a partial update function
  public update(updater: Updater<UserInputValue>) {
    this._internal.update(updater);
    selected_actions.set([]);
  }

  private _flushPending() {
    this._rafPending = false;
    if (this._pendingValue !== null) {
      this._internal.set(this._pendingValue);
      this._pendingValue = null;
      selected_actions.set([]);
    }
  }

  private _stageSet(value: UserInputValue) {
    this._pendingValue = value;
    if (!this._rafPending) {
      this._rafPending = true;
      requestAnimationFrame(() => this._flushPending());
    }
  }

  // Process incoming events
  public process_incoming_event_from_grid(descr: any) {
    if (get(modalManager).windows.some((e) => e.target === Modal.Snap.Full)) {
      return;
    }

    if (
      descr.class_parameters.EVENTTYPE === 0 ||
      descr.class_parameters.EVENTTYPE === 4 ||
      descr.class_parameters.EVENTTYPE === 5 ||
      descr.class_parameters.EVENTTYPE === 6
    ) {
      return;
    }

    if (descr.class_parameters.ELEMENTNUMBER === 255) {
      return;
    }

    const ui = get(this._internal);

    let elementDifferent =
      ui.elementnumber !== descr.class_parameters.ELEMENTNUMBER;
    let eventDifferent = ui.eventtype !== descr.class_parameters.EVENTTYPE;
    let sxDifferent = ui.dx !== descr.brc_parameters.SX;
    let syDifferent = ui.dy !== descr.brc_parameters.SY;

    if (eventDifferent || elementDifferent || sxDifferent || syDifferent) {
      if (Date.now() < this._changed_timestamp + 100) {
        return;
      }

      let eventtype;
      switch (get(appSettings).persistent.changeOnEvent) {
        case "element": {
          const runtime = get(runtime_manager).active.runtime;
          const incomingEventTypes = runtime
            .findElement(
              descr.brc_parameters.SX,
              descr.brc_parameters.SY,
              ui.pagenumber,
              descr.class_parameters.ELEMENTNUMBER,
            )
            .events.map((e) => e.type);

          const current = ui.eventtype;
          eventtype = Grid.getClosestEvent(incomingEventTypes, current);
          if (!elementDifferent) {
            return;
          }
          break;
        }
        case "none": {
          return;
        }
        case "event":
        default: {
          eventtype = descr.class_parameters.EVENTTYPE;
        }
      }
      this._stageSet({
        dx: descr.brc_parameters.SX,
        dy: descr.brc_parameters.SY,
        pagenumber: ui.pagenumber,
        elementnumber: descr.class_parameters.ELEMENTNUMBER,
        eventtype: eventtype,
      });
    }

    this._changed_timestamp = Date.now();
  }

  // Module destroy handler
  public module_destroy_handler(dx: number, dy: number) {
    const ui = get(this._internal);

    if (dx === ui.dx && dy === ui.dy) {
      const active = get(runtime_manager).active.runtime;
      if (active.modules.length > 0) {
        this.set({
          dx: active.modules[0].dx,
          dy: active.modules[0].dy,
          pagenumber: ui.pagenumber,
          elementnumber: 0,
          eventtype: ui.eventtype,
        });
      } else {
        this.set(UserInput.defaultValue);
      }
    }
  }
}

export const user_input = new UserInput();
