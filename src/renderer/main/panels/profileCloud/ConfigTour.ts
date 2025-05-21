import {
  writable,
  Readable,
  Updater,
  Unsubscriber,
  Writable,
  get,
} from "svelte/store";
import TourStep, { TourStepContent } from "./TourStep.svelte";
import { Subscriber } from "svelte/motion";
import {
  GridAction,
  GridEvent,
  GridProfileData,
} from "../../../runtime/runtime";
import { user_input } from "../../../runtime/user-input.store";
import {
  lastOpenedActionblocksInsert,
  lastOpenedActionblocksRemove,
} from "../configuration/Configuration";

export namespace ConfigTour {
  export function displayStep(node: HTMLElement, step: Step | undefined) {
    // Clean up previous step if exists
    let sibling: HTMLElement | null = null;
    let tourStepInstance: TourStep | null = null;

    // Initial setup or update when step changes
    const createTourStep = () => {
      if (typeof step === "undefined") {
        return;
      }

      sibling = document.createElement("div");
      node.parentNode?.insertBefore(sibling, node.nextSibling);

      // Create the TourStep instance
      tourStepInstance = new TourStep({
        target: sibling,
        props: {
          text: step.content.text,
          referenceElement: node,
        },
      });
    };

    // If step is provided, create the initial TourStep
    createTourStep();

    // Return the update function to make it reactive
    return {
      update(newStep: Step | undefined) {
        step = newStep;
        if (tourStepInstance) {
          // Optionally, you can destroy or update the existing TourStep instance here
          tourStepInstance.$destroy();
        }

        // Re-create the TourStep with the new step
        createTourStep();
      },
      destroy() {
        // Clean up the sibling and TourStep instance
        if (tourStepInstance) {
          tourStepInstance.$destroy();
        }
        sibling?.remove();
      },
    };
  }

  export interface Step {
    content: TourStepContent;
    action: GridAction;
  }

  export interface TourData {
    id: string | undefined;
    current: Step | undefined;
    steps: Step[];
    index: number;
    active: boolean;
    profile: GridProfileData | undefined;
  }

  export class Tour implements Readable<TourData> {
    private readonly defaultValue: TourData = {
      id: undefined,
      current: undefined,
      steps: [],
      index: -1,
      active: false,
      profile: undefined,
    };
    private internal: Writable<TourData> = writable(this.defaultValue);

    public subscribe(
      run: Subscriber<TourData>,
      invalidate?: (value?: TourData) => void,
    ): Unsubscriber {
      return this.internal.subscribe(run, invalidate);
    }

    private set(value: TourData) {
      this.internal.set(value);
    }

    private update(updater: Updater<TourData>) {
      this.internal.update(updater);
    }

    private parseSteps(
      description: string,
    ): Array<{ index: number; content: TourStepContent }> {
      const stepRegex = /<!--\s*tour\s+step=(\d+)\s+text\[\[(.*?)\]\]\s*-->/gs;

      const steps: Array<{ index: number; content: TourStepContent }> = [];
      let match: RegExpExecArray | null;

      while ((match = stepRegex.exec(description)) !== null) {
        const index = parseInt(match[1], 10);
        const text = match[2];

        const content: TourStepContent = {
          text: text.trim(),
        };

        steps.push({ index, content });
      }

      return steps;
    }

    public createTourFrom(profile: GridProfileData, targets: GridAction[]) {
      const steps = this.parseSteps(profile.description);
      const mapped = targets.map((e) => {
        const index = e.getTourIndex();
        const step = steps.find((e) => e.index === index);
        return typeof step === "undefined"
          ? undefined
          : {
              index: index,
              action: e,
              content: step.content,
            };
      });
      const sorted = [...mapped]
        .filter((e) => typeof e !== "undefined")
        .sort((a, b) => a.index - b.index);
      const first = sorted[0];

      if (typeof first === "undefined") {
        this.set(this.defaultValue);
        return;
      }

      this.update((s) =>
        Object({
          ...s,
          id: profile.id,
          steps: sorted,
          profile: profile,
        }),
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
      const { current } = get(this.internal);
      if (typeof current !== "undefined") {
        lastOpenedActionblocksRemove(current.action.short);
      }
      const next = this.next();
      this.update((s) =>
        Object({
          ...s,
          index: ++s.index,
          current: next,
        }),
      );

      lastOpenedActionblocksInsert(next.action.short);
      user_input.displayEvent(next.action.parent as GridEvent);
    }

    public stepBackward() {
      const { current } = get(this.internal);
      if (typeof current !== "undefined") {
        lastOpenedActionblocksRemove(current.action.short);
      }
      const previous = this.previous();
      this.update((s) =>
        Object({
          ...s,
          index: --s.index,
          current: previous,
        }),
      );
      lastOpenedActionblocksInsert(previous.action.short);
      user_input.displayEvent(previous.action.parent as GridEvent);
    }

    public clear() {
      this.set(this.defaultValue);
    }

    set active(value: boolean) {
      this.update((s) => Object({ ...s, active: value }));
    }

    public reset() {
      const { current } = get(this.internal);
      if (typeof current !== "undefined") {
        lastOpenedActionblocksRemove(current.action.short);
      }
      this.update((s) =>
        Object({ ...s, active: false, index: 0, current: s.steps[0] }),
      );
      lastOpenedActionblocksInsert(get(this.internal).current.action.short);
    }

    public start() {
      this.reset();
      this.update((s) => Object({ ...s, active: true }));
      const { current } = get(this.internal);
      lastOpenedActionblocksInsert(current.action.short);
      user_input.displayEvent(current.action.parent as GridEvent);
    }
  }
}

export const configTour = new ConfigTour.Tour();
