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
import { NumberToEventType } from "@intechstudio/grid-protocol";
import {
  GridAction,
  GridElement,
  GridEvent,
  GridModule,
  GridPage,
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
      ELEMENT = "element",
      EVENT = "event",
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

    export interface ElementTarget extends AbstractTarget {
      element: GridElement;
    }

    export interface EventTarget extends AbstractTarget {
      event: GridEvent;
    }
  }

  // Targets render after a store change: poll a few frames for the node.
  async function waitForNode(
    find: () => HTMLElement | null | undefined,
    tries = 10,
  ): Promise<HTMLElement | null> {
    for (let i = 0; i < tries; i++) {
      await tick();
      const node = find();
      if (node?.isConnected) return node;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    }
    return find() ?? null;
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
          await user_input.displayEvent(target.action.parent as GridEvent);
          node = await waitForNode(() => target.action.element);
          break;
        }
        case Target.Type.STATIC_ELEMENT: {
          const target = this.target as Target.StaticElementTarget;
          node = target.element;
          break;
        }
        case Target.Type.ELEMENT: {
          const { element } = this.target as Target.ElementTarget;
          const page = element.parent as GridPage;
          const module = page.parent as GridModule;
          user_input.set({
            dx: module.dx,
            dy: module.dy,
            pagenumber: page.pageNumber,
            elementnumber: element.elementIndex,
            eventtype: get(user_input).eventtype,
          });
          node = await waitForNode(() =>
            document.querySelector<HTMLElement>(
              `[data-tour-module-id="${module.id}"][data-tour-element-number="${element.elementIndex}"]`,
            ),
          );
          break;
        }
        case Target.Type.EVENT: {
          const { event } = this.target as Target.EventTarget;
          await user_input.displayEvent(event);
          node = await waitForNode(() =>
            document.querySelector<HTMLElement>(
              `[data-tour-event-type="${event.type}"]`,
            ),
          );
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

    /**
     * Parses the profile description into tour steps. Tags:
     *
     *   <!-- tour target-static="store-button" -->
     *   <!-- tour target-action-name="Full action block name" -->
     *   <!-- tour target-element="0" -->
     *   <!-- tour target-event="0/button" -->
     *   <!-- tour target-action="0/button/0" -->
     *   <!-- tour end -->
     *
     * Optional on any step: position="left|right|top|bottom" and an inline
     * text[[...]] fallback. A step's text is whatever sits between its tag and
     * the next tour tag (or the end of the description). Steps keep the order
     * they appear in. Element/event/action paths resolve on the page that is
     * currently displayed for the module.
     */
    private buildSteps(profile: GridProfileData, module: GridModule): Step[] {
      const tagRegex = /<!--\s*tour\s+(end\s*-{0,2}>|[\s\S]*?-->)/g;
      const description = profile.description ?? "";
      const tags = [...description.matchAll(tagRegex)];

      const page = module.findPage(get(user_input).pagenumber);
      if (!page) {
        throw new Error("Error creating tour: page not found.");
      }

      const toInt = (value: string, what: string) => {
        const n = Number(value);
        if (!Number.isInteger(n) || n < 0) {
          throw new Error(`Error creating tour: invalid ${what} "${value}".`);
        }
        return n;
      };

      const findElement = (value: string) => {
        const element = page.findElement(toInt(value, "element index"));
        if (!element) {
          throw new Error(`Error creating tour: element ${value} not found.`);
        }
        return element;
      };

      const findEvent = (elementValue: string, eventName: string) => {
        const element = findElement(elementValue);
        const event = element.events.find(
          (e) =>
            String(NumberToEventType(e.type)).toLowerCase() ===
            eventName.trim().toLowerCase(),
        );
        if (!event) {
          throw new Error(
            `Error creating tour: event "${eventName}" not found on element ${elementValue}.`,
          );
        }
        return event;
      };

      const result: Step[] = [];

      for (let i = 0; i < tags.length; i++) {
        const match = tags[i];
        if (/^end\b/.test(match[1])) continue;

        let inner = match[1].replace(/-->$/, "");
        const inline = /text\[\[([\s\S]*?)\]\]/.exec(inner);
        if (inline) inner = inner.replace(inline[0], "");

        const attrs: Record<string, string> = {};
        for (const m of inner.matchAll(/([\w-]+)="([^"]*)"/g)) {
          attrs[m[1]] = m[2];
        }

        const bodyStart = (match.index ?? 0) + match[0].length;
        const bodyEnd = tags[i + 1]?.index ?? description.length;
        const body = description.slice(bodyStart, bodyEnd);
        const rawText = body.trim() !== "" ? body : (inline?.[1] ?? "");
        const text = rawText.trim().replace(/\r\n|\r/g, "\n");
        const override = attrs["position"] as Grid.Position | undefined;
        const index = result.length;

        if (typeof attrs["target-static"] !== "undefined") {
          const id = attrs["target-static"];
          const element = document.querySelector<HTMLElement>(
            `[data-tour-static-target-id="${id}"]`,
          );
          if (!element) {
            throw new Error(
              `Error creating tour: Static Element with id "${id}" not found.`,
            );
          }
          const position = element.getAttribute(
            "data-tour-static-target-position",
          );
          result.push(
            new Step(index, text, {
              type: Target.Type.STATIC_ELEMENT,
              position: override ?? (position as Grid.Position),
              element,
            } as Target.StaticElementTarget),
          );
        } else if (typeof attrs["target-action-name"] !== "undefined") {
          const name = attrs["target-action-name"];
          const actions = page.control_elements
            .flatMap((e) => e.events.flatMap((e) => e.config))
            .filter((a) => a.name === name);
          if (actions.length === 0) {
            throw new Error(
              `Error creating tour: Action Block named "${name}" not found.`,
            );
          }
          for (const action of actions) {
            result.push(
              new Step(index, text, {
                type: Target.Type.ACTION_BLOCK,
                position: override ?? Grid.Position.LEFT,
                action,
              } as Target.ActionBlockTarget),
            );
          }
        } else if (typeof attrs["target-action"] !== "undefined") {
          const [el, ev, ac] = attrs["target-action"].split("/");
          const event = findEvent(el, ev ?? "");
          const action = event.config[toInt(ac ?? "", "action index")];
          if (!action) {
            throw new Error(
              `Error creating tour: action "${attrs["target-action"]}" not found.`,
            );
          }
          result.push(
            new Step(index, text, {
              type: Target.Type.ACTION_BLOCK,
              position: override ?? Grid.Position.LEFT,
              action,
            } as Target.ActionBlockTarget),
          );
        } else if (typeof attrs["target-event"] !== "undefined") {
          const [el, ev] = attrs["target-event"].split("/");
          result.push(
            new Step(index, text, {
              type: Target.Type.EVENT,
              position: override ?? Grid.Position.LEFT,
              event: findEvent(el, ev ?? ""),
            } as Target.EventTarget),
          );
        } else if (typeof attrs["target-element"] !== "undefined") {
          result.push(
            new Step(index, text, {
              type: Target.Type.ELEMENT,
              position: override ?? Grid.Position.RIGHT,
              element: findElement(attrs["target-element"]),
            } as Target.ElementTarget),
          );
        } else {
          throw new Error(
            "Error creating tour: tour tag without a target-* attribute.",
          );
        }
      }

      return result;
    }

    /** True when the profile description defines a tour that can be built. */
    public hasTour(profile: GridProfileData, module: GridModule): boolean {
      try {
        return this.buildSteps(profile, module).length > 0;
      } catch {
        return false;
      }
    }

    public async createTourFromProfile(
      profile: GridProfileData,
      module: GridModule,
    ): Promise<void> {
      // Remove any popover from a previous tour before replacing it
      this.clear();

      this.internal.set(new Tour(this.buildSteps(profile, module), 0));
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
