import { get } from "svelte/store";
import { InstructionClassName } from "./engine.store";
import { GridRuntime } from "./runtime";
import { logger } from "./runtime.store";
import { user_input } from "./user-input.store";

export namespace GridService {
  enum ServiceType {
    AUTO_EVENT_FETCHER = "auto-event-fetcher",
  }

  export abstract class AbstractService {
    protected stopped = false;

    constructor(
      protected readonly pingTime: number,
      protected readonly type: ServiceType,
    ) {}

    public async start() {
      while (!this.stopped) {
        await this.delay(this.pingTime);
        this.worker();
      }
    }

    public stop() {
      this.stopped = true;
    }

    protected abstract worker(): void;

    private delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  export class AutoEventFetcher extends AbstractService {
    static readonly pingTime = 150; // ms

    constructor(private runtime: GridRuntime) {
      super(AutoEventFetcher.pingTime, ServiceType.AUTO_EVENT_FETCHER);
    }

    protected worker() {
      const ui = get(user_input);
      for (const module of this.runtime.modules) {
        const page = module.findPage(ui.pagenumber);
        for (const control of page.control_elements) {
          for (const event of control.events) {
            if (!event.isLoaded()) {
              const buffer = get(this.runtime.connection.buffer);
              const isIdle =
                buffer.array.filter(
                  (e) => e.descr.class_name !== InstructionClassName.HEARTBEAT,
                ).length === 0;
              if (isIdle) {
                event.load().catch((e) => {
                  console.warn("Event load interrupted:", e);
                  if (!String(e).includes("is not connected")) {
                    logger.set({
                      type: "info",
                      classname: "service",
                      mode: 0,
                      message: `Event load interrupted: ${e}`,
                    });
                  }
                });
              }
              return;
            }
          }
        }
      }
    }
  }
}
