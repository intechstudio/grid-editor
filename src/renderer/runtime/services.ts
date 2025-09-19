import { get } from "svelte/store";
import { InstructionClassName } from "./engine.store";
import { GridRuntime } from "./runtime";

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
        this.worker();
        await this.delay(this.pingTime);
      }
    }

    protected abstract worker(): void;

    private delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  export class AutoEventFetcher extends AbstractService {
    static readonly pingTime = 1000; // ms

    constructor(private runtime: GridRuntime) {
      super(AutoEventFetcher.pingTime, ServiceType.AUTO_EVENT_FETCHER);
    }

    protected worker() {
      for (const module of this.runtime.modules) {
        for (const page of module.pages) {
          for (const control of page.control_elements) {
            for (const event of control.events) {
              if (!event.isLoaded()) {
                const buffer = get(this.runtime.connection.buffer);
                const isIdle =
                  buffer.array.filter(
                    (e) =>
                      e.descr.class_name !== InstructionClassName.HEARTBEAT,
                  ).length === 0;
                if (isIdle) {
                  event.load();
                }
                return;
              }
            }
          }
        }
      }
    }
  }
}
