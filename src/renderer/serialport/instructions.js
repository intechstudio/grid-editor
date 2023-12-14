import { get } from "svelte/store";
import { appSettings } from "../runtime/app-helper.store";

import grid from "../protocol/grid-protocol.js";

import { writeBuffer } from "../runtime/engine.store.js";
import { logger, runtime } from "../runtime/runtime.store.js";

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
      failCb: function () {
        //console.log('config execute - fail')
      },
    };

    // Only add heatbeat into the write buffer if it is not in it already
    if (get(writeBuffer).length > 0) {
      if (get(writeBuffer)[0].descr.class_name !== "HEARTBEAT") {
        writeBuffer.add_first(buffer_element);
      } else {
      }
    } else {
      writeBuffer.add_first(buffer_element);
    }
  },

  fetchConfigFromGrid: (dx, dy, page, element, event) => {
    return new Promise((resolve, reject) => {
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
        failCb: (descr) => reject(descr),
        successCb: (descr) => resolve(descr),
      };
      writeBuffer.add_last(buffer_element);
    });
  },

  sendConfigToGrid: (dx, dy, page, element, event, actionstring) => {
    return new Promise((resolve, reject) => {
      if (actionstring.length >= grid.properties.CONFIG_LENGTH) {
        logger.set({
          type: "alert",
          mode: 0,
          classname: "configlength",
          message: `Config is too long! ${actionstring.length} characters`,
        });
        return;
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
        failCb: (descr) => reject(descr),
        successCb: (descr) => resolve(descr),
      };

      writeBuffer.add_last(buffer_element);
    });
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

      // no response required, so no fltr struct is defined
    };

    writeBuffer.add_last(buffer_element);

    return 1;
  },

  fetchPageCountFromGrid: ({ brc }) => {
    return new Promise((resolve, reject) => {
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
        failCb: (descr) => reject(descr),
        successCb: (descr) => resolve(descr),
      };

      writeBuffer.add_first(buffer_element);
    });
  },

  sendPageStoreToGrid: () => {
    return new Promise((resolve, reject) => {
      logger.set({
        type: "progress",
        mode: 0,
        classname: "pagestore",
        message: `Store configurations on page...`,
      });

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
        responseRequired: true,
        filter: {
          class_name: "PAGESTORE",
          class_instr: "ACKNOWLEDGE",
          class_parameters: {
            LASTHEADER: null,
          },
        },
        failCb: (descr) => reject(descr),
        successCb: (descr) => resolve(descr),
      };

      writeBuffer.add_last(buffer_element);
    });
  },

  sendNVMEraseToGrid: () => {
    return new Promise((resolve, reject) => {
      if (get(writeBuffer) > 0) {
        logger.set({
          type: "fail",
          mode: 0,
          classname: "engine-disabled",
          message: `Engine is disabled, erasing NVM memory failed!`,
        });
        return;
      }

      logger.set({
        type: "progress",
        mode: 0,
        classname: "nvmerase",
        message: `Erasing all modules...`,
      });

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
        failCb: (descr) => reject(descr),
        successCb: (descr) => resolve(descr),
      };

      writeBuffer.add_last(buffer_element);
    });
  },

  sendNVMDefragToGrid: () => {
    return new Promise((resolve, reject) => {
      if (get(writeBuffer) > 0) {
        logger.set({
          type: "fail",
          mode: 0,
          classname: "engine-disabled",
          message: `Engine is disabled, NVM Defragmentation failed!`,
        });
        return;
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
        failCb: (descr) => reject(descr),
        successCb: (descr) => resolve(descr),
      };

      writeBuffer.add_last(buffer_element);
    });
  },

  sendPageDiscardToGrid: () => {
    return new Promise((resolve, reject) => {
      logger.set({
        type: "progress",
        mode: 0,
        classname: "pagediscard",
        message: `Discarding configurations...`,
      });

      let buffer_element = {
        responseTimeout: 1000,
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
        failCb: (descr) => reject(descr),
        successCb: (descr) => resolve(descr),
      };

      writeBuffer.add_last(buffer_element);
    });
  },

  sendPageClearToGrid: () => {
    return new Promise((resolve, reject) => {
      logger.set({
        type: "progress",
        mode: 0,
        classname: "pageclear",
        message: `Clearing configurations from page...`,
      });

      let buffer_element = {
        responseTimeout: 2000,
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
        failCb: (descr) => reject(descr),
        successCb: (descr) => resolve(descr),
      };

      writeBuffer.add_first(buffer_element);
    });
  },
};

export default instructions;
