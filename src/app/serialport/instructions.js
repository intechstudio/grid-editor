import { serialComm } from './serialport.store.js';

import grid from '../protocol/grid-protocol.js';

import { pParser } from '../protocol/_utils.js';

const instructions = {

  fetchConfigFromGrid: ({device, inputStore}) => {
    const cfg = grid.translate.encode(
      { 
        dx: device.dx, 
        dy: device.dy,
        rot: device.rot
      },
      "LOCAL",
      "CONFIG",
      "FETCH",
      [
        { VERSIONMAJOR: pParser(grid.properties.VERSION.MAJOR) },
        { VERSIONMINOR: pParser(grid.properties.VERSION.MINOR) },
        { VERSIONPATCH: pParser(grid.properties.VERSION.PATCH) },
        { PAGENUMBER: pParser(inputStore.event.pagenumber)}, 
        { ELEMENTNUMBER: pParser(inputStore.event.elementnumber)}, 
        { EVENTTYPE: pParser(inputStore.event.eventtype)}, 
        { ACTIONLENGTH: pParser(0)},
      ],
    );

    
    serialComm.write(cfg);

    return 1;
  },

  sendConfigToGrid: ({lua, li}) => {

    const {event, brc} = li;


    const parameters = [
      { VERSIONMAJOR: pParser(grid.properties.VERSION.MINOR) },
      { VERSIONMINOR: pParser(grid.properties.VERSION.MINOR) },
      { VERSIONPATCH: pParser(grid.properties.VERSION.PATCH) },
      { PAGENUMBER: pParser(event.pagenumber) },
      { ELEMENTNUMBER: pParser(event.elementnumber) },
      { EVENTTYPE: pParser(event.eventtype) },
      { ACTIONLENGTH: pParser(`<?lua ${lua.trim()} ?>`.length)},
      { ACTIONSTRING: `<?lua ${lua.trim()} ?>`}
    ]

    const cfg = grid.translate.encode(brc, 'GLOBAL', 'CONFIG', 'EXECUTE', parameters)

    console.log(String.fromCharCode.apply(String, cfg));


    serialComm.write(cfg);

    return 1;
  },

  changeActivePage: ({li}) => {

    const {event, brc} = li;

    const parameters = [
      { PAGENUMBER: pParser(event.pagenumber) },
    ]

    const cfg = grid.translate.encode(brc, 'GLOBAL', 'PAGEACTIVE', 'EXECUTE', parameters)

    serialComm.write(cfg);

    return 1;
  },

  fetchPageCountFromGrid: ({controller}) => {

    const cfg = grid.translate.encode(
      {dx: controller.dx, dy: controller.dy, rot: controller.rot},
      "GLOBAL",
      "PAGECOUNT",
      "FETCH",
      ""
    );
    
    serialComm.write(cfg);

    return 1;
  }

}

export default instructions;