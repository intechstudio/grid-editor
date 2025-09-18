import { get } from "svelte/store";
import { WriteBuffer } from "./engine.store";
import { GridInstruction } from "../serialport/instructions";
import {
  GridElement,
  GridEvent,
  GridModule,
  GridPage,
  GridRuntime,
} from "./runtime";
import { user_input } from "./user-input.store";

export namespace GridService {
  export abstract class AbstractService {
    protected stopped = false;
    constructor(protected readonly pingTime: number) {}

    public async start() {
      while (!this.stopped) {
        this.work();
        await this.delay(this.pingTime);
      }
    }

    protected abstract work(): void;

    private delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  export class AutoEventFetcher extends AbstractService {
    static readonly pingTime = 1000; // ms

    constructor(private runtime: GridRuntime) {
      super(AutoEventFetcher.pingTime);

      this.start();
    }

    private tryLoadEvent(event: GridEvent) {
      event.load();
    }

    protected work() {
      const { pagenumber } = get(user_input);
      for (const module of this.runtime.modules) {
        const page = module.findPage(pagenumber);

        for (const control of page.control_elements) {
          for (const event of control.events) {
            if (!event.isLoaded()) {
              this.tryLoadEvent(event);
              return;
            }
          }
        }
      }
    }
  }
}
