import { get } from "svelte/store";
import { appSettings } from "../runtime/app-helper.store";

import grid from "../protocol/grid-protocol.js";

import { writeBuffer } from "../runtime/engine.store.js";
import { logger, unsaved_changes, runtime } from "../runtime/runtime.store.js";

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

  fetchConfigFromGrid: (dx, dy, page, element, event, callback) => {
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
      failCb: function () {
        //console.log('config fetch - fail')
      },
      successCb: function (descr) {
        const dx = descr.brc_parameters.SX;
        const dy = descr.brc_parameters.SY;
        const page = descr.class_parameters.PAGENUMBER;
        const element = descr.class_parameters.ELEMENTNUMBER;
        const event = descr.class_parameters.EVENTTYPE;
        const actionstring = descr.class_parameters.ACTIONSTRING;

        runtime.update_event_configuration(
          dx,
          dy,
          page,
          element,
          event,
          actionstring,
          "GRID_REPORT"
        );

        if (callback) {
          callback(descr);
        }
      },
    };

    // console.log("FETCH: ", buffer_element.descr.class_parameters.PAGENUMBER, buffer_element.descr.class_parameters.ELEMENTNUMBER, buffer_element.descr.class_parameters.EVENTTYPE );

    writeBuffer.add_last(buffer_element);

    return 1;
  },

  sendConfigToGrid: (dx, dy, page, element, event, actionstring, callback) => {
    if (actionstring.length >= grid.properties.CONFIG_LENGTH) {
      logger.set({
        type: "alert",
        mode: 0,
        classname: "configlength",
        message: `Config is too long! ${actionstring.length} characters`,
      });
      return;
    }

    const objIndex = get(unsaved_changes).findIndex(
      (e) => e.x == dx && e.y == dy
    );
    if (objIndex !== -1) {
      unsaved_changes.update((s) => {
        const updatedChanges = [...s];
        updatedChanges[objIndex].changes += 1;
        return updatedChanges;
      });
    } else {
      unsaved_changes.update((s) => [...s, { x: dx, y: dy, changes: 1 }]);
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
      failCb: function () {
        //console.log('config execute - fail')
      },
      successCb: callback,
    };

    writeBuffer.add_last(buffer_element);

    return 1;
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
      failCb: function () {
        //console.log('fetch page count - fail')
      },
      successCb: function () {
        //console.log('fetch page count - success')
      },
    };

    writeBuffer.add_first(buffer_element);

    return 1;
  },

  sendPageStoreToGrid: () => {
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
      failCb: function () {
        logger.set({
          type: "alert",
          mode: 0,
          classname: "pagestore",
          message: `Retry page store...`,
        });
        //console.log('page store execute - fail')
      },
      successCb: function () {
        unsaved_changes.set([]);
        logger.set({
          type: "success",
          mode: 0,
          classname: "pagestore",
          message: `Store complete!`,
        });
        //console.log('page store execute - success')
      },
    };

    writeBuffer.add_last(buffer_element);
  },

  sendNVMEraseToGrid: () => {
    if (get(engine) !== "ENABLED") {
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
      failCb: function () {
        logger.set({
          type: "alert",
          mode: 0,
          classname: "nvmerase",
          message: `Retry erase all modules...`,
        });
        //console.log('NVM erase execute - fail')
      },
      successCb: function () {
        unsaved_changes.set([]);
        runtime.erase();
        logger.set({
          type: "success",
          mode: 0,
          classname: "nvmerase",
          message: `Erase complete!`,
        });
        //console.log('NVM erase execute - success')
      },
    };

    writeBuffer.add_last(buffer_element);
  },

  sendNVMDefragToGrid: () => {
    if (get(engine) !== "ENABLED") {
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
      failCb: function () {
        console.log("NVM defrag execute - fail");
      },
      successCb: function () {
        console.log("NVM defrag execute - success");
        //logger.set({type: 'success', mode: 0, classname: 'nvmdefrag', message: `NVM defrag complete!`});
      },
    };

    writeBuffer.add_last(buffer_element);
  },

  sendPageDiscardToGrid: () => {
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
      failCb: function () {
        logger.set({
          type: "alert",
          mode: 0,
          classname: "pagediscard",
          message: `Retry configuration discard...`,
        });
        //console.log('page discard execute - fail')
      },
      successCb: function () {
        runtime.clear_page_configuration();
        logger.set({
          type: "success",
          mode: 0,
          classname: "pagediscard",
          message: `Discard complete!`,
        });
        //console.log('page discard execute - success');
      },
    };

    writeBuffer.add_last(buffer_element);
  },

  sendPageClearToGrid: () => {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "pageclear",
      message: `Clearing configurations from page...`,
    });

    let buffer_element = {
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
      failCb: function () {
        logger.set({
          type: "alert",
          mode: 0,
          classname: "pageclear",
          message: `Retry clear page...`,
        });
        //console.log('page clear execute - fail')
      },
      successCb: function () {
        runtime.clear_page_configuration();
        logger.set({
          type: "success",
          mode: 0,
          classname: "pageclear",
          message: `Page clear complete!`,
        });
        //console.log('page clear execute - success')
      },
    };

    writeBuffer.add_first(buffer_element);
  },
};

export default instructions;
