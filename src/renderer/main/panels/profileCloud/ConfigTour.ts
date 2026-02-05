import {
  writable,
  Readable,
  Updater,
  Unsubscriber,
  Writable,
  get,
} from "svelte/store";
import TourPopoverComponent, { TourPopover } from "./TourPopover.svelte";
import { Subscriber } from "svelte/motion";
import {
  GridAction,
  GridEvent,
  GridModule,
  GridProfileData,
} from "../../../runtime/runtime";
import { user_input } from "../../../runtime/user-input.store";
import { Grid } from "../../../lib/_utils";
import { mount } from "svelte";

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

  class Step implements TourPopover.Content {
    private component: TourPopoverComponent | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private node: HTMLElement | null = null;
    private updateTrigger: Writable<number> = writable(0);

    constructor(
      public index: number,
      public markdown: string,
      public target: Target.AbstractTarget,
    ) {}

    public async displayStep() {
      switch (this.target.type) {
        case Target.Type.ACTION_BLOCK: {
          const target = this.target as Target.ActionBlockTarget;
          const event = target.action.parent as GridEvent;
          await user_input.displayEvent(event);
          this.node = target.action.element;
          break;
        }
        case Target.Type.STATIC_ELEMENT: {
          const target = this.target as Target.StaticElementTarget;
          this.node = target.element;
          break;
        }
      }

      if (!this.node) {
        console.warn("Step display failed: target node not found.");
        return;
      }

      // Create the tour popover component
      this.component = mount(TourPopoverComponent, {
              target: this.node,
              props: {
                markdown: this.markdown,
                referenceElement: this.node,
                updateTrigger: this.updateTrigger,
                position: this.target.position,
              },
            });

      // Observe size changes
      this.resizeObserver = new ResizeObserver(() => {
        this.updateTrigger.update((n) => n + 1);
      });
      this.resizeObserver.observe(this.node);
    }

    public destroyStep() {
      if (this.component) {
        this.component.$destroy();
        this.component = null;
      }

      if (this.resizeObserver && this.node) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }

      this.node = null;
    }
  }

  export class Tour {
    constructor(
      public steps: Step[],
      public index: number,
    ) {}

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
      const { steps, index } = get(this.internal);
      const current = steps[index];
      this.set(Manager.defaultValue);
      if (!current) return;
      current.destroyStep();
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
      const stepRegex =
        /<!--\s*tour\s+step=(\d+)(?:\s+static="([^"]*)")?\s+text\[\[([\s\S]*?)\]\]\s*-->/g;

      const actions = module.getTourTargets();

      const result: Step[] = [];
      let match: RegExpExecArray | null;

      while ((match = stepRegex.exec(profile.description)) !== null) {
        const index = parseInt(match[1], 10);
        const staticValue = match[2];
        const rawText = match[3];
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
      first.displayStep();
    }
  }
}

export const configTour = new ConfigTour.Manager();
