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
  GridProfileData,
} from "../../../runtime/runtime";
import { user_input } from "../../../runtime/user-input.store";
import { v4 as uuidv4 } from "uuid";

export namespace Tour {
  export namespace Target {
    export enum Type {
      ACTION_BLOCK,
      STATIC_ELEMENT,
    }

    export interface Data {
      id: string;
      node: HTMLElement;
    }
  }

  interface AbstractStep extends TourPopover.Content {
    type: Target.Type;
    index: number;
  }

  export interface StaticElementStep extends AbstractStep {}

  export interface ActionBlockStep extends AbstractStep {}

  export interface ManagerData {
    steps: AbstractStep[];
    targets: Target.Data[];
    index: number;
    active: boolean;
  }

  export class Manager implements Readable<ManagerData | undefined> {
    static readonly defaultValue = undefined;
    private internal: Writable<ManagerData> = writable(Manager.defaultValue);

    public subscribe(
      run: Subscriber<ManagerData>,
      invalidate?: (value?: ManagerData) => void,
    ): Unsubscriber {
      return this.internal.subscribe(run, invalidate);
    }

    public set(value: ManagerData) {
      this.internal.set(value);
    }

    private update(updater: Updater<ManagerData>) {
      this.internal.update(updater);
    }

    private parseSteps(description: string): ActionBlockStep[] {
      const stepRegex =
        /<!--\s*tour\s+step=(\d+)\s+text\[\[([\s\S]*?)\]\]\s*-->/g;

      const steps: ActionBlockStep[] = [];
      let match: RegExpExecArray | null;

      while ((match = stepRegex.exec(description)) !== null) {
        const index = parseInt(match[1], 10);
        const rawText = match[2];

        const current: ActionBlockStep = {
          type: Target.Type.ACTION_BLOCK,
          markdown: rawText.trim().replace(/\r\n|\r/g, "\n"),
          index: index,
        };

        steps.push(current);
      }

      return steps;
    }

    public static manageActionTarget(node: HTMLElement, data: ActionData) {
      configTour.update((s) => ({
        ...s,
        targets: [...s.targets, { node, id }],
      }));
    }

    public createTourFromProfile(profile: GridProfileData) {
      const steps = this.parseSteps(profile.description).sort(
        (a, b) => a.index - b.index,
      );

      this.internal.update(
        (s) => ({ ...s, index: 0, active: false, steps: steps }) as ManagerData,
      );
    }

    public next() {
      const { steps, index } = get(this.internal);
      return steps[index + 1];
    }

    public previous() {
      const { steps, index } = get(this.internal);
      return steps[index - 1];
    }

    public stepForward() {
      const next = this.next();
      this.update((s) =>
        Object({
          ...s,
          index: ++s.index,
          current: next,
        }),
      );

      user_input.displayEvent(next.action.parent as GridEvent);
    }

    public stepBackward() {
      const previous = this.previous();
      this.update((s) =>
        Object({
          ...s,
          index: --s.index,
          current: previous,
        }),
      );
      user_input.displayEvent(previous.action.parent as GridEvent);
    }

    public clear() {
      this.set(Manager.defaultValue);
    }

    public reset() {
      this.update((s) =>
        Object({ ...s, active: false, index: 0, current: s.steps[0] }),
      );
    }

    public start() {
      this.reset();
      this.update((s) => Object({ ...s, active: true }));
      const { current } = get(this.internal);
      user_input.displayEvent(current.action.parent as GridEvent);
    }

    public displayStep(step: AbstractStep, target: Target.Data) {
      let sibling: HTMLElement | null = null;
      let instance: TourPopoverComponent | null = null;
      const node = target.node;
      const updateTrigger: Writable<number> = writable(0);

      let resizeObserver: ResizeObserver | null = null;

      const observeReference = () => {
        if (!node) return;
        resizeObserver = new ResizeObserver(() => {
          updateTrigger.update((n) => n + 1); // Signal update
        });
        resizeObserver.observe(node);
      };

      const unobserveReference = () => {
        resizeObserver?.disconnect();
      };

      const createTourStep = () => {
        if (typeof step === "undefined") return;

        sibling = document.createElement("div");
        node.parentNode?.insertBefore(sibling, node.nextSibling);

        instance = new TourPopoverComponent({
          target: sibling,
          props: {
            markdown: step.markdown,
            referenceElement: node,
            updateTrigger, // pass the writable store
          },
        });

        observeReference();
      };

      createTourStep();

      return {
        update(newStep: Step | undefined) {
          step = newStep;
          if (instance) instance.$destroy();
          unobserveReference();
          createTourStep();
        },
        destroy() {
          if (instance) instance.$destroy();
          unobserveReference();
          sibling?.remove();
        },
      };
    }
  }
}

export const configTour = new Tour.Manager();
