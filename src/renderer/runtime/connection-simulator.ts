import {
  get,
  type Readable,
  type Subscriber,
  type Unsubscriber,
  type Updater,
  type Writable,
  writable,
} from "svelte/store";
import { grid, ModuleType, ElementType } from "@intechstudio/grid-protocol";
import {
  InstructionClass,
  InstructionClassName,
  type BufferElement,
} from "./engine.store";

export class VirtualModule {
  public dx: number;
  public dy: number;
  public type: ModuleType;
  public pages: any;

  private createControlElement(type: ElementType) {
    const events = grid.get_element_events(type);
    return {
      events: events.map((e) => {
        const cfg = e.defaultConfig.startsWith("<?lua ")
          ? e.defaultConfig.slice(6, e.defaultConfig.lastIndexOf(" ?>"))
          : e.defaultConfig;
        return {
          value: Number(e.value),
          config: cfg,
          stored: cfg,
        };
      }),
    };
  }

  private initConfiguration(type: ModuleType) {
    const control_elements = grid
      .get_module_element_list(type)
      .filter((e) => typeof e !== "undefined")
      .map((element, index) => {
        return {
          elementIndex: element === ElementType.SYSTEM ? 255 : index,
          ...this.createControlElement(element as ElementType),
        };
      });

    this.pages = Array(4).fill({
      elements: control_elements,
    });
  }

  public resetDefaultConfiguration() {
    this.initConfiguration(this.type);
  }

  public discardChanges() {
    this.pages.forEach((page: any) =>
      page.elements.forEach((element: any) =>
        element.events.forEach((event: any) => (event.config = event.stored)),
      ),
    );
  }

  public storeChanges() {
    this.pages.forEach((page: any) =>
      page.elements.forEach((element: any) =>
        element.events.forEach((event: any) => (event.stored = event.config)),
      ),
    );
  }

  constructor(dx: number, dy: number, type: ModuleType) {
    this.dx = dx;
    this.dy = dy;
    this.type = type;
    this.initConfiguration(type);
  }
}

export class ConnectionSimulator implements Readable<VirtualModule[]> {
  private _internal: Writable<VirtualModule[]> = writable([]);

  public subscribe(
    run: Subscriber<VirtualModule[]>,
    invalidate?: (value?: VirtualModule[]) => void,
  ): Unsubscriber {
    return this._internal.subscribe(run, invalidate);
  }

  private set(value: VirtualModule[]) {
    this._internal.set(value);
  }

  private update(updater: Updater<VirtualModule[]>) {
    this._internal.update(updater);
  }

  public destroyModule(dx: number, dy: number) {
    const vrt = get(this._internal);
    const index = vrt.findIndex((e) => e.dx === dx && e.dy === dy);
    if (index === -1) {
      return;
    }

    this.update((s) => {
      s.splice(index, 1);
      return s;
    });
  }

  public createModule(dx: number, dy: number, type: ModuleType) {
    const device = new VirtualModule(dx, dy, type);
    this.update((s) => [...s, device]);
  }

  public answerExecuteTypeRequest(obj: BufferElement) {
    return new Promise((resolve, reject) => {
      const class_name = obj.descr.class_name;
      const [dx, dy, page, element, event]: number[] = [
        obj.descr.brc_parameters.DX,
        obj.descr.brc_parameters.DY,
        obj.descr.class_parameters.PAGENUMBER ?? -1,
        obj.descr.class_parameters.ELEMENTNUMBER ?? -1,
        obj.descr.class_parameters.EVENTTYPE ?? -1,
      ];
      switch (class_name) {
        case InstructionClassName.CONFIG: {
          this.update((s) => {
            const device = s.find((e) => e.dx == dx && e.dy == dy);
            const events = device?.pages[page].elements.find(
              (e) => e.elementIndex === element,
            ).events;
            events.find((e: any) => e.value == event).config =
              obj.descr.class_parameters.ACTIONSTRING;
            return s;
          });

          resolve({
            brc_parameters: {
              DX: -127,
              DY: -127,
              SX: dx,
              SY: dy,
            },
            class_name: InstructionClassName.CONFIG,
            class_instr: InstructionClass.ACKNOWLEDGE,
            class_parameters: {
              ELEMENTNUMBER: element,
              EVENTTYPE: event,
              LASTHEADER: 0,
              PAGENUMBER: page,
            },
          });
          break;
        }
        case InstructionClassName.PAGESTORE: {
          this.update((s) => {
            s.forEach((device) => {
              device.storeChanges();
            });
            return s;
          });
          resolve({
            brc_parameters: {
              DX: -127,
              DY: -127,
              SX: dx,
              SY: dy,
            },
            class_name: class_name,
            class_instr: InstructionClass.ACKNOWLEDGE,
            class_parameters: {
              ELEMENTNUMBER: element,
              EVENTTYPE: event,
              LASTHEADER: 0,
              PAGENUMBER: page,
            },
          });
          break;
        }
        case InstructionClassName.PAGECLEAR: {
          this.update((s) => {
            s.forEach((device) => {
              device.resetDefaultConfiguration();
            });
            return s;
          });
          resolve({
            brc_parameters: {
              DX: -127,
              DY: -127,
              SX: dx,
              SY: dy,
            },
            class_name: class_name,
            class_instr: InstructionClass.ACKNOWLEDGE,
            class_parameters: {
              ELEMENTNUMBER: element,
              EVENTTYPE: event,
              LASTHEADER: 0,
              PAGENUMBER: page,
            },
          });
          break;
        }
        case InstructionClassName.PAGEDISCARD: {
          this.update((s) => {
            s.forEach((device) => {
              device.discardChanges();
            });
            return s;
          });
          resolve({
            brc_parameters: {
              DX: -127,
              DY: -127,
              SX: dx,
              SY: dy,
            },
            class_name: class_name,
            class_instr: InstructionClass.ACKNOWLEDGE,
            class_parameters: {
              ELEMENTNUMBER: element,
              EVENTTYPE: event,
              LASTHEADER: 0,
              PAGENUMBER: page,
            },
          });
          break;
        }
        default: {
          reject("This operation is not available in virtual mode!");
        }
      }
    });
  }

  public answerFetchTypeRequests(obj: BufferElement) {
    return new Promise((resolve, reject) => {
      const class_name = obj.descr.class_name;
      const [dx, dy, page, element, event]: number[] = [
        obj.descr.brc_parameters.DX,
        obj.descr.brc_parameters.DY,
        obj.descr.class_parameters.PAGENUMBER ?? -1,
        obj.descr.class_parameters.ELEMENTNUMBER ?? -1,
        obj.descr.class_parameters.EVENTTYPE ?? -1,
      ];
      const device = get(this).find((e) => e.dx === dx && e.dy === dy);
      switch (class_name) {
        case InstructionClassName.CONFIG: {
          const events = device?.pages[page].elements.find(
            (e) => e.elementIndex === element,
          ).events;
          const config = events.find((e: any) => e.value == event).config;
          resolve({
            brc_parameters: {
              DX: -127,
              DY: -127,
              SX: dx,
              SY: dy,
            },
            class_name: "CONFIG",
            class_instr: "REPORT",
            class_parameters: {
              ACTIONLENGT: config.length,
              ACTIONSTRING: config,
              ELEMENTNUMBER: element,
              EVENTTYPE: event,
              LASTHEADER: 0,
              PAGENUMBER: page,
            },
          });
          break;
        }
        default: {
          reject("This operation is not implemented yet in virtual mode!");
        }
      }
    });
  }

  public simulateProcess(obj: BufferElement): Promise<any> {
    const class_instr = obj.descr.class_instr;
    switch (class_instr) {
      case InstructionClass.FETCH: {
        return this.answerFetchTypeRequests(obj);
      }
      case InstructionClass.ACKNOWLEDGE: {
        return Promise.reject();
      }
      case InstructionClass.EXECUTE: {
        return this.answerExecuteTypeRequest(obj);
      }
      case InstructionClass.REPORT: {
        return Promise.reject();
      }
    }
  }
}
