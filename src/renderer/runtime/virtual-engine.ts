import grid from "../protocol/grid-protocol";
import {
  InstructionClass,
  InstructionClassName,
  BufferElement,
} from "../serialport/instructions";

const GRID_ACTIONSTRING_INIT_POT: string = `<?lua --[[@l]] local                                                    
  num,val,red,gre,blu=self:ind(),self:pva(),glr(),glg(),glb()--[[@glc]]    
  glc(num,1,red,gre,blu)--[[@glp]] glp(num,1,val) ?>`;

const GRID_ACTIONSTRING_INIT_BUT: string = `<?lua --[[@l]] local                                                     
  num,val,red,gre,blu=self:ind(),self:bva(),glr(),glg(),glb()--[[@glc]]   
  glc(num,1,red,gre,blu)--[[@glp]] glp(num,1,val) ?>`;

const GRID_ACTIONSTRING_MIDIRX: string = `<?lua --[[@l]] local                                              
  ch,cmd,param1,param2=midi.ch,midi.cmd,midi.p1,midi.p2 ?>`;

const GRID_ACTIONSTRING_TIMER: string = `<?lua --[[@cb]] print('tick') ?>`;

const GRID_ACTIONSTRING_INIT_ENC: string = `<?lua --[[@l]] local                                                     
  num,bval,eval,red,gre,blu=self:ind(),self:bva(),self:eva(),glr(),glg(), 
  glb()--[[@glc]] glc(num,1,red,gre,blu)--[[@glc]]                         
  glc(num,2,red,gre,blu)--[[@glp]] glp(num,1,bval)--[[@glp]]            
  glp(num,2,eval) ?>`;

const GRID_ACTIONSTRING_AC: string = `<?lua --[[@l]] local                                                
  num,val,ch,cc=self:ind(),self:pva(),(gmy()*4+gpc())%16,(32+gmx()*16+self:
  ind())%128--[[@gms]] gms(ch,176,cc,val)--[[@glp]] glp(num,1,val) ?>`;

const GRID_ACTIONSTRING_BC: string = `<?lua --[[@l]] local                                                 
  num,val,ch,note=self:ind(),self:bva(),(gmy()*4+gpc())%16,(32+gmx()*16+   
  self:ind())%128--[[@gms]] gms(ch,144,note,val)--[[@glp]] glp(num,1,val) ?>`;

const GRID_ACTIONSTRING_EC: string = `<?lua --[[@l]] local                                                 
  num,val,ch,cc=self:ind(),self:eva(),(gmy()*4+gpc())%16,(32+gmx()*16+self:
  ind())%128--[[@gms]] gms(ch,176,cc,val)--[[@glp]] glp(num,2,val) ?>`;

const GRID_ACTIONSTRING_PAGE_INIT: string = `<?lua --[[@cb]] --[[page init]] ?>`;

const GRID_ACTIONSTRING_MAPMODE_CHANGE: string = `<?lua --[[@cb]] gpl(gpn()) ?>`;

enum VirtualModuleTypes {
  BU16 = "BU16",
  EF44 = "EF44",
  EN16 = "EN16",
  PBF4 = "PBF4",
  PO16 = "PO16",
}

enum VirtualEventTypes {
  INIT = "init",
  POTMETER = "potmeter",
  ENCODER = "encoder",
  BUTTON = "button",
  MAP = "map",
  MIDIRX = "midirx",
  TIMER = "timer",
}

enum VirtualElementTypes {
  SYSTEM = "system",
  BUTTON = "button",
  POTENTIOMETER = "potentiometer",
  ENCODER = "encoder",
  FADER = "fader",
}

const defaultConfigs = {
  [VirtualModuleTypes.BU16]: {
    [VirtualElementTypes.BUTTON]: {
      [VirtualEventTypes.INIT]: GRID_ACTIONSTRING_INIT_BUT,
      [VirtualEventTypes.BUTTON]: GRID_ACTIONSTRING_BC,
      [VirtualEventTypes.TIMER]: GRID_ACTIONSTRING_TIMER,
    },
    [VirtualElementTypes.SYSTEM]: {
      [VirtualEventTypes.INIT]: GRID_ACTIONSTRING_PAGE_INIT,
      [VirtualEventTypes.MAP]: GRID_ACTIONSTRING_MAPMODE_CHANGE,
      [VirtualEventTypes.MIDIRX]: GRID_ACTIONSTRING_MIDIRX,
      [VirtualEventTypes.TIMER]: GRID_ACTIONSTRING_TIMER,
    },
  },
};

export function simulateProcess(obj: BufferElement): Promise<any> {
  const class_name = obj.descr.class_name;
  const class_instr = obj.descr.class_instr;
  switch (class_instr) {
    case InstructionClass.FETCH: {
      return Promise.reject();
    }
    case InstructionClass.ACKNOWLEDGE: {
      return Promise.reject();
    }
    case InstructionClass.EXECUTE: {
      return Promise.reject();
    }
    case InstructionClass.REPORT: {
      return Promise.reject();
    }
  }
}
