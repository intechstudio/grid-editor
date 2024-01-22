import { get } from "svelte/store";
import { appSettings } from "../runtime/app-helper.store.js";

import grid from "../protocol/grid-protocol.js";

import { writeBuffer } from "../runtime/engine.store.ts";
import { logger } from "../runtime/runtime.store.js";

export interface Instructions {
  sendEditorHeartbeat_immediate(type: number): Promise<any>;
  fetchConfigFromGrid(
    dx: number,
    dy: number,
    page: number,
    element: number,
    event: number
  ): Promise<any>;
  sendConfigToGrid(
    dx: number,
    dy: number,
    page: number,
    element: number,
    event: number,
    config: string
  ): Promise<any>;
  changeActivePage(page: number): Promise<any>;
  fetchPageCountFromGrid(params: { brc: any }): Promise<any>;
  sendPageStoreToGrid(): Promise<any>;
  sendNVMEraseToGrid(): Promise<any>;
  sendNVMDefragToGrid(): Promise<any>;
  sendPageDiscardToGrid(): Promise<any>;
  sendPageClearToGrid(): Promise<any>;
}

export enum InstructionClassName {
  HEARTBEAT = "HEARTBEAT",
  CONFIG = "CONFIG",
  PAGEACTIVE = "PAGEACTIVE",
  PAGECOUNT = "PAGECOUNT",
  PAGESTORE = "PAGESTORE",
  NVMERASE = "NVMERASE",
  NVMDEFRAG = "NVMDEFRAG",
  PAGEDISCARD = "PAGEDISCARD",
  PAGECLEAR = "PAGECLEAR",
}

export enum InstructionClass {
  EXECUTE = "EXECUTE",
  FETCH = "FETCH",
  REPORT = "REPORT",
  ACKNOWLEDGE = "ACKNOWLEDGE",
}

export type EnsureNonOptional<T> = {
  [K in keyof T]: T[K] extends infer U | undefined ? U : T[K];
};

export type BufferElement = EnsureNonOptional<{
  descr: {
    brc_parameters: { DX: number; DY: number };
    class_name: InstructionClassName;
    class_instr: InstructionClass;
    class_parameters: {
      TYPE?: number;
      HWCFG?: number;
      VMAJOR?: number;
      VMINOR?: number;
      VPATCH?: number;
      VERSIONMAJOR?: number;
      VERSIONMINOR?: number;
      VERSIONPATCH?: number;
      PAGENUMBER?: number;
      ELEMENTNUMBER?: number;
      EVENTTYPE?: number;
      ACTIONLENGTH?: number;
      ACTIONSTRING?: string;
    };
  };
  responseRequired?: boolean;
  responseTimeout?: number;
  filter?: {
    PAGEDISCARD_ACKNOWLEDGE?: {
      LASTHEADER: unknown;
    };
    brc_parameters?: { SX: number; SY: number };
    class_name: InstructionClassName;
    class_instr: InstructionClass;
    class_parameters?: {
      PAGENUMBER?: number;
      ELEMENTNUMBER?: number;
      EVENTTYPE?: number;
      LASTHEADER?: unknown;
    };
  };
}>;

export class GridInstructions implements Instructions {
  sendEditorHeartbeat_immediate(type: number): Promise<any> {
    let buffer_element: BufferElement = {
      descr: {
        brc_parameters: { DX: -127, DY: -127 }, // GLOBAL
        class_name: InstructionClassName.HEARTBEAT,
        class_instr: InstructionClass.EXECUTE,
        class_parameters: {
          TYPE: type,
          HWCFG: 255,
          VMAJOR: get(appSettings).version.major,
          VMINOR: get(appSettings).version.minor,
          VPATCH: get(appSettings).version.patch,
        },
      },
      responseRequired: false,
    };

    return writeBuffer.executeFirst(buffer_element);
  }

  fetchConfigFromGrid(
    dx: number,
    dy: number,
    page: number,
    element: number,
    event: number
  ): Promise<any> {
    //TODO: callback
    let buffer_element: BufferElement = {
      descr: {
        brc_parameters: {
          DX: dx,
          DY: dy,
        },
        class_name: InstructionClassName.CONFIG,
        class_instr: InstructionClass.FETCH,
        class_parameters: {
          VERSIONMAJOR: grid.properties.VERSION.MAJOR,
          VERSIONMINOR: grid.properties.VERSION.MINOR,
          VERSIONPATCH: grid.properties.VERSION.PATCH,
          PAGENUMBER: page,
          ELEMENTNUMBER: element,
          EVENTTYPE: event,
          ACTIONLENGTH: 0,
        },
      },
      responseRequired: true,
      filter: {
        brc_parameters: {
          SX: dx,
          SY: dy,
        },
        class_instr: InstructionClass.REPORT,
        class_name: InstructionClassName.CONFIG,
        class_parameters: {
          PAGENUMBER: page,
          ELEMENTNUMBER: element,
          EVENTTYPE: event,
        },
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  }

  sendConfigToGrid(
    dx: number,
    dy: number,
    page: number,
    element: number,
    event: number,
    config: string
  ): Promise<any> {
    //TODO: Promise reject handling should do this
    if (config.length >= grid.properties.CONFIG_LENGTH) {
      logger.set({
        type: "alert",
        mode: 0,
        classname: "configlength",
        message: `Config is too long! ${config.length} characters`,
      });
    }

    let buffer_element: BufferElement = {
      descr: {
        brc_parameters: {
          DX: dx,
          DY: dy,
        },
        class_name: InstructionClassName.CONFIG,
        class_instr: InstructionClass.EXECUTE,
        class_parameters: {
          VERSIONMAJOR: grid.properties.VERSION.MAJOR,
          VERSIONMINOR: grid.properties.VERSION.MINOR,
          VERSIONPATCH: grid.properties.VERSION.PATCH,
          PAGENUMBER: page,
          ELEMENTNUMBER: element,
          EVENTTYPE: event,
          ACTIONLENGTH: config.length,
          ACTIONSTRING: config,
        },
      },
      responseRequired: true,
      filter: {
        brc_parameters: {
          SX: dx,
          SY: dy,
        },
        class_name: InstructionClassName.CONFIG,
        class_instr: InstructionClass.ACKNOWLEDGE,
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  }

  changeActivePage(page: number): Promise<any> {
    let buffer_element: BufferElement = {
      descr: {
        brc_parameters: {
          DX: -127,
          DY: -127,
        },
        class_name: InstructionClassName.PAGEACTIVE,
        class_instr: InstructionClass.EXECUTE,
        class_parameters: {
          PAGENUMBER: page,
        },
      },
    };
    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  }

  fetchPageCountFromGrid({ brc }): Promise<any> {
    let buffer_element = {
      descr: {
        brc_parameters: {
          DX: brc.dx,
          DY: brc.dy,
          ROT: brc.rot,
        },
        class_name: InstructionClassName.PAGECOUNT,
        class_instr: InstructionClass.FETCH,
        class_parameters: {},
      },
      responseRequired: true,
      filter: {
        class_name: InstructionClassName.PAGECOUNT,
        class_instr: InstructionClass.REPORT,
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  }

  sendPageStoreToGrid(): Promise<any> {
    let buffer_element: BufferElement = {
      descr: {
        brc_parameters: {
          DX: -127,
          DY: -127,
        },
        class_name: InstructionClassName.PAGESTORE,
        class_instr: InstructionClass.EXECUTE,
        class_parameters: {},
      },
      //responseTimeout: 8000,
      responseRequired: true,
      filter: {
        class_name: InstructionClassName.PAGESTORE,
        class_instr: InstructionClass.ACKNOWLEDGE,
        class_parameters: {
          LASTHEADER: null,
        },
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  }

  sendNVMEraseToGrid(): Promise<any> {
    if (get(writeBuffer).length > 0) {
      return Promise.reject({
        type: "fail",
        mode: 0,
        classname: "engine-disabled",
        message: `Engine is disabled, erasing NVM memory failed!`,
      });
    }

    let buffer_element: BufferElement = {
      responseTimeout: 8000,
      descr: {
        brc_parameters: {
          DX: -127,
          DY: -127,
        },
        class_name: InstructionClassName.NVMERASE,
        class_instr: InstructionClass.EXECUTE,
        class_parameters: {},
      },
      responseRequired: true,
      filter: {
        class_name: InstructionClassName.NVMERASE,
        class_instr: InstructionClass.ACKNOWLEDGE,
        class_parameters: {
          LASTHEADER: null,
        },
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  }

  sendNVMDefragToGrid(): Promise<any> {
    if (get(writeBuffer).length > 0) {
      return Promise.reject("NVM defrag failed");
    }

    let buffer_element: BufferElement = {
      descr: {
        brc_parameters: {
          DX: -127,
          DY: -127,
        },
        class_name: InstructionClassName.NVMDEFRAG,
        class_instr: InstructionClass.EXECUTE,
        class_parameters: {},
      },
      responseRequired: true,
      filter: {
        class_name: InstructionClassName.NVMDEFRAG,
        class_instr: InstructionClass.ACKNOWLEDGE,
        class_parameters: {
          LASTHEADER: null,
        },
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  }

  sendPageDiscardToGrid(): Promise<any> {
    let buffer_element: BufferElement = {
      responseTimeout: 3000,
      descr: {
        brc_parameters: {
          DX: -127,
          DY: -127,
        },
        class_name: InstructionClassName.PAGEDISCARD,
        class_instr: InstructionClass.EXECUTE,
        class_parameters: {},
      },
      responseRequired: true,
      filter: {
        PAGEDISCARD_ACKNOWLEDGE: {
          LASTHEADER: null,
        },
        class_name: InstructionClassName.PAGEDISCARD,
        class_instr: InstructionClass.ACKNOWLEDGE,
        class_parameters: {
          LASTHEADER: null,
        },
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  }

  sendPageClearToGrid(): Promise<any> {
    let buffer_element: BufferElement = {
      responseTimeout: 3000,
      descr: {
        brc_parameters: {
          DX: -127,
          DY: -127,
        },
        class_name: InstructionClassName.PAGECLEAR,
        class_instr: InstructionClass.EXECUTE,
        class_parameters: {},
      },
      responseRequired: true,
      filter: {
        class_name: InstructionClassName.PAGECLEAR,
        class_instr: InstructionClass.ACKNOWLEDGE,
        class_parameters: {
          LASTHEADER: null,
        },
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  }
}

export const instructions = new GridInstructions();