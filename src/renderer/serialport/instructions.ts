import { get } from "svelte/store";
import { appSettings } from "../runtime/app-helper.store.js";

import { grid } from "../protocol/grid-protocol";

import {
  writeBuffer,
  BufferElement,
  InstructionClass,
  InstructionClassName,
} from "../runtime/engine.store.ts";
import { logger } from "../runtime/runtime.store.js";
import { v4 as uuidv4 } from "uuid";

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

export class GridInstructions implements Instructions {
  sendEditorHeartbeat_immediate(type: number): Promise<any> {
    let buffer_element: BufferElement = {
      id: uuidv4(),
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
      sendImmediate: true,
    };

    return writeBuffer.add_last(buffer_element);
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
      id: uuidv4(),
      descr: {
        brc_parameters: {
          DX: dx,
          DY: dy,
        },
        class_name: InstructionClassName.CONFIG,
        class_instr: InstructionClass.FETCH,
        class_parameters: {
          VERSIONMAJOR: grid.getProperty("VERSION").MAJOR,
          VERSIONMINOR: grid.getProperty("VERSION").MINOR,
          VERSIONPATCH: grid.getProperty("VERSION").PATCH,
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

    const promise = writeBuffer.add_last(buffer_element);
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
    if (config.length >= grid.getProperty("CONFIG_LENGTH")) {
      logger.set({
        type: "alert",
        mode: 0,
        classname: "configlength",
        message: `Config is too long! ${config.length} characters`,
      });
    }

    let buffer_element: BufferElement = {
      id: uuidv4(),
      descr: {
        brc_parameters: {
          DX: dx,
          DY: dy,
        },
        class_name: InstructionClassName.CONFIG,
        class_instr: InstructionClass.EXECUTE,
        class_parameters: {
          VERSIONMAJOR: grid.getProperty("VERSION").MAJOR,
          VERSIONMINOR: grid.getProperty("VERSION").MINOR,
          VERSIONPATCH: grid.getProperty("VERSION").PATCH,
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

    const promise = writeBuffer.add_last(buffer_element);
    return promise;
  }

  changeActivePage(page: number): Promise<any> {
    let buffer_element: BufferElement = {
      id: uuidv4(),
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
    const promise = writeBuffer.add_last(buffer_element);
    return promise;
  }

  fetchPageCountFromGrid({ brc }): Promise<any> {
    let buffer_element = {
      id: uuidv4(),
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

    const promise = writeBuffer.add_last(buffer_element);
    return promise;
  }

  sendPageStoreToGrid(): Promise<any> {
    let buffer_element: BufferElement = {
      id: uuidv4(),
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

    const promise = writeBuffer.add_last(buffer_element);
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
      id: uuidv4(),
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

    const promise = writeBuffer.add_last(buffer_element);
    return promise;
  }

  sendNVMDefragToGrid(): Promise<any> {
    if (get(writeBuffer).length > 0) {
      return Promise.reject("NVM defrag failed");
    }

    let buffer_element: BufferElement = {
      id: uuidv4(),
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

    const promise = writeBuffer.add_last(buffer_element);
    return promise;
  }

  sendPageDiscardToGrid(): Promise<any> {
    let buffer_element: BufferElement = {
      id: uuidv4(),
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

    const promise = writeBuffer.add_last(buffer_element);
    return promise;
  }

  sendPageClearToGrid(): Promise<any> {
    let buffer_element: BufferElement = {
      id: uuidv4(),
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

    const promise = writeBuffer.add_last(buffer_element);
    return promise;
  }
}

export const instructions = new GridInstructions();
