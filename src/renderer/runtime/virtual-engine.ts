import { get, writable } from "svelte/store";
import {
  grid,
  EventType,
  ModuleType,
  ElementType,
} from "../protocol/grid-protocol";
import * as grid_protocol from "../../../node_modules/grid-protocol/grid_protocol_bot.json";
import {
  InstructionClass,
  InstructionClassName,
  BufferElement,
} from "../runtime/engine.store";

export const VirtualModuleHWCFG = {
  BU16: {
    hwcfg: grid_protocol.GRID_MODULE_BU16_RevD,
    type: ModuleType.BU16,
  },
  EF44: {
    hwcfg: grid_protocol.GRID_MODULE_EF44_RevD,
    type: ModuleType.EF44,
  },
  EN16: {
    hwcfg: grid_protocol.GRID_MODULE_EN16_RevD,
    type: ModuleType.EN16,
  },
  PBF4: {
    hwcfg: grid_protocol.GRID_MODULE_PBF4_RevD,
    type: ModuleType.PBF4,
  },
  PO16: {
    hwcfg: grid_protocol.GRID_MODULE_PO16_RevD,
    type: ModuleType.PO16,
  },
  TEK2: {
    hwcfg: grid_protocol.GRID_MODULE_TEK2_RevA,
    type: ModuleType.TEK2,
  },
};

function answerExecuteTypeRequest(obj: BufferElement) {
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
        virtual_runtime.update((s) => {
          const device = s.find((e) => e.dx == dx && e.dy == dy);
          const events = device?.pages[page].elements.find(
            (e) => e.elementIndex === element
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
        virtual_runtime.update((s) => {
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
        virtual_runtime.update((s) => {
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
        virtual_runtime.update((s) => {
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
        reject("This operation is not implemented ye in virtual mode!");
      }
    }
  });
}

function answerFetchTypeRequests(obj: BufferElement) {
  return new Promise((resolve, reject) => {
    const class_name = obj.descr.class_name;
    const [dx, dy, page, element, event]: number[] = [
      obj.descr.brc_parameters.DX,
      obj.descr.brc_parameters.DY,
      obj.descr.class_parameters.PAGENUMBER ?? -1,
      obj.descr.class_parameters.ELEMENTNUMBER ?? -1,
      obj.descr.class_parameters.EVENTTYPE ?? -1,
    ];
    const device = get(virtual_runtime).find((e) => e.dx === dx && e.dy === dy);
    switch (class_name) {
      case InstructionClassName.CONFIG: {
        const events = device?.pages[page].elements.find(
          (e) => e.elementIndex === element
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
        reject("This operation is not implemented ye in virtual mode!");
      }
    }
  });
}

class VirtualModule {
  public dx: number;
  public dy: number;
  public type: ModuleType;
  public pages: any;

  private createControlElement(type: ElementType) {
    const events = grid.get_element_events(type);
    return {
      events: events.map((e) => {
        return {
          value: Number(e.value),
          config: e.defaultConfig,
          stored: e.defaultConfig,
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
        element.events.forEach((event: any) => (event.config = event.stored))
      )
    );
  }

  public storeChanges() {
    this.pages.forEach((page: any) =>
      page.elements.forEach((element: any) =>
        element.events.forEach((event: any) => (event.stored = event.config))
      )
    );
  }

  constructor(dx: number, dy: number, type: ModuleType) {
    this.dx = dx;
    this.dy = dy;
    this.type = type;
    this.initConfiguration(type);
  }
}

function create_virtual_runtime() {
  const store = writable([] as VirtualModule[]);

  function destroyModule(dx: number, dy: number) {
    const vrt = get(store);
    const index = vrt.findIndex((e) => e.dx === dx && e.dy === dy);
    if (index === -1) {
      return;
    }

    store.update((s) => {
      s.splice(index, 1);
      return s;
    });
  }

  return {
    ...store,
    destroyModule: destroyModule,
  };
}

export const virtual_runtime = create_virtual_runtime();

export function createVirtualModule(dx: number, dy: number, type: ModuleType) {
  const device = new VirtualModule(dx, dy, type);
  virtual_runtime.update((s) => [...s, device]);
}

export function simulateProcess(obj: BufferElement): Promise<any> {
  const class_instr = obj.descr.class_instr;
  switch (class_instr) {
    case InstructionClass.FETCH: {
      return answerFetchTypeRequests(obj);
    }
    case InstructionClass.ACKNOWLEDGE: {
      return Promise.reject();
    }
    case InstructionClass.EXECUTE: {
      return answerExecuteTypeRequest(obj);
    }
    case InstructionClass.REPORT: {
      return Promise.reject();
    }
  }
}
