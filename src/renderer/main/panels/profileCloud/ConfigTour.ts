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
  ActionData,
  GridAction,
  GridEvent,
  GridModule,
  GridProfileData,
} from "../../../runtime/runtime";
import { user_input } from "../../../runtime/user-input.store";
import { v4 as uuidv4 } from "uuid";
import { runtime_manager } from "../../../runtime/runtime-manager.store";

export namespace ConfigTour {
  export namespace Target {
    export enum Type {
      ACTION_BLOCK,
      STATIC_ELEMENT,
    }

    export interface AbstractTarget {
      type: Type;
    }

    export interface StaticElementTarget extends AbstractTarget {}

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

    public displayStep() {
      switch (this.target.type) {
        case Target.Type.ACTION_BLOCK: {
          const target = this.target as Target.ActionBlockTarget;
          this.node = target.action.element;
          break;
        }
        case Target.Type.STATIC_ELEMENT: {
          const target = this.target as Target.StaticElementTarget;
          break;
        }
      }

      if (!this.node) {
        console.warn("Step display failed: target node not found.");
        return;
      }

      // Create the tour popover component
      this.component = new TourPopoverComponent({
        target: this.node,
        props: {
          markdown: this.markdown,
          referenceElement: this.node,
          updateTrigger: this.updateTrigger,
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
      public active: boolean,
    ) {}

    public next() {
      const { steps, index } = this;
      return steps[index + 1];
    }

    public previous() {
      const { steps, index } = this;
      return steps[index - 1];
    }

    public stepForward() {
      const next = this.steps[++this.index];
      const action = (next.target as Target.ActionBlockTarget).action;
      const event = action.parent as GridEvent;

      user_input.displayEvent(event).then(() => {
        next.displayStep();
      });
    }

    public stepBackward() {
      const previous = this.steps[--this.index];
      const action = (previous.target as Target.ActionBlockTarget).action;
      const event = action.parent as GridEvent;

      user_input.displayEvent(event).then(() => {
        previous.displayStep();
      });
    }

    public clear() {
      this.set(Manager.defaultValue);
    }

    public reset() {
      this.active = Manager.defaultValue.active;
      this.index = Manager.defaultValue.index;
    }

    public async start() {
      this.active = true;
      const first = this.steps[this.index];
      const action = (first.target as Target.ActionBlockTarget).action;
      const event = action.parent as GridEvent;
      user_input.displayEvent(event).then(() => {
        first.displayStep();
      });
    }
  }

  export class Manager implements Readable<Tour> {
    static readonly defaultValue = new Tour([], -1, false);

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

    private parseSteps(description: string): Step[] {
      const stepRegex =
        /<!--\s*tour\s+step=(\d+)(?:\s+static="([^"]*)")?\s+text\[\[([\s\S]*?)\]\]\s*-->/g;

      const steps: Step[] = [];
      let match: RegExpExecArray | null;

      while ((match = stepRegex.exec(description)) !== null) {
        const index = parseInt(match[1], 10);
        const staticValue = match[2];
        const rawText = match[3];

        const current = new Step(
          index,
          rawText.trim().replace(/\r\n|\r/g, "\n"),
          {
            type:
              typeof staticValue === "undefined"
                ? Target.Type.ACTION_BLOCK
                : Target.Type.STATIC_ELEMENT,
          },
        );

        steps.push(current);
      }

      return steps;
    }

    public manageActionTarget(node: HTMLElement, action: GridAction) {
      node.setAttribute("data-", "asd");
    }

    public async createTourFromProfile(
      profile: GridProfileData,
      module: GridModule,
    ): Promise<Tour> {
      const profileSteps = this.parseSteps(profile.description).sort(
        (a, b) => a.index - b.index,
      );

      const actions = module.getTourTargets();
      const result: Step[] = [];

      for (const action of actions) {
        const current = profileSteps.find(
          (e) => action.getTourIndex() === e.index,
        );
        if (!current) {
          throw new Error(
            `Error creating tour. Action Block with index ${action.getTourIndex()} was not found.`,
          );
        }

        result.push(
          new Step(current.index, current.markdown, {
            type: Target.Type.ACTION_BLOCK,
            action,
          } as Target.ActionBlockTarget),
        );
      }

      this.internal.set(new Tour(result, 0, true));

      return Promise.resolve(get(this.internal));
    }
  }
}

export const configTour = new ConfigTour.Manager();
