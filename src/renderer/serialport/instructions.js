import { get } from "svelte/store";
import { appSettings } from "../runtime/app-helper.store";

import grid from "../protocol/grid-protocol.js";

import { writeBuffer } from "../runtime/engine.store.ts";
import { logger } from "../runtime/runtime.store.js";

const instructions = {
  sendEditorHeartbeat_immediate: (type) => {
    let buffer_element = {
      descr: {
        brc_parameters: { DX: -127, DY: -127 }, // GLOBAL
        class_name: "HEARTBEAT",
        class_instr: "EXECUTE",
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
  },

  fetchConfigFromGrid: (dx, dy, page, element, event) => {
    //TODO: callback
    let buffer_element = {
      descr: {
        brc_parameters: {
          DX: dx,
          DY: dy,
        },
        class_name: "CONFIG",
        class_instr: "FETCH",
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
        class_instr: "REPORT",
        class_name: "CONFIG",
        class_parameters: {
          PAGENUMBER: page,
          ELEMENTNUMBER: element,
          EVENTTYPE: event,
        },
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  },

  sendConfigToGrid: (dx, dy, page, element, event, actionstring) => {
    //TODO: callback
    if (actionstring.length >= grid.properties.CONFIG_LENGTH) {
      logger.set({
        type: "alert",
        mode: 0,
        classname: "configlength",
        message: `Config is too long! ${actionstring.length} characters`,
      });
    }

    let buffer_element = {
      descr: {
        brc_parameters: {
          DX: dx,
          DY: dy,
        },
        class_name: "CONFIG",
        class_instr: "EXECUTE",
        class_parameters: {
          VERSIONMAJOR: grid.properties.VERSION.MAJOR,
          VERSIONMINOR: grid.properties.VERSION.MINOR,
          VERSIONPATCH: grid.properties.VERSION.PATCH,
          PAGENUMBER: page,
          ELEMENTNUMBER: element,
          EVENTTYPE: event,
          ACTIONLENGTH: actionstring.length,
          ACTIONSTRING: actionstring,
        },
      },
      responseRequired: true,
      filter: {
        brc_parameters: {
          SX: dx,
          SY: dy,
        },
        class_name: "CONFIG",
        class_instr: "ACKNOWLEDGE",
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  },

  changeActivePage: (pagenumber) => {
    let buffer_element = {
      descr: {
        brc_parameters: {
          DX: -127,
          DY: -127,
        },
        class_name: "PAGEACTIVE",
        class_instr: "EXECUTE",
        class_parameters: {
          PAGENUMBER: pagenumber,
        },
      },
    };
    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  },

  fetchPageCountFromGrid: ({ brc }) => {
    let buffer_element = {
      descr: {
        brc_parameters: {
          DX: brc.dx,
          DY: brc.dy,
          ROT: brc.rot,
        },
        class_name: "PAGECOUNT",
        class_instr: "FETCH",
        class_parameters: {},
      },
      responseRequired: true,
      filter: {
        class_name: "PAGECOUNT",
        class_instr: "REPORT",
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  },

  sendPageStoreToGrid: () => {
    let buffer_element = {
      descr: {
        brc_parameters: {
          DX: -127,
          DY: -127,
        },
        class_name: "PAGESTORE",
        class_instr: "EXECUTE",
        class_parameters: {},
      },
      //responseTimeout: 8000,
      responseRequired: true,
      filter: {
        class_name: "PAGESTORE",
        class_instr: "ACKNOWLEDGE",
        class_parameters: {
          LASTHEADER: null,
        },
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  },

  sendNVMEraseToGrid: () => {
    if (get(writeBuffer) > 0) {
      return Promise.reject({
        type: "fail",
        mode: 0,
        classname: "engine-disabled",
        message: `Engine is disabled, erasing NVM memory failed!`,
      });
    }

    let buffer_element = {
      responseTimeout: 8000,
      descr: {
        brc_parameters: {
          DX: -127,
          DY: -127,
        },
        class_name: "NVMERASE",
        class_instr: "EXECUTE",
        class_parameters: {},
      },
      responseRequired: true,
      filter: {
        class_name: "NVMERASE",
        class_instr: "ACKNOWLEDGE",
        class_parameters: {
          LASTHEADER: null,
        },
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  },

  sendNVMDefragToGrid: () => {
    if (get(writeBuffer) > 0) {
      return Promise.reject("NVM defrag failed");
    }

    let buffer_element = {
      descr: {
        brc_parameters: {
          DX: -127,
          DY: -127,
        },
        class_name: "NVMDEFRAG",
        class_instr: "EXECUTE",
        class_parameters: {},
      },
      responseRequired: true,
      filter: {
        class_name: "NVMDEFRAG",
        class_instr: "ACKNOWLEDGE",
        class_parameters: {
          LASTHEADER: null,
        },
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  },

  sendPageDiscardToGrid: () => {
    let buffer_element = {
      responseTimeout: 3000,
      descr: {
        brc_parameters: {
          DX: -127,
          DY: -127,
        },
        class_name: "PAGEDISCARD",
        class_instr: "EXECUTE",
        class_parameters: {},
      },
      responseRequired: true,
      filter: {
        PAGEDISCARD_ACKNOWLEDGE: {
          LASTHEADER: null,
        },
        class_name: "PAGEDISCARD",
        class_instr: "ACKNOWLEDGE",
        class_parameters: {
          LASTHEADER: null,
        },
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  },

  sendPageClearToGrid: () => {
    let buffer_element = {
      responseTimeout: 3000,
      descr: {
        brc_parameters: {
          DX: -127,
          DY: -127,
        },
        class_name: "PAGECLEAR",
        class_instr: "EXECUTE",
        class_parameters: {},
      },
      responseRequired: true,
      filter: {
        class_name: "PAGECLEAR",
        class_instr: "ACKNOWLEDGE",
        class_parameters: {
          LASTHEADER: null,
        },
      },
    };

    const promise = writeBuffer.executeLast(buffer_element);
    return promise;
  },
};

export default instructions;
