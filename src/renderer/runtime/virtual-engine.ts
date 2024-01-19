import { get, writable } from "svelte/store";
import grid from "../protocol/grid-protocol";
import {
  InstructionClass,
  InstructionClassName,
  BufferElement,
} from "../serialport/instructions";

const GRID_ACTIONSTRING_INIT_POT: string = `<?lua --[[@l]] local num,val,red,gre,blu=self:ind(),self:pva(),glr(),glg(),glb()--[[@glc]] glc(num,1,red,gre,blu)--[[@glp]] glp(num,1,val) ?>`;
const GRID_ACTIONSTRING_INIT_BUT: string = `<?lua --[[@l]] local num,val,red,gre,blu=self:ind(),self:bva(),glr(),glg(),glb()--[[@glc]] glc(num,1,red,gre,blu)--[[@glp]] glp(num,1,val) ?>`;
const GRID_ACTIONSTRING_MIDIRX: string = `<?lua --[[@l]] local ch,cmd,param1,param2=midi.ch,midi.cmd,midi.p1,midi.p2 ?>`;
const GRID_ACTIONSTRING_TIMER: string = `<?lua --[[@cb]] print('tick') ?>`;
const GRID_ACTIONSTRING_INIT_ENC: string = `<?lua --[[@l]] local num,bval,eval,red,gre,blu=self:ind(),self:bva(),self:eva(),glr(),glg(),glb()--[[@glc]] glc(num,1,red,gre,blu)--[[@glc]] glc(num,2,red,gre,blu)--[[@glp]] glp(num,1,bval)--[[@glp]] glp(num,2,eval) ?>`;
const GRID_ACTIONSTRING_AC: string = `<?lua --[[@l]] local num,val,ch,cc=self:ind(),self:pva(),(gmy()*4+gpc())%16,(32+gmx()*16+self:ind())%128--[[@gms]] gms(ch,176,cc,val)--[[@glp]] glp(num,1,val) ?>`;
const GRID_ACTIONSTRING_BC: string = `<?lua --[[@l]] local num,val,ch,note=self:ind(),self:bva(),(gmy()*4+gpc())%16,(32+gmx()*16+self:ind())%128--[[@gms]] gms(ch,144,note,val)--[[@glp]] glp(num,1,val) ?>`;
const GRID_ACTIONSTRING_EC: string = `<?lua --[[@l]] local num,val,ch,cc=self:ind(),self:eva(),(gmy()*4+gpc())%16,(32+gmx()*16+self:ind())%128--[[@gms]] gms(ch,176,cc,val)--[[@glp]] glp(num,2,val) ?>`;
const GRID_ACTIONSTRING_PAGE_INIT: string = `<?lua --[[@cb]] --[[page init]] ?>`;
const GRID_ACTIONSTRING_MAPMODE_CHANGE: string = `<?lua --[[@cb]] gpl(gpn()) ?>`;

export enum VirtualModuleTypes {
  BU16 = "BU16",
  EF44 = "EF44",
  EN16 = "EN16",
  PBF4 = "PBF4",
  PO16 = "PO16",
  TEK2 = "TEK2",
}

export enum VirtualEventTypes {
  INIT = "init",
  POTMETER = "potmeter",
  ENCODER = "encoder",
  BUTTON = "button",
  MAP = "map",
  MIDIRX = "midirx",
  TIMER = "timer",
}

export enum VirtualElementTypes {
  SYSTEM = "system",
  BUTTON = "button",
  POTENTIOMETER = "potentiometer",
  ENCODER = "encoder",
  FADER = "fader",
}

export const VirtualModuleHWCFG = {
  BU16: { hwcfg: 129, type: VirtualModuleTypes.BU16 }, //RevD
  EF44: { hwcfg: 33, type: VirtualModuleTypes.EF44 }, //RevD
  EN16: { hwcfg: 193, type: VirtualModuleTypes.EN16 }, //RevD
  PBF4: { hwcfg: 65, type: VirtualModuleTypes.PBF4 }, //RevD
  PO16: { hwcfg: 1, type: VirtualModuleTypes.PO16 }, //RevD
  TEK2: { hwcfg: 17, type: VirtualModuleTypes.TEK2 }, //RevA
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
    console.log("Executing", class_name);
    switch (class_name) {
      case InstructionClassName.CONFIG: {
        virtual_modules.update((s) => {
          const device = s.find((e) => e.dx == dx && e.dy == dy);
          const events = device?.pages[page].elements[element].events;
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
      case InstructionClassName.PAGECLEAR:
      case InstructionClassName.PAGEDISCARD: {
        virtual_modules.update((s) => {
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
    const device = get(virtual_modules).find((e) => e.dx === dx && e.dy === dy);
    console.log("answering", class_name);
    switch (class_name) {
      case InstructionClassName.CONFIG: {
        const events = device?.pages[page].elements[element].events;
        const config = events.find((e: any) => e.value == event).config;
        console.log(events, config);
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
  public type: VirtualModuleTypes;
  public pages: any;

  private createControlElement(type: VirtualElementTypes) {
    const events = grid.elementEvents[type];
    return {
      events: events.map((e) => {
        return {
          value: Number(e.value),
          config: this.getEventConfiguration(type, Number(e.value)),
        };
      }),
    };
  }

  private getEventConfiguration(type: VirtualElementTypes, event: number) {
    switch (event) {
      case 0: {
        // INIT for all types of control elements
        if (type === VirtualElementTypes.BUTTON) {
          return GRID_ACTIONSTRING_INIT_BUT;
        } else if (type === VirtualElementTypes.ENCODER) {
          return GRID_ACTIONSTRING_INIT_ENC;
        } else if (
          type === VirtualElementTypes.FADER ||
          type === VirtualElementTypes.POTENTIOMETER
        ) {
          return GRID_ACTIONSTRING_INIT_POT;
        } else if (type === VirtualElementTypes.SYSTEM) {
          return GRID_ACTIONSTRING_PAGE_INIT;
        } else throw "Unknown Virtual Element type";
      }
      case 1: //FADER and POTMETER
        return GRID_ACTIONSTRING_AC;
      case 2: //ENCODER
        return GRID_ACTIONSTRING_EC;
      case 3: //BUTTON
        return GRID_ACTIONSTRING_BC;
      case 4: //MAPMODE-UTILITY BUTTON
        return GRID_ACTIONSTRING_MAPMODE_CHANGE;
      case 5: //MIDI RX
        return GRID_ACTIONSTRING_MIDIRX;
      case 6: //TIMER
        return GRID_ACTIONSTRING_TIMER;
    }
  }

  private initConfiguration(type: VirtualModuleTypes) {
    const control_elements = grid.moduleElements[type].map((e: string) =>
      this.createControlElement(e as VirtualElementTypes)
    );
    this.pages = Array(4).fill({
      elements: control_elements,
    });
  }

  public resetDefaultConfiguration() {
    this.initConfiguration(this.type);
  }

  constructor(dx: number, dy: number, type: VirtualModuleTypes) {
    this.dx = dx;
    this.dy = dy;
    this.type = type;
    this.initConfiguration(type);
  }
}

export const virtual_modules = writable([] as VirtualModule[]);

export function createVirtualModule(
  dx: number,
  dy: number,
  type: VirtualModuleTypes
) {
  const device = new VirtualModule(dx, dy, type);
  virtual_modules.update((s) => [...s, device]);
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
