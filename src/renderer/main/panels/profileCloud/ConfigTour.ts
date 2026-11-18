import {
  writable,
  type Readable,
  type Updater,
  type Unsubscriber,
  type Writable,
  get,
} from "svelte/store";
import TourModal from "./TourModal.svelte";
import { Modal } from "../../modals/modal.store";
import {
  GridAction,
  GridEvent,
  GridModule,
  GridProfileData,
} from "../../../runtime/runtime";
import { user_input } from "../../../runtime/user-input.store";
import { Grid } from "../../../lib/_utils";
import { tick } from "svelte";

export namespace ConfigTour {
  export namespace Target {
    export enum Type {
      ACTION_BLOCK = "action-block",
      STATIC_ELEMENT = "static-element",
    }

    export enum StaticElementIdentifier {
      STORE = "store-button",
    }

    export interface AbstractTarget {
      type: Type;
      position?: Grid.Position;
    }

    export interface StaticElementTarget extends AbstractTarget {
      element: HTMLElement;
    }

    export interface ActionBlockTarget extends AbstractTarget {
      action: GridAction;
    }
  }

  class Step {
    private window: Modal.Window<any, any> | null = null;

    constructor(
      public index: number,
      public markdown: string,
      public target: Target.AbstractTarget,
    ) {}

    public async displayStep() {
      let node: HTMLElement | null = null;

      switch (this.target.type) {
        case Target.Type.ACTION_BLOCK: {
          const target = this.target as Target.ActionBlockTarget;
          const event = target.action.parent as GridEvent;
          await user_input.displayEvent(event);
          await tick();
          node = target.action.element;
          break;
        }
        case Target.Type.STATIC_ELEMENT: {
          const target = this.target as Target.StaticElementTarget;
          node = target.element;
          break;
        }
      }

      if (!node) {
        console.warn("Step display failed: target node not found.");
        return;
      }

      // Non-blocking, anchored modal (no backdrop); closed via the tour
      this.window = new Modal.Window(TourModal as any, Modal.Snap.Full, {
        disableEscapeClose: true,
        disableClickOutside: true,
      });
      this.window.show({
        markdown: this.markdown,
        anchor: node,
        position: this.target.position,
      });
    }

    public destroyStep() {
      this.window?.close();
      this.window = null;
    }
  }

  export class Tour {
    constructor(
      public steps: Step[],
      public index: number,
    ) {}

    public get current(): Step | undefined {
      return this.steps[this.index];
    }

    public get active(): boolean {
      return this.index >= 0 && typeof this.current !== "undefined";
    }

    public next() {
      const { steps, index } = this;
      return steps[index + 1];
    }

    public previous() {
      const { steps, index } = this;
      return steps[index - 1];
    }
  }

  export class Manager implements Readable<Tour> {
    static readonly defaultValue = new Tour([], -1);

    private internal: Writable<Tour> = writable(Manager.defaultValue);

    public subscribe(
      run: Subscriber<Tour>,
      invalidate?: (value?: Tour) => void,
    ): Unsubscriber {
      return this.internal.subscribe(run, invalidate);
    }

    public set(value: Tour) {
      this.internal.set(value);
    }

    private update(updater: Updater<Tour>) {
      this.internal.update(updater);
    }

    public clear() {
      const { steps } = get(this.internal);
      this.set(Manager.defaultValue);
      // Destroy every step so no popover can be left orphaned
      for (const step of steps) {
        try {
          step.destroyStep();
        } catch (e) {
          console.warn("Failed to destroy tour step:", e);
        }
      }
    }

    public registerStaticTarget(
      node: HTMLElement,
      id: Target.StaticElementIdentifier,
      options: { position?: Grid.Position } = undefined,
    ) {
      const position = options?.position ?? Grid.Position.LEFT;
      node.setAttribute("data-tour-static-target-id", String(id));
      node.setAttribute("data-tour-static-target-position", String(position));
      return;
    }

    public async createTourFromProfile(
      profile: GridProfileData,
      module: GridModule,
    ): Promise<void> {
      // Remove any popover from a previous tour before replacing it
      this.clear();

      // Tour tags: `<!-- tour step=N [static="id"] [text[[inline text]]] -->`
      // and `<!-- tour end -->`. A step's text is whatever sits between its
      // tag and the next tour tag (or the end of the description). The
      // optional inline `text[[...]]` is used only when that body is empty.
      const tagRegex =
        /<!--\s*tour\s+(?:step=(\d+)(?:\s+static="([^"]*)")?(?:\s+text\[\[([\s\S]*?)\]\])?\s*-->|end\s*-{0,2}>)/g;

      const description = profile.description ?? "";
      const tags = [...description.matchAll(tagRegex)];

      const actions = module.getTourTargets();

      const result: Step[] = [];

      for (let i = 0; i < tags.length; i++) {
        const match = tags[i];
        if (typeof match[1] === "undefined") continue; // `tour end`

        const index = parseInt(match[1], 10);
        const staticValue = match[2];
        const bodyStart = (match.index ?? 0) + match[0].length;
        const bodyEnd = tags[i + 1]?.index ?? description.length;
        const body = description.slice(bodyStart, bodyEnd);
        const rawText = body.trim() !== "" ? body : (match[3] ?? "");
        const text = rawText.trim().replace(/\r\n|\r/g, "\n");

        const type =
          typeof staticValue === "undefined"
            ? Target.Type.ACTION_BLOCK
            : Target.Type.STATIC_ELEMENT;

        switch (type) {
          case Target.Type.ACTION_BLOCK: {
            const matchingActions = actions.filter(
              (a) => a.getTourIndex() === index,
            );
            if (matchingActions.length === 0) {
              throw new Error(
                `Error creating tour: Action Block with step index ${index} not found.`,
              );
            }
            for (const action of matchingActions) {
              result.push(
                new Step(index, text, {
                  type: Target.Type.ACTION_BLOCK,
                  position: Grid.Position.LEFT,
                  action,
                } as Target.ActionBlockTarget),
              );
            }
            break;
          }

          case Target.Type.STATIC_ELEMENT: {
            const element = document.querySelector<HTMLElement>(
              `[data-tour-static-target-id="${staticValue}"]`,
            );
            if (!element) {
              throw new Error(
                `Error creating tour: Static Element with id "${staticValue}" not found.`,
              );
            }
            const position = element.getAttribute(
              "data-tour-static-target-position",
            );
            result.push(
              new Step(index, text, {
                type: Target.Type.STATIC_ELEMENT,
                position: position as Grid.Position,
                element,
              } as Target.StaticElementTarget),
            );
            break;
          }
        }
      }

      // Keep steps ordered by index
      result.sort((a, b) => a.index - b.index);

      this.internal.set(new Tour(result, 0));
      return Promise.resolve();
    }

    public async stepForward() {
      this.internal.update((s) => {
        const { steps, index } = s;
        const current = steps[index];
        current.destroyStep();
        s.index = s.index + 1;
        return s;
      });

      const { steps, index } = get(this.internal);
      const next = steps[index];
      next.displayStep();
    }

    public async stepBackward() {
      this.internal.update((s) => {
        const { steps, index } = s;
        const current = steps[index];
        current.destroyStep();
        s.index = s.index - 1;
        return s;
      });

      const { steps, index } = get(this.internal);
      const previous = steps[index];
      previous.displayStep();
    }

    public async start() {
      const { steps, index } = get(this.internal);
      const first = steps[index];
      if (!first) return;
      await first.displayStep();
      // Notify subscribers (e.g. action blocks) that the first step is active
      this.internal.update((s) => s);
    }
  }
}

export const configTour = new ConfigTour.Manager();
