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

export namespace ConfigTour {
  export function displayStep(node: HTMLElement, step: Step | undefined) {
    let sibling: HTMLElement | null = null;
    let tourStepInstance: TourStep | null = null;
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

      tourStepInstance = new TourStep({
        target: sibling,
        props: {
          text: step.content.text,
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
        if (tourStepInstance) tourStepInstance.$destroy();
        unobserveReference();
        createTourStep();
      },
      destroy() {
        if (tourStepInstance) tourStepInstance.$destroy();
        unobserveReference();
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
    static readonly defaultValue: TourData = {
      id: undefined,
      current: undefined,
      steps: [],
      index: -1,
      active: false,
      profile: undefined,
    };
    private internal: Writable<TourData> = writable(Tour.defaultValue);

    public subscribe(
      run: Subscriber<TourData>,
      invalidate?: (value?: TourData) => void,
    ): Unsubscriber {
      return this.internal.subscribe(run, invalidate);
    }

    public set(value: TourData) {
      this.internal.set(value);
    }

    private update(updater: Updater<TourData>) {
      this.internal.update(updater);
    }

    private static parseSteps(
      description: string,
    ): Array<{ index: number; content: TourStepContent }> {
      const stepRegex =
        /<!--\s*tour\s+step=(\d+)\s+text\[\[([\s\S]*?)\]\]\s*-->/g;

      const steps: Array<{ index: number; content: TourStepContent }> = [];
      let match: RegExpExecArray | null;

      while ((match = stepRegex.exec(description)) !== null) {
        const index = parseInt(match[1], 10);
        const rawText = match[2];

        const content: TourStepContent = {
          text: rawText.trim().replace(/\r\n|\r/g, "\n"),
        };

        steps.push({ index, content });
      }

      return steps;
    }

    public static createTourFrom(
      profile: GridProfileData,
      targets: GridAction[],
    ): TourData {
      const steps = Tour.parseSteps(profile.description);
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
        return undefined;
      }

      return {
        current: undefined,
        index: -1,
        active: false,
        id: profile.id,
        steps: sorted,
        profile: profile,
      };
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
      this.set(Tour.defaultValue);
    }

    set active(value: boolean) {
      this.update((s) => Object({ ...s, active: value }));
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
  }
}

export const configTour = new ConfigTour.Tour();
