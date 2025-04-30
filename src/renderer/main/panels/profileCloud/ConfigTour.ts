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
import { GridAction, GridEvent } from "../../../runtime/runtime";
import { user_input } from "../../../runtime/user-input.store";

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

  export class StepQueue implements Readable<Step> {
    private internal: Writable<Step> = writable(undefined);
    private steps: Array<Step> = [];
    private index: number = 0;

    public subscribe(
      run: Subscriber<Step>,
      invalidate?: (value?: Step) => void,
    ): Unsubscriber {
      return this.internal.subscribe(run, invalidate);
    }

    private set(value: Step) {
      this.internal.set(value);
    }

    private update(updater: Updater<Step>) {
      this.internal.update(updater);
    }

    private parseSteps(
      description: string,
    ): Array<{ index: number; content: TourStepContent }> {
      const stepRegex =
        /<!--\s*step:(\d+):start\s*-->([\s\S]*?)<!--\s*step:\1:end\s*-->/g;
      const steps: Array<{ index: number; content: TourStepContent }> = [];
      let match: RegExpExecArray;

      while ((match = stepRegex.exec(description)) !== null) {
        const step = parseInt(match[1], 10);
        const content: TourStepContent = {
          text: match[2].trim(),
        };
        steps.push({ index: step, content });
      }

      return steps;
    }

    public createTourFrom(description: string, targets: GridAction[]) {
      const steps = this.parseSteps(description);
      const mapped = targets.map((e) => {
        const index = e.getTourIndex();
        const step = steps.find((e) => e.index === index);
        return {
          index: index,
          action: e,
          content: step.content,
        };
      });
      const sorted = [...mapped].sort((a, b) => a.index - b.index);
      const first = sorted[0];

      if (typeof first === "undefined") {
        return;
      }

      this.steps = sorted;
      this.index = 0;
      this.set(first);
      user_input.displayEvent(first.action.parent as GridEvent);
    }

    public next() {
      return this.steps[this.index + 1];
    }

    public previous() {
      return this.steps[this.index - 1];
    }

    public stepForward() {
      const next = this.next();
      ++this.index;
      this.set(next);
      user_input.displayEvent(next.action.parent as GridEvent);
    }

    public stepBackward() {
      const previous = this.previous();
      --this.index;
      this.set(previous);
      user_input.displayEvent(previous.action.parent as GridEvent);
    }

    public clear() {
      this.steps = [];
      this.set(undefined);
    }
  }
}

export const configTour = new ConfigTour.StepQueue();
