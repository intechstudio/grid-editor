import { get } from "svelte/store";
import { appSettings } from "../runtime/app-helper.store";

import { grid, GridScript } from "@intechstudio/grid-protocol";
import { parseEvaluateResponse, type LuaValue } from "./evaluate-parser";

import {
  type BufferElement,
  InstructionClass,
  InstructionClassName,
} from "../runtime/engine.store";
import { logger } from "../runtime/runtime.store";
import { v4 as uuidv4 } from "uuid";
import { type GridConnection } from "./serialport.js";
import { Grid } from "../lib/_utils.js";

export namespace GridInstruction {
  abstract class AbstractInstruction {
    public buffer_element: BufferElement;
    public simulate: boolean;

    constructor(simulate: boolean) {
      this.simulate = simulate;
    }

    public abstract executeOn(connection: GridConnection): Promise<any>;
  }

  export class SendHeartbeatImmediate extends AbstractInstruction {
    constructor(type: number, virtual: boolean = false) {
      super(virtual);
      this.buffer_element = {
        id: uuidv4(),
        virtual: virtual,
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
    }

    public executeOn(connection: GridConnection): Promise<any> {
      // Only add heatbeat into the write buffer if it is not in it already
      const buffer = get(connection.buffer);
      const isHeartbeatPresent = buffer.array.some(
        (e: any) => e.descr.class_name === "HEARTBEAT",
      );

      if (isHeartbeatPresent) {
        return Promise.reject();
      }

      return connection.buffer.add_last(this.buffer_element);
    }
  }

  export class FetchConfig extends AbstractInstruction {
    constructor(
      dx: number,
      dy: number,
      page: number,
      element: number,
      event: number,
      virtual: boolean = false,
    ) {
      super(virtual);
      this.buffer_element = {
        id: uuidv4(),
        virtual: virtual,
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
            LASTHEADER: null,
            PAGENUMBER: page,
            ELEMENTNUMBER: element,
            EVENTTYPE: event,
          },
        },
      };
    }
    public executeOn(connection: GridConnection): Promise<any> {
      return connection.buffer.add_last(this.buffer_element);
    }
  }

  export class SendConfig extends AbstractInstruction {
    constructor(
      dx: number,
      dy: number,
      page: number,
      element: number,
      event: number,
      config: string,
      virtual: boolean = false,
    ) {
      super(virtual);
      this.buffer_element = {
        id: uuidv4(),
        virtual: virtual,
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
        responseTimeout: 500,
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
    }

    public executeOn(connection: GridConnection): Promise<any> {
      const configLength =
        this.buffer_element.descr.class_parameters.ACTIONLENGTH;
      if (configLength >= Grid.Protocol.maxScriptLength) {
        logger.set({
          type: "alert",
          mode: 0,
          classname: "configlength",
          message: `Config is too long! ${configLength} characters`,
        });
        return Promise.reject();
      }

      return connection.buffer.add_last(this.buffer_element);
    }
  }

  export class SendConfigImmediate extends AbstractInstruction {
    constructor(
      dx: number,
      dy: number,
      script: string,
      virtual: boolean = false,
    ) {
      super(virtual);
      this.buffer_element = {
        id: uuidv4(),
        virtual: virtual,
        descr: {
          brc_parameters: {
            DX: dx,
            DY: dy,
          },
          class_name: InstructionClassName.IMMEDIATE,
          class_instr: InstructionClass.EXECUTE,
          class_parameters: {
            ACTIONLENGTH: script.length,
            ACTIONSTRING: script,
          },
        },
      };
    }

    public executeOn(connection: GridConnection): Promise<any> {
      const configLength =
        this.buffer_element.descr.class_parameters.ACTIONLENGTH;
      if (configLength >= Grid.Protocol.maxScriptLength) {
        //TODO: Reject handling logging
        logger.set({
          type: "alert",
          mode: 0,
          classname: "configlength",
          message: `Script is too long! ${configLength} characters`,
        });
        return Promise.reject();
      }

      return connection.buffer.add_last(this.buffer_element);
    }
  }

  export class ChangePage extends AbstractInstruction {
    constructor(page: number, virtual: boolean = false) {
      super(virtual);
      this.buffer_element = {
        id: uuidv4(),
        virtual: virtual,
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
    }
    public executeOn(connection: GridConnection): Promise<any> {
      return connection.buffer.add_last(this.buffer_element);
    }
  }

  export class FetchEventpreview extends AbstractInstruction {
    constructor(dx: number, dy: number, virtual: boolean = false) {
      super(virtual);
      this.buffer_element = {
        id: uuidv4(),
        virtual: virtual,
        descr: {
          brc_parameters: {
            DX: dx,
            DY: dy,
          },
          class_name: InstructionClassName.EVENTPREVIEW,
          class_instr: InstructionClass.FETCH,
          class_parameters: {},
        },
      };
    }
    public executeOn(connection: GridConnection): Promise<any> {
      return connection.buffer.add_last(this.buffer_element);
    }
  }
  export class FetchLedpreview extends AbstractInstruction {
    constructor(dx: number, dy: number, virtual: boolean = false) {
      super(virtual);
      this.buffer_element = {
        id: uuidv4(),
        virtual: virtual,
        descr: {
          brc_parameters: {
            DX: dx,
            DY: dy,
          },
          class_name: InstructionClassName.LEDPREVIEW,
          class_instr: InstructionClass.FETCH,
          class_parameters: {},
        },
      };
    }
    public executeOn(connection: GridConnection): Promise<any> {
      return connection.buffer.add_last(this.buffer_element);
    }
  }

  export class FetchNamepreview extends AbstractInstruction {
    constructor(dx: number, dy: number, virtual: boolean = false) {
      super(virtual);
      this.buffer_element = {
        id: uuidv4(),
        virtual: virtual,
        descr: {
          brc_parameters: {
            DX: dx,
            DY: dy,
          },
          class_name: InstructionClassName.NAMEPREVIEW,
          class_instr: InstructionClass.FETCH,
          class_parameters: {},
        },
      };
    }
    public executeOn(connection: GridConnection): Promise<any> {
      return connection.buffer.add_last(this.buffer_element);
    }
  }

  export class FetchPageCount extends AbstractInstruction {
    constructor({ brc }, virtual: boolean = false) {
      super(virtual);
      this.buffer_element = {
        id: uuidv4(),
        virtual: virtual,
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
    }
    public executeOn(connection: GridConnection): Promise<any> {
      return connection.buffer.add_last(this.buffer_element);
    }
  }

  export class StorePage extends AbstractInstruction {
    constructor(virtual: boolean = false) {
      super(virtual);
      this.buffer_element = {
        id: uuidv4(),
        virtual: virtual,
        descr: {
          brc_parameters: {
            DX: -127,
            DY: -127,
          },
          class_name: InstructionClassName.PAGESTORE,
          class_instr: InstructionClass.EXECUTE,
          class_parameters: {},
        },
        responseTimeout: 3000,
        responseRequired: true,
        filter: {
          class_name: InstructionClassName.PAGESTORE,
          class_instr: InstructionClass.ACKNOWLEDGE,
          class_parameters: {
            LASTHEADER: null,
          },
        },
      };
    }
    public executeOn(connection: GridConnection): Promise<any> {
      return connection.buffer.add_last(this.buffer_element);
    }
  }

  export class NVMErase extends AbstractInstruction {
    constructor(virtual: boolean = false) {
      super(virtual);
      this.buffer_element = {
        id: uuidv4(),
        virtual: virtual,
        responseTimeout: 3000,
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
    }

    public executeOn(connection: GridConnection): Promise<any> {
      if (get(connection.buffer).length > 0) {
        //TODO: Reject handling logging
        return Promise.reject({
          type: "fail",
          mode: 0,
          classname: "engine-disabled",
          message: `Engine is disabled, erasing NVM memory failed!`,
        });
      }

      return connection.buffer.add_last(this.buffer_element);
    }
  }

  export class DiscardPage extends AbstractInstruction {
    constructor(virtual: boolean = false) {
      super(virtual);
      this.buffer_element = {
        id: uuidv4(),
        virtual: virtual,
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
    }

    public executeOn(connection: GridConnection): Promise<any> {
      return connection.buffer.add_last(this.buffer_element);
    }
  }

  export class ClearPage extends AbstractInstruction {
    constructor(virtual: boolean = false) {
      super(virtual);
      this.buffer_element = {
        id: uuidv4(),
        virtual: virtual,
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
    }

    public executeOn(connection: GridConnection): Promise<any> {
      return connection.buffer.add_last(this.buffer_element);
    }
  }

  /**
   * Sends Lua code to the module for immediate evaluation and returns the
   * EVALUATE response values. Used by the filesystem layer (FileManager) and
   * any caller that needs to read back a Lua return value from hardware.
   */
  export class SendLuaImmediateAndEvaluate extends AbstractInstruction {
    private readonly dx: number;
    private readonly dy: number;
    private readonly code: string;
    private readonly compress: boolean;

    constructor(
      dx: number,
      dy: number,
      code: string,
      compress = true,
      virtual = false,
    ) {
      super(virtual);
      this.dx = dx;
      this.dy = dy;
      this.code = code;
      this.compress = compress;
    }

    public executeOn(connection: GridConnection): Promise<LuaValue[]> {
      const script = this.compress
        ? GridScript.compressScript(this.code)
        : this.code;
      const size = script.length.toString(16).padStart(4, "0");
      const classBody = `\x02086e0001` + `04` + size + script + `\x03`;
      const classArray: number[] = Array.from(classBody, (c) =>
        c.charCodeAt(0),
      );
      classArray.push(0x04);

      const dummyDescr = {
        brc_parameters: { DX: this.dx, DY: this.dy },
        class_name: InstructionClassName.IMMEDIATE,
        class_instr: InstructionClass.EXECUTE,
        class_parameters: { ACTIONLENGTH: 0, ACTIONSTRING: "" },
      };
      const encoded = grid.encode_packet(dummyDescr);
      if (!encoded) return Promise.reject(new Error("Packet encode failed"));

      const brcHeader: number[] = encoded.serial.slice(0, 23);
      const messageArray: number[] = [...brcHeader, ...classArray];

      const lenHex = messageArray.length.toString(16).padStart(4, "0");
      for (let i = 0; i < 4; i++) {
        messageArray[2 + i] = lenHex.charCodeAt(i);
      }

      const checksum = messageArray.reduce((a, b) => a ^ b);
      const checksumHex = checksum.toString(16).padStart(2, "0");
      messageArray.push(checksumHex.charCodeAt(0));
      messageArray.push(checksumHex.charCodeAt(1));
      messageArray.push(10);

      return connection.buffer
        .sendRawDataToGrid(new Uint8Array(messageArray), {
          dx: this.dx,
          dy: this.dy,
          responseRequired: true,
          filter: {
            class_name: "EVALUATE",
            brc_parameters: {},
            class_parameters: {},
          },
          responseTimeout: 5000,
        })
        .then(parseEvaluateResponse);
    }
  }
}
